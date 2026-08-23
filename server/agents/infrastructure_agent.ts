import { InfrastructurePlan, ProjectAnalysis, ServiceSpec } from '../../src/types.ts';
import { generateGeminiJson } from '../services/ai_service.ts';

export async function planInfrastructure(analysis: ProjectAnalysis): Promise<InfrastructurePlan> {
  const services: ServiceSpec[] = [];
  const projectName = analysis.repoName.toLowerCase().replace(/[^a-z0-9-_]/g, '-');

  // If repo has both frontend and backend (or fullstack)
  const isPython = analysis.language.toLowerCase().includes('python');
  const isNext = analysis.framework.toLowerCase().includes('next');
  const isVite = analysis.framework.toLowerCase().includes('vite') || analysis.framework.toLowerCase().includes('react');

  if (isPython) {
    services.push({
      name: 'api',
      type: 'backend',
      runtime: 'python@3.12',
      port: analysis.port || 8000,
      buildCommand: analysis.buildCommand || 'pip install -r requirements.txt',
      startCommand: analysis.startCommand || 'uvicorn main:app --host 0.0.0.0 --port 8000',
      envVars: analysis.environmentVariables.map(e => e.key),
      justification: `Core ${analysis.framework} REST API backend responsible for processing requests, agent logic, and database operations.`,
      minMemory: '512MB',
      minCpu: '1 Core',
    });
  } else if (isNext) {
    services.push({
      name: 'web',
      type: 'frontend',
      runtime: 'nodejs@20',
      port: 3000,
      buildCommand: 'npm run build',
      startCommand: 'npm start',
      envVars: analysis.environmentVariables.map(e => e.key),
      justification: 'SSR and client application layer serving dynamic pages and API routes with edge caching.',
      minMemory: '1GB',
      minCpu: '1 Core',
    });
  } else if (isVite) {
    services.push({
      name: 'app',
      type: 'frontend',
      runtime: 'nodejs@20',
      port: 3000,
      buildCommand: 'npm run build',
      startCommand: 'npm run preview -- --port 3000 --host 0.0.0.0',
      envVars: analysis.environmentVariables.map(e => e.key),
      justification: 'High-performance React SPA served via optimized production build on Zerops node service.',
      minMemory: '512MB',
      minCpu: '0.5 Core',
    });
  } else {
    services.push({
      name: 'app',
      type: 'backend',
      runtime: 'nodejs@20',
      port: analysis.port || 3000,
      buildCommand: analysis.buildCommand || 'npm install && npm run build',
      startCommand: analysis.startCommand || 'npm start',
      envVars: analysis.environmentVariables.map(e => e.key),
      justification: 'Node.js runtime container running application server processes.',
      minMemory: '512MB',
      minCpu: '1 Core',
    });
  }

  let database: InfrastructurePlan['database'] = undefined;
  if (analysis.databaseDetected || analysis.environmentVariables.some(e => e.key.includes('DATABASE') || e.key.includes('POSTGRES'))) {
    database = {
      type: 'postgresql',
      version: '16',
      name: `${projectName}-db`,
    };
    services.push({
      name: 'db',
      type: 'database',
      runtime: 'postgresql@16',
      port: 5432,
      justification: 'Managed PostgreSQL relational database cluster on Zerops with automatic backups and persistent NVMe volume.',
      minMemory: '1GB',
      minCpu: '1 Core',
    });
  }

  const basePlan: InfrastructurePlan = {
    projectName,
    services,
    database,
    topologyExplanation: `Configured a high-availability ${services.length}-tier architecture on Zerops infrastructure. ${database ? 'Includes dedicated managed PostgreSQL database cluster.' : 'Single-service stateless container architecture with instant horizontal scalability.'}`,
    estimatedBuildTime: '45s - 90s',
  };

  const prompt = `You are the Infrastructure Agent in DeployMate AI.
Review this project analysis and refine the Zerops deployment architecture topology.

Project Analysis: ${JSON.stringify(analysis)}
Proposed Base Plan: ${JSON.stringify(basePlan)}

Generate an optimal cloud topology explaining WHY each service, runtime, and port is required.
Return JSON conforming to:
{
  "topologyExplanation": "string explaining the topology clearly for devops engineers",
  "estimatedBuildTime": "string (e.g. '50s - 75s')",
  "services": [
    {
      "name": "string",
      "type": "frontend" | "backend" | "database",
      "runtime": "string (e.g. python@3.12, nodejs@20, postgresql@16)",
      "port": number,
      "buildCommand": "string",
      "startCommand": "string",
      "justification": "string",
      "minMemory": "string",
      "minCpu": "string"
    }
  ]
}`;

  const aiResult = await generateGeminiJson<Partial<InfrastructurePlan>>(prompt, {});

  return {
    ...basePlan,
    topologyExplanation: aiResult.topologyExplanation || basePlan.topologyExplanation,
    estimatedBuildTime: aiResult.estimatedBuildTime || basePlan.estimatedBuildTime,
    services: (aiResult.services && aiResult.services.length > 0) ? (aiResult.services as ServiceSpec[]) : basePlan.services,
  };
}
