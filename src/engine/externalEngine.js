// External Engine Bridge (REST / WebSocket / UCI Protocol Connector)

export class ExternalEngineBridge {
  constructor(url = '') {
    this.url = url;
    this.socket = null;
    this.isConnected = false;
  }

  setUrl(url) {
    this.url = url;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
    }
  }

  async connectWebSocket() {
    if (!this.url.startsWith('ws://') && !this.url.startsWith('wss://')) return false;

    return new Promise((resolve) => {
      try {
        this.socket = new WebSocket(this.url);
        this.socket.onopen = () => {
          this.isConnected = true;
          resolve(true);
        };
        this.socket.onerror = () => {
          this.isConnected = false;
          resolve(false);
        };
        this.socket.onclose = () => {
          this.isConnected = false;
        };
      } catch (err) {
        this.isConnected = false;
        resolve(false);
      }
    });
  }

  async queryEvaluation(fen) {
    if (!this.url) return null;

    // HTTP / REST Endpoint mode
    if (this.url.startsWith('http://') || this.url.startsWith('https://')) {
      try {
        const res = await fetch(this.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fen }),
          signal: AbortSignal.timeout(3000)
        });
        if (res.ok) {
          const data = await res.json();
          return {
            bestMove: data.bestMove || data.best_move,
            score: data.score || data.eval || 0,
            depth: data.depth || 15,
            source: 'External Engine'
          };
        }
      } catch (err) {
        console.warn('External engine request failed, falling back to NeuroEngine');
      }
    }

    return null;
  }
}

export const externalEngine = new ExternalEngineBridge();
