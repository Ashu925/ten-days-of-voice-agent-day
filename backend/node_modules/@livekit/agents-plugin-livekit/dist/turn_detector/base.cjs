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
var base_exports = {};
__export(base_exports, {
  EOUModel: () => EOUModel,
  EOURunnerBase: () => EOURunnerBase
});
module.exports = __toCommonJS(base_exports);
var import_transformers = require("@huggingface/transformers");
var import_agents = require("@livekit/agents");
var import_node_fs = require("node:fs");
var import_node_os = __toESM(require("node:os"), 1);
var import_onnxruntime_node = require("onnxruntime-node");
var import_hf_utils = require("../hf_utils.cjs");
var import_constants = require("./constants.cjs");
var import_utils = require("./utils.cjs");
class EOURunnerBase extends import_agents.InferenceRunner {
  modelType;
  modelRevision;
  session;
  tokenizer;
  #logger = (0, import_agents.log)();
  constructor(modelType) {
    super();
    this.modelType = modelType;
    this.modelRevision = import_constants.MODEL_REVISIONS[modelType];
  }
  async initialize() {
    const { AutoTokenizer } = await import("@huggingface/transformers");
    try {
      const onnxModelPath = await (0, import_hf_utils.downloadFileToCacheDir)({
        repo: import_constants.HG_MODEL_REPO,
        path: import_constants.ONNX_FILEPATH,
        revision: this.modelRevision,
        localFileOnly: true
      });
      const sessOptions = {
        intraOpNumThreads: Math.max(1, Math.floor(import_node_os.default.cpus().length / 2)),
        interOpNumThreads: 1,
        executionProviders: [{ name: "cpu" }]
      };
      this.session = await import_onnxruntime_node.InferenceSession.create(onnxModelPath, sessOptions);
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
      { input_ids: new import_onnxruntime_node.Tensor("int64", inputs, [1, inputs.length]) },
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
      const norm = (0, import_utils.normalizeText)(content);
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
  languagesFuture = new import_agents.Future();
  #logger = (0, import_agents.log)();
  constructor(opts) {
    const {
      modelType = "en",
      executor = (0, import_agents.getJobContext)().inferenceExecutor,
      unlikelyThreshold,
      loadLanguages = true
    } = opts;
    this.modelType = modelType;
    this.executor = executor;
    this.threshold = unlikelyThreshold;
    this.loadLanguages = loadLanguages;
    if (loadLanguages) {
      (0, import_hf_utils.downloadFileToCacheDir)({
        repo: import_constants.HG_MODEL_REPO,
        path: "languages.json",
        revision: import_constants.MODEL_REVISIONS[modelType],
        localFileOnly: true
      }).then((path) => {
        this.languagesFuture.resolve(JSON.parse((0, import_node_fs.readFileSync)(path, "utf8")));
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
    messages = messages.slice(-import_constants.MAX_HISTORY_TURNS);
    const result = await this.executor.doInference(this.inferenceMethod(), messages);
    if (result === void 0) {
      throw new Error("EOU inference should always returns a result");
    }
    return result.eouProbability;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EOUModel,
  EOURunnerBase
});
//# sourceMappingURL=base.cjs.map