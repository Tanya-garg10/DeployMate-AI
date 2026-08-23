from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class AnalyzeRequest(BaseModel):
    repo_url: str = Field(..., description="Public GitHub Repository URL")
    branch: Optional[str] = Field("main", description="Git branch to inspect")

class EnvVarSpec(BaseModel):
    key: str
    description: str
    required: bool
    suggestedValue: Optional[str] = None

class ProjectAnalysis(BaseModel):
    repoUrl: str
    repoName: str
    owner: str
    branch: str
    framework: str
    language: str
    packageManager: str
    buildCommand: str
    startCommand: str
    port: int
    databaseDetected: bool
    databaseType: Optional[str] = None
    environmentVariables: List[EnvVarSpec]
    hasDockerfile: bool
    detectedFiles: List[str]
    confidence: float
    summary: str

class ServiceSpec(BaseModel):
    name: str
    type: str
    runtime: str
    port: Optional[int] = None
    buildCommand: Optional[str] = None
    startCommand: Optional[str] = None
    envVars: Optional[List[str]] = None
    justification: str
    minMemory: Optional[str] = None
    minCpu: Optional[str] = None

class InfrastructurePlan(BaseModel):
    projectName: str
    services: List[ServiceSpec]
    database: Optional[Dict[str, Any]] = None
    topologyExplanation: str
    estimatedBuildTime: str

class ZeropsConfigOutput(BaseModel):
    yamlContent: str
    serviceCount: int
    validated: bool
    features: List[str]
    version: str

class DeployRequest(BaseModel):
    analysis: ProjectAnalysis
    plan: InfrastructurePlan
    zeropsYaml: str
    scenario: Optional[str] = "success"
    isLive: Optional[bool] = False

class LogEntry(BaseModel):
    id: str
    timestamp: str
    level: str
    stage: str
    message: str

class DebugDiagnosis(BaseModel):
    status: str
    rootCause: str
    impact: str
    confidence: float
    severity: str
    affectedService: str
    recommendedFix: str
    detailedExplanation: str
    suggestedConfigPatch: Optional[Dict[str, Any]] = None
    suggestedEnvVars: Optional[Dict[str, str]] = None

class ApplyFixRequest(BaseModel):
    fixedYaml: Optional[str] = None
    injectedEnvs: Optional[Dict[str, str]] = None
