import React from 'react';
import {
  Code,
  Terminal,
  Database,
  Key,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Copy,
  Check
} from 'lucide-react';
import { ProjectAnalysis } from '../types.ts';

interface ProjectIntelligenceProps {
  analysis: ProjectAnalysis;
  onGeneratePlan: () => void;
  isPlanning: boolean;
}

export const ProjectIntelligence: React.FC<ProjectIntelligenceProps> = ({
  analysis,
  onGeneratePlan,
  isPlanning,
}) => {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const confidencePercent = Math.round(analysis.confidence * 100);

  return (
    <div className="space-y-6">
      {/* Header Summary Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-5 sm:p-6 shadow-xl backdrop-blur-md lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Code Analysis Agent • Project Intelligence
            </span>
            <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
              {analysis.owner}/{analysis.repoName} ({analysis.branch})
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Detected Stack: {analysis.framework} <span className="text-zinc-500">({analysis.language})</span>
          </h2>
          <p className="text-xs text-zinc-300 max-w-2xl leading-relaxed">
            {analysis.summary}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* AI Confidence Meter */}
          <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400">Agent Confidence</span>
              <span className="text-xl font-black text-emerald-400">{confidencePercent}%</span>
            </div>
            <div className="h-8 w-1.5 rounded-full bg-zinc-800 overflow-hidden flex flex-col justify-end">
              <div
                className="w-full bg-emerald-400 rounded-full transition-all duration-500"
                style={{ height: `${confidencePercent}%` }}
              />
            </div>
          </div>

          <button
            onClick={onGeneratePlan}
            disabled={isPlanning}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-3 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isPlanning ? (
              <span>Planning Infrastructure...</span>
            ) : (
              <>
                <Layers className="h-4 w-4" />
                <span>Generate Zerops Topology</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid of Key Detected Specifications */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Framework & Runtime */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Framework</span>
            <Code className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-lg font-bold text-white">{analysis.framework}</div>
          <div className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            <span>Language: <strong className="text-zinc-200">{analysis.language}</strong></span>
          </div>
        </div>

        {/* Package Manager & Base */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Package Manager</span>
            <FileCode className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-white font-mono">{analysis.packageManager}</div>
          <div className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Dockerfile: <strong className="text-zinc-200">{analysis.hasDockerfile ? 'Detected' : 'Standard Runtime'}</strong></span>
          </div>
        </div>

        {/* Target Port */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Container Port</span>
            <Terminal className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-white font-mono">Port {analysis.port}</div>
          <div className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
            <span>HTTP Ingress Routing Enabled</span>
          </div>
        </div>

        {/* Database Requirement */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Database</span>
            <Database className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-white">
            {analysis.databaseDetected ? (analysis.databaseType || 'PostgreSQL') : 'Stateless / None'}
          </div>
          <div className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${analysis.databaseDetected ? 'bg-amber-400' : 'bg-zinc-600'}`} />
            <span>{analysis.databaseDetected ? 'Zerops Managed Cluster' : 'No persistence required'}</span>
          </div>
        </div>
      </div>

      {/* Build & Run Commands */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Build Command</span>
            <button
              onClick={() => copyToClipboard(analysis.buildCommand, 'build')}
              className="text-zinc-500 hover:text-zinc-300 text-xs flex items-center gap-1"
            >
              {copiedKey === 'build' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedKey === 'build' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="rounded-lg bg-zinc-950 p-3 font-mono text-xs text-emerald-300 overflow-x-auto border border-zinc-800/80">
            {analysis.buildCommand}
          </pre>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Start Command</span>
            <button
              onClick={() => copyToClipboard(analysis.startCommand, 'start')}
              className="text-zinc-500 hover:text-zinc-300 text-xs flex items-center gap-1"
            >
              {copiedKey === 'start' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedKey === 'start' ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="rounded-lg bg-zinc-950 p-3 font-mono text-xs text-cyan-300 overflow-x-auto border border-zinc-800/80">
            {analysis.startCommand}
          </pre>
        </div>
      </div>

      {/* Environment Variables Section */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">
              Detected Environment Variables & Secrets ({analysis.environmentVariables.length})
            </h3>
          </div>
          <span className="text-xs text-zinc-400">Auto-configured in Zerops recipe</span>
        </div>

        {analysis.environmentVariables.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Variable Key</th>
                  <th className="py-2.5 px-3">Requirement</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Zerops Value Mapping</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {analysis.environmentVariables.map((env) => (
                  <tr key={env.key} className="hover:bg-zinc-800/30">
                    <td className="py-2.5 px-3 font-bold text-amber-300">{env.key}</td>
                    <td className="py-2.5 px-3 font-sans">
                      {env.required ? (
                        <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-400 border border-rose-500/20">
                          <AlertCircle className="h-2.5 w-2.5" /> Required
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                          Optional
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-zinc-300">{env.description}</td>
                    <td className="py-2.5 px-3 text-zinc-400 text-[11px] truncate max-w-xs">
                      {env.suggestedValue || '<provided_by_zerops_runtime>'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-zinc-400 py-3">
            No environment variables strictly required for baseline container start.
          </p>
        )}
      </div>

      {/* Discovered Repository Files */}
      <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/60 p-4">
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
          <span className="font-semibold uppercase tracking-wider">Indexed File Tree ({analysis.detectedFiles.length} files)</span>
          <span className="text-[11px] text-zinc-500">Inspected by Code Analysis Agent</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {analysis.detectedFiles.map((file) => (
            <span
              key={file}
              className="rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[11px] font-mono text-zinc-300"
            >
              {file}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
