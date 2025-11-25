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
var agent_session_exports = {};
__export(agent_session_exports, {
  AgentSession: () => AgentSession
});
module.exports = __toCommonJS(agent_session_exports);
var import_node_events = require("node:events");
var import_inference = require("../inference/index.cjs");
var import_job = require("../job.cjs");
var import_chat_context = require("../llm/chat_context.cjs");
var import_log = require("../log.cjs");
var import_agent_activity = require("./agent_activity.cjs");
var import_events = require("./events.cjs");
var import_io = require("./io.cjs");
var import_room_io = require("./room_io/index.cjs");
const defaultVoiceOptions = {
  allowInterruptions: true,
  discardAudioIfUninterruptible: true,
  minInterruptionDuration: 500,
  minInterruptionWords: 0,
  minEndpointingDelay: 500,
  maxEndpointingDelay: 6e3,
  maxToolSteps: 3,
  preemptiveGeneration: false,
  userAwayTimeout: 15
};
class AgentSession extends import_node_events.EventEmitter {
  vad;
  stt;
  llm;
  tts;
  turnDetection;
  options;
  agent;
  activity;
  nextActivity;
  started = false;
  userState = "listening";
  roomIO;
  logger = (0, import_log.log)();
  _chatCtx;
  _userData;
  _agentState = "initializing";
  _input;
  _output;
  closingTask = null;
  userAwayTimer = null;
  /** @internal */
  _recordedEvents = [];
  constructor(opts) {
    super();
    const {
      vad,
      stt,
      llm,
      tts,
      turnDetection,
      userData,
      voiceOptions = defaultVoiceOptions
    } = opts;
    this.vad = vad;
    if (typeof stt === "string") {
      this.stt = import_inference.STT.fromModelString(stt);
    } else {
      this.stt = stt;
    }
    if (typeof llm === "string") {
      this.llm = import_inference.LLM.fromModelString(llm);
    } else {
      this.llm = llm;
    }
    if (typeof tts === "string") {
      this.tts = import_inference.TTS.fromModelString(tts);
    } else {
      this.tts = tts;
    }
    this.turnDetection = turnDetection;
    this._userData = userData;
    this._input = new import_io.AgentInput(this.onAudioInputChanged);
    this._output = new import_io.AgentOutput(this.onAudioOutputChanged, this.onTextOutputChanged);
    this._chatCtx = import_chat_context.ChatContext.empty();
    this.options = { ...defaultVoiceOptions, ...voiceOptions };
    this.on(import_events.AgentSessionEventTypes.UserInputTranscribed, this._onUserInputTranscribed.bind(this));
  }
  emit(event, ...args) {
    const eventData = args[0];
    this._recordedEvents.push(eventData);
    return super.emit(event, ...args);
  }
  get input() {
    return this._input;
  }
  get output() {
    return this._output;
  }
  get userData() {
    if (this._userData === void 0) {
      throw new Error("Voice agent userData is not set");
    }
    return this._userData;
  }
  get history() {
    return this._chatCtx;
  }
  set userData(value) {
    this._userData = value;
  }
  async start({
    // TODO(brian): PR2 - Add setupCloudTracer() call if on LiveKit Cloud with recording enabled
    // TODO(brian): PR3 - Add span: this._sessionSpan = tracer.startSpan('agent_session'), store as instance property
    // TODO(brian): PR4 - Add setupCloudLogger() call in setupCloudTracer() to setup OTEL logging with Pino bridge
    agent,
    room,
    inputOptions,
    outputOptions,
    record = true
  }) {
    if (this.started) {
      return;
    }
    this.agent = agent;
    this._updateAgentState("initializing");
    const tasks = [];
    if (this.input.audio && (inputOptions == null ? void 0 : inputOptions.audioEnabled) !== false) {
      this.logger.warn("RoomIO audio input is enabled but input.audio is already set, ignoring..");
    }
    if (this.output.audio && (outputOptions == null ? void 0 : outputOptions.audioEnabled) !== false) {
      this.logger.warn(
        "RoomIO audio output is enabled but output.audio is already set, ignoring.."
      );
    }
    if (this.output.transcription && (outputOptions == null ? void 0 : outputOptions.transcriptionEnabled) !== false) {
      this.logger.warn(
        "RoomIO transcription output is enabled but output.transcription is already set, ignoring.."
      );
    }
    this.roomIO = new import_room_io.RoomIO({
      agentSession: this,
      room,
      inputOptions,
      outputOptions
    });
    this.roomIO.start();
    const ctx = (0, import_job.getJobContext)();
    if (ctx && ctx.room === room && !room.isConnected) {
      this.logger.debug("Auto-connecting to room via job context");
      tasks.push(ctx.connect());
    }
    if (record) {
      if (ctx._primaryAgentSession === void 0) {
        ctx._primaryAgentSession = this;
      } else {
        throw new Error(
          "Only one `AgentSession` can be the primary at a time. If you want to ignore primary designation, use session.start(record=False)."
        );
      }
    }
    tasks.push(this.updateActivity(this.agent));
    await Promise.allSettled(tasks);
    this.logger.debug(
      `using audio io: ${this.input.audio ? "`" + this.input.audio.constructor.name + "`" : "(none)"} -> \`AgentSession\` -> ${this.output.audio ? "`" + this.output.audio.constructor.name + "`" : "(none)"}`
    );
    this.logger.debug(
      `using transcript io: \`AgentSession\` -> ${this.output.transcription ? "`" + this.output.transcription.constructor.name + "`" : "(none)"}`
    );
    this.started = true;
    this._updateAgentState("listening");
  }
  updateAgent(agent) {
    this.agent = agent;
    if (this.started) {
      this.updateActivity(agent);
    }
  }
  commitUserTurn() {
    if (!this.activity) {
      throw new Error("AgentSession is not running");
    }
    this.activity.commitUserTurn();
  }
  clearUserTurn() {
    if (!this.activity) {
      throw new Error("AgentSession is not running");
    }
    this.activity.clearUserTurn();
  }
  say(text, options) {
    if (!this.activity) {
      throw new Error("AgentSession is not running");
    }
    return this.activity.say(text, options);
  }
  interrupt() {
    if (!this.activity) {
      throw new Error("AgentSession is not running");
    }
    return this.activity.interrupt();
  }
  generateReply(options) {
    if (!this.activity) {
      throw new Error("AgentSession is not running");
    }
    const userMessage = (options == null ? void 0 : options.userInput) ? new import_chat_context.ChatMessage({
      role: "user",
      content: options.userInput
    }) : void 0;
    if (this.activity.draining) {
      if (!this.nextActivity) {
        throw new Error("AgentSession is closing, cannot use generateReply()");
      }
      return this.nextActivity.generateReply({ userMessage, ...options });
    }
    return this.activity.generateReply({ userMessage, ...options });
  }
  async updateActivity(agent) {
    this.nextActivity = new import_agent_activity.AgentActivity(agent, this);
    const previousActivity = this.activity;
    if (this.activity) {
      await this.activity.drain();
      await this.activity.close();
    }
    this.activity = this.nextActivity;
    this.nextActivity = void 0;
    this._chatCtx.insert(
      new import_chat_context.AgentHandoffItem({
        oldAgentId: previousActivity == null ? void 0 : previousActivity.agent.id,
        newAgentId: agent.id
      })
    );
    this.logger.debug({ previousActivity, agent }, "Agent handoff inserted into chat context");
    await this.activity.start();
    if (this._input.audio) {
      this.activity.attachAudioInput(this._input.audio.stream);
    }
  }
  get chatCtx() {
    return this._chatCtx.copy();
  }
  get agentState() {
    return this._agentState;
  }
  get currentAgent() {
    if (!this.agent) {
      throw new Error("AgentSession is not running");
    }
    return this.agent;
  }
  async close() {
    await this.closeImpl(import_events.CloseReason.USER_INITIATED);
  }
  /** @internal */
  _closeSoon({
    reason,
    drain = false,
    error = null
  }) {
    if (this.closingTask) {
      return;
    }
    this.closeImpl(reason, error, drain);
  }
  /** @internal */
  _onError(error) {
    if (this.closingTask || error.recoverable) {
      return;
    }
    this.logger.error(error, "AgentSession is closing due to unrecoverable error");
    this.closingTask = (async () => {
      await this.closeImpl(import_events.CloseReason.ERROR, error);
    })().then(() => {
      this.closingTask = null;
    });
  }
  /** @internal */
  _conversationItemAdded(item) {
    this._chatCtx.insert(item);
    this.emit(import_events.AgentSessionEventTypes.ConversationItemAdded, (0, import_events.createConversationItemAddedEvent)(item));
  }
  /** @internal */
  _updateAgentState(state) {
    if (this._agentState === state) {
      return;
    }
    const oldState = this._agentState;
    this._agentState = state;
    if (state === "listening" && this.userState === "listening") {
      this._setUserAwayTimer();
    } else {
      this._cancelUserAwayTimer();
    }
    this.emit(
      import_events.AgentSessionEventTypes.AgentStateChanged,
      (0, import_events.createAgentStateChangedEvent)(oldState, state)
    );
  }
  /** @internal */
  _updateUserState(state, _lastSpeakingTime) {
    if (this.userState === state) {
      return;
    }
    const oldState = this.userState;
    this.userState = state;
    if (state === "listening" && this._agentState === "listening") {
      this._setUserAwayTimer();
    } else {
      this._cancelUserAwayTimer();
    }
    this.emit(
      import_events.AgentSessionEventTypes.UserStateChanged,
      (0, import_events.createUserStateChangedEvent)(oldState, state)
    );
  }
  // -- User changed input/output streams/sinks --
  onAudioInputChanged() {
    if (!this.started) {
      return;
    }
    if (this.activity && this._input.audio) {
      this.activity.attachAudioInput(this._input.audio.stream);
    }
  }
  onAudioOutputChanged() {
  }
  onTextOutputChanged() {
  }
  _setUserAwayTimer() {
    this._cancelUserAwayTimer();
    if (this.options.userAwayTimeout === null || this.options.userAwayTimeout === void 0) {
      return;
    }
    if (this.roomIO && !this.roomIO.isParticipantAvailable) {
      return;
    }
    this.userAwayTimer = setTimeout(() => {
      this.logger.debug("User away timeout triggered");
      this._updateUserState("away");
    }, this.options.userAwayTimeout * 1e3);
  }
  _cancelUserAwayTimer() {
    if (this.userAwayTimer !== null) {
      clearTimeout(this.userAwayTimer);
      this.userAwayTimer = null;
    }
  }
  _onUserInputTranscribed(ev) {
    if (this.userState === "away" && ev.isFinal) {
      this.logger.debug("User returned from away state due to speech input");
      this._updateUserState("listening");
    }
  }
  async closeImpl(reason, error = null, drain = false) {
    var _a, _b, _c;
    if (!this.started) {
      return;
    }
    this._cancelUserAwayTimer();
    if (this.activity) {
      if (!drain) {
        try {
          this.activity.interrupt();
        } catch (error2) {
        }
      }
      await this.activity.drain();
      await ((_a = this.activity.currentSpeech) == null ? void 0 : _a.waitForPlayout());
      this.activity.detachAudioInput();
    }
    this.input.audio = null;
    this.output.audio = null;
    this.output.transcription = null;
    await ((_b = this.roomIO) == null ? void 0 : _b.close());
    this.roomIO = void 0;
    await ((_c = this.activity) == null ? void 0 : _c.close());
    this.activity = void 0;
    this.started = false;
    this.emit(import_events.AgentSessionEventTypes.Close, (0, import_events.createCloseEvent)(reason, error));
    this.userState = "listening";
    this._agentState = "initializing";
    this.logger.info({ reason, error }, "AgentSession closed");
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AgentSession
});
//# sourceMappingURL=agent_session.cjs.map