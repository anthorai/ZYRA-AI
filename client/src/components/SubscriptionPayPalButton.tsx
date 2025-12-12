import { useEffect, useState, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "paypal-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

interface SubscriptionPayPalButtonProps {
  amount: string;
  currency: string;
  transactionId: string;
  planId: string;
  planName: string;
  billingPeriod?: 'monthly' | 'annual';
  onSuccess: (orderId: string) => void;
  onError: (error: any) => void;
}

export default function SubscriptionPayPalButton({
  amount,
  currency,
  transactionId,
  planId,
  planName,
  billingPeriod = 'monthly',
  onSuccess,
  onError,
}: SubscriptionPayPalButtonProps) {
  const { toast } = useToast();
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const paypalCheckoutRef = useRef<any>(null);
  const mountedRef = useRef(true);
  const initAttemptedRef = useRef(false);

  const createOrder = useCallback(async () => {
    const billingLabel = billingPeriod === 'annual' ? 'Annual Subscription (Save 20%)' : 'Monthly Subscription';
    const orderPayload = {
      amount,
      currency,
      intent: "capture",
      description: `${planName} Plan - ${billingLabel}`,
      planName,
      billingPeriod,
    };
    
    const response = await fetch("/api/paypal/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });
    
    if (!response.ok) {
      throw new Error("Failed to create PayPal order");
    }
    
    const output = await response.json();
    return { orderId: output.id };
  }, [amount, currency, planName, billingPeriod]);

  const captureOrder = useCallback(async (orderId: string) => {
    const response = await fetch(`/api/paypal/order/${orderId}/capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    
    if (!response.ok) {
      throw new Error("Failed to capture PayPal order");
    }
    
    return response.json();
  }, []);

  const onApprove = useCallback(async (data: any) => {
    console.log("PayPal payment approved", data);
    try {
      const orderData = await captureOrder(data.orderId);
      console.log("Payment captured successfully", orderData);
      onSuccess(data.orderId);
    } catch (error: any) {
      console.error("Payment capture failed:", error);
      onError(error);
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: "Failed to complete payment. Please contact support.",
      });
    }
  }, [captureOrder, onSuccess, onError, toast]);

  const onCancel = useCallback(async () => {
    setIsProcessing(false);
    toast({
      title: "Payment Cancelled",
      description: "You cancelled the payment process.",
    });
  }, [toast]);

  const onErrorHandler = useCallback(async (data: any) => {
    setIsProcessing(false);
    console.error("PayPal payment error", data);
    onError(data);
    toast({
      variant: "destructive",
      title: "Payment Error",
      description: "An error occurred during payment. Please try again.",
    });
  }, [onError, toast]);

  const handleClick = useCallback(async () => {
    if (!paypalCheckoutRef.current || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const checkoutOptionsPromise = createOrder();
      await paypalCheckoutRef.current.start(
        { paymentFlow: "auto" },
        checkoutOptionsPromise,
      );
    } catch (e) {
      console.error("PayPal checkout error:", e);
      setIsProcessing(false);
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: "Failed to start payment. Please try again.",
      });
    }
  }, [createOrder, isProcessing, toast]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (initAttemptedRef.current) return;
    initAttemptedRef.current = true;

    const initPayPal = async () => {
      try {
        const setupResponse = await fetch("/api/paypal/setup");
        if (!setupResponse.ok) {
          console.error("PayPal setup failed:", setupResponse.status);
          return;
        }
        const setupData = await setupResponse.json();
        const clientToken = setupData.clientToken;

        if (!clientToken || !mountedRef.current) return;

        const isProduction = window.location.hostname !== 'localhost' && 
                            !window.location.hostname.includes('replit.dev') &&
                            !window.location.hostname.includes('127.0.0.1');
        
        const sdkUrl = isProduction
          ? "https://www.paypal.com/web-sdk/v6/core"
          : "https://www.sandbox.paypal.com/web-sdk/v6/core";

        if (!(window as any).paypal) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = sdkUrl;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("PayPal SDK failed to load"));
            document.head.appendChild(script);
          });
        }

        if (!mountedRef.current) return;

        const sdkInstance = await (window as any).paypal.createInstance({
          clientToken,
          components: ["paypal-payments"],
        });

        if (!mountedRef.current) return;

        paypalCheckoutRef.current = sdkInstance.createPayPalOneTimePaymentSession({
          onApprove,
          onCancel,
          onError: onErrorHandler,
        });

        setIsReady(true);
      } catch (e: any) {
        console.error("PayPal initialization error:", e);
      }
    };

    initPayPal();

    return () => {
      mountedRef.current = false;
    };
  }, [onApprove, onCancel, onErrorHandler]);

  return (
    <button
      id="subscription-paypal-button"
      onClick={handleClick}
      disabled={!isReady || isProcessing}
      className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      data-testid="button-paypal-checkout"
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Processing...
        </>
      ) : !isReady ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading PayPal...
        </>
      ) : (
        <>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.217a.773.773 0 0 1 .763-.645h6.423c2.91 0 4.893 1.795 4.463 4.473-.5 3.117-2.803 4.943-5.727 4.943H8.334l-1.258 9.349zm13.194-15.23c-.476 2.997-2.803 4.823-5.728 4.823h-2.532l-1.258 9.35h-4.606l-.633-.74 3.107-17.38a.773.773 0 0 1 .763-.645h6.423c2.91 0 4.893 1.795 4.464 4.592z"/>
          </svg>
          Pay with PayPal
        </>
      )}
    </button>
  );
}
