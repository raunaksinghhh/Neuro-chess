/**
 * workerEngine.js
 * Provides a simple promise-based API over the chess.worker Web Worker.
 * The worker runs on a separate OS thread — the main thread is NEVER blocked.
 *
 * Usage:
 *   import { workerEngine } from './workerEngine';
 *   const result = await workerEngine.search(fen, depth, persona);
 */

import ChessWorker from './chess.worker.js?worker';

class WorkerEngine {
  constructor() {
    this._worker = null;
    this._pending = null; // { resolve, reject }
    this._init();
  }

  _init() {
    this._worker = new ChessWorker();
    this._worker.onmessage = (e) => {
      if (this._pending) {
        this._pending.resolve(e.data);
        this._pending = null;
      }
    };
    this._worker.onerror = (err) => {
      console.error('[WorkerEngine] error:', err);
      if (this._pending) {
        this._pending.reject(err);
        this._pending = null;
      }
    };
  }

  /**
   * Run a search. If another search is in-flight, it is abandoned (no result returned).
   * @param {string} fen      - Current board FEN
   * @param {number} depth    - Search depth (will be capped at 3 in the worker)
   * @param {object} persona  - AI persona config { blunderChance, randomness }
   * @param {number} multiPV  - Number of top lines to return
   * @returns {Promise<object>} Search result with bestMove, score, lines, nodes, nps
   */
  search(fen, depth = 3, persona = {}, multiPV = 3) {
    // Abandon any pending search (user already made a move / new position)
    if (this._pending) {
      this._pending.resolve(null); // resolve with null so callers skip gracefully
      this._pending = null;
    }

    return new Promise((resolve, reject) => {
      this._pending = { resolve, reject };
      this._worker.postMessage({ fen, depth, persona, multiPV });
    });
  }

  /** Terminate and re-create the worker (used on unmount / reset) */
  terminate() {
    if (this._pending) {
      this._pending.resolve(null);
      this._pending = null;
    }
    this._worker?.terminate();
    this._worker = null;
  }
}

// Singleton — one worker shared by the whole app
export const workerEngine = new WorkerEngine();
