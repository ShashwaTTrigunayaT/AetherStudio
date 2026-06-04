import { spawn } from 'child_process';
import { WebSocket } from 'ws';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger.js';

class DebugService {
  constructor() {
    this.sessions = new Map();
  }

  async startDebugSession({ workspaceId, code, language, breakpoints, fileName }) {
    this.stopDebugSession(workspaceId);
    const bps = breakpoints || [];
    const sessionId = uuidv4();
    const ext = language === 'typescript' ? 'ts' : 'js';
    const name = fileName || 'debug-' + Date.now() + '.' + ext;

    const tmpDir = path.join(os.tmpdir(), 'aether-debug', workspaceId);
    fs.mkdirSync(tmpDir, { recursive: true });
    const scriptPath = path.join(tmpDir, name);
    fs.writeFileSync(scriptPath, code, 'utf-8');

    const fileUrl = 'file://' + scriptPath.replace(/\\/g, '/');

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (session.child) session.child.kill('SIGKILL');
        reject(new Error('Debug session start timed out after 15s'));
      }, 15000);

      const session = {
        id: sessionId,
        workspaceId, scriptPath, fileUrl, code, language,
        breakpoints: [...bps],
        child: null, ws: null,
        cdpIdCounter: 1,
        pendingCommands: new Map(),
        paused: false,
        onPaused: new Set(), onResumed: new Set(),
        onOutput: new Set(), onError: new Set(), onExit: new Set(),
        cleanup: () => {
          clearTimeout(timeout);
          session.onPaused.clear();
          session.onResumed.clear();
          session.onOutput.clear();
          session.onError.clear();
          session.onExit.clear();
        },
      };

      const child = spawn('node', ['--inspect-brk=0', scriptPath], {
        cwd: tmpDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_OPTIONS: '' },
        windowsHide: true,
      });

      session.child = child;
      let stderrBuffer = '';

      child.stderr.on('data', (data) => {
        const text = data.toString();
        stderrBuffer += text;
        for (const cb of session.onOutput) cb({ type: 'stderr', data: text });

        const wsMatch = stderrBuffer.match(/ws:\/\/[^\s]+/);
        if (wsMatch && !session.ws) {
          const wsUrl = wsMatch[0];
          logger.info('[DebugService] CDP WebSocket URL: ' + wsUrl);
          this._connectCDP(session, wsUrl, timeout).then(() => resolve({ sessionId })).catch(reject);
        }
      });

      child.stdout.on('data', (data) => {
        for (const cb of session.onOutput) cb({ type: 'stdout', data: data.toString() });
      });

      child.on('exit', (code, signal) => {
        logger.info('[DebugService] Process exited (code: ' + code + ', signal: ' + signal + ')');
        for (const cb of session.onExit) cb({ code, signal });
        this._cleanupSession(session);
        if (!session.ws) {
          clearTimeout(timeout);
          reject(new Error('Process exited before CDP connection: code ' + code));
        }
      });

      child.on('error', (err) => {
        logger.error('[DebugService] Process error: ' + err.message);
        for (const cb of session.onError) cb(err.message);
        clearTimeout(timeout);
        reject(err);
      });

      this.sessions.set(workspaceId, session);
    });
  }

  _connectCDP(session, wsUrl, timeout) {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(wsUrl);
        ws.on('open', () => {
          session.ws = ws;
          logger.info('[DebugService] CDP connected for ' + session.workspaceId);
          this._initCDP(session, timeout).then(resolve).catch(reject);
        });
        ws.on('message', (raw) => {
          const msg = JSON.parse(raw.toString());
          if (!msg.id) {
            this._handleCDPEvent(session, msg);
            return;
          }
          const pending = session.pendingCommands.get(msg.id);
          if (pending) {
            session.pendingCommands.delete(msg.id);
            pending.resolve(msg);
          }
        });
        ws.on('error', (err) => {
          logger.error('[DebugService] CDP WS error: ' + err.message);
          for (const cb of session.onError) cb(err.message);
        });
        ws.on('close', () => { session.ws = null; });
      } catch (err) {
        clearTimeout(timeout);
        reject(err);
      }
    });
  }

  async _initCDP(session, timeout) {
    try {
      await this._sendCommand(session, 'Debugger.enable');
      for (const bp of session.breakpoints) {
        await this._setBreakpointCDP(session, bp.line);
      }
      await this._sendCommand(session, 'Runtime.runIfWaitingForDebugger');
      clearTimeout(timeout);
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }

  _sendCommand(session, method, params) {
    params = params || {};
    return new Promise((resolve, reject) => {
      if (!session.ws) { reject(new Error('CDP WebSocket not connected')); return; }
      const id = session.cdpIdCounter++;
      const to = setTimeout(() => {
        session.pendingCommands.delete(id);
        reject(new Error('CDP command ' + method + ' timed out'));
      }, 10000);
      session.pendingCommands.set(id, {
        resolve: (result) => {
          clearTimeout(to);
          if (result.error) reject(new Error(result.error.message));
          else resolve(result.result);
        },
      });
      session.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async _setBreakpointCDP(session, line) {
    try {
      return await this._sendCommand(session, 'Debugger.setBreakpointByUrl', {
        lineNumber: line - 1,
        url: session.fileUrl,
      });
    } catch (err) {
      logger.warn('[DebugService] Failed breakpoint at line ' + line + ': ' + err.message);
      return null;
    }
  }

  _handleCDPEvent(session, msg) {
    switch (msg.method) {
      case 'Debugger.paused': {
        session.paused = true;
        const callFrames = this._parseCallFrames(msg.params.callFrames || []);
        const hb = msg.params.hitBreakpoints || [];
        for (const cb of session.onPaused) {
          cb({ callFrames, hitBreakpoints: hb, reason: msg.params.reason || 'other' });
        }
        break;
      }
      case 'Debugger.resumed': {
        session.paused = false;
        for (const cb of session.onResumed) cb();
        break;
      }
      case 'Runtime.exceptionThrown': {
        const exc = msg.params && msg.params.exceptionDetails;
        if (exc) {
          for (const cb of session.onError) cb(exc.text || (exc.exception && exc.exception.description) || 'Unknown error');
        }
        break;
      }
      case 'Runtime.consoleAPICalled': {
        const text = (msg.params && msg.params.args || []).map(function(a) { return a.value || a.description || ''; }).join(' ');
        for (const cb of session.onOutput) cb({ type: 'console', data: text + '\n' });
        break;
      }
    }
  }

  _parseCallFrames(callFrames) {
    return (callFrames || []).map(function(frame, index) {
      return {
        id: frame.callFrameId,
        index: index,
        functionName: frame.functionName || '(anonymous)',
        url: frame.url,
        lineNumber: (frame.location ? frame.location.lineNumber : 0) + 1,
        columnNumber: (frame.location ? frame.location.columnNumber : 0) + 1,
        scopeChain: (frame.scopeChain || []).map(function(s) {
          return { type: s.type, objectId: s.object ? s.object.objectId : null };
        }),
      };
    });
  }

  stopDebugSession(workspaceId) {
    const session = this.sessions.get(workspaceId);
    if (!session) return false;
    if (session.child) { try { session.child.kill('SIGKILL'); } catch (e) {} }
    this._cleanupSession(session);
    return true;
  }

  async stepOver(workspaceId) {
    const s = this.sessions.get(workspaceId);
    if (!s || !s.paused) throw new Error('Not paused');
    return this._sendCommand(s, 'Debugger.stepOver');
  }

  async stepInto(workspaceId) {
    const s = this.sessions.get(workspaceId);
    if (!s || !s.paused) throw new Error('Not paused');
    return this._sendCommand(s, 'Debugger.stepInto');
  }

  async stepOut(workspaceId) {
    const s = this.sessions.get(workspaceId);
    if (!s || !s.paused) throw new Error('Not paused');
    return this._sendCommand(s, 'Debugger.stepOut');
  }

  async continueExecution(workspaceId) {
    const s = this.sessions.get(workspaceId);
    if (!s || !s.paused) throw new Error('Not paused');
    return this._sendCommand(s, 'Debugger.resume');
  }

  async addBreakpoint(workspaceId, line) {
    const s = this.sessions.get(workspaceId);
    if (!s) return;
    if (!s.breakpoints.find(function(b) { return b.line === line; })) {
      s.breakpoints.push({ line: line });
    }
    if (s.ws) return this._setBreakpointCDP(s, line);
  }

  async removeBreakpoint(workspaceId, line) {
    const s = this.sessions.get(workspaceId);
    if (!s) return;
    s.breakpoints = s.breakpoints.filter(function(b) { return b.line !== line; });
  }

  getDebugState(workspaceId) {
    const s = this.sessions.get(workspaceId);
    if (!s) return { active: false };
    return { active: true, sessionId: s.id, paused: s.paused, breakpoints: s.breakpoints };
  }

  onPaused(workspaceId, cb) {
    const s = this.sessions.get(workspaceId);
    if (!s) return function() {};
    s.onPaused.add(cb);
    return function() { s.onPaused.delete(cb); };
  }

  onResumed(workspaceId, cb) {
    const s = this.sessions.get(workspaceId);
    if (!s) return function() {};
    s.onResumed.add(cb);
    return function() { s.onResumed.delete(cb); };
  }

  onOutput(workspaceId, cb) {
    const s = this.sessions.get(workspaceId);
    if (!s) return function() {};
    s.onOutput.add(cb);
    return function() { s.onOutput.delete(cb); };
  }

  onError(workspaceId, cb) {
    const s = this.sessions.get(workspaceId);
    if (!s) return function() {};
    s.onError.add(cb);
    return function() { s.onError.delete(cb); };
  }

  onExit(workspaceId, cb) {
    const s = this.sessions.get(workspaceId);
    if (!s) return function() {};
    s.onExit.add(cb);
    return function() { s.onExit.delete(cb); };
  }

  _cleanupSession(session) {
    if (session.ws) { try { session.ws.close(); } catch (e) {} session.ws = null; }
    session.cleanup();
    try { if (session.scriptPath && fs.existsSync(session.scriptPath)) fs.unlinkSync(session.scriptPath); } catch (e) {}
    try {
      const d = path.join(os.tmpdir(), 'aether-debug', session.workspaceId);
      if (fs.existsSync(d)) {
        const files = fs.readdirSync(d);
        if (files.length === 0) fs.rmdirSync(d);
      }
    } catch (e) {}
    this.sessions.delete(session.workspaceId);
  }

  cleanup() {
    for (const wid of this.sessions.keys()) this.stopDebugSession(wid);
  }
}

const debugService = new DebugService();
export default debugService;
