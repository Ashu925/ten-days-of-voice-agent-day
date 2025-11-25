"use strict";
var import_vitest = require("vitest");
var import_utils = require("./utils.cjs");
(0, import_vitest.describe)("getUnicodeCategory", () => {
  (0, import_vitest.it)("should identify basic ASCII punctuation", () => {
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("!")).toBe("P");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)('"')).toBe("P");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("#")).toBe("P");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("$")).toBe("P");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("%")).toBe("P");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("&")).toBe("P");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("'")).toBe("P");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("(")).toBe("P");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)(")")).toBe("P");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("*")).toBe("P");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("+")).toBe("P");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)(",")).toBe("P");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("-")).toBe("P");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)(".")).toBe("P");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("/")).toBe("P");
  });
  (0, import_vitest.it)("should identify colon/semicolon punctuation", () => {
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)(":")).toBe("P");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)(";")).toBe("P");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("<")).toBe("P");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("=")).toBe("P");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)(">")).toBe("P");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("?")).toBe("P");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("@")).toBe("P");
  });
  (0, import_vitest.it)("should identify bracket punctuation", () => {
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("[")).toBe("P");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("\\")).toBe("P");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("]")).toBe("P");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("^")).toBe("P");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("_")).toBe("P");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("`")).toBe("P");
  });
  (0, import_vitest.it)("should identify brace punctuation", () => {
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("{")).toBe("P");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("|")).toBe("P");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("}")).toBe("P");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("~")).toBe("P");
  });
  (0, import_vitest.it)("should identify extended punctuation", () => {
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("\xA1")).toBe("P");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("\xBF")).toBe("P");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("\xAB")).toBe("P");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("\xBB")).toBe("P");
  });
  (0, import_vitest.it)("should not identify letters as punctuation", () => {
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("a")).toBe("");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("A")).toBe("");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("z")).toBe("");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("Z")).toBe("");
  });
  (0, import_vitest.it)("should not identify numbers as punctuation", () => {
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("0")).toBe("");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("1")).toBe("");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("9")).toBe("");
  });
  (0, import_vitest.it)("should not identify whitespace as punctuation", () => {
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)(" ")).toBe("");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("	")).toBe("");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("\n")).toBe("");
  });
  (0, import_vitest.it)("should handle empty string", () => {
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("")).toBe("");
  });
  (0, import_vitest.it)("should handle unicode characters", () => {
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("\xE9")).toBe("");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("\xF1")).toBe("");
    (0, import_vitest.expect)((0, import_utils.getUnicodeCategory)("\xE7")).toBe("");
  });
});
(0, import_vitest.describe)("normalizeText", () => {
  (0, import_vitest.describe)("basic functionality", () => {
    (0, import_vitest.it)("should convert to lowercase", () => {
      (0, import_vitest.expect)((0, import_utils.normalizeText)("HELLO")).toBe("hello");
      (0, import_vitest.expect)((0, import_utils.normalizeText)("HeLLo")).toBe("hello");
      (0, import_vitest.expect)((0, import_utils.normalizeText)("WORLD")).toBe("world");
    });
    (0, import_vitest.it)("should remove basic punctuation", () => {
      (0, import_vitest.expect)((0, import_utils.normalizeText)("Hello!")).toBe("hello");
      (0, import_vitest.expect)((0, import_utils.normalizeText)("Hello?")).toBe("hello");
      (0, import_vitest.expect)((0, import_utils.normalizeText)("Hello.")).toBe("hello");
      (0, import_vitest.expect)((0, import_utils.normalizeText)("Hello,")).toBe("hello");
    });
    (0, import_vitest.it)("should preserve apostrophes", () => {
      (0, import_vitest.expect)((0, import_utils.normalizeText)("I'm happy")).toBe("i'm happy");
      (0, import_vitest.expect)((0, import_utils.normalizeText)("don't worry")).toBe("don't worry");
      (0, import_vitest.expect)((0, import_utils.normalizeText)("it's great")).toBe("it's great");
    });
    (0, import_vitest.it)("should preserve hyphens", () => {
      (0, import_vitest.expect)((0, import_utils.normalizeText)("well-trained")).toBe("well-trained");
      (0, import_vitest.expect)((0, import_utils.normalizeText)("state-of-the-art")).toBe("state-of-the-art");
      (0, import_vitest.expect)((0, import_utils.normalizeText)("co-worker")).toBe("co-worker");
    });
    (0, import_vitest.it)("should collapse multiple whitespace", () => {
      (0, import_vitest.expect)((0, import_utils.normalizeText)("hello    world")).toBe("hello world");
      (0, import_vitest.expect)((0, import_utils.normalizeText)("multiple   spaces   here")).toBe("multiple spaces here");
      (0, import_vitest.expect)((0, import_utils.normalizeText)("tab		spaces")).toBe("tab spaces");
      (0, import_vitest.expect)((0, import_utils.normalizeText)("newline\n\nspaces")).toBe("newline spaces");
    });
    (0, import_vitest.it)("should trim leading and trailing whitespace", () => {
      (0, import_vitest.expect)((0, import_utils.normalizeText)("  hello  ")).toBe("hello");
      (0, import_vitest.expect)((0, import_utils.normalizeText)("	\nhello	\n")).toBe("hello");
      (0, import_vitest.expect)((0, import_utils.normalizeText)("   hello world   ")).toBe("hello world");
    });
  });
  (0, import_vitest.describe)("comprehensive test cases", () => {
    (0, import_vitest.it)("should handle the basic greeting case", () => {
      (0, import_vitest.expect)((0, import_utils.normalizeText)("Hi, how can I help you today?")).toBe("hi how can i help you today");
    });
    (0, import_vitest.it)("should handle contractions and hyphens", () => {
      (0, import_vitest.expect)((0, import_utils.normalizeText)("I'm a well-trained assistant!")).toBe("i'm a well-trained assistant");
    });
    (0, import_vitest.it)("should remove various punctuation types", () => {
      (0, import_vitest.expect)((0, import_utils.normalizeText)("Hello!!! What??? Price: $19.99 (20% off).")).toBe(
        "hello what price 1999 20 off"
      );
    });
    (0, import_vitest.it)("should handle multiple spaces", () => {
      (0, import_vitest.expect)((0, import_utils.normalizeText)("Multiple    spaces   here")).toBe("multiple spaces here");
    });
    (0, import_vitest.it)("should handle unicode characters", () => {
      (0, import_vitest.expect)((0, import_utils.normalizeText)("Caf\xE9 entr\xE9es na\xEFve r\xE9sum\xE9")).toBe("caf\xE9 entr\xE9es na\xEFve r\xE9sum\xE9");
    });
    (0, import_vitest.it)("should handle mixed punctuation and unicode", () => {
      (0, import_vitest.expect)((0, import_utils.normalizeText)("\xBFC\xF3mo est\xE1s? \xA1Muy bien!")).toBe("c\xF3mo est\xE1s muy bien");
    });
  });
  (0, import_vitest.describe)("edge cases", () => {
    (0, import_vitest.it)("should handle empty string", () => {
      (0, import_vitest.expect)((0, import_utils.normalizeText)("")).toBe("");
    });
    (0, import_vitest.it)("should handle whitespace-only string", () => {
      (0, import_vitest.expect)((0, import_utils.normalizeText)("   ")).toBe("");
      (0, import_vitest.expect)((0, import_utils.normalizeText)("	\n  ")).toBe("");
    });
    (0, import_vitest.it)("should handle punctuation-only string", () => {
      (0, import_vitest.expect)((0, import_utils.normalizeText)("!!!")).toBe("");
      (0, import_vitest.expect)((0, import_utils.normalizeText)("???")).toBe("");
      (0, import_vitest.expect)((0, import_utils.normalizeText)("...")).toBe("");
    });
    (0, import_vitest.it)("should handle mixed punctuation and preserved characters", () => {
      (0, import_vitest.expect)((0, import_utils.normalizeText)(`!@#$%^&*()_+-={}[]|\\:;"'<>?,./`)).toBe("-'");
    });
    (0, import_vitest.it)("should handle numbers with punctuation", () => {
      (0, import_vitest.expect)((0, import_utils.normalizeText)("$19.99")).toBe("1999");
      (0, import_vitest.expect)((0, import_utils.normalizeText)("(555) 123-4567")).toBe("555 123-4567");
    });
    (0, import_vitest.it)("should handle special unicode punctuation", () => {
      (0, import_vitest.expect)((0, import_utils.normalizeText)("Hello\u2026 world!")).toBe("hello world");
      (0, import_vitest.expect)((0, import_utils.normalizeText)('"Quoted text"')).toBe("quoted text");
      (0, import_vitest.expect)((0, import_utils.normalizeText)("'Single quotes'")).toBe("'single quotes'");
    });
  });
  (0, import_vitest.describe)("unicode normalization", () => {
    (0, import_vitest.it)("should apply NFKC normalization", () => {
      (0, import_vitest.expect)((0, import_utils.normalizeText)("caf\xE9")).toBe("caf\xE9");
      (0, import_vitest.expect)((0, import_utils.normalizeText)("na\xEFve")).toBe("na\xEFve");
    });
    (0, import_vitest.it)("should handle combining characters", () => {
      const eWithCombiningAcute = "cafe\u0301";
      const precomposedE = "caf\xE9";
      (0, import_vitest.expect)((0, import_utils.normalizeText)(eWithCombiningAcute)).toBe((0, import_utils.normalizeText)(precomposedE));
    });
  });
  (0, import_vitest.describe)("real-world examples", () => {
    (0, import_vitest.it)("should handle typical assistant responses", () => {
      (0, import_vitest.expect)((0, import_utils.normalizeText)("Hello! How can I assist you today?")).toBe(
        "hello how can i assist you today"
      );
      (0, import_vitest.expect)((0, import_utils.normalizeText)("I'm here to help with any questions you might have.")).toBe(
        "i'm here to help with any questions you might have"
      );
    });
    (0, import_vitest.it)("should handle typical user queries", () => {
      (0, import_vitest.expect)((0, import_utils.normalizeText)("What's the weather like?")).toBe("what's the weather like");
      (0, import_vitest.expect)((0, import_utils.normalizeText)("Can you help me with my order?")).toBe("can you help me with my order");
      (0, import_vitest.expect)((0, import_utils.normalizeText)("I need assistance, please!")).toBe("i need assistance please");
    });
    (0, import_vitest.it)("should handle incomplete sentences", () => {
      (0, import_vitest.expect)((0, import_utils.normalizeText)("What is the weather in")).toBe("what is the weather in");
      (0, import_vitest.expect)((0, import_utils.normalizeText)("I am looking for")).toBe("i am looking for");
      (0, import_vitest.expect)((0, import_utils.normalizeText)("Could you please")).toBe("could you please");
    });
    (0, import_vitest.it)("should handle multilingual text", () => {
      (0, import_vitest.expect)((0, import_utils.normalizeText)("Bonjour! Comment \xE7a va?")).toBe("bonjour comment \xE7a va");
      (0, import_vitest.expect)((0, import_utils.normalizeText)("\xA1Hola! \xBFC\xF3mo est\xE1s?")).toBe("hola c\xF3mo est\xE1s");
      (0, import_vitest.expect)((0, import_utils.normalizeText)("Guten Tag! Wie geht es Ihnen?")).toBe("guten tag wie geht es ihnen");
    });
  });
});
//# sourceMappingURL=utils.test.cjs.map