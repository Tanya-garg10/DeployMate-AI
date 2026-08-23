import React, { useState } from 'react';
import {
  Github,
  Search,
  Sparkles,
  GitBranch,
  ArrowRight,
  ExternalLink,
  Code2,
  Database,
  Layers,
  CheckCircle2,
  RotateCw
} from 'lucide-react';

interface RepoInputSectionProps {
  repoUrl: string;
  setRepoUrl: (url: string) => void;
  branch: string;
  setBranch: (branch: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  presets: any[];
}

export const RepoInputSection: React.FC<RepoInputSectionProps> = ({
  repoUrl,
  setRepoUrl,
  branch,
  setBranch,
  onAnalyze,
  isAnalyzing,
  presets,
}) => {
  const [activePreset, setActivePreset] = useState<string>('deploymate-ai');

  const handleSelectPreset = (preset: any) => {
    setActivePreset(preset.id);
    setRepoUrl(preset.url);
    setBranch('main');
  };

  return (
    <div className="w-full space-y-6">
      {/* Hero Intro */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/90 via-zinc-900/40 to-zinc-950/80 p-6 md:p-8 backdrop-blur-sm">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Autonomous Cloud Deployment & Auto-Troubleshooting Engine</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
            From Code to Cloud, <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Intelligently.</span>
          </h1>

          <p className="text-base text-zinc-300 sm:text-lg leading-relaxed">
            DeployMate AI inspects your repository, provisions Zerops infrastructure, generates production-grade <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-emerald-300">zerops.yml</code>, monitors live telemetry, and utilizes Gemini AI agents for zero-downtime error diagnosis & recovery.
          </p>

          {/* Workflow Sequence Banner */}
          <div className="grid grid-cols-2 gap-2 pt-2 sm:grid-cols-5 text-xs font-medium">
            <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/70 px-2.5 py-2 text-zinc-300">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-400">1</span>
              <span>PLAN</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/70 px-2.5 py-2 text-zinc-300">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-400">2</span>
              <span>ACT</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/70 px-2.5 py-2 text-zinc-300">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-400">3</span>
              <span>OBSERVE</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/70 px-2.5 py-2 text-zinc-300">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-400">4</span>
              <span>DIAGNOSE</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/70 px-2.5 py-2 text-zinc-300 col-span-2 sm:col-span-1">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] font-bold text-cyan-400">5</span>
              <span>RECOVER</span>
            </div>
          </div>
        </div>
      </div>

      {/* Input Bar Card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
          Public GitHub Repository URL
        </label>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
              <Github className="h-5 w-5" />
            </div>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/Tanya-garg10/DeployMate-AI"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-3.5 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono transition-colors"
            />
          </div>

          <div className="relative w-full sm:w-36">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
              <GitBranch className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-3.5 pl-9 pr-3 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono transition-colors"
            />
          </div>

          <button
            onClick={onAnalyze}
            disabled={isAnalyzing || !repoUrl.trim()}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <RotateCw className="h-4 w-4 animate-spin text-zinc-950" />
                <span>Analyzing Codebase...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-zinc-950" />
                <span>Analyze Project</span>
                <ArrowRight className="h-4 w-4 text-zinc-950" />
              </>
            )}
          </button>
        </div>

        {/* Hackathon Preset Repos */}
        <div className="mt-5 border-t border-zinc-800/80 pt-4">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2.5">
            <span className="font-medium">Or select a verified repository preset:</span>
            <span className="text-[11px] text-zinc-500">Pre-indexed manifests for fast evaluation</span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {presets.map((preset) => {
              const isSelected = activePreset === preset.id || repoUrl === preset.url;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`flex flex-col text-left rounded-xl border p-3 transition-all ${
                    isSelected
                      ? 'border-emerald-500/50 bg-emerald-950/20 shadow-md shadow-emerald-900/10'
                      : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-semibold text-xs text-zinc-200 truncate">{preset.name}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                      preset.id === 'deploymate-ai' 
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' 
                        : 'border-zinc-700 bg-zinc-800 text-zinc-400'
                    }`}>
                      {preset.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-1 mb-1.5">{preset.description}</p>
                  <div className="mt-auto flex items-center justify-between text-[10px] text-zinc-500">
                    <span className="font-mono text-emerald-400/80">{preset.stack}</span>
                    {isSelected && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
