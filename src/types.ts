export type DeploymentStatus = 'QUEUED' | 'BUILDING' | 'DEPLOYING' | 'RUNNING' | 'FAILED' | 'RECOVERING';

export type ServiceType = 'frontend' | 'backend' | 'database' | 'cache' | 'storage';

export interface ServiceSpec {
  name: string;
  type: ServiceType;
  runtime: string;
  port?: number;
  buildCommand?: string;
  startCommand?: string;
  envVars?: string[];
  justification: string;
  minMemory?: string;
  minCpu?: string;
}

export interface ProjectAnalysis {
  repoUrl: string;
  repoName: string;
  owner: string;
  branch: string;
  framework: string;
  language: string;
  packageManager: string;
  buildCommand: string;
  startCommand: string;
  port: number;
  databaseDetected: boolean;
  databaseType?: string;
  environmentVariables: Array<{
    key: string;
    description: string;
    required: boolean;
    suggestedValue?: string;
  }>;
  hasDockerfile: boolean;
  detectedFiles: string[];
  confidence: number;
  summary: string;
}

export interface InfrastructurePlan {
  projectName: string;
  services: ServiceSpec[];
  database?: {
    type: string;
    version: string;
    name: string;
  };
  topologyExplanation: string;
  estimatedBuildTime: string;
}

export interface ZeropsConfigOutput {
  yamlContent: string;
  serviceCount: number;
  validated: boolean;
  features: string[];
  version: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success' | 'system';
  stage: 'analyze' | 'build' | 'deploy' | 'runtime' | 'health_check' | 'recovery';
  message: string;
}

export interface DebugDiagnosis {
  status: 'failed';
  rootCause: string;
  impact: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedService: string;
  recommendedFix: string;
  detailedExplanation: string;
  suggestedConfigPatch?: {
    filePath: string;
    originalSnippet?: string;
    patchedSnippet: string;
    description: string;
  };
  suggestedEnvVars?: Record<string, string>;
}

export interface DeploymentRecord {
  id: string;
  projectName: string;
  repoUrl: string;
  branch: string;
  status: DeploymentStatus;
  isDemo: boolean;
  failureScenario?: string;
  services: string[];
  appUrl?: string;
  createdAt: string;
  updatedAt: string;
  durationSeconds: number;
  analysis: ProjectAnalysis;
  plan: InfrastructurePlan;
  zeropsYaml: string;
  logs: LogEntry[];
  diagnosis?: DebugDiagnosis;
  redeployCount: number;
}
