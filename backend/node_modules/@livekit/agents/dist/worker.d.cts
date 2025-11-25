/// <reference types="node" resolution-mode="require"/>
import type { TrackSource } from '@livekit/protocol';
import { JobType } from '@livekit/protocol';
import { EventEmitter } from 'node:events';
import type { JobProcess, RunningJobInfo } from './job.js';
import { JobRequest } from './job.js';
/** Necessary credentials not provided and not found in an appropriate environment variable. */
export declare class MissingCredentialsError extends Error {
    constructor(msg?: string);
}
/** Worker did not run as expected. */
export declare class WorkerError extends Error {
    constructor(msg?: string);
}
/** @internal */
export declare const defaultInitializeProcessFunc: (_: JobProcess) => JobProcess;
/** Participant permissions to pass to every agent spun up by this worker. */
export declare class WorkerPermissions {
    canPublish: boolean;
    canSubscribe: boolean;
    canPublishData: boolean;
    canUpdateMetadata: boolean;
    canPublishSources: TrackSource[];
    hidden: boolean;
    constructor(canPublish?: boolean, canSubscribe?: boolean, canPublishData?: boolean, canUpdateMetadata?: boolean, canPublishSources?: TrackSource[], hidden?: boolean);
}
/**
 * Data class describing worker behaviour.
 *
 * @remarks
 * The Agents framework provides sane worker defaults, and works out-of-the-box with no tweaking
 * necessary. The only mandatory parameter is `agent`, which points to the entry function.
 *
 * This class is mostly useful in conjunction with {@link cli.runApp}.
 */
export declare class ServerOptions {
    agent: string;
    requestFunc: (job: JobRequest) => Promise<void>;
    loadFunc: (worker: AgentServer) => Promise<number>;
    loadThreshold: number;
    numIdleProcesses: number;
    shutdownProcessTimeout: number;
    initializeProcessTimeout: number;
    permissions: WorkerPermissions;
    agentName: string;
    serverType: JobType;
    maxRetry: number;
    wsURL: string;
    apiKey?: string;
    apiSecret?: string;
    workerToken?: string;
    host: string;
    port: number;
    logLevel: string;
    production: boolean;
    jobMemoryWarnMB: number;
    jobMemoryLimitMB: number;
    /** @param options - Worker options */
    constructor({ agent, requestFunc, loadFunc, loadThreshold, numIdleProcesses, shutdownProcessTimeout, initializeProcessTimeout, permissions, agentName, serverType, maxRetry, wsURL, apiKey, apiSecret, workerToken, host, port, logLevel, production, jobMemoryWarnMB, jobMemoryLimitMB, }: {
        /**
         * Path to a file that has {@link Agent} as a default export, dynamically imported later for
         * entrypoint and prewarm functions
         */
        agent: string;
        requestFunc?: (job: JobRequest) => Promise<void>;
        /** Called to determine the current load of the worker. Should return a value between 0 and 1. */
        loadFunc?: (worker: AgentServer) => Promise<number>;
        /** When the load exceeds this threshold, the worker will be marked as unavailable. */
        loadThreshold?: number;
        numIdleProcesses?: number;
        shutdownProcessTimeout?: number;
        initializeProcessTimeout?: number;
        permissions?: WorkerPermissions;
        agentName?: string;
        serverType?: JobType;
        maxRetry?: number;
        wsURL?: string;
        apiKey?: string;
        apiSecret?: string;
        workerToken?: string;
        host?: string;
        port?: number;
        logLevel?: string;
        production?: boolean;
        jobMemoryWarnMB?: number;
        jobMemoryLimitMB?: number;
    });
}
/**
 * Central orchestrator for all processes and job requests.
 *
 * @remarks
 * For most usecases, Worker should not be initialized or handled directly; you should instead call
 * for its creation through {@link cli.runApp}. This could, however, be useful in situations where
 * you don't have access to a command line, such as a headless program, or one that uses Agents
 * behind a wrapper.
 */
export declare class AgentServer {
    #private;
    event: EventEmitter<[never]>;
    constructor(opts: ServerOptions);
    /** @throws {@link WorkerError} if worker failed to connect or already running */
    run(): Promise<void>;
    get id(): string;
    get activeJobs(): RunningJobInfo[];
    /** @throws {@link WorkerError} if worker did not drain in time */
    drain(timeout?: number): Promise<void>;
    simulateJob(roomName: string, participantIdentity?: string): Promise<void>;
    close(): Promise<void>;
}
/**
 * @deprecated Use {@link AgentServer} instead. This alias is provided for backward compatibility.
 */
export declare const Worker: typeof AgentServer;
/**
 * @deprecated Use {@link ServerOptions} instead. This alias is provided for backward compatibility.
 */
export declare const WorkerOptions: typeof ServerOptions;
//# sourceMappingURL=worker.d.ts.map