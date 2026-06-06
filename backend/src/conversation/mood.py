# backend/src/conversation/mood.py
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from groq import Groq
from config import GROQ_API_KEY, LLM_MODEL

client = Groq(api_key=GROQ_API_KEY)


def analyze_mood(message: str) -> dict:
    """
    Silently analyzes user message and returns mood score.
    Score 1-10: 1=very distressed, 5=neutral, 10=very positive
    """
    prompt = f"""Analyze the emotional tone of this message and return ONLY a JSON object.

Message: "{message}"

Return ONLY this JSON, nothing else:
{{"score": <number 1-10>, "label": "<one word: distressed/anxious/sad/neutral/calm/hopeful/positive>", "reason": "<5 words max>"}}"""

    response = client.chat.completions.create(
        model=LLM_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
        max_tokens=60
    )

    import json
    try:
        raw   = response.choices[0].message.content.strip()
        clean = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(clean)
    except Exception:
        return {"score": 5, "label": "neutral", "reason": "parse error"}


if __name__ == "__main__":
    test_messages = [
        "I feel great today!",
        "I've been really anxious lately",
        "I don't see any point anymore",
        "Things are slowly getting better"
    ]
    for msg in test_messages:
        result = analyze_mood(msg)
        print(f"Message: {msg}")
        print(f"Mood: {result}\n")