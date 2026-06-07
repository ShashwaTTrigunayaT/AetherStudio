import { spawn } from 'child_process';
import { WebSocket } from 'ws';
import net from 'net';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger.js';

// ── Debounced reconnect guard ──
const RECENTLY_STOPPED = new Set();

class DebugService {
  constructor() {
    this.sessions = new Map();
  }

  _getLanguageConfig(language) {
    const configs = {
      javascript: { ext: 'js', runCmd: 'node', runArgs: [] },
      typescript:  { ext: 'ts', runCmd: 'npx', runArgs: ['ts-node'] },
      python:      { ext: 'py', runCmd: 'python3', runArgs: [] },
      ruby:        { ext: 'rb', runCmd: 'ruby', runArgs: [] },
      php:         { ext: 'php', runCmd: 'php', runArgs: [] },
      perl:        { ext: 'pl', runCmd: 'perl', runArgs: [] },
      r:           { ext: 'r', runCmd: 'Rscript', runArgs: [] },
      bash:        { ext: 'sh', runCmd: 'bash', runArgs: [] },
      go:          { ext: 'go', runCmd: 'go', runArgs: ['run'] },
      rust:        { ext: 'rs', runCmd: 'cargo', runArgs: ['run'] },
      cpp:         { ext: 'cpp', compileCmd: 'g++', compileArgs: ['-g', '-o'], runCmd: '', runArgs: [] },
      c:           { ext: 'c', compileCmd: 'gcc', compileArgs: ['-g', '-o'], runCmd: '', runArgs: [] },
      java:        { ext: 'java', compileCmd: 'javac', compileArgs: [], runCmd: 'java', runArgs: [] },
      csharp:      { ext: 'cs', runCmd: 'dotnet', runArgs: ['run'] },
      swift:       { ext: 'swift', compileCmd: 'swiftc', compileArgs: ['-g', '-o'], runCmd: '', runArgs: [] },
      kotlin:      { ext: 'kt', compileCmd: 'kotlinc', compileArgs: ['-include-runtime', '-d'], runCmd: 'java', runArgs: ['-jar'] },
    };
    return configs[language] || null;
  }

  async startDebugSession({ workspaceId, code, language, breakpoints, fileName }) {
    this.stopDebugSession(workspaceId);

    const langConfig = this._getLanguageConfig(language);
    if (!langConfig) {
      throw new Error(`Debugging for "${language}" is not supported.`);
    }

    const bps = breakpoints || [];
    const sessionId = uuidv4();
    const ext = langConfig.ext;
    const name = fileName || `debug-${Date.now()}.${ext}`;

    const tmpDir = path.join(os.tmpdir(), 'aether-debug', workspaceId);
    fs.mkdirSync(tmpDir, { recursive: true });
    const scriptPath = path.join(tmpDir, name);
    fs.writeFileSync(scriptPath, code, 'utf-8');

    // Build common session state
    const session = {
      id: sessionId,
      workspaceId, scriptPath, code, language,
      breakpoints: bps,
      child: null,
      debuggerProcess: null, // GDB process
      tcpSocket: null,       // debugpy TCP connection
      ws: null,              // CDP WebSocket
      paused: false,
      isSimpleDebug: false,
      seq: 0,
      pendingReqs: new Map(),
      outputBuffer: '',
      miToken: 0,
      miPending: new Map(),
      onPaused: new Set(), onResumed: new Set(),
      onOutput: new Set(), onError: new Set(), onExit: new Set(),
      cleanup: () => {
        session.onPaused.clear();
        session.onResumed.clear();
        session.onOutput.clear();
        session.onError.clear();
        session.onExit.clear();
      },
    };

    // ── Route to the right debugger ──
    if (language === 'javascript' || language === 'typescript') {
      await this._startCDPDebug(session, tmpDir, scriptPath, language);
    } else {
      // Register session FIRST so callbacks can attach from the socket handler
      this.sessions.set(workspaceId, session);

      try {
        if (language === 'python') {
          await this._startPythonDebug(session, tmpDir, scriptPath);
        } else if (language === 'cpp' || language === 'c') {
          await this._startCPPDebug(session, langConfig, tmpDir, scriptPath, name);
        } else {
          // Fallback: simple run mode
          session.isSimpleDebug = true;
          await this._startSimpleDebug(session, langConfig, tmpDir, scriptPath, name);
        }
      } catch (e) {
        // Clean up on failure — callbacks may not be attached yet
        // so emit errors directly through the socket after return
        this.sessions.delete(workspaceId);
        throw e;
      }

      return { sessionId };
    }

    this.sessions.set(workspaceId, session);
    return { sessionId };
  }

  // ═══════════════════════════════════════════════════════════
  //  NODE.JS / CDP DEBUGGER
  // ═══════════════════════════════════════════════════════════

