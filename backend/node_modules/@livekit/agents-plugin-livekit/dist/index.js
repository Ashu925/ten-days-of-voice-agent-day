import { Plugin } from "@livekit/agents";
import { downloadFileToCacheDir as hfDownload } from "./hf_utils.js";
import { HG_MODEL_REPO, MODEL_REVISIONS, ONNX_FILEPATH } from "./turn_detector/constants.js";
import { downloadFileToCacheDir } from "./hf_utils.js";
import * as turnDetector from "./turn_detector/index.js";
class EOUPlugin extends Plugin {
  constructor() {
    super({
      title: "turn-detector",
      version: "0.1.1",
      package: "@livekit/agents-plugin-livekit"
    });
  }
  async downloadFiles() {
    const { AutoTokenizer } = await import("@huggingface/transformers");
    for (const revision of Object.values(MODEL_REVISIONS)) {
      await AutoTokenizer.from_pretrained(HG_MODEL_REPO, { revision });
      await hfDownload({ repo: HG_MODEL_REPO, path: ONNX_FILEPATH, revision });
      await hfDownload({ repo: HG_MODEL_REPO, path: "languages.json", revision });
    }
  }
}
Plugin.registerPlugin(new EOUPlugin());
export {
  downloadFileToCacheDir,
  turnDetector
};
//# sourceMappingURL=index.js.map