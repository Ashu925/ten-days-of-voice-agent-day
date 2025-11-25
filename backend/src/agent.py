import logging
import os
import json
import datetime
from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    JobProcess,
    MetricsCollectedEvent,
    RoomInputOptions,
    WorkerOptions,
    cli,
    metrics,
    tokenize,
    function_tool,
    RunContext,
)
from livekit.plugins import murf, silero, google, deepgram, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("agent")
load_dotenv(".env.local")


# -------------------------------------------------------------
# Wellness Companion Agent
# -------------------------------------------------------------
class WellnessAssistant(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions="""
            You are a calm, supportive daily wellness companion.
            Your job is to guide a short daily check-in through voice.

            Your tone must be:
            - Supportive, friendly, grounded
            - Never medical or diagnostic
            - Never provide treatment, prescriptions, or health claims

            During each session:
            1. Ask about mood, energy, and anything on the user’s mind.
            2. Ask for 1–3 realistic goals or intentions for the day.
            3. Offer small, simple suggestions:
                - break tasks into steps
                - take a short walk
                - take small breaks
                - gentle encouragement
            4. Close with a recap:
                - summarize mood
                - summarize goals
                - ask “Does this sound right?”

            Use past check-ins if available.
            If a past log says the user had low energy, you may ask:
            “Last time you mentioned low energy. How does today compare?”

            Avoid:
            - medical judgments
            - diagnoses
            - health claims

            Use the provided tools to read and save check-ins.
            """,
        )

        # session storage
        self.checkin_state = {
            "mood": "",
            "energy": "",
            "stress": "",
            "intentions": [],
            "summary": "",
        }

    # ----------------------------- TOOLS -----------------------------

    @function_tool
    async def save_checkin(self, context: RunContext, mood: str, energy: str,
                           stress: str, intentions: str, summary: str):
        """
        Save the completed check-in to the JSON log.
        Intentions should be a comma-separated list.
        """
        log_path = os.path.join(os.getcwd(), "wellness_log.json")

        entry = {
            "timestamp": datetime.datetime.now().isoformat(),
            "mood": mood,
            "energy": energy,
            "stress": stress,
            "intentions": [i.strip() for i in intentions.split(",") if i.strip()],
            "summary": summary,
        }

        # load existing log
        try:
            if os.path.exists(log_path):
                with open(log_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
            else:
                data = []
        except Exception as e:
            logger.error(f"Failed to read log: {e}")
            data = []

        # append entry
        data.append(entry)

        # save back to file
        try:
            with open(log_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            return f"Check-in complete but saving failed: {e}"

        return "Check-in saved successfully."

    @function_tool
    async def load_past_checkins(self, context: RunContext):
        """Return previous check-in logs as a list."""
        log_path = os.path.join(os.getcwd(), "wellness_log.json")

        if not os.path.exists(log_path):
            return []

        try:
            with open(log_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return data
        except:
            return []


# -------------------------------------------------------------
# Prewarm (load VAD)
# -------------------------------------------------------------
def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


# -------------------------------------------------------------
# Entry point
# -------------------------------------------------------------
async def entrypoint(ctx: JobContext):

    session = AgentSession(
        stt=deepgram.STT(model="nova-3"),
        llm=google.LLM(model="gemini-2.5-flash"),
        tts=murf.TTS(
            voice="en-US-matthew",
            style="Conversation",
            tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
            text_pacing=True,
        ),
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=True,
    )

    await session.start(
        agent=WellnessAssistant(),
        room=ctx.room,
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )

    await ctx.connect()


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
