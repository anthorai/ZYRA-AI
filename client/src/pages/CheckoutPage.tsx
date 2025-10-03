import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CreditCard, Smartphone, Building2, Wallet, Globe } from "lucide-react";
import { SiPaypal, SiRazorpay } from "react-icons/si";
import PayPalButton from "@/components/PayPalButton";

const checkoutSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  gateway: z.enum(["razorpay", "paypal"]),
  currency: z.string().default("INR"),
  description: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayOrderId, setRazorpayOrderId] = useState<string | null>(null);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      amount: "",
      gateway: "razorpay",
      currency: "INR",
      description: "",
    },
  });

  const gateway = form.watch("gateway");
  const amount = form.watch("amount");

  // Create Razorpay order
  const createRazorpayOrder = useMutation({
    mutationFn: async (data: CheckoutFormData) => {
      const response: any = await apiRequest("POST", "/api/payments/razorpay/create-order", {
        amount: parseFloat(data.amount),
        currency: data.currency,
        receipt: `receipt_${Date.now()}`,
        notes: { description: data.description || "Zyra subscription" },
      });
      return response;
    },
    onSuccess: (data: any) => {
      setRazorpayOrderId(data.orderId);
      loadRazorpayCheckout(data);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Order creation failed",
        description: error.message,
      });
      setIsProcessing(false);
    },
  });

  // Verify Razorpay payment
  const verifyRazorpayPayment = useMutation({
    mutationFn: async (paymentData: any) => {
      return apiRequest("POST", "/api/payments/razorpay/verify", paymentData);
    },
    onSuccess: () => {
      toast({
        title: "Payment successful!",
        description: "Your payment has been processed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payments/transactions"] });
      setTimeout(() => navigate("/payments"), 1500);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Payment verification failed",
        description: error.message,
      });
      setIsProcessing(false);
    },
  });

  // Load Razorpay SDK dynamically
  const loadRazorpayCheckout = async (orderData: any) => {
    try {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_dummy",
          amount: orderData.amount,
          currency: orderData.currency,
          name: "Zyra",
          description: form.getValues("description") || "Zyra subscription",
          order_id: orderData.orderId,
          handler: function (response: any) {
            verifyRazorpayPayment.mutate({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
          },
          prefill: {
            name: "Customer",
            email: "customer@example.com",
          },
          theme: {
            color: "#0ea5e9",
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
              toast({
                variant: "destructive",
                title: "Payment cancelled",
                description: "You cancelled the payment process.",
              });
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      };

      script.onerror = () => {
        setIsProcessing(false);
        toast({
          variant: "destructive",
          title: "Failed to load Razorpay",
          description: "Please try again later.",
        });
      };
    } catch (error: any) {
      setIsProcessing(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const onSubmit = async (data: CheckoutFormData) => {
    setIsProcessing(true);

    try {
      if (data.gateway === "razorpay") {
        createRazorpayOrder.mutate(data);
      } else if (data.gateway === "paypal") {
        // PayPal handled by PayPalButton component below
        toast({
          title: "Click PayPal button",
          description: "Please use the PayPal button below to complete payment.",
        });
        setIsProcessing(false);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: error.message,
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-checkout-title">Secure Checkout</h1>
        <p className="text-muted-foreground" data-testid="text-checkout-subtitle">
          Choose your preferred payment method and complete your purchase
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Payment Form */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>Select your payment method and enter the amount</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Amount Input */}
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Enter amount"
                            data-testid="input-amount"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Currency Selection */}
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="flex gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="INR" id="inr" data-testid="radio-currency-inr" />
                              <label htmlFor="inr" className="cursor-pointer">INR (₹)</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="USD" id="usd" data-testid="radio-currency-usd" />
                              <label htmlFor="usd" className="cursor-pointer">USD ($)</label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="What is this payment for?"
                            data-testid="input-description"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  {/* Payment Gateway Selection */}
                  <FormField
                    control={form.control}
                    name="gateway"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={field.onChange}
                            className="space-y-3"
                          >
                            {/* Razorpay */}
                            <Card
                              className={`cursor-pointer transition-all ${
                                field.value === "razorpay" ? "border-primary ring-2 ring-primary" : ""
                              }`}
                              onClick={() => field.onChange("razorpay")}
                              data-testid="card-gateway-razorpay"
                            >
                              <CardContent className="flex items-center p-4">
                                <RadioGroupItem value="razorpay" id="razorpay" className="mr-3" />
                                <SiRazorpay className="text-2xl text-blue-600 mr-3" />
                                <div className="flex-1">
                                  <label htmlFor="razorpay" className="font-semibold cursor-pointer">
                                    Razorpay
                                  </label>
                                  <p className="text-sm text-muted-foreground">
                                    UPI, Cards, NetBanking, Wallets
                                  </p>
                                  <div className="flex gap-2 mt-1">
                                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <Wallet className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            {/* PayPal */}
                            <Card
                              className={`cursor-pointer transition-all ${
                                field.value === "paypal" ? "border-primary ring-2 ring-primary" : ""
                              }`}
                              onClick={() => field.onChange("paypal")}
                              data-testid="card-gateway-paypal"
                            >
                              <CardContent className="flex items-center p-4">
                                <RadioGroupItem value="paypal" id="paypal" className="mr-3" />
                                <SiPaypal className="text-2xl text-blue-500 mr-3" />
                                <div className="flex-1">
                                  <label htmlFor="paypal" className="font-semibold cursor-pointer">
                                    PayPal
                                  </label>
                                  <p className="text-sm text-muted-foreground">
                                    International payments
                                  </p>
                                  <div className="flex gap-2 mt-1">
                                    <Globe className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            {/* Stripe (Coming Soon) */}
                            <Card className="cursor-not-allowed opacity-50" data-testid="card-gateway-stripe">
                              <CardContent className="flex items-center p-4">
                                <RadioGroupItem value="stripe" id="stripe" className="mr-3" disabled />
                                <CreditCard className="text-2xl text-purple-600 mr-3" />
                                <div className="flex-1">
                                  <label htmlFor="stripe" className="font-semibold">
                                    Stripe <span className="text-sm text-muted-foreground">(Coming Soon)</span>
                                  </label>
                                  <p className="text-sm text-muted-foreground">
                                    Cards and digital wallets
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit Button for Razorpay */}
                  {gateway === "razorpay" && (
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isProcessing}
                      data-testid="button-pay-razorpay"
                    >
                      {isProcessing ? "Processing..." : `Pay ₹${amount || "0"} with Razorpay`}
                    </Button>
                  )}

                  {/* PayPal Button */}
                  {gateway === "paypal" && amount && (
                    <div className="w-full">
                      <PayPalButton
                        amount={amount}
                        currency={form.getValues("currency")}
                        onSuccess={(details: any) => {
                          toast({
                            title: "Payment successful!",
                            description: "Your PayPal payment has been processed.",
                          });
                          setTimeout(() => navigate("/payments"), 1500);
                        }}
                        onError={(error: any) => {
                          toast({
                            variant: "destructive",
                            title: "Payment failed",
                            description: error.message,
                          });
                        }}
                      />
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="md:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span data-testid="text-subtotal">
                  {form.getValues("currency") === "INR" ? "₹" : "$"}
                  {amount || "0.00"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span data-testid="text-tax">$0.00</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span data-testid="text-total">
                  {form.getValues("currency") === "INR" ? "₹" : "$"}
                  {amount || "0.00"}
                </span>
              </div>

              {/* Security Badges */}
              <div className="pt-4 space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <svg
                    className="h-4 w-4 mr-2 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  PCI-DSS Compliant
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <svg
                    className="h-4 w-4 mr-2 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  256-bit SSL Encryption
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <svg
                    className="h-4 w-4 mr-2 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  No card details stored
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
