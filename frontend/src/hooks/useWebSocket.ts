import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { createWebSocket, TrafficWebSocket } from '@/lib/websocket';
import { WebSocketMessage } from '@/types';

interface UseWebSocketOptions {
  onMessage?: (msg: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  enabled?: boolean;
}

export function useWebSocket(channel: string, options: UseWebSocketOptions = {}) {
  const { accessToken } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<TrafficWebSocket | null>(null);

  useEffect(() => {
    const { enabled = true, onMessage, onConnect, onDisconnect } = options;
    
    if (!enabled || !accessToken) {
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    if (!wsRef.current) {
      wsRef.current = createWebSocket(channel, accessToken);
    }

    const ws = wsRef.current;

    const unbindConnect = ws.on('connect', () => {
      setIsConnected(true);
      onConnect?.();
    });

    const unbindDisconnect = ws.on('disconnect', () => {
      setIsConnected(false);
      onDisconnect?.();
    });

    const unbindMessage = ws.on('message', (msg: WebSocketMessage) => {
      onMessage?.(msg);
    });

    ws.connect();

    return () => {
      unbindConnect();
      unbindDisconnect();
      unbindMessage();
      ws.disconnect();
      wsRef.current = null;
    };
  }, [channel, accessToken, options.enabled]); // Only re-run if channel, token, or enabled changes

  const send = (type: string, data: any) => {
    if (wsRef.current?.isConnected) {
      wsRef.current.send(type, data);
    } else {
      console.warn('Cannot send, WebSocket not connected');
    }
  };

  return { isConnected, send };
}
