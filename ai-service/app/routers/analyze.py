"""
Analyze Router - Main analysis endpoint
Coordinates all AI services for post analysis
"""
from fastapi import APIRouter
from app.models.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    EnrichedPost,
    ClusterOutput,
    MetricsOutput
)
from app.services.embedding_service import embedding_service
from app.services.sentiment_service import sentiment_service
from app.services.clustering_service import clustering_service
from app.services.anomaly_service import anomaly_service
from app.services.escalation_service import escalation_service
import numpy as np

router = APIRouter()


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_posts(request: AnalyzeRequest):
    """
    Analyze a batch of posts for risk assessment
    
    This endpoint:
    1. Generates embeddings for each post
    2. Analyzes sentiment
    3. Clusters similar posts
    4. Detects anomalies
    5. Computes escalation metrics
    """
    posts = request.posts
    
    if not posts:
        return AnalyzeResponse(
            enrichedPosts=[],
            clusters=[],
            metrics=MetricsOutput(
                sentimentAcceleration=0,
                clusterGrowthRate=0,
                anomalyScore=0,
                narrativeSpreadSpeed=0
            )
        )
    
    # Extract texts
    texts = [post.text for post in posts]
    post_ids = [post.id for post in posts]
    
    # Step 1: Generate embeddings
    print(f"Generating embeddings for {len(texts)} posts...")
    embeddings = embedding_service.encode(texts)
    
    # Step 2: Analyze sentiment
    print(f"Analyzing sentiment for {len(texts)} posts...")
    sentiments = sentiment_service.analyze(texts)
    
    # Step 3: Cluster posts
    print(f"Clustering {len(embeddings)} posts...")
    labels, n_clusters = clustering_service.cluster(embeddings)
    
    # Get cluster information
    clusters = clustering_service.get_cluster_info(labels, texts, sentiments)
    
    # Step 4: Detect anomalies
    current_volume = len(posts)
    anomaly_score = anomaly_service.detect(current_volume)
    
    # Step 5: Compute escalation metrics
    print("Computing escalation metrics...")
    escalation_metrics = escalation_service.compute_metrics(
        sentiments=sentiments,
        clusters=clusters,
        current_volume=current_volume
    )
    
    # Build enriched posts
    enriched_posts = []
    for i, post in enumerate(posts):
        embedding_list = embeddings[i].tolist() if i < len(embeddings) else []
        enriched_posts.append(EnrichedPost(
            id=post.id,
            text=post.text,
            sentimentScore=sentiments[i] if i < len(sentiments) else 0.0,
            embedding=embedding_list
        ))
    
    # Build cluster outputs
    cluster_outputs = []
    for cluster in clusters:
        cluster_outputs.append(ClusterOutput(
            clusterId=cluster["clusterId"],
            keywords=cluster["keywords"],
            size=cluster["size"],
            avgSentiment=cluster["avgSentiment"],
            growthRate=cluster["growthRate"],
            volatilityIndex=cluster["volatilityIndex"]
        ))
    
    # Build metrics output
    metrics_output = MetricsOutput(
        sentimentAcceleration=escalation_metrics["sentimentAcceleration"],
        clusterGrowthRate=escalation_metrics["clusterGrowthRate"],
        anomalyScore=anomaly_score,
        narrativeSpreadSpeed=escalation_metrics["narrativeSpreadSpeed"]
    )
    
    print(f"Analysis complete: {n_clusters} clusters, anomaly score: {anomaly_score:.2f}")
    
    return AnalyzeResponse(
        enrichedPosts=enriched_posts,
        clusters=cluster_outputs,
        metrics=metrics_output
    )
