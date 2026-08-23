import React, { useState } from 'react';
import {
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCw,
  FileCode,
  Layers,
  Zap,
  Check,
  Copy,
  Terminal,
  Server
} from 'lucide-react';
import { DebugDiagnosis, DeploymentRecord } from '../types.ts';

interface AiDiagnosisViewProps {
  deployment: DeploymentRecord;
  diagnosis: DebugDiagnosis;
  onApplyFix: (fixedYaml?: string, injectedEnvs?: Record<string, string>) => void;
  isApplyingFix: boolean;
}

export const AiDiagnosisView: React.FC<AiDiagnosisViewProps> = ({
  deployment,
  diagnosis,
  onApplyFix,
  isApplyingFix,
}) => {
  const [copiedPatch, setCopiedPatch] = useState(false);

  const confidencePercent = Math.round(diagnosis.confidence * 100);

  const copyPatch = () => {
    if (diagnosis.suggestedConfigPatch?.patchedSnippet) {
      navigator.clipboard.writeText(diagnosis.suggestedConfigPatch.patchedSnippet);
      setCopiedPatch(true);
      setTimeout(() => setCopiedPatch(false), 2000);
    }
  };

  const getSeverityBadge = () => {
    switch (diagnosis.severity) {
      case 'critical':
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-400">
            <ShieldAlert className="h-3.5 w-3.5" /> SEVERITY: HIGH / BLOCKER
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" /> SEVERITY: MEDIUM
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300">
            SEVERITY: LOW
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Incident Header */}
      <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-950/30 via-zinc-900 to-zinc-950 p-6 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {getSeverityBadge()}
              <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-mono text-zinc-400">
                Target: {diagnosis.affectedService}
              </span>
              <span className="text-xs text-zinc-400">
                Deployment ID: {deployment.id}
              </span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span className="text-rose-400">⚠ Incident Diagnosis:</span> {diagnosis.rootCause}
            </h2>

            <p className="text-xs text-zinc-300 max-w-3xl leading-relaxed">
              <strong className="text-zinc-100 font-semibold">Impact:</strong> {diagnosis.impact}
            </p>
          </div>

          {/* AI Confidence Meter */}
          <div className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 shrink-0">
            <div className="flex flex-col text-right">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400">Debug Agent Confidence</span>
              <span className="text-2xl font-black text-rose-400">{confidencePercent}%</span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20">
              <Sparkles className="h-5 w-5 text-rose-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Action & 1-Click Remediation Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 via-zinc-900 to-zinc-950 p-5 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Recommended Automated Fix
            </span>
          </div>
          <p className="text-sm font-semibold text-white">
            {diagnosis.recommendedFix}
          </p>
        </div>

        <button
          onClick={() => onApplyFix(undefined, diagnosis.suggestedEnvVars)}
          disabled={isApplyingFix}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-6 py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer"
        >
          {isApplyingFix ? (
            <>
              <RotateCw className="h-4 w-4 animate-spin text-zinc-950" />
              <span>Applying Patch & Redeploying...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 text-zinc-950" />
              <span>Apply Fix & Redeploy</span>
              <ArrowRight className="h-4 w-4 text-zinc-950" />
            </>
          )}
        </button>
      </div>

      {/* Detailed Technical Analysis & Fix Details */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* DevOps Root Cause Deep-Dive */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Terminal className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">DevOps Technical Breakdown</h3>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            {diagnosis.detailedExplanation}
          </p>

          {diagnosis.suggestedEnvVars && Object.keys(diagnosis.suggestedEnvVars).length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-semibold text-zinc-400">Auto-Injected Environment Variables:</span>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-amber-300 space-y-1">
                {Object.entries(diagnosis.suggestedEnvVars).map(([k, v]) => (
                  <div key={k} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-amber-400 font-bold">{k}:</span>
                    <span className="text-zinc-400 truncate max-w-sm">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Suggested Configuration Patch Diff */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">
                Configuration Patch ({diagnosis.suggestedConfigPatch?.filePath || 'zerops.yml'})
              </h3>
            </div>

            {diagnosis.suggestedConfigPatch && (
              <button
                onClick={copyPatch}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200"
              >
                {copiedPatch ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copiedPatch ? 'Copied' : 'Copy'}</span>
              </button>
            )}
          </div>

          {diagnosis.suggestedConfigPatch ? (
            <div className="space-y-3">
              <p className="text-xs text-zinc-400">
                {diagnosis.suggestedConfigPatch.description}
              </p>

              {diagnosis.suggestedConfigPatch.originalSnippet && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Original (Defective):</span>
                  <pre className="rounded-lg bg-rose-950/20 border border-rose-900/30 p-2.5 font-mono text-xs text-rose-300 overflow-x-auto">
                    {diagnosis.suggestedConfigPatch.originalSnippet}
                  </pre>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Patched (Remediated):</span>
                <pre className="rounded-lg bg-emerald-950/20 border border-emerald-900/30 p-2.5 font-mono text-xs text-emerald-300 overflow-x-auto">
                  {diagnosis.suggestedConfigPatch.patchedSnippet}
                </pre>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-400">
              No configuration file modifications required. Patch will be applied via Zerops runtime environment variable injection.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
