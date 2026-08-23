import React from 'react';
import { Play, AlertCircle, ShieldAlert, Sparkles, CheckCircle, Info } from 'lucide-react';

interface JudgeDemoBarProps {
  selectedScenario: string;
  setSelectedScenario: (scenario: string) => void;
  isLiveRequested: boolean;
  setIsLiveRequested: (val: boolean) => void;
  onQuickDemo: (scenario: string) => void;
  isDeploying: boolean;
}

export const JudgeDemoBar: React.FC<JudgeDemoBarProps> = ({
  selectedScenario,
  setSelectedScenario,
  isLiveRequested,
  setIsLiveRequested,
  onQuickDemo,
  isDeploying,
}) => {
  return (
    <section aria-label="Interactive Demo Scenarios" className="w-full border-b border-zinc-800 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-2.5">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-zinc-200">
            Interactive Agent Scenarios:
          </span>
          <span className="hidden text-zinc-400 sm:inline">
            Test the full PLAN → ACT → OBSERVE → DIAGNOSE → RECOVER cycle:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Scenario 1: Golden Path */}
          <button
            onClick={() => onQuickDemo('success')}
            disabled={isDeploying}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1 font-medium text-emerald-300 hover:bg-emerald-900/50 hover:text-emerald-200 transition-colors disabled:opacity-50"
            title="Deploy clean stack to Zerops with healthy status"
          >
            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
            <span>1. Golden Path (Success)</span>
          </button>

          {/* Preset Scenario 2: Missing Env Var (The Hackathon Star Demo) */}
          <button
            onClick={() => onQuickDemo('fail_database')}
            disabled={isDeploying}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-950/40 px-2.5 py-1 font-medium text-amber-300 hover:bg-amber-900/50 hover:text-amber-200 transition-colors disabled:opacity-50"
            title="Simulates missing DATABASE_URL, triggers AI Debug Agent diagnosis and 1-click redeploy"
          >
            <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
            <span>2. Missing DATABASE_URL Error & AI Recovery</span>
          </button>

          {/* Preset Scenario 3: Port Binding Error */}
          <button
            onClick={() => onQuickDemo('fail_port')}
            disabled={isDeploying}
            className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-950/30 px-2.5 py-1 font-medium text-purple-300 hover:bg-purple-900/40 transition-colors disabled:opacity-50"
            title="Simulates 127.0.0.1 ingress failure, diagnosed by Debug Agent"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-purple-400" />
            <span>3. Port 127.0.0.1 Binding Bug</span>
          </button>

          {/* Live vs Simulation Toggle */}
          <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1">
            <span className="text-zinc-400">Environment:</span>
            <button
              onClick={() => setIsLiveRequested(!isLiveRequested)}
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase transition-colors ${
                isLiveRequested
                  ? 'bg-emerald-500 text-zinc-950'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {isLiveRequested ? 'LIVE ZEROPS' : 'DEMO SANDBOX'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
