# backend/src/conversation/pipeline.py
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from src.conversation.engine import generate_response
from src.safety.crisis import detect_crisis, build_crisis_response


def run_pipeline(message: str, history: list[dict]) -> dict:
    """
    Full CareVoice pipeline:
    1. Check for crisis signals first
    2. If crisis → return crisis response immediately
    3. If safe → generate therapeutic response
    
    Returns: {response, is_crisis, severity, history}
    """

    # Step 1 — Crisis detection (always first)
    crisis = detect_crisis(message)

    if crisis["is_crisis"]:
        response = build_crisis_response(crisis)
        history.append({"role": "user",      "content": message})
        history.append({"role": "assistant", "content": response})
        return {
            "response":  response,
            "is_crisis": True,
            "severity":  crisis["severity"],
            "history":   history
        }

    # Step 2 — Normal therapeutic response
    response = generate_response(message, history)
    history.append({"role": "user",      "content": message})
    history.append({"role": "assistant", "content": response})

    return {
        "response":  response,
        "is_crisis": False,
        "severity":  "none",
        "history":   history
    }


if __name__ == "__main__":
    print("CareVoice Pipeline Test")
    print("="*40)

    history = []
    test_messages = [
        "I've been feeling really low lately",
        "I can't sleep and nothing feels meaningful",
        "I want to kill myself",           # crisis test
        "I'm still here, just scared"      # recovery after crisis
    ]

    for msg in test_messages:
        print(f"\nUser: {msg}")
        result = run_pipeline(msg, history)
        history = result["history"]
        print(f"CareVoice: {result['response']}")
        if result["is_crisis"]:
            print(f"⚠️  CRISIS DETECTED — Severity: {result['severity']}")