import { Router, Request, Response } from 'express';
import { fetchRepositoryData } from '../services/github_service.ts';
import { analyzeCodebase } from '../agents/code_analysis_agent.ts';
import { planInfrastructure } from '../agents/infrastructure_agent.ts';
import { generateZeropsConfig } from '../agents/zerops_agent.ts';
import { diagnoseDeploymentFailure } from '../agents/debug_agent.ts';
import { ZeropsDeploymentService } from '../services/zerops_service.ts';

export const apiRouter = Router();

// Preset repositories for instant judge testing
const DEMO_PRESETS = [
  {
    id: 'deploymate-ai',
    name: 'DeployMate AI (Primary Repo)',
    url: 'https://github.com/Tanya-garg10/DeployMate-AI',
    description: 'FastAPI + Python AI Deployment Agent with Zerops infrastructure and PostgreSQL',
    stack: 'Python / FastAPI + Gemini AI + Zerops',
    type: 'Full-Stack Agent'
  },
  {
    id: 'fastapi-postgres',
    name: 'FastAPI + PostgreSQL Production Backend',
    url: 'https://github.com/tiangolo/full-stack-fastapi-template',
    description: 'Modern async REST API with SQLAlchemy and PostgreSQL database integration',
    stack: 'Python 3.12 / FastAPI',
    type: 'Backend'
  },
  {
    id: 'nextjs-saas',
    name: 'Next.js 14 Cloud Application',
    url: 'https://github.com/shadcn/taxonomy',
    description: 'Fullstack Next.js web application with SSR, dynamic routing and API handlers',
    stack: 'Next.js 14 / TypeScript',
    type: 'Full-Stack'
  },
  {
    id: 'react-vite',
    name: 'React 19 + Vite Frontend SPA',
    url: 'https://github.com/vitejs/vite',
    description: 'Single-page web application with optimized static build pipeline',
    stack: 'React / Vite / Node.js',
    type: 'Frontend'
  },
];

// Health Check
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'DeployMate AI',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    zeropsConfigured: !!process.env.ZEROPS_API_TOKEN,
  });
});

// Presets list
apiRouter.get('/presets', (req: Request, res: Response) => {
  res.json(DEMO_PRESETS);
});

// 1. Analyze GitHub Repository
apiRouter.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { repo_url, branch } = req.body;
    if (!repo_url || typeof repo_url !== 'string') {
      return res.status(400).json({ error: 'Repository URL (repo_url) is required' });
    }

    const repoData = await fetchRepositoryData(repo_url);
    const effectiveBranch = branch || repoData.defaultBranch;

    const analysis = await analyzeCodebase(
      repo_url,
      repoData.owner,
      repoData.repo,
      effectiveBranch,
      repoData.content
    );

    res.json(analysis);
  } catch (error: any) {
    console.error('Analyze error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze repository' });
  }
});

// 2. Generate Infrastructure Plan
apiRouter.post('/generate-plan', async (req: Request, res: Response) => {
  try {
    const { analysis } = req.body;
    if (!analysis) {
      return res.status(400).json({ error: 'Analysis object is required' });
    }

    const plan = await planInfrastructure(analysis);
    res.json(plan);
  } catch (error: any) {
    console.error('Plan error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate infrastructure plan' });
  }
});

// 3. Generate Zerops Config (zerops.yml)
apiRouter.post('/generate-config', async (req: Request, res: Response) => {
  try {
    const { analysis, plan } = req.body;
    if (!analysis || !plan) {
      return res.status(400).json({ error: 'Analysis and plan objects are required' });
    }

    const config = await generateZeropsConfig(analysis, plan);
    res.json(config);
  } catch (error: any) {
    console.error('Config error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate zerops.yml' });
  }
});

// 4. Trigger Deployment
apiRouter.post('/deploy', async (req: Request, res: Response) => {
  try {
    const { analysis, plan, zeropsYaml, scenario, isLive } = req.body;
    if (!analysis || !plan || !zeropsYaml) {
      return res.status(400).json({ error: 'Analysis, plan, and zeropsYaml are required' });
    }

    const deployment = await ZeropsDeploymentService.createDeployment({
      analysis,
      plan,
      zeropsYaml,
      scenario: scenario || 'success',
      isLiveRequested: isLive || false,
    });

    res.json(deployment);
  } catch (error: any) {
    console.error('Deploy error:', error);
    res.status(500).json({ error: error.message || 'Failed to start deployment' });
  }
});

// 5. Get Deployments List
apiRouter.get('/deployments', (req: Request, res: Response) => {
  const list = ZeropsDeploymentService.getAll();
  res.json(list);
});

// 6. Get Deployment Status
apiRouter.get('/deployments/:id', (req: Request, res: Response) => {
  const deployment = ZeropsDeploymentService.getById(req.params.id);
  if (!deployment) {
    return res.status(404).json({ error: 'Deployment not found' });
  }
  res.json(deployment);
});

// 7. Get Deployment Logs
apiRouter.get('/deployments/:id/logs', (req: Request, res: Response) => {
  const deployment = ZeropsDeploymentService.getById(req.params.id);
  if (!deployment) {
    return res.status(404).json({ error: 'Deployment not found' });
  }
  res.json({
    id: deployment.id,
    status: deployment.status,
    logs: deployment.logs,
  });
});

// 8. Run AI Debug Agent on Failed Deployment
apiRouter.post('/deployments/:id/diagnose', async (req: Request, res: Response) => {
  try {
    const deployment = ZeropsDeploymentService.getById(req.params.id);
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    const diagnosis = await diagnoseDeploymentFailure(
      deployment.logs,
      deployment.analysis,
      deployment.zeropsYaml,
      deployment.failureScenario
    );

    deployment.diagnosis = diagnosis;
    res.json(diagnosis);
  } catch (error: any) {
    console.error('Diagnose error:', error);
    res.status(500).json({ error: error.message || 'Failed to run diagnosis' });
  }
});

// 9. Apply Fix & Redeploy
apiRouter.post('/deployments/:id/apply-fix', async (req: Request, res: Response) => {
  try {
    const { fixedYaml, injectedEnvs } = req.body;
    const deployment = await ZeropsDeploymentService.applyFixAndRedeploy(
      req.params.id,
      fixedYaml,
      injectedEnvs
    );

    res.json(deployment);
  } catch (error: any) {
    console.error('Apply fix error:', error);
    res.status(500).json({ error: error.message || 'Failed to apply fix and redeploy' });
  }
});
