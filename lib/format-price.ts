/** Format price in Indian Rupees (₹) with Indian number formatting */
export function formatPrice(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
