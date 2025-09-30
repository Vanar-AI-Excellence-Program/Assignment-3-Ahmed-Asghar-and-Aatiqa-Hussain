from fastapi import FastAPI, HTTPException  
from fastapi.middleware.cors import CORSMiddleware  
from pydantic import BaseModel 
import os
import requests 
import uvicorn  
from sentence_transformers import SentenceTransformer 
import numpy as np

# Use sentence-transformers for better performance and reliability
MODEL_NAME = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
TARGET_DIM = int(os.getenv("EMBEDDING_TARGET_DIM", "384"))  # Default for all-MiniLM-L6-v2

# Initialize the model
try:
    model = SentenceTransformer(MODEL_NAME)
    print(f"✅ Loaded embedding model: {MODEL_NAME}")
except Exception as e:
    print(f"❌ Failed to load model {MODEL_NAME}: {e}")
    # Fallback to a smaller, more reliable model
    MODEL_NAME = "all-MiniLM-L6-v2"
    model = SentenceTransformer(MODEL_NAME)
    print(f"✅ Loaded fallback model: {MODEL_NAME}")

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
    return {
        "status": "ok", 
        "model": MODEL_NAME,
        "target_dim": TARGET_DIM,
        "model_dim": model.get_sentence_embedding_dimension()
    }


@app.post("/embed", response_model=EmbedResponse)
def embed(body: EmbedRequest):
    try:
        # Truncate text to prevent memory issues
        text = body.text[:8000]  # Reasonable limit for sentence-transformers
        
        # Generate embedding using sentence-transformers
        embedding = model.encode(text, convert_to_tensor=False)
        
        # Convert to list and ensure proper dimensions
        embedding_list = embedding.tolist() if hasattr(embedding, 'tolist') else list(embedding)
        
        # Pad or trim to target dimension
        adjusted = _pad_or_trim(embedding_list, TARGET_DIM)
        
        return {"embedding": adjusted, "dim": len(embedding_list)}
        
    except Exception as e:
        print(f"❌ Embedding error: {e}")
        raise HTTPException(status_code=500, detail=f"Embedding failed: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)


