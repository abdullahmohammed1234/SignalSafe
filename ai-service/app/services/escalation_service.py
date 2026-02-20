"""
Escalation Service
Computes composite risk metrics for panic/escalation detection
"""
import numpy as np
from typing import List, Dict
from collections import deque


class EscalationService:
    def __init__(self):
        self.sentiment_history = deque(maxlen=20)
        self.volume_history = deque(maxlen=20)
        print("✅ Escalation service initialized")

    def compute_sentiment_acceleration(self, sentiments: List[float]) -> float:
        """
        Compute sentiment acceleration (rate of change towards negative)
        
        Args:
            sentiments: List of sentiment scores
            
        Returns:
            Acceleration score (0-100)
        """
        if len(sentiments) < 2:
            return 0.0
        
        # Add to history
        self.sentiment_history.extend(sentiments)
        
        # Calculate recent average sentiment
        recent_avg = np.mean(list(self.sentiment_history)[-10:])
        
        # Calculate acceleration (second derivative approximation)
        if len(self.sentiment_history) >= 5:
            first_derivative = []
            for i in range(1, min(5, len(self.sentiment_history))):
                first_derivative.append(
                    self.sentiment_history[-i] - self.sentiment_history[-i-1]
                )
            
            if first_derivative:
                acceleration = abs(np.mean(first_derivative))
                # Normalize to 0-100
                return min(100, acceleration * 200)
        
        # If sentiment is strongly negative, that's also concerning
        if recent_avg < -0.3:
            return min(100, abs(recent_avg) * 100)
        
        return 0.0

    def compute_cluster_growth_rate(self, clusters: List[Dict]) -> float:
        """
        Compute average cluster growth rate
        
        Args:
            clusters: List of cluster information dictionaries
            
        Returns:
            Average growth rate (0-100+)
        """
        if not clusters:
            return 0.0
        
        growth_rates = [c.get('growthRate', 0) for c in clusters]
        return float(np.mean(growth_rates))

    def compute_narrative_spread_speed(self, clusters: List[Dict], volume: int) -> float:
        """
        Compute narrative spread speed based on cluster count and volume
        
        Args:
            clusters: List of cluster information
            volume: Current volume of posts
            
        Returns:
            Spread speed score (0-100)
        """
        if not clusters or volume == 0:
            return 0.0
        
        # Factors:
        # 1. Number of clusters (more clusters = faster spread)
        # 2. Average cluster size (larger = more viral)
        # 3. Total affected posts
        
        num_clusters = len(clusters)
        total_posts = sum(c.get('size', 0) for c in clusters)
        
        # Calculate spread metrics
        cluster_factor = min(50, num_clusters * 10)  # Up to 50 points for cluster count
        size_factor = min(30, (total_posts / volume) * 30)  # Up to 30 for size ratio
        viral_factor = min(20, sum(1 for c in clusters if c.get('growthRate', 0) > 50) * 5)  # Up to 20 for viral clusters
        
        return cluster_factor + size_factor + viral_factor

    def compute_metrics(
        self,
        sentiments: List[float],
        clusters: List[Dict],
        current_volume: int
    ) -> Dict[str, float]:
        """
        Compute all escalation metrics
        
        Args:
            sentiments: List of sentiment scores
            clusters: List of cluster information
            current_volume: Current volume of posts
            
        Returns:
            Dictionary of metrics
        """
        sentiment_acceleration = self.compute_sentiment_acceleration(sentiments)
        cluster_growth_rate = self.compute_cluster_growth_rate(clusters)
        narrative_spread_speed = self.compute_narrative_spread_speed(clusters, current_volume)
        
        return {
            "sentimentAcceleration": sentiment_acceleration,
            "clusterGrowthRate": cluster_growth_rate,
            "narrativeSpreadSpeed": narrative_spread_speed
        }


# Global instance
escalation_service = EscalationService()
