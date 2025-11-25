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
var utils_exports = {};
__export(utils_exports, {
  recordException: () => recordException,
  recordRealtimeMetrics: () => recordRealtimeMetrics
});
module.exports = __toCommonJS(utils_exports);
var import_api = require("@opentelemetry/api");
var traceTypes = __toESM(require("./trace_types.cjs"), 1);
var import_traces = require("./traces.cjs");
function recordException(span, error) {
  span.recordException(error);
  span.setStatus({
    code: import_api.SpanStatusCode.ERROR,
    message: error.message
  });
  span.setAttributes({
    [traceTypes.ATTR_EXCEPTION_TYPE]: error.constructor.name,
    [traceTypes.ATTR_EXCEPTION_MESSAGE]: error.message,
    [traceTypes.ATTR_EXCEPTION_TRACE]: error.stack || ""
  });
}
function recordRealtimeMetrics(span, metrics) {
  const attrs = {
    [traceTypes.ATTR_GEN_AI_REQUEST_MODEL]: metrics.label || "unknown",
    [traceTypes.ATTR_REALTIME_MODEL_METRICS]: JSON.stringify(metrics),
    [traceTypes.ATTR_GEN_AI_USAGE_INPUT_TOKENS]: metrics.inputTokens,
    [traceTypes.ATTR_GEN_AI_USAGE_OUTPUT_TOKENS]: metrics.outputTokens,
    [traceTypes.ATTR_GEN_AI_USAGE_INPUT_TEXT_TOKENS]: metrics.inputTokenDetails.textTokens,
    [traceTypes.ATTR_GEN_AI_USAGE_INPUT_AUDIO_TOKENS]: metrics.inputTokenDetails.audioTokens,
    [traceTypes.ATTR_GEN_AI_USAGE_INPUT_CACHED_TOKENS]: metrics.inputTokenDetails.cachedTokens,
    [traceTypes.ATTR_GEN_AI_USAGE_OUTPUT_TEXT_TOKENS]: metrics.outputTokenDetails.textTokens,
    [traceTypes.ATTR_GEN_AI_USAGE_OUTPUT_AUDIO_TOKENS]: metrics.outputTokenDetails.audioTokens
  };
  if (metrics.ttftMs !== void 0 && metrics.ttftMs !== -1) {
    const completionStartTime = metrics.timestamp + metrics.ttftMs;
    const completionStartTimeUtc = new Date(completionStartTime).toISOString();
    attrs[traceTypes.ATTR_LANGFUSE_COMPLETION_START_TIME] = completionStartTimeUtc;
  }
  if (span.isRecording()) {
    span.setAttributes(attrs);
  } else {
    const currentContext = import_api.context.active();
    const spanContext = import_api.trace.setSpan(currentContext, span);
    import_traces.tracer.getTracer().startActiveSpan("realtime_metrics", {}, spanContext, (child) => {
      try {
        child.setAttributes(attrs);
      } finally {
        child.end();
      }
    });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  recordException,
  recordRealtimeMetrics
});
//# sourceMappingURL=utils.cjs.map