  async _startCDPDebug(session, tmpDir, scriptPath, language) {
    const ext = language === 'typescript' ? 'ts' : 'js';
    const fileUrl = 'file://' + scriptPath.replace(/\\/g, '/');

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (session.child) session.child.kill('SIGKILL');
        reject(new Error('CDP debug session timed out after 15s'));
      }, 15000);

      const child = spawn('node', ['--inspect-brk=0', scriptPath], {
        cwd: tmpDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_OPTIONS: '' },
        windowsHide: true,
      });
      session.child = child;
      session.fileUrl = fileUrl;
      let stderrBuf = '';

      child.stderr.on('data', (d) => {
        const text = d.toString();
        stderrBuf += text;
        for (const cb of session.onOutput) cb({ type: 'stderr', data: text });
        const m = stderrBuf.match(/ws:\/\/[^\s]+/);
        if (m && !session.ws) {
          this._connectCDP(session, m[0], timeout).then(resolve).catch(reject);
        }
      });
      child.stdout.on('data', (d) => {
        for (const cb of session.onOutput) cb({ type: 'stdout', data: d.toString() });
      });
      child.on('exit', (code, signal) => {
        for (const cb of session.onExit) cb({ code, signal });
        this._cleanup(session);
        if (!session.ws) { clearTimeout(timeout); reject(new Error('Process exited before CDP: code ' + code)); }
      });
      child.on('error', (err) => {
        for (const cb of session.onError) cb(err.message);
        clearTimeout(timeout); reject(err);
      });
    });
  }

  _connectCDP(session, wsUrl, timeout) {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(wsUrl);
        ws.on('open', () => {
          session.ws = ws;
          this._initCDP(session, timeout).then(resolve).catch(reject);
        });
        ws.on('message', (raw) => {
          const msg = JSON.parse(raw.toString());
          if (!msg.id) { this._handleCDPEvent(session, msg); return; }
          const p = session.pendingReqs.get(msg.id);
          if (p) { session.pendingReqs.delete(msg.id); p.resolve(msg); }
        });
        ws.on('error', (err) => { for (const cb of session.onError) cb(err.message); });
        ws.on('close', () => { session.ws = null; });
      } catch (err) { clearTimeout(timeout); reject(err); }
    });
  }

  async _initCDP(session, timeout) {
    try {
      await this._cdpSend(session, 'Debugger.enable');
      for (const bp of session.breakpoints) {
        await this._cdpSetBP(session, bp.line, bp.condition);
      }
      await this._cdpSend(session, 'Runtime.runIfWaitingForDebugger');
      clearTimeout(timeout);
    } catch (err) { clearTimeout(timeout); throw err; }
  }

  _cdpSend(session, method, params) {
    return new Promise((resolve, reject) => {
      if (!session.ws) { reject(new Error('CDP not connected')); return; }
      const id = ++session.seq;
      const to = setTimeout(() => { session.pendingReqs.delete(id); reject(new Error('CDP ' + method + ' timeout')); }, 10000);
      session.pendingReqs.set(id, { resolve: (r) => { clearTimeout(to); if (r.error) reject(new Error(r.error.message)); else resolve(r.result); } });
      session.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async _cdpSetBP(session, line, condition) {
    try {
      const params = { lineNumber: line - 1, url: session.fileUrl };
      if (condition) params.condition = condition;
      const result = await this._cdpSend(session, 'Debugger.setBreakpointByUrl', params);
      // Store the CDP breakpointId for logpoint matching
      if (result && result.breakpointId) {
        const bp = session.breakpoints.find(b => b.line === line);
        if (bp) bp.cdpBreakpointId = result.breakpointId;
      }
      return result;
    } catch (e) { logger.warn('[CDP] BP at ' + line + ' failed: ' + e.message); return null; }
  }

  _handleCDPEvent(session, msg) {
    if (msg.method === 'Debugger.paused') {
      session.paused = true;
      const hitBreakpointIds = msg.params.hitBreakpoints || [];
      // Map CDP breakpointIds to line numbers using stored mapping
      const hitLineNumbers = hitBreakpointIds.map(id => {
        const bp = session.breakpoints.find(b => b.cdpBreakpointId === id);
        return bp ? bp.line : null;
      }).filter(Boolean);
      // Check if all hit breakpoints are logpoints — auto-resume
      if (this._shouldAutoResumeForLogpoints(session, hitLineNumbers)) {
        session.paused = false;
        this._cdpSend(session, 'Debugger.resume').catch(() => {});
        return;
      }
      for (const cb of session.onPaused) cb({ callFrames: this._parseCDPFrames(msg.params.callFrames || []), hitBreakpoints: hitLineNumbers, reason: msg.params.reason || 'other' });
    } else if (msg.method === 'Debugger.resumed') {
      session.paused = false;
      for (const cb of session.onResumed) cb();
    } else if (msg.method === 'Runtime.exceptionThrown') {
      const e = msg.params && msg.params.exceptionDetails;
      if (e) for (const cb of session.onError) cb((e.text || (e.exception && e.exception.description) || 'Unknown error'));
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      const t = (msg.params && msg.params.args || []).map(a => a.value || a.description || '').join(' ');
      for (const cb of session.onOutput) cb({ type: 'console', data: t + '\n' });
    }
  }

  _parseCDPFrames(frames) {
    return (frames || []).map((f, i) => ({
      id: f.callFrameId, index: i,
      functionName: f.functionName || '(anonymous)',
      url: f.url,
      lineNumber: (f.location ? f.location.lineNumber : 0) + 1,
      columnNumber: (f.location ? f.location.columnNumber : 0) + 1,
    }));
  }

  // ═══════════════════════════════════════════════════════════
  //  PYTHON DEBUGGER (debugpy DAP over TCP)
  // ═══════════════════════════════════════════════════════════

  async _startPythonDebug(session, tmpDir, scriptPath) {
    const debugPort = 5678 + Math.floor(Math.random() * 1000);

    // Start debugpy in listen mode
    const child = spawn('python3', ['-m', 'debugpy', '--listen', String(debugPort), '--wait-for-client', scriptPath], {
      cwd: tmpDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });
    session.child = child;

    child.stdout.on('data', (d) => {
      for (const cb of session.onOutput) cb({ type: 'stdout', data: d.toString() });
    });
    child.stderr.on('data', (d) => {
      for (const cb of session.onOutput) cb({ type: 'stderr', data: d.toString() });
    });

    // Connect DAP client
    await this._dapConnect(session, debugPort);
  }

  _dapConnect(session, port) {
    return new Promise((resolve, reject) => {
      const sock = new net.Socket();
      const timeout = setTimeout(() => { sock.destroy(); reject(new Error('debugpy connection timeout')); }, 10000);

      sock.connect(port, '127.0.0.1', async () => {
        clearTimeout(timeout);
        session.tcpSocket = sock;
        logger.info('[DAP] Connected to debugpy on port ' + port);

        let buf = '';
        sock.on('data', (chunk) => {
          buf += chunk.toString();
          this._dapProcessBuffer(session, buf, () => { buf = ''; });
        });
        sock.on('error', (err) => { for (const cb of session.onError) cb(err.message); });
        sock.on('close', () => { session.tcpSocket = null; });

        try {
          // DAP handshake
          await this._dapSend(session, 'initialize', { clientID: 'aetherstudio', adapterID: 'python', supportsVariableType: true });
          await this._dapSend(session, 'launch', { program: session.scriptPath, noDebug: false });
          // Set initial breakpoints (with conditions if any)
          for (const bp of session.breakpoints) {
            const bpParams = { line: bp.line };
            if (bp.condition) bpParams.condition = bp.condition;
            await this._dapSend(session, 'setBreakpoints', {
              source: { path: session.scriptPath },
              breakpoints: [bpParams],
            });
          }
          await this._dapSend(session, 'configurationDone');
          resolve();
        } catch (err) {
          reject(err);
        }
      });
      sock.on('error', (err) => { clearTimeout(timeout); reject(err); });
    });
  }

  _dapProcessBuffer(session, buf, resetBuf) {
    // DAP uses content-length headers
    const parts = buf.split('\r\n\r\n');
    while (parts.length >= 2) {
      const header = parts[0];
      const lenMatch = header.match(/Content-Length:\s*(\d+)/i);
      if (!lenMatch) break;
      const bodyLen = parseInt(lenMatch[1]);
      // Reconstruct remaining
      const rest = parts.slice(1).join('\r\n\r\n');
      if (rest.length < bodyLen) break; // not enough data yet

      const body = rest.substring(0, bodyLen);
      const remaining = rest.substring(bodyLen);
      this._dapHandleMessage(session, body);
      resetBuf();
      // Recursively process remaining
      if (remaining.length > 0) {
        this._dapProcessBuffer(session, remaining, resetBuf);
      }
      break;
    }
  }

  _dapHandleMessage(session, body) {
    try {
      const msg = JSON.parse(body);
      if (msg.type === 'event') {
        this._dapHandleEvent(session, msg);
      } else if (msg.type === 'response') {
        const p = session.pendingReqs.get(msg.request_seq);
        if (p) { session.pendingReqs.delete(msg.request_seq); p.resolve(msg); }
      }
    } catch (e) {
      logger.warn('[DAP] Parse error:', e.message);
    }
  }

  _dapHandleEvent(session, msg) {
    switch (msg.event) {
      case 'initialized':
        break; // will be handled by 'launch' response
      case 'stopped': {
        session.paused = true;
        const reason = msg.body.reason || 'breakpoint';
        // DAP doesn't provide hitBreakpoints directly, so try to infer from breakpoints
        const hitBreakpoints = msg.body.hitBreakpointIds || [];
        if (this._shouldAutoResumeForLogpoints(session, hitBreakpoints)) {
          session.paused = false;
          this._dapSend(session, 'continue', { threadId: 1 }).catch(() => {});
          return;
        }
        this._dapGetStackTrace(session).then(callFrames => {
          for (const cb of session.onPaused) cb({ callFrames, hitBreakpoints, reason });
        });
        break;
      }
      case 'continued': {
        session.paused = false;
        for (const cb of session.onResumed) cb();
        break;
      }
      case 'output': {
        const cat = msg.body.category || 'console';
        const data = msg.body.output || '';
        for (const cb of session.onOutput) cb({ type: cat, data });
        break;
      }
      case 'exited': {
        const code = msg.body.exitCode !== undefined ? msg.body.exitCode : 0;
        // Frontend adds a clean system message — no need to send raw exit text as output
        for (const cb of session.onExit) cb({ code, signal: null });
        this._cleanup(session);
        break;
      }
      case 'terminated': {
        if (!session.exited) {
          for (const cb of session.onExit) cb({ code: 0, signal: null });
          this._cleanup(session);
        }
        break;
      }
    }
  }

  async _dapGetStackTrace(session) {
    try {
      const resp = await this._dapSend(session, 'stackTrace', { threadId: 1, startFrame: 0, levels: 20 });
      const frames = resp.body && resp.body.stackFrames || [];
      return frames.map((f, i) => ({
        id: f.id,
        index: i,
        functionName: f.name || '(anonymous)',
        url: f.source && f.source.path ? f.source.path : session.scriptPath,
        lineNumber: f.line || 0,
        columnNumber: f.column || 0,
      }));
    } catch (e) {
      return [{ id: '0', index: 0, functionName: '<unknown>', url: session.scriptPath, lineNumber: 1, columnNumber: 1 }];
    }
  }

  async _dapGetVariables(session, variablesReference) {
    if (!variablesReference || variablesReference === 0) return [];
    try {
      const resp = await this._dapSend(session, 'variables', { variablesReference });
      const vars = resp.body && resp.body.variables || [];
      return vars.map(v => ({
        name: v.name,
        value: v.value,
        type: v.type || typeof v.value,
        variablesReference: v.variablesReference || 0,
      }));
    } catch (e) {
      return [];
    }
  }

  _dapSend(session, command, args) {
    return new Promise((resolve, reject) => {
      if (!session.tcpSocket) { reject(new Error('DAP not connected')); return; }
      const seq = ++session.seq;
      const msg = JSON.stringify({ seq, type: 'request', command, arguments: args || {} });
      const header = 'Content-Length: ' + Buffer.byteLength(msg) + '\r\n\r\n';
      const to = setTimeout(() => { session.pendingReqs.delete(seq); reject(new Error('DAP ' + command + ' timeout')); }, 15000);
      session.pendingReqs.set(seq, { resolve: (r) => { clearTimeout(to); resolve(r); }, reject: (e) => { clearTimeout(to); reject(e); } });
      session.tcpSocket.write(header + msg);
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  C/C++ DEBUGGER (GDB MI)
  // ═══════════════════════════════════════════════════════════

  async _startCPPDebug(session, langConfig, tmpDir, scriptPath, fileName) {
    const binaryName = fileName.replace(/\.[^.]+$/, '') + (process.platform === 'win32' ? '.exe' : '');
    const outputPath = path.join(tmpDir, binaryName);

    // Compile with debug symbols
    const compileCmd = 'g++';
    const compileArgs = ['-g', '-o', outputPath, scriptPath];

    logger.info('[GDB] Compiling: ' + compileCmd + ' ' + compileArgs.join(' '));

    await new Promise((resolve, reject) => {
      const cc = spawn(compileCmd, compileArgs, { cwd: tmpDir, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
      let errBuf = '';
      cc.stderr.on('data', (d) => { errBuf += d.toString(); for (const cb of session.onOutput) cb({ type: 'stderr', data: d.toString() }); });
      cc.on('exit', (code) => {
        if (code !== 0) {
          const msg = 'Compilation failed (code ' + code + '):\n' + errBuf;
          for (const cb of session.onError) cb(msg);
          for (const cb of session.onExit) cb({ code, signal: null });
          this._cleanup(session);
          reject(new Error(msg));
        } else resolve();
      });
      cc.on('error', reject);
    });

    // Launch GDB with MI interpreter
    return new Promise((resolve, reject) => {
      const gdb = spawn('gdb', ['--interpreter=mi2', '--quiet', '-ex', 'set disable-randomization off', outputPath], {
        cwd: tmpDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
      });
      session.child = gdb;
      session.debuggerProcess = gdb;
      let miBuf = '';

      gdb.stdout.on('data', (d) => {
        miBuf += d.toString();
        // Process one complete line at a time to avoid re-processing
        while (miBuf.includes('\n')) {
          const nlIndex = miBuf.indexOf('\n');
          const line = miBuf.substring(0, nlIndex).trim();
          miBuf = miBuf.substring(nlIndex + 1);
          if (line) {
            this._miParseLine(session, line);
            // Detect GDB prompt to signal readiness
            if (line.includes('(gdb)') && session._onGdbReady) {
              session._onGdbReady();
              session._onGdbReady = null;
            }
          }
        }
      });
      gdb.stderr.on('data', (d) => {
        for (const cb of session.onOutput) cb({ type: 'stderr', data: d.toString() });
      });
      gdb.on('exit', (code, signal) => {
        if (!session.exited) {
          for (const cb of session.onExit) cb({ code, signal });
          this._cleanup(session);
        }
      });

      // Wait for GDB prompt before sending commands
      const gdbReady = new Promise((resolveReady) => {
        session._onGdbReady = resolveReady;
        // Safety timeout in case GDB never shows prompt
        setTimeout(() => {
          if (session._onGdbReady) {
            session._onGdbReady = null;
            resolveReady();
          }
        }, 10000);
      });

      gdbReady.then(async () => {
        try {
          // Set breakpoints (with conditions if any)
          for (const bp of session.breakpoints) {
            try {
              let bpCmd = '-break-insert';
              if (bp.condition) bpCmd += ' -c ' + bp.condition;
              const resp = await this._miCmd(session, bpCmd, bp.line + '');
              const numMatch = resp.match(/bkpt=\{number="(\d+)"/);
              if (numMatch) bp.gdbBkptno = parseInt(numMatch[1]);
            } catch (e) {
              logger.warn('[GDB] Failed to set BP at line ' + bp.line + ': ' + e.message);
            }
          }
          // Run
          await this._miCmd(session, '-exec-run');
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  _miParseLine(session, line) {
    // MI output: [token] "^done"|"*running"|"*stopped"|"=event"|"~output"|"@output" ["," results]
    try {
      if (line.startsWith('*running')) {
        session.paused = false;
        for (const cb of session.onResumed) cb();
      } else if (line.startsWith('*stopped')) {
        const reason = this._miExtract(line, 'reason') || 'breakpoint-hit';

        // Handle exit reasons — don't pause, signal exit instead
        if (reason === 'exited-normally' || reason === 'exited' || reason === 'exited-signalled') {
          const code = this._miExtract(line, 'exit-code') || '0';
          const signal = this._miExtract(line, 'signal-name') || null;
          // Frontend's debug-exit handler adds a clean system message — no need to also send output
          for (const cb of session.onExit) cb({ code: parseInt(code), signal });
          this._cleanup(session);
          return;
        }

        // GDB: get the breakpoint number from the stopped event
        const bpNumber = this._miExtract(line, 'bkptno');
        // Map GDB breakpoint number to line number using stored mapping
        const hitLineNumbers = bpNumber
          ? [parseInt(bpNumber)].map(num => {
              const bp = session.breakpoints.find(b => b.gdbBkptno === num);
              return bp ? bp.line : num; // fallback to raw number if no mapping
            })
          : [];

        // Check for logpoints
        if (this._shouldAutoResumeForLogpoints(session, hitLineNumbers)) {
          session.paused = false;
          this._miCmd(session, '-exec-continue').catch(() => {});
          return;
        }

        session.paused = true;
        const frame = this._miParseFrame(line, session);
        const frames = frame ? [frame] : [];
        for (const cb of session.onPaused) cb({ callFrames: frames, breakpointsHit: hitLineNumbers, reason });
      } else if (line.startsWith('@')) {
        // Target (program) output — real program stdout
        const content = line.substring(1).replace(/^"|"$/g, '').replace(/\\n/g, '\n').replace(/\\"/g, '"');
        if (content.trim()) {
          for (const cb of session.onOutput) cb({ type: 'stdout', data: content });
        }
      } else if (line.startsWith('~')) {
        // GDB console output — filter out GDB's own messages, only show program output
        const content = line.substring(1).replace(/^"|"$/g, '').replace(/\\n/g, '\n').replace(/\\"/g, '"');
        const trimmed = content.trim();
        if (trimmed && !this._isGdbInternalOutput(trimmed)) {
          for (const cb of session.onOutput) cb({ type: 'stdout', data: content });
        }
      } else if (line.startsWith('&')) {
        // GDB log output — always internal, never show to user
        // (e.g. "warning: Error disabling address space randomization")
      } else if (line.includes('^done') || line.includes('^error') || line.includes('^running')) {
        // GDB MI response format: [token]^done/results or [token]^running
        // Token prefix (e.g. "1^done,...") means .startsWith() fails — use regex
        const cmdResp = line.match(/^(\d+)\^done/) || line.match(/^(\d+)\^error/) || line.match(/^(\d+)\^running/);
        if (cmdResp) {
          const token = parseInt(cmdResp[1]);
          const p = session.miPending.get(token);
          if (p) {
            session.miPending.delete(token);
            if (line.includes('^error')) {
              const msg = this._miExtract(line, 'msg') || 'GDB error';
              p.reject(new Error(msg));
            } else {
              // Resolve for both ^done and ^running
              p.resolve(line);
            }
          }
        }
      }
    } catch (e) {
      logger.warn('[MI] Parse error:', e.message);
    }
  }

  _isGdbInternalOutput(text) {
    // Heuristic: filter out GDB's own chatter from console output
    const internalPatterns = [
      /^Reading symbols from /,
      /^\[Inferior /,
      /^\(gdb\)/,
      /^No source file named /,
      /^Current language: /,
      /^warning:/i,
      /^Error:/i,
      /^Temporary breakpoint /,
      // Matches both "Breakpoint 1 at ..." and "Breakpoint 1, main() at ..."
      /^Breakpoint \d+(?:,\s*\w+\s*\([^)]*\))?\s+at /,
      /^Note: /,
      /^Thread /,
      /^\[New /,
      /^\[Switching /,
    ];
    return internalPatterns.some(p => p.test(text));
  }

  _miExtract(line, key) {
    const re = new RegExp(key + '="([^"]*)"');
    const m = line.match(re);
    return m ? m[1] : null;
  }

  _miParseFrame(line, session) {
    const func = this._miExtract(line, 'func') || '<unknown>';
    const file = this._miExtract(line, 'file') || (session ? session.scriptPath : 'unknown');
    const lineStr = this._miExtract(line, 'line');
    return {
      id: '0', index: 0,
      functionName: func,
      url: file,
      lineNumber: lineStr ? parseInt(lineStr) : 1,
      columnNumber: 1,
    };
  }

  _miCmd(session, cmd, arg) {
    return new Promise((resolve, reject) => {
      if (!session.debuggerProcess) { reject(new Error('GDB not running')); return; }
      const token = ++session.miToken;
      const fullCmd = token + cmd + (arg ? ' ' + arg : '') + '\n';
      const to = setTimeout(() => { session.miPending.delete(token); reject(new Error('GDB ' + cmd + ' timeout')); }, 15000);
      session.miPending.set(token, { resolve: (r) => { clearTimeout(to); resolve(r); }, reject: (e) => { clearTimeout(to); reject(e); } });
      session.debuggerProcess.stdin.write(fullCmd);
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  SIMPLE RUN MODE (fallback)
  // ═══════════════════════════════════════════════════════════

  async _startSimpleDebug(session, langConfig, tmpDir, scriptPath, fileName) {
    const { compileCmd, compileArgs, runCmd, runArgs } = langConfig;
    let binaryPath = scriptPath;

    if (compileCmd) {
      const binaryName = fileName.replace(/\.[^.]+$/, '') + (process.platform === 'win32' ? '.exe' : '');
      const outputPath = path.join(tmpDir, binaryName);
      let args;
      if (langConfig.ext === 'java') args = [scriptPath];
      else if (langConfig.ext === 'kt') { args = [...compileArgs, path.join(tmpDir, 'output.jar'), scriptPath]; binaryPath = path.join(tmpDir, 'output.jar'); }
      else { args = [...compileArgs, outputPath, scriptPath]; binaryPath = outputPath; }

      logger.info('[DebugService] Compiling ' + langConfig.ext);

      await new Promise((resolve, reject) => {
        const cc = spawn(compileCmd, args, { cwd: tmpDir, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
        let err = '';
        cc.stderr.on('data', (d) => { err += d; for (const cb of session.onOutput) cb({ type: 'stderr', data: d.toString() }); });
        cc.on('exit', (code) => {
          if (code !== 0) {
            const m = 'Compilation failed (code ' + code + '):\n' + err;
            for (const cb of session.onError) cb(m);
            for (const cb of session.onExit) cb({ code, signal: null });
            this._cleanup(session);
            reject(new Error(m));
          } else resolve();
        });
        cc.on('error', reject);
      });
    }
    this._runBinary(session, binaryPath, runCmd, runArgs, tmpDir);
  }

  _runBinary(session, binaryPath, runCmd, runArgs, cwd) {
    const cmd = runCmd || binaryPath;
    const args = runCmd ? [...runArgs, binaryPath] : [];
    const child = spawn(cmd, args, { cwd, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
    session.child = child;
    child.stdout.on('data', (d) => { for (const cb of session.onOutput) cb({ type: 'stdout', data: d.toString() }); });
    child.stderr.on('data', (d) => { for (const cb of session.onOutput) cb({ type: 'stderr', data: d.toString() }); });
    child.on('exit', (code, signal) => {
      // Frontend adds a clean system message — no need to send raw exit text as output
      for (const cb of session.onExit) cb({ code, signal });
      this._cleanup(session);
    });
    child.on('error', (err) => { for (const cb of session.onError) cb(err.message); });
  }

  // ═══════════════════════════════════════════════════════════
  //  COMMON DEBUG ACTIONS
  // ═══════════════════════════════════════════════════════════

  stopDebugSession(workspaceId) {
    const s = this.sessions.get(workspaceId);
    if (!s) return false;
    if (s.child) { try { s.child.kill('SIGKILL'); } catch (e) {} }
    if (s.tcpSocket) { try { s.tcpSocket.destroy(); } catch (e) {} }
    if (s.ws) { try { s.ws.close(); } catch (e) {} }
    this._cleanup(s);
    RECENTLY_STOPPED.add(workspaceId);
    setTimeout(() => RECENTLY_STOPPED.delete(workspaceId), 2000);
    return true;
  }

  async stepOver(workspaceId) {
    const s = this.sessions.get(workspaceId);
    if (!s || !s.paused) throw new Error('Not paused');
    if (s.ws) return this._cdpSend(s, 'Debugger.stepOver');         // CDP
    if (s.tcpSocket) return this._dapSend(s, 'next', { threadId: 1 }); // DAP
    if (s.debuggerProcess) return this._miCmd(s, '-exec-next');      // GDB
    throw new Error('Stepping not available');
  }

  async stepInto(workspaceId) {
    const s = this.sessions.get(workspaceId);
    if (!s || !s.paused) throw new Error('Not paused');
    if (s.ws) return this._cdpSend(s, 'Debugger.stepInto');
    if (s.tcpSocket) return this._dapSend(s, 'stepIn', { threadId: 1 });
    if (s.debuggerProcess) return this._miCmd(s, '-exec-step');
    throw new Error('Stepping not available');
  }

  async stepOut(workspaceId) {
    const s = this.sessions.get(workspaceId);
    if (!s || !s.paused) throw new Error('Not paused');
    if (s.ws) return this._cdpSend(s, 'Debugger.stepOut');
    if (s.tcpSocket) return this._dapSend(s, 'stepOut', { threadId: 1 });
    if (s.debuggerProcess) return this._miCmd(s, '-exec-finish');
    throw new Error('Stepping not available');
  }

  async continueExecution(workspaceId) {
    const s = this.sessions.get(workspaceId);
    if (!s || !s.paused) throw new Error('Not paused');
    if (s.ws) return this._cdpSend(s, 'Debugger.resume');
    if (s.tcpSocket) return this._dapSend(s, 'continue', { threadId: 1 });
    if (s.debuggerProcess) return this._miCmd(s, '-exec-continue');
    throw new Error('Continue not available');
  }

  async addBreakpoint(workspaceId, line) {
    const s = this.sessions.get(workspaceId);
    if (!s || s.isSimpleDebug) return;
    if (!s.breakpoints.find(b => b.line === line)) s.breakpoints.push({ line });
    if (s.ws) return this._cdpSetBP(s, line);
    if (s.tcpSocket) return this._dapSend(s, 'setBreakpoints', { source: { path: s.scriptPath }, breakpoints: [{ line }] });
    if (s.debuggerProcess && s.paused) return this._miCmd(s, '-break-insert', String(line));
  }

  async removeBreakpoint(workspaceId, line) {
    const s = this.sessions.get(workspaceId);
    if (!s || s.isSimpleDebug) return;
    s.breakpoints = s.breakpoints.filter(b => b.line !== line);
  }

  // ── Get variables from the current paused state ──
  async getVariables(workspaceId) {
    const s = this.sessions.get(workspaceId);
    if (!s || !s.paused) return [];
    // DAP (Python)
    if (s.tcpSocket) {
      try {
        const stackResp = await this._dapSend(s, 'stackTrace', { threadId: 1, startFrame: 0, levels: 1 });
        const top = stackResp.body && stackResp.body.stackFrames && stackResp.body.stackFrames[0];
        if (!top) return [];
        const scopesResp = await this._dapSend(s, 'scopes', { frameId: top.id });
        const scopes = scopesResp.body && scopesResp.body.scopes || [];
        const allVars = [];
        for (const scope of scopes) {
          const vars = await this._dapGetVariables(s, scope.variablesReference);
          vars.forEach(v => { v.scope = scope.name; });
          allVars.push(...vars);
        }
        return allVars;
      } catch (e) {
        return [];
      }
    }
    // GDB (C/C++)
    if (s.debuggerProcess) {
      try {
        const resp = await this._miCmd(s, '-stack-list-variables', '--all-values');
        const vars = this._miParseVariables(resp);
        return vars;
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  // ═══════════════════════════════════════════════════════════
  //  REPL / EXPRESSION EVALUATION
  // ═══════════════════════════════════════════════════════════

  /**
   * Evaluate an expression in the current debug context.
   * Returns { result, type, variablesReference } or throws.
   */
  async evaluateExpression(workspaceId, expression, frameId) {
    const s = this.sessions.get(workspaceId);
    if (!s || !s.paused) throw new Error('Not paused');

    // CDP (Node.js/TypeScript)
    if (s.ws) {
      const params = { expression, includeCommandLineAPI: true };
      if (frameId) params.callFrameId = frameId;
      const result = await this._cdpSend(s, 'Debugger.evaluateOnCallFrame', params);
      if (result.exceptionDetails) {
        const desc = result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Unknown error';
        throw new Error(desc);
      }
      return {
        result: result.result?.value !== undefined ? String(result.result.value) : result.result?.description || 'undefined',
        type: result.result?.type || 'undefined',
        variablesReference: result.result?.objectId || null,
      };
    }

    // DAP (Python)
    if (s.tcpSocket) {
      try {
        const resp = await this._dapSend(s, 'evaluate', { expression, frameId: frameId || 1, context: 'repl' });
        return {
          result: resp.body?.result !== undefined ? String(resp.body.result) : 'undefined',
          type: resp.body?.type || 'unknown',
          variablesReference: resp.body?.variablesReference || 0,
        };
      } catch (e) {
        throw new Error('Evaluation error: ' + e.message);
      }
    }

    // GDB (C/C++)
    if (s.debuggerProcess) {
      try {
        // GDB MI takes everything after the command name as the expression argument.
        // Do NOT quote — quoting would turn "10+20" into a C string literal instead
        // of evaluating it as an arithmetic expression.
        const resp = await this._miCmd(s, '-data-evaluate-expression', expression);
        const valMatch = resp.match(/value="((?:[^"\\]|\\.)*)"/);
        const typeMatch = resp.match(/type="([^"]*)"/);

        let result = valMatch ? valMatch[1] : null;

        // Fallback: try GDB's console 'print' command via -interpreter-exec
        if (result === null || result === '(unavailable)') {
          try {
            const printResp = await this._miCmd(
              s, '-interpreter-exec',
              'console print ' + expression
            );
            const consoleMatch = printResp.match(/~"\$\d+ = ([^\\]*)/);
            if (consoleMatch) {
              result = consoleMatch[1].trim();
            }
          } catch (printErr) {
            throw new Error('Evaluation error: ' + printErr.message);
          }
        }

        return {
          result: result || '(unavailable)',
          type: typeMatch ? typeMatch[1] : 'unknown',
          variablesReference: null,
        };
      } catch (e) {
        throw new Error('Evaluation error: ' + e.message);
      }
    }

    throw new Error('Debug session not active or not paused');
  }

  // ═══════════════════════════════════════════════════════════
  //  VARIABLE TREE: GET CHILDREN OF A VARIABLE
  // ═══════════════════════════════════════════════════════════

  /**
   * Get children of a compound variable (object/array) for tree expansion.
   * For CDP: use Runtime.getProperties with the objectId.
   * For DAP: use the variables request with variablesReference.
   * For GDB: use -var-create and -var-list-children.
   */
  async getChildrenVariables(workspaceId, variablesReference) {
    const s = this.sessions.get(workspaceId);
    if (!s || !s.paused) return [];

    // CDP — variablesReference is an objectId
    if (s.ws && typeof variablesReference === 'string' && variablesReference.startsWith('id:')) {
      const objId = variablesReference.substring(3); // strip 'id:' prefix
      try {
        const props = await this._cdpSend(s, 'Runtime.getProperties', { objectId: objId, ownProperties: false });
        const children = [];
        for (const prop of (props.result || [])) {
          if (prop.name === '__proto__') continue;
          const val = prop.value;
          children.push({
            name: prop.name,
            value: val?.value !== undefined ? String(val.value) : val?.description || '…',
            type: val?.type || 'unknown',
            variablesReference: val?.objectId ? ('id:' + val.objectId) : null,
            isScope: false,
          });
        }
        return children;
      } catch (e) {
        return [];
      }
    }

    // DAP — variablesReference is a number
    if (s.tcpSocket && typeof variablesReference === 'number' && variablesReference > 0) {
      try {
        const vars = await this._dapGetVariables(s, variablesReference);
        return vars.map(v => ({
          ...v,
          isScope: false,
        }));
      } catch (e) {
        return [];
      }
    }

    return [];
  }

  // ═══════════════════════════════════════════════════════════
  //  SET VARIABLE VALUE AT RUNTIME
  // ═══════════════════════════════════════════════════════════

  /**
   * Set a variable's value during a paused debug session.
   */
  async setVariable(workspaceId, name, value, variablesReference) {
    const s = this.sessions.get(workspaceId);
    if (!s || !s.paused) throw new Error('Not paused');

    // CDP
    if (s.ws) {
      // Try Debugger.setVariableValue first (requires scope info)
      // Fallback: use Runtime.evaluate with assignment
      try {
        const result = await this._cdpSend(s, 'Runtime.evaluate', {
          expression: `${name} = ${JSON.stringify(value)}`,
          includeCommandLineAPI: false,
        });
        if (result.exceptionDetails) {
          throw new Error(result.exceptionDetails.text || 'Assignment failed');
        }
        return {
          result: result.result?.value !== undefined ? String(result.result.value) : result.result?.description || 'undefined',
          type: result.result?.type || 'unknown',
        };
      } catch (e) {
        throw new Error('Failed to set variable: ' + e.message);
      }
    }

    // DAP
    if (s.tcpSocket) {
      try {
        const params = { name, value };
        if (variablesReference) params.variablesReference = variablesReference;
        await this._dapSend(s, 'setVariable', params);
        return { result: value, type: 'string' };
      } catch (e) {
        throw new Error('Failed to set variable: ' + e.message);
      }
    }

    // GDB
    if (s.debuggerProcess) {
      try {
        // Use GDB's 'set var' command
        await this._miCmd(s, '-gdb-set', `var ${name}=${value}`);
        return { result: value, type: 'string' };
      } catch (e) {
        throw new Error('Failed to set variable: ' + e.message);
      }
    }

    throw new Error('Debug session not active');
  }

  // ═══════════════════════════════════════════════════════════
  //  LOGPOINT HANDLING
  // ═══════════════════════════════════════════════════════════

  /**
   * Handle a pause event — if all hit breakpoints are logpoints,
   * evaluate the log messages and auto-resume.
   * Returns true if the session should auto-resume (all logpoints).
   */
  _shouldAutoResumeForLogpoints(session, hitBreakpoints) {
    if (!hitBreakpoints || hitBreakpoints.length === 0) return false;

    // Check if ALL hit breakpoints are logpoints
    const logpoints = session.breakpoints.filter(bp =>
      bp.logMessage && hitBreakpoints.includes(bp.id || bp.line)
    );

    if (logpoints.length === 0) return false;

    // Some hit breakpoints are not logpoints — don't auto-resume
    const nonLogpointHits = hitBreakpoints.filter(idOrLine => {
      const bp = session.breakpoints.find(b => (b.id || b.line) === idOrLine);
      return bp && !bp.logMessage;
    });
    if (nonLogpointHits.length > 0) return false;

    // All hit breakpoints are logpoints — evaluate and resume
    for (const lp of logpoints) {
      this._evaluateLogMessage(session, lp.logMessage).then(msg => {
        for (const cb of session.onOutput) cb({ type: 'stdout', data: msg + '\n' });
      }).catch(() => {});
    }
    return true;
  }

  async _evaluateLogMessage(session, logMessage) {
    // Replace {expression} placeholders with evaluated values
    const parts = [];
    let lastIndex = 0;
    const regex = /\{([^}]+)\}/g;
    let match;
    while ((match = regex.exec(logMessage)) !== null) {
      if (match.index > lastIndex) {
        parts.push(logMessage.substring(lastIndex, match.index));
      }
      const expr = match[1];
      try {
        if (session.ws) {
          const result = await this._cdpSend(session, 'Runtime.evaluate', { expression: expr, includeCommandLineAPI: false });
          parts.push(result.result?.value !== undefined ? String(result.result.value) : result.result?.description || 'undefined');
        } else if (session.tcpSocket) {
          const resp = await this._dapSend(session, 'evaluate', { expression: expr, context: 'repl' });
          parts.push(resp.body?.result !== undefined ? String(resp.body.result) : 'undefined');
        } else if (session.debuggerProcess) {
          const resp = await this._miCmd(session, '-data-evaluate-expression', expr);
          const valMatch = resp.match(/value="((?:[^"\\]|\\.)*)"/);
          parts.push(valMatch ? valMatch[1] : 'undefined');
        } else {
          parts.push('undefined');
        }
      } catch {
        parts.push('<error>');
      }
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < logMessage.length) {
      parts.push(logMessage.substring(lastIndex));
    }
    return parts.join('');
  }

  // ═══════════════════════════════════════════════════════════
  //  CONDITIONAL BREAKPOINT PATCHING
  // ═══════════════════════════════════════════════════════════

  async addConditionalBreakpoint(workspaceId, line, condition) {
    const s = this.sessions.get(workspaceId);
    if (!s || s.isSimpleDebug) return;

    // Update stored breakpoint
    let bp = s.breakpoints.find(b => b.line === line);
    if (bp) {
      bp.condition = condition;
    } else {
      bp = { line, condition };
      s.breakpoints.push(bp);
    }

    // CDP
    if (s.ws) {
      try {
        const params = { lineNumber: line - 1, url: s.fileUrl };
        if (condition) params.condition = condition;
        const result = await this._cdpSend(s, 'Debugger.setBreakpointByUrl', params);
        if (result && result.breakpointId) bp.cdpBreakpointId = result.breakpointId;
      } catch (e) {
        logger.warn('[CDP] Conditional BP at line ' + line + ' failed: ' + e.message);
      }
      return;
    }
    // DAP
    if (s.tcpSocket) {
      const bpParams = { line };
      if (condition) bpParams.condition = condition;
      return this._dapSend(s, 'setBreakpoints', {
        source: { path: s.scriptPath },
        breakpoints: [{ line, condition }],
      });
    }
    // GDB
    if (s.debuggerProcess && s.paused) {
      try {
        let cmd = '-break-insert';
        if (condition) cmd += ` -c ${condition}`;
        const resp = await this._miCmd(s, cmd, String(line));
        const numMatch = resp.match(/bkpt=\{number="(\d+)"/);
        if (numMatch) bp.gdbBkptno = parseInt(numMatch[1]);
      } catch (e) {
        logger.warn('[GDB] Conditional BP at line ' + line + ' failed: ' + e.message);
      }
    }
  }

  async addLogpoint(workspaceId, line, logMessage) {
    const s = this.sessions.get(workspaceId);
    if (!s || s.isSimpleDebug) return;

    // Store logpoint metadata (must set breakpoint so we can catch & auto-resume)
    // Reuse existing breakpoint to avoid duplicates
    let bp = s.breakpoints.find(b => b.line === line);
    if (bp) {
      bp.logMessage = logMessage;
      bp.isLogpoint = true;
    } else {
      bp = { line, logMessage, isLogpoint: true };
      s.breakpoints.push(bp);
    }

    // Set the underlying breakpoint (non-conditional) so we can catch pauses
    if (s.ws) {
      try {
        const result = await this._cdpSend(s, 'Debugger.setBreakpointByUrl', { lineNumber: line - 1, url: s.fileUrl });
        if (result && result.breakpointId) bp.cdpBreakpointId = result.breakpointId;
      } catch (e) {
        logger.warn('[CDP] Logpoint BP at line ' + line + ' failed: ' + e.message);
      }
      return;
    }
    if (s.tcpSocket) {
      return this._dapSend(s, 'setBreakpoints', {
        source: { path: s.scriptPath },
        breakpoints: [{ line }],
      });
    }
    if (s.debuggerProcess && s.paused) {
      try {
        const resp = await this._miCmd(s, '-break-insert', String(line));
        // Parse GDB breakpoint number for logpoint matching
        const numMatch = resp.match(/bkpt=\{number="(\d+)"/);
        if (numMatch) bp.gdbBkptno = parseInt(numMatch[1]);
      } catch (e) {
        logger.warn('[GDB] Logpoint BP at line ' + line + ' failed: ' + e.message);
      }
    }
  }

  /** FIXED: Brace-depth parser for GDB MI variable output.
   *
   * GDB MI output for -stack-list-variables --all-values can contain
   * nested braces and escaped quotes in object/array values, e.g.:
   *   {name="calc",value="{name = \"Demo\", history = {0, 0}}",type="Calculator"}
   *
   * The old regex-based parser failed on these nested structures,
   * returning only simple scalar variables while skipping complex ones.
   *
   * This parser tracks brace depth to correctly extract each variable entry
   * even when values contain nested objects, arrays, and escaped quotes.
   */
  _miParseVariables(miOutput) {
    const vars = [];
    let depth = 0;
    let entryStart = -1;

    for (let i = 0; i < miOutput.length; i++) {
      const ch = miOutput[i];
      if (ch === '{') {
        if (depth === 0) entryStart = i;
        depth++;
      } else if (ch === '}') {
        depth--;
        if (depth === 0 && entryStart >= 0) {
          // Extract the inner content between outer braces
          const entry = miOutput.substring(entryStart + 1, i);
          const nameMatch = entry.match(/name="([^"]*)"/);
          const valueMatch = entry.match(/value="((?:[^"\\]|\\.)*)"/);
          const typeMatch = entry.match(/type="([^"]*)"/);

          if (nameMatch) {
            vars.push({
              name: nameMatch[1],
              value: valueMatch ? valueMatch[1] : '<unknown>',
              type: typeMatch ? typeMatch[1] : 'unknown',
              scope: 'Local',
            });
          }
          entryStart = -1;
        }
      }
    }
    return vars;
  }

  getDebugState(workspaceId) {
    const s = this.sessions.get(workspaceId);
    if (!s) return { active: false };
    return { active: true, sessionId: s.id, paused: s.paused, breakpoints: s.breakpoints };
  }

  onPaused(workspaceId, cb) {
    const s = this.sessions.get(workspaceId);
    if (!s) return () => {};
    s.onPaused.add(cb);
    return () => s.onPaused.delete(cb);
  }

  onResumed(workspaceId, cb) {
    const s = this.sessions.get(workspaceId);
    if (!s) return () => {};
    s.onResumed.add(cb);
    return () => s.onResumed.delete(cb);
  }

  onOutput(workspaceId, cb) {
    const s = this.sessions.get(workspaceId);
    if (!s) return () => {};
    s.onOutput.add(cb);
    return () => s.onOutput.delete(cb);
  }

  onError(workspaceId, cb) {
    const s = this.sessions.get(workspaceId);
    if (!s) return () => {};
    s.onError.add(cb);
    return () => s.onError.delete(cb);
  }

  onExit(workspaceId, cb) {
    const s = this.sessions.get(workspaceId);
    if (!s) return () => {};
    s.onExit.add(cb);
    return () => s.onExit.delete(cb);
  }

  _cleanup(session) {
    session.exited = true;
    if (session.ws) { try { session.ws.close(); } catch (e) {} session.ws = null; }
    if (session.tcpSocket) { try { session.tcpSocket.destroy(); } catch (e) {} session.tcpSocket = null; }
    session.cleanup();
    try { if (session.scriptPath && fs.existsSync(session.scriptPath)) fs.unlinkSync(session.scriptPath); } catch (e) {}
    try {
      const d = path.join(os.tmpdir(), 'aether-debug', session.workspaceId);
      if (fs.existsSync(d)) {
        for (const f of fs.readdirSync(d)) { try { fs.unlinkSync(path.join(d, f)); } catch (e) {} }
        try { fs.rmdirSync(d); } catch (e) {}
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
