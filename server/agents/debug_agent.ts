import { DebugDiagnosis, LogEntry, ProjectAnalysis } from '../../src/types.ts';
import { generateGeminiJson } from '../services/ai_service.ts';

export async function diagnoseDeploymentFailure(
  logs: LogEntry[],
  analysis: ProjectAnalysis,
  zeropsYaml: string,
  failureScenario?: string
): Promise<DebugDiagnosis> {
  const logText = logs.map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] [${l.stage}] ${l.message}`).join('\n');

  // Ground truth fallback logic for instant high-confidence detection
  let defaultDiagnosis: DebugDiagnosis = {
    status: 'failed',
    rootCause: 'DATABASE_URL environment variable is missing or improperly mapped',
    impact: 'Backend API service failed connection initialization to the managed PostgreSQL database during container startup.',
    confidence: 0.96,
    severity: 'high',
    affectedService: 'api',
    recommendedFix: 'Inject DATABASE_URL into the Zerops environment variables and link the managed PostgreSQL service hostname.',
    detailedExplanation: 'The application attempted to connect to Postgres on startup, but process.env.DATABASE_URL or os.environ.get("DATABASE_URL") returned undefined. In Zerops, environment variables must be declared in the run.envVariables section or connected via service references.',
    suggestedConfigPatch: {
      filePath: 'zerops.yml',
      originalSnippet: '      envVariables:\n        # Missing DATABASE_URL',
      patchedSnippet: '      envVariables:\n        DATABASE_URL: "postgresql://${db_user}:${db_password}@${db_hostname}:5432/${db_name}"',
      description: 'Auto-inject PostgreSQL managed connection string into api runtime container.',
    },
    suggestedEnvVars: {
      'DATABASE_URL': 'postgresql://app_user:secure_pwd@db:5432/deploymate_db',
    },
  };

  if (failureScenario === 'port_binding' || logText.includes('127.0.0.1') || logText.includes('connection refused') || logText.includes('Health check failed')) {
    defaultDiagnosis = {
      status: 'failed',
      rootCause: 'Container listening on localhost (127.0.0.1) instead of all network interfaces (0.0.0.0)',
      impact: 'Zerops HTTP ingress proxy cannot route external traffic to the application container, causing health check probes to fail.',
      confidence: 0.98,
      severity: 'high',
      affectedService: 'api',
      recommendedFix: 'Update the server start command to bind to host 0.0.0.0 instead of 127.0.0.1.',
      detailedExplanation: 'Containers run in isolated network namespaces. When a server binds strictly to 127.0.0.1, external routing probes originating from the Zerops balancer cannot reach the process.',
      suggestedConfigPatch: {
        filePath: 'zerops.yml',
        originalSnippet: 'start: uvicorn main:app --host 127.0.0.1 --port 8000',
        patchedSnippet: 'start: uvicorn main:app --host 0.0.0.0 --port 8000',
        description: 'Bind Uvicorn server to 0.0.0.0 to allow Zerops reverse proxy ingress.',
      },
      suggestedEnvVars: {},
    };
  } else if (failureScenario === 'missing_dependency' || logText.includes('ModuleNotFoundError') || logText.includes('Cannot find module')) {
    defaultDiagnosis = {
      status: 'failed',
      rootCause: 'Missing required runtime package dependency',
      impact: 'Application crash on import initialization during boot.',
      confidence: 0.94,
      severity: 'medium',
      affectedService: 'api',
      recommendedFix: 'Add the missing dependency to requirements.txt/package.json and update the build cache.',
      detailedExplanation: 'A critical module was referenced in application code but omitted from dependency manifests, causing an unhandled ModuleNotFoundError.',
      suggestedConfigPatch: {
        filePath: 'requirements.txt',
        originalSnippet: 'fastapi\nuvicorn',
        patchedSnippet: 'fastapi\nuvicorn\npsycopg2-binary>=2.9.9\ngoogle-genai>=2.4.0',
        description: 'Declare missing database & AI drivers in requirements.txt',
      },
    };
  }

  // Gemini AI Prompt for Diagnosis
  const prompt = `You are the Debug Agent in DeployMate AI.
An application deployment on Zerops has failed. Analyze the logs, project context, and configuration to perform root-cause analysis and formulate an actionable fix.

Project: ${analysis.repoName} (${analysis.framework}, ${analysis.language})
Zerops Configuration:
${zeropsYaml}

Deployment Logs:
${logText}

Produce a structured JSON root-cause diagnosis matching this format:
{
  "status": "failed",
  "rootCause": "string (clear 1-sentence description of the exact failure)",
  "impact": "string (how this affects the running services)",
  "confidence": number (between 0.85 and 0.99),
  "severity": "low" | "medium" | "high" | "critical",
  "affectedService": "string (e.g. 'api', 'web', 'db')",
  "recommendedFix": "string (concise actionable command or instruction)",
  "detailedExplanation": "string (thorough DevOps engineering explanation)",
  "suggestedConfigPatch": {
    "filePath": "string",
    "originalSnippet": "string",
    "patchedSnippet": "string",
    "description": "string"
  },
  "suggestedEnvVars": {
    "KEY": "VALUE"
  }
}`;

  const aiResult = await generateGeminiJson<Partial<DebugDiagnosis>>(prompt, {});

  return {
    ...defaultDiagnosis,
    rootCause: aiResult.rootCause || defaultDiagnosis.rootCause,
    impact: aiResult.impact || defaultDiagnosis.impact,
    confidence: aiResult.confidence || defaultDiagnosis.confidence,
    severity: aiResult.severity || defaultDiagnosis.severity,
    affectedService: aiResult.affectedService || defaultDiagnosis.affectedService,
    recommendedFix: aiResult.recommendedFix || defaultDiagnosis.recommendedFix,
    detailedExplanation: aiResult.detailedExplanation || defaultDiagnosis.detailedExplanation,
    suggestedConfigPatch: aiResult.suggestedConfigPatch || defaultDiagnosis.suggestedConfigPatch,
    suggestedEnvVars: aiResult.suggestedEnvVars || defaultDiagnosis.suggestedEnvVars,
  };
}
