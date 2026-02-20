# SignalSafe

A modular AI intelligence platform for real-time misinformation-driven panic escalation detection.

## Architecture

SignalSafe consists of 3 services:

1. **Frontend** (Next.js App Router) - Real-time dashboard with live updates
2. **Backend** (Node.js + Express) - API server with MongoDB and Socket.io
3. **AI Service** (Python + FastAPI) - NLP processing pipeline

### Data Flow

```
Data Simulator
    ↓
Node Backend (Ingestion API)
    ↓
MongoDB
    ↓
AI Service (FastAPI)
    ↓
Risk Score Computation
    ↓
WebSocket Broadcast
    ↓
Next.js Dashboard
```

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Recharts, Socket.io Client
- **Backend**: Node.js, Express, TypeScript, MongoDB (Mongoose), Socket.io
- **AI Service**: Python, FastAPI, sentence-transformers, transformers, HDBSCAN
- **Database**: MongoDB

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- MongoDB (local or cloud instance)

### Installation

1. **Backend**
   ```bash
   cd backend
   npm install
   ```

2. **AI Service**
   ```bash
   cd ai-service
   pip install -r requirements.txt
   ```

3. **Frontend**
   ```bash
   cd frontend
   npm install
   ```

### Running the Application

1. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

2. **Start AI Service**
   ```bash
   cd ai-service
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

3. **Start Backend**
   ```bash
   cd backend
   npm run dev
   ```

4. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

5. Open http://localhost:3000 in your browser

### Using the Simulator

1. Click "Start Simulator" in the dashboard
2. Watch real-time data generation and risk assessment
3. The system will gradually increase negative narratives
4. Monitor risk score changes in real-time

## API Endpoints

- `POST /api/ingest` - Ingest new posts
- `GET /api/risk/current` - Get current risk snapshot
- `GET /api/clusters` - Get active clusters
- `POST /api/simulate/start` - Start data simulator
- `POST /api/simulate/stop` - Stop data simulator
- `GET /api/simulate/status` - Get simulator status

## WebSocket Events

- `risk:update` - Real-time risk score updates
- `clusters:update` - Real-time cluster updates

## Risk Scoring Formula

```
EscalationRiskScore =
    (SentimentAcceleration * 0.30)
  + (ClusterGrowthRate * 0.25)
  + (AnomalyScore * 0.25)
  + (NarrativeSpreadSpeed * 0.20)
```

### Classification Thresholds

- < 30: Stable
- 30-60: Emerging Concern
- 60-80: Escalation Risk
- 80-100: Panic Formation Likely

## Project Structure

```
signalsafe/
├── frontend/
│   ├── app/
│   │   ├── dashboard/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ClusterGraph.tsx
│   │   ├── ExplanationPanel.tsx
│   │   ├── HeatMap.tsx
│   │   ├── RiskGauge.tsx
│   │   └── SentimentChart.tsx
│   └── lib/
│       ├── api.ts
│       └── socket.ts
├── backend/
│   └── src/
│       ├── config/
│       ├── models/
│       ├── routes/
│       ├── services/
│       ├── sockets/
│       └── server.ts
├── ai-service/
│   └── app/
│       ├── main.py
│       ├── models/
│       ├── routers/
│       └── services/
└── README.md
```
