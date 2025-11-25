import {
  context as otelContext,
  trace
} from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { CompressionAlgorithm } from "@opentelemetry/otlp-exporter-base";
import { Resource } from "@opentelemetry/resources";
import { BatchSpanProcessor, NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { AccessToken } from "livekit-server-sdk";
class DynamicTracer {
  tracerProvider;
  tracer;
  instrumentingModuleName;
  constructor(instrumentingModuleName) {
    this.instrumentingModuleName = instrumentingModuleName;
    this.tracerProvider = trace.getTracerProvider();
    this.tracer = trace.getTracer(instrumentingModuleName);
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
    const ctx = options.context || otelContext.active();
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
    const ctx = options.context || otelContext.active();
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
    const ctx = options.context || otelContext.active();
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
  const token = new AccessToken(apiKey, apiSecret, {
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
    const resource = new Resource({
      [ATTR_SERVICE_NAME]: "livekit-agents",
      room_id: roomId,
      job_id: jobId
    });
    const spanExporter = new OTLPTraceExporter({
      url: `https://${cloudHostname}/observability/traces/otlp/v0`,
      headers,
      compression: CompressionAlgorithm.GZIP
    });
    const tracerProvider = new NodeTracerProvider({
      resource,
      spanProcessors: [new MetadataSpanProcessor(metadata), new BatchSpanProcessor(spanExporter)]
    });
    tracerProvider.register();
    setTracerProvider(tracerProvider);
  } catch (error) {
    console.error("Failed to setup cloud tracer:", error);
    throw error;
  }
}
export {
  setTracerProvider,
  setupCloudTracer,
  tracer
};
//# sourceMappingURL=traces.js.map