import { fileURLToPath } from "node:url";
import { InferenceSession, Tensor } from "onnxruntime-node";
const newInferenceSession = (forceCPU) => {
  return InferenceSession.create(fileURLToPath(new URL("silero_vad.onnx", import.meta.url).href), {
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
      input: new Tensor("float32", this.#inputBuffer, [
        1,
        this.#contextSize + this.#windowSizeSamples
      ]),
      state: new Tensor("float32", this.#rnnState, [2, 1, 128]),
      sr: new Tensor("int64", this.#sampleRateNd)
    }).then((result) => {
      this.#context = this.#inputBuffer.subarray(0, this.#contextSize);
      return result.output.data.at(0);
    });
  }
}
export {
  OnnxModel,
  newInferenceSession
};
//# sourceMappingURL=onnx_model.js.map