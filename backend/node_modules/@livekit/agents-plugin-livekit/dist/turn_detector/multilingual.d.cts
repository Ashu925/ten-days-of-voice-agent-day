import type { llm } from '@livekit/agents';
import { EOUModel, EOURunnerBase } from './base.js';
export declare const INFERENCE_METHOD_MULTILINGUAL = "lk_end_of_utterance_multilingual";
export declare class EUORunnerMultilingual extends EOURunnerBase {
    constructor();
}
export declare class MultilingualModel extends EOUModel {
    #private;
    constructor(unlikelyThreshold?: number);
    inferenceMethod(): string;
    unlikelyThreshold(language?: string): Promise<number | undefined>;
    predictEndOfTurn(chatCtx: llm.ChatContext, timeout?: number): Promise<number>;
}
export default EUORunnerMultilingual;
//# sourceMappingURL=multilingual.d.ts.map