# backend/src/conversation/engine.py
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import yaml
from groq import Groq
from config import GROQ_API_KEY, LLM_MODEL, PROMPTS_DIR, PROMPT_VERSION


client = Groq(api_key=GROQ_API_KEY)


def load_prompt(name: str) -> dict:
    path = os.path.join(PROMPTS_DIR, PROMPT_VERSION, f"{name}.yaml")
    with open(path, "r") as f:
        return yaml.safe_load(f)


def format_history(messages: list[dict]) -> str:
    """
    Formats conversation history into readable string.
    messages = [{"role": "user"/"assistant", "content": "..."}]
    """
    if not messages:
        return "No previous conversation."

    formatted = []
    for m in messages:
        role = "User" if m["role"] == "user" else "CareVoice"
        formatted.append(f"{role}: {m['content']}")
    return "\n".join(formatted)


def generate_response(message: str, history: list[dict]) -> str:
    """
    Core conversation engine.
    Takes user message + conversation history.
    Returns CareVoice response.
    """
    prompt  = load_prompt("therapist")
    history_str = format_history(history)

    system_prompt = prompt["system"]
    user_prompt   = prompt["user"].format(
        history=history_str,
        message=message
    )

    response = client.chat.completions.create(
        model=LLM_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt}
        ],
        temperature=0.7,   # slightly creative, but not wild
        max_tokens=300     # keep responses concise
    )

    return response.choices[0].message.content


if __name__ == "__main__":
    # Test the engine
    history = []

    test_messages = [
        "I've been feeling really anxious lately and I don't know why",
        "It gets worse at night, I can't sleep",
        "I feel like nobody understands me"
    ]

    for msg in test_messages:
        print(f"\nUser: {msg}")
        response = generate_response(msg, history)
        print(f"CareVoice: {response}")

        # Add to history
        history.append({"role": "user",      "content": msg})
        history.append({"role": "assistant", "content": response})