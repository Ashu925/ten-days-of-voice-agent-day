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
export {
  getUnicodeCategory,
  normalizeText
};
//# sourceMappingURL=utils.js.map