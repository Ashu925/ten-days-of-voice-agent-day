import type { ipc, llm } from '@livekit/agents';
import { Future, InferenceRunner } from '@livekit/agents';
import { type EOUModelType } from './constants.js';
type RawChatItem = {
    role: string;
    content: string;
};
type EOUOutput = {
    eouProbability: number;
    input: string;
    duration: number;
};
export declare abstract class EOURunnerBase extends InferenceRunner<RawChatItem[], EOUOutput> {
    #private;
    private modelType;
    private modelRevision;
    private session?;
    private tokenizer?;
    constructor(modelType: EOUModelType);
    initialize(): Promise<void>;
    run(data: RawChatItem[]): Promise<{
        eouProbability: number;
        input: string;
        duration: number;
    }>;
    close(): Promise<void>;
    private formatChatCtx;
}
export interface EOUModelOptions {
    modelType: EOUModelType;
    executor?: ipc.InferenceExecutor;
    unlikelyThreshold?: number;
    loadLanguages?: boolean;
}
type LanguageData = {
    threshold: number;
};
export declare abstract class EOUModel {
    #private;
    private modelType;
    private executor;
    private threshold;
    private loadLanguages;
    protected languagesFuture: Future<Record<string, LanguageData>>;
    constructor(opts: EOUModelOptions);
    unlikelyThreshold(language?: string): Promise<number | undefined>;
    supportsLanguage(language?: string): Promise<boolean>;
    predictEndOfTurn(chatCtx: llm.ChatContext, timeout?: number): Promise<number>;
    abstract inferenceMethod(): string;
}
export {};
//# sourceMappingURL=base.d.ts.map