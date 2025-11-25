import { getJobContext, log } from "@livekit/agents";
import { EOUModel, EOURunnerBase } from "./base.js";
import { MAX_HISTORY_TURNS } from "./constants.js";
const REMOTE_INFERENCE_TIMEOUT = 2e3;
const INFERENCE_METHOD_MULTILINGUAL = "lk_end_of_utterance_multilingual";
class EUORunnerMultilingual extends EOURunnerBase {
  constructor() {
    super("multilingual");
  }
}
class MultilingualModel extends EOUModel {
  #logger = log();
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
    }).truncate(MAX_HISTORY_TURNS);
    const ctx = getJobContext();
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
export {
  EUORunnerMultilingual,
  INFERENCE_METHOD_MULTILINGUAL,
  MultilingualModel,
  multilingual_default as default
};
//# sourceMappingURL=multilingual.js.map