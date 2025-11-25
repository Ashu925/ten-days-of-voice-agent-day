/**
 * Fixed version of HuggingFace's downloadFileToCacheDir that matches Python's behavior
 *
 * Key fix: Uses branch/tag HEAD commit for snapshot paths, not file's last commit
 * This ensures all files from the same revision end up in the same snapshot folder
 */
import type { RepoDesignation } from '@huggingface/hub';
interface CredentialsParams {
    accessToken?: string;
}
export declare const REGEX_COMMIT_HASH: RegExp;
/**
 * Download a given file if it's not already present in the local cache.
 * Matches Python's hf_hub_download behavior by using branch HEAD commits.
 */
export declare function downloadFileToCacheDir(params: {
    repo: RepoDesignation;
    path: string;
    /**
     * If true, will download the raw git file.
     */
    raw?: boolean;
    /**
     * An optional Git revision id which can be a branch name, a tag, or a commit hash.
     * @default "main"
     */
    revision?: string;
    hubUrl?: string;
    cacheDir?: string;
    /**
     * Custom fetch function to use instead of the default one
     */
    fetch?: typeof fetch;
    /**
     * If true, only return cached files, don't download
     */
    localFileOnly?: boolean;
} & Partial<CredentialsParams>): Promise<string>;
export {};
//# sourceMappingURL=hf_utils.d.ts.map