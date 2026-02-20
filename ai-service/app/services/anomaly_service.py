"""
Anomaly Detection Service
Implements advanced anomaly detection using:
1. Isolation Forest (sklearn) for multi-feature anomaly detection
2. Rolling z-score for single-feature fallback
Input features:
- post volume
- sentiment acceleration
- cluster growth rate
Returns normalized anomaly score (0-100)
"""
import numpy as np
from collections import deque
from typing import List, Dict, Optional
from dataclasses import dataclass, field

# Try to import sklearn for Isolation Forest
try:
    from sklearn.ensemble import IsolationForest
    from sklearn.preprocessing import StandardScaler
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    print("⚠️ sklearn not available, using fallback z-score detection")


@dataclass
class AnomalyFeatures:
    """Feature vector for anomaly detection"""
    post_volume: float
    sentiment_acceleration: float
    cluster_growth_rate: float


class AdvancedAnomalyService:
    """Advanced anomaly detection with Isolation Forest and fallback to z-score"""
    
    def __init__(self, window_size: int = 50, contamination: float = 0.1):
        self.window_size = window_size
        self.contamination = contamination
        
        # History for features
        self.volume_history = deque(maxlen=window_size)
        self.sentiment_accel_history = deque(maxlen=window_size)
        self.growth_rate_history = deque(maxlen=window_size)
        
        # Statistics for fallback
        self.mean_volume = 0.0
        self.std_volume = 1.0
        
        # Isolation Forest components
        self.scaler: Optional[StandardScaler] = None
        self.isolation_forest: Optional[IsolationForest] = None
        self.feature_buffer: List[List[float]] = []
        self.min_samples_for_iforest = 10
        
        # Fallback mode
        self.use_fallback = not SKLEARN_AVAILABLE
        
        if not self.use_fallback:
            try:
                self.scaler = StandardScaler()
                self.isolation_forest = IsolationForest(
                    contamination=contamination,
                    random_state=42,
                    n_estimators=100
                )
                print("✅ Advanced anomaly detection (Isolation Forest) initialized")
            except Exception as e:
                print(f"⚠️ Failed to initialize Isolation Forest: {e}")
                self.use_fallback = True
        else:
            print("✅ Fallback z-score anomaly detection initialized")
    
    def detect(self, current_volume: int) -> float:
        """Backwards compatible method - uses z-score only"""
        return self._detect_zscore(current_volume)
    
    def _extract_features(self, volume: int, sentiment_accel: float, growth_rate: float) -> List[float]:
        """Extract feature vector"""
        return [
            float(volume),
            float(sentiment_accel),
            float(growth_rate)
        ]
    
    def _normalize_features(self, features: List[List[float]]) -> np.ndarray:
        """Normalize features using StandardScaler"""
        if self.scaler is None:
            return np.array(features)
        
        try:
            return self.scaler.fit_transform(features)
        except:
            return np.array(features)
    
    def detect_advanced(
        self,
        current_volume: int,
        sentiment_acceleration: float = 0.0,
        cluster_growth_rate: float = 0.0
    ) -> float:
        """
        Detect anomaly using Isolation Forest or fallback to z-score
        
        Args:
            current_volume: Current volume of posts/messages
            sentiment_acceleration: Rate of sentiment change
            cluster_growth_rate: Growth rate of clusters
            
        Returns:
            Anomaly score (0-100)
        """
        # Add to histories
        self.volume_history.append(current_volume)
        self.sentiment_accel_history.append(sentiment_acceleration)
        self.growth_rate_history.append(cluster_growth_rate)
        
        # Extract current features
        features = self._extract_features(
            current_volume,
            sentiment_acceleration,
            cluster_growth_rate
        )
        
        # Try Isolation Forest if we have enough samples
        if not self.use_fallback and len(self.volume_history) >= self.min_samples_for_iforest:
            try:
                # Add to buffer
                self.feature_buffer.append(features)
                
                # Keep buffer at window size
                if len(self.feature_buffer) > self.window_size:
                    self.feature_buffer = self.feature_buffer[-self.window_size:]
                
                # Need enough samples for training
                if len(self.feature_buffer) >= self.min_samples_for_iforest:
                    # Normalize features
                    feature_array = np.array(self.feature_buffer)
                    normalized = self._normalize_features(feature_array)
                    
                    # Fit and predict
                    self.isolation_forest.fit(normalized[:-1])
                    current_normalized = normalized[-1].reshape(1, -1)
                    prediction = self.isolation_forest.predict(current_normalized)
                    
                    # Get anomaly score (negative scores are anomalies)
                    anomaly_score_raw = self.isolation_forest.score_samples(current_normalized)[0]
                    
                    # Convert to 0-100 scale
                    # score_samples returns negative scores, lower = more anomalous
                    # Normalize: -0.5 (typical) -> 0, -1.0 (definite anomaly) -> 100
                    anomaly_score = max(0, min(100, (0.5 - anomaly_score_raw) * 200))
                    
                    return round(anomaly_score, 2)
                    
            except Exception as e:
                print(f"⚠️ Isolation Forest error: {e}, falling back to z-score")
                self.use_fallback = True
        
        # Fallback to z-score detection
        return self._detect_zscore(current_volume)
    
    def _detect_zscore(self, current_volume: int) -> float:
        """Fallback z-score based anomaly detection"""
        # Need enough data
        if len(self.volume_history) < 5:
            return 0.0
        
        # Calculate statistics
        self.mean_volume = np.mean(self.volume_history)
        self.std_volume = np.std(self.volume_history)
        
        # Avoid division by zero
        if self.std_volume < 0.1:
            return 0.0
        
        # Calculate z-score
        z_score = (current_volume - self.mean_volume) / self.std_volume
        
        # Normalize z-score to 0-100 range
        anomaly_score = min(100, max(0, (abs(z_score) / 3) * 100))
        
        return round(anomaly_score, 2)
    
    def detect_batch(
        self,
        volumes: List[int],
        sentiment_accelerations: Optional[List[float]] = None,
        growth_rates: Optional[List[float]] = None
    ) -> List[float]:
        """
        Detect anomalies for a batch
        
        Args:
            volumes: List of volume counts
            sentiment_accelerations: Optional list of sentiment accelerations
            growth_rates: Optional list of cluster growth rates
            
        Returns:
            List of anomaly scores (0-100)
        """
        if sentiment_accelerations is None:
            sentiment_accelerations = [0.0] * len(volumes)
        if growth_rates is None:
            growth_rates = [0.0] * len(volumes)
        
        scores = []
        for i, volume in enumerate(volumes):
            score = self.detect_advanced(
                volume,
                sentiment_accelerations[i] if i < len(sentiment_accelerations) else 0.0,
                growth_rates[i] if i < len(growth_rates) else 0.0
            )
            scores.append(score)
        
        return scores
    
    def detect_simple(self, current_volume: int) -> float:
        """Simple z-score only detection for backwards compatibility"""
        return self._detect_zscore(current_volume)
    
    def get_stats(self) -> Dict:
        """Get current statistics"""
        return {
            "mean_volume": float(self.mean_volume),
            "std_volume": float(self.std_volume),
            "history_size": len(self.volume_history),
            "using_isolation_forest": not self.use_fallback,
            "sklearn_available": SKLEARN_AVAILABLE
        }
    
    def reset(self):
        """Reset the anomaly detection state"""
        self.volume_history.clear()
        self.sentiment_accel_history.clear()
        self.growth_rate_history.clear()
        self.feature_buffer.clear()
        self.mean_volume = 0.0
        self.std_volume = 1.0
        
        # Re-initialize Isolation Forest
        if not self.use_fallback and SKLEARN_AVAILABLE:
            try:
                self.scaler = StandardScaler()
                self.isolation_forest = IsolationForest(
                    contamination=self.contamination,
                    random_state=42,
                    n_estimators=100
                )
            except:
                self.use_fallback = True


# Global instance
anomaly_service = AdvancedAnomalyService()


# Backwards compatibility - keep original class
class AnomalyService:
    """Backwards compatibility wrapper"""
    
    def __init__(self, window_size: int = 50):
        self.window_size = window_size
        self._service = AdvancedAnomalyService(window_size)
    
    def detect(self, current_volume: int) -> float:
        return self._service.detect(current_volume)
    
    def detect_batch(self, volumes: List[int]) -> List[float]:
        return [self._service.detect(v) for v in volumes]
    
    def detect_advanced(
        self,
        current_volume: int,
        sentiment_acceleration: float = 0.0,
        cluster_growth_rate: float = 0.0
    ) -> float:
        return self._service.detect_advanced(
            current_volume,
            sentiment_acceleration,
            cluster_growth_rate
        )
    
    def get_stats(self) -> Dict:
        return self._service.get_stats()
    
    def reset(self):
        self._service.reset()
