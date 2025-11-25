"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var hf_utils_exports = {};
__export(hf_utils_exports, {
  REGEX_COMMIT_HASH: () => REGEX_COMMIT_HASH,
  downloadFileToCacheDir: () => downloadFileToCacheDir
});
module.exports = __toCommonJS(hf_utils_exports);
var import_hub = require("@huggingface/hub");
var import_agents = require("@livekit/agents");
var import_node_fs = require("node:fs");
var import_promises = require("node:fs/promises");
var import_node_os = require("node:os");
var import_node_path = require("node:path");
var import_node_stream = require("node:stream");
var import_promises2 = require("node:stream/promises");
const REGEX_COMMIT_HASH = new RegExp("^[0-9a-f]{40}$");
function getHFHubCachePath(customCacheDir) {
  return customCacheDir || (0, import_node_path.join)((0, import_node_os.homedir)(), ".cache", "huggingface", "hub");
}
function getRepoFolderName(repoId) {
  return `models--${repoId.replace(/\//g, "--")}`;
}
function toRepoId(repo) {
  if (typeof repo === "string") {
    return repo;
  }
  return `${repo.name}`;
}
async function getBranchHeadCommit(repo, revision, params) {
  const logger = (0, import_agents.log)();
  try {
    if (REGEX_COMMIT_HASH.test(revision)) {
      return revision;
    }
    for await (const commit of (0, import_hub.listCommits)({
      repo,
      revision,
      ...params
    })) {
      const commitHash = commit.oid || commit.id || commit.commitId;
      if (commitHash) {
        return commitHash;
      }
      break;
    }
    logger.error({ repo: toRepoId(repo), revision }, "No commits found for revision");
    return null;
  } catch (error) {
    logger.error(
      { error: error.message, repo: toRepoId(repo), revision },
      "Error getting HEAD commit"
    );
    throw error;
  }
}
async function createSymlink(sourcePath, targetPath) {
  const logger = (0, import_agents.log)();
  const { symlink, rm, copyFile } = await import("node:fs/promises");
  function expandUser(path) {
    if (path.startsWith("~")) {
      return path.replace("~", (0, import_node_os.homedir)());
    }
    return path;
  }
  const absSrc = (0, import_node_path.resolve)(expandUser(sourcePath));
  const absDst = (0, import_node_path.resolve)(expandUser(targetPath));
  try {
    await rm(absDst);
  } catch {
  }
  try {
    const relativePath = (0, import_node_path.relative)((0, import_node_path.dirname)(absDst), absSrc);
    await symlink(relativePath, absDst);
    logger.debug({ source: absSrc, target: absDst, relative: relativePath }, "Created symlink");
  } catch (symlinkError) {
    logger.warn({ source: absSrc, target: absDst }, "Symlink not supported, falling back to copy");
    try {
      await copyFile(absSrc, absDst);
      logger.debug({ source: absSrc, target: absDst }, "File copied successfully");
    } catch (copyError) {
      logger.error(
        { error: copyError.message, source: absSrc, target: absDst },
        "Failed to copy file"
      );
      throw symlinkError;
    }
  }
}
function getFilePointer(storageFolder, revision, relativeFilename) {
  const snapshotPath = (0, import_node_path.join)(storageFolder, "snapshots");
  return (0, import_node_path.join)(snapshotPath, revision, relativeFilename);
}
async function exists(path, followSymlinks) {
  try {
    if (followSymlinks) {
      await (0, import_promises.stat)(path);
    } else {
      await (0, import_promises.lstat)(path);
    }
    return true;
  } catch (err) {
    return false;
  }
}
async function saveRevisionMapping({
  storageFolder,
  revision,
  commitHash
}) {
  if (!REGEX_COMMIT_HASH.test(revision) && revision !== commitHash) {
    const refsPath = (0, import_node_path.join)(storageFolder, "refs");
    await (0, import_promises.mkdir)(refsPath, { recursive: true });
    (0, import_node_fs.writeFileSync)((0, import_node_path.join)(refsPath, revision), commitHash);
  }
}
async function downloadFileToCacheDir(params) {
  const logger = (0, import_agents.log)();
  const revision = params.revision ?? "main";
  const cacheDir = params.cacheDir ?? getHFHubCachePath();
  const repoId = toRepoId(params.repo);
  const storageFolder = (0, import_node_path.join)(cacheDir, getRepoFolderName(repoId));
  let branchHeadCommit;
  if (REGEX_COMMIT_HASH.test(revision)) {
    branchHeadCommit = revision;
    const pointerPath2 = getFilePointer(storageFolder, revision, params.path);
    if (await exists(pointerPath2, true)) {
      logger.debug(
        { pointerPath: pointerPath2, commitHash: branchHeadCommit },
        "File found in cache (commit hash)"
      );
      return pointerPath2;
    }
  }
  if (params.localFileOnly) {
    logger.debug({ repoId, path: params.path, revision }, "Local file only mode - checking cache");
    const directPath = getFilePointer(storageFolder, revision, params.path);
    if (await exists(directPath, true)) {
      logger.debug({ directPath }, "File found in cache (direct path)");
      return directPath;
    }
    if (!REGEX_COMMIT_HASH.test(revision)) {
      const refsPath = (0, import_node_path.join)(storageFolder, "refs", revision);
      try {
        const { readFileSync } = await import("fs");
        const resolvedHash = readFileSync(refsPath, "utf-8").trim();
        const resolvedPath = getFilePointer(storageFolder, resolvedHash, params.path);
        if (await exists(resolvedPath, true)) {
          logger.debug({ resolvedPath, resolvedHash }, "File found in cache (via refs)");
          return resolvedPath;
        }
      } catch {
        logger.debug({ revision }, "No ref mapping found for revision");
      }
    }
    const error = `File not found in cache: ${repoId}/${params.path} (revision: ${revision}). Make sure to run the download-files command before running the agent worker.`;
    logger.error({ repoId, path: params.path, revision }, error);
    throw new Error(error);
  }
  if (!branchHeadCommit) {
    const headCommit = await getBranchHeadCommit(params.repo, revision, params);
    if (!headCommit) {
      throw new Error(`Failed to resolve revision ${revision} to commit hash`);
    }
    branchHeadCommit = headCommit;
  }
  const pointerPath = getFilePointer(storageFolder, branchHeadCommit, params.path);
  if (await exists(pointerPath, true)) {
    logger.debug({ pointerPath, branchHeadCommit }, "File found in cache (branch HEAD)");
    await saveRevisionMapping({
      storageFolder,
      revision,
      commitHash: branchHeadCommit
    });
    return pointerPath;
  }
  logger.debug(
    { repoId, path: params.path, revision: branchHeadCommit },
    "Fetching path info from HF API"
  );
  const pathsInformation = await (0, import_hub.pathsInfo)({
    ...params,
    paths: [params.path],
    revision: branchHeadCommit,
    // Use HEAD commit for consistency
    expand: true
  });
  if (!pathsInformation || pathsInformation.length !== 1) {
    const error = `cannot get path info for ${params.path}`;
    logger.error({ repoId, path: params.path, pathsInfoLength: pathsInformation == null ? void 0 : pathsInformation.length }, error);
    throw new Error(error);
  }
  const pathInfo = pathsInformation[0];
  if (!pathInfo) {
    const error = `No path info returned for ${params.path}`;
    logger.error({ repoId, path: params.path }, error);
    throw new Error(error);
  }
  let etag;
  if (pathInfo.lfs) {
    etag = pathInfo.lfs.oid;
    logger.debug({ etag, path: params.path }, "File is LFS pointer");
  } else {
    etag = pathInfo.oid;
    logger.debug({ etag, path: params.path }, "File is regular git object");
  }
  const blobPath = (0, import_node_path.join)(storageFolder, "blobs", etag);
  logger.debug({ branchHeadCommit, pointerPath, blobPath }, "Computed cache paths");
  await (0, import_promises.mkdir)((0, import_node_path.dirname)(blobPath), { recursive: true });
  await (0, import_promises.mkdir)((0, import_node_path.dirname)(pointerPath), { recursive: true });
  if (await exists(blobPath)) {
    logger.debug({ blobPath, etag }, "Blob already exists in cache, creating symlink only");
    await createSymlink(blobPath, pointerPath);
    return pointerPath;
  }
  const incomplete = `${blobPath}.incomplete`;
  logger.debug({ path: params.path, incomplete }, "Starting file download");
  const blob = await (0, import_hub.downloadFile)({
    ...params,
    revision: branchHeadCommit
  });
  if (!blob) {
    const error = `invalid response for file ${params.path}`;
    logger.error({ path: params.path }, error);
    throw new Error(error);
  }
  logger.debug({ size: blob.size }, "Writing blob to disk");
  await (0, import_promises2.pipeline)(import_node_stream.Readable.fromWeb(blob.stream()), (0, import_node_fs.createWriteStream)(incomplete));
  await (0, import_promises.rename)(incomplete, blobPath);
  logger.debug({ blobPath }, "Renamed incomplete file to final blob");
  await createSymlink(blobPath, pointerPath);
  logger.debug({ blobPath, pointerPath }, "Created symlink from snapshot to blob");
  await saveRevisionMapping({
    storageFolder,
    revision,
    commitHash: branchHeadCommit
  });
  logger.debug({ pointerPath, size: blob.size }, "File download completed successfully");
  return pointerPath;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  REGEX_COMMIT_HASH,
  downloadFileToCacheDir
});
//# sourceMappingURL=hf_utils.cjs.map