import {
  DeploymentRecord,
  InfrastructurePlan,
  ProjectAnalysis,
  ZeropsConfigOutput,
  DebugDiagnosis
} from '../types.ts';

export async function analyzeRepository(repoUrl: string, branch = 'main'): Promise<ProjectAnalysis> {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repo_url: repoUrl, branch }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Analysis failed' }));
    throw new Error(err.error || 'Failed to analyze repository');
  }
  return res.json();
}

export async function generateInfrastructurePlan(analysis: ProjectAnalysis): Promise<InfrastructurePlan> {
  const res = await fetch('/api/generate-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysis }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Plan generation failed' }));
    throw new Error(err.error || 'Failed to generate infrastructure plan');
  }
  return res.json();
}

export async function generateZeropsYaml(analysis: ProjectAnalysis, plan: InfrastructurePlan): Promise<ZeropsConfigOutput> {
  const res = await fetch('/api/generate-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysis, plan }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Config generation failed' }));
    throw new Error(err.error || 'Failed to generate zerops.yml');
  }
  return res.json();
}

export async function triggerDeployment(params: {
  analysis: ProjectAnalysis;
  plan: InfrastructurePlan;
  zeropsYaml: string;
  scenario?: string;
  isLive?: boolean;
}): Promise<DeploymentRecord> {
  const res = await fetch('/api/deploy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Deployment failed' }));
    throw new Error(err.error || 'Failed to trigger deployment');
  }
  return res.json();
}

export async function getDeployment(id: string): Promise<DeploymentRecord> {
  const res = await fetch(`/api/deployments/${id}`);
  if (!res.ok) {
    throw new Error('Deployment not found');
  }
  return res.json();
}

export async function getDeploymentsList(): Promise<DeploymentRecord[]> {
  const res = await fetch('/api/deployments');
  if (!res.ok) return [];
  return res.json();
}

export async function diagnoseDeployment(id: string): Promise<DebugDiagnosis> {
  const res = await fetch(`/api/deployments/${id}/diagnose`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Diagnosis failed' }));
    throw new Error(err.error || 'Failed to run diagnosis');
  }
  return res.json();
}

export async function applyFixAndRedeploy(id: string, fixedYaml?: string, injectedEnvs?: Record<string, string>): Promise<DeploymentRecord> {
  const res = await fetch(`/api/deployments/${id}/apply-fix`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fixedYaml, injectedEnvs }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Fix application failed' }));
    throw new Error(err.error || 'Failed to apply fix');
  }
  return res.json();
}

export async function getSystemHealth(): Promise<any> {
  try {
    const res = await fetch('/api/health');
    return await res.json();
  } catch {
    return { status: 'offline' };
  }
}

export async function getPresets(): Promise<any[]> {
  try {
    const res = await fetch('/api/presets');
    return await res.json();
  } catch {
    return [];
  }
}
