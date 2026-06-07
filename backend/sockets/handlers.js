import logger from "../config/logger.js";
import { initializeYjsBinding } from "./yjs-binding.js";
import { initializeWebRTC } from "./webrtc-signaling.js";
import terminalService from "../services/terminalService.js";
import debugService from "../services/debugService.js";
import Workspace from "../models/Workspace.js";
import { syncWorkspaceToDisk, getWorkspaceDisplayPath } from "../services/workspaceFileSync.js";
import { watchWorkspace } from "../services/fileWatcherService.js";

export function setupSocketHandlers(io, redisClient) {
  io.on("connection", (socket) => {
    logger.info(`[Socket] Client connected: ${socket.id}`);

    // Wire up Yjs CRDT sync for collaborative editing
    initializeYjsBinding(socket, io, redisClient);

    // Wire up WebRTC signaling for audio/video calls
    initializeWebRTC(socket, io);

    socket.on("join-workspace", async (data, callback) => {
      try {
        const { workspaceId, userId } = data;
        socket.join(`workspace:${workspaceId}`);

        // Store workspaceId immediately so terminal-create can derive the path
        // even before the async DB lookup + file sync completes
        socket._workspaceId = workspaceId;

        // Sync workspace files to disk so the terminal can access them
        try {
          const workspace = await Workspace.findById(workspaceId);
          if (workspace) {
            await syncWorkspaceToDisk(workspace);
            // Register watcher for this workspace if not already watching
            watchWorkspace(workspaceId, workspace.name);
            // Store workspace path on the socket so terminal-create can use it
            socket._workspaceName = workspace.name;
            socket._workspacePath = getWorkspaceDisplayPath(workspaceId, workspace.name);
            logger.info(`[Socket] Workspace files synced for "${workspace.name}" (${workspaceId})`);
          }
        } catch (syncErr) {
          logger.warn(`[Socket] Failed to sync workspace files for ${workspaceId}:`, syncErr);
        }

        io.to(`workspace:${workspaceId}`).emit("peer-joined", {
          socketId: socket.id,
          userId,
        });

        callback?.({ success: true });
      } catch (err) {
        logger.error("join-workspace error:", err);
        callback?.({ error: err.message });
      }
    });

    socket.on("code-change", async (data) => {
      const { workspaceId, fileId, code } = data;
      socket.to(`workspace:${workspaceId}`).emit("code-update", { fileId, code });
      
      await redisClient.setEx(
        `workspace:${workspaceId}:file:${fileId}`,
        300,
        code
      );
    });

    socket.on("leave-workspace", (data) => {
      const { workspaceId, userId } = data;
      socket.leave(`workspace:${workspaceId}`);
      io.to(`workspace:${workspaceId}`).emit("peer-left", socket.id);
      logger.info(`[Socket] User ${userId} left workspace: ${workspaceId}`);
    });

    // ── Terminal Events ──

    // Track terminal IDs created by this socket so we can clean up on disconnect
    socket._terminalIds = [];

    /**
     * Helper: attach terminal output/exit listeners for a given terminal to this socket.
     * Uses `replace: true` so that on socket reconnect the old socket reference is overwritten.
     */
    function _attachTerminalListeners(terminalId) {
      terminalService.onData(terminalId, (data) => {
        socket.emit("terminal-output", { terminalId, data });
      }, true /* replace previous listener to avoid stale socket reference */);

      terminalService.onExit(terminalId, (exitCode) => {
        socket.emit("terminal-exit", { terminalId, exitCode });
        logger.info(`[Socket] Terminal ${terminalId} exited with code ${exitCode}`);
      }, true);
    }

    /**
     * Create a new terminal session (PTY).
     * Payload: { terminalId: string, shell?: string, cwd?: string }
     *
     * Note: This handler is async because it may need to look up the workspace
     * name from MongoDB if join-workspace hasn't finished syncing yet (race on page load).
     */
    socket.on("terminal-create", async (data) => {
      const { terminalId, shell } = data;
      // Resolve workspaceId: prefer the already-synced path, then socket stored ID,
      // then the workspaceId passed directly from the frontend (safest for refreshes)
      const workspaceId = data.workspaceId || socket._workspaceId;

      if (!terminalId) {
        socket.emit("terminal-error", { terminalId, error: "terminalId is required" });
        return;
      }

      // If this terminal already exists (e.g., after reconnect), re-attach listeners
      if (terminalService.hasTerminal(terminalId)) {
        logger.info(`[Socket] Terminal ${terminalId} already exists, re-attaching listeners`);
        _attachTerminalListeners(terminalId);
        if (!socket._terminalIds.includes(terminalId)) {
          socket._terminalIds.push(terminalId);
        }
        socket.emit("terminal-created", { terminalId, shell, cwd: socket._workspacePath || data.cwd });
        return;
      }

      // ── Resolve cwd ──
      // Priority: cached socket path → fallback with workspace name → DB lookup → fallback to data.cwd
      let cwd = socket._workspacePath;

      if (!cwd && workspaceId) {
        if (socket._workspaceName) {
          // join-workspace has finished — use the name directly
          cwd = getWorkspaceDisplayPath(workspaceId, socket._workspaceName);
        } else {
          // Race condition: terminal-create arrived before join-workspace finished.
          // Look up the workspace from MongoDB to get the correct slug-based path.
          try {
            const workspace = await Workspace.findById(workspaceId);
            if (workspace) {
              // Cache on socket for future terminal creations
              socket._workspaceName = workspace.name;
              socket._workspacePath = getWorkspaceDisplayPath(workspaceId, workspace.name);
              cwd = socket._workspacePath;
            }
          } catch (lookupErr) {
            logger.warn(`[Socket] Could not lookup workspace ${workspaceId} for terminal cwd:`, lookupErr);
          }
        }
      }

      cwd = cwd || data.cwd;

      try {
        const info = terminalService.createTerminal(terminalId, { shell, cwd });
        socket._terminalIds.push(terminalId);

        // Forward output from the PTY to this socket
        _attachTerminalListeners(terminalId);

        logger.info(`[Socket] Terminal created: ${terminalId} (shell: ${info.shell}, cwd: ${info.cwd})`);
        socket.emit("terminal-created", { terminalId, shell: info.shell, cwd: info.cwd });
      } catch (err) {
        logger.error(`[Socket] Failed to create terminal ${terminalId}:`, err);
        socket.emit("terminal-error", { terminalId, error: err.message });
      }
    });

    /**
     * Write data to a terminal's stdin.
     * Payload: { terminalId: string, data: string }
     */
    socket.on("terminal-input", (data) => {
      const { terminalId, data: inputData } = data;

      if (!terminalId || inputData === undefined) {
        return;
      }

      if (!terminalService.hasTerminal(terminalId)) {
        logger.warn(`[Socket] terminal-input for unknown terminal: ${terminalId}`);
        return;
      }

      terminalService.write(terminalId, inputData);
    });

    /**
     * Resize a terminal.
     * Payload: { terminalId: string, cols: number, rows: number }
     */
    socket.on("terminal-resize", (data) => {
      const { terminalId, cols, rows } = data;
      if (terminalId && cols && rows) {
        terminalService.resize(terminalId, cols, rows);
      }
    });

    /**
     * Clear a terminal's buffer.
     * Payload: { terminalId: string }
     */
    socket.on("terminal-clear", (data) => {
      const { terminalId } = data;
      if (terminalId && terminalService.hasTerminal(terminalId)) {
        terminalService.write(terminalId, "\x1b[2J\x1b[3J\x1b[H");
        logger.info(`[Socket] Terminal cleared: ${terminalId}`);
      }
    });

    /**
     * Kill a terminal session.
     * Payload: { terminalId: string }
     */
    socket.on("terminal-kill", (data) => {
      const { terminalId } = data;
      if (terminalId) {
        const killed = terminalService.killTerminal(terminalId);
        if (killed) {
          socket._terminalIds = socket._terminalIds.filter((id) => id !== terminalId);
          logger.info(`[Socket] Terminal killed: ${terminalId}`);
        }
      }
    });

    // ── Debug Events ──

    /**
     * Start a debug session.
     * Payload: { workspaceId: string, code: string, language?: string, breakpoints?: Array<{line: number}> }
     */
    socket.on("debug-start", async (data) => {
      const { workspaceId, code, language, breakpoints } = data;
      const wid = workspaceId || socket._workspaceId;
      if (!wid || !code) {
        socket.emit("debug-error", { error: "workspaceId and code are required" });
        return;
      }

      try {
        const result = await debugService.startDebugSession({
          workspaceId: wid,
          code,
          language: language || 'javascript',
          breakpoints: breakpoints || [],
        });

        // Wire up event listeners for this debug session
        debugService.onPaused(wid, (event) => {
          socket.emit("debug-paused", event);
        });
        debugService.onResumed(wid, () => {
          socket.emit("debug-resumed");
        });
        debugService.onOutput(wid, (output) => {
          socket.emit("debug-output", output);
        });
        debugService.onError(wid, (error) => {
          socket.emit("debug-error", { error });
        });
        debugService.onExit(wid, (exitInfo) => {
          socket.emit("debug-exit", exitInfo);
        });

        socket.emit("debug-started", result);
        logger.info(`[Socket] Debug started for workspace ${wid}`);
      } catch (err) {
        logger.error('[Socket] debug-start error:', err);
        socket.emit("debug-error", { error: err.message });
      }
    });

    /**
     * Stop the debug session.
     * Payload: { workspaceId: string }
     */
    socket.on("debug-stop", (data) => {
      const workspaceId = data.workspaceId || socket._workspaceId;
      const stopped = debugService.stopDebugSession(workspaceId);
      socket.emit("debug-stopped", { workspaceId });
      logger.info(`[Socket] Debug stopped for workspace ${workspaceId}`);
    });

    /**
     * Step over in the debug session.
     */
    socket.on("debug-step-over", async (data) => {
      const workspaceId = data.workspaceId || socket._workspaceId;
      try {
        await debugService.stepOver(workspaceId);
      } catch (err) {
        socket.emit("debug-error", { error: err.message });
      }
    });

    /**
     * Step into in the debug session.
     */
    socket.on("debug-step-into", async (data) => {
      const workspaceId = data.workspaceId || socket._workspaceId;
      try {
        await debugService.stepInto(workspaceId);
      } catch (err) {
        socket.emit("debug-error", { error: err.message });
      }
    });

    /**
     * Step out of the current function in the debug session.
     */
    socket.on("debug-step-out", async (data) => {
      const workspaceId = data.workspaceId || socket._workspaceId;
      try {
        await debugService.stepOut(workspaceId);
      } catch (err) {
        socket.emit("debug-error", { error: err.message });
      }
    });

    /**
     * Continue execution from a paused state.
     */
    socket.on("debug-continue", async (data) => {
      const workspaceId = data.workspaceId || socket._workspaceId;
      try {
        await debugService.continueExecution(workspaceId);
      } catch (err) {
        socket.emit("debug-error", { error: err.message });
      }
    });

    /**
     * Get variables from the current paused debug session.
     * Works for Python (DAP scopes → variables) and C/C++ (GDB -stack-list-variables).
     */
    socket.on("debug-get-variables", async (data) => {
      const workspaceId = data.workspaceId || socket._workspaceId;
      try {
        const variables = await debugService.getVariables(workspaceId);
        socket.emit("debug-variables", { variables });
      } catch (err) {
        socket.emit("debug-error", { error: err.message });
      }
    });

    /**
     * Evaluate an expression in the current debug context (REPL).
     * Payload: { workspaceId, expression, frameId? }
     */
    socket.on("debug-evaluate", async (data) => {
      const workspaceId = data.workspaceId || socket._workspaceId;
      const { expression, frameId, evalId } = data;
      if (!expression) {
        socket.emit("debug-evaluate-result", { error: "expression is required", evalId });
        return;
      }
      try {
        const result = await debugService.evaluateExpression(workspaceId, expression, frameId);
        socket.emit("debug-evaluate-result", { ...result, evalId });
      } catch (err) {
        socket.emit("debug-evaluate-result", { error: err.message, evalId });
      }
    });

    /**
     * Get child variables for tree expansion.
     * Payload: { workspaceId, variablesReference }
     */
    socket.on("debug-get-children", async (data) => {
      const workspaceId = data.workspaceId || socket._workspaceId;
      const { variablesReference } = data;
      try {
        const children = await debugService.getChildrenVariables(workspaceId, variablesReference);
        socket.emit("debug-children", { variablesReference, children });
      } catch (err) {
        socket.emit("debug-error", { error: err.message });
      }
    });

    /**
     * Set a variable's value at runtime.
     * Payload: { workspaceId, name, value, variablesReference? }
     */
    socket.on("debug-set-variable", async (data) => {
      const workspaceId = data.workspaceId || socket._workspaceId;
      const { name, value, variablesReference } = data;
      if (!name || value === undefined) {
        socket.emit("debug-error", { error: "name and value are required" });
        return;
      }
      try {
        const result = await debugService.setVariable(workspaceId, name, value, variablesReference);
        socket.emit("debug-variable-set", { name, value, result });
      } catch (err) {
        socket.emit("debug-error", { error: err.message });
      }
    });

    /**
     * Add a conditional breakpoint.
     * Payload: { workspaceId, line, condition }
     */
    socket.on("debug-add-conditional-breakpoint", async (data) => {
      const workspaceId = data.workspaceId || socket._workspaceId;
      const { line, condition } = data;
      try {
        await debugService.addConditionalBreakpoint(workspaceId, line, condition);
        socket.emit("debug-breakpoint-added", { line, condition });
      } catch (err) {
        socket.emit("debug-error", { error: err.message });
      }
    });

    /**
     * Add a logpoint.
     * Payload: { workspaceId, line, logMessage }
     */
    socket.on("debug-add-logpoint", async (data) => {
      const workspaceId = data.workspaceId || socket._workspaceId;
      const { line, logMessage } = data;
      try {
        await debugService.addLogpoint(workspaceId, line, logMessage);
        socket.emit("debug-logpoint-added", { line, logMessage });
      } catch (err) {
        socket.emit("debug-error", { error: err.message });
      }
    });

    // ── Disconnect: clean up all terminals owned by this socket ──
    socket.on("disconnect", () => {
      const terminalIds = socket._terminalIds || [];
      if (terminalIds.length > 0) {
        logger.info(`[Socket] Cleaning up ${terminalIds.length} terminal(s) for ${socket.id}`);
        terminalIds.forEach((id) => terminalService.killTerminal(id));
      }
      logger.info(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
}
