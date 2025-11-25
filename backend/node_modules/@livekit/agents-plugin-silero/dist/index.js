import { Plugin } from "@livekit/agents";
import { VAD, VADStream } from "./vad.js";
class SileroPlugin extends Plugin {
  constructor() {
    super({
      title: "silero",
      version: "0.5.6",
      package: "@livekit/agents-plugin-silero"
    });
  }
}
Plugin.registerPlugin(new SileroPlugin());
export {
  VAD,
  VADStream
};
//# sourceMappingURL=index.js.map