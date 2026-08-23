import React from 'react';
import {
  Rocket,
  Terminal,
  Activity,
  AlertTriangle,
  Github,
  Boxes,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  activeDeploymentId?: string;
  hasIncident?: boolean;
  systemHealth?: {
    status: string;
    geminiConfigured: boolean;
    zeropsConfigured: boolean;
  };
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  activeDeploymentId,
  hasIncident,
  systemHealth,
}) => {
  const tabs = [
    { id: 'analyze', label: 'Analyze', step: '1', icon: Github },
    { id: 'plan', label: 'Architecture', step: '2', icon: Boxes },
    { id: 'deploy', label: 'Deploy & Logs', step: '3', icon: Terminal, badge: activeDeploymentId ? 'Active' : undefined },
    { id: 'diagnosis', label: 'AI Diagnosis', step: '4', icon: AlertTriangle, alert: hasIncident },
    { id: 'history', label: 'History', step: '5', icon: Activity },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        {/* Brand Left */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-0.5 shadow-md shadow-emerald-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[9px] bg-zinc-950">
              <Rocket className="h-4.5 w-4.5 text-emerald-400" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white sm:text-lg">
                DeployMate <span className="text-emerald-400">AI</span>
              </span>
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                Zerops Agent
              </span>
            </div>
            <span className="hidden text-[11px] text-zinc-400 sm:block">
              Autonomous Cloud Deployment & Auto-Troubleshooting
            </span>
          </div>
        </div>

        {/* Navigation Center */}
        <nav className="flex items-center gap-1 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/80 p-1 shadow-inner">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 shadow-sm border border-emerald-500/30'
                    : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
                    isActive ? 'bg-emerald-400 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {tab.step}
                </span>
                <Icon
                  className={`h-3.5 w-3.5 ${
                    isActive ? 'text-emerald-400' : 'text-zinc-400'
                  } ${tab.alert ? 'text-amber-400 animate-pulse' : ''}`}
                />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                )}
                {tab.alert && (
                  <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 border border-amber-500/30">
                    Fix Ready
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Status Indicators Right */}
        <div className="hidden items-center gap-2 lg:flex shrink-0">
          <div className="flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-zinc-400">Gemini:</span>
              <span className="font-semibold text-emerald-300">Ready</span>
            </div>
            <div className="h-3 w-px bg-zinc-800" />
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-400">Cloud:</span>
              <span className="font-semibold text-zinc-200">
                {systemHealth?.zeropsConfigured ? 'Live Zerops API' : 'Simulated Sandbox'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
