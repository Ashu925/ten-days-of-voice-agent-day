/// <reference types="node" resolution-mode="require"/>
import { AudioFrame } from '@livekit/rtc-node';
import type { ReadableStream } from 'node:stream/web';
import type { AudioBuffer } from './utils.js';
export interface AudioDecodeOptions {
    sampleRate?: number;
    numChannels?: number;
    /**
     * Audio format hint (e.g., 'mp3', 'ogg', 'wav', 'opus')
     * If not provided, FFmpeg will auto-detect
     */
    format?: string;
    abortSignal?: AbortSignal;
}
export declare function calculateAudioDurationSeconds(frame: AudioBuffer): number;
/** AudioByteStream translates between LiveKit AudioFrame packets and raw byte data. */
export declare class AudioByteStream {
    #private;
    constructor(sampleRate: number, numChannels: number, samplesPerChannel?: number | null);
    write(data: ArrayBuffer): AudioFrame[];
    flush(): AudioFrame[];
}
/**
 * Decode an audio file into AudioFrame instances
 *
 * @param filePath - Path to the audio file
 * @param options - Decoding options
 * @returns AsyncGenerator that yields AudioFrame objects
 *
 * @example
 * ```typescript
 * for await (const frame of audioFramesFromFile('audio.ogg', { sampleRate: 48000 })) {
 *   console.log('Frame:', frame.samplesPerChannel, 'samples');
 * }
 * ```
 */
export declare function audioFramesFromFile(filePath: string, options?: AudioDecodeOptions): ReadableStream<AudioFrame>;
/**
 * Loop audio frames from a file indefinitely
 *
 * @param filePath - Path to the audio file
 * @param options - Decoding options
 * @returns AsyncGenerator that yields AudioFrame objects in an infinite loop
 */
export declare function loopAudioFramesFromFile(filePath: string, options?: AudioDecodeOptions): AsyncGenerator<AudioFrame, void, unknown>;
//# sourceMappingURL=audio.d.ts.map