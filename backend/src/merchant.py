# src/merchant.py
import json
import os
import uuid
from datetime import datetime
from pathlib import Path
import logging
from typing import List, Dict, Optional

BASE = Path(__file__).parent
# Prefer a PREFERRED_CATALOG env var, or shared-data ecommerce catalog, else fallback to src/catalog.json
preferred = os.environ.get("PREFERRED_CATALOG") if "PREFERRED_CATALOG" in os.environ else None
ecom_path = BASE.parent / "shared-data" / "ecommerce_catalog.json"
default_src_catalog = BASE / "catalog.json"
if preferred:
    p = Path(preferred)
    if not p.is_absolute():
        p = (BASE / preferred).resolve()
    CATALOG_PATH = p if p.exists() else default_src_catalog
elif ecom_path.exists():
    CATALOG_PATH = ecom_path
else:
    CATALOG_PATH = default_src_catalog
ORDERS_PATH = BASE.parent / "data" / "orders.json"

# Ensure data folder and orders.json exist
ORDERS_PATH.parent.mkdir(parents=True, exist_ok=True)
if not ORDERS_PATH.exists():
    ORDERS_PATH.write_text("[]", encoding="utf-8")

logger = logging.getLogger('merchant')
logger.info(f"Loading catalog from {CATALOG_PATH}")
try:
    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
        # If the file contains an object with items (ecommerce_catalog.json style), use its items
        if isinstance(data, dict) and 'items' in data:
            PRODUCTS: List[Dict] = data['items']
        else:
            PRODUCTS: List[Dict] = data
except Exception as e:
    logger.error(f"Failed to load catalog from {CATALOG_PATH}: {e}")
    PRODUCTS = []


def _load_orders() -> List[Dict]:
    with open(ORDERS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def _save_orders(orders: List[Dict]) -> None:
    with open(ORDERS_PATH, "w", encoding="utf-8") as f:
        json.dump(orders, f, indent=2, ensure_ascii=False)


def reload_catalog(path: Optional[Path] = None) -> None:
    """Reload the merchant PRODUCTS global from the provided Path or CATALOG_PATH.
    This allows the catalog to be changed at runtime (e.g., switching to ecommerce catalog)."""
    global CATALOG_PATH, PRODUCTS
    if path:
        CATALOG_PATH = Path(path)
    logger.info(f"Reloading catalog from {CATALOG_PATH}")
    try:
        with open(CATALOG_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, dict) and 'items' in data:
                PRODUCTS = data['items']
            else:
                PRODUCTS = data
    except Exception as e:
        logger.error(f"Failed to reload catalog from {CATALOG_PATH}: {e}")


def list_products(filters: Optional[Dict] = None) -> List[Dict]:
    """
    Return products filtered by optional filters:
      filters: { "category": str, "color": str, "max_price": int, "size": str }
    All filters optional.
    """
    results = PRODUCTS
    if not filters:
        return results

    cat = filters.get("category")
    color = filters.get("color")
    max_price = filters.get("max_price")
    size = filters.get("size")

    if cat:
        results = [p for p in results if p.get("category", "").lower() == str(cat).lower() or str(cat).lower() in " ".join([t.lower() for t in p.get('tags', [])])]
    if color:
        results = [p for p in results if p.get("color", "").lower() == str(color).lower()]
    if size:
        results = [p for p in results if p.get("size", "").lower() == str(size).lower()]
    # name substring matching: e.g., 'hoodie' or 'hoodies' should match
    name = filters.get('name') if filters else None
    if name:
        n = str(name).lower()
        singular = n[:-1] if n.endswith('s') and len(n) > 2 else n
        results = [p for p in results if (n in p.get('name', '').lower()) or (singular in p.get('name', '').lower()) or n in [t.lower() for t in p.get('tags', [])]]
    if max_price is not None:
        try:
            maxp = int(max_price)
            results = [p for p in results if int(p.get("price", 0)) <= maxp]
        except (ValueError, TypeError):
            pass
    if 'min_price' in (filters or {}):
        try:
            minp = int(filters.get('min_price'))
            results = [p for p in results if int(p.get('price', 0)) >= minp]
        except (ValueError, TypeError):
            pass

    return results


def _base_name(name: str) -> str:
    """Derive a base product name by removing trailing parentheses and normalizing."""
    import re
    # strip parentheses content like 'Everyday Hoodie (Blue)'
    base = re.sub(r"\s*\([^)]*\)\s*$", "", name or "").strip()
    return base


def group_products_by_base() -> Dict[str, List[Dict]]:
    groups: Dict[str, List[Dict]] = {}
    for p in PRODUCTS:
        name = p.get('name') or ''
        base = _base_name(name)
        if base not in groups:
            groups[base] = []
        groups[base].append(p)
    return groups


def get_variants_for_group(base_name: str) -> List[Dict]:
    groups = group_products_by_base()
    return groups.get(base_name, [])


def find_group_for_product(product_id: str) -> Optional[str]:
    prod = next((p for p in PRODUCTS if p.get('id') == product_id), None)
    if not prod:
        return None
    return _base_name(prod.get('name', ''))


def create_order(line_items: List[Dict]) -> Dict:
    """
    line_items: [{"product_id": "...", "quantity": 1}, ...]
    Persists order to data/orders.json and returns created order.
    """
    orders = _load_orders()
    items = []
    total = 0
    currency = "INR"

    for li in line_items:
        pid = li.get("product_id")
        qty = int(li.get("quantity", 1))
        prod = next((p for p in PRODUCTS if p["id"] == pid), None)
        if not prod:
            continue
        unit_price = int(prod.get("price", 0))
        # Prefer product currency if present
        if prod.get("currency"):
            currency = prod.get("currency")
        items.append({
            "product_id": prod["id"],
            "name": prod["name"],
            "quantity": qty,
            "unit_price": unit_price
        })
        total += unit_price * qty

    order = {
        "id": f"ORD{datetime.now().strftime('%Y%m%d%H%M%S')}{str(uuid.uuid4())[:4]}",
        "items": items,
        "total": total,
        "currency": currency,
        "created_at": datetime.now().isoformat()
    }

    orders.append(order)
    _save_orders(orders)
    return order


def last_order() -> Optional[Dict]:
    orders = _load_orders()
    return orders[-1] if orders else None


def remove_item_from_order(order_id: str, product_id: str) -> Optional[Dict]:
    orders = _load_orders()
    order = next((o for o in orders if o.get("id") == order_id), None)
    if not order:
        return None
    order["items"] = [i for i in order["items"] if i["product_id"] != product_id]
    order["total"] = sum(i["quantity"] * i["unit_price"] for i in order["items"])
    _save_orders(orders)
    return order