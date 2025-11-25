import {
  AudioFrame,
  AudioSource,
  LocalAudioTrack,
  TrackPublishOptions
} from "@livekit/rtc-node";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { audioFramesFromFile, loopAudioFramesFromFile } from "../audio.js";
import { log } from "../log.js";
import { Future, Task, cancelAndWait } from "../utils.js";
import { AgentSessionEventTypes } from "./events.js";
const TASK_TIMEOUT_MS = 500;
var BuiltinAudioClip = /* @__PURE__ */ ((BuiltinAudioClip2) => {
  BuiltinAudioClip2["OFFICE_AMBIENCE"] = "office-ambience.ogg";
  BuiltinAudioClip2["KEYBOARD_TYPING"] = "keyboard-typing.ogg";
  BuiltinAudioClip2["KEYBOARD_TYPING2"] = "keyboard-typing2.ogg";
  return BuiltinAudioClip2;
})(BuiltinAudioClip || {});
function isBuiltinAudioClip(source) {
  return typeof source === "string" && Object.values(BuiltinAudioClip).includes(source);
}
function getBuiltinAudioPath(clip) {
  const resourcesPath = join(dirname(fileURLToPath(import.meta.url)), "../../resources");
  return join(resourcesPath, clip);
}
const AUDIO_SOURCE_BUFFER_MS = 400;
class PlayHandle {
  doneFuture = new Future();
  stopFuture = new Future();
  done() {
    return this.doneFuture.done;
  }
  stop() {
    if (this.done()) return;
    if (!this.stopFuture.done) {
      this.stopFuture.resolve();
    }
    this._markPlayoutDone();
  }
  async waitForPlayout() {
    return this.doneFuture.await;
  }
  _markPlayoutDone() {
    if (!this.doneFuture.done) {
      this.doneFuture.resolve();
    }
  }
}
class BackgroundAudioPlayer {
  ambientSound;
  thinkingSound;
  playTasks = [];
  audioSource = new AudioSource(48e3, 1, AUDIO_SOURCE_BUFFER_MS);
  room;
  agentSession;
  publication;
  trackPublishOptions;
  republishTask;
  ambientHandle;
  thinkingHandle;
  // TODO (Brian): add lock
  #logger = log();
  constructor(options) {
    const { ambientSound, thinkingSound } = options || {};
    this.ambientSound = ambientSound;
    this.thinkingSound = thinkingSound;
    if (this.thinkingSound) {
      this.#logger.warn("thinkingSound is not yet supported");
    }
  }
  /**
   * Select a sound from a list of background sound based on probability weights
   * Return undefined if no sound is selected (when sum of probabilities < 1.0).
   */
  selectSoundFromList(sounds) {
    const totalProbability = sounds.reduce((sum, sound) => sum + (sound.probability ?? 1), 0);
    if (totalProbability <= 0) {
      return void 0;
    }
    if (totalProbability < 1 && Math.random() > totalProbability) {
      return void 0;
    }
    const normalizeFactor = totalProbability <= 1 ? 1 : totalProbability;
    const r = Math.random() * Math.min(totalProbability, 1);
    let cumulative = 0;
    for (const sound of sounds) {
      const prob = sound.probability ?? 1;
      if (prob <= 0) {
        continue;
      }
      const normProb = prob / normalizeFactor;
      cumulative += normProb;
      if (r <= cumulative) {
        return sound;
      }
    }
    return sounds[sounds.length - 1];
  }
  normalizeSoundSource(source) {
    if (source === void 0) {
      return void 0;
    }
    if (typeof source === "string") {
      return {
        source: this.normalizeBuiltinAudio(source),
        volume: 1
      };
    }
    if (Array.isArray(source)) {
      const selected = this.selectSoundFromList(source);
      if (selected === void 0) {
        return void 0;
      }
      return {
        source: selected.source,
        volume: selected.volume ?? 1
      };
    }
    if (typeof source === "object" && "source" in source) {
      return {
        source: this.normalizeBuiltinAudio(source.source),
        volume: source.volume ?? 1
      };
    }
    return { source, volume: 1 };
  }
  normalizeBuiltinAudio(source) {
    if (isBuiltinAudioClip(source)) {
      return getBuiltinAudioPath(source);
    }
    return source;
  }
  play(audio, loop = false) {
    const normalized = this.normalizeSoundSource(audio);
    if (normalized === void 0) {
      const handle = new PlayHandle();
      handle._markPlayoutDone();
      return handle;
    }
    const { source, volume } = normalized;
    const playHandle = new PlayHandle();
    const task = Task.from(async ({ signal }) => {
      await this.playTask({ playHandle, sound: source, volume, loop, signal });
    });
    task.addDoneCallback(() => {
      playHandle._markPlayoutDone();
      this.playTasks.splice(this.playTasks.indexOf(task), 1);
    });
    this.playTasks.push(task);
    return playHandle;
  }
  /**
   * Start the background audio system, publishing the audio track
   * and beginning playback of any configured ambient sound.
   *
   * If `ambientSound` is provided (and contains file paths), they will loop
   * automatically. If `ambientSound` contains AsyncIterators, they are assumed
   * to be already infinite or looped.
   *
   * @param options - Options for starting background audio playback
   */
  async start(options) {
    var _a;
    const { room, agentSession, trackPublishOptions } = options;
    this.room = room;
    this.agentSession = agentSession;
    this.trackPublishOptions = trackPublishOptions;
    await this.publishTrack();
    this.room.on("reconnected", this.onReconnected);
    (_a = this.agentSession) == null ? void 0 : _a.on(AgentSessionEventTypes.AgentStateChanged, this.onAgentStateChanged);
    if (!this.ambientSound) return;
    const normalized = this.normalizeSoundSource(this.ambientSound);
    if (!normalized) return;
    const { source, volume } = normalized;
    const selectedSound = { source, volume, probability: 1 };
    this.ambientHandle = this.play(selectedSound, typeof source === "string");
  }
  /**
   * Close and cleanup the background audio system
   */
  async close() {
    var _a, _b, _c, _d;
    await cancelAndWait(this.playTasks, TASK_TIMEOUT_MS);
    if (this.republishTask) {
      await this.republishTask.cancelAndWait(TASK_TIMEOUT_MS);
    }
    await this.audioSource.close();
    (_a = this.agentSession) == null ? void 0 : _a.off(AgentSessionEventTypes.AgentStateChanged, this.onAgentStateChanged);
    (_b = this.room) == null ? void 0 : _b.off("reconnected", this.onReconnected);
    if (this.publication && this.publication.sid) {
      await ((_d = (_c = this.room) == null ? void 0 : _c.localParticipant) == null ? void 0 : _d.unpublishTrack(this.publication.sid));
    }
  }
  /**
   * Get the current track publication
   */
  getPublication() {
    return this.publication;
  }
  async publishTrack() {
    var _a;
    if (this.publication !== void 0) {
      return;
    }
    const track = LocalAudioTrack.createAudioTrack("background_audio", this.audioSource);
    if (((_a = this.room) == null ? void 0 : _a.localParticipant) === void 0) {
      throw new Error("Local participant not available");
    }
    const publication = await this.room.localParticipant.publishTrack(
      track,
      this.trackPublishOptions ?? new TrackPublishOptions()
    );
    this.publication = publication;
    this.#logger.debug(`Background audio track published: ${this.publication.sid}`);
  }
  onReconnected = () => {
    if (this.republishTask) {
      this.republishTask.cancel();
    }
    this.publication = void 0;
    this.republishTask = Task.from(async () => {
      await this.republishTrackTask();
    });
  };
  async republishTrackTask() {
    await this.publishTrack();
  }
  onAgentStateChanged = (ev) => {
    var _a;
    if (!this.thinkingSound) {
      return;
    }
    if (ev.newState === "thinking") {
      if (this.thinkingHandle && !this.thinkingHandle.done()) {
        return;
      }
    } else {
      (_a = this.thinkingHandle) == null ? void 0 : _a.stop();
    }
  };
  async playTask({
    playHandle,
    sound,
    volume,
    loop,
    signal
  }) {
    if (isBuiltinAudioClip(sound)) {
      sound = getBuiltinAudioPath(sound);
    }
    if (typeof sound === "string") {
      sound = loop ? loopAudioFramesFromFile(sound, { abortSignal: signal }) : audioFramesFromFile(sound, { abortSignal: signal });
    }
    try {
      for await (const frame of sound) {
        if (signal.aborted || playHandle.done()) break;
        let processedFrame;
        if (volume !== 1) {
          const int16Data = new Int16Array(
            frame.data.buffer,
            frame.data.byteOffset,
            frame.data.byteLength / 2
          );
          const float32Data = new Float32Array(int16Data.length);
          for (let i = 0; i < int16Data.length; i++) {
            float32Data[i] = int16Data[i];
          }
          const volumeFactor = 10 ** Math.log10(volume);
          for (let i = 0; i < float32Data.length; i++) {
            float32Data[i] *= volumeFactor;
          }
          const outputData = new Int16Array(float32Data.length);
          for (let i = 0; i < float32Data.length; i++) {
            const clipped = Math.max(-32768, Math.min(32767, float32Data[i]));
            outputData[i] = Math.round(clipped);
          }
          processedFrame = new AudioFrame(
            outputData,
            frame.sampleRate,
            frame.channels,
            frame.samplesPerChannel
          );
        } else {
          processedFrame = frame;
        }
        await this.audioSource.captureFrame(processedFrame);
      }
    } finally {
      playHandle._markPlayoutDone();
    }
  }
}
export {
  BackgroundAudioPlayer,
  BuiltinAudioClip,
  PlayHandle,
  getBuiltinAudioPath,
  isBuiltinAudioClip
};
//# sourceMappingURL=background_audio.js.map