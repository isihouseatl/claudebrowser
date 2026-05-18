// src/cdp/client.ts
import CDP from 'chrome-remote-interface';

export class CdpClient {
  readonly port: number;
  private _client: CDP.Client | null = null;

  constructor(port: number) {
    this.port = port;
  }

  isConnected(): boolean {
    return this._client !== null;
  }

  async connect(targetId?: string): Promise<void> {
    if (this._client) return;
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
