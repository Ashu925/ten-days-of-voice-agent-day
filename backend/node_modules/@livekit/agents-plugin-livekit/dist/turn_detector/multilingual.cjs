"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var multilingual_exports = {};
__export(multilingual_exports, {
  EUORunnerMultilingual: () => EUORunnerMultilingual,
  INFERENCE_METHOD_MULTILINGUAL: () => INFERENCE_METHOD_MULTILINGUAL,
  MultilingualModel: () => MultilingualModel,
  default: () => multilingual_default
});
module.exports = __toCommonJS(multilingual_exports);
var import_agents = require("@livekit/agents");
var import_base = require("./base.cjs");
var import_constants = require("./constants.cjs");
const REMOTE_INFERENCE_TIMEOUT = 2e3;
const INFERENCE_METHOD_MULTILINGUAL = "lk_end_of_utterance_multilingual";
class EUORunnerMultilingual extends import_base.EOURunnerBase {
  constructor() {
    super("multilingual");
  }
}
class MultilingualModel extends import_base.EOUModel {
  #logger = (0, import_agents.log)();
  constructor(unlikelyThreshold) {
    super({
      modelType: "multilingual",
      unlikelyThreshold
    });
  }
  inferenceMethod() {
    return INFERENCE_METHOD_MULTILINGUAL;
  }
  async unlikelyThreshold(language) {
    if (!language) {
      return void 0;
    }
    let threshold = await super.unlikelyThreshold(language);
    if (threshold === void 0) {
      const url = remoteInferenceUrl();
      if (!url) return void 0;
      const resp = await fetch(url, {
        method: "POST",
        body: JSON.stringify({
          language
        }),
        headers: {
          "Content-Type": "application/json"
        },
        signal: AbortSignal.timeout(REMOTE_INFERENCE_TIMEOUT)
      });
      if (!resp.ok) {
        throw new Error(`Failed to fetch threshold: ${resp.statusText}`);
      }
      const data = await resp.json();
      threshold = data.threshold;
      if (threshold) {
        const languages = await this.languagesFuture.await;
        languages[language] = { threshold };
      }
    }
    return threshold;
  }
  async predictEndOfTurn(chatCtx, timeout = 3) {
    const url = remoteInferenceUrl();
    if (!url) {
      return await super.predictEndOfTurn(chatCtx, timeout);
    }
    const messages = chatCtx.copy({
      excludeFunctionCall: true,
      excludeInstructions: true,
      excludeEmptyMessage: true
    }).truncate(import_constants.MAX_HISTORY_TURNS);
    const ctx = (0, import_agents.getJobContext)();
    const request = {
      ...messages.toJSON({
        excludeImage: true,
        excludeAudio: true,
        excludeTimestamp: true
      }),
      jobId: ctx.job.id,
      workerId: ctx.workerId
    };
    const agentId = process.env.LIVEKIT_AGENT_ID;
    if (agentId) {
      request.agentId = agentId;
    }
    const startedAt = performance.now();
    this.#logger.debug({ url, request }, "=== remote EOU inference");
    const resp = await fetch(url, {
      method: "POST",
      body: JSON.stringify(request),
      headers: {
        "Content-Type": "application/json"
      },
      signal: AbortSignal.timeout(REMOTE_INFERENCE_TIMEOUT)
    });
    if (!resp.ok) {
      throw new Error(`Failed to predict end of turn: ${resp.statusText}`);
    }
    const data = await resp.json();
    const probability = data.probability;
    if (typeof probability === "number" && probability >= 0) {
      this.#logger.debug(
        {
          eouProbability: probability,
          duration: (performance.now() - startedAt) / 1e3
        },
        "eou prediction"
      );
      return probability;
    }
    return 1;
  }
}
function remoteInferenceUrl() {
  const urlBase = process.env.LIVEKIT_REMOTE_EOT_URL;
  if (!urlBase) {
    return void 0;
  }
  return `${urlBase}/eot/multi`;
}
var multilingual_default = EUORunnerMultilingual;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EUORunnerMultilingual,
  INFERENCE_METHOD_MULTILINGUAL,
  MultilingualModel
});
//# sourceMappingURL=multilingual.cjs.map