import { EOUModel, EOURunnerBase } from './base.js';
export declare const INFERENCE_METHOD_EN = "lk_end_of_utterance_en";
export declare class EOURunnerEn extends EOURunnerBase {
    constructor();
}
export declare class EnglishModel extends EOUModel {
    constructor(unlikelyThreshold?: number);
    inferenceMethod(): string;
}
export default EOURunnerEn;
//# sourceMappingURL=english.d.ts.map