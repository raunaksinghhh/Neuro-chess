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

    const tryFetch = async (targetUrl) => {
      try {
        const res = await fetch(`${targetUrl}/health`, {
          signal: AbortSignal.timeout(1500)
        });
        if (res.ok) {
          const data = await res.json();
          this.url = targetUrl;
          this.isConnected = true;
          this.engineInfo = data.engine || 'C++ Core';
          this.notify();
          return true;
        }
      } catch {
        return false;
      }
      return false;
    };

    let connected = await tryFetch(this.url);

    if (!connected) {
      // Try alternate localhost variant (localhost ↔ 127.0.0.1)
      if (this.url.includes('localhost')) {
        connected = await tryFetch(this.url.replace('localhost', '127.0.0.1'));
      } else if (this.url.includes('127.0.0.1')) {
        connected = await tryFetch(this.url.replace('127.0.0.1', 'localhost'));
      }
    }

    if (connected) {
      // Connected: poll every 5s (stable, low frequency)
      this._backoffMs = 5000;
      this._scheduleNextCheck();
      return true;
    }

    // Offline: exponential backoff — 2s → 4s → 8s → 16s → 30s max
    const wasConnected = this.isConnected;
    this.isConnected = false;
    if (wasConnected) this.notify(); // Only notify on state change

    this._backoffMs = Math.min(this._backoffMs * 2, 30000);
    this._scheduleNextCheck();
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
            uci: data.best_move
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
