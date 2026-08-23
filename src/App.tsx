import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar.tsx';
import { JudgeDemoBar } from './components/JudgeDemoBar.tsx';
import { RepoInputSection } from './components/RepoInputSection.tsx';
import { ProjectIntelligence } from './components/ProjectIntelligence.tsx';
import { InfrastructurePlanner } from './components/InfrastructurePlanner.tsx';
import { DeploymentMonitor } from './components/DeploymentMonitor.tsx';
import { AiDiagnosisView } from './components/AiDiagnosisView.tsx';
import { DeploymentHistory } from './components/DeploymentHistory.tsx';
import {
  analyzeRepository,
  generateInfrastructurePlan,
  generateZeropsYaml,
  triggerDeployment,
  getDeployment,
  getDeploymentsList,
  applyFixAndRedeploy,
  getPresets,
  getSystemHealth
} from './services/api.ts';
import {
  ProjectAnalysis,
  InfrastructurePlan,
  ZeropsConfigOutput,
  DeploymentRecord
} from './types.ts';
import { Sparkles, AlertCircle } from 'lucide-react';

export default function App() {
  const [repoUrl, setRepoUrl] = useState<string>('https://github.com/Tanya-garg10/DeployMate-AI');
  const [branch, setBranch] = useState<string>('main');
  const [presets, setPresets] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);

  const [currentTab, setCurrentTab] = useState<string>('analyze');
  const [isLiveRequested, setIsLiveRequested] = useState<boolean>(false);
  const [selectedScenario, setSelectedScenario] = useState<string>('success');

  // Loading States
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isPlanning, setIsPlanning] = useState<boolean>(false);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [isApplyingFix, setIsApplyingFix] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Workflow Data States
  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null);
  const [plan, setPlan] = useState<InfrastructurePlan | null>(null);
  const [zeropsConfig, setZeropsConfig] = useState<ZeropsConfigOutput | null>(null);
  const [activeDeployment, setActiveDeployment] = useState<DeploymentRecord | null>(null);
  const [deploymentsList, setDeploymentsList] = useState<DeploymentRecord[]>([]);

  // Initial Load: Presets & Health
  useEffect(() => {
    getPresets().then(setPresets).catch(() => {});
    getSystemHealth().then(setSystemHealth).catch(() => {});
    refreshDeploymentsList();
  }, []);

  const refreshDeploymentsList = async () => {
    try {
      const list = await getDeploymentsList();
      setDeploymentsList(list);
    } catch {
      // ignore
    }
  };

  // Polling for active deployment status and logs
  useEffect(() => {
    if (!activeDeployment) return;
    const isTransitional = ['QUEUED', 'BUILDING', 'DEPLOYING', 'RECOVERING'].includes(activeDeployment.status);
    if (!isTransitional) return;

    const interval = setInterval(async () => {
      try {
        const updated = await getDeployment(activeDeployment.id);
        setActiveDeployment(updated);
        refreshDeploymentsList();

        if (updated.status === 'RUNNING' || updated.status === 'FAILED') {
          setIsDeploying(false);
          setIsApplyingFix(false);
          if (updated.status === 'FAILED' && updated.diagnosis) {
            // Automatically surface diagnosis alert
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [activeDeployment?.id, activeDeployment?.status]);

  // Step 1: Analyze Repository
  const handleAnalyze = async () => {
    setErrorMessage(null);
    setIsAnalyzing(true);
    try {
      const result = await analyzeRepository(repoUrl, branch);
      setAnalysis(result);
      // Auto-generate plan in background for smooth UX
      setIsPlanning(true);
      const infraPlan = await generateInfrastructurePlan(result);
      setPlan(infraPlan);
      const yaml = await generateZeropsYaml(result, infraPlan);
      setZeropsConfig(yaml);
      setIsPlanning(false);
      setCurrentTab('analyze');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to analyze repository');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Step 2: Generate Plan (Manual or Tab Switch)
  const handleGeneratePlan = async () => {
    if (!analysis) return;
    setErrorMessage(null);
    setIsPlanning(true);
    try {
      const infraPlan = await generateInfrastructurePlan(analysis);
      setPlan(infraPlan);
      const yaml = await generateZeropsYaml(analysis, infraPlan);
      setZeropsConfig(yaml);
      setCurrentTab('plan');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to generate infrastructure plan');
    } finally {
      setIsPlanning(false);
    }
  };

  // Step 3: Trigger Deployment
  const handleDeploy = async (scenario = selectedScenario) => {
    if (!analysis || !plan || !zeropsConfig) {
      // If user clicks deploy without prior analysis, run analyze first
      await handleAnalyze();
      return;
    }

    setErrorMessage(null);
    setIsDeploying(true);
    try {
      const dep = await triggerDeployment({
        analysis,
        plan,
        zeropsYaml: zeropsConfig.yamlContent,
        scenario,
        isLive: isLiveRequested,
      });

      setActiveDeployment(dep);
      setCurrentTab('deploy');
      refreshDeploymentsList();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to trigger deployment');
      setIsDeploying(false);
    }
  };

  // Step 4: Apply Fix & Redeploy (AI Auto-Remediation)
  const handleApplyFix = async (fixedYaml?: string, injectedEnvs?: Record<string, string>) => {
    if (!activeDeployment) return;
    setErrorMessage(null);
    setIsApplyingFix(true);
    try {
      const updated = await applyFixAndRedeploy(activeDeployment.id, fixedYaml, injectedEnvs);
      setActiveDeployment(updated);
      setCurrentTab('deploy');
      refreshDeploymentsList();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to apply fix and redeploy');
      setIsApplyingFix(false);
    }
  };

  // Quick Demo for Judges
  const handleQuickDemo = async (scenario: string) => {
    setSelectedScenario(scenario);
    setErrorMessage(null);
    setIsAnalyzing(true);
    try {
      const result = await analyzeRepository(repoUrl, branch);
      setAnalysis(result);
      setIsPlanning(true);
      const infraPlan = await generateInfrastructurePlan(result);
      setPlan(infraPlan);
      const yaml = await generateZeropsYaml(result, infraPlan);
      setZeropsConfig(yaml);
      setIsPlanning(false);
      setIsAnalyzing(false);

      // Trigger immediate deployment with target scenario
      setIsDeploying(true);
      const dep = await triggerDeployment({
        analysis: result,
        plan: infraPlan,
        zeropsYaml: yaml.yamlContent,
        scenario,
        isLive: isLiveRequested,
      });

      setActiveDeployment(dep);
      setCurrentTab('deploy');
      refreshDeploymentsList();
    } catch (err: any) {
      setErrorMessage(err.message || 'Quick demo execution failed');
      setIsAnalyzing(false);
      setIsPlanning(false);
      setIsDeploying(false);
    }
  };

  const hasIncident = activeDeployment?.status === 'FAILED';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500 selection:text-zinc-950 font-sans antialiased">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        activeDeploymentId={activeDeployment?.id}
        hasIncident={hasIncident}
        systemHealth={systemHealth}
      />

      {/* Judge & Evaluator Interactive Control Panel */}
      <JudgeDemoBar
        selectedScenario={selectedScenario}
        setSelectedScenario={setSelectedScenario}
        isLiveRequested={isLiveRequested}
        setIsLiveRequested={setIsLiveRequested}
        onQuickDemo={handleQuickDemo}
        isDeploying={isDeploying || isAnalyzing}
      />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8 min-h-[calc(100vh-180px)] w-full overflow-x-hidden">
        {/* Global Error Banner if any */}
        {errorMessage && (
          <div className="flex items-center gap-3 rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span className="flex-1 font-medium">{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* Tab 1: Analyze & Project Intelligence */}
          {currentTab === 'analyze' && (
            <motion.div
              key="tab-analyze"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="space-y-8 min-h-[500px] w-full"
            >
              <RepoInputSection
                repoUrl={repoUrl}
                setRepoUrl={setRepoUrl}
                branch={branch}
                setBranch={setBranch}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
                presets={presets}
              />

              <AnimatePresence>
                {analysis && (
                  <motion.div
                    key="project-intelligence"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                    className="w-full"
                  >
                    <ProjectIntelligence
                      analysis={analysis}
                      onGeneratePlan={() => {
                        if (plan && zeropsConfig) {
                          setCurrentTab('plan');
                        } else {
                          handleGeneratePlan();
                        }
                      }}
                      isPlanning={isPlanning}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Tab 2: Architecture & zerops.yml */}
          {currentTab === 'plan' && (
            <motion.div
              key="tab-plan"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="space-y-6 min-h-[500px] w-full"
            >
              {analysis && plan && zeropsConfig ? (
                <InfrastructurePlanner
                  analysis={analysis}
                  plan={plan}
                  zeropsConfig={zeropsConfig}
                  onDeploy={handleDeploy}
                  isDeploying={isDeploying}
                  isLiveRequested={isLiveRequested}
                />
              ) : (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12 text-center text-zinc-400 space-y-3">
                  <p className="text-base font-semibold text-white">No active project analysis</p>
                  <p className="text-xs">Analyze a GitHub repository first to formulate the Zerops infrastructure topology.</p>
                  <button
                    onClick={() => setCurrentTab('analyze')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition-colors"
                  >
                    Go to Repository Input →
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Tab 3: Deployment Monitor & Terminal Logs */}
          {currentTab === 'deploy' && (
            <motion.div
              key="tab-deploy"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="space-y-6 min-h-[500px] w-full"
            >
              {activeDeployment ? (
                <DeploymentMonitor
                  deployment={activeDeployment}
                  onOpenDiagnosis={() => setCurrentTab('diagnosis')}
                  onRedeploy={() => handleDeploy(selectedScenario)}
                />
              ) : (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12 text-center text-zinc-400 space-y-3">
                  <p className="text-base font-semibold text-white">No active deployment</p>
                  <p className="text-xs">Start a deployment from the Architecture screen or trigger a judge demo scenario.</p>
                  <button
                    onClick={() => handleQuickDemo('success')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-emerald-400 transition-colors"
                  >
                    Run Demo Deployment →
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Tab 4: AI Diagnosis & Auto-Remediation */}
          {currentTab === 'diagnosis' && (
            <motion.div
              key="tab-diagnosis"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="space-y-6 min-h-[500px] w-full"
            >
              {activeDeployment?.diagnosis ? (
                <AiDiagnosisView
                  deployment={activeDeployment}
                  diagnosis={activeDeployment.diagnosis}
                  onApplyFix={handleApplyFix}
                  isApplyingFix={isApplyingFix}
                />
              ) : (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-12 text-center text-zinc-400 space-y-3">
                  <p className="text-base font-semibold text-white">No active incident diagnosed</p>
                  <p className="text-xs">
                    All systems are running normally. If a deployment fails, the Debug Agent will automatically inspect telemetry and formulate remediations here.
                  </p>
                  <button
                    onClick={() => handleQuickDemo('fail_database')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-zinc-950 hover:bg-amber-400 transition-colors"
                  >
                    Simulate Missing DATABASE_URL Incident & Diagnose →
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Tab 5: Deployment History */}
          {currentTab === 'history' && (
            <motion.div
              key="tab-history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="space-y-6 min-h-[500px] w-full"
            >
              <DeploymentHistory
                deployments={deploymentsList}
                onSelectDeployment={(dep) => {
                  setActiveDeployment(dep);
                  if (dep.status === 'FAILED') {
                    setCurrentTab('diagnosis');
                  } else {
                    setCurrentTab('deploy');
                  }
                }}
                activeId={activeDeployment?.id}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950/80 py-6 text-center text-xs text-zinc-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-300">DeployMate AI</span>
            <span>•</span>
            <span>Autonomous Multi-Agent DevOps</span>
            <span>•</span>
            <span className="text-emerald-400">Zerops Cloud Infrastructure</span>
          </div>
          <div className="text-[11px] text-zinc-600">
            Engineered with React 19, Express, Vite, Tailwind CSS & Gemini 3.7 AI Agents
          </div>
        </div>
      </footer>
    </div>
  );
}
