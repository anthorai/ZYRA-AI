import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as currency using the specified currency code
 * Supports all major currencies (USD, INR, EUR, GBP, etc.)
 * 
 * @param amount - The numeric amount to format
 * @param currencyCode - ISO 4217 currency code (e.g., 'USD', 'INR', 'EUR')
 * @param locale - Optional locale for number formatting (defaults to 'en-US')
 * @returns Formatted currency string (e.g., '$1,234.56', '₹1,234.56', '€1.234,56')
 */
export function formatCurrency(
  amount: number, 
  currencyCode: string = 'USD',
  locale: string = 'en-US'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback if currency code is invalid
    console.warn(`Invalid currency code: ${currencyCode}, falling back to USD`);
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
}

/**
 * Get the currency symbol for a given currency code
 * 
 * @param currencyCode - ISO 4217 currency code
 * @returns Currency symbol (e.g., '$', '₹', '€', '£')
 */
export function getCurrencySymbol(currencyCode: string = 'USD'): string {
  try {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(0);
    // Extract just the symbol by removing digits and spaces
    return formatted.replace(/[\d,.\s]/g, '');
  } catch (error) {
    return '$'; // Fallback to USD symbol
  }
}
