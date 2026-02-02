import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

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

interface ZyraActivityContextValue {
  events: ZyraActivityEvent[];
  isConnected: boolean;
  isReconnecting: boolean;
  retryCount: number;
  error: string | null;
  clearEvents: () => void;
}

const ZyraActivityContext = createContext<ZyraActivityContextValue | null>(null);

export function ZyraActivityProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [events, setEvents] = useState<ZyraActivityEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);
  const isMountedRef = useRef(true);
  const isConnectingRef = useRef(false);
  const maxReconnectAttempts = 10;
  const baseReconnectDelay = 2000;

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  const connect = useCallback(async () => {
    if (!session?.access_token) {
      return;
    }

    if (isConnectingRef.current) {
      return;
    }
    isConnectingRef.current = true;

    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (e) {
        // Ignore abort errors on previous controller
      }
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    // Connection timeout - abort if no response in 10 seconds
    const connectionTimeout = setTimeout(() => {
      abortController.abort();
    }, 10000);

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
      
      // Clear the timeout since we got a response
      clearTimeout(connectionTimeout);
      
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
        setRetryCount(0);
      }
      reconnectAttempts.current = 0;
      isConnectingRef.current = false;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          if (isMountedRef.current) {
            setIsConnected(false);
          }
          isConnectingRef.current = false;
          if (reconnectAttempts.current < maxReconnectAttempts && isMountedRef.current) {
            const delay = Math.min(baseReconnectDelay * Math.pow(1.5, reconnectAttempts.current), 30000);
            setIsReconnecting(true);
            setRetryCount(reconnectAttempts.current + 1);
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttempts.current++;
              connect();
            }, delay);
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'connected') {
                // Connection acknowledged by server
                if (isMountedRef.current) {
                  setIsConnected(true);
                  setIsReconnecting(false);
                }
              } else if (data.type === 'heartbeat') {
                // Heartbeat keeps connection alive - reset reconnecting state
                if (isMountedRef.current) {
                  setIsConnected(true);
                  setIsReconnecting(false);
                  reconnectAttempts.current = 0;
                  setRetryCount(0);
                }
              } else if (data.type === 'history') {
                if (data.events && Array.isArray(data.events) && isMountedRef.current) {
                  // Filter history events to only include valid ZYRA loop phases
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
              // Ignore parse errors for heartbeats
            }
          }
        }
      }
    } catch (err: any) {
      clearTimeout(connectionTimeout);
      isConnectingRef.current = false;
      
      if (err.name === 'AbortError') {
        // Connection was aborted - try to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts && isMountedRef.current) {
          const delay = Math.min(baseReconnectDelay * Math.pow(1.5, reconnectAttempts.current), 30000);
          setIsReconnecting(true);
          setRetryCount(reconnectAttempts.current + 1);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
        return;
      }
      if (isMountedRef.current) {
        setIsConnected(false);
      }
      
      if (reconnectAttempts.current < maxReconnectAttempts && isMountedRef.current) {
        const delay = Math.min(baseReconnectDelay * Math.pow(1.5, reconnectAttempts.current), 30000);
        setIsReconnecting(true);
        setRetryCount(reconnectAttempts.current + 1);
        
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

  useEffect(() => {
    isMountedRef.current = true;
    
    if (session?.access_token) {
      // Small delay to allow React to stabilize after HMR
      connectTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current && !isConnectingRef.current) {
          connect();
        }
      }, 500);
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
    };
  }, [session?.access_token, connect]);

  return (
    <ZyraActivityContext.Provider value={{ events, isConnected, isReconnecting, retryCount, error, clearEvents }}>
      {children}
    </ZyraActivityContext.Provider>
  );
}

export function useZyraActivity(): ZyraActivityContextValue {
  const context = useContext(ZyraActivityContext);
  if (!context) {
    return {
      events: [],
      isConnected: false,
      isReconnecting: false,
      retryCount: 0,
      error: null,
      clearEvents: () => {},
    };
  }
  return context;
}
