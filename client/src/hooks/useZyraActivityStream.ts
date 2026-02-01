import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface ZyraActivityEvent {
  id: string;
  userId: string;
  loopId: string;
  eventType: string;
  phase: 'detect' | 'decide' | 'execute' | 'prove' | 'learn' | 'standby';
  timestamp: string;
  message: string;
  detail?: string;
  metrics?: { label: string; value: string | number }[];
  progress?: number;
  status: 'info' | 'thinking' | 'insight' | 'action' | 'success' | 'warning' | 'error';
}

export interface UseZyraActivityStreamReturn {
  events: ZyraActivityEvent[];
  isConnected: boolean;
  isReconnecting: boolean;
  error: string | null;
  clearEvents: () => void;
}

export function useZyraActivityStream(): UseZyraActivityStreamReturn {
  const { session } = useAuth();
  const [events, setEvents] = useState<ZyraActivityEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);
  const isMountedRef = useRef(true);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 2000;

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  const connect = useCallback(async () => {
    if (!session?.access_token) {
      return;
    }

    // Abort existing connection
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch('/api/zyra/activity-stream', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        signal: abortController.signal,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      if (isMountedRef.current) {
        setIsConnected(true);
        setIsReconnecting(false);
        setError(null);
      }
      reconnectAttempts.current = 0;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          if (isMountedRef.current) {
            setIsConnected(false);
          }
          // Attempt reconnection on normal stream end
          if (reconnectAttempts.current < maxReconnectAttempts && isMountedRef.current) {
            const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts.current);
            setIsReconnecting(true);
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttempts.current++;
              connect();
            }, delay);
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        
        // Process complete SSE messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'connected') {
                console.log('[SSE] Server acknowledged connection');
              } else if (data.type === 'history') {
                if (data.events && Array.isArray(data.events) && isMountedRef.current) {
                  setEvents(data.events);
                }
              } else if (data.type === 'activity') {
                if (isMountedRef.current) {
                  setEvents(prev => {
                    const newEvents = [...prev, data.event];
                    if (newEvents.length > 50) {
                      return newEvents.slice(-50);
                    }
                    return newEvents;
                  });
                }
              }
            } catch (parseError) {
              console.error('[SSE] Failed to parse event:', parseError);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('[SSE] Connection aborted');
        return;
      }
      
      console.error('[SSE] Connection error:', err);
      if (isMountedRef.current) {
        setIsConnected(false);
      }
      
      // Attempt reconnection
      if (reconnectAttempts.current < maxReconnectAttempts && isMountedRef.current) {
        const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts.current);
        setIsReconnecting(true);
        setError('Connection lost. Reconnecting...');
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          connect();
        }, delay);
      } else {
        setError('Unable to connect to activity stream');
        setIsReconnecting(false);
      }
    }
  }, [session?.access_token]);

  // Store connect in a ref to avoid dependency issues
  const connectRef = useRef(connect);
  connectRef.current = connect;
  const hasConnectedRef = useRef(false);
  
  // Single effect that handles connection based on token availability
  useEffect(() => {
    isMountedRef.current = true;
    
    if (session?.access_token && !hasConnectedRef.current) {
      hasConnectedRef.current = true;
      connectRef.current();
    }

    return () => {
      const wasConnected = hasConnectedRef.current;
      isMountedRef.current = false;
      
      if (wasConnected) {
        hasConnectedRef.current = false;
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      }
    };
  }, [session?.access_token]);

  return {
    events,
    isConnected,
    isReconnecting,
    error,
    clearEvents,
  };
}
