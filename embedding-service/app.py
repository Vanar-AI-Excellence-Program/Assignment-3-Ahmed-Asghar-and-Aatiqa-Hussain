from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import requests
import uvicorn

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not set")

# Gemini embedding endpoint
GEMINI_EMBED_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent"
)

TARGET_DIM = int(os.getenv("EMBEDDING_TARGET_DIM", "3072"))

app = FastAPI(title="ShieldAuth Embedding Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EmbedRequest(BaseModel):
    text: str


class EmbedResponse(BaseModel):
    embedding: list[float]
    dim: int


def _pad_or_trim(values: list[float], dim: int) -> list[float]:
    if len(values) == dim:
        return values
    if len(values) > dim:
        return values[:dim]
    # pad with zeros
    return values + [0.0] * (dim - len(values))


@app.get("/health")
def health():
    return {"status": "ok", "target_dim": TARGET_DIM}


@app.post("/embed", response_model=EmbedResponse)
def embed(body: EmbedRequest):
    try:
        payload = {
            "model": "models/gemini-embedding-001",
            "content": {"parts": [{"text": body.text[:10000]}]},
        }
        headers = {"x-goog-api-key": GEMINI_API_KEY, "Content-Type": "application/json"}
        r = requests.post(GEMINI_EMBED_URL, headers=headers, json=payload, timeout=30)
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail=r.text)
        data = r.json()
        values = data.get("embedding", {}).get("values")
        if not isinstance(values, list):
            raise HTTPException(status_code=500, detail="Invalid embedding response")
        adjusted = _pad_or_trim(values, TARGET_DIM)
        return {"embedding": adjusted, "dim": len(values)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)


