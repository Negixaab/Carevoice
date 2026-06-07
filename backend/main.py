# backend/main.py
from src.memory.session_store import get_session, save_session
from src.conversation.mood import analyze_mood
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from src.conversation.pipeline import run_pipeline

app = FastAPI(title="CareVoice API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)





class MessageRequest(BaseModel):
    session_id: str
    message:    str


class MessageResponse(BaseModel):
    response:   str
    is_crisis:  bool
    severity:   str
    mood_score:  int
    mood_label:  str


@app.get("/")
def root():
    return {"status": "CareVoice API is running"}


@app.post("/chat", response_model=MessageResponse)
def chat(req: MessageRequest):
    # Load session from Supabase
    session_data = get_session(req.session_id)
    history      = session_data["messages"]
    mood_history = session_data["mood_history"]

    # Run pipeline
    result = run_pipeline(req.message, history)
    mood   = analyze_mood(req.message)

    # Update histories
    updated_mood = mood_history + [{"score": mood["score"], "label": mood["label"]}]

    # Save back to Supabase
    save_session(req.session_id, result["history"], updated_mood)

    return MessageResponse(
        response=result["response"],
        is_crisis=result["is_crisis"],
        severity=result["severity"],
        mood_score=mood["score"],
        mood_label=mood["label"]
    )
@app.delete("/session/{session_id}")
def clear_session(session_id: str):
    if session_id in sessions:
        del sessions[session_id]
    return {"status": "session cleared"}