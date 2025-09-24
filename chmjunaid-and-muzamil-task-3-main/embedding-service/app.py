from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import uvicorn
import requests
import json
import fitz  # PyMuPDF
import tiktoken
from typing import List
import tempfile
import asyncio

# Load environment variables
load_dotenv()

app = FastAPI(title="Embedding Service", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is required")

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent"

# Configuration constants
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
CHUNK_SIZE = 800  # tokens per chunk
CHUNK_OVERLAP = 100  # token overlap between chunks
ALLOWED_EXTENSIONS = {".txt", ".pdf"}

# Initialize tokenizer for chunking
try:
    tokenizer = tiktoken.encoding_for_model("gpt-3.5-turbo")
except:
    tokenizer = tiktoken.get_encoding("cl100k_base")

# Pydantic models
class EmbeddingRequest(BaseModel):
    text: str

class EmbeddingResponse(BaseModel):
    embedding: list[float]
    dim: int

class ChunkEmbedding(BaseModel):
    chunk_index: int
    text: str
    embedding: list[float]
    token_count: int

class UploadResponse(BaseModel):
    filename: str
    file_type: str
    total_chunks: int
    total_tokens: int
    embeddings: List[ChunkEmbedding]

# Utility functions
def count_tokens(text: str) -> int:
    """Count tokens in text using tiktoken."""
    return len(tokenizer.encode(text))

def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    """
    Split text into overlapping chunks based on token count.
    
    Args:
        text: Input text to chunk
        chunk_size: Maximum tokens per chunk
        overlap: Number of overlapping tokens between chunks
    
    Returns:
        List of text chunks
    """
    if not text.strip():
        return []
    
    # Encode the entire text
    tokens = tokenizer.encode(text)
    
    if len(tokens) <= chunk_size:
        return [text]
    
    chunks = []
    start = 0
    
    while start < len(tokens):
        # Get chunk tokens
        end = min(start + chunk_size, len(tokens))
        chunk_tokens = tokens[start:end]
        
        # Decode back to text
        chunk_text = tokenizer.decode(chunk_tokens)
        chunks.append(chunk_text)
        
        # Move start position with overlap
        start = end - overlap
        
        # Prevent infinite loop
        if start >= end:
            break
    
    return chunks

def extract_text_from_pdf(file_content: bytes) -> str:
    """
    Extract text from PDF using PyMuPDF.
    
    Args:
        file_content: PDF file content as bytes
    
    Returns:
        Extracted text from all pages
    """
    try:
        # Create a temporary file
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as temp_file:
            temp_file.write(file_content)
            temp_file_path = temp_file.name
        
        try:
            # Open PDF with PyMuPDF
            doc = fitz.open(temp_file_path)
            text_content = ""
            
            # Extract text from each page
            for page_num in range(doc.page_count):
                page = doc[page_num]
                page_text = page.get_text()
                text_content += f"\n--- Page {page_num + 1} ---\n{page_text}"
            
            doc.close()
            return text_content.strip()
        
        finally:
            # Clean up temporary file
            os.unlink(temp_file_path)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF extraction failed: {str(e)}")

async def create_embedding_for_text(text: str) -> List[float]:
    """
    Create embedding for a single text chunk using the existing logic.
    
    Args:
        text: Text to embed
    
    Returns:
        Embedding vector
    """
    try:
        # Prepare the request payload for Gemini Embeddings API
        payload = {
            "model": "models/gemini-embedding-001",
            "content": {
                "parts": [{
                    "text": text
                }]
            }
        }
        
        # Make the API call to Gemini
        headers = {
            "x-goog-api-key": GEMINI_API_KEY,
            "Content-Type": "application/json"
        }
        
        response = requests.post(GEMINI_API_URL, headers=headers, json=payload)
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code, 
                detail=f"Gemini API error: {response.text}"
            )
        
        # Parse the response
        response_data = response.json()
        
        # Extract the embedding from the response
        if "embedding" in response_data and "values" in response_data["embedding"]:
            return response_data["embedding"]["values"]
        else:
            raise HTTPException(
                status_code=500, 
                detail="Invalid response format from Gemini API"
            )
            
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Network error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {str(e)}")

# API Endpoints
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "embedding-service"}

