import { spawn } from 'child_process';
import { platform } from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import logger from '../config/logger.js';

/**
 * Terminal Service — manages pseudo-terminals for the VS Code-style terminal.
 * Uses node-pty when available, falls back to child_process.spawn.
 */

let pty = null;
try {
  pty = (await import('node-pty')).default;
  logger.info('[TerminalService] Using node-pty for PTY terminals');
} catch (e) {
  logger.warn('[TerminalService] node-pty not available, falling back to child_process.spawn');
}

class TerminalService {
  constructor() {
    /** @type {Map<string, { process: any, shell: string, cwd: string }>} */
    this.sessions = new Map();
  }

  /**
   * Resolve the default shell for the current platform.
   */
  getDefaultShell() {
    const osPlatform = platform();
    if (osPlatform === 'win32') {
      return process.env.COMSPEC || 'cmd.exe';
    }
    return process.env.SHELL || '/bin/sh';
  }

  /**
   * Resolve the default working directory.
   * Priority:
   *   1. TERMINAL_CWD environment variable    *   2. /workspace (Docker mount — the full AetherStudio project root inside container)
   *   3. Project root on the host filesystem (local dev / Windows compat)
   */
  getDefaultCwd() {
    // 1. Environment variable override
    if (process.env.TERMINAL_CWD) {
      return process.env.TERMINAL_CWD;
    }

    // 2. Docker mount path
    try {
      if (fs.statSync('/workspace', { throwIfNoEntry: false })) {
        return '/workspace';
      }
    } catch {
      // Path doesn't exist
    }

    // 3. Fall back to project root on host
    // File is at backend/services/terminalService.js, so go up 2 levels
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    return path.resolve(__dirname, '..', '..');
  }

  /**
   * Resolve shell arguments for interactive mode.
   * @param {string} shell
   * @returns {string[]}
   */
  _getShellArgs(shell) {
    const name = shell.split(/[/\\]/).pop().toLowerCase();
    if (['bash', 'sh', 'zsh', 'fish'].includes(name)) {
      return ['-i']; // interactive mode
    }
    if (name === 'powershell' || name === 'pwsh') {
      return ['-NoExit', '-Command', '-']; // stay open, read from stdin
    }
    return [];
  }

