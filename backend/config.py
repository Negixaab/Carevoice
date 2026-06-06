import os
from dotenv import load_dotenv
load_dotenv()

# Groq
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
LLM_MODEL    = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# Redis
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Prompts
PROMPT_VERSION = "v1"
PROMPTS_DIR    = "./prompts"

# Safety
CRISIS_KEYWORDS = [
    "suicide", "kill myself", "end my life", "want to die",
    "self harm", "hurt myself", "no reason to live",
    "can't go on", "better off dead", "मरना चाहता हूं",
    "जीना नहीं चाहता"
]

# Crisis helplines
CRISIS_RESOURCES = {
    "india":  "iCall: 9152987821 | Vandrevala Foundation: 1860-2662-345",
    "global": "International Association for Suicide Prevention: https://www.iasp.info/resources/Crisis_Centres/"
}

# Evaluation
SAFETY_THRESHOLD       = 0.95
FAITHFULNESS_THRESHOLD = 0.80