@app.post("/embed", response_model=EmbeddingResponse)
async def create_embedding(request: EmbeddingRequest):
    try:
        # Prepare the request payload for Gemini Embeddings API
        payload = {
            "model": "models/gemini-embedding-001",
            "content": {
                "parts": [{
                    "text": request.text
                }]
            }
        }
        
        # Make the API call to Gemini
        headers = {
            "x-goog-api-key": GEMINI_API_KEY,
            "Content-Type": "application/json"
        }
        
        response = requests.post(GEMINI_API_URL, headers=headers, json=payload)
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code, 
                detail=f"Gemini API error: {response.text}"
            )
        
        # Parse the response
        response_data = response.json()
        
        # Extract the embedding from the response
        if "embedding" in response_data and "values" in response_data["embedding"]:
            embedding = response_data["embedding"]["values"]
        else:
            raise HTTPException(
                status_code=500, 
                detail="Invalid response format from Gemini API"
            )
        
        return EmbeddingResponse(
            embedding=embedding,
            dim=len(embedding)
        )
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Network error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {str(e)}")

@app.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """
    Upload and process .txt or .pdf files to create embeddings.
    
    Args:
        file: Uploaded file (.txt or .pdf)
    
    Returns:
        UploadResponse with filename, chunks, and embeddings
    """
    # Validate file extension
    file_extension = os.path.splitext(file.filename or "")[1].lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"File type '{file_extension}' not supported. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Read file content
    try:
        file_content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")
    
    # Check file size
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413, 
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE / (1024*1024):.1f}MB"
        )
    
    # Extract text based on file type
    try:
        if file_extension == ".txt":
            try:
                text_content = file_content.decode('utf-8')
            except UnicodeDecodeError:
                # Try different encodings
                for encoding in ['latin-1', 'cp1252', 'iso-8859-1']:
                    try:
                        text_content = file_content.decode(encoding)
                        break
                    except UnicodeDecodeError:
                        continue
                else:
                    raise HTTPException(
                        status_code=400, 
                        detail="Unable to decode text file. Please ensure it's in UTF-8 format."
                    )
        
        elif file_extension == ".pdf":
            text_content = extract_text_from_pdf(file_content)
        
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {str(e)}")
    
    # Validate extracted content
    if not text_content.strip():
        raise HTTPException(status_code=400, detail="No text content found in file")
    
    # Chunk the text
    try:
        chunks = chunk_text(text_content)
        if not chunks:
            raise HTTPException(status_code=400, detail="Failed to create text chunks")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text chunking failed: {str(e)}")
    
    # Create embeddings for each chunk
    embeddings = []
    total_tokens = 0
    
    try:
        for i, chunk in enumerate(chunks):
            # Count tokens in this chunk
            token_count = count_tokens(chunk)
            total_tokens += token_count
            
            # Create embedding for this chunk
            embedding = await create_embedding_for_text(chunk)
            
            # Store chunk embedding
            embeddings.append(ChunkEmbedding(
                chunk_index=i,
                text=chunk[:200] + "..." if len(chunk) > 200 else chunk,  # Truncate for response
                embedding=embedding,
                token_count=token_count
            ))
            
            # Small delay to avoid rate limiting
            await asyncio.sleep(0.1)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding creation failed: {str(e)}")
    
    return UploadResponse(
        filename=file.filename or "unknown",
        file_type=file_extension,
        total_chunks=len(chunks),
        total_tokens=total_tokens,
        embeddings=embeddings
    )

@app.post("/test-upload")
async def test_upload(file: UploadFile = File(...)):
    """
    Test endpoint to verify file upload and text extraction.
    Returns filename and first 200 characters of extracted content.
    """
    # Validate file extension
    file_extension = os.path.splitext(file.filename or "")[1].lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"File type '{file_extension}' not supported. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Read file content
    try:
        file_content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")
    
    # Check file size
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413, 
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE / (1024*1024):.1f}MB"
        )
    
    # Extract text based on file type
    try:
        if file_extension == ".txt":
            try:
                text_content = file_content.decode('utf-8')
            except UnicodeDecodeError:
                # Try different encodings
                for encoding in ['latin-1', 'cp1252', 'iso-8859-1']:
                    try:
                        text_content = file_content.decode(encoding)
                        break
                    except UnicodeDecodeError:
                        continue
                else:
                    raise HTTPException(
                        status_code=400, 
                        detail="Unable to decode text file. Please ensure it's in UTF-8 format."
                    )
        
        elif file_extension == ".pdf":
            text_content = extract_text_from_pdf(file_content)
        
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text extraction failed: {str(e)}")
    
    # Return filename and preview of content
    preview = text_content[:200] + "..." if len(text_content) > 200 else text_content
    
    return {
        "filename": file.filename or "unknown",
        "file_type": file_extension,
        "content_length": len(text_content),
        "preview": preview
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)