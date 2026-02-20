"""
Embedding Service using sentence-transformers
Uses all-MiniLM-L6-v2 model for text embeddings
"""
import numpy as np
from sentence_transformers import SentenceTransformer
from typing import List


class EmbeddingService:
    def __init__(self):
        print("Loading sentence-transformers model: all-MiniLM-L6-v2...")
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.embedding_dim = 384
        print(f"✅ Embedding service initialized (dimension: {self.embedding_dim})")

    def encode(self, texts: List[str]) -> np.ndarray:
        """
        Generate embeddings for a list of texts
        
        Args:
            texts: List of text strings to embed
            
        Returns:
            numpy array of embeddings (num_texts x 384)
        """
        if not texts:
            return np.array([])
        
        embeddings = self.model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
        return embeddings

    def encode_single(self, text: str) -> np.ndarray:
        """
        Generate embedding for a single text
        
        Args:
            text: Text string to embed
            
        Returns:
            numpy array of embedding (384,)
        """
        embedding = self.model.encode([text], convert_to_numpy=True)[0]
        return embedding


# Global instance
embedding_service = EmbeddingService()
