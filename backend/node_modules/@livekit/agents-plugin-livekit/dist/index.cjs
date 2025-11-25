"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var index_exports = {};
__export(index_exports, {
  downloadFileToCacheDir: () => import_hf_utils2.downloadFileToCacheDir,
  turnDetector: () => turnDetector
});
module.exports = __toCommonJS(index_exports);
var import_agents = require("@livekit/agents");
var import_hf_utils = require("./hf_utils.cjs");
var import_constants = require("./turn_detector/constants.cjs");
var import_hf_utils2 = require("./hf_utils.cjs");
var turnDetector = __toESM(require("./turn_detector/index.cjs"), 1);
class EOUPlugin extends import_agents.Plugin {
  constructor() {
    super({
      title: "turn-detector",
      version: "0.1.1",
      package: "@livekit/agents-plugin-livekit"
    });
  }
  async downloadFiles() {
    const { AutoTokenizer } = await import("@huggingface/transformers");
    for (const revision of Object.values(import_constants.MODEL_REVISIONS)) {
      await AutoTokenizer.from_pretrained(import_constants.HG_MODEL_REPO, { revision });
      await (0, import_hf_utils.downloadFileToCacheDir)({ repo: import_constants.HG_MODEL_REPO, path: import_constants.ONNX_FILEPATH, revision });
      await (0, import_hf_utils.downloadFileToCacheDir)({ repo: import_constants.HG_MODEL_REPO, path: "languages.json", revision });
    }
  }
}
import_agents.Plugin.registerPlugin(new EOUPlugin());
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  downloadFileToCacheDir,
  turnDetector
});
//# sourceMappingURL=index.cjs.map