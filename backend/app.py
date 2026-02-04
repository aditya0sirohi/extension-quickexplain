import os
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

if not OPENROUTER_API_KEY:
    raise RuntimeError("OPENROUTER_API_KEY not found in .env")

app = FastAPI()

# Enable CORS for browser extension requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Browser extensions can call from any origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Request schema ----
class ExplainRequest(BaseModel):
    text: str
    context: str | None = None


# ---- Core explain endpoint ----
@app.post("/explain")
def explain_text(payload: ExplainRequest):
    prompt = f"""
Explain ONLY the selected text below in simple terms.
Use the context for disambiguation only, not for summarizing unrelated content.

Selected text:
{payload.text}

Context:
{payload.context or "No additional context provided."}

Be concise (1-2 sentences). Explain only what is selected.
"""

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost",
            "X-Title": "QuickExplain Extension",
        },
        json={
            "model": "meta-llama/llama-3-8b-instruct",
            "messages": [
                {"role": "system", "content": "You are a helpful explainer."},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.3,
        },
        timeout=20,
    )

    data = response.json()

    # Log raw response for debugging (temporary)
    print("[Backend] OpenRouter raw response:", data)

    # Defensive checks: handle missing or malformed responses
    if "choices" not in data or not data["choices"]:
        print("[Backend] WARNING: OpenRouter returned no choices. Response:", data)
        return {
            "explanation": "⚠️ The AI could not generate an explanation right now. Please try again."
        }

    message = data["choices"][0].get("message", {})
    content = message.get("content")

    if not content:
        print("[Backend] WARNING: OpenRouter message has no content. Message:", message)
        return {
            "explanation": "⚠️ No explanation was returned by the model."
        }

    return {"explanation": content.strip()}
