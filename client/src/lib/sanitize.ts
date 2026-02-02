/**
 * Input Sanitization Utilities
 * Sanitizes user input to prevent XSS and ensure data integrity
 */

/**
 * Sanitize a string input
 * - Trims whitespace
 * - Removes potentially dangerous characters
 * - Limits length
 */
export function sanitizeString(input: string | null | undefined, maxLength: number = 1000): string {
  if (!input) return "";
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Remove null bytes and control characters (except newlines and tabs for text answers)
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Sanitize answer input (allows more characters for text answers)
 */
export function sanitizeAnswer(input: string | null | undefined): string {
  return sanitizeString(input, 1000);
}

/**
 * Sanitize quiz/tournament title
 */
export function sanitizeTitle(input: string | null | undefined): string {
  return sanitizeString(input, 200);
}

/**
 * Sanitize description
 */
export function sanitizeDescription(input: string | null | undefined): string {
  return sanitizeString(input, 500);
}

/**
 * Sanitize username
 */
export function sanitizeUsername(input: string | null | undefined): string {
  if (!input) return "";
  
  // Remove special characters, keep only alphanumeric, spaces, and common punctuation
  let sanitized = input.trim().replace(/[^a-zA-Z0-9\s\-_\.]/g, "");
  
  // Limit length
  if (sanitized.length > 50) {
    sanitized = sanitized.substring(0, 50);
  }
  
  return sanitized;
}

/**
 * Sanitize answers object (for quiz/tournament submissions)
 */
export function sanitizeAnswers(answers: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(answers)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeAnswer(value);
    }
  }
  
  return sanitized;
}

