import { ProjectAnalysis } from '../../src/types.ts';
import { GitHubRepoContent } from '../services/github_service.ts';
import { generateGeminiJson } from '../services/ai_service.ts';

export async function analyzeCodebase(
  repoUrl: string,
  owner: string,
  repoName: string,
  branch: string,
  content: GitHubRepoContent
): Promise<ProjectAnalysis> {
  // Static heuristic analysis first for ground truth
  const files = content.files || [];
  const hasPkgJson = !!content.packageJson || files.some(f => f.endsWith('package.json'));
  const hasRequirements = !!content.requirementsTxt || files.some(f => f.endsWith('requirements.txt'));
  const hasPyProject = !!content.pyprojectToml || files.some(f => f.endsWith('pyproject.toml'));
  const hasDockerfile = !!content.dockerfile || files.some(f => f.toLowerCase() === 'dockerfile');
  const hasNextConfig = !!content.nextConfig || files.some(f => f.includes('next.config'));
  const hasViteConfig = !!content.viteConfig || files.some(f => f.includes('vite.config'));

  // Detect Framework & Language
  let framework = 'Node.js';
  let language = 'JavaScript';
  let packageManager = 'npm';
  let buildCommand = 'npm run build';
  let startCommand = 'npm start';
  let port = 3000;
  let databaseDetected = false;
  let databaseType: string | undefined = undefined;

  const pkg = content.packageJson;
  const reqs = content.requirementsTxt || '';

  if (hasRequirements || hasPyProject || files.some(f => f.endsWith('.py'))) {
    language = 'Python';
    packageManager = 'pip';
    buildCommand = 'pip install -r requirements.txt';
    if (reqs.includes('fastapi') || reqs.includes('uvicorn') || files.some(f => f.includes('main.py') || f.includes('app.py'))) {
      framework = 'FastAPI';
      startCommand = 'uvicorn main:app --host 0.0.0.0 --port 8000';
      port = 8000;
    } else if (reqs.includes('django')) {
      framework = 'Django';
      startCommand = 'python manage.py runserver 0.0.0.0:8000';
      port = 8000;
    } else if (reqs.includes('flask')) {
      framework = 'Flask';
      startCommand = 'python app.py';
      port = 5000;
    } else {
      framework = 'Python Standard';
      startCommand = 'python main.py';
      port = 8000;
    }

    if (reqs.includes('psycopg2') || reqs.includes('asyncpg') || reqs.includes('sqlalchemy') || reqs.includes('postgres')) {
      databaseDetected = true;
      databaseType = 'PostgreSQL';
    }
  } else if (hasPkgJson) {
    language = files.some(f => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('tsconfig.json')) ? 'TypeScript' : 'JavaScript';
    if (files.some(f => f.includes('pnpm-lock.yaml'))) packageManager = 'pnpm';
    else if (files.some(f => f.includes('yarn.lock'))) packageManager = 'yarn';
    else if (files.some(f => f.includes('bun.lockb'))) packageManager = 'bun';
    else packageManager = 'npm';

    const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) };
    if (deps['next'] || hasNextConfig) {
      framework = 'Next.js';
      buildCommand = `${packageManager} run build`;
      startCommand = `${packageManager} start`;
      port = 3000;
    } else if (deps['vite'] || hasViteConfig) {
      framework = 'React / Vite';
      buildCommand = `${packageManager} run build`;
      startCommand = `${packageManager} run preview -- --port 3000 --host 0.0.0.0`;
      port = 3000;
    } else if (deps['express']) {
      framework = 'Express.js';
      buildCommand = `${packageManager} install`;
      startCommand = `${packageManager} start`;
      port = 3000;
    }

    if (deps['pg'] || deps['prisma'] || deps['typeorm'] || deps['drizzle-orm']) {
      databaseDetected = true;
      databaseType = 'PostgreSQL';
    }
  }

  // Parse environment variables from .env.example or code
  const envVars: Array<{ key: string; description: string; required: boolean; suggestedValue?: string }> = [];
  if (content.envExample) {
    const lines = content.envExample.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const parts = trimmed.split('=');
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').replace(/^["']|["']$/g, '').trim();
        if (key) {
          envVars.push({
            key,
            description: `Required runtime configuration for ${key}`,
            required: key.includes('SECRET') || key.includes('KEY') || key.includes('URL') || key.includes('TOKEN') || key.includes('DATABASE'),
            suggestedValue: val || undefined,
          });
          if (key.includes('DATABASE') || key.includes('POSTGRES') || key.includes('PG_')) {
            databaseDetected = true;
            databaseType = 'PostgreSQL';
          }
        }
      }
    }
  } else {
    // Default recommended envs
    if (databaseDetected) {
      envVars.push({
        key: 'DATABASE_URL',
        description: 'Connection URI string to the Zerops managed PostgreSQL database',
        required: true,
        suggestedValue: 'postgresql://${db_user}:${db_password}@${db_hostname}:5432/${db_name}',
      });
    }
    if (framework === 'FastAPI' || framework === 'Node.js' || framework === 'Next.js') {
      envVars.push({
        key: 'PORT',
        description: 'Port for internal container HTTP listening',
        required: false,
        suggestedValue: port.toString(),
      });
    }
  }

  const baseHeuristicAnalysis: ProjectAnalysis = {
    repoUrl,
    repoName,
    owner,
    branch,
    framework,
    language,
    packageManager,
    buildCommand,
    startCommand,
    port,
    databaseDetected,
    databaseType,
    environmentVariables: envVars,
    hasDockerfile,
    detectedFiles: files.slice(0, 30),
    confidence: 0.95,
    summary: `Identified ${framework} project written in ${language} using ${packageManager}. Configured for containerized port ${port}${databaseDetected ? ` with ${databaseType || 'PostgreSQL'} integration` : ''}.`,
  };

  // AI Prompt for Deep Code Intelligence via Gemini
  const prompt = `You are the Code Analysis Agent in DeployMate AI.
Analyze the following repository files and metadata to provide an accurate, high-confidence deployment specification.

Repository: ${owner}/${repoName} (${branch})
File list: ${JSON.stringify(files.slice(0, 50))}
Package.json content: ${JSON.stringify(content.packageJson || 'None')}
Requirements.txt content: ${JSON.stringify(content.requirementsTxt || 'None')}
Dockerfile: ${content.dockerfile ? 'Present' : 'None'}
Existing zerops.yml: ${content.zeropsYml ? 'Present' : 'None'}
.env.example content: ${JSON.stringify(content.envExample || 'None')}
README snippet: ${JSON.stringify(content.readme?.slice(0, 400) || 'None')}

Return a JSON object conforming to this schema:
{
  "framework": "string (e.g. FastAPI, Next.js, React / Vite, Express, Django, Node.js)",
  "language": "string (e.g. Python, TypeScript, JavaScript)",
  "packageManager": "string (e.g. pip, npm, pnpm, yarn, bun)",
  "buildCommand": "string",
  "startCommand": "string",
  "port": number,
  "databaseDetected": boolean,
  "databaseType": "string (e.g. PostgreSQL, Redis, None)",
  "environmentVariables": [
    {
      "key": "string",
      "description": "string",
      "required": boolean,
      "suggestedValue": "string"
    }
  ],
  "confidence": number (between 0.85 and 0.99),
  "summary": "string explaining the project structure and deployment readiness"
}`;

  const aiResult = await generateGeminiJson<Partial<ProjectAnalysis>>(prompt, {});

  return {
    ...baseHeuristicAnalysis,
    framework: aiResult.framework || baseHeuristicAnalysis.framework,
    language: aiResult.language || baseHeuristicAnalysis.language,
    packageManager: aiResult.packageManager || baseHeuristicAnalysis.packageManager,
    buildCommand: aiResult.buildCommand || baseHeuristicAnalysis.buildCommand,
    startCommand: aiResult.startCommand || baseHeuristicAnalysis.startCommand,
    port: aiResult.port || baseHeuristicAnalysis.port,
    databaseDetected: aiResult.databaseDetected !== undefined ? aiResult.databaseDetected : baseHeuristicAnalysis.databaseDetected,
    databaseType: aiResult.databaseType || baseHeuristicAnalysis.databaseType,
    environmentVariables: (aiResult.environmentVariables && aiResult.environmentVariables.length > 0) ? aiResult.environmentVariables : baseHeuristicAnalysis.environmentVariables,
    confidence: aiResult.confidence || baseHeuristicAnalysis.confidence,
    summary: aiResult.summary || baseHeuristicAnalysis.summary,
  };
}
