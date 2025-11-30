import logging
import os
import json
import datetime
import asyncio
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# LiveKit framework
from livekit.agents import (
    Agent,
    JobContext,
    JobProcess,
    RoomInputOptions,
    WorkerOptions,
    cli,
    function_tool,
    RunContext,
)
from livekit.agents.voice import AgentSession
from livekit.plugins import murf, silero, google, deepgram, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel
from livekit.agents import tokenize

logger = logging.getLogger("agent")
load_dotenv(".env.local")

# -------------------------------------------------------
#   Load / Save JSON WORLD STATE
# -------------------------------------------------------
WORLD_STATE_PATH = os.path.join(os.getcwd(), "shared-data", "world_state.json")


def load_world_state() -> Dict[str, Any]:
    if os.path.exists(WORLD_STATE_PATH):
        try:
            with open(WORLD_STATE_PATH, "r") as f:
                return json.load(f)
        except:
            pass

    # Default starting world state (simple story)
    return {
        "player": {
            "name": "Player",
            "class": "Adventurer",
            "hp": 20,
            "inventory": [],
            "traits": ["curious", "brave"]
        },

        "locations": {
            "current": "Willowvale Village",
            "known": {
                "Willowvale Village": {
                    "description": "A peaceful village with wooden houses.",
                    "paths": ["Forest Path", "Riverbank", "Old Cabin"]
                },
                "Forest Path": {
                    "description": "A quiet forest trail with tall trees.",
                    "paths": ["Willowvale Village"]
                },
                "Riverbank": {
                    "description": "A calm river where Milo often plays.",
                    "paths": ["Willowvale Village"]
                },
                "Old Cabin": {
                    "description": "A dusty wooden cabin belonging to Miller Rowan.",
                    "paths": ["Willowvale Village"]
                }
            }
        },

        "npcs": {
            "Elda": {
                "role": "Village Elder",
                "attitude": "friendly",
                "alive": True,
                "location": "Willowvale Village"
            },
            "Milo": {
                "role": "Young boy from the village",
                "attitude": "friendly",
                "alive": True,
                "location": "Riverbank"
            },
            "Miller Rowan": {
                "role": "Old miller",
                "attitude": "neutral",
                "alive": True,
                "location": "Old Cabin"
            },
            "Shadow Wolf": {
                "role": "Forest creature",
                "attitude": "hostile",
                "alive": True,
                "location": "Forest Path"
            }
        },

        "quests": {
            "main_quest": {
                "title": "The Lost Amulet of Willowvale",
                "completed": False,
                "current_step": "Talk to Elder Elda",
                "steps_completed": []
            }
        },

        "events": {
            "met_elda": False,
            "met_milo": False,
            "fought_shadow_wolf": False,
            "confronted_miller": False,
            "found_amulet": False
        }
    }


def save_world_state(state: Dict[str, Any]):
    os.makedirs(os.path.dirname(WORLD_STATE_PATH), exist_ok=True)
    tmp = WORLD_STATE_PATH + ".tmp"
    with open(tmp, "w") as f:
        json.dump(state, f, indent=2)
    os.replace(tmp, WORLD_STATE_PATH)


# -------------------------------------------------------
#   RULE-BASED STORY LOGIC (Very simple)
# -------------------------------------------------------
def apply_story_rules(state: Dict[str, Any], player_text: str) -> Dict[str, Any]:
    text = player_text.lower()

    # Talk to Elder Elda
    if "talk" in text and "elda" in text:
        state["events"]["met_elda"] = True
        state["quests"]["main_quest"]["steps_completed"].append("Spoke with Elder Elda")
        state["quests"]["main_quest"]["current_step"] = "Find Milo at the Riverbank"

    # Meet Milo
    if "milo" in text:
        state["events"]["met_milo"] = True
        state["quests"]["main_quest"]["steps_completed"].append("Found Milo")
        state["quests"]["main_quest"]["current_step"] = "Search the Forest Path"

    # Enter forest
    if "forest" in text or "path" in text:
        if not state["events"]["fought_shadow_wolf"]:
            state["events"]["fought_shadow_wolf"] = True
            state["player"]["hp"] -= 3
            state["quests"]["main_quest"]["current_step"] = "Investigate the Old Cabin"

    # Old cabin
    if "cabin" in text or "rowan" in text:
        if not state["events"]["found_amulet"]:
            state["events"]["confronted_miller"] = True
            state["events"]["found_amulet"] = True
            state["player"]["inventory"].append("Lost Amulet")
            state["quests"]["main_quest"]["current_step"] = "Return to Elder Elda"

    return state


# -------------------------------------------------------
#   Dynamic Murf Wrapper
# -------------------------------------------------------
class DynamicMurf:
    def __init__(self, voice=None, **kwargs):
        self._kwargs = dict(kwargs)
        self._voice = voice.get("voice_id") if isinstance(voice, dict) else voice
        self._impl = murf.TTS(voice=self._voice, **kwargs)

    def set_voice(self, voice):
        vid = voice.get("voice_id") if isinstance(voice, dict) else voice
        if vid != self._voice:
            self._voice = vid
            self._impl = murf.TTS(voice=vid, **self._kwargs)

    def __getattr__(self, item):
        return getattr(self._impl, item)


# -------------------------------------------------------
#   GAME MASTER CLASS
# -------------------------------------------------------
class GameMaster(Agent):
    def __init__(self):
        self.VOICE_GM = {
            "voice_id": "Alicia",
            "style": "Narration",
            "model": "Falcon"
        }

        # Load state
        self.state = load_world_state()

        super().__init__(
            instructions=(
                "You are the Game Master of a simple fantasy adventure.\n"
                "Rules:\n"
                "• Keep responses short and friendly.\n"
                "• Use the JSON world state to maintain continuity.\n"
                "• Never reveal JSON.\n"
                "• Always end with: 'What do you do?'\n"
            )
        )

    @function_tool
    async def update_world(self, context: RunContext, updates: Dict[str, Any]):
        for k, v in updates.items():
            self.state[k] = v
        save_world_state(self.state)
        return {"status": "ok"}

    @function_tool
    async def roll_dice(self, context: RunContext, sides: int = 20):
        import random
        return {"result": random.randint(1, sides)}

    async def on_input_text(self, context: RunContext, text: str):
        # Apply rule-based updates
        self.state = apply_story_rules(self.state, text)
        save_world_state(self.state)


# -------------------------------------------------------
#   PREWARM
# -------------------------------------------------------
def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


# -------------------------------------------------------
#   ENTRYPOINT
# -------------------------------------------------------
async def entrypoint(ctx: JobContext):
    ctx.log_context_fields = {"room": ctx.room.name}

    session = AgentSession(
        stt=deepgram.STT(model="nova-3"),
        llm=google.LLM(model="gemini-2.5-flash"),
        tts=DynamicMurf(
            voice={"voice_id": "Alicia", "style": "Narration", "model": "Falcon"},
            tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
            text_pacing=True,
        ),
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=True,
    )

    gm = GameMaster()

    # Start adventure with intro scene
    intro = (
        "Welcome, traveler. You arrive in the quiet Willowvale Village. "
        "Elder Elda looks at you with concern. "
        "‘Please… our sacred amulet has gone missing.’\n\n"
        "What do you do?"
    )

    await session.start(
        agent=gm,
        room=ctx.room,
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC()
        )
    )

    await ctx.send_message(intro)
    await ctx.connect()


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
