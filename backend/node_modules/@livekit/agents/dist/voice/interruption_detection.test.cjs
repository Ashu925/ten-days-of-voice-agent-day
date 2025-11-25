"use strict";
var import_vitest = require("vitest");
var import_word = require("../tokenize/basic/word.cjs");
(0, import_vitest.describe)("Interruption Detection - Word Counting", () => {
  (0, import_vitest.describe)("Word Splitting Behavior", () => {
    (0, import_vitest.it)("should count empty string as 0 words", () => {
      const text = "";
      const wordCount = (0, import_word.splitWords)(text, true).length;
      (0, import_vitest.expect)(wordCount).toBe(0);
    });
    (0, import_vitest.it)("should count single word correctly", () => {
      const text = "hello";
      const wordCount = (0, import_word.splitWords)(text, true).length;
      (0, import_vitest.expect)(wordCount).toBe(1);
    });
    (0, import_vitest.it)("should count two words correctly", () => {
      const text = "hello world";
      const wordCount = (0, import_word.splitWords)(text, true).length;
      (0, import_vitest.expect)(wordCount).toBe(2);
    });
    (0, import_vitest.it)("should count multiple words correctly", () => {
      const text = "hello this is a full sentence";
      const wordCount = (0, import_word.splitWords)(text, true).length;
      (0, import_vitest.expect)(wordCount).toBe(6);
    });
    (0, import_vitest.it)("should handle punctuation correctly", () => {
      const text = "hello, world!";
      const wordCount = (0, import_word.splitWords)(text, true).length;
      (0, import_vitest.expect)(wordCount).toBe(2);
    });
    (0, import_vitest.it)("should handle multiple spaces between words", () => {
      const text = "hello  world";
      const wordCount = (0, import_word.splitWords)(text, true).length;
      (0, import_vitest.expect)(wordCount).toBe(2);
    });
    (0, import_vitest.it)("should count whitespace-only string as 0 words", () => {
      const text = "   ";
      const wordCount = (0, import_word.splitWords)(text, true).length;
      (0, import_vitest.expect)(wordCount).toBe(0);
    });
    (0, import_vitest.it)("should handle leading and trailing whitespace", () => {
      const text = "  hello world  ";
      const wordCount = (0, import_word.splitWords)(text, true).length;
      (0, import_vitest.expect)(wordCount).toBe(2);
    });
  });
  (0, import_vitest.describe)("Integration: Full Interruption Check Logic", () => {
    (0, import_vitest.it)("should block interruption for empty transcript with threshold 2", () => {
      const text = "";
      const minInterruptionWords = 2;
      const normalizedText = text ?? "";
      const wordCount = (0, import_word.splitWords)(normalizedText, true).length;
      const shouldBlock = wordCount < minInterruptionWords;
      (0, import_vitest.expect)(normalizedText).toBe("");
      (0, import_vitest.expect)(wordCount).toBe(0);
      (0, import_vitest.expect)(shouldBlock).toBe(true);
    });
    (0, import_vitest.it)("should block interruption for undefined transcript with threshold 2", () => {
      const text = void 0;
      const minInterruptionWords = 2;
      const normalizedText = text ?? "";
      const wordCount = (0, import_word.splitWords)(normalizedText, true).length;
      const shouldBlock = wordCount < minInterruptionWords;
      (0, import_vitest.expect)(normalizedText).toBe("");
      (0, import_vitest.expect)(wordCount).toBe(0);
      (0, import_vitest.expect)(shouldBlock).toBe(true);
    });
    (0, import_vitest.it)("should block interruption for single word with threshold 2", () => {
      const text = "hello";
      const minInterruptionWords = 2;
      const normalizedText = text ?? "";
      const wordCount = (0, import_word.splitWords)(normalizedText, true).length;
      const shouldBlock = wordCount < minInterruptionWords;
      (0, import_vitest.expect)(normalizedText).toBe("hello");
      (0, import_vitest.expect)(wordCount).toBe(1);
      (0, import_vitest.expect)(shouldBlock).toBe(true);
    });
    (0, import_vitest.it)("should allow interruption when word count exactly meets threshold", () => {
      const text = "hello world";
      const minInterruptionWords = 2;
      const normalizedText = text ?? "";
      const wordCount = (0, import_word.splitWords)(normalizedText, true).length;
      const shouldBlock = wordCount < minInterruptionWords;
      (0, import_vitest.expect)(normalizedText).toBe("hello world");
      (0, import_vitest.expect)(wordCount).toBe(2);
      (0, import_vitest.expect)(shouldBlock).toBe(false);
    });
    (0, import_vitest.it)("should allow interruption when word count exceeds threshold", () => {
      const text = "hello this is a full sentence";
      const minInterruptionWords = 2;
      const normalizedText = text ?? "";
      const wordCount = (0, import_word.splitWords)(normalizedText, true).length;
      const shouldBlock = wordCount < minInterruptionWords;
      (0, import_vitest.expect)(normalizedText).toBe("hello this is a full sentence");
      (0, import_vitest.expect)(wordCount).toBe(6);
      (0, import_vitest.expect)(shouldBlock).toBe(false);
    });
    (0, import_vitest.it)("should apply consistent word counting logic in both methods", () => {
      const transcripts = ["", "hello", "hello world", "this is a longer sentence"];
      const threshold = 2;
      transcripts.forEach((transcript) => {
        const text1 = transcript;
        const normalizedText1 = text1 ?? "";
        const wordCount1 = (0, import_word.splitWords)(normalizedText1, true).length;
        const shouldBlock1 = wordCount1 < threshold;
        const wordCount2 = (0, import_word.splitWords)(transcript, true).length;
        const shouldBlock2 = wordCount2 < threshold;
        (0, import_vitest.expect)(wordCount1).toBe(wordCount2);
        (0, import_vitest.expect)(shouldBlock1).toBe(shouldBlock2);
      });
    });
  });
});
//# sourceMappingURL=interruption_detection.test.cjs.map