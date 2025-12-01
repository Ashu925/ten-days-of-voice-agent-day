from merchant import list_products, create_order, last_order, remove_item_from_order
import json

print("=== Search: black hoodies under 1500 ===")
prods = list_products({"category": "hoodie", "color": "black", "max_price": 1500})
print(json.dumps(prods, indent=2))

if prods:
    p = prods[0]
    print(f"\n=== Creating order for {p['id']} ===")
    order = create_order([{"product_id": p["id"], "quantity": 1}])
    print(json.dumps(order, indent=2))

    print("\n=== Last order now ===")
    print(json.dumps(last_order(), indent=2))

    print("\n=== Removing item from order ===")
    updated = remove_item_from_order(order["id"], p["id"])
    print(json.dumps(updated, indent=2))
else:
    print("No products found")