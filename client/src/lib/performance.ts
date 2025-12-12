/**
 * Performance Utilities for Ultra-Fast Application
 * Includes debounce, throttle, memoization, and optimization helpers
 */

// Debounce function - delays execution until after wait ms have elapsed since last call
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    
    const callNow = immediate && !timeout;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func.apply(context, args);
  };
}

// Throttle function - limits function calls to once per wait ms
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          func.apply(context, lastArgs);
          lastArgs = null;
        }
      }, wait);
    } else {
      lastArgs = args;
    }
  };
}

// Memoization with TTL (Time To Live) for caching expensive computations
export function memoizeWithTTL<T extends (...args: any[]) => any>(
  func: T,
  ttlMs: number = 60000
): T {
  const cache = new Map<string, { value: ReturnType<T>; expiry: number }>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    const now = Date.now();
    const cached = cache.get(key);
    
    if (cached && cached.expiry > now) {
      return cached.value;
    }
    
    const result = func(...args);
    cache.set(key, { value: result, expiry: now + ttlMs });
    
    // Cleanup old entries periodically
    if (cache.size > 100) {
      const entries = Array.from(cache.entries());
      entries.forEach(([k, v]) => {
        if (v.expiry <= now) cache.delete(k);
      });
    }
    
    return result;
  }) as T;
}

// Simple memoization for pure functions
export function memoize<T extends (...args: any[]) => any>(func: T): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// Request Animation Frame throttle for smooth 60fps animations
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    lastArgs = args;
    
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (lastArgs) {
          func.apply(context, lastArgs);
        }
        rafId = null;
      });
    }
  };
}

// Idle callback for non-critical work
export function scheduleIdleWork(callback: () => void, timeout = 1000): void {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 1);
  }
}

// Preload critical resources
export function preloadResource(url: string, as: 'script' | 'style' | 'image' | 'font' = 'script'): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = as;
  if (as === 'font') {
    link.crossOrigin = 'anonymous';
  }
  document.head.appendChild(link);
}

// Prefetch pages for faster navigation
export function prefetchPage(url: string): void {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  document.head.appendChild(link);
}

// Intersection Observer for lazy loading
export function createLazyLoader(
  onIntersect: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
): IntersectionObserver {
  return new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        onIntersect(entry);
      }
    });
  }, {
    rootMargin: '100px',
    threshold: 0.1,
    ...options
  });
}

// Performance timing utilities
export const perfTimer = {
  marks: new Map<string, number>(),
  
  start(label: string): void {
    this.marks.set(label, performance.now());
  },
  
  end(label: string): number {
    const start = this.marks.get(label);
    if (!start) return 0;
    
    const duration = performance.now() - start;
    this.marks.delete(label);
    
    if (import.meta.env.DEV && duration > 16) {
      console.warn(`[Perf] ${label}: ${duration.toFixed(2)}ms (exceeds 16ms frame budget)`);
    }
    
    return duration;
  }
};

// Batch DOM updates for better performance
export function batchDOMUpdates(updates: (() => void)[]): void {
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
}

// Memory-efficient event delegation
export function delegateEvent(
  container: HTMLElement,
  eventType: string,
  selector: string,
  handler: (e: Event, target: HTMLElement) => void
): () => void {
  const listener = (e: Event) => {
    const target = (e.target as HTMLElement).closest(selector);
    if (target && container.contains(target)) {
      handler(e, target as HTMLElement);
    }
  };
  
  container.addEventListener(eventType, listener, { passive: true });
  
  return () => container.removeEventListener(eventType, listener);
}

// Optimistic update helper
export function createOptimisticUpdate<T, Args extends any[]>(
  optimisticFn: (...args: Args) => T,
  asyncFn: (...args: Args) => Promise<T>,
  onError?: (error: Error, ...args: Args) => void
) {
  return async (...args: Args): Promise<T> => {
    const optimisticResult = optimisticFn(...args);
    
    try {
      return await asyncFn(...args);
    } catch (error) {
      onError?.(error as Error, ...args);
      throw error;
    }
  };
}

// Local storage cache with expiry
export const localCache = {
  set<T>(key: string, value: T, ttlMs: number = 300000): void {
    const item = {
      value,
      expiry: Date.now() + ttlMs
    };
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(item));
    } catch (e) {
      console.warn('LocalStorage cache set failed:', e);
    }
  },
  
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(`cache_${key}`);
      if (!item) return null;
      
      const parsed = JSON.parse(item);
      if (parsed.expiry < Date.now()) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }
      
      return parsed.value as T;
    } catch (e) {
      return null;
    }
  },
  
  remove(key: string): void {
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (e) {
      console.warn('LocalStorage cache remove failed:', e);
    }
  },
  
  clear(): void {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('cache_'));
      keys.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.warn('LocalStorage cache clear failed:', e);
    }
  }
};

// Session storage for temporary fast access
export const sessionCache = {
  set<T>(key: string, value: T): void {
    try {
      sessionStorage.setItem(`sc_${key}`, JSON.stringify(value));
    } catch (e) {
      console.warn('SessionStorage set failed:', e);
    }
  },
  
  get<T>(key: string): T | null {
    try {
      const item = sessionStorage.getItem(`sc_${key}`);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      return null;
    }
  },
  
  remove(key: string): void {
    try {
      sessionStorage.removeItem(`sc_${key}`);
    } catch (e) {}
  }
};

// Preload auth state from storage for instant display
export function getPreloadedAuthState() {
  return sessionCache.get<{
    isAuthenticated: boolean;
    userId?: string;
    email?: string;
  }>('auth_preload');
}

export function setPreloadedAuthState(state: {
  isAuthenticated: boolean;
  userId?: string;
  email?: string;
}) {
  sessionCache.set('auth_preload', state);
}

// Web Worker message helper for heavy computations
export function createWorkerTask<T, R>(workerFn: (data: T) => R): (data: T) => Promise<R> {
  const workerCode = `
    self.onmessage = function(e) {
      const fn = ${workerFn.toString()};
      const result = fn(e.data);
      self.postMessage(result);
    };
  `;
  
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(blob);
  
  return (data: T): Promise<R> => {
    return new Promise((resolve, reject) => {
      const worker = new Worker(workerUrl);
      
      worker.onmessage = (e) => {
        resolve(e.data);
        worker.terminate();
      };
      
      worker.onerror = (e) => {
        reject(e);
        worker.terminate();
      };
      
      worker.postMessage(data);
    });
  };
}

// Measure and report performance metrics
export function reportPerformanceMetrics(): void {
  if (!('performance' in window)) return;
  
  scheduleIdleWork(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      const metrics = {
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcp: navigation.connectEnd - navigation.connectStart,
        ttfb: navigation.responseStart - navigation.requestStart,
        download: navigation.responseEnd - navigation.responseStart,
        domInteractive: navigation.domInteractive - navigation.fetchStart,
        domComplete: navigation.domComplete - navigation.fetchStart,
        load: navigation.loadEventEnd - navigation.fetchStart
      };
      
      if (import.meta.env.DEV) {
        console.log('[Performance Metrics]', metrics);
      }
    }
  });
}
