import React, { useState } from 'react';
import {
  Layers,
  Server,
  Database,
  Cpu,
  Shield,
  FileCode,
  Copy,
  Check,
  Download,
  Rocket,
  ArrowRight,
  Sparkles,
  Zap,
  Globe,
  Clock,
  Radio
} from 'lucide-react';
import { InfrastructurePlan, ProjectAnalysis, ZeropsConfigOutput } from '../types.ts';

interface InfrastructurePlannerProps {
  analysis: ProjectAnalysis;
  plan: InfrastructurePlan;
  zeropsConfig: ZeropsConfigOutput;
  onDeploy: (scenario: string) => void;
  isDeploying: boolean;
  isLiveRequested: boolean;
}

export const InfrastructurePlanner: React.FC<InfrastructurePlannerProps> = ({
  analysis,
  plan,
  zeropsConfig,
  onDeploy,
  isDeploying,
  isLiveRequested,
}) => {
  const [copiedYaml, setCopiedYaml] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string>('success');
  const [activeView, setActiveView] = useState<'visual' | 'yaml'>('visual');

  const copyYaml = () => {
    navigator.clipboard.writeText(zeropsConfig.yamlContent);
    setCopiedYaml(true);
    setTimeout(() => setCopiedYaml(false), 2000);
  };

  const downloadYaml = () => {
    const blob = new Blob([zeropsConfig.yamlContent], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zerops.yml';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-5 sm:p-6 shadow-xl backdrop-blur-md lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Infrastructure Agent • Zerops Architecture Planner
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Architecture Blueprint: {plan.projectName}
          </h2>
          <p className="text-xs text-zinc-300 max-w-2xl">
            {plan.topologyExplanation}
          </p>
        </div>

        {/* Deploy Actions & Demo Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 p-1.5">
            <span className="text-[11px] text-zinc-400 px-2 font-medium">Test Mode:</span>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-200 border border-zinc-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="success">Normal (Healthy Deployment)</option>
              <option value="fail_database">Error Demo: Missing DATABASE_URL</option>
              <option value="fail_port">Error Demo: 127.0.0.1 Ingress Error</option>
              <option value="fail_deps">Error Demo: Missing Package Dep</option>
            </select>
          </div>

          <button
            onClick={() => onDeploy(selectedScenario)}
            disabled={isDeploying}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-6 py-3 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Rocket className="h-4 w-4" />
            <span>{isDeploying ? 'Deploying to Zerops...' : `Deploy to Zerops (${isLiveRequested ? 'LIVE' : 'DEMO'})`}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs for Visual Topology vs Raw zerops.yml */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('visual')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeView === 'visual'
                ? 'bg-zinc-800 text-emerald-400 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Visual Architecture Diagram</span>
          </button>
          <button
            onClick={() => setActiveView('yaml')}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeView === 'yaml'
                ? 'bg-zinc-800 text-emerald-400 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileCode className="h-3.5 w-3.5" />
            <span>Generated zerops.yml</span>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[9px] text-emerald-300 font-mono">
              VALIDATED
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Clock className="h-3.5 w-3.5 text-zinc-500" />
          <span>Estimated Build Time: <strong className="text-zinc-200">{plan.estimatedBuildTime}</strong></span>
        </div>
      </div>

      {activeView === 'visual' ? (
        <div className="space-y-6">
          {/* Visual Architecture Node Flow */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 sm:p-8 backdrop-blur-md">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-6 text-center">
              Zerops Multi-Tier Topology
            </div>

            <div className="flex flex-col items-center justify-center gap-4 md:flex-row md:gap-8">
              {/* Traffic Ingress */}
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-950/40 shadow-lg shadow-cyan-500/10">
                  <Globe className="h-7 w-7 text-cyan-400 animate-pulse" />
                </div>
                <span className="text-xs font-bold text-zinc-200">Public Internet</span>
                <span className="text-[10px] font-mono text-zinc-500">SSL / Anycast DNS</span>
              </div>

              <div className="h-6 w-0.5 md:h-0.5 md:w-12 bg-zinc-800 flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>

              {/* Service Cards */}
              {plan.services.map((svc, index) => {
                const isDb = svc.type === 'database';
                return (
                  <React.Fragment key={svc.name}>
                    {index > 0 && (
                      <div className="h-6 w-0.5 md:h-0.5 md:w-12 bg-zinc-800 flex items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                      </div>
                    )}

                    <div className={`relative flex flex-col rounded-2xl border p-5 w-full md:w-72 transition-all ${
                      isDb
                        ? 'border-amber-500/30 bg-amber-950/20'
                        : 'border-emerald-500/30 bg-emerald-950/20 shadow-lg shadow-emerald-950/30'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {isDb ? (
                            <Database className="h-5 w-5 text-amber-400" />
                          ) : (
                            <Server className="h-5 w-5 text-emerald-400" />
                          )}
                          <span className="font-bold text-sm text-white capitalize">{svc.name}</span>
                        </div>
                        <span className="rounded bg-zinc-900 px-2 py-0.5 text-[10px] font-mono font-semibold text-zinc-300 border border-zinc-800">
                          {svc.runtime}
                        </span>
                      </div>

                      <p className="text-[11px] text-zinc-300 mb-4 line-clamp-2">
                        {svc.justification}
                      </p>

                      <div className="mt-auto grid grid-cols-2 gap-2 text-[10px] font-mono border-t border-zinc-800/80 pt-3 text-zinc-400">
                        <div>Port: <span className="text-zinc-200">{svc.port || 'Internal'}</span></div>
                        <div>Type: <span className="text-zinc-200 capitalize">{svc.type}</span></div>
                        <div>CPU: <span className="text-zinc-200">{svc.minCpu || '1 Core'}</span></div>
                        <div>RAM: <span className="text-zinc-200">{svc.minMemory || '512MB'}</span></div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Service Specifications Detail List */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {plan.services.map((svc) => (
              <div key={svc.name} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-emerald-400" />
                    <span className="font-bold text-sm text-white">Service: {svc.name}</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-mono">{svc.runtime}</span>
                </div>
                <p className="text-xs text-zinc-300">{svc.justification}</p>
                {svc.buildCommand && (
                  <div className="text-[11px] font-mono text-zinc-400">
                    <span className="text-zinc-500">Build:</span> {svc.buildCommand}
                  </div>
                )}
                {svc.startCommand && (
                  <div className="text-[11px] font-mono text-zinc-400">
                    <span className="text-zinc-500">Start:</span> {svc.startCommand}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Code Editor Preview for zerops.yml */
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
              <FileCode className="h-4 w-4 text-emerald-400" />
              <span>zerops.yml</span>
              <span className="text-zinc-500">— Zerops Agent v1.0</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyYaml}
                className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
              >
                {copiedYaml ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedYaml ? 'Copied!' : 'Copy Configuration'}</span>
              </button>

              <button
                onClick={downloadYaml}
                className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>

          <div className="p-4 overflow-x-auto bg-zinc-950 font-mono text-xs text-zinc-200 leading-relaxed max-h-[500px]">
            <pre className="text-emerald-400/90 whitespace-pre">
              {zeropsConfig.yamlContent}
            </pre>
          </div>

          {/* Zerops Feature Highlights */}
          <div className="border-t border-zinc-800/80 bg-zinc-900/50 p-4">
            <div className="text-xs font-semibold text-zinc-300 mb-2">Configured Zerops Features:</div>
            <div className="flex flex-wrap gap-2">
              {zeropsConfig.features.map((feat) => (
                <span
                  key={feat}
                  className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800/60 px-2.5 py-1 text-[11px] text-zinc-300"
                >
                  <Shield className="h-3 w-3 text-emerald-400" />
                  {feat}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
