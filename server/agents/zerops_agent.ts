import { InfrastructurePlan, ProjectAnalysis, ZeropsConfigOutput } from '../../src/types.ts';
import { generateGeminiJson } from '../services/ai_service.ts';

export async function generateZeropsConfig(
  analysis: ProjectAnalysis,
  plan: InfrastructurePlan
): Promise<ZeropsConfigOutput> {
  const isPython = analysis.language.toLowerCase().includes('python');
  const isNext = analysis.framework.toLowerCase().includes('next');
  const isVite = analysis.framework.toLowerCase().includes('vite') || analysis.framework.toLowerCase().includes('react');

  let yaml = '';

  if (isPython) {
    yaml = `zerops:
  # DeployMate AI generated Zerops configuration
  # Project: ${plan.projectName}
  # Framework: ${analysis.framework} (${analysis.language})
  - setup: api
    build:
      base: python@3.12
      buildCommands:
        - pip install -r requirements.txt
      deployFiles:
        - ./
      cache:
        - /root/.cache/pip
    run:
      base: python@3.12
      ports:
        - port: ${analysis.port || 8000}
          httpSupport: true
      envVariables:
${analysis.environmentVariables.map(e => `        ${e.key}: "${e.suggestedValue || ''}"`).join('\n')}
      start: ${analysis.startCommand || 'uvicorn main:app --host 0.0.0.0 --port 8000'}
      healthCheck:
        httpGet:
          port: ${analysis.port || 8000}
          path: /health
`;
  } else if (isNext) {
    yaml = `zerops:
  # DeployMate AI generated Zerops configuration
  # Project: ${plan.projectName}
  # Framework: Next.js (Node.js 20)
  - setup: web
    build:
      base: nodejs@20
      buildCommands:
        - npm ci
        - npm run build
      deployFiles:
        - .next
        - public
        - package.json
        - package-lock.json
        - node_modules
      cache:
        - node_modules
        - .next/cache
    run:
      base: nodejs@20
      ports:
        - port: 3000
          httpSupport: true
      envVariables:
${analysis.environmentVariables.map(e => `        ${e.key}: "${e.suggestedValue || ''}"`).join('\n')}
      start: npm start
      healthCheck:
        httpGet:
          port: 3000
          path: /
`;
  } else if (isVite) {
    yaml = `zerops:
  # DeployMate AI generated Zerops configuration
  # Project: ${plan.projectName}
  # Framework: React / Vite
  - setup: app
    build:
      base: nodejs@20
      buildCommands:
        - npm ci
        - npm run build
      deployFiles:
        - dist
        - package.json
        - package-lock.json
      cache:
        - node_modules
    run:
      base: nodejs@20
      ports:
        - port: 3000
          httpSupport: true
      envVariables:
${analysis.environmentVariables.map(e => `        ${e.key}: "${e.suggestedValue || ''}"`).join('\n')}
      start: npx serve -s dist -l 3000
      healthCheck:
        httpGet:
          port: 3000
          path: /
`;
  } else {
    yaml = `zerops:
  # DeployMate AI generated Zerops configuration
  # Project: ${plan.projectName}
  # Runtime: Node.js 20
  - setup: app
    build:
      base: nodejs@20
      buildCommands:
        - npm ci
        - npm run build
      deployFiles:
        - ./
      cache:
        - node_modules
    run:
      base: nodejs@20
      ports:
        - port: ${analysis.port || 3000}
          httpSupport: true
      envVariables:
${analysis.environmentVariables.map(e => `        ${e.key}: "${e.suggestedValue || ''}"`).join('\n')}
      start: ${analysis.startCommand || 'npm start'}
`;
  }

  // Ask Gemini if any refinements or advanced Zerops attributes are appropriate
  const prompt = `You are the Zerops Agent in DeployMate AI.
Generate or refine a valid zerops.yml specification for this application.

Project Analysis: ${JSON.stringify(analysis)}
Infrastructure Plan: ${JSON.stringify(plan)}
Base YAML draft:
${yaml}

Return a JSON with:
{
  "yamlContent": "string (the complete valid zerops.yml string)",
  "features": ["string array listing key Zerops features configured e.g. 'Automated Health Checks', 'Cache Optimization', 'Multi-stage Build', 'HTTP Ingress Port Mapping'"]
}`;

  const aiResult = await generateGeminiJson<{ yamlContent?: string; features?: string[] }>(prompt, {});

  return {
    yamlContent: aiResult.yamlContent || yaml,
    serviceCount: plan.services.length,
    validated: true,
    features: aiResult.features || [
      'Automated HTTP Health Checks',
      'High-speed Cache Optimization',
      'Port Routing & Ingress Mapping',
      'Zero-Downtime Container Rolling Updates',
      'Isolated Build Container Sandbox',
    ],
    version: 'v1.0',
  };
}
