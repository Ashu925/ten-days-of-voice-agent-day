import { ServerOptions } from './worker.js';
/**
 * Exposes a CLI for creating a new worker, in development or production mode.
 *
 * @param opts - Options to launch the worker with
 * @example
 * ```
 * if (process.argv[1] === fileURLToPath(import.meta.url)) {
 *   cli.runApp(new ServerOptions({ agent: import.meta.filename }));
 * }
 * ```
 */
export declare const runApp: (opts: ServerOptions) => void;
//# sourceMappingURL=cli.d.ts.map