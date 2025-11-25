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
export {
  createSessionReport,
  sessionReportToJSON
};
//# sourceMappingURL=report.js.map