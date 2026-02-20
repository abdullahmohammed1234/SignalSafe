from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class PostInput(BaseModel):
    id: str
    text: str
    timestamp: Optional[datetime] = None


class AnalyzeRequest(BaseModel):
    posts: List[PostInput]


class EnrichedPost(BaseModel):
    id: str
    text: str
    sentimentScore: float
    embedding: List[float]


class ClusterOutput(BaseModel):
    clusterId: str
    keywords: List[str]
    size: int
    avgSentiment: float
    growthRate: float
    volatilityIndex: float


class MetricsOutput(BaseModel):
    sentimentAcceleration: float
    clusterGrowthRate: float
    anomalyScore: float
    narrativeSpreadSpeed: float


class AnalyzeResponse(BaseModel):
    enrichedPosts: List[EnrichedPost]
    clusters: List[ClusterOutput]
    metrics: MetricsOutput
