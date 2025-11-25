import { AudioFrame, type LocalTrackPublication, type Room, TrackPublishOptions } from '@livekit/rtc-node';
import type { AgentSession } from './agent_session.js';
export declare enum BuiltinAudioClip {
    OFFICE_AMBIENCE = "office-ambience.ogg",
    KEYBOARD_TYPING = "keyboard-typing.ogg",
    KEYBOARD_TYPING2 = "keyboard-typing2.ogg"
}
export declare function isBuiltinAudioClip(source: AudioSourceType | AudioConfig | AudioConfig[]): source is BuiltinAudioClip;
export declare function getBuiltinAudioPath(clip: BuiltinAudioClip): string;
export type AudioSourceType = string | BuiltinAudioClip | AsyncIterable<AudioFrame>;
export interface AudioConfig {
    source: AudioSourceType;
    volume?: number;
    probability?: number;
}
export interface BackgroundAudioPlayerOptions {
    /**
     * Ambient sound to play continuously in the background.
     * Can be a file path, BuiltinAudioClip, or AudioConfig.
     * File paths will be looped automatically.
     */
    ambientSound?: AudioSourceType | AudioConfig | AudioConfig[];
    /**
     * Sound to play when the agent is thinking.
     * TODO (Brian): Implement thinking sound when AudioMixer becomes available
     */
    thinkingSound?: AudioSourceType | AudioConfig | AudioConfig[];
    /**
     * Stream timeout in milliseconds
     * @defaultValue 200
     */
    streamTimeoutMs?: number;
}
export interface BackgroundAudioStartOptions {
    room: Room;
    agentSession?: AgentSession;
    trackPublishOptions?: TrackPublishOptions;
}
export declare class PlayHandle {
    private doneFuture;
    private stopFuture;
    done(): boolean;
    stop(): void;
    waitForPlayout(): Promise<void>;
    _markPlayoutDone(): void;
}
/**
 * Manages background audio playback for LiveKit agent sessions
 *
 * This class handles playing ambient sounds and manages audio track publishing.
 * It supports:
 * - Continuous ambient sound playback with looping
 * - Volume control and probability-based sound selection
 * - Integration with LiveKit rooms and agent sessions
 *
 * Note: Thinking sound not yet supported
 *
 * @example
 * ```typescript
 * const player = new BackgroundAudioPlayer({
 *   ambientSound: { source: BuiltinAudioClip.OFFICE_AMBIENCE, volume: 0.8 },
 * });
 *
 * await player.start({ room, agentSession });
 * ```
 */
export declare class BackgroundAudioPlayer {
    #private;
    private ambientSound?;
    private thinkingSound?;
    private playTasks;
    private audioSource;
    private room?;
    private agentSession?;
    private publication?;
    private trackPublishOptions?;
    private republishTask?;
    private ambientHandle?;
    private thinkingHandle?;
    constructor(options?: BackgroundAudioPlayerOptions);
    /**
     * Select a sound from a list of background sound based on probability weights
     * Return undefined if no sound is selected (when sum of probabilities < 1.0).
     */
    private selectSoundFromList;
    private normalizeSoundSource;
    private normalizeBuiltinAudio;
    play(audio: AudioSourceType | AudioConfig | AudioConfig[], loop?: boolean): PlayHandle;
    /**
     * Start the background audio system, publishing the audio track
     * and beginning playback of any configured ambient sound.
     *
     * If `ambientSound` is provided (and contains file paths), they will loop
     * automatically. If `ambientSound` contains AsyncIterators, they are assumed
     * to be already infinite or looped.
     *
     * @param options - Options for starting background audio playback
     */
    start(options: BackgroundAudioStartOptions): Promise<void>;
    /**
     * Close and cleanup the background audio system
     */
    close(): Promise<void>;
    /**
     * Get the current track publication
     */
    getPublication(): LocalTrackPublication | undefined;
    private publishTrack;
    private onReconnected;
    private republishTrackTask;
    private onAgentStateChanged;
    private playTask;
}
//# sourceMappingURL=background_audio.d.ts.map