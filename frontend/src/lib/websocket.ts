import { WebSocketMessage } from "@/types";

export class TrafficWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private url: string;
  private channel: string;
  private token: string;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private intentionalDisconnect = false;

  constructor(channel: string, token: string) {
    this.channel = channel;
    this.token = token;
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
    this.url = `${wsUrl}/ws/${channel}?token=${token}`;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) return;
    
    this.intentionalDisconnect = false;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log(`WebSocket connected to channel: ${this.channel}`);
      this.reconnectAttempts = 0;
      this._emit('connect', null);
    };

    this.ws.onmessage = this._handleMessage.bind(this);

    this.ws.onclose = () => {
      console.log(`WebSocket disconnected from channel: ${this.channel}`);
      this._emit('disconnect', null);
      if (!this.intentionalDisconnect) {
        this._reconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error(`WebSocket error on channel ${this.channel}:`, error);
    };
  }

  disconnect(): void {
    this.intentionalDisconnect = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: (data: any) => void): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback);
    }
  }

  send(type: string, data: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    } else {
      console.warn('Cannot send message, WebSocket is not open');
    }
  }

  private _reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Max reconnect attempts reached for channel ${this.channel}`);
      return;
    }

    setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`Reconnecting to channel ${this.channel} (Attempt ${this.reconnectAttempts})...`);
      this.connect();
    }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1));
  }

  private _handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      this._emit(message.type, message);
      this._emit('message', message);
    } catch (err) {
      console.error('Failed to parse WebSocket message:', err);
    }
  }

  private _emit(event: string, data: any): void {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(cb => cb(data));
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export function createWebSocket(channel: string, token: string): TrafficWebSocket {
  return new TrafficWebSocket(channel, token);
}

export const wsChannels = {
  DASHBOARD: 'dashboard',
  CAMERA: (id: string) => `camera/${id}`,
  ALERTS: 'alerts',
  SIGNALS: 'signals'
};
