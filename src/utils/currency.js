/**
 * Utility function to ensure rupee symbol is always present in money values
 * @param {string|number} value - The money value (can be string with or without symbol, or number)
 * @returns {string} - Formatted value with rupee symbol
 */
export function formatRupees(value) {
  if (!value || value === 'N/A') return 'N/A';
  
  // Convert to string if it's a number
  let valueStr = String(value);
  
  // Remove any existing currency symbols (₹, $, USD, INR, etc.)
  valueStr = valueStr.replace(/[₹$]|USD|INR/gi, '').trim();
  
  // Remove commas and spaces for parsing
  const cleanValue = valueStr.replace(/[, ]/g, '');
  
  // Try to parse as number
  const numValue = parseFloat(cleanValue);
  
  if (isNaN(numValue)) {
    // If it's not a number, just add rupee symbol if not present
    if (!valueStr.includes('₹')) {
      return `₹${valueStr}`;
    }
    return valueStr;
  }
  
  // Format number with Indian locale and add rupee symbol
  return `₹${numValue.toLocaleString('en-IN')}`;
}

