"use client";

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';

export interface StreamEvent {
  type: string;
  data?: any;
  [key: string]: any;
}

export function useEventStream() {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const eventHandlersRef = useRef<Map<string, (event: StreamEvent) => void>>(new Map());

  const connect = () => {
    if (!session?.user || eventSourceRef.current) return;

    try {
      const eventSource = new EventSource('/api/events');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('📡 EventStream connected');
        setIsConnected(true);
        
        // Clear any pending reconnection
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as StreamEvent;
          console.log('📨 EventStream - Received event:', data.type, data);
          
          // Store event in history
          setEvents(prev => [...prev.slice(-49), data]); // Keep last 50 events
          
          // Call specific handler if registered
          const handler = eventHandlersRef.current.get(data.type);
          if (handler) {
            console.log('📨 EventStream - Calling handler for:', data.type);
            handler(data);
          } else {
            console.log('📨 EventStream - No handler found for:', data.type);
          }
        } catch (error) {
          console.error('Error parsing event data:', error, 'Raw data:', event.data);
        }
      };

      eventSource.onerror = (error) => {
        console.error('📡 EventStream error:', error);
        setIsConnected(false);
        
        // Close current connection
        eventSource.close();
        eventSourceRef.current = null;
        
        // Attempt to reconnect after delay
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Attempting to reconnect...');
            connect();
          }, 3000);
        }
      };

    } catch (error) {
      console.error('Failed to create EventSource:', error);
    }
  };

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
  };

  const addEventListener = (eventType: string, handler: (event: StreamEvent) => void) => {
    eventHandlersRef.current.set(eventType, handler);
    
    // Return cleanup function
    return () => {
      eventHandlersRef.current.delete(eventType);
    };
  };

  const removeEventListener = (eventType: string) => {
    eventHandlersRef.current.delete(eventType);
  };

  // Auto-connect when session is available
  useEffect(() => {
    if (session?.user) {
      connect();
    } else {
      disconnect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [session?.user]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    events,
    addEventListener,
    removeEventListener,
    connect,
    disconnect
  };
}