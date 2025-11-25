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
var vad_exports = {};
__export(vad_exports, {
  VAD: () => VAD,
  VADStream: () => VADStream
});
module.exports = __toCommonJS(vad_exports);
var import_agents = require("@livekit/agents");
var import_rtc_node = require("@livekit/rtc-node");
var import_onnx_model = require("./onnx_model.cjs");
const SLOW_INFERENCE_THRESHOLD = 200;
const defaultVADOptions = {
  minSpeechDuration: 50,
  minSilenceDuration: 550,
  prefixPaddingDuration: 500,
  maxBufferedSpeech: 6e4,
  // 60 seconds
  activationThreshold: 0.5,
  sampleRate: 16e3,
  forceCPU: true
};
class VAD extends import_agents.VAD {
  #session;
  #opts;
  #streams;
  label = "silero.VAD";
  constructor(session, opts) {
    super({ updateInterval: 32 });
    this.#session = session;
    this.#opts = opts;
    this.#streams = [];
  }
  /**
   * Updates the VAD options with new values.
   *
   * @param opts - Partial options object containing the values to update
   * @remarks
   * This method will merge the provided options with existing options and update all active streams.
   * Only the properties specified in opts will be updated, other properties retain their current values.
   */
  updateOptions(opts) {
    this.#opts = { ...this.#opts, ...opts };
    for (const stream of this.#streams) {
      stream.updateOptions(this.#opts);
    }
  }
  /**
   * Load and initialize the Silero VAD model.
   *
   * This method loads the ONNX model and prepares it for inference. When options are not provided,
   * sane defaults are used.
   *
   * @remarks
   * This method may take time to load the model into memory.
   * It is recommended to call this method inside your prewarm mechanism.
   *
   * @example
   * ```ts
   * export default defineAgent({
   *   prewarm: async (proc: JobProcess) => {
   *     proc.userData.vad = await VAD.load();
   *   },
   *   entry: async (ctx: JobContext) => {
   *     const vad = ctx.proc.userData.vad! as VAD;
   *     // the rest of your agent logic
   *   },
   * });
   * ```
   *
   * @param options -
   * @returns Promise\<{@link VAD}\>: An instance of the VAD class ready for streaming.
   */
  static async load(opts = {}) {
    const mergedOpts = { ...defaultVADOptions, ...opts };
    const session = await (0, import_onnx_model.newInferenceSession)(mergedOpts.forceCPU);
    return new VAD(session, mergedOpts);
  }
  stream() {
    const stream = new VADStream(
      this,
      this.#opts,
      new import_onnx_model.OnnxModel(this.#session, this.#opts.sampleRate)
    );
    this.#streams.push(stream);
    return stream;
  }
}
class VADStream extends import_agents.VADStream {
  #opts;
  #model;
  #inputSampleRate;
  #speechBuffer;
  #speechBufferMaxReached;
  #prefixPaddingSamples;
  #task;
  #expFilter = new import_agents.ExpFilter(0.35);
  #extraInferenceTime = 0;
  #logger = (0, import_agents.log)();
  constructor(vad, opts, model) {
    super(vad);
    this.#opts = opts;
    this.#model = model;
    this.#inputSampleRate = 0;
    this.#speechBuffer = null;
    this.#speechBufferMaxReached = false;
    this.#prefixPaddingSamples = 0;
    this.#task = new Promise(async () => {
      let inferenceData = new Float32Array(this.#model.windowSizeSamples);
      let speechBufferIndex = 0;
      let pubSpeaking = false;
      let pubSpeechDuration = 0;
      let pubSilenceDuration = 0;
      let pubCurrentSample = 0;
      let pubTimestamp = 0;
      let speechThresholdDuration = 0;
      let silenceThresholdDuration = 0;
      let inputFrames = [];
      let inferenceFrames = [];
      let resampler = null;
      let inputCopyRemainingFrac = 0;
      while (!this.closed) {
        const { done, value: frame } = await this.inputReader.read();
        if (done) {
          break;
        }
        if (typeof frame === "symbol") {
          continue;
        }
        if (!this.#inputSampleRate || !this.#speechBuffer) {
          this.#inputSampleRate = frame.sampleRate;
          this.#prefixPaddingSamples = Math.trunc(
            this.#opts.prefixPaddingDuration * this.#inputSampleRate / 1e3
          );
          const bufferSize = Math.trunc(this.#opts.maxBufferedSpeech * this.#inputSampleRate / 1e3) + this.#prefixPaddingSamples;
          this.#speechBuffer = new Int16Array(bufferSize);
          if (this.#opts.sampleRate !== this.#inputSampleRate) {
            resampler = new import_rtc_node.AudioResampler(
              this.#inputSampleRate,
              this.#opts.sampleRate,
              1,
              import_rtc_node.AudioResamplerQuality.QUICK
              // VAD doesn't need high quality
            );
          }
        } else if (frame.sampleRate !== this.#inputSampleRate) {
          this.#logger.error("a frame with a different sample rate was already published");
          continue;
        }
        inputFrames.push(frame);
        if (resampler) {
          inferenceFrames.push(...resampler.push(frame));
        } else {
          inferenceFrames.push(frame);
        }
        while (!this.closed) {
          const startTime = process.hrtime.bigint();
          const availableInferenceSamples = inferenceFrames.map((x) => x.samplesPerChannel).reduce((acc, x) => acc + x, 0);
          if (availableInferenceSamples < this.#model.windowSizeSamples) {
            break;
          }
          const inputFrame = (0, import_agents.mergeFrames)(inputFrames);
          const inferenceFrame = (0, import_agents.mergeFrames)(inferenceFrames);
          inferenceData = Float32Array.from(
            inferenceFrame.data.subarray(0, this.#model.windowSizeSamples),
            (x) => x / 32767
          );
          const p = await this.#model.run(inferenceData).then((data) => this.#expFilter.apply(1, data));
          const windowDuration = this.#model.windowSizeSamples / this.#opts.sampleRate * 1e3;
          pubCurrentSample += this.#model.windowSizeSamples;
          pubTimestamp += windowDuration;
          const resamplingRatio = this.#inputSampleRate / this.#model.sampleRate;
          const toCopy = this.#model.windowSizeSamples * resamplingRatio + inputCopyRemainingFrac;
          const toCopyInt = Math.trunc(toCopy);
          inputCopyRemainingFrac = toCopy - toCopyInt;
          const availableSpace = this.#speechBuffer.length - speechBufferIndex;
          const toCopyBuffer = Math.min(toCopyInt, availableSpace);
          if (toCopyBuffer > 0) {
            this.#speechBuffer.set(inputFrame.data.subarray(0, toCopyBuffer), speechBufferIndex);
            speechBufferIndex += toCopyBuffer;
          } else if (!this.#speechBufferMaxReached) {
            this.#speechBufferMaxReached = true;
            this.#logger.warn(
              "maxBufferedSpeech reached, ignoring further data for the current speech input"
            );
          }
          const inferenceDuration = Number((process.hrtime.bigint() - startTime) / BigInt(1e6));
          this.#extraInferenceTime = Math.max(
            0,
            this.#extraInferenceTime + inferenceDuration - windowDuration
          );
          if (this.#extraInferenceTime > SLOW_INFERENCE_THRESHOLD) {
            this.#logger.child({ delay: this.#extraInferenceTime }).warn("inference is slower than realtime");
          }
          if (pubSpeaking) {
            pubSpeechDuration += windowDuration;
          } else {
            pubSilenceDuration += windowDuration;
          }
          if (!this.sendVADEvent({
            type: import_agents.VADEventType.INFERENCE_DONE,
            samplesIndex: pubCurrentSample,
            timestamp: pubTimestamp,
            silenceDuration: pubSilenceDuration,
            speechDuration: pubSpeechDuration,
            probability: p,
            inferenceDuration,
            frames: [
              new import_rtc_node.AudioFrame(
                inputFrame.data.subarray(0, toCopyInt),
                this.#inputSampleRate,
                1,
                toCopyInt
              )
            ],
            speaking: pubSpeaking,
            rawAccumulatedSilence: silenceThresholdDuration,
            rawAccumulatedSpeech: speechThresholdDuration
          })) {
            continue;
          }
          const resetWriteCursor = () => {
            if (!this.#speechBuffer) throw new Error("speechBuffer is empty");
            if (speechBufferIndex <= this.#prefixPaddingSamples) {
              return;
            }
            const paddingData = this.#speechBuffer.subarray(
              speechBufferIndex - this.#prefixPaddingSamples,
              speechBufferIndex
            );
            this.#speechBuffer.set(paddingData, 0);
            speechBufferIndex = this.#prefixPaddingSamples;
            this.#speechBufferMaxReached = false;
          };
          const copySpeechBuffer = () => {
            if (!this.#speechBuffer) throw new Error("speechBuffer is empty");
            return new import_rtc_node.AudioFrame(
              this.#speechBuffer.subarray(this.#prefixPaddingSamples, speechBufferIndex),
              this.#inputSampleRate,
              1,
              speechBufferIndex
            );
          };
          if (p > this.#opts.activationThreshold) {
            speechThresholdDuration += windowDuration;
            silenceThresholdDuration = 0;
            if (!pubSpeaking && speechThresholdDuration >= this.#opts.minSpeechDuration) {
              pubSpeaking = true;
              pubSilenceDuration = 0;
              pubSpeechDuration = speechThresholdDuration;
              if (!this.sendVADEvent({
                type: import_agents.VADEventType.START_OF_SPEECH,
                samplesIndex: pubCurrentSample,
                timestamp: pubTimestamp,
                silenceDuration: pubSilenceDuration,
                speechDuration: pubSpeechDuration,
                probability: p,
                inferenceDuration,
                frames: [copySpeechBuffer()],
                speaking: pubSpeaking,
                rawAccumulatedSilence: 0,
                rawAccumulatedSpeech: 0
              })) {
                continue;
              }
            }
          } else {
            silenceThresholdDuration += windowDuration;
            speechThresholdDuration = 0;
            if (!pubSpeaking) {
              resetWriteCursor();
            }
            if (pubSpeaking && silenceThresholdDuration > this.#opts.minSilenceDuration) {
              pubSpeaking = false;
              pubSpeechDuration = 0;
              pubSilenceDuration = silenceThresholdDuration;
              if (!this.sendVADEvent({
                type: import_agents.VADEventType.END_OF_SPEECH,
                samplesIndex: pubCurrentSample,
                timestamp: pubTimestamp,
                silenceDuration: pubSilenceDuration,
                speechDuration: pubSpeechDuration,
                probability: p,
                inferenceDuration,
                frames: [copySpeechBuffer()],
                speaking: pubSpeaking,
                rawAccumulatedSilence: 0,
                rawAccumulatedSpeech: 0
              })) {
                continue;
              }
              resetWriteCursor();
            }
          }
          inputFrames = [];
          inferenceFrames = [];
          if (inputFrame.data.length > toCopyInt) {
            const data = inputFrame.data.subarray(toCopyInt);
            inputFrames.push(
              new import_rtc_node.AudioFrame(data, this.#inputSampleRate, 1, Math.trunc(data.length / 2))
            );
          }
          if (inferenceFrame.data.length > this.#model.windowSizeSamples) {
            const data = inferenceFrame.data.subarray(this.#model.windowSizeSamples);
            inferenceFrames.push(
              new import_rtc_node.AudioFrame(data, this.#opts.sampleRate, 1, Math.trunc(data.length / 2))
            );
          }
        }
      }
    });
  }
  /**
   * Update the VAD options
   *
   * @param opts - Partial options object containing the values to update
   * @remarks
   * This method allows you to update the VAD options after the VAD object has been created
   */
  updateOptions(opts) {
    const oldMaxBufferedSpeech = this.#opts.maxBufferedSpeech;
    this.#opts = { ...this.#opts, ...opts };
    if (this.#inputSampleRate) {
      if (this.#speechBuffer === null) throw new Error("speechBuffer is null");
      this.#prefixPaddingSamples = Math.trunc(
        this.#opts.prefixPaddingDuration * this.#inputSampleRate / 1e3
      );
      const bufferSize = Math.trunc(this.#opts.maxBufferedSpeech * this.#inputSampleRate / 1e3) + this.#prefixPaddingSamples;
      const resizedBuffer = new Int16Array(bufferSize);
      resizedBuffer.set(
        this.#speechBuffer.subarray(0, Math.min(this.#speechBuffer.length, bufferSize))
      );
      this.#speechBuffer = resizedBuffer;
      if (this.#opts.maxBufferedSpeech > oldMaxBufferedSpeech) {
        this.#speechBufferMaxReached = false;
      }
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  VAD,
  VADStream
});
//# sourceMappingURL=vad.cjs.map