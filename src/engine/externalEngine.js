// External C++ Chess Engine Bridge (HTTP REST / WebSocket Connector)

export class ExternalEngineBridge {
  constructor(url = 'http://localhost:8080') {
    this.url = url;
    this.isConnected = false;
    this.engineInfo = null;
    this.listeners = new Set();
  }

  setUrl(url) {
    this.url = url;
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
        return true;
      }
    } catch {
      this.isConnected = false;
      this.notify();
      return false;
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
        signal: AbortSignal.timeout(3000)
      });

      if (res.ok) {
        const data = await res.json();
        return {
          source: 'C++ Neuro-Core',
          score: data.score,
          bestMove: {
            from: data.from,
            to: data.to,
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
    } catch (err) {
      // Backend temporarily unresponsive
    }

    return null;
  }
}

export const externalEngine = new ExternalEngineBridge();
