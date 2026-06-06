# backend/src/safety/crisis.py
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from config import CRISIS_KEYWORDS, CRISIS_RESOURCES


def detect_crisis(message: str) -> dict:
    """
    Scans message for crisis signals.
    Returns: {is_crisis, severity, resources}
    """
    message_lower = message.lower()

    # Check for crisis keywords
    triggered = [kw for kw in CRISIS_KEYWORDS if kw in message_lower]

    if not triggered:
        return {
            "is_crisis": False,
            "severity":  "none",
            "resources": None,
            "triggered": []
        }

    # Determine severity
    high_severity = ["suicide", "kill myself", "end my life", "want to die",
                     "better off dead", "मरना चाहता हूं", "जीना नहीं चाहता"]

    is_high = any(kw in message_lower for kw in high_severity)
    severity = "high" if is_high else "medium"

    return {
        "is_crisis": True,
        "severity":  severity,
        "resources": CRISIS_RESOURCES,
        "triggered": triggered
    }


def build_crisis_response(crisis: dict) -> str:
    """
    Builds a safe, warm crisis response with helpline numbers.
    """
    if crisis["severity"] == "high":
        return (
            "I'm really glad you're talking to me right now, and I want you to know "
            "that what you're feeling matters deeply. You don't have to face this alone.\n\n"
            "Please reach out to a crisis helpline right now — they're available 24/7 "
            "and are trained to help:\n\n"
            f"🇮🇳 India: {crisis['resources']['india']}\n"
            f"🌍 Global: {crisis['resources']['global']}\n\n"
            "I'm still here with you. Can you tell me — are you safe right now?"
        )
    else:
        return (
            "It sounds like you're going through something really difficult, "
            "and I want you to know I'm here with you.\n\n"
            "If things ever feel too overwhelming, please know that support is available:\n\n"
            f"🇮🇳 India: {crisis['resources']['india']}\n"
            f"🌍 Global: {crisis['resources']['global']}\n\n"
            "Would you like to talk more about what's been weighing on you?"
        )


if __name__ == "__main__":
    test_messages = [
        "I've been feeling anxious lately",
        "I don't know how to go on anymore",
        "I want to kill myself",
        "I've been having thoughts of self harm"
    ]

    for msg in test_messages:
        print(f"\nMessage: {msg}")
        crisis = detect_crisis(msg)
        print(f"Crisis: {crisis['is_crisis']} | Severity: {crisis['severity']}")
        if crisis["is_crisis"]:
            print(f"Response:\n{build_crisis_response(crisis)}")