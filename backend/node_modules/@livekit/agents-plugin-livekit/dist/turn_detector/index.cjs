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
var turn_detector_exports = {};
__export(turn_detector_exports, {
  EOUModel: () => import_base.EOUModel,
  EnglishModel: () => import_english2.EnglishModel,
  MultilingualModel: () => import_multilingual2.MultilingualModel,
  getUnicodeCategory: () => import_utils.getUnicodeCategory,
  normalizeText: () => import_utils.normalizeText
});
module.exports = __toCommonJS(turn_detector_exports);
var getImportMetaUrl = () => typeof document === "undefined" ? new URL(`file:${__filename}`).href : document.currentScript && document.currentScript.src || new URL("main.js", document.baseURI).href;
var importMetaUrl = /* @__PURE__ */ getImportMetaUrl();
var import_agents = require("@livekit/agents");
var import_english = require("./english.cjs");
var import_multilingual = require("./multilingual.cjs");
var import_base = require("./base.cjs");
var import_english2 = require("./english.cjs");
var import_multilingual2 = require("./multilingual.cjs");
var import_utils = require("./utils.cjs");
import_agents.InferenceRunner.registerRunner(
  import_english.INFERENCE_METHOD_EN,
  new URL("./english.js", importMetaUrl).toString()
);
import_agents.InferenceRunner.registerRunner(
  import_multilingual.INFERENCE_METHOD_MULTILINGUAL,
  new URL("./multilingual.js", importMetaUrl).toString()
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EOUModel,
  EnglishModel,
  MultilingualModel,
  getUnicodeCategory,
  normalizeText
});
//# sourceMappingURL=index.cjs.map