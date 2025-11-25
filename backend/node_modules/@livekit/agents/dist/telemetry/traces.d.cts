import { type Attributes, type Context, type Span, type Tracer, type TracerProvider } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
export interface StartSpanOptions {
    /** Name of the span */
    name: string;
    /** Optional parent context to use for this span */
    context?: Context;
    /** Attributes to set on the span when it starts */
    attributes?: Attributes;
    /** Whether to end the span when the function exits (default: true) */
    endOnExit?: boolean;
}
/**
 * A dynamic tracer that allows the tracer provider to be changed at runtime.
 */
declare class DynamicTracer {
    private tracerProvider;
    private tracer;
    private readonly instrumentingModuleName;
    constructor(instrumentingModuleName: string);
    /**
     * Set a new tracer provider. This updates the underlying tracer instance.
     * @param provider - The new tracer provider to use
     */
    setProvider(provider: TracerProvider): void;
    /**
     * Get the underlying OpenTelemetry tracer.
     * Use this to access the full Tracer API when needed.
     */
    getTracer(): Tracer;
    /**
     * Start a span manually (without making it active).
     * You must call span.end() when done.
     *
     * @param options - Span configuration including name
     * @returns The created span
     */
    startSpan(options: StartSpanOptions): Span;
    /**
     * Start a new span and make it active in the current context.
     * The span will automatically be ended when the provided function completes (unless endOnExit=false).
     *
     * @param fn - The function to execute within the span context
     * @param options - Span configuration including name
     * @returns The result of the provided function
     */
    startActiveSpan<T>(fn: (span: Span) => Promise<T>, options: StartSpanOptions): Promise<T>;
    /**
     * Synchronous version of startActiveSpan for non-async operations.
     *
     * @param fn - The function to execute within the span context
     * @param options - Span configuration including name
     * @returns The result of the provided function
     */
    startActiveSpanSync<T>(fn: (span: Span) => T, options: StartSpanOptions): T;
}
/**
 * The global tracer instance used throughout the agents framework.
 * This tracer can have its provider updated at runtime via setTracerProvider().
 */
export declare const tracer: DynamicTracer;
/**
 * Set the tracer provider for the livekit-agents framework.
 * This should be called before agent session start if using custom tracer providers.
 *
 * @param provider - The tracer provider to use (must be a NodeTracerProvider)
 * @param options - Optional configuration with metadata property to inject into all spans
 *
 * @example
 * ```typescript
 * import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
 * import { setTracerProvider } from '@livekit/agents/telemetry';
 *
 * const provider = new NodeTracerProvider();
 * setTracerProvider(provider, {
 *   metadata: { room_id: 'room123', job_id: 'job456' }
 * });
 * ```
 */
export declare function setTracerProvider(provider: NodeTracerProvider, options?: {
    metadata?: Attributes;
}): void;
/**
 * Setup OpenTelemetry tracer for LiveKit Cloud observability.
 * This configures OTLP exporters to send traces to LiveKit Cloud.
 *
 * @param options - Configuration for cloud tracer with roomId, jobId, and cloudHostname properties
 *
 * @internal
 */
export declare function setupCloudTracer(options: {
    roomId: string;
    jobId: string;
    cloudHostname: string;
}): Promise<void>;
export {};
//# sourceMappingURL=traces.d.ts.map