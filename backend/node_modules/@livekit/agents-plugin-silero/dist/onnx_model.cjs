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
var onnx_model_exports = {};
__export(onnx_model_exports, {
  OnnxModel: () => OnnxModel,
  newInferenceSession: () => newInferenceSession
});
module.exports = __toCommonJS(onnx_model_exports);
var getImportMetaUrl = () => typeof document === "undefined" ? new URL(`file:${__filename}`).href : document.currentScript && document.currentScript.src || new URL("main.js", document.baseURI).href;
var importMetaUrl = /* @__PURE__ */ getImportMetaUrl();
var import_node_url = require("node:url");
var import_onnxruntime_node = require("onnxruntime-node");
const newInferenceSession = (forceCPU) => {
  return import_onnxruntime_node.InferenceSession.create((0, import_node_url.fileURLToPath)(new URL("silero_vad.onnx", importMetaUrl).href), {
    interOpNumThreads: 1,
    intraOpNumThreads: 1,
    executionMode: "sequential",
    executionProviders: forceCPU ? [{ name: "cpu" }] : void 0
  });
};
class OnnxModel {
  #session;
  #sampleRate;
  #windowSizeSamples;
  #contextSize;
  #sampleRateNd;
  #context;
  // #state: Float32Array;
  #rnnState;
  #inputBuffer;
  constructor(session, sampleRate) {
    this.#session = session;
    this.#sampleRate = sampleRate;
    switch (sampleRate) {
      case 8e3:
        this.#windowSizeSamples = 256;
        this.#contextSize = 32;
        break;
      case 16e3:
        this.#windowSizeSamples = 512;
        this.#contextSize = 64;
        break;
    }
    this.#sampleRateNd = BigInt64Array.from([BigInt(sampleRate)]);
    this.#context = new Float32Array(this.#contextSize);
    this.#rnnState = new Float32Array(2 * 1 * 128);
    this.#inputBuffer = new Float32Array(this.#contextSize + this.#windowSizeSamples);
  }
  get sampleRate() {
    return this.#sampleRate;
  }
  get windowSizeSamples() {
    return this.#windowSizeSamples;
  }
  get contextSize() {
    return this.#contextSize;
  }
  async run(x) {
    this.#inputBuffer.set(this.#context, 0);
    this.#inputBuffer.set(x, this.#contextSize);
    return await this.#session.run({
      input: new import_onnxruntime_node.Tensor("float32", this.#inputBuffer, [
        1,
        this.#contextSize + this.#windowSizeSamples
      ]),
      state: new import_onnxruntime_node.Tensor("float32", this.#rnnState, [2, 1, 128]),
      sr: new import_onnxruntime_node.Tensor("int64", this.#sampleRateNd)
    }).then((result) => {
      this.#context = this.#inputBuffer.subarray(0, this.#contextSize);
      return result.output.data.at(0);
    });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  OnnxModel,
  newInferenceSession
});
//# sourceMappingURL=onnx_model.cjs.map