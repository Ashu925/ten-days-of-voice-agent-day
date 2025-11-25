#!/usr/bin/env python3
"""Simple CLI harness for the Assistant agent.

Runs a REPL over stdin to simulate user speech/text turns. The assistant will ask
clarifying questions until all required fields are provided, then save the order
to a timestamped JSON file and print the saved path.

Usage (from `backend` directory with the virtualenv activated):
    .venv\Scripts\python.exe src\run_assistant.py
"""
import sys
from pathlib import Path

from agent import Assistant


def main() -> int:
    a = Assistant()

    print("Assistant CLI — tell the assistant an order. Type 'exit' to quit.")
    print("You can say e.g. 'I'd like a large oat milk latte with vanilla for Alice'\n")

    try:
        while True:
            # If the assistant already has a complete order (e.g., resumed state), stop
            if a.is_complete():
                path = a.save_order_to_file()
                print(f"Order already complete; saved to: {path}")
                break

            user = input("You: ").strip()
            if not user:
                continue
            if user.lower() in ("exit", "quit"):
                print("Exiting without saving incomplete order.")
                return 0

            resp = a.process_user_turn(user)
            print(f"Assistant: {resp}")

            # If after processing the assistant is complete, save and exit loop
            if a.is_complete():
                path = a.save_order_to_file()
                print(f"Order complete and saved to: {path}")
                print(f"Summary: {a.order_summary()}")
                break

    except (KeyboardInterrupt, EOFError):
        print("\nInterrupted — exiting.")
        return 0

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
