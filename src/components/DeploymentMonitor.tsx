import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  Play,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Search,
  Filter,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Server
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DeploymentRecord, LogEntry } from '../types.ts';

interface DeploymentMonitorProps {
  deployment: DeploymentRecord;
  onOpenDiagnosis: () => void;
  onRedeploy: () => void;
}

export const DeploymentMonitor: React.FC<DeploymentMonitorProps> = ({
  deployment,
  onOpenDiagnosis,
  onRedeploy,
}) => {
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [copiedLogs, setCopiedLogs] = useState<boolean>(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const confettiTriggeredRef = useRef<boolean>(false);

  // Trigger celebration confetti on success
  useEffect(() => {
    if (deployment.status === 'RUNNING' && !confettiTriggeredRef.current) {
      confettiTriggeredRef.current = true;
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#06b6d4', '#3b82f6'],
      });
    }
  }, [deployment.status]);

  // Auto-scroll logs
  useEffect(() => {
    if (autoScroll) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [deployment.logs, autoScroll]);

  const filteredLogs = deployment.logs.filter((log) => {
    if (filterLevel !== 'all' && log.level !== filterLevel && log.stage !== filterLevel) {
      return false;
    }
    if (searchQuery.trim()) {
      return log.message.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const copyAllLogs = () => {
    const text = deployment.logs
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] [${l.stage}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const getStatusBadge = () => {
    switch (deployment.status) {
      case 'QUEUED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs font-semibold text-zinc-300">
            <RotateCw className="h-3.5 w-3.5 animate-spin text-zinc-400" />
            QUEUED
          </span>
        );
      case 'BUILDING':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
            <RotateCw className="h-3.5 w-3.5 animate-spin text-cyan-400" />
            BUILDING SANDBOX
          </span>
        );
      case 'DEPLOYING':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
            <RotateCw className="h-3.5 w-3.5 animate-spin text-purple-400" />
            DEPLOYING TO ZEROPS
          </span>
        );
      case 'RECOVERING':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-300 animate-pulse">
            <RotateCw className="h-3.5 w-3.5 animate-spin text-teal-400" />
            AI AUTO-RECOVERY IN PROGRESS
          </span>
        );
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 shadow-sm shadow-emerald-500/20">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            RUNNING (HEALTHY)
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-400 shadow-sm shadow-rose-500/20">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
            DEPLOYMENT FAILED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-5 sm:p-6 shadow-xl backdrop-blur-md lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <span className="text-xs font-mono text-zinc-400">ID: {deployment.id}</span>
            <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
              deployment.isDemo ? 'border border-zinc-700 bg-zinc-800 text-zinc-400' : 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
            }`}>
              {deployment.isDemo ? 'DEMO SIMULATION' : 'LIVE ZEROPS CLUSTER'}
            </span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>{deployment.projectName}</span>
            <span className="text-xs font-normal text-zinc-400">({deployment.branch})</span>
          </h2>

          <p className="text-xs text-zinc-400">
            Services: <strong className="text-zinc-200">{deployment.services.join(', ')}</strong> • Started: {new Date(deployment.createdAt).toLocaleTimeString()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {deployment.status === 'RUNNING' && deployment.appUrl && (
            <a
              href={deployment.appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-xs font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition-all"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Open Live Application</span>
            </a>
          )}

          {deployment.status === 'FAILED' && (
            <button
              onClick={onOpenDiagnosis}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-500/20 hover:opacity-95 transition-all animate-bounce cursor-pointer"
            >
              <ShieldAlert className="h-4 w-4" />
              <span>View AI Diagnosis & Auto-Fix</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={onRedeploy}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-2.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span>Redeploy</span>
          </button>
        </div>
      </div>

      {/* Deployment Timeline Stages */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 text-xs font-medium">
        {[
          { label: '1. Analysis', done: true },
          { label: '2. zerops.yml Generated', done: true },
          { label: '3. Container Build', done: deployment.status !== 'QUEUED' },
          { label: '4. Zerops Ingress', done: deployment.status === 'DEPLOYING' || deployment.status === 'RUNNING' || deployment.status === 'FAILED' },
          { label: '5. Health Probe', done: deployment.status === 'RUNNING', failed: deployment.status === 'FAILED' },
        ].map((step, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-2 rounded-xl border p-3 ${
              step.failed
                ? 'border-rose-500/30 bg-rose-950/20 text-rose-300'
                : step.done
                ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
                : 'border-zinc-800 bg-zinc-950 text-zinc-500'
            }`}
          >
            {step.failed ? (
              <AlertTriangle className="h-4 w-4 text-rose-400" />
            ) : step.done ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <div className="h-3 w-3 rounded-full border border-zinc-600" />
            )}
            <span className="truncate">{step.label}</span>
          </div>
        ))}
      </div>

      {/* Terminal Logs Viewer */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl">
        {/* Terminal Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-900/90 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-500/80" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="font-mono text-zinc-400 ml-2">zerops-runtime.log</span>
            <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500 font-mono">
              {deployment.logs.length} lines
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-32 sm:w-44 rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Filter */}
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-xs text-zinc-300 focus:outline-none"
            >
              <option value="all">All Logs</option>
              <option value="error">Errors Only</option>
              <option value="build">Build Stage</option>
              <option value="runtime">Runtime Stage</option>
              <option value="health_check">Health Check</option>
            </select>

            {/* Auto-scroll toggle */}
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-mono transition-colors ${
                autoScroll
                  ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-400'
              }`}
            >
              Auto-Scroll: {autoScroll ? 'ON' : 'OFF'}
            </button>

            {/* Copy Logs */}
            <button
              onClick={copyAllLogs}
              className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
              {copiedLogs ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copiedLogs ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Logs Output Console */}
        <div className="p-4 font-mono text-xs max-h-[460px] min-h-[300px] overflow-y-auto space-y-1 bg-zinc-950 text-zinc-300 select-text">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => {
              let color = 'text-zinc-300';
              let badgeBg = 'bg-zinc-800 text-zinc-400';
              if (log.level === 'error') {
                color = 'text-rose-300 font-semibold bg-rose-950/20 px-1 py-0.5 rounded';
                badgeBg = 'bg-rose-900/60 text-rose-300';
              } else if (log.level === 'success') {
                color = 'text-emerald-300';
                badgeBg = 'bg-emerald-950 text-emerald-400';
              } else if (log.level === 'warn') {
                color = 'text-amber-300';
                badgeBg = 'bg-amber-950 text-amber-400';
              } else if (log.level === 'system') {
                color = 'text-cyan-300';
                badgeBg = 'bg-cyan-950 text-cyan-400';
              }

              return (
                <div key={log.id} className="flex items-start gap-2.5 hover:bg-zinc-900/50 py-0.5 px-1 rounded">
                  <span className="text-zinc-600 select-none text-[11px] whitespace-nowrap">
                    {log.timestamp}
                  </span>
                  <span className={`rounded px-1.5 py-0.2 text-[9px] uppercase font-bold select-none whitespace-nowrap ${badgeBg}`}>
                    {log.stage}
                  </span>
                  <span className={`whitespace-pre-wrap break-all ${color}`}>
                    {log.message}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-zinc-600">
              No logs matched the selected filter query.
            </div>
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
};
