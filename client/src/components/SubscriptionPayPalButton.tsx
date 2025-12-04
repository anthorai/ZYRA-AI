import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

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
  onSuccess: (orderId: string) => void;
  onError: (error: any) => void;
}

export default function SubscriptionPayPalButton({
  amount,
  currency,
  transactionId,
  planId,
  planName,
  onSuccess,
  onError,
}: SubscriptionPayPalButtonProps) {
  const { toast } = useToast();

  const createOrder = async () => {
    try {
      const orderPayload = {
        amount: amount,
        currency: currency,
        intent: "capture",
        description: `${planName} Plan - Monthly Subscription`,
        planName: planName,
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
    } catch (error: any) {
      console.error("Create order error:", error);
      toast({
        variant: "destructive",
        title: "Payment Error",
        description: "Failed to initialize payment. Please try again.",
      });
      throw error;
    }
  };

  const captureOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/paypal/order/${orderId}/capture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to capture PayPal order");
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error("Capture order error:", error);
      throw error;
    }
  };

  const onApprove = async (data: any) => {
    console.log("✅ PayPal payment approved", data);
    try {
      // Capture the payment
      const orderData = await captureOrder(data.orderId);
      console.log("✅ Payment captured successfully", orderData);
      
      // Call success callback with the order ID
      onSuccess(data.orderId);
    } catch (error: any) {
      console.error("❌ Payment capture failed:", error);
      onError(error);
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: "Failed to complete payment. Please contact support.",
      });
    }
  };

  const onCancel = async (data: any) => {
    console.log("Payment cancelled by user", data);
    toast({
      title: "Payment Cancelled",
      description: "You cancelled the payment process.",
    });
  };

  const onErrorHandler = async (data: any) => {
    console.error("PayPal payment error", data);
    onError(data);
    toast({
      variant: "destructive",
      title: "Payment Error",
      description: "An error occurred during payment. Please try again.",
    });
  };

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let mounted = true;

    const loadPayPalSDK = async () => {
      try {
        if (!(window as any).paypal) {
          const script = document.createElement("script");
          script.src = import.meta.env.PROD
            ? "https://www.paypal.com/web-sdk/v6/core"
            : "https://www.sandbox.paypal.com/web-sdk/v6/core";
          script.async = true;
          script.onload = async () => {
            if (mounted) {
              cleanup = await initPayPal();
            }
          };
          script.onerror = () => {
            console.warn("PayPal SDK failed to load - payment will be initialized on first use");
          };
          document.body.appendChild(script);
        } else {
          cleanup = await initPayPal();
        }
      } catch (e) {
        console.warn("PayPal SDK load warning:", e);
      }
    };

    loadPayPalSDK();

    return () => {
      mounted = false;
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  const initPayPal = async () => {
    try {
      const clientToken: string = await fetch("/api/paypal/setup")
        .then((res) => res.json())
        .then((data) => data.clientToken);

      const sdkInstance = await (window as any).paypal.createInstance({
        clientToken,
        components: ["paypal-payments"],
      });

      const paypalCheckout = sdkInstance.createPayPalOneTimePaymentSession({
        onApprove,
        onCancel,
        onError: onErrorHandler,
      });

      const onClick = async () => {
        try {
          const checkoutOptionsPromise = createOrder();
          await paypalCheckout.start(
            { paymentFlow: "auto" },
            checkoutOptionsPromise,
          );
        } catch (e) {
          console.error("PayPal checkout error:", e);
          toast({
            variant: "destructive",
            title: "Payment Error",
            description: "Failed to start payment. Please try again.",
          });
        }
      };

      const paypalButton = document.getElementById("subscription-paypal-button");

      if (paypalButton) {
        paypalButton.addEventListener("click", onClick);
      }

      return () => {
        if (paypalButton) {
          paypalButton.removeEventListener("click", onClick);
        }
      };
    } catch (e) {
      console.warn("PayPal initialization pending:", e);
    }
  };

  return <paypal-button id="subscription-paypal-button"></paypal-button>;
}
