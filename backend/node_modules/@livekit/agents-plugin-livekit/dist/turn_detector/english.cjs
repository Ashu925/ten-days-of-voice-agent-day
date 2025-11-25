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
var english_exports = {};
__export(english_exports, {
  EOURunnerEn: () => EOURunnerEn,
  EnglishModel: () => EnglishModel,
  INFERENCE_METHOD_EN: () => INFERENCE_METHOD_EN,
  default: () => english_default
});
module.exports = __toCommonJS(english_exports);
var import_base = require("./base.cjs");
const INFERENCE_METHOD_EN = "lk_end_of_utterance_en";
class EOURunnerEn extends import_base.EOURunnerBase {
  constructor() {
    super("en");
  }
}
class EnglishModel extends import_base.EOUModel {
  constructor(unlikelyThreshold) {
    super({
      modelType: "en",
      unlikelyThreshold
    });
  }
  inferenceMethod() {
    return INFERENCE_METHOD_EN;
  }
}
var english_default = EOURunnerEn;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EOURunnerEn,
  EnglishModel,
  INFERENCE_METHOD_EN
});
//# sourceMappingURL=english.cjs.map