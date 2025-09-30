#!/usr/bin/env python3
"""
Test script for the embedding service
"""
import requests
import json

def test_embedding_service():
    base_url = "http://localhost:8000"
    
    # Test health endpoint
    print("Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            health_data = response.json()
            print(f"Health check passed: {health_data}")
        else:
            print(f"Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"Health check error: {e}")
        return False
    
    # Test embedding endpoint
    print("\nTesting embedding endpoint...")
    try:
        test_text = "This is a test document for embedding generation."
        payload = {"text": test_text}
        
        response = requests.post(
            f"{base_url}/embed",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            embedding_data = response.json()
            embedding = embedding_data.get("embedding", [])
            dim = embedding_data.get("dim", 0)
            
            print(f"Embedding generated successfully!")
            print(f"   - Text: {test_text}")
            print(f"   - Embedding dimension: {dim}")
            print(f"   - Embedding length: {len(embedding)}")
            print(f"   - First 5 values: {embedding[:5]}")
            
            return True
        else:
            print(f"Embedding failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"Embedding error: {e}")
        return False

if __name__ == "__main__":
    print("Testing Embedding Service with Context7 Integration")
    print("=" * 60)
    
    success = test_embedding_service()
    
    print("\n" + "=" * 60)
    if success:
        print("All tests passed! Embedding service is working correctly.")
    else:
        print("Tests failed. Check the embedding service logs.")
