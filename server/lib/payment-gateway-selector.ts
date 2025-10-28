/**
 * Payment Gateway Selection Logic
 * ALL PAYMENTS ARE IN USD ONLY - GLOBAL PRICING
 */

export interface GatewaySelection {
  gateway: 'razorpay' | 'paypal';
  currency: string;
  displayName: string;
  icon: string;
}

/**
 * Determine the appropriate payment gateway
 * NOTE: All payments are now in USD regardless of country
 */
export function selectPaymentGateway(currency?: string, countryCode?: string): GatewaySelection {
  // All users get PayPal with USD - simplified global pricing
  return {
    gateway: 'paypal',
    currency: 'USD',
    displayName: 'PayPal',
    icon: 'paypal'
  };
}

/**
 * Get all available payment gateways for a user
 * NOTE: USD-only pricing for all countries
 */
export function getAvailableGateways(currency?: string): GatewaySelection[] {
  // Only PayPal with USD for all countries
  return [
    {
      gateway: 'paypal',
      currency: 'USD',
      displayName: 'PayPal',
      icon: 'paypal'
    }
  ];
}

/**
 * Validate if a gateway supports a given currency
 * NOTE: Only USD is supported now
 */
export function gatewaySupportsСurrency(gateway: string, currency: string): boolean {
  // Only USD is supported
  return currency === 'USD';
}

/**
 * Get currency symbol for display - always USD
 */
export function getCurrencySymbol(currency: string): string {
  // Always return USD symbol
  return '$';
}

/**
 * No currency conversion needed - all prices are in USD
 */
export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  // No conversion - everything is USD
  return amount;
}
