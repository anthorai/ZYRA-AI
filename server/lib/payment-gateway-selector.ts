/**
 * Payment Gateway Selection Logic
 * Routes users to appropriate payment gateway based on their region/currency
 */

export interface GatewaySelection {
  gateway: 'razorpay' | 'paypal' | 'stripe';
  currency: string;
  displayName: string;
  icon: string;
}

/**
 * Determine the appropriate payment gateway based on currency or region
 */
export function selectPaymentGateway(currency?: string, countryCode?: string): GatewaySelection {
  // India - Razorpay (supports INR, UPI, cards, net banking)
  if (currency === 'INR' || countryCode === 'IN') {
    return {
      gateway: 'razorpay',
      currency: 'INR',
      displayName: 'Razorpay',
      icon: 'razorpay'
    };
  }

  // US/Canada/EU - Stripe (when configured, currently skipped)
  // if (['USD', 'CAD', 'EUR', 'GBP'].includes(currency || '') || ['US', 'CA', 'GB'].includes(countryCode || '')) {
  //   return {
  //     gateway: 'stripe',
  //     currency: currency || 'USD',
  //     displayName: 'Stripe',
  //     icon: 'stripe'
  //   };
  // }

  // Default - PayPal (international, supports most currencies)
  return {
    gateway: 'paypal',
    currency: currency || 'USD',
    displayName: 'PayPal',
    icon: 'paypal'
  };
}

/**
 * Get all available payment gateways for a user
 */
export function getAvailableGateways(currency?: string): GatewaySelection[] {
  const gateways: GatewaySelection[] = [];

  // Always show PayPal (international)
  gateways.push({
    gateway: 'paypal',
    currency: currency || 'USD',
    displayName: 'PayPal',
    icon: 'paypal'
  });

  // Show Razorpay for INR
  if (currency === 'INR') {
    gateways.push({
      gateway: 'razorpay',
      currency: 'INR',
      displayName: 'Razorpay',
      icon: 'razorpay'
    });
  }

  return gateways;
}

/**
 * Validate if a gateway supports a given currency
 */
export function gatewaySupportsСurrency(gateway: string, currency: string): boolean {
  switch (gateway) {
    case 'razorpay':
      return currency === 'INR';
    case 'paypal':
      // PayPal supports many currencies
      return ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'SGD', 'INR', 'JPY', 'CNY'].includes(currency);
    case 'stripe':
      // Stripe supports many currencies (when configured)
      return ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'SGD', 'INR', 'JPY'].includes(currency);
    default:
      return false;
  }
}

/**
 * Get currency symbol for display
 */
export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'INR': '₹',
    'CAD': 'C$',
    'AUD': 'A$',
    'SGD': 'S$',
    'JPY': '¥',
    'CNY': '¥'
  };
  return symbols[currency] || currency;
}

/**
 * Convert amount between currencies (basic conversion - in production use real-time rates)
 */
export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  // Basic conversion rates (in production, use real-time API)
  const rates: Record<string, number> = {
    'USD': 1,
    'INR': 83,
    'EUR': 0.92,
    'GBP': 0.79,
    'CAD': 1.35,
    'AUD': 1.52,
    'SGD': 1.34,
    'JPY': 149,
    'CNY': 7.24
  };

  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;

  return (amount / fromRate) * toRate;
}
