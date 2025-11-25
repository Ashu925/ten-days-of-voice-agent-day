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
var index_exports = {};
__export(index_exports, {
  VAD: () => import_vad.VAD,
  VADStream: () => import_vad.VADStream
});
module.exports = __toCommonJS(index_exports);
var import_agents = require("@livekit/agents");
var import_vad = require("./vad.cjs");
class SileroPlugin extends import_agents.Plugin {
  constructor() {
    super({
      title: "silero",
      version: "0.5.6",
      package: "@livekit/agents-plugin-silero"
    });
  }
}
import_agents.Plugin.registerPlugin(new SileroPlugin());
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  VAD,
  VADStream
});
//# sourceMappingURL=index.cjs.map