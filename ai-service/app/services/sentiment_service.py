"""
Sentiment Analysis Service
Uses distilbert-base-uncased-finetuned-sst-2-english for sentiment analysis
Returns polarity score between -1 and 1
"""
import numpy as np
from transformers import pipeline
from typing import List


class SentimentService:
    def __init__(self):
        print("Loading sentiment analysis model: distilbert-base-uncased-finetuned-sst-2-english...")
        self.classifier = pipeline(
            "sentiment-analysis",
            model="distilbert-base-uncased-finetuned-sst-2-english",
            device=-1  # CPU
        )
        print("✅ Sentiment service initialized")

    def analyze(self, texts: List[str]) -> List[float]:
        """
        Analyze sentiment for a list of texts
        
        Args:
            texts: List of text strings to analyze
            
        Returns:
            List of polarity scores between -1 (negative) and 1 (positive)
        """
        if not texts:
            return []
        
        # Truncate texts to 512 tokens (model max)
        truncated_texts = [text[:512] for text in texts]
        
        results = self.classifier(truncated_texts)
        
        # Convert to polarity scores (-1 to 1)
        polarity_scores = []
        for result in results:
            # POSITIVE -> positive polarity, NEGATIVE -> negative polarity
            score = result['score']
            if result['label'] == 'NEGATIVE':
                polarity_scores.append(-score)
            else:
                polarity_scores.append(score)
        
        return polarity_scores

    def analyze_single(self, text: str) -> float:
        """
        Analyze sentiment for a single text
        
        Args:
            text: Text string to analyze
            
        Returns:
            Polarity score between -1 (negative) and 1 (positive)
        """
        truncated = text[:512]
        result = self.classifier([truncated])[0]
        
        if result['label'] == 'NEGATIVE':
            return -result['score']
        else:
            return result['score']


# Global instance
sentiment_service = SentimentService()
