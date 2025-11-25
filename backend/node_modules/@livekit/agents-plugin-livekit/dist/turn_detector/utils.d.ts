/**
 * Text normalization utilities for EOU turn detector
 */
/**
 * Simple unicode category detection for punctuation
 * Mimics Python's unicodedata.category() for punctuation detection
 */
export declare function getUnicodeCategory(char: string): string;
/**
 * Normalizes text to match the training data format used by the EOU model
 *
 * This function applies the following transformations:
 * 1. Converts to lowercase
 * 2. Applies Unicode NFKC normalization
 * 3. Removes all punctuation except apostrophes (') and hyphens (-)
 * 4. Collapses multiple whitespace characters into single spaces
 * 5. Trims leading and trailing whitespace
 *
 * @param text - The input text to normalize
 * @returns The normalized text
 *
 * @example
 * ```typescript
 * normalizeText("Hi, how can I help you today?")
 * // Returns: "hi how can i help you today"
 *
 * normalizeText("I'm a well-trained assistant!")
 * // Returns: "i'm a well-trained assistant"
 *
 * normalizeText("Price: $19.99 (20% off).")
 * // Returns: "price 1999 20 off"
 * ```
 */
export declare function normalizeText(text: string): string;
//# sourceMappingURL=utils.d.ts.map