import { EventEmitter } from 'events';

export type ZyraEventType = 
  | 'LOOP_STARTED'
  | 'DETECT_STARTED'
  | 'DETECT_PROGRESS'
  | 'DETECT_COMPLETED'
  | 'DECIDE_STARTED'
  | 'DECIDE_COMPLETED'
  | 'EXECUTE_STARTED'
  | 'EXECUTE_PROGRESS'
  | 'EXECUTE_COMPLETED'
  | 'PROVE_STARTED'
  | 'PROVE_UPDATED'
  | 'LEARN_STARTED'
  | 'LEARN_COMPLETED'
  | 'LOOP_COMPLETED'
  | 'LOOP_STANDBY'
  | 'ERROR';

export interface ZyraActivityEvent {
  id: string;
  userId: string;
  loopId: string;
  eventType: ZyraEventType;
  phase: 'detect' | 'decide' | 'execute' | 'prove' | 'learn' | 'standby';
  timestamp: Date;
  message: string;
  detail?: string;
  metrics?: { label: string; value: string | number }[];
  progress?: number;
  status: 'info' | 'thinking' | 'insight' | 'action' | 'success' | 'warning' | 'error';
}

class ZyraEventEmitterClass extends EventEmitter {
  private userConnections: Map<string, Set<(event: ZyraActivityEvent) => void>> = new Map();
  private eventHistory: Map<string, ZyraActivityEvent[]> = new Map();
  private maxHistoryPerUser = 50;

  constructor() {
    super();
    this.setMaxListeners(100);
  }

  subscribe(userId: string, callback: (event: ZyraActivityEvent) => void): () => void {
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(callback);

    return () => {
      const connections = this.userConnections.get(userId);
      if (connections) {
        connections.delete(callback);
        if (connections.size === 0) {
          this.userConnections.delete(userId);
        }
      }
    };
  }

  emitActivity(event: Omit<ZyraActivityEvent, 'id' | 'timestamp'>): void {
    const fullEvent: ZyraActivityEvent = {
      ...event,
      id: `${event.loopId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    if (!this.eventHistory.has(event.userId)) {
      this.eventHistory.set(event.userId, []);
    }
    const history = this.eventHistory.get(event.userId)!;
    history.push(fullEvent);
    if (history.length > this.maxHistoryPerUser) {
      history.shift();
    }

    const connections = this.userConnections.get(event.userId);
    if (connections) {
      connections.forEach(callback => {
        try {
          callback(fullEvent);
        } catch (err) {
          console.error('[ZyraEventEmitter] Error in callback:', err);
        }
      });
    }

    this.emit('activity', fullEvent);
  }

  getRecentEvents(userId: string, limit = 20): ZyraActivityEvent[] {
    const history = this.eventHistory.get(userId) || [];
    return history.slice(-limit);
  }

  clearUserHistory(userId: string): void {
    this.eventHistory.delete(userId);
  }

  getConnectionCount(userId: string): number {
    return this.userConnections.get(userId)?.size || 0;
  }
}

export const ZyraEventEmitter = new ZyraEventEmitterClass();

export function emitZyraActivity(
  userId: string,
  loopId: string,
  eventType: ZyraEventType,
  message: string,
  options: {
    phase?: ZyraActivityEvent['phase'];
    detail?: string;
    metrics?: { label: string; value: string | number }[];
    progress?: number;
    status?: ZyraActivityEvent['status'];
  } = {}
): void {
  const phaseMap: Record<ZyraEventType, ZyraActivityEvent['phase']> = {
    'LOOP_STARTED': 'detect',
    'DETECT_STARTED': 'detect',
    'DETECT_PROGRESS': 'detect',
    'DETECT_COMPLETED': 'detect',
    'DECIDE_STARTED': 'decide',
    'DECIDE_COMPLETED': 'decide',
    'EXECUTE_STARTED': 'execute',
    'EXECUTE_PROGRESS': 'execute',
    'EXECUTE_COMPLETED': 'execute',
    'PROVE_STARTED': 'prove',
    'PROVE_UPDATED': 'prove',
    'LEARN_STARTED': 'learn',
    'LEARN_COMPLETED': 'learn',
    'LOOP_COMPLETED': 'standby',
    'LOOP_STANDBY': 'standby',
    'ERROR': 'standby',
  };

  const statusMap: Record<ZyraEventType, ZyraActivityEvent['status']> = {
    'LOOP_STARTED': 'info',
    'DETECT_STARTED': 'info',
    'DETECT_PROGRESS': 'thinking',
    'DETECT_COMPLETED': 'insight',
    'DECIDE_STARTED': 'thinking',
    'DECIDE_COMPLETED': 'action',
    'EXECUTE_STARTED': 'action',
    'EXECUTE_PROGRESS': 'action',
    'EXECUTE_COMPLETED': 'success',
    'PROVE_STARTED': 'thinking',
    'PROVE_UPDATED': 'insight',
    'LEARN_STARTED': 'thinking',
    'LEARN_COMPLETED': 'success',
    'LOOP_COMPLETED': 'success',
    'LOOP_STANDBY': 'info',
    'ERROR': 'error',
  };

  ZyraEventEmitter.emitActivity({
    userId,
    loopId,
    eventType,
    phase: options.phase || phaseMap[eventType],
    message,
    detail: options.detail,
    metrics: options.metrics,
    progress: options.progress,
    status: options.status || statusMap[eventType],
  });
}
