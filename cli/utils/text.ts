/**
 * A set of generic words to ignore during text comparisons.
 */
export const STOP_WORDS = new Set([
  "center",
  "shop",
  "store",
  "services",
  "and",
  "of",
  "the",
  "private",
  "agency",
]);

/**
 * Splits a string into an array of significant words, filtering out stop words.
 * @param {string} text - The text to process.
 * @returns {string[]} An array of significant words.
 */
export function getSignificantWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,&\-_']_/)
    .filter((word) => word && !STOP_WORDS.has(word));
}

/**
 * Converts a string to snake_case.
 * @param {string} text - The text to convert.
 * @returns {string} The snake_cased string.
 */
export function toSnakeCase(text: string): string {
    if (!text) return '';
    return text
        .replace(/([a-z])([A-Z])/g, '$1_$2') // handle camelCase
        .replace(/[&\s,]+/g, '_') // replace spaces, ampersands, and commas with an underscore
        .toLowerCase();
}
