"""
Clustering Service using HDBSCAN
Groups similar posts based on their embeddings
"""
import numpy as np
from typing import List, Dict, Tuple
import re


class ClusteringService:
    def __init__(self):
        try:
            import hdbscan
            self.hdbscan_available = True
            self.clusterer = hdbscan.HDBSCAN(
                min_cluster_size=3,
                min_samples=2,
                metric='euclidean',
                cluster_selection_method='eom'
            )
        except ImportError:
            print("HDBSCAN not available, using sklearn DBSCAN instead")
            self.hdbscan_available = False
            from sklearn.cluster import DBSCAN
            self.clusterer = DBSCAN(eps=0.5, min_samples=2)
        
        # Track previous cluster sizes for growth rate calculation
        self.previous_sizes: Dict[str, int] = {}
        print("✅ Clustering service initialized")

    def cluster(self, embeddings: np.ndarray) -> Tuple[np.ndarray, int]:
        """
        Cluster embeddings using HDBSCAN/DBSCAN
        
        Args:
            embeddings: numpy array of shape (n_samples, n_features)
            
        Returns:
            Tuple of (cluster_labels, n_clusters)
        """
        if len(embeddings) < 3:
            # Not enough samples for clustering
            return np.zeros(len(embeddings), dtype=int), 0
        
        try:
            labels = self.clusterer.fit_predict(embeddings)
            n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
            return labels, n_clusters
        except Exception as e:
            print(f"Clustering error: {e}")
            return np.zeros(len(embeddings), dtype=int), 0

    def get_cluster_info(self, labels: np.ndarray, texts: List[str], sentiments: List[float]) -> List[Dict]:
        """
        Get information about each cluster
        
        Args:
            labels: Cluster labels for each text
            texts: Original texts
            sentiments: Sentiment scores for each text
            
        Returns:
            List of cluster information dictionaries
        """
        unique_labels = set(labels)
        clusters = []
        
        for label in unique_labels:
            if label == -1:  # Noise points
                continue
            
            # Get indices for this cluster
            indices = np.where(labels == label)[0]
            
            # Get texts in this cluster
            cluster_texts = [texts[i] for i in indices]
            
            # Calculate average sentiment
            cluster_sentiments = [sentiments[i] for i in indices]
            avg_sentiment = np.mean(cluster_sentiments)
            
            # Extract keywords (simple approach)
            keywords = self._extract_keywords(cluster_texts)
            
            # Calculate size
            size = len(indices)
            
            # Calculate growth rate (compared to previous)
            cluster_id = f"cluster-{label}"
            prev_size = self.previous_sizes.get(cluster_id, 0)
            growth_rate = ((size - prev_size) / max(prev_size, 1)) * 100
            
            # Calculate volatility (variance in sentiments)
            volatility = np.std(cluster_sentiments)
            
            # Update previous size
            self.previous_sizes[cluster_id] = size
            
            clusters.append({
                "clusterId": cluster_id,
                "keywords": keywords,
                "size": size,
                "avgSentiment": float(avg_sentiment),
                "growthRate": float(growth_rate),
                "volatilityIndex": float(volatility)
            })
        
        return clusters

    def _extract_keywords(self, texts: List[str]) -> List[str]:
        """
        Extract common keywords from cluster texts
        
        Args:
            texts: List of texts in the cluster
            
        Returns:
            List of extracted keywords
        """
        # Simple keyword extraction
        word_freq: Dict[str, int] = {}
        
        for text in texts:
            # Simple tokenization
            words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
            for word in words:
                # Filter common stop words
                if word not in ['this', 'that', 'with', 'from', 'have', 'been', 'will', 'just', 'about']:
                    word_freq[word] = word_freq.get(word, 0) + 1
        
        # Get top keywords
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        return [word for word, _ in sorted_words[:5]]


# Global instance
clustering_service = ClusteringService()
