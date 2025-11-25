import { EOUModel, EOURunnerBase } from "./base.js";
const INFERENCE_METHOD_EN = "lk_end_of_utterance_en";
class EOURunnerEn extends EOURunnerBase {
  constructor() {
    super("en");
  }
}
class EnglishModel extends EOUModel {
  constructor(unlikelyThreshold) {
    super({
      modelType: "en",
      unlikelyThreshold
    });
  }
  inferenceMethod() {
    return INFERENCE_METHOD_EN;
  }
}
var english_default = EOURunnerEn;
export {
  EOURunnerEn,
  EnglishModel,
  INFERENCE_METHOD_EN,
  english_default as default
};
//# sourceMappingURL=english.js.map