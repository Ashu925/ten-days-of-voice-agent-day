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
var report_exports = {};
__export(report_exports, {
  createSessionReport: () => createSessionReport,
  sessionReportToJSON: () => sessionReportToJSON
});
module.exports = __toCommonJS(report_exports);
function createSessionReport(opts) {
  return {
    jobId: opts.jobId,
    roomId: opts.roomId,
    room: opts.room,
    options: opts.options,
    events: opts.events,
    chatHistory: opts.chatHistory,
    enableUserDataTraining: opts.enableUserDataTraining ?? false,
    timestamp: opts.timestamp ?? Date.now()
  };
}
function sessionReportToJSON(report) {
  const events = [];
  for (const event of report.events) {
    if (event.type === "metrics_collected") {
      continue;
    }
    events.push({ ...event });
  }
  return {
    job_id: report.jobId,
    room_id: report.roomId,
    room: report.room,
    events,
    options: {
      allow_interruptions: report.options.allowInterruptions,
      discard_audio_if_uninterruptible: report.options.discardAudioIfUninterruptible,
      min_interruption_duration: report.options.minInterruptionDuration,
      min_interruption_words: report.options.minInterruptionWords,
      min_endpointing_delay: report.options.minEndpointingDelay,
      max_endpointing_delay: report.options.maxEndpointingDelay,
      max_tool_steps: report.options.maxToolSteps
    },
    chat_history: report.chatHistory.toJSON({ excludeTimestamp: false }),
    enable_user_data_training: report.enableUserDataTraining,
    timestamp: report.timestamp
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createSessionReport,
  sessionReportToJSON
});
//# sourceMappingURL=report.cjs.map