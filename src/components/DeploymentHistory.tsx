import React from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  ExternalLink,
  Terminal,
  Clock,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import { DeploymentRecord } from '../types.ts';

interface DeploymentHistoryProps {
  deployments: DeploymentRecord[];
  onSelectDeployment: (dep: DeploymentRecord) => void;
  activeId?: string;
}

export const DeploymentHistory: React.FC<DeploymentHistoryProps> = ({
  deployments,
  onSelectDeployment,
  activeId,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-400" />
            Deployment History & Audit Log
          </h2>
          <p className="text-xs text-zinc-400">
            Lifecycle records of all deployments, builds, and AI auto-recoveries
          </p>
        </div>
        <span className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-mono text-zinc-300">
          Total: {deployments.length}
        </span>
      </div>

      {deployments.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12 text-center text-zinc-500">
          <Activity className="mx-auto h-8 w-8 mb-2 text-zinc-600" />
          <p className="text-sm">No deployments recorded yet in this session.</p>
          <p className="text-xs text-zinc-600 mt-1">Analyze a repository and trigger a deployment to begin.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider bg-zinc-950/60">
              <tr>
                <th className="py-3 px-4">Deployment ID</th>
                <th className="py-3 px-4">Project / Branch</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Environment</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {deployments.map((dep) => {
                const isActive = dep.id === activeId;
                return (
                  <tr
                    key={dep.id}
                    onClick={() => onSelectDeployment(dep)}
                    className={`cursor-pointer transition-colors ${
                      isActive ? 'bg-emerald-950/20' : 'hover:bg-zinc-800/40'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-zinc-200">
                      {dep.id}
                      {dep.redeployCount > 0 && (
                        <span className="ml-2 rounded bg-teal-500/20 px-1.5 py-0.2 text-[9px] text-teal-300 font-sans font-bold">
                          v{dep.redeployCount + 1} (Recovered)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{dep.projectName}</div>
                      <div className="text-[10px] text-zinc-500 font-mono">{dep.branch}</div>
                    </td>
                    <td className="py-3 px-4">
                      {dep.status === 'RUNNING' && (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" /> RUNNING
                        </span>
                      )}
                      {dep.status === 'FAILED' && (
                        <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/20">
                          <AlertTriangle className="h-3 w-3" /> FAILED
                        </span>
                      )}
                      {dep.status === 'BUILDING' && (
                        <span className="inline-flex items-center gap-1 rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-400">
                          <RotateCw className="h-3 w-3 animate-spin" /> BUILDING
                        </span>
                      )}
                      {dep.status === 'DEPLOYING' && (
                        <span className="inline-flex items-center gap-1 rounded bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-400">
                          <RotateCw className="h-3 w-3 animate-spin" /> DEPLOYING
                        </span>
                      )}
                      {dep.status === 'RECOVERING' && (
                        <span className="inline-flex items-center gap-1 rounded bg-teal-500/10 px-2 py-0.5 text-[10px] font-bold text-teal-400">
                          <RotateCw className="h-3 w-3 animate-spin" /> RECOVERING
                        </span>
                      )}
                      {dep.status === 'QUEUED' && (
                        <span className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                          QUEUED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-400">
                      {dep.durationSeconds ? `${dep.durationSeconds}s` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        dep.isDemo
                          ? 'border-zinc-800 bg-zinc-900 text-zinc-400'
                          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {dep.isDemo ? 'DEMO' : 'LIVE'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-400 text-[11px]">
                      {new Date(dep.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {dep.status === 'FAILED' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 hover:text-rose-300">
                            <ShieldAlert className="h-3.5 w-3.5" /> Diagnose
                          </span>
                        )}
                        {dep.status === 'RUNNING' && dep.appUrl && (
                          <a
                            href={dep.appUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold"
                          >
                            <span>Live</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </a>
                        )}
                        <span className="text-zinc-500 hover:text-zinc-300 text-[11px]">
                          Logs →
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
