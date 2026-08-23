import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from models.schemas import (
    AnalyzeRequest,
    DeployRequest,
    ApplyFixRequest,
    ProjectAnalysis,
    InfrastructurePlan,
    ZeropsConfigOutput,
    DebugDiagnosis
)

load_dotenv()

app = FastAPI(
    title="DeployMate AI API",
    description="AI-Powered Intelligent Application Deployment & Troubleshooting Agent for Zerops",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "DeployMate AI",
        "version": "1.0.0",
        "runtime": "Python 3.12 / FastAPI"
    }

@app.get("/api/presets")
def get_presets():
    return [
        {
            "id": "deploymate-ai",
            "name": "DeployMate AI (Hackathon Project)",
            "url": "https://github.com/Tanya-garg10/DeployMate-AI",
            "description": "FastAPI + Python AI Deployment Agent with Zerops infrastructure and PostgreSQL",
            "stack": "Python / FastAPI + Gemini AI + Zerops",
            "type": "Full-Stack Agent"
        },
        {
            "id": "fastapi-postgres",
            "name": "FastAPI + PostgreSQL Production Backend",
            "url": "https://github.com/tiangolo/full-stack-fastapi-template",
            "description": "Modern async REST API with SQLAlchemy and PostgreSQL database integration",
            "stack": "Python 3.12 / FastAPI",
            "type": "Backend"
        }
    ]

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
