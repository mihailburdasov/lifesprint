/**
 * String utility functions
 */

/**
 * Capitalize the first letter of a string
 * @param str The string to capitalize
 * @returns The capitalized string
 */
export function capitalize(str: string): string {
  if (!str || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncate a string to a specified length
 * @param str The string to truncate
 * @param maxLength The maximum length
 * @param suffix The suffix to add (default: '...')
 * @returns The truncated string
 */
export function truncate(str: string, maxLength: number, suffix: string = '...'): string {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength) + suffix;
}

/**
 * Convert a string to camelCase
 * @param str The string to convert
 * @returns The camelCase string
 */
export function toCamelCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
}

/**
 * Convert a string to kebab-case
 * @param str The string to convert
 * @returns The kebab-case string
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

/**
 * Convert a string to snake_case
 * @param str The string to convert
 * @returns The snake_case string
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/\s+/g, '_')
    .toLowerCase();
}

/**
 * Check if a string is empty or only contains whitespace
 * @param str The string to check
 * @returns Whether the string is empty
 */
export function isEmpty(str: string): boolean {
  return !str || str.trim().length === 0;
}

/**
 * Remove all HTML tags from a string
 * @param str The string to remove HTML tags from
 * @returns The string without HTML tags
 */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Generate a random string
 * @param length The length of the string (default: 8)
 * @returns A random string
 */
export function randomString(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Format a number as a string with commas
 * @param num The number to format
 * @returns The formatted number string
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Pluralize a word based on a count
 * @param word The singular form of the word
 * @param count The count
 * @param pluralForm The plural form of the word (default: word + 's')
 * @returns The pluralized word
 */
export function pluralize(word: string, count: number, pluralForm?: string): string {
  return count === 1 ? word : pluralForm || `${word}s`;
}
