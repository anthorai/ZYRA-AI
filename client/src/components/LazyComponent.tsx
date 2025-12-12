/**
 * Lazy Loading Component Wrapper
 * Provides instant skeleton loading with deferred component loading
 */

import { Suspense, lazy, ComponentType, useState, useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyComponentProps {
  fallback?: React.ReactNode;
  className?: string;
  minHeight?: string;
}

// Default skeleton loader
function DefaultSkeleton({ minHeight = '200px', className = '' }: { minHeight?: string; className?: string }) {
  return (
    <div className={`space-y-4 p-4 ${className}`} style={{ minHeight }}>
      <Skeleton className="h-8 w-1/3 skeleton-pulse" />
      <Skeleton className="h-4 w-full skeleton-pulse" />
      <Skeleton className="h-4 w-2/3 skeleton-pulse" />
      <div className="grid grid-cols-2 gap-4 mt-4">
        <Skeleton className="h-24 skeleton-pulse" />
        <Skeleton className="h-24 skeleton-pulse" />
      </div>
    </div>
  );
}

// Create a lazy loaded component with intersection observer
export function createLazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options?: LazyComponentProps
) {
  const LazyComp = lazy(importFn);
  
  return function LazyWrapper(props: P) {
    const [shouldLoad, setShouldLoad] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
      const element = containerRef.current;
      if (!element) return;
      
      // Load immediately if in viewport
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
          }
        },
        { rootMargin: '200px' } // Start loading 200px before entering viewport
      );
      
      observer.observe(element);
      
      // Also load after a short delay as fallback
      const timer = setTimeout(() => setShouldLoad(true), 100);
      
      return () => {
        observer.disconnect();
        clearTimeout(timer);
      };
    }, []);
    
    const fallback = options?.fallback || (
      <DefaultSkeleton 
        minHeight={options?.minHeight} 
        className={options?.className} 
      />
    );
    
    return (
      <div ref={containerRef} className="fade-in">
        {shouldLoad ? (
          <Suspense fallback={fallback}>
            <LazyComp {...props} />
          </Suspense>
        ) : (
          fallback
        )}
      </div>
    );
  };
}

// Pre-configured lazy loaders for common use cases
export const LazyCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`fade-in gpu-accelerated ${className}`}>
    {children}
  </div>
);

// Deferred content - renders after main content
export function DeferredContent({ 
  children, 
  delay = 50 
}: { 
  children: React.ReactNode; 
  delay?: number 
}) {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  
  if (!show) return null;
  
  return <div className="fade-in">{children}</div>;
}

// Visibility-based rendering
export function VisibilityAware({ 
  children, 
  placeholder,
  rootMargin = '100px'
}: { 
  children: React.ReactNode; 
  placeholder?: React.ReactNode;
  rootMargin?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    
    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin]);
  
  return (
    <div ref={ref} className="content-visibility-auto">
      {isVisible ? children : (placeholder || <DefaultSkeleton />)}
    </div>
  );
}

// Progressive loading for lists
export function ProgressiveList<T>({ 
  items, 
  renderItem,
  batchSize = 10,
  className = ''
}: { 
  items: T[]; 
  renderItem: (item: T, index: number) => React.ReactNode;
  batchSize?: number;
  className?: string;
}) {
  const [loadedCount, setLoadedCount] = useState(batchSize);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element || loadedCount >= items.length) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setLoadedCount(prev => Math.min(prev + batchSize, items.length));
        }
      },
      { rootMargin: '200px' }
    );
    
    observer.observe(element);
    return () => observer.disconnect();
  }, [loadedCount, items.length, batchSize]);
  
  return (
    <div className={className}>
      {items.slice(0, loadedCount).map((item, index) => (
        <div key={index} className="fade-in" style={{ animationDelay: `${index * 20}ms` }}>
          {renderItem(item, index)}
        </div>
      ))}
      {loadedCount < items.length && (
        <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
          <div className="skeleton-pulse h-8 w-8 rounded-full" />
        </div>
      )}
    </div>
  );
}
