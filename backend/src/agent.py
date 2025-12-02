
import logging
import os
import json
import datetime
import asyncio
from typing import Optional, List, Dict

from dotenv import load_dotenv
import random

# LiveKit framework and plugins
from livekit.agents import (
    Agent,
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
from livekit.agents.voice import AgentSession
from livekit.plugins import murf, silero, google, deepgram, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("agent")

load_dotenv(".env.local")
class ImprovHostAgent(Agent):
    """Agent that runs the 'Improv Battle' single-player improv game.

    It exposes a small in-memory `improv_state` object that tracks player name,
    rounds, phases, and reactions. The agent plays the role of a TV improv host
    and uses a set of built-in scenarios and templated reactions to keep audio-first
    gameplay snappy and varied.
    """

    SCENARIOS = [
        "You are a barista who has to tell a customer that their latte is actually a portal to another dimension.",
        "You are a time-travelling tour guide explaining modern smartphones to someone from the 1800s.",
        "You are a restaurant waiter who must calmly tell a customer that their order has escaped the kitchen.",
        "You are a customer trying to return an obviously cursed object to a very skeptical shop owner.",
        "You are an astronaut trying to sell souvenirs from Earth to a friendly alien tourist.",
        "You are a weather reporter announcing a surprise event: raining rubber ducks across the city.",
    ]

    def __init__(self) -> None:
        host_instructions = (
            "You are the host of a TV improv show called 'Improv Battle'.\n"
            "Style: high-energy, witty, and clear about rules. Mix teasing, praise, and constructive critique.\n"
            "Introduce the show, run N rounds (default 3), set scenarios, prompt the player to improvise, listen for 'End scene' or an explicit stop, then react.\n"
            "Maintain an `improv_state` on the agent instance with keys: player_name, current_round, max_rounds, rounds, phase.\n"
            "Phases: intro | awaiting_improv | reacting | done.\n"
            "When reacting, randomly choose tone: supportive, neutral, or mildly critical (never abusive). Keep reactions short and specific, and store them in improv_state['rounds'].\n"
            "When the game finishes, provide a short closing summary that highlights the player's strengths and specific moments.\n"
            "If the user says 'stop game' or 'end show', confirm and end gracefully."
        )

        super().__init__(instructions=host_instructions)

        # Voice preference for the host (can be swapped at runtime)
        self.VOICE_HOST = {"voice_id": "Alicia", "style": "Energetic", "model": "Falcon"}

        # In-memory session state for the improv game
        self.improv_state: Dict = {
            "player_name": None,
            "current_round": 0,
            "max_rounds": 3,
            "rounds": [],
            "phase": "idle",  # idle | intro | awaiting_improv | reacting | done
        }

    def _pick_scenario(self) -> str:
        return random.choice(self.SCENARIOS)

    def _make_round(self, scenario: str) -> Dict:
        return {"scenario": scenario, "player_lines": [], "host_reaction": None}

    @function_tool
    async def start_game(self, context: RunContext, player_name: Optional[str] = None, max_rounds: int = 3):
        """Start an improv game for a player. Sets name and initializes rounds."""
        if player_name:
            self.improv_state["player_name"] = player_name.strip()
        else:
            # Try to extract name from context if available, otherwise default
            if not self.improv_state.get("player_name"):
                self.improv_state["player_name"] = "Contestant"

        self.improv_state["max_rounds"] = max(1, int(max_rounds))
        self.improv_state["current_round"] = 0
        self.improv_state["rounds"] = []
        self.improv_state["phase"] = "intro"

        # Prepare first scenario
        scenario = self._pick_scenario()
        self.improv_state["rounds"].append(self._make_round(scenario))
        self.improv_state["phase"] = "awaiting_improv"

        intro_text = (
            f"Welcome to Improv Battle, {self.improv_state['player_name']}! We'll do {self.improv_state['max_rounds']} rounds. "
            "I'll set the scene, you play it, and say 'End scene' when you're done. Let's begin."
        )

        prompt_text = f"Round 1: {scenario} Start improvising now."

        return {"status": "ok", "intro": intro_text, "prompt": prompt_text, "state": self.improv_state}

    @function_tool
    async def submit_improv(self, context: RunContext, text: str, end_scene: bool = False):
        """Submit player utterance text. If end_scene True (or heuristic), produce a host reaction and advance the game."""
        state = self.improv_state
        if state["phase"] in ["idle", "done"]:
            return {"status": "error", "message": "Game not running. Call start_game first."}

        # Append player text to current round
        cr = state["current_round"]
        # If no rounds yet, create one
        if not state["rounds"]:
            scenario = self._pick_scenario()
            state["rounds"].append(self._make_round(scenario))

        current = state["rounds"][cr]
        current["player_lines"].append(text)

        # Simple end-scene heuristics: explicit flag or phrase
        normalized = (text or "").strip().lower()
        if end_scene or normalized.endswith("end scene") or normalized in ("ok", "okay", "end", "that's it"):
            # Produce a reaction
            reaction = self._generate_host_reaction(current["scenario"], current["player_lines"]) 
            current["host_reaction"] = reaction

            # Move to reacting briefly, then next round or done
            state["phase"] = "reacting"

            # Advance counters
            state["current_round"] += 1
            if state["current_round"] >= state.get("max_rounds", 3):
                state["phase"] = "done"
                summary = self._make_closing_summary()
                return {"status": "ok", "reaction": reaction, "state": state, "summary": summary}
            else:
                # prepare next scenario
                next_scenario = self._pick_scenario()
                state["rounds"].append(self._make_round(next_scenario))
                state["phase"] = "awaiting_improv"
                prompt = f"Next round: {next_scenario} Start when ready."
                return {"status": "ok", "reaction": reaction, "next_prompt": prompt, "state": state}

        # Otherwise still awaiting more improv
        state["phase"] = "awaiting_improv"
        return {"status": "ok", "message": "Recorded line.", "state": state}

    @function_tool
    async def get_state(self, context: RunContext):
        return {"state": self.improv_state}

    @function_tool
    async def stop_game(self, context: RunContext, confirm: bool = False):
        """Handle early exit: confirm True to end immediately, otherwise ask confirmation."""
        if not confirm:
            return {"status": "confirm", "message": "Do you want to end the show now? Say 'yes' to confirm."}
        self.improv_state["phase"] = "done"
        summary = self._make_closing_summary()
        return {"status": "ok", "summary": summary}

    def _generate_host_reaction(self, scenario: str, player_lines: List[str]) -> str:
        """Create a short, varied reaction using templates and a chosen tone."""
        tone = random.choice(["supportive", "neutral", "mildly_critical"])
        last_line = (player_lines[-1] if player_lines else "").strip()

        if tone == "supportive":
            templates = [
                "Brilliant! That was delightful — I loved the choice of detail about '{snippet}'.",
                "Fantastic energy, especially when you said '{snippet}'. Really sold the bit!",
                "Hilarious. You leaned into the character and it paid off — great tempo."
            ]
        elif tone == "neutral":
            templates = [
                "Solid work — you set the scene clearly. You could try one more character beat next time.",
                "Nice attempt; the image of the scene was clear. Consider stretching the moment a touch more.",
                "That worked. I got the premise — maybe pick one choice to commit to even more."
            ]
        else:
            templates = [
                "Not bad, but that felt a bit rushed — try to slow down and savor each choice.",
                "You had a funny idea, but it landed a little flat. Try exaggerating one detail next time.",
                "Good bones, could use stronger character choices to make the scene sing."
            ]

        snippet = (last_line[:60] + "...") if last_line and len(last_line) > 60 else last_line or "that moment"
        reaction = random.choice(templates).format(snippet=snippet)
        # Always add a short transition line
        transition = " Ready for the next one." if self.improv_state["current_round"] + 1 < self.improv_state.get("max_rounds", 3) else " That's the final bell!"
        return f"{reaction}{transition}"

    def _make_closing_summary(self) -> str:
        rounds = self.improv_state.get("rounds", [])
        highlights = []
        for r in rounds:
            if r.get("player_lines"):
                highlights.append(r.get("player_lines")[-1])
        sample = (highlights[0] if highlights else "your performances")
        summary = (
            f"Thanks for playing, {self.improv_state.get('player_name') or 'player'}! "
            f"You showed strong imagination and willingness to commit — especially in the bit about '{sample}'. "
            "You tended to favor quick jokes and vivid images. Keep pushing character choices and timing. Great job!"
        )
        return summary

    def _load_catalog(self):
        try:
            if os.path.exists(self.catalog_file):
                with open(self.catalog_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.catalog = {item["id"]: item for item in data.get("items", [])}
        except Exception as e:
            logger.error(f"Failed to load catalog: {e}")

    def _load_recipes(self):
        try:
            if os.path.exists(self.recipes_file):
                with open(self.recipes_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.recipes = {r["dish"].lower(): r for r in data.get("recipes", [])}
        except Exception as e:
            logger.error(f"Failed to load recipes: {e}")

    # ---------------- Ordering tools ----------------
    @function_tool
    async def search_catalog(self, context: RunContext, query: str):
        """Search the catalog by item name or category."""
        query_lower = (query or "").lower()
        results = []
        for item_id, item in self.catalog.items():
            name = (item.get("name") or "").lower()
            category = (item.get("category") or "").lower()
            if query_lower in name or query_lower in category:
                results.append({
                    "id": item_id,
                    "name": item.get("name"),
                    "price": item.get("price"),
                    "unit": item.get("unit"),
                    "category": item.get("category"),
                    "description": item.get("description")
                })
        return {"results": results, "count": len(results)}

    @function_tool
    async def add_item_to_cart(self, context: RunContext, item_name: str, quantity: float = 1.0):
        """Add an item to the cart by name or ID."""
        item_name_lower = (item_name or "").lower()
        item_id = None
        item_obj = None

        # Try exact ID match first
        if item_name in self.catalog:
            item_id = item_name
            item_obj = self.catalog[item_name]
        else:
            # Try name match
            for iid, itm in self.catalog.items():
                if (itm.get("name") or "").lower() == item_name_lower:
                    item_id = iid
                    item_obj = itm
                    break
            # Fallback: substring match
            if not item_id:
                for iid, itm in self.catalog.items():
                    if item_name_lower in (itm.get("name") or "").lower():
                        item_id = iid
                        item_obj = itm
                        break

        if not item_obj:
            return {"status": "error", "message": f"Item '{item_name}' not found in catalog."}

        if item_id in self.cart:
            self.cart[item_id]["quantity"] += quantity
        else:
            self.cart[item_id] = {"item": item_obj, "quantity": quantity}

        return {
            "status": "ok",
            "message": f"Added {quantity} {item_obj.get('unit')}(s) of {item_obj.get('name')} to cart.",
            "item_name": item_obj.get("name"),
            "quantity": self.cart[item_id]["quantity"]
        }

    @function_tool
    async def remove_item_from_cart(self, context: RunContext, item_name: str):
        """Remove an item from the cart by name."""
        item_name_lower = (item_name or "").lower()
        item_id = None

        for iid, cart_entry in self.cart.items():
            if (cart_entry["item"].get("name") or "").lower() == item_name_lower:
                item_id = iid
                break

        if not item_id:
            return {"status": "error", "message": f"'{item_name}' not in cart."}

        removed = self.cart.pop(item_id)
        return {
            "status": "ok",
            "message": f"Removed {removed['item'].get('name')} from cart."
        }

    @function_tool
    async def view_cart(self, context: RunContext):
        """Show all items currently in the cart."""
        if not self.cart:
            return {"status": "empty", "message": "Your cart is empty."}

        total = 0.0
        items = []
        for item_id, entry in self.cart.items():
            item = entry["item"]
            qty = entry["quantity"]
            price = float(item.get("price", 0))
            subtotal = price * qty
            total += subtotal
            items.append({
                "name": item.get("name"),
                "quantity": qty,
                "unit": item.get("unit"),
                "price_each": price,
                "subtotal": round(subtotal, 2)
            })

        return {
            "status": "ok",
            "items": items,
            "total": round(total, 2),
            "item_count": len(items)
        }

    @function_tool
    async def add_recipe(self, context: RunContext, dish: str):
        """Add ingredients for a dish (e.g., 'ingredients for spaghetti')."""
        dish_lower = (dish or "").lower().strip()
        recipe = self.recipes.get(dish_lower)

        if not recipe:
            return {"status": "error", "message": f"Recipe for '{dish}' not found."}

        added_items = []
        for item_id, qty in zip(recipe.get("items", []), recipe.get("quantities", [])):
            if item_id in self.catalog:
                item = self.catalog[item_id]
                if item_id in self.cart:
                    self.cart[item_id]["quantity"] += qty
                else:
                    self.cart[item_id] = {"item": item, "quantity": qty}
                added_items.append(f"{qty} {item.get('unit')}(s) of {item.get('name')}")

        if added_items:
            return {
                "status": "ok",
                "message": f"I've added ingredients for {recipe.get('description')}: {', '.join(added_items)}",
                "items_added": added_items
            }
        else:
            return {"status": "error", "message": "Could not add recipe items."}

    @function_tool
    async def list_recipes(self, context: RunContext):
        """List available recipes."""
        dishes = [
            {"dish": dish, "description": r.get("description")}
            for dish, r in self.recipes.items()
        ]
        return {"recipes": dishes, "count": len(dishes)}

    @function_tool
    async def place_order(self, context: RunContext, customer_name: str = "Guest"):
        """Finalize the cart and place the order (save to JSON)."""
        if not self.cart:
            return {"status": "error", "message": "Cart is empty. Cannot place order."}

        # Calculate totals
        total = 0.0
        order_items = []
        for item_id, entry in self.cart.items():
            item = entry["item"]
            qty = entry["quantity"]
            price = float(item.get("price", 0))
            subtotal = price * qty
            total += subtotal
            order_items.append({
                "item_id": item_id,
                "name": item.get("name"),
                "quantity": qty,
                "unit": item.get("unit"),
                "price_each": price,
                "subtotal": round(subtotal, 2)
            })

        # Create order object
        order = {
            "order_id": f"ORD-{int(datetime.datetime.now().timestamp() * 1000) % 1000000}",
            "timestamp": datetime.datetime.now().isoformat(),
            "customer_name": customer_name,
            "items": order_items,
            "total": round(total, 2),
            "status": "placed",
            "notes": ""
        }

        # Save to JSON atomically
        try:
            os.makedirs(os.path.dirname(self.orders_file), exist_ok=True)
            orders = []
            if os.path.exists(self.orders_file):
                with open(self.orders_file, "r", encoding="utf-8") as f:
                    try:
                        orders = json.load(f)
                        if not isinstance(orders, list):
                            orders = []
                    except Exception:
                        orders = []

            orders.append(order)
            tmp = self.orders_file + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(orders, f, ensure_ascii=False, indent=2)
            os.replace(tmp, self.orders_file)

            # Clear cart after order
            self.cart = {}

            return {
                "status": "ok",
                "message": f"Order {order['order_id']} placed successfully!",
                "order_id": order["order_id"],
                "total": order["total"],
                "item_count": len(order_items)
            }
        except Exception as e:
            logger.error(f"Failed to place order: {e}")
            return {"status": "error", "message": "Failed to place order. Please try again."}

    async def _ensure_voice(self, context: Optional[RunContext], voice):
        """Best-effort TTS voice switching."""
        self._requested_voice = voice
        if context is None:
            return
        try:
            session = getattr(context, "session", None)
            if session is not None:
                tts = getattr(session, "tts", None)
                if tts is not None:
                    try:
                        maybe = tts.set_voice
                        if asyncio.iscoroutinefunction(maybe):
                            await maybe(voice)
                        else:
                            await asyncio.to_thread(maybe, voice)
                        return
                    except Exception:
                        try:
                            if isinstance(voice, dict):
                                setattr(tts, "voice", voice.get("voice_id"))
                            else:
                                setattr(tts, "voice", voice)
                            return
                        except Exception:
                            return
        except Exception:
            return



def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


class DynamicMurf:
    """Simple proxy wrapper around murf.TTS that allows swapping voice at runtime.

    This recreates an internal murf.TTS instance when `set_voice` is called.
    It forwards attribute access and method calls to the current instance.
    """

    def __init__(self, voice=None, **kwargs):
        # voice can be a string voice id or a dict with keys {voice_id, style, model}
        self._kwargs = dict(kwargs)
        self._voice_spec = None
        if isinstance(voice, dict):
            self._voice_spec = voice
            voice_id = voice.get("voice_id")
            mk = dict(self._kwargs)
            if "style" in voice:
                mk["style"] = voice.get("style")
            if "model" in voice:
                mk["model"] = voice.get("model")
            self._voice = voice_id
            self._impl = murf.TTS(voice=voice_id, **mk)
        else:
            self._voice = voice
            self._impl = murf.TTS(voice=voice, **self._kwargs)

    def set_voice(self, voice):
        # Accept either a string voice id or a voice spec dict
        if isinstance(voice, dict):
            voice_id = voice.get("voice_id")
            if voice_id == self._voice:
                return
            self._voice_spec = voice
            mk = dict(self._kwargs)
            if "style" in voice:
                mk["style"] = voice.get("style")
            if "model" in voice:
                mk["model"] = voice.get("model")
            self._voice = voice_id
            self._impl = murf.TTS(voice=voice_id, **mk)
        else:
            if voice == self._voice:
                return
            self._voice_spec = None
            self._voice = voice
            self._impl = murf.TTS(voice=voice, **self._kwargs)

    def __getattr__(self, item):
        return getattr(self._impl, item)


async def entrypoint(ctx: JobContext):
    # Logging setup
    # Add any other context you want in all log entries here
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # Set up a voice AI pipeline using OpenAI, Cartesia, AssemblyAI, and the LiveKit turn detector
    session = AgentSession(
        # Speech-to-text (STT) is your agent's ears, turning the user's speech into text that the LLM can understand
        # See all available models at https://docs.livekit.io/agents/models/stt/
        stt=deepgram.STT(model="nova-3"),
        # A Large Language Model (LLM) is your agent's brain, processing user input and generating a response
        # See all available models at https://docs.livekit.io/agents/models/llm/
        llm=google.LLM(
                model="gemini-2.5-flash",
            ),
        # Text-to-speech (TTS) is your agent's voice, turning the LLM's text into speech that the user can hear
        # See all available models as well as voice selections at https://docs.livekit.io/agents/models/tts/
        tts=DynamicMurf(
                voice={"voice_id": "Alicia", "style": "Friendly", "model": "Falcon"},
                tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
                text_pacing=True,
            ),
        # VAD and turn detection are used to determine when the user is speaking and when the agent should respond
        # See more at https://docs.livekit.io/agents/build/turns
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        # allow the LLM to generate a response while waiting for the end of turn
        # See more at https://docs.livekit.io/agents/build/audio/#preemptive-generation
        preemptive_generation=True,
    )

    # To use a realtime model instead of a voice pipeline, use the following session setup instead.
    # (Note: This is for the OpenAI Realtime API. For other providers, see https://docs.livekit.io/agents/models/realtime/))
    # 1. Install livekit-agents[openai]
    # 2. Set OPENAI_API_KEY in .env.local
    # 3. Add `from livekit.plugins import openai` to the top of this file
    # 4. Use the following session setup instead of the version above
    # session = AgentSession(
    #     llm=openai.realtime.RealtimeModel(voice="marin")
    # )

    # Metrics collection, to measure pipeline performance
    # For more information, see https://docs.livekit.io/agents/build/metrics/
    usage_collector = metrics.UsageCollector()

    @session.on("metrics_collected")
    def _on_metrics_collected(ev: MetricsCollectedEvent):
        metrics.log_metrics(ev.metrics)
        usage_collector.collect(ev.metrics)

    async def log_usage():
        summary = usage_collector.get_summary()
        logger.info(f"Usage: {summary}")

    ctx.add_shutdown_callback(log_usage)

    # # Add a virtual avatar to the session, if desired
    # # For other providers, see https://docs.livekit.io/agents/models/avatar/
    # avatar = hedra.AvatarSession(
    #   avatar_id="...",  # See https://docs.livekit.io/agents/models/avatar/plugins/hedra
    # )
    # # Start the avatar and wait for it to join
    # await avatar.start(session, room=ctx.room)

    # Start the session, which initializes the voice pipeline and warms up the models
    # Instantiate the Improv host agent
    assistant = ImprovHostAgent()

    await session.start(
        agent=assistant,
        room=ctx.room,
        room_input_options=RoomInputOptions(
            # For telephony applications, use `BVCTelephony` for best results
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )

    # Join the room and connect to the user
    await ctx.connect()


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
