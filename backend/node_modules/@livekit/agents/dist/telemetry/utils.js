import { SpanStatusCode, context as otelContext, trace } from "@opentelemetry/api";
import * as traceTypes from "./trace_types.js";
import { tracer } from "./traces.js";
function recordException(span, error) {
  span.recordException(error);
  span.setStatus({
    code: SpanStatusCode.ERROR,
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
    const currentContext = otelContext.active();
    const spanContext = trace.setSpan(currentContext, span);
    tracer.getTracer().startActiveSpan("realtime_metrics", {}, spanContext, (child) => {
      try {
        child.setAttributes(attrs);
      } finally {
        child.end();
      }
    });
  }
}
export {
  recordException,
  recordRealtimeMetrics
};
//# sourceMappingURL=utils.js.map