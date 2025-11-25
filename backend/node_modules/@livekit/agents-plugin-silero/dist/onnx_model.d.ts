/// <reference path="../src/onnxruntime.d.ts" />
import { InferenceSession } from 'onnxruntime-node';
export type SampleRate = 8000 | 16000;
export declare const newInferenceSession: (forceCPU: boolean) => Promise<InferenceSession>;
export declare class OnnxModel {
    #private;
    constructor(session: InferenceSession, sampleRate: SampleRate);
    get sampleRate(): number;
    get windowSizeSamples(): number;
    get contextSize(): number;
    run(x: Float32Array): Promise<number>;
}
//# sourceMappingURL=onnx_model.d.ts.map