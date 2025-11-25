import type { ChatContext } from '../llm/chat_context.js';
import type { VoiceOptions } from './agent_session.js';
import type { AgentEvent } from './events.js';
export interface SessionReport {
    jobId: string;
    roomId: string;
    room: string;
    options: VoiceOptions;
    events: AgentEvent[];
    chatHistory: ChatContext;
    enableUserDataTraining: boolean;
    timestamp: number;
}
export interface SessionReportOptions {
    jobId: string;
    roomId: string;
    room: string;
    options: VoiceOptions;
    events: AgentEvent[];
    chatHistory: ChatContext;
    enableUserDataTraining?: boolean;
    timestamp?: number;
}
export declare function createSessionReport(opts: SessionReportOptions): SessionReport;
export declare function sessionReportToJSON(report: SessionReport): Record<string, unknown>;
//# sourceMappingURL=report.d.ts.map