# backend/src/memory/session_store.py
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

import json
from supabase import create_client
from config import SUPABASE_URL, SUPABASE_KEY

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_session(session_id: str) -> dict:
    """
    Fetches session from Supabase.
    Returns {messages, mood_history} or empty defaults.
    """
    try:
        result = supabase.table("sessions")\
            .select("*")\
            .eq("session_id", session_id)\
            .execute()

        if result.data:
            row = result.data[0]
            return {
                "messages":     row["messages"],
                "mood_history": row["mood_history"]
            }
    except Exception as e:
        print(f"Error fetching session: {e}")

    return {"messages": [], "mood_history": []}


def save_session(session_id: str, messages: list, mood_history: list):
    """
    Upserts session to Supabase.
    """
    try:
        existing = supabase.table("sessions")\
            .select("id")\
            .eq("session_id", session_id)\
            .execute()

        if existing.data:
            supabase.table("sessions").update({
                "messages":     messages,
                "mood_history": mood_history,
                "updated_at":   "now()"
            }).eq("session_id", session_id).execute()
        else:
            supabase.table("sessions").insert({
                "session_id":   session_id,
                "messages":     messages,
                "mood_history": mood_history
            }).execute()

    except Exception as e:
        print(f"Error saving session: {e}")


if __name__ == "__main__":
    # Test it
    save_session("test_session", [
        {"role": "user", "content": "I feel anxious"},
        {"role": "assistant", "content": "I'm here for you"}
    ], [{"score": 3, "label": "anxious"}])

    result = get_session("test_session")
    print("Retrieved:", result)