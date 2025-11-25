import {} from "@huggingface/transformers";
import { Future, InferenceRunner, getJobContext, log } from "@livekit/agents";
import { readFileSync } from "node:fs";
import os from "node:os";
import { InferenceSession, Tensor } from "onnxruntime-node";
import { downloadFileToCacheDir } from "../hf_utils.js";
import {
  HG_MODEL_REPO,
  MAX_HISTORY_TURNS,
  MODEL_REVISIONS,
  ONNX_FILEPATH
} from "./constants.js";
import { normalizeText } from "./utils.js";
class EOURunnerBase extends InferenceRunner {
  modelType;
  modelRevision;
  session;
  tokenizer;
  #logger = log();
  constructor(modelType) {
    super();
    this.modelType = modelType;
    this.modelRevision = MODEL_REVISIONS[modelType];
  }
  async initialize() {
    const { AutoTokenizer } = await import("@huggingface/transformers");
    try {
      const onnxModelPath = await downloadFileToCacheDir({
        repo: HG_MODEL_REPO,
        path: ONNX_FILEPATH,
        revision: this.modelRevision,
        localFileOnly: true
      });
      const sessOptions = {
        intraOpNumThreads: Math.max(1, Math.floor(os.cpus().length / 2)),
        interOpNumThreads: 1,
        executionProviders: [{ name: "cpu" }]
      };
      this.session = await InferenceSession.create(onnxModelPath, sessOptions);
      this.tokenizer = await AutoTokenizer.from_pretrained("livekit/turn-detector", {
        revision: this.modelRevision,
        local_files_only: true
      });
    } catch (e) {
      const errorMessage = String(e);
      if (errorMessage.includes("local_files_only=true") || errorMessage.includes("file was not found locally") || errorMessage.includes("File not found in cache")) {
        throw new Error(
          `agents-plugins-livekit failed to initialize ${this.modelType} EOU turn detector: Required model files not found locally.

This usually means you need to download the model files first. Please run one of these commands:

  If using Node.js starter template:
    pnpm download-files

  If using the agent directly:
    node ./your_agent.ts download-files

Then try running your application again.

Original error: ${e}`
        );
      }
      throw new Error(
        `agents-plugins-livekit failed to initialize ${this.modelType} EOU turn detector: ${e}`
      );
    }
  }
  async run(data) {
    const startTime = Date.now();
    const text = this.formatChatCtx(data);
    const inputs = this.tokenizer.encode(text, { add_special_tokens: false });
    this.#logger.debug({ inputs: JSON.stringify(inputs), text }, "EOU inputs");
    const outputs = await this.session.run(
      { input_ids: new Tensor("int64", inputs, [1, inputs.length]) },
      ["prob"]
    );
    const probData = outputs.prob.data;
    const eouProbability = probData[probData.length - 1];
    const endTime = Date.now();
    const result = {
      eouProbability,
      input: text,
      duration: (endTime - startTime) / 1e3
    };
    this.#logger.child({ result }).debug("eou prediction");
    return result;
  }
  async close() {
    var _a;
    await ((_a = this.session) == null ? void 0 : _a.release());
  }
  formatChatCtx(chatCtx) {
    const newChatCtx = [];
    let lastMsg = void 0;
    for (const msg of chatCtx) {
      const content = msg.content;
      if (!content) continue;
      const norm = normalizeText(content);
      if (lastMsg !== void 0 && lastMsg.role === msg.role) {
        lastMsg.content += ` ${norm}`;
      } else {
        newChatCtx.push({ role: msg.role, content: norm });
        lastMsg = newChatCtx[newChatCtx.length - 1];
      }
    }
    const convoText = this.tokenizer.apply_chat_template(newChatCtx, {
      add_generation_prompt: false,
      tokenize: false
    });
    return convoText.slice(0, convoText.lastIndexOf("<|im_end|>"));
  }
}
class EOUModel {
  modelType;
  executor;
  threshold;
  loadLanguages;
  languagesFuture = new Future();
  #logger = log();
  constructor(opts) {
    const {
      modelType = "en",
      executor = getJobContext().inferenceExecutor,
      unlikelyThreshold,
      loadLanguages = true
    } = opts;
    this.modelType = modelType;
    this.executor = executor;
    this.threshold = unlikelyThreshold;
    this.loadLanguages = loadLanguages;
    if (loadLanguages) {
      downloadFileToCacheDir({
        repo: HG_MODEL_REPO,
        path: "languages.json",
        revision: MODEL_REVISIONS[modelType],
        localFileOnly: true
      }).then((path) => {
        this.languagesFuture.resolve(JSON.parse(readFileSync(path, "utf8")));
      });
    }
  }
  async unlikelyThreshold(language) {
    if (language === void 0) {
      return this.threshold;
    }
    const lang = language.toLowerCase();
    const languages = await this.languagesFuture.await;
    let langData = languages[lang];
    if (langData === void 0 && lang.includes("-")) {
      const baseLang = lang.split("-")[0];
      langData = languages[baseLang];
    }
    if (langData === void 0) {
      this.#logger.warn(`Language ${language} not supported by EOU model`);
      return void 0;
    }
    return this.threshold !== void 0 ? this.threshold : langData.threshold;
  }
  async supportsLanguage(language) {
    return await this.unlikelyThreshold(language) !== void 0;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async predictEndOfTurn(chatCtx, timeout = 3) {
    let messages = [];
    for (const message of chatCtx.items) {
      if (message.type !== "message" || message.role in ["system", "developer"]) {
        continue;
      }
      for (const content of message.content) {
        if (typeof content === "string") {
          messages.push({
            role: message.role === "assistant" ? "assistant" : "user",
            content
          });
        }
      }
    }
    messages = messages.slice(-MAX_HISTORY_TURNS);
    const result = await this.executor.doInference(this.inferenceMethod(), messages);
    if (result === void 0) {
      throw new Error("EOU inference should always returns a result");
    }
    return result.eouProbability;
  }
}
export {
  EOUModel,
  EOURunnerBase
};
//# sourceMappingURL=base.js.map