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
var traces_exports = {};
__export(traces_exports, {
  setTracerProvider: () => setTracerProvider,
  setupCloudTracer: () => setupCloudTracer,
  tracer: () => tracer
});
module.exports = __toCommonJS(traces_exports);
var import_api = require("@opentelemetry/api");
var import_exporter_trace_otlp_http = require("@opentelemetry/exporter-trace-otlp-http");
var import_otlp_exporter_base = require("@opentelemetry/otlp-exporter-base");
var import_resources = require("@opentelemetry/resources");
var import_sdk_trace_node = require("@opentelemetry/sdk-trace-node");
var import_semantic_conventions = require("@opentelemetry/semantic-conventions");
var import_livekit_server_sdk = require("livekit-server-sdk");
class DynamicTracer {
  tracerProvider;
  tracer;
  instrumentingModuleName;
  constructor(instrumentingModuleName) {
    this.instrumentingModuleName = instrumentingModuleName;
    this.tracerProvider = import_api.trace.getTracerProvider();
    this.tracer = import_api.trace.getTracer(instrumentingModuleName);
  }
  /**
   * Set a new tracer provider. This updates the underlying tracer instance.
   * @param provider - The new tracer provider to use
   */
  setProvider(provider) {
    this.tracerProvider = provider;
    this.tracer = this.tracerProvider.getTracer(this.instrumentingModuleName);
  }
  /**
   * Get the underlying OpenTelemetry tracer.
   * Use this to access the full Tracer API when needed.
   */
  getTracer() {
    return this.tracer;
  }
  /**
   * Start a span manually (without making it active).
   * You must call span.end() when done.
   *
   * @param options - Span configuration including name
   * @returns The created span
   */
  startSpan(options) {
    const ctx = options.context || import_api.context.active();
    const span = this.tracer.startSpan(
      options.name,
      {
        attributes: options.attributes
      },
      ctx
    );
    return span;
  }
  /**
   * Start a new span and make it active in the current context.
   * The span will automatically be ended when the provided function completes (unless endOnExit=false).
   *
   * @param fn - The function to execute within the span context
   * @param options - Span configuration including name
   * @returns The result of the provided function
   */
  async startActiveSpan(fn, options) {
    const ctx = options.context || import_api.context.active();
    const endOnExit = options.endOnExit === void 0 ? true : options.endOnExit;
    const opts = { attributes: options.attributes };
    return new Promise((resolve, reject) => {
      this.tracer.startActiveSpan(options.name, opts, ctx, async (span) => {
        try {
          const result = await fn(span);
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          if (endOnExit) {
            span.end();
          }
        }
      });
    });
  }
  /**
   * Synchronous version of startActiveSpan for non-async operations.
   *
   * @param fn - The function to execute within the span context
   * @param options - Span configuration including name
   * @returns The result of the provided function
   */
  startActiveSpanSync(fn, options) {
    const ctx = options.context || import_api.context.active();
    const endOnExit = options.endOnExit === void 0 ? true : options.endOnExit;
    const opts = { attributes: options.attributes };
    return this.tracer.startActiveSpan(options.name, opts, ctx, (span) => {
      try {
        return fn(span);
      } finally {
        if (endOnExit) {
          span.end();
        }
      }
    });
  }
}
const tracer = new DynamicTracer("livekit-agents");
class MetadataSpanProcessor {
  metadata;
  constructor(metadata) {
    this.metadata = metadata;
  }
  onStart(span, _parentContext) {
    span.setAttributes(this.metadata);
  }
  onEnd(_span) {
  }
  shutdown() {
    return Promise.resolve();
  }
  forceFlush() {
    return Promise.resolve();
  }
}
function setTracerProvider(provider, options) {
  if (options == null ? void 0 : options.metadata) {
    provider.addSpanProcessor(new MetadataSpanProcessor(options.metadata));
  }
  tracer.setProvider(provider);
}
async function setupCloudTracer(options) {
  const { roomId, jobId, cloudHostname } = options;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error("LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set for cloud tracing");
  }
  const token = new import_livekit_server_sdk.AccessToken(apiKey, apiSecret, {
    identity: "livekit-agents-telemetry",
    ttl: "6h"
  });
  token.addObservabilityGrant({ write: true });
  try {
    const jwt = await token.toJwt();
    const headers = {
      Authorization: `Bearer ${jwt}`
    };
    const metadata = {
      room_id: roomId,
      job_id: jobId
    };
    const resource = new import_resources.Resource({
      [import_semantic_conventions.ATTR_SERVICE_NAME]: "livekit-agents",
      room_id: roomId,
      job_id: jobId
    });
    const spanExporter = new import_exporter_trace_otlp_http.OTLPTraceExporter({
      url: `https://${cloudHostname}/observability/traces/otlp/v0`,
      headers,
      compression: import_otlp_exporter_base.CompressionAlgorithm.GZIP
    });
    const tracerProvider = new import_sdk_trace_node.NodeTracerProvider({
      resource,
      spanProcessors: [new MetadataSpanProcessor(metadata), new import_sdk_trace_node.BatchSpanProcessor(spanExporter)]
    });
    tracerProvider.register();
    setTracerProvider(tracerProvider);
  } catch (error) {
    console.error("Failed to setup cloud tracer:", error);
    throw error;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  setTracerProvider,
  setupCloudTracer,
  tracer
});
//# sourceMappingURL=traces.cjs.map