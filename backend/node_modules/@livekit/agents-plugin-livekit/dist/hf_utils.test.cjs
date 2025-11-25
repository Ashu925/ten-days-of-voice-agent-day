"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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
var import_agents = require("@livekit/agents");
var import_fs = require("fs");
var import_os = require("os");
var import_path = require("path");
var import_vitest = require("vitest");
var import_hf_utils = require("./hf_utils.cjs");
function getCachePath(repo, cacheDir) {
  const baseCacheDir = cacheDir || (0, import_path.join)((0, import_os.homedir)(), ".cache", "huggingface", "hub");
  return (0, import_path.join)(baseCacheDir, `models--${repo.replace(/\//g, "--")}`);
}
function clearCache(repo, cacheDir) {
  const repoPath = getCachePath(repo, cacheDir);
  if ((0, import_fs.existsSync)(repoPath)) {
    (0, import_fs.rmSync)(repoPath, { recursive: true, force: true });
  }
}
(0, import_vitest.describe)("HuggingFace Download Fixed Implementation", () => {
  (0, import_agents.initializeLogger)({ pretty: true, level: "debug" });
  const TEST_REPO = "livekit/turn-detector";
  const TEST_CACHE_DIR = (0, import_path.join)(process.cwd(), ".test-cache");
  (0, import_vitest.beforeAll)(() => {
    clearCache(TEST_REPO, TEST_CACHE_DIR);
  });
  (0, import_vitest.afterAll)(() => {
    if ((0, import_fs.existsSync)(TEST_CACHE_DIR)) {
      (0, import_fs.rmSync)(TEST_CACHE_DIR, { recursive: true, force: true });
    }
  });
  (0, import_vitest.describe)("Basic Downloads", () => {
    (0, import_vitest.it)("should download a standard file in subdirectory", async () => {
      const result = await (0, import_hf_utils.downloadFileToCacheDir)({
        repo: TEST_REPO,
        path: "onnx/model_q8.onnx",
        revision: "v1.2.2-en",
        cacheDir: TEST_CACHE_DIR
      });
      (0, import_vitest.expect)(result).toBeTruthy();
      (0, import_vitest.expect)((0, import_fs.existsSync)(result)).toBe(true);
      const stats = (0, import_fs.statSync)(result);
      const sizeMB = stats.size / 1024 / 1024;
      (0, import_vitest.expect)(sizeMB).toBeCloseTo(62.67, 1);
    });
    (0, import_vitest.it)("should download a large file with retry logic", async () => {
      const result = await (0, import_hf_utils.downloadFileToCacheDir)({
        repo: TEST_REPO,
        path: "onnx/model.onnx",
        revision: "v1.2.2-en",
        cacheDir: TEST_CACHE_DIR
      });
      (0, import_vitest.expect)(result).toBeTruthy();
      (0, import_vitest.expect)((0, import_fs.existsSync)(result)).toBe(true);
      const stats = (0, import_fs.statSync)(result);
      const sizeMB = stats.size / 1024 / 1024;
      (0, import_vitest.expect)(sizeMB).toBeCloseTo(249.96, 1);
    });
    (0, import_vitest.it)("should download a very small file", async () => {
      const result = await (0, import_hf_utils.downloadFileToCacheDir)({
        repo: TEST_REPO,
        path: "languages.json",
        revision: "v1.2.2-en",
        cacheDir: TEST_CACHE_DIR
      });
      (0, import_vitest.expect)(result).toBeTruthy();
      (0, import_vitest.expect)((0, import_fs.existsSync)(result)).toBe(true);
      const stats = (0, import_fs.statSync)(result);
      (0, import_vitest.expect)(stats.size).toBeLessThan(200);
    });
    (0, import_vitest.it)("should download from different revision", async () => {
      const result = await (0, import_hf_utils.downloadFileToCacheDir)({
        repo: TEST_REPO,
        path: "tokenizer.json",
        revision: "v0.2.0-intl",
        cacheDir: TEST_CACHE_DIR
      });
      (0, import_vitest.expect)(result).toBeTruthy();
      (0, import_vitest.expect)((0, import_fs.existsSync)(result)).toBe(true);
      const stats = (0, import_fs.statSync)(result);
      const sizeMB = stats.size / 1024 / 1024;
      (0, import_vitest.expect)(sizeMB).toBeGreaterThan(3);
    });
  });
  (0, import_vitest.describe)("Cache Behavior", () => {
    (0, import_vitest.it)("should use cache on second download", async () => {
      const firstPath = await (0, import_hf_utils.downloadFileToCacheDir)({
        repo: TEST_REPO,
        path: "onnx/model_q8.onnx",
        revision: "v1.2.2-en",
        cacheDir: TEST_CACHE_DIR
      });
      const startTime = Date.now();
      const secondPath = await (0, import_hf_utils.downloadFileToCacheDir)({
        repo: TEST_REPO,
        path: "onnx/model_q8.onnx",
        revision: "v1.2.2-en",
        cacheDir: TEST_CACHE_DIR
      });
      const cacheTime = Date.now() - startTime;
      (0, import_vitest.expect)(secondPath).toBe(firstPath);
      (0, import_vitest.expect)(cacheTime).toBeLessThan(500);
    });
    (0, import_vitest.it)("should respect localFileOnly flag when file is cached", async () => {
      await (0, import_hf_utils.downloadFileToCacheDir)({
        repo: TEST_REPO,
        path: "tokenizer.json",
        revision: "v0.2.0-intl",
        cacheDir: TEST_CACHE_DIR
      });
      const cachedPath = await (0, import_hf_utils.downloadFileToCacheDir)({
        repo: TEST_REPO,
        path: "tokenizer.json",
        revision: "v0.2.0-intl",
        cacheDir: TEST_CACHE_DIR,
        localFileOnly: true
      });
      (0, import_vitest.expect)(cachedPath).toBeTruthy();
      (0, import_vitest.expect)((0, import_fs.existsSync)(cachedPath)).toBe(true);
    });
    (0, import_vitest.it)("should throw error with localFileOnly when file is not cached", async () => {
      await (0, import_vitest.expect)(
        (0, import_hf_utils.downloadFileToCacheDir)({
          repo: TEST_REPO,
          path: "non-existent-file.txt",
          revision: "main",
          cacheDir: TEST_CACHE_DIR,
          localFileOnly: true
        })
      ).rejects.toThrow(/File not found in cache/);
    });
    (0, import_vitest.it)("should save revision-to-commit mappings", async () => {
      await (0, import_hf_utils.downloadFileToCacheDir)({
        repo: TEST_REPO,
        path: "languages.json",
        revision: "v1.2.2-en",
        cacheDir: TEST_CACHE_DIR
      });
      const refsPath = (0, import_path.join)(getCachePath(TEST_REPO, TEST_CACHE_DIR), "refs", "v1.2.2-en");
      (0, import_vitest.expect)((0, import_fs.existsSync)(refsPath)).toBe(true);
    });
    (0, import_vitest.it)("should handle multiple files from same revision without overwriting refs", async () => {
      const file1Path = await (0, import_hf_utils.downloadFileToCacheDir)({
        repo: TEST_REPO,
        path: "onnx/model_q8.onnx",
        revision: "v1.2.2-en",
        cacheDir: TEST_CACHE_DIR
      });
      const file2Path = await (0, import_hf_utils.downloadFileToCacheDir)({
        repo: TEST_REPO,
        path: "languages.json",
        revision: "v1.2.2-en",
        cacheDir: TEST_CACHE_DIR
      });
      (0, import_vitest.expect)((0, import_fs.existsSync)(file1Path)).toBe(true);
      (0, import_vitest.expect)((0, import_fs.existsSync)(file2Path)).toBe(true);
      const cachedFile1 = await (0, import_hf_utils.downloadFileToCacheDir)({
        repo: TEST_REPO,
        path: "onnx/model_q8.onnx",
        revision: "v1.2.2-en",
        cacheDir: TEST_CACHE_DIR,
        localFileOnly: true
      });
      const cachedFile2 = await (0, import_hf_utils.downloadFileToCacheDir)({
        repo: TEST_REPO,
        path: "languages.json",
        revision: "v1.2.2-en",
        cacheDir: TEST_CACHE_DIR,
        localFileOnly: true
      });
      (0, import_vitest.expect)(cachedFile1).toBe(file1Path);
      (0, import_vitest.expect)(cachedFile2).toBe(file2Path);
      const match1 = file1Path.match(/snapshots\/([a-f0-9]{40})\//);
      const match2 = file2Path.match(/snapshots\/([a-f0-9]{40})\//);
      (0, import_vitest.expect)(match1).toBeTruthy();
      (0, import_vitest.expect)(match2).toBeTruthy();
      const commitHash1 = match1[1];
      const commitHash2 = match2[1];
      (0, import_vitest.expect)(commitHash1).toBe(commitHash2);
      const { readFileSync } = await import("fs");
      const refsPath = (0, import_path.join)(getCachePath(TEST_REPO, TEST_CACHE_DIR), "refs", "v1.2.2-en");
      const refsContent = readFileSync(refsPath, "utf-8").trim();
      (0, import_vitest.expect)(refsContent).toMatch(/^[a-f0-9]{40}$/);
      (0, import_vitest.expect)(refsContent).toBe(commitHash1);
    });
  });
  (0, import_vitest.describe)("Error Handling", () => {
    (0, import_vitest.it)("should handle invalid repository gracefully", async () => {
      await (0, import_vitest.expect)(
        (0, import_hf_utils.downloadFileToCacheDir)({
          repo: "non-existent-org/non-existent-repo",
          path: "file.txt",
          revision: "main",
          cacheDir: TEST_CACHE_DIR
        })
      ).rejects.toThrow();
    });
    (0, import_vitest.it)("should handle invalid file path gracefully", async () => {
      await (0, import_vitest.expect)(
        (0, import_hf_utils.downloadFileToCacheDir)({
          repo: TEST_REPO,
          path: "non-existent-file-path.xyz",
          revision: "v1.2.2-en",
          cacheDir: TEST_CACHE_DIR
        })
      ).rejects.toThrow();
    });
    (0, import_vitest.it)("should handle invalid revision gracefully", async () => {
      await (0, import_vitest.expect)(
        (0, import_hf_utils.downloadFileToCacheDir)({
          repo: TEST_REPO,
          path: "tokenizer.json",
          revision: "non-existent-revision",
          cacheDir: TEST_CACHE_DIR
        })
      ).rejects.toThrow();
    });
  });
  (0, import_vitest.describe)("Cache Structure", () => {
    (0, import_vitest.it)("should create proper cache directory structure", async () => {
      await (0, import_hf_utils.downloadFileToCacheDir)({
        repo: TEST_REPO,
        path: "onnx/model_q8.onnx",
        revision: "v1.2.2-en",
        cacheDir: TEST_CACHE_DIR
      });
      const cachePath = getCachePath(TEST_REPO, TEST_CACHE_DIR);
      (0, import_vitest.expect)((0, import_fs.existsSync)((0, import_path.join)(cachePath, "blobs"))).toBe(true);
      (0, import_vitest.expect)((0, import_fs.existsSync)((0, import_path.join)(cachePath, "snapshots"))).toBe(true);
      (0, import_vitest.expect)((0, import_fs.existsSync)((0, import_path.join)(cachePath, "refs"))).toBe(true);
    });
    (0, import_vitest.it)("should handle commit hash revisions", async () => {
      const tagResult = await (0, import_hf_utils.downloadFileToCacheDir)({
        repo: TEST_REPO,
        path: "onnx/model_q8.onnx",
        revision: "v1.2.2-en",
        cacheDir: TEST_CACHE_DIR
      });
      const match = tagResult.match(/snapshots\/([a-f0-9]{40})\//);
      (0, import_vitest.expect)(match).toBeTruthy();
      const commitHash = match[1];
      const result = await (0, import_hf_utils.downloadFileToCacheDir)({
        repo: TEST_REPO,
        path: "onnx/model_q8.onnx",
        revision: commitHash,
        cacheDir: TEST_CACHE_DIR
      });
      (0, import_vitest.expect)(result).toBeTruthy();
      (0, import_vitest.expect)(result).toContain(commitHash);
    });
    (0, import_vitest.it)("should store files as content-addressed blobs", async () => {
      await (0, import_hf_utils.downloadFileToCacheDir)({
        repo: TEST_REPO,
        path: "languages.json",
        revision: "v1.2.2-en",
        cacheDir: TEST_CACHE_DIR
      });
      const blobsPath = (0, import_path.join)(getCachePath(TEST_REPO, TEST_CACHE_DIR), "blobs");
      const { readdirSync } = await import("fs");
      const blobs = readdirSync(blobsPath);
      (0, import_vitest.expect)(blobs.length).toBeGreaterThan(0);
      (0, import_vitest.expect)(blobs[0]).toMatch(/^[a-f0-9]{64}$/);
    });
  });
  (0, import_vitest.describe)("Performance", () => {
    (0, import_vitest.it)("should download files in parallel efficiently", async () => {
      const startTime = Date.now();
      const promises = [
        (0, import_hf_utils.downloadFileToCacheDir)({
          repo: TEST_REPO,
          path: "onnx/model_q8.onnx",
          revision: "v1.2.2-en",
          cacheDir: TEST_CACHE_DIR
        }),
        (0, import_hf_utils.downloadFileToCacheDir)({
          repo: TEST_REPO,
          path: "languages.json",
          revision: "v1.2.2-en",
          cacheDir: TEST_CACHE_DIR
        }),
        (0, import_hf_utils.downloadFileToCacheDir)({
          repo: TEST_REPO,
          path: "tokenizer.json",
          revision: "v0.2.0-intl",
          cacheDir: TEST_CACHE_DIR
        })
      ];
      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      results.forEach((result) => {
        (0, import_vitest.expect)(result).toBeTruthy();
        (0, import_vitest.expect)((0, import_fs.existsSync)(result)).toBe(true);
      });
      console.log(`Parallel download took ${totalTime}ms`);
    });
  });
  (0, import_vitest.describe)("Failures", () => {
    (0, import_vitest.it)("should handle non-existent file", async () => {
      await (0, import_vitest.expect)(
        (0, import_hf_utils.downloadFileToCacheDir)({
          repo: TEST_REPO,
          path: "onnx/model_non_existent.onnx",
          revision: "v1.2.2-en",
          cacheDir: TEST_CACHE_DIR
        })
      ).rejects.toThrow("cannot get path info for onnx/model_non_existent.onnx");
    });
  });
});
//# sourceMappingURL=hf_utils.test.cjs.map