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
var trace_types_exports = {};
__export(trace_types_exports, {
  ATTR_AGENT_LABEL: () => ATTR_AGENT_LABEL,
  ATTR_AGENT_NAME: () => ATTR_AGENT_NAME,
  ATTR_CHAT_CTX: () => ATTR_CHAT_CTX,
  ATTR_END_OF_TURN_DELAY: () => ATTR_END_OF_TURN_DELAY,
  ATTR_END_TIME: () => ATTR_END_TIME,
  ATTR_EOU_DELAY: () => ATTR_EOU_DELAY,
  ATTR_EOU_LANGUAGE: () => ATTR_EOU_LANGUAGE,
  ATTR_EOU_PROBABILITY: () => ATTR_EOU_PROBABILITY,
  ATTR_EOU_UNLIKELY_THRESHOLD: () => ATTR_EOU_UNLIKELY_THRESHOLD,
  ATTR_EXCEPTION_MESSAGE: () => ATTR_EXCEPTION_MESSAGE,
  ATTR_EXCEPTION_TRACE: () => ATTR_EXCEPTION_TRACE,
  ATTR_EXCEPTION_TYPE: () => ATTR_EXCEPTION_TYPE,
  ATTR_FUNCTION_TOOLS: () => ATTR_FUNCTION_TOOLS,
  ATTR_FUNCTION_TOOL_ARGS: () => ATTR_FUNCTION_TOOL_ARGS,
  ATTR_FUNCTION_TOOL_IS_ERROR: () => ATTR_FUNCTION_TOOL_IS_ERROR,
  ATTR_FUNCTION_TOOL_NAME: () => ATTR_FUNCTION_TOOL_NAME,
  ATTR_FUNCTION_TOOL_OUTPUT: () => ATTR_FUNCTION_TOOL_OUTPUT,
  ATTR_GEN_AI_OPERATION_NAME: () => ATTR_GEN_AI_OPERATION_NAME,
  ATTR_GEN_AI_REQUEST_MODEL: () => ATTR_GEN_AI_REQUEST_MODEL,
  ATTR_GEN_AI_USAGE_INPUT_AUDIO_TOKENS: () => ATTR_GEN_AI_USAGE_INPUT_AUDIO_TOKENS,
  ATTR_GEN_AI_USAGE_INPUT_CACHED_TOKENS: () => ATTR_GEN_AI_USAGE_INPUT_CACHED_TOKENS,
  ATTR_GEN_AI_USAGE_INPUT_TEXT_TOKENS: () => ATTR_GEN_AI_USAGE_INPUT_TEXT_TOKENS,
  ATTR_GEN_AI_USAGE_INPUT_TOKENS: () => ATTR_GEN_AI_USAGE_INPUT_TOKENS,
  ATTR_GEN_AI_USAGE_OUTPUT_AUDIO_TOKENS: () => ATTR_GEN_AI_USAGE_OUTPUT_AUDIO_TOKENS,
  ATTR_GEN_AI_USAGE_OUTPUT_TEXT_TOKENS: () => ATTR_GEN_AI_USAGE_OUTPUT_TEXT_TOKENS,
  ATTR_GEN_AI_USAGE_OUTPUT_TOKENS: () => ATTR_GEN_AI_USAGE_OUTPUT_TOKENS,
  ATTR_INSTRUCTIONS: () => ATTR_INSTRUCTIONS,
  ATTR_JOB_ID: () => ATTR_JOB_ID,
  ATTR_LANGFUSE_COMPLETION_START_TIME: () => ATTR_LANGFUSE_COMPLETION_START_TIME,
  ATTR_LLM_METRICS: () => ATTR_LLM_METRICS,
  ATTR_PARTICIPANT_ID: () => ATTR_PARTICIPANT_ID,
  ATTR_PARTICIPANT_IDENTITY: () => ATTR_PARTICIPANT_IDENTITY,
  ATTR_PARTICIPANT_KIND: () => ATTR_PARTICIPANT_KIND,
  ATTR_REALTIME_MODEL_METRICS: () => ATTR_REALTIME_MODEL_METRICS,
  ATTR_RESPONSE_FUNCTION_CALLS: () => ATTR_RESPONSE_FUNCTION_CALLS,
  ATTR_RESPONSE_TEXT: () => ATTR_RESPONSE_TEXT,
  ATTR_RETRY_COUNT: () => ATTR_RETRY_COUNT,
  ATTR_ROOM_NAME: () => ATTR_ROOM_NAME,
  ATTR_SESSION_OPTIONS: () => ATTR_SESSION_OPTIONS,
  ATTR_SPEECH_ID: () => ATTR_SPEECH_ID,
  ATTR_SPEECH_INTERRUPTED: () => ATTR_SPEECH_INTERRUPTED,
  ATTR_START_TIME: () => ATTR_START_TIME,
  ATTR_TRANSCRIPTION_DELAY: () => ATTR_TRANSCRIPTION_DELAY,
  ATTR_TRANSCRIPT_CONFIDENCE: () => ATTR_TRANSCRIPT_CONFIDENCE,
  ATTR_TTS_INPUT_TEXT: () => ATTR_TTS_INPUT_TEXT,
  ATTR_TTS_LABEL: () => ATTR_TTS_LABEL,
  ATTR_TTS_METRICS: () => ATTR_TTS_METRICS,
  ATTR_TTS_STREAMING: () => ATTR_TTS_STREAMING,
  ATTR_USER_INPUT: () => ATTR_USER_INPUT,
  ATTR_USER_TRANSCRIPT: () => ATTR_USER_TRANSCRIPT,
  EVENT_GEN_AI_ASSISTANT_MESSAGE: () => EVENT_GEN_AI_ASSISTANT_MESSAGE,
  EVENT_GEN_AI_CHOICE: () => EVENT_GEN_AI_CHOICE,
  EVENT_GEN_AI_SYSTEM_MESSAGE: () => EVENT_GEN_AI_SYSTEM_MESSAGE,
  EVENT_GEN_AI_TOOL_MESSAGE: () => EVENT_GEN_AI_TOOL_MESSAGE,
  EVENT_GEN_AI_USER_MESSAGE: () => EVENT_GEN_AI_USER_MESSAGE
});
module.exports = __toCommonJS(trace_types_exports);
const ATTR_SPEECH_ID = "lk.speech_id";
const ATTR_AGENT_LABEL = "lk.agent_label";
const ATTR_START_TIME = "lk.start_time";
const ATTR_END_TIME = "lk.end_time";
const ATTR_RETRY_COUNT = "lk.retry_count";
const ATTR_PARTICIPANT_ID = "lk.participant_id";
const ATTR_PARTICIPANT_IDENTITY = "lk.participant_identity";
const ATTR_PARTICIPANT_KIND = "lk.participant_kind";
const ATTR_JOB_ID = "lk.job_id";
const ATTR_AGENT_NAME = "lk.agent_name";
const ATTR_ROOM_NAME = "lk.room_name";
const ATTR_SESSION_OPTIONS = "lk.session_options";
const ATTR_USER_INPUT = "lk.user_input";
const ATTR_INSTRUCTIONS = "lk.instructions";
const ATTR_SPEECH_INTERRUPTED = "lk.interrupted";
const ATTR_CHAT_CTX = "lk.chat_ctx";
const ATTR_FUNCTION_TOOLS = "lk.function_tools";
const ATTR_RESPONSE_TEXT = "lk.response.text";
const ATTR_RESPONSE_FUNCTION_CALLS = "lk.response.function_calls";
const ATTR_FUNCTION_TOOL_NAME = "lk.function_tool.name";
const ATTR_FUNCTION_TOOL_ARGS = "lk.function_tool.arguments";
const ATTR_FUNCTION_TOOL_IS_ERROR = "lk.function_tool.is_error";
const ATTR_FUNCTION_TOOL_OUTPUT = "lk.function_tool.output";
const ATTR_TTS_INPUT_TEXT = "lk.input_text";
const ATTR_TTS_STREAMING = "lk.tts.streaming";
const ATTR_TTS_LABEL = "lk.tts.label";
const ATTR_EOU_PROBABILITY = "lk.eou.probability";
const ATTR_EOU_UNLIKELY_THRESHOLD = "lk.eou.unlikely_threshold";
const ATTR_EOU_DELAY = "lk.eou.endpointing_delay";
const ATTR_EOU_LANGUAGE = "lk.eou.language";
const ATTR_USER_TRANSCRIPT = "lk.user_transcript";
const ATTR_TRANSCRIPT_CONFIDENCE = "lk.transcript_confidence";
const ATTR_TRANSCRIPTION_DELAY = "lk.transcription_delay";
const ATTR_END_OF_TURN_DELAY = "lk.end_of_turn_delay";
const ATTR_LLM_METRICS = "lk.llm_metrics";
const ATTR_TTS_METRICS = "lk.tts_metrics";
const ATTR_REALTIME_MODEL_METRICS = "lk.realtime_model_metrics";
const ATTR_GEN_AI_OPERATION_NAME = "gen_ai.operation.name";
const ATTR_GEN_AI_REQUEST_MODEL = "gen_ai.request.model";
const ATTR_GEN_AI_USAGE_INPUT_TOKENS = "gen_ai.usage.input_tokens";
const ATTR_GEN_AI_USAGE_OUTPUT_TOKENS = "gen_ai.usage.output_tokens";
const ATTR_GEN_AI_USAGE_INPUT_TEXT_TOKENS = "gen_ai.usage.input_text_tokens";
const ATTR_GEN_AI_USAGE_INPUT_AUDIO_TOKENS = "gen_ai.usage.input_audio_tokens";
const ATTR_GEN_AI_USAGE_INPUT_CACHED_TOKENS = "gen_ai.usage.input_cached_tokens";
const ATTR_GEN_AI_USAGE_OUTPUT_TEXT_TOKENS = "gen_ai.usage.output_text_tokens";
const ATTR_GEN_AI_USAGE_OUTPUT_AUDIO_TOKENS = "gen_ai.usage.output_audio_tokens";
const EVENT_GEN_AI_SYSTEM_MESSAGE = "gen_ai.system.message";
const EVENT_GEN_AI_USER_MESSAGE = "gen_ai.user.message";
const EVENT_GEN_AI_ASSISTANT_MESSAGE = "gen_ai.assistant.message";
const EVENT_GEN_AI_TOOL_MESSAGE = "gen_ai.tool.message";
const EVENT_GEN_AI_CHOICE = "gen_ai.choice";
const ATTR_EXCEPTION_TRACE = "exception.stacktrace";
const ATTR_EXCEPTION_TYPE = "exception.type";
const ATTR_EXCEPTION_MESSAGE = "exception.message";
const ATTR_LANGFUSE_COMPLETION_START_TIME = "langfuse.observation.completion_start_time";
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ATTR_AGENT_LABEL,
  ATTR_AGENT_NAME,
  ATTR_CHAT_CTX,
  ATTR_END_OF_TURN_DELAY,
  ATTR_END_TIME,
  ATTR_EOU_DELAY,
  ATTR_EOU_LANGUAGE,
  ATTR_EOU_PROBABILITY,
  ATTR_EOU_UNLIKELY_THRESHOLD,
  ATTR_EXCEPTION_MESSAGE,
  ATTR_EXCEPTION_TRACE,
  ATTR_EXCEPTION_TYPE,
  ATTR_FUNCTION_TOOLS,
  ATTR_FUNCTION_TOOL_ARGS,
  ATTR_FUNCTION_TOOL_IS_ERROR,
  ATTR_FUNCTION_TOOL_NAME,
  ATTR_FUNCTION_TOOL_OUTPUT,
  ATTR_GEN_AI_OPERATION_NAME,
  ATTR_GEN_AI_REQUEST_MODEL,
  ATTR_GEN_AI_USAGE_INPUT_AUDIO_TOKENS,
  ATTR_GEN_AI_USAGE_INPUT_CACHED_TOKENS,
  ATTR_GEN_AI_USAGE_INPUT_TEXT_TOKENS,
  ATTR_GEN_AI_USAGE_INPUT_TOKENS,
  ATTR_GEN_AI_USAGE_OUTPUT_AUDIO_TOKENS,
  ATTR_GEN_AI_USAGE_OUTPUT_TEXT_TOKENS,
  ATTR_GEN_AI_USAGE_OUTPUT_TOKENS,
  ATTR_INSTRUCTIONS,
  ATTR_JOB_ID,
  ATTR_LANGFUSE_COMPLETION_START_TIME,
  ATTR_LLM_METRICS,
  ATTR_PARTICIPANT_ID,
  ATTR_PARTICIPANT_IDENTITY,
  ATTR_PARTICIPANT_KIND,
  ATTR_REALTIME_MODEL_METRICS,
  ATTR_RESPONSE_FUNCTION_CALLS,
  ATTR_RESPONSE_TEXT,
  ATTR_RETRY_COUNT,
  ATTR_ROOM_NAME,
  ATTR_SESSION_OPTIONS,
  ATTR_SPEECH_ID,
  ATTR_SPEECH_INTERRUPTED,
  ATTR_START_TIME,
  ATTR_TRANSCRIPTION_DELAY,
  ATTR_TRANSCRIPT_CONFIDENCE,
  ATTR_TTS_INPUT_TEXT,
  ATTR_TTS_LABEL,
  ATTR_TTS_METRICS,
  ATTR_TTS_STREAMING,
  ATTR_USER_INPUT,
  ATTR_USER_TRANSCRIPT,
  EVENT_GEN_AI_ASSISTANT_MESSAGE,
  EVENT_GEN_AI_CHOICE,
  EVENT_GEN_AI_SYSTEM_MESSAGE,
  EVENT_GEN_AI_TOOL_MESSAGE,
  EVENT_GEN_AI_USER_MESSAGE
});
//# sourceMappingURL=trace_types.cjs.map