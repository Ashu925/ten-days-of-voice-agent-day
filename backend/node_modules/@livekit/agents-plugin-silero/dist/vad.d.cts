/// <reference path="../src/onnxruntime.d.ts" />
import { VADStream as baseStream, VAD as baseVAD } from '@livekit/agents';
import type { InferenceSession } from 'onnxruntime-node';
import type { SampleRate } from './onnx_model.js';
import { OnnxModel } from './onnx_model.js';
export interface VADOptions {
    /** Minimum duration of speech to start a new speech chunk */
    minSpeechDuration: number;
    /** At the end of each speech, wait this duration before ending the speech */
    minSilenceDuration: number;
    /** Duration of padding to add to the beginning of each speech chunk */
    prefixPaddingDuration: number;
    /** Maximum duration of speech to keep in the buffer */
    maxBufferedSpeech: number;
    /** Maximum duration of speech to keep in the buffer*/
    activationThreshold: number;
    /** Sample rate for the inference (only 8KHz and 16KHz are supported) */
    sampleRate: SampleRate;
    /** Force the use of CPU for inference */
    forceCPU: boolean;
}
export declare class VAD extends baseVAD {
    #private;
    label: string;
    constructor(session: InferenceSession, opts: VADOptions);
    /**
     * Updates the VAD options with new values.
     *
     * @param opts - Partial options object containing the values to update
     * @remarks
     * This method will merge the provided options with existing options and update all active streams.
     * Only the properties specified in opts will be updated, other properties retain their current values.
     */
    updateOptions(opts: Partial<VADOptions>): void;
    /**
     * Load and initialize the Silero VAD model.
     *
     * This method loads the ONNX model and prepares it for inference. When options are not provided,
     * sane defaults are used.
     *
     * @remarks
     * This method may take time to load the model into memory.
     * It is recommended to call this method inside your prewarm mechanism.
     *
     * @example
     * ```ts
     * export default defineAgent({
     *   prewarm: async (proc: JobProcess) => {
     *     proc.userData.vad = await VAD.load();
     *   },
     *   entry: async (ctx: JobContext) => {
     *     const vad = ctx.proc.userData.vad! as VAD;
     *     // the rest of your agent logic
     *   },
     * });
     * ```
     *
     * @param options -
     * @returns Promise\<{@link VAD}\>: An instance of the VAD class ready for streaming.
     */
    static load(opts?: Partial<VADOptions>): Promise<VAD>;
    stream(): VADStream;
}
export declare class VADStream extends baseStream {
    #private;
    constructor(vad: VAD, opts: VADOptions, model: OnnxModel);
    /**
     * Update the VAD options
     *
     * @param opts - Partial options object containing the values to update
     * @remarks
     * This method allows you to update the VAD options after the VAD object has been created
     */
    updateOptions(opts: Partial<VADOptions>): void;
}
//# sourceMappingURL=vad.d.ts.map