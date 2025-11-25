import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { AudioFrame } from "@livekit/rtc-node";
import ffmpeg from "fluent-ffmpeg";
import { log } from "./log.js";
import { createStreamChannel } from "./stream/stream_channel.js";
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
function calculateAudioDurationSeconds(frame) {
  return Array.isArray(frame) ? frame.reduce((sum, a) => sum + a.samplesPerChannel / a.sampleRate, 0) : frame.samplesPerChannel / frame.sampleRate;
}
class AudioByteStream {
  #sampleRate;
  #numChannels;
  #bytesPerFrame;
  #buf;
  #logger = log();
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
        new AudioFrame(
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
      new AudioFrame(
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
  const channel = createStreamChannel();
  const logger = log();
  const command = ffmpeg(filePath).inputOptions([
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
  const logger = log();
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
export {
  AudioByteStream,
  audioFramesFromFile,
  calculateAudioDurationSeconds,
  loopAudioFramesFromFile
};
//# sourceMappingURL=audio.js.map