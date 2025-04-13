/**
 * Validation utility functions
 */

/**
 * Check if a value is a valid email
 * @param email The email to validate
 * @returns Whether the email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if a value is a valid URL
 * @param url The URL to validate
 * @returns Whether the URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Check if a value is a valid phone number
 * @param phone The phone number to validate
 * @returns Whether the phone number is valid
 */
export function isValidPhone(phone: string): boolean {
  // This is a simple validation for demonstration purposes
  // In a real application, you might want to use a more sophisticated validation
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  return phoneRegex.test(phone);
}

/**
 * Check if a value is a valid password
 * @param password The password to validate
 * @param options Options for validation
 * @returns Whether the password is valid
 */
export function isValidPassword(
  password: string,
  options: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
  } = {}
): boolean {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
  } = options;

  // Check minimum length
  if (password.length < minLength) {
    return false;
  }

  // Check for uppercase letters
  if (requireUppercase && !/[A-Z]/.test(password)) {
    return false;
  }

  // Check for lowercase letters
  if (requireLowercase && !/[a-z]/.test(password)) {
    return false;
  }

  // Check for numbers
  if (requireNumbers && !/[0-9]/.test(password)) {
    return false;
  }

  // Check for special characters
  if (requireSpecialChars && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return false;
  }

  return true;
}

/**
 * Check if a value is a valid date
 * @param date The date to validate
 * @returns Whether the date is valid
 */
export function isValidDate(date: Date): boolean {
  return !isNaN(date.getTime());
}

/**
 * Check if a value is a valid number
 * @param value The value to validate
 * @returns Whether the value is a valid number
 */
export function isValidNumber(value: any): boolean {
  return !isNaN(Number(value));
}

/**
 * Check if a value is a valid integer
 * @param value The value to validate
 * @returns Whether the value is a valid integer
 */
export function isValidInteger(value: any): boolean {
  return Number.isInteger(Number(value));
}

/**
 * Check if a value is within a range
 * @param value The value to validate
 * @param min The minimum value
 * @param max The maximum value
 * @returns Whether the value is within the range
 */
export function isWithinRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Check if a string is empty
 * @param value The string to validate
 * @returns Whether the string is empty
 */
export function isRequired(value: string): boolean {
  return value !== undefined && value !== null && value.trim() !== '';
}

/**
 * Check if a value matches a regular expression
 * @param value The value to validate
 * @param regex The regular expression to match
 * @returns Whether the value matches the regular expression
 */
export function matchesPattern(value: string, regex: RegExp): boolean {
  return regex.test(value);
}
