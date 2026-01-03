/**
 * Formatting utilities
 */

import type { PriceSearchResult, SinglePrice, PriceRange } from "~/services/graphql/types";

/**
 * Format price in cents to currency string
 */
export function formatPrice(amountInCents: number, currencyCode: string = "USD"): string {
  const amount = amountInCents / 100;
  
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
}

/**
 * Get price display from search result price
 */
export function getPriceDisplay(price: PriceSearchResult, currencyCode: string): string {
  if ("value" in price) {
    // SinglePrice
    return formatPrice(price.value, currencyCode);
  } else if ("min" in price && "max" in price) {
    // PriceRange
    const minFormatted = formatPrice(price.min, currencyCode);
    const maxFormatted = formatPrice(price.max, currencyCode);
    
    if (price.min === price.max) {
      return minFormatted;
    }
    
    return `${minFormatted} - ${maxFormatted}`;
  }
  
  return "Price unavailable";
}

/**
 * Format date string
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}


