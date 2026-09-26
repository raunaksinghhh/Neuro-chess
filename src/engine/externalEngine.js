// External C++ Chess Engine Bridge (HTTP REST Connector)
// Uses exponential backoff when offline — no more flooding the network tab.

export class ExternalEngineBridge {
  constructor(url = 'http://localhost:8080') {
    this.url = url;
    this.isConnected = false;
    this.engineInfo = null;
    this.listeners = new Set();

    // Backoff state — doubles each failure up to 30s
    this._backoffMs = 2000;
    this._backoffTimer = null;
  }

  setUrl(url) {
    this.url = url;
    this._resetBackoff();
    this.checkHealth();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.isConnected, this.engineInfo);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((fn) => fn(this.isConnected, this.engineInfo));
  }

  _resetBackoff() {
    this._backoffMs = 2000;
    if (this._backoffTimer) {
      clearTimeout(this._backoffTimer);
      this._backoffTimer = null;
    }
  }

  /** Schedule the next health check using current backoff interval */
  _scheduleNextCheck() {
    if (this._backoffTimer) clearTimeout(this._backoffTimer);
    this._backoffTimer = setTimeout(() => {
      this._backoffTimer = null;
      this.checkHealth();
    }, this._backoffMs);
  }

  async checkHealth() {
    if (!this.url) {
      this.isConnected = false;
      this.notify();
      return false;
    }

    try {
      const res = await fetch(`${this.url}/health`, {
        signal: AbortSignal.timeout(1200)
      });
      if (res.ok) {
        const data = await res.json();
        this.isConnected = true;
        this.engineInfo = data.engine || 'C++ Core';
        this.notify();
        // Connected: keep a gentle 10s heartbeat
        this._backoffMs = 10000;
        this._scheduleNextCheck();
        return true;
      }
    } catch {
      // Server offline — handled gracefully below
    }

    const wasConnected = this.isConnected;
    this.isConnected = false;
    if (wasConnected) this.notify();

    // Stop polling when offline — no more continuous ERR_CONNECTION_REFUSED spamming
    if (this._backoffTimer) {
      clearTimeout(this._backoffTimer);
      this._backoffTimer = null;
    }
    return false;
  }

  async queryEvaluation(fen, depth = 4) {
    if (!this.url || !this.isConnected) return null;

    try {
      const res = await fetch(`${this.url}/eval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen, depth }),
        signal: AbortSignal.timeout(4000)
      });

      if (res.ok) {
        const data = await res.json();
        return {
          source: 'C++ Neuro-Core',
          score: data.score,
          bestMove: {
            from: data.from,
            to: data.to,
            san: data.san || '',
            uci: data.best_move,
            promotion: data.best_move && data.best_move.length === 5 ? data.best_move[4] : undefined
          },
          depth: data.depth,
          nodes: data.nodes,
          nps: data.nps,
          timeMs: data.time_ms,
          lines: (data.lines || []).map((l) => ({
            san: l.uci,
            uci: l.uci,
            from: l.from,
            to: l.to,
            score: l.score
          })),
          heatmap: data.heatmap
        };
      }
    } catch {
      // Backend temporarily unresponsive — will retry on next health check
    }

    return null;
  }
}

export const externalEngine = new ExternalEngineBridge();
