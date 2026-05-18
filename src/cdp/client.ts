// src/cdp/client.ts
import CDP from 'chrome-remote-interface';
import WebSocket from 'ws';

export class CdpClient {
  readonly port: number;
  private _client: CDP.Client | null = null;

  constructor(port: number) {
    this.port = port;
  }

  isConnected(): boolean {
    return this._client !== null;
  }

  // When Chrome has no open pages (idle after Playwright MCP use), create a
  // background tab via the browser-level WebSocket before connecting.
  private async ensurePageTarget(): Promise<void> {
    const targets = await CDP.List({ port: this.port });
    if (targets.some(t => t.type === 'page')) return;

    const { webSocketDebuggerUrl } = await fetch(`http://localhost:${this.port}/json/version`).then(r => r.json()) as { webSocketDebuggerUrl: string };
    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(webSocketDebuggerUrl);
      ws.on('open', () => ws.send(JSON.stringify({ id: 1, method: 'Target.createTarget', params: { url: 'about:blank' } })));
      ws.on('message', () => { ws.close(); resolve(); });
      ws.on('error', reject);
    });
    // Give Chrome a moment to register the new target
    await new Promise(r => setTimeout(r, 300));
  }

  async connect(targetId?: string): Promise<void> {
    if (this._client) return;
    if (!targetId) await this.ensurePageTarget();
    const options: CDP.Options = { port: this.port };
    if (targetId) options.target = targetId;
    this._client = await CDP(options);

    await this._client.Page.enable();
    await this._client.DOM.enable();
    await this._client.Network.enable();
    await this._client.Runtime.enable();
    await this._client.Accessibility.enable();

    this._client.on('disconnect', () => { this._client = null; });
  }

  async disconnect(): Promise<void> {
    if (this._client) {
      await this._client.close();
      this._client = null;
    }
  }

  get raw(): CDP.Client {
    if (!this._client) throw new Error('CDP client not connected. Call connect() first.');
    return this._client;
  }

  async listTargets(): Promise<CDP.Target[]> {
    return CDP.List({ port: this.port });
  }

  async getActiveTarget(): Promise<CDP.Target | undefined> {
    const targets = await this.listTargets();
    return targets.find(t => t.type === 'page');
  }
}
