
# src/agent.py
import logging
from typing import Optional, Dict, List
from dotenv import load_dotenv

from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    JobProcess,
    RoomInputOptions,
    WorkerOptions,
    cli,
    metrics,
    tokenize,
    function_tool,
    RunContext,
)
from livekit.plugins import murf, deepgram, google, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel
from livekit.agents import MetricsCollectedEvent

from merchant import list_products, create_order, last_order, remove_item_from_order
from merchant import PRODUCTS as MERCHANT_PRODUCTS, CATALOG_PATH as MERCHANT_CATALOG_PATH, list_products as merchant_list_products, create_order as merchant_create_order, reload_catalog as merchant_reload_catalog, get_variants_for_group as merchant_get_variants_for_group, group_products_by_base as merchant_group_products_by_base, find_group_for_product as merchant_find_group_for_product

load_dotenv(".env.local")

logger = logging.getLogger("agent")
logger.setLevel(logging.INFO)


class ShoppingAssistant(Agent):
    def __init__(self):
        super().__init__(
            instructions="""
You are a voice shopping assistant. Use tools to list, add/remove, and checkout.
When user asks to browse, call list_products_tool with an optional filters dict.
When user confirms purchase, call add_to_cart_tool then checkout_tool.
Always use prices from the merchant layer (INR).
Keep replies concise.
"""
        )
        self.cart: List[Dict] = []

    def _product_matches_filters(self, product: Dict, filters: Optional[Dict]) -> bool:
        if not filters:
            return True
        f = filters or {}
        name = f.get('name')
        category = f.get('category')
        color = f.get('color')
        size = f.get('size')
        min_price = f.get('min_price')
        max_price = f.get('max_price')
        if name and name.lower() not in product.get('name', '').lower():
            return False
        if category and category.lower() != (product.get('category') or '').lower() and category.lower() not in (product.get('tags') or []):
            return False
        if color and color.lower() != (product.get('color') or '').lower():
            return False
        if size and size != (product.get('size') or ''):
            return False
        price = int(product.get('price', 0) or 0)
        if min_price is not None:
            try:
                if price < int(min_price):
                    return False
            except Exception:
                pass
        if max_price is not None:
            try:
                if price > int(max_price):
                    return False
            except Exception:
                pass
        return True

    # TOOL: list products (single optional filters dict)
    @function_tool
    async def list_products_tool(self, ctx: RunContext, filters: Optional[Dict] = None):
        filters = filters or {}
        prods = list_products(filters)
        if not prods:
            return {"products": [], "message": "No products found."}
        # send top-5 summarized products
        out = []
        for p in prods[:5]:
            out.append({
                "id": p["id"],
                "name": p["name"],
                "price": p["price"],
                "currency": p.get("currency", "INR"),
                "color": p.get("color"),
                "size": p.get("size"),
            })
        return {"products": out}

    @function_tool
    async def list_grouped_products_tool(self, ctx: RunContext, filters: Optional[Dict] = None):
        """List product groups (by base name) with available variants (colors/sizes)."""
        filters = filters or {}
        prods = merchant_list_products(filters)
        # group by base name (use merchant helper)
        groups = merchant_group_products_by_base()
        out = []
        for base, items in groups.items():
            # apply filters to variants
            variants = [p for p in items if self._product_matches_filters(p, filters)]
            if not variants:
                continue
            sizes = sorted(set(v.get('size') for v in variants if v.get('size')))
            out.append({
                "group_id": base,
                "name": base,
                "variants": [{"id": v.get('id'), "color": v.get('color'), "size": v.get('size'), "price": v.get('price')} for v in variants],
                "sizes": sizes,
                "count": len(variants),
            })
        return {"groups": out, "count": len(out)}

    # TOOL: add to in-session cart
    @function_tool
    async def add_to_cart_tool(self, ctx: RunContext, product_id: str, quantity: Optional[int] = 1, size: Optional[str] = None):
        # Accept either a product_id directly, or a group_id prefixed with 'group:'
        p = None
        if isinstance(product_id, str) and product_id.startswith("group:"):
            # user specified a group; extract and require color or size
            gid = product_id.split("group:", 1)[1]
            # look for default variant if only one
            variants = merchant_get_variants_for_group(gid)
            if not variants:
                return {"ok": False, "message": "Product group not found."}
            if len(variants) == 1:
                p = variants[0]
            else:
                # ambiguous: multiple variants - require color/size selection
                # If the caller provided an explicit size, try to pick that
                if size:
                    match = next((v for v in variants if str(v.get('size') or '').lower() == str(size or '').lower()), None)
                    if match:
                        p = match
                    else:
                        sizes = sorted(set(v.get('size') for v in variants if v.get('size')))
                        return {"ok": False, "message": f"No variant found for size '{size}'. Specify one of: {sizes}", "sizes": sizes}
                else:
                    colors = sorted(set(v.get('color') for v in variants if v.get('color')))
                    sizes = sorted(set(v.get('size') for v in variants if v.get('size')))
                    return {"ok": False, "message": "Ambiguous variant. Specify color and/or size.", "colors": colors, "sizes": sizes}
        else:
            p = next((x for x in merchant_list_products({}) if x["id"] == product_id), None)
        if not p:
            return {"ok": False, "message": "Product not found."}
        self.cart.append({"product_id": p["id"], "name": p["name"], "quantity": int(quantity or 1), "unit_price": p["price"]})
        total = sum(i["quantity"] * i["unit_price"] for i in self.cart)
        return {"ok": True, "cart": self.cart, "total": total, "currency": p.get("currency", "INR")}

    # TOOL: remove from in-session cart
    @function_tool
    async def remove_from_cart_tool(self, ctx: RunContext, product_id: str):
        before = len(self.cart)
        self.cart = [i for i in self.cart if i["product_id"] != product_id]
        after = len(self.cart)
        if before == after:
            return {"ok": False, "message": "Product not in cart."}
        total = sum(i["quantity"] * i["unit_price"] for i in self.cart)
        return {"ok": True, "cart": self.cart, "total": total}

    # TOOL: checkout -> calls merchant.create_order
    @function_tool
    async def checkout_tool(self, ctx: RunContext):
        if not self.cart:
            return {"ok": False, "message": "Cart empty."}
        line_items = [{"product_id": i["product_id"], "quantity": i["quantity"]} for i in self.cart]
        order = create_order(line_items)
        self.cart = []
        return {"ok": True, "order": order}

    # TOOL: view last (merchant)
    @function_tool
    async def view_last_order_tool(self, ctx: RunContext):
        order = last_order()
        if not order:
            return {"ok": False, "message": "No previous orders."}
        return {"ok": True, "order": order}

    # TOOL: remove item from merchant order
    @function_tool
    async def remove_item_tool(self, ctx: RunContext, order_id: str, product_id: str):
        updated = remove_item_from_order(order_id, product_id)
        if not updated:
            return {"ok": False, "message": "Order or product not found."}
        return {"ok": True, "order": updated}

    # Compatibility wrapper methods/tools for test harness and LLM
    @function_tool
    async def list_products(self, ctx: RunContext, filters: Optional[Dict] = None):
        """Return products as {'results': [...], 'count': N} to match test expectations"""
        filters = filters or {}
        prods = merchant_list_products(filters)
        res = []
        for p in prods:
            # compute sizes available for this product via group lookup
            group = merchant_find_group_for_product(p.get('id'))
            if group:
                sizes = sorted({v.get('size') for v in merchant_get_variants_for_group(group) if v.get('size')})
            else:
                sizes = ([p.get('size')] if p.get('size') else [])
            res.append({
                "id": p.get("id"),
                "name": p.get("name"),
                "price": p.get("price"),
                "currency": p.get("currency", "INR"),
                "category": p.get("category"),
                "attributes": {"color": p.get("color"), "size": p.get("size"), "tags": p.get("tags", [])},
                "sizes": sizes,
            })
        return {"results": res, "count": len(res)}

    @function_tool
    async def create_order(self, ctx: RunContext, line_items: List[Dict]):
        o = merchant_create_order(line_items)
        if not o:
            return {"status": "error", "message": "Failed to create order."}
        return {"status": "ok", "order": o}

    @function_tool
    async def get_product_details(self, ctx: RunContext, product_id: str):
        if product_id.startswith("group:"):
            gid = product_id.split("group:", 1)[1]
            variants = merchant_get_variants_for_group(gid)
            if not variants:
                return {"status": "error", "message": "Product group not found."}
            sizes = sorted({v.get('size') for v in variants if v.get('size')})
            colors = sorted({v.get('color') for v in variants if v.get('color')})
            return {"status": "ok", "product": {"group_id": gid, "name": gid, "sizes": sizes, "colors": colors, "variants": variants}}
        prod = next((p for p in MERCHANT_PRODUCTS if p.get("id") == product_id), None)
        if not prod:
            return {"status": "error", "message": "Product not found."}
        return {"status": "ok", "product": prod}

    @function_tool
    async def list_categories(self, ctx: RunContext):
        cats = sorted(set(p.get("category") for p in MERCHANT_PRODUCTS if p.get("category")))
        return {"categories": cats, "count": len(cats)}

    @function_tool
    async def get_catalog_info(self, ctx: RunContext):
        return {"loaded_catalog_path": str(MERCHANT_CATALOG_PATH.resolve()), "product_count": len(MERCHANT_PRODUCTS)}

    @function_tool
    async def reset_shopping(self, ctx: RunContext, preferred_catalog: Optional[str] = None):
        # Reset in-memory cart; merchant orders persist to disk
        self.cart = []
        # Try to reload merchant catalog to pick up new catalog files
        try:
            if preferred_catalog:
                merchant_reload_catalog(preferred_catalog)
            else:
                # preferred: try ecommerce in shared data first, otherwise reload current CATALOG_PATH
                merchant_reload_catalog()
        except Exception:
            pass
        return {"status": "ok"}

    @function_tool
    async def resolve_product_reference(self, ctx: RunContext, reference: str, filters: Optional[Dict] = None):
        """Resolve textual references like 'the second hoodie' or 'blue hoodie' into a product id and details."""
        if not reference:
            return {"status": "error", "message": "No reference provided."}
        ref = reference.lower()
        # ordinal words mapping
        ord_map = {
            'first': 1,
            'second': 2,
            'third': 3,
            'fourth': 4,
            'fifth': 5,
        }
        # check for numeric ordinal e.g., '2nd', '3rd'
        import re
        match = re.search(r'(\d+)(?:st|nd|rd|th)?', ref)
        idx = None
        if match:
            try:
                idx = int(match.group(1))
            except Exception:
                idx = None
        else:
            for word, num in ord_map.items():
                if word in ref:
                    idx = num
                    break

        # remove ordinal words and 'the' to produce name filter
        cleaned = re.sub(r'\b(the|a|an|first|second|third|fourth|fifth)\b', '', ref).strip()
        name_filter = cleaned or None

        # Use filters + name to list candidates
        filters = filters or {}
        if name_filter:
            filters = dict(filters)
            filters['name'] = name_filter
        prods = merchant_list_products(filters)
        if not prods:
            return {"status": "error", "message": "No matching products."}
        if idx is not None:
            if idx <= 0 or idx > len(prods):
                return {"status": "error", "message": f"Reference index {idx} out of range: {len(prods)} products available."}
            p = prods[idx - 1]
            return {"status": "ok", "product": p}
        # otherwise return first match
        p = prods[0]
        return {"status": "ok", "product": p}


# Backward-compatible alias for tests and imports expecting `Assistant`
Assistant = ShoppingAssistant


def prewarm(proc: JobProcess):
    # No heavy prewarm needed here; placeholder
    return


async def entrypoint(ctx: JobContext):
    ctx.log_context_fields = {"room": ctx.room.name}

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
        vad=None,
        preemptive_generation=True,
    )

    usage_collector = metrics.UsageCollector()

    @session.on("metrics_collected")
    def _on_metrics_collected(ev: MetricsCollectedEvent):
        metrics.log_metrics(ev.metrics)
        usage_collector.collect(ev.metrics)

    async def log_usage():
        logger.info(f"Usage: {usage_collector.get_summary()}")

    ctx.add_shutdown_callback(log_usage)

    # Start session — LLM will call the @function_tool functions as needed
    # Provide backward-compatible alias 'Assistant' for the real class name
    Assistant = ShoppingAssistant
    await session.start(agent=ShoppingAssistant(), room=ctx.room, room_input_options=RoomInputOptions(
        noise_cancellation=noise_cancellation.BVC()
    ))

    await ctx.connect()


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm)) 
