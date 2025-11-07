import { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      console.log('📶 Network status: ONLINE');
      setIsOnline(true);
      
      if (wasOffline) {
        setShowOfflineBanner(true);
        setTimeout(() => setShowOfflineBanner(false), 5000);
        
        window.location.reload();
      }
      setWasOffline(false);
    };

    const handleOffline = () => {
      console.log('📵 Network status: OFFLINE');
      setIsOnline(false);
      setWasOffline(true);
      setShowOfflineBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  if (!showOfflineBanner) {
    return null;
  }

  return (
    <div 
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
      role="status"
      aria-live="polite"
      data-testid="network-status-banner"
    >
      <Alert 
        className={`border ${
          isOnline 
            ? 'bg-green-950/90 border-green-800 text-green-100' 
            : 'bg-orange-950/90 border-orange-800 text-orange-100'
        } backdrop-blur-sm shadow-lg`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-400" aria-hidden="true" />
            ) : (
              <WifiOff className="h-5 w-5 text-orange-400" aria-hidden="true" />
            )}
            <AlertDescription className="font-medium">
              {isOnline ? (
                <>
                  <span className="font-semibold">Back Online</span>
                  <span className="text-sm ml-2 opacity-90">Reconnected to the internet</span>
                </>
              ) : (
                <>
                  <span className="font-semibold">You're Offline</span>
                  <span className="text-sm ml-2 opacity-90">Some features may be limited</span>
                </>
              )}
            </AlertDescription>
          </div>
          {!isOnline && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.reload()}
              className="text-orange-100 hover:text-orange-50 hover:bg-orange-900/50"
              data-testid="button-retry-connection"
              aria-label="Retry connection"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </Alert>
    </div>
  );
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
