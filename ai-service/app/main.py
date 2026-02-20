"""
SignalSafe AI Service
FastAPI application for NLP analysis, clustering, and risk assessment
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import analyze

app = FastAPI(
    title="SignalSafe AI Service",
    description="AI-powered misinformation and panic escalation detection",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(analyze.router, prefix="", tags=["analysis"])


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "SignalSafe AI Service",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "services": {
            "embedding": "loaded",
            "sentiment": "loaded",
            "clustering": "loaded",
            "anomaly": "loaded",
            "escalation": "loaded"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
