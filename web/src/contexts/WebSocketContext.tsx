import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface WebSocketMessage {
  type: 'comment' | 'vote' | 'sentiment' | 'mention' | 'reply' | 'proposal_update';
  data: any;
  timestamp: number;
}

interface WebSocketContextType {
  isConnected: boolean;
  subscribe: (event: string, callback: (data: any) => void) => void;
  unsubscribe: (event: string, callback: (data: any) => void) => void;
  sendMessage: (message: WebSocketMessage) => void;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const eventListeners = useRef<Map<string, Set<(data: any) => void>>>(new Map());
  const { toast } = useToast();
  
  // Connection state management
  const currentEndpoint = useRef<string>('');
  const hasShownFinalError = useRef(false);
  const connectionAttempts = useRef(0);
  
  const ENDPOINTS = [
    'ws://localhost:8082',                 // Local Vite dev server
    'ws://127.0.0.1:9944',                // Local development node (primary)
    'ws://localhost:9944',                 // Local development node (alternative)
    'wss://ws.pezkuwichain.io',           // Production WebSocket (fallback)
  ];

  const connect = useCallback((endpointIndex: number = 0) => {
    // If we've tried all endpoints, show error once and stop
    if (endpointIndex >= ENDPOINTS.length) {
      if (!hasShownFinalError.current) {
        console.error('❌ All WebSocket endpoints failed');
        toast({
          title: "Real-time Connection Unavailable",
          description: "Could not connect to WebSocket server. Live updates will be disabled.",
          variant: "destructive",
        });
        hasShownFinalError.current = true;
      }
      return;
    }

    try {
      const wsUrl = ENDPOINTS[endpointIndex];
      currentEndpoint.current = wsUrl;
      
      console.log(`🔌 Attempting WebSocket connection to: ${wsUrl}`);
      
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        setIsConnected(true);
        connectionAttempts.current = 0;
        hasShownFinalError.current = false;
        console.log(`✅ WebSocket connected to: ${wsUrl}`);
        
        // Only show success toast for production endpoint
        if (endpointIndex === 0) {
          toast({
            title: "Connected",
            description: "Real-time updates enabled",
          });
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          const listeners = eventListeners.current.get(message.type);
          if (listeners) {
            listeners.forEach(callback => callback(message.data));
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.warn(`⚠️ WebSocket error on ${wsUrl}:`, error);
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        console.log(`🔌 WebSocket disconnected from: ${wsUrl}`);
        
        // Try next endpoint after 2 seconds
        reconnectTimeout.current = setTimeout(() => {
          connectionAttempts.current++;
          
          // If we've been connected before and lost connection, try same endpoint first
          if (connectionAttempts.current < 3) {
            connect(endpointIndex);
          } else {
            // Try next endpoint in the list
            connect(endpointIndex + 1);
            connectionAttempts.current = 0;
          }
        }, 2000);
      };
    } catch (error) {
      console.error(`❌ Failed to create WebSocket connection to ${ENDPOINTS[endpointIndex]}:`, error);
      // Try next endpoint immediately
      setTimeout(() => connect(endpointIndex + 1), 1000);
    }
  }, [toast]);

  useEffect(() => {
    connect(0); // Start with first endpoint

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    if (!eventListeners.current.has(event)) {
      eventListeners.current.set(event, new Set());
    }
    eventListeners.current.get(event)?.add(callback);
  }, []);

  const unsubscribe = useCallback((event: string, callback: (data: any) => void) => {
    eventListeners.current.get(event)?.delete(callback);
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected - message queued');
    }
  }, []);

  const reconnect = useCallback(() => {
    if (ws.current) {
      ws.current.close();
    }
    hasShownFinalError.current = false;
    connectionAttempts.current = 0;
    connect(0); // Start from first endpoint again
  }, [connect]);

  return (
    <WebSocketContext.Provider value={{ isConnected, subscribe, unsubscribe, sendMessage, reconnect }}>
      {children}
    </WebSocketContext.Provider>
  );
};