  /**
   * Create a new terminal session.
   * @param {string} terminalId - Unique identifier for this terminal.
   * @param {object} [options]
   * @param {string} [options.shell] - Shell to use (default: platform default).
   * @param {string} [options.cwd] - Working directory (default: home).
   * @returns {{ terminalId: string, shell: string, cwd: string }}
   */
  createTerminal(terminalId, options = {}) {
    const shell = options.shell || this.getDefaultShell();
    const cwd = options.cwd || this.getDefaultCwd();

    if (pty) {
      // ── node-pty: full PTY support (no extra args needed — PTY is inherently interactive) ──
      const term = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd,
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          TERMINAL_ID: terminalId,
          // Clean VS Code-style prompt: show cwd path with >> instead of default PS1
          PS1: '\\w >> ', 
          PS2: '>> ',
        },
      });

      this.sessions.set(terminalId, {
        process: term,
        shell,
        cwd,
        type: 'pty',
      });

      logger.info(`[TerminalService] Created PTY terminal ${terminalId} (shell: ${shell})`);
    } else {
      // ── Fallback: child_process spawn (no PTY — use -i for interactive) ──
      const shellArgs = this._getShellArgs(shell);

      const child = spawn(shell, shellArgs, {
        cwd,
        env: {
          ...process.env,
          TERM: 'xterm-256color',
          TERMINAL_ID: terminalId,
          // Clean VS Code-style prompt: show cwd path with >> instead of default PS1
          PS1: '\\w >> ',
          PS2: '>> ',
        },
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
      });

      this.sessions.set(terminalId, {
        process: child,
        shell,
        cwd,
        type: 'spawn',
      });

      logger.info(`[TerminalService] Created spawn terminal ${terminalId} (shell: ${shell}, args: ${JSON.stringify(shellArgs)})`);
    }

    return { terminalId, shell, cwd };
  }

  /**
   * Write data to a terminal's stdin.
   * @param {string} terminalId
   * @param {string} data
   */
  write(terminalId, data) {
    const session = this.sessions.get(terminalId);
    if (!session) {
      logger.warn(`[TerminalService] Cannot write to unknown terminal: ${terminalId}`);
      return;
    }

    if (pty && session.type === 'pty') {
      session.process.write(data);
    } else {
      session.process.stdin.write(data);
    }
  }

  /**
   * Resize a terminal (PTY only — ignored for spawn fallback).
   * @param {string} terminalId
   * @param {number} cols
   * @param {number} rows
   */
  resize(terminalId, cols, rows) {
    const session = this.sessions.get(terminalId);
    if (!session) return;

    if (pty && session.type === 'pty') {
      try {
        session.process.resize(cols, rows);
      } catch (e) {
        logger.warn(`[TerminalService] resize error for ${terminalId}: ${e.message}`);
      }
    }
  }

  /**
   * Register a callback for terminal output.
   * @param {string} terminalId
   * @param {(data: string) => void} callback
   */
  /**
   * Register a callback for terminal output.
   * Stores a reference so it can be replaced on socket reconnect.
   * @param {string} terminalId
   * @param {(data: string) => void} callback
   * @param {boolean} replace - If true, remove any previous listener before adding.
   */
  onData(terminalId, callback, replace = false) {
    const session = this.sessions.get(terminalId);
    if (!session) {
      logger.warn(`[TerminalService] Cannot listen to unknown terminal: ${terminalId}`);
      return;
    }

    if (pty && session.type === 'pty') {
      // node-pty onData doesn't support removing listeners, so we store
      // the latest callback and use a single persistent listener per terminal.
      if (!session._ptyDataListener) {
        session._ptyDataListener = (data) => {
          if (session._dataCallback) session._dataCallback(data);
        };
        session.process.onData(session._ptyDataListener);
      }
      session._dataCallback = callback;
    } else {
      if (replace && session._stdoutListener) {
        session.process.stdout.off('data', session._stdoutListener);
        session.process.stderr.off('data', session._stderrListener);
      }
      session._stdoutListener = callback;
      session._stderrListener = (data) => {
        callback(`\x1b[38;2;248;113;113m${data.toString()}\x1b[0m`);
      };
      session.process.stdout.on('data', session._stdoutListener);
      session.process.stderr.on('data', session._stderrListener);
    }
  }

  /**
   * Register a callback for terminal exit.
   * @param {string} terminalId
   * @param {(exitCode: number | null) => void} callback
   */
  onExit(terminalId, callback, replace = false) {
    const session = this.sessions.get(terminalId);
    if (!session) return;

    if (pty && session.type === 'pty') {
      // Use a single persistent listener per terminal (same pattern as onData)
      if (!session._ptyExitListener) {
        session._ptyExitListener = ({ exitCode, signal }) => {
          if (session._exitCallback) session._exitCallback(exitCode);
        };
        session.process.onExit(session._ptyExitListener);
      }
      session._exitCallback = callback;
    } else {
      if (replace && session._exitListener) {
        session.process.off('exit', session._exitListener);
        session.process.off('error', session._errorListener);
      }
      session._exitListener = (code) => {
        callback(code);
      };
      session._errorListener = (err) => {
        logger.error(`[TerminalService] Process error for ${terminalId}: ${err.message}`);
        callback(-1);
      };
      session.process.on('exit', session._exitListener);
      session.process.on('error', session._errorListener);
    }
  }

  /**
   * Kill a terminal session.
   * @param {string} terminalId
   */
  killTerminal(terminalId) {
    const session = this.sessions.get(terminalId);
    if (!session) {
      logger.warn(`[TerminalService] Cannot kill unknown terminal: ${terminalId}`);
      return false;
    }

    try {
      if (pty && session.type === 'pty') {
        session.process.kill();
      } else {
        session.process.kill('SIGTERM');
        // Force kill after 2 seconds
        setTimeout(() => {
          try { session.process.kill('SIGKILL'); } catch (e) { /* already dead */ }
        }, 2000);
      }
    } catch (e) {
      logger.warn(`[TerminalService] Error killing terminal ${terminalId}: ${e.message}`);
    }

    this.sessions.delete(terminalId);
    logger.info(`[TerminalService] Killed terminal ${terminalId}`);
    return true;
  }

  /**
   * Check if a terminal session exists.
   * @param {string} terminalId
   */
  hasTerminal(terminalId) {
    return this.sessions.has(terminalId);
  }

  /**
   * Get the number of active terminal sessions.
   */
  getActiveCount() {
    return this.sessions.size;
  }

  /**
   * Clean up all terminal sessions (called on server shutdown).
   */
  async cleanup() {
    const ids = Array.from(this.sessions.keys());
    logger.info(`[TerminalService] Cleaning up ${ids.length} terminal(s)...`);
    for (const id of ids) {
      this.killTerminal(id);
    }
  }
}

// Singleton
const terminalService = new TerminalService();
export default terminalService;
