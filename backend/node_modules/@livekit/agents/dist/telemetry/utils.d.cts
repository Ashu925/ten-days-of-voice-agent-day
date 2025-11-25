import { type Span } from '@opentelemetry/api';
import type { RealtimeModelMetrics } from '../metrics/base.js';
export declare function recordException(span: Span, error: Error): void;
export declare function recordRealtimeMetrics(span: Span, metrics: RealtimeModelMetrics): void;
//# sourceMappingURL=utils.d.ts.map