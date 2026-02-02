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
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const staleCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectAttempts = useRef(0);
  const isMountedRef = useRef(true);
  const lastEventTimeRef = useRef<number>(Date.now());
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 2000;
  const STALE_THRESHOLD_MS = 15000; // Show reconnecting if no events in 15s

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
              
              // Update last event time for ANY event received
              lastEventTimeRef.current = Date.now();
              
              if (data.type === 'connected') {
                // Connection acknowledged by server - immediately show Live
                if (isMountedRef.current) {
                  setIsConnected(true);
                  setIsReconnecting(false);
                  reconnectAttempts.current = 0;
                  setError(null);
                }
              } else if (data.type === 'heartbeat') {
                // Heartbeat keeps connection alive - reset reconnecting state
                if (isMountedRef.current) {
                  setIsConnected(true);
                  setIsReconnecting(false);
                  reconnectAttempts.current = 0;
                  setError(null);
                }
              } else if (data.type === 'history') {
                if (data.events && Array.isArray(data.events) && isMountedRef.current) {
                  // Filter events to only show valid ZYRA loop phases
                  const validEvents = data.events.filter((e: any) => 
                    e.phase && ['detect', 'decide', 'execute', 'prove', 'learn', 'standby'].includes(e.phase)
                  );
                  setEvents(validEvents);
                }
              } else if (data.type === 'activity') {
                if (isMountedRef.current) {
                  // Only add events with valid ZYRA loop phases
                  const event = data.event;
                  if (event.phase && ['detect', 'decide', 'execute', 'prove', 'learn', 'standby'].includes(event.phase)) {
                    setEvents(prev => {
                      const newEvents = [...prev, event];
                      if (newEvents.length > 50) {
                        return newEvents.slice(-50);
                      }
                      return newEvents;
                    });
                  }
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
  
  // Single effect that handles connection based on token availability
  useEffect(() => {
    isMountedRef.current = true;
    
    if (session?.access_token) {
      // Small delay to avoid rapid connect/disconnect on fast remounts
      connectTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          connectRef.current();
        }
      }, 100);
      
      // Check for stale connection every 5 seconds
      // Only show "Reconnecting" if no events received in 15 seconds
      staleCheckIntervalRef.current = setInterval(() => {
        if (isMountedRef.current && isConnected && !isReconnecting) {
          const timeSinceLastEvent = Date.now() - lastEventTimeRef.current;
          if (timeSinceLastEvent > STALE_THRESHOLD_MS) {
            // Connection might be stale - trigger reconnect
            // Set states in correct order to ensure mutual exclusivity
            setIsConnected(false);
            setIsReconnecting(true);
            lastEventTimeRef.current = Date.now(); // Reset to prevent repeated triggers
            if (abortControllerRef.current) {
              abortControllerRef.current.abort();
            }
          }
        }
      }, 5000);
    }
    
    return () => {
      isMountedRef.current = false;
      
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (staleCheckIntervalRef.current) {
        clearInterval(staleCheckIntervalRef.current);
      }
    };
  }, [session?.access_token, isConnected, isReconnecting]);

  return {
    events,
    isConnected,
    isReconnecting,
    error,
    clearEvents,
  };
}
