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
var audio_exports = {};
__export(audio_exports, {
  AudioByteStream: () => AudioByteStream,
  audioFramesFromFile: () => audioFramesFromFile,
  calculateAudioDurationSeconds: () => calculateAudioDurationSeconds,
  loopAudioFramesFromFile: () => loopAudioFramesFromFile
});
module.exports = __toCommonJS(audio_exports);
var import_ffmpeg = __toESM(require("@ffmpeg-installer/ffmpeg"), 1);
var import_rtc_node = require("@livekit/rtc-node");
var import_fluent_ffmpeg = __toESM(require("fluent-ffmpeg"), 1);
var import_log = require("./log.cjs");
var import_stream_channel = require("./stream/stream_channel.cjs");
import_fluent_ffmpeg.default.setFfmpegPath(import_ffmpeg.default.path);
function calculateAudioDurationSeconds(frame) {
  return Array.isArray(frame) ? frame.reduce((sum, a) => sum + a.samplesPerChannel / a.sampleRate, 0) : frame.samplesPerChannel / frame.sampleRate;
}
class AudioByteStream {
  #sampleRate;
  #numChannels;
  #bytesPerFrame;
  #buf;
  #logger = (0, import_log.log)();
  constructor(sampleRate, numChannels, samplesPerChannel = null) {
    this.#sampleRate = sampleRate;
    this.#numChannels = numChannels;
    if (samplesPerChannel === null) {
      samplesPerChannel = Math.floor(sampleRate / 10);
    }
    this.#bytesPerFrame = numChannels * samplesPerChannel * 2;
    this.#buf = new Int8Array();
  }
  write(data) {
    this.#buf = new Int8Array([...this.#buf, ...new Int8Array(data)]);
    const frames = [];
    while (this.#buf.length >= this.#bytesPerFrame) {
      const frameData = this.#buf.slice(0, this.#bytesPerFrame);
      this.#buf = this.#buf.slice(this.#bytesPerFrame);
      frames.push(
        new import_rtc_node.AudioFrame(
          new Int16Array(frameData.buffer),
          this.#sampleRate,
          this.#numChannels,
          frameData.length / 2
        )
      );
    }
    return frames;
  }
  flush() {
    if (this.#buf.length % (2 * this.#numChannels) !== 0) {
      this.#logger.warn("AudioByteStream: incomplete frame during flush, dropping");
      return [];
    }
    const frames = [
      new import_rtc_node.AudioFrame(
        new Int16Array(this.#buf.buffer),
        this.#sampleRate,
        this.#numChannels,
        this.#buf.length / 2
      )
    ];
    this.#buf = new Int8Array();
    return frames;
  }
}
function audioFramesFromFile(filePath, options = {}) {
  var _a;
  const sampleRate = options.sampleRate ?? 48e3;
  const numChannels = options.numChannels ?? 1;
  const audioStream = new AudioByteStream(sampleRate, numChannels);
  const channel = (0, import_stream_channel.createStreamChannel)();
  const logger = (0, import_log.log)();
  const command = (0, import_fluent_ffmpeg.default)(filePath).inputOptions([
    "-probesize",
    "32",
    "-analyzeduration",
    "0",
    "-fflags",
    "+nobuffer+flush_packets",
    "-flags",
    "low_delay"
  ]).format("s16le").audioChannels(numChannels).audioFrequency(sampleRate);
  let commandRunning = true;
  const onClose = () => {
    logger.debug("Audio file playback aborted");
    channel.close();
    if (commandRunning) {
      commandRunning = false;
      command.kill("SIGKILL");
    }
  };
  const outputStream = command.pipe();
  (_a = options.abortSignal) == null ? void 0 : _a.addEventListener("abort", onClose, { once: true });
  outputStream.on("data", (chunk) => {
    const arrayBuffer = chunk.buffer.slice(
      chunk.byteOffset,
      chunk.byteOffset + chunk.byteLength
    );
    const frames = audioStream.write(arrayBuffer);
    for (const frame of frames) {
      channel.write(frame);
    }
  });
  outputStream.on("end", () => {
    const frames = audioStream.flush();
    for (const frame of frames) {
      channel.write(frame);
    }
    commandRunning = false;
    channel.close();
  });
  outputStream.on("error", (err) => {
    logger.error(err);
    commandRunning = false;
    onClose();
  });
  return channel.stream();
}
async function* loopAudioFramesFromFile(filePath, options = {}) {
  var _a;
  const frames = [];
  const logger = (0, import_log.log)();
  for await (const frame of audioFramesFromFile(filePath, options)) {
    frames.push(frame);
    yield frame;
  }
  while (!((_a = options.abortSignal) == null ? void 0 : _a.aborted)) {
    for (const frame of frames) {
      yield frame;
    }
  }
  logger.debug("Audio file playback loop finished");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AudioByteStream,
  audioFramesFromFile,
  calculateAudioDurationSeconds,
  loopAudioFramesFromFile
});
//# sourceMappingURL=audio.cjs.map