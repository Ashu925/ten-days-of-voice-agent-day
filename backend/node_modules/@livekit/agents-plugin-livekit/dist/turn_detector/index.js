import { InferenceRunner } from "@livekit/agents";
import { INFERENCE_METHOD_EN } from "./english.js";
import { INFERENCE_METHOD_MULTILINGUAL } from "./multilingual.js";
import { EOUModel } from "./base.js";
import { EnglishModel } from "./english.js";
import { MultilingualModel } from "./multilingual.js";
import { getUnicodeCategory, normalizeText } from "./utils.js";
InferenceRunner.registerRunner(
  INFERENCE_METHOD_EN,
  new URL("./english.js", import.meta.url).toString()
);
InferenceRunner.registerRunner(
  INFERENCE_METHOD_MULTILINGUAL,
  new URL("./multilingual.js", import.meta.url).toString()
);
export {
  EOUModel,
  EnglishModel,
  MultilingualModel,
  getUnicodeCategory,
  normalizeText
};
//# sourceMappingURL=index.js.map