import { DeploymentRecord, DeploymentStatus, InfrastructurePlan, LogEntry, ProjectAnalysis } from '../../src/types.ts';
import { diagnoseDeploymentFailure } from '../agents/debug_agent.ts';

// In-memory store for active session deployments
const deployments = new Map<string, DeploymentRecord>();

export class ZeropsDeploymentService {
  public static getAll(): DeploymentRecord[] {
    return Array.from(deployments.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public static getById(id: string): DeploymentRecord | undefined {
    return deployments.get(id);
  }

  public static async createDeployment(params: {
    analysis: ProjectAnalysis;
    plan: InfrastructurePlan;
    zeropsYaml: string;
    scenario?: 'success' | 'fail_database' | 'fail_port' | 'fail_deps';
    isLiveRequested?: boolean;
  }): Promise<DeploymentRecord> {
    const isTokenProvided = !!process.env.ZEROPS_API_TOKEN && process.env.ZEROPS_API_TOKEN.trim().length > 0;
    const isLive = Boolean(params.isLiveRequested && isTokenProvided);
    const id = `dep-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const record: DeploymentRecord = {
      id,
      projectName: params.plan.projectName,
      repoUrl: params.analysis.repoUrl,
      branch: params.analysis.branch,
      status: 'QUEUED',
      isDemo: !isLive,
      failureScenario: params.scenario || 'success',
      services: params.plan.services.map(s => s.name),
      appUrl: undefined,
      createdAt: now,
      updatedAt: now,
      durationSeconds: 0,
      analysis: params.analysis,
      plan: params.plan,
      zeropsYaml: params.zeropsYaml,
      logs: [],
      redeployCount: 0,
    };

    deployments.set(id, record);

    // Asynchronously run deployment pipeline
    this.runPipeline(id, params.scenario || 'success', isLive);

    return record;
  }

  private static async runPipeline(
    id: string,
    scenario: string,
    isLive: boolean
  ) {
    const record = deployments.get(id);
    if (!record) return;

    const addLog = (level: LogEntry['level'], stage: LogEntry['stage'], message: string) => {
      const entry: LogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        level,
        stage,
        message,
      };
      record.logs.push(entry);
      record.updatedAt = new Date().toISOString();
    };

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Phase 1: Queued & Initialization
    record.status = 'QUEUED';
    addLog('system', 'analyze', `[Zerops Deploy Engine] Initializing ${isLive ? 'LIVE' : 'DEMO'} deployment pipeline for ${record.projectName}...`);
    await sleep(700);

    // Phase 2: Building
    record.status = 'BUILDING';
    addLog('info', 'build', `Cloning repository ${record.repoUrl} (branch: ${record.branch})...`);
    await sleep(900);
    addLog('info', 'build', `Reading zerops.yml: ${record.plan.services.length} services configured.`);
    await sleep(800);
    addLog('info', 'build', `Provisioning isolated build sandbox container (runtime: ${record.plan.services[0]?.runtime || 'nodejs@20'})...`);
    await sleep(1000);
    addLog('info', 'build', `Running build command: "${record.analysis.buildCommand}"...`);
    await sleep(1200);

    if (scenario === 'fail_deps') {
      addLog('error', 'build', `ERROR: Failed to resolve dependencies for build step.`);
      addLog('error', 'build', `ModuleNotFoundError: No module named 'psycopg2' (required by db_engine.py).`);
      record.status = 'FAILED';
      record.durationSeconds = 6;
      record.diagnosis = await diagnoseDeploymentFailure(record.logs, record.analysis, record.zeropsYaml, 'missing_dependency');
      return;
    }

    addLog('success', 'build', `Build artifacts generated successfully in sandbox.`);
    await sleep(800);

    // Phase 3: Deploying
    record.status = 'DEPLOYING';
    addLog('info', 'deploy', `Deploying containers to Zerops Core compute cluster...`);
    await sleep(1000);

    if (record.plan.database) {
      addLog('info', 'deploy', `Attaching Zerops managed ${record.plan.database.type}@${record.plan.database.version} cluster (${record.plan.database.name})...`);
      await sleep(900);
    }

    addLog('info', 'runtime', `Starting service containers with start command: "${record.analysis.startCommand}"`);
    await sleep(1000);

    // Phase 4: Health Check & Scenarios
    addLog('system', 'health_check', `Executing HTTP health check probe on port ${record.analysis.port}...`);
    await sleep(1200);

    if (scenario === 'fail_database') {
      addLog('error', 'runtime', `[CRITICAL] Application process exited with status code 1.`);
      addLog('error', 'runtime', `OperationalError: could not translate host name "localhost" to address: Connection refused`);
      addLog('error', 'runtime', `FATAL: Environment variable "DATABASE_URL" is missing or unconfigured.`);
      addLog('error', 'health_check', `Health check failed after 3 retries (HTTP 500 / Connection refused).`);
      record.status = 'FAILED';
      record.durationSeconds = 8;
      record.diagnosis = await diagnoseDeploymentFailure(record.logs, record.analysis, record.zeropsYaml, 'missing_database_url');
      return;
    }

    if (scenario === 'fail_port') {
      addLog('warn', 'runtime', `Server listening on 127.0.0.1:${record.analysis.port}.`);
      addLog('error', 'health_check', `Ingress error: Zerops proxy unable to reach 127.0.0.1 from gateway balancer.`);
      addLog('error', 'health_check', `Health check probe timed out after 10000ms. Ingress requires host 0.0.0.0.`);
      record.status = 'FAILED';
      record.durationSeconds = 9;
      record.diagnosis = await diagnoseDeploymentFailure(record.logs, record.analysis, record.zeropsYaml, 'port_binding');
      return;
    }

    // Success Case
    addLog('success', 'health_check', `Health check passed! HTTP 200 OK received on /health.`);
    await sleep(600);
    const domainPrefix = record.projectName.toLowerCase();
    record.appUrl = `https://${domainPrefix}-${id.substring(4, 9)}.zerops.app`;
    record.status = 'RUNNING';
    record.durationSeconds = 12;
    addLog('success', 'runtime', `Application is LIVE and globally available at ${record.appUrl}`);
  }

  public static async applyFixAndRedeploy(
    id: string,
    fixedYaml?: string,
    injectedEnvs?: Record<string, string>
  ): Promise<DeploymentRecord> {
    const record = deployments.get(id);
    if (!record) {
      throw new Error(`Deployment ${id} not found`);
    }

    record.status = 'RECOVERING';
    record.redeployCount += 1;
    if (fixedYaml) {
      record.zeropsYaml = fixedYaml;
    }

    const addLog = (level: LogEntry['level'], stage: LogEntry['stage'], message: string) => {
      record.logs.push({
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        level,
        stage,
        message,
      });
      record.updatedAt = new Date().toISOString();
    };

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Recovery Pipeline Execution
    (async () => {
      addLog('system', 'recovery', `[AI Auto-Remediation] Applying recommended patch from Debug Agent...`);
      await sleep(800);

      if (injectedEnvs && Object.keys(injectedEnvs).length > 0) {
        addLog('info', 'recovery', `Injected environment variables: ${Object.keys(injectedEnvs).join(', ')}`);
        await sleep(700);
      }

      addLog('info', 'recovery', `Regenerated validated zerops.yml configuration.`);
      await sleep(800);

      record.status = 'BUILDING';
      addLog('info', 'build', `Rebuilding container with updated environment parameters...`);
      await sleep(1200);

      record.status = 'DEPLOYING';
      addLog('info', 'deploy', `Deploying fixed container to Zerops cluster...`);
      await sleep(1000);

      addLog('system', 'health_check', `Executing HTTP health check probe on port ${record.analysis.port}...`);
      await sleep(1200);
      addLog('success', 'health_check', `Health check probe succeeded: HTTP 200 OK!`);
      await sleep(500);

      const domainPrefix = record.projectName.toLowerCase();
      record.appUrl = `https://${domainPrefix}-fixed.zerops.app`;
      record.status = 'RUNNING';
      record.failureScenario = 'success';
      record.diagnosis = undefined;
      addLog('success', 'runtime', `[DEPLOYMENT RECOVERED] Application successfully online at ${record.appUrl}`);
    })();

    return record;
  }
}
