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
    this._pending = null; // { resolve, reject, reqId }
    this._reqSeq = 0;
    this._init();
  }

  _init() {
    this._worker = new ChessWorker();
    this._worker.onmessage = (e) => {
      if (this._pending && (!e.data.reqId || e.data.reqId === this._pending.reqId)) {
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
   * Run a search. If another search is in-flight, it is abandoned immediately.
   * @param {string} fen      - Current board FEN
   * @param {number} depth    - Search depth (will be capped at 3 in the worker)
   * @param {object} persona  - AI persona config { blunderChance, randomness }
   * @param {number} multiPV  - Number of top lines to return
   * @returns {Promise<object>} Search result with bestMove, score, lines, nodes, nps
   */
  search(fen, depth = 3, persona = {}, multiPV = 3) {
    const reqId = ++this._reqSeq;

    // Abandon any pending search and terminate worker so the background thread stops calculating
    if (this._pending) {
      this._pending.resolve(null);
      this._pending = null;
      this._worker?.terminate();
      this._init();
    }

    return new Promise((resolve, reject) => {
      this._pending = { resolve, reject, reqId };
      this._worker.postMessage({ reqId, fen, depth, persona, multiPV });
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
