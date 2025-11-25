"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var utils_exports = {};
__export(utils_exports, {
  getUnicodeCategory: () => getUnicodeCategory,
  normalizeText: () => normalizeText
});
module.exports = __toCommonJS(utils_exports);
function getUnicodeCategory(char) {
  const code = char.codePointAt(0);
  if (!code) return "";
  if (code >= 33 && code <= 47 || // !"#$%&'()*+,-./
  code >= 58 && code <= 64 || // :;<=>?@
  code >= 91 && code <= 96 || // [\]^_`
  code >= 123 && code <= 126 || // {|}~
  code >= 160 && code <= 191 || // Latin-1 punctuation
  code >= 8192 && code <= 8303 || // General punctuation
  code >= 12288 && code <= 12351) {
    return "P";
  }
  return "";
}
function normalizeText(text) {
  if (!text) return "";
  let normalized = text.toLowerCase().normalize("NFKC");
  normalized = Array.from(normalized).filter((ch) => {
    const category = getUnicodeCategory(ch);
    return !(category.startsWith("P") && ch !== "'" && ch !== "-");
  }).join("");
  normalized = normalized.replace(/\s+/g, " ").trim();
  return normalized;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getUnicodeCategory,
  normalizeText
});
//# sourceMappingURL=utils.cjs.map