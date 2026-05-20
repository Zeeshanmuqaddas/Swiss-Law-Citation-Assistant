import React, { useState, useEffect } from 'react';
import { Network, Database, Scale, ShieldCheck, Activity, Search, Loader2, PlayCircle, GitMerge, Mail, Cloud, Server, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Markdown from 'react-markdown';

export default function MultiAgentChat() {
  const [query, setQuery] = useState('An employee was terminated without notice after 15 years because they sent one angry email to management. Is this legal in Switzerland?');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [emailDraft, setEmailDraft] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentStatus, setEmailSentStatus] = useState<string | null>(null);
  
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<any>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (taskId && taskStatus?.status !== 'completed' && taskStatus?.status !== 'error') {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/task-status/${taskId}`);
          if (res.ok) {
            const data = await res.json();
            setTaskStatus(data);
          }
        } catch (e) {
          console.error("Polling error:", e);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [taskId, taskStatus?.status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);
    setEmailDraft(null);
    setEmailError(null);
    setEmailSentStatus(null);
    setTaskId(null);
    setTaskStatus(null);

    try {
      const res = await fetch('/api/multi-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      if (!res.ok) throw new Error("Failed to process through multi-agent orchestration");
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDispatchPipeline = async () => {
    if (!result || !recipientEmail) return;
    setIsSendingEmail(true);
    setTaskId(null);
    setTaskStatus(null);
    setEmailSentStatus(null);
    
    try {
      const res = await fetch('/api/submit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          recipient_name: "Legal Stakeholder",
          recipient_email: recipientEmail,
          context: result
        })
      });
      if (!res.ok) throw new Error("Failed to dispatch to pipeline");
      const data = await res.json();
      setTaskId(data.taskId);
    } catch (err: any) {
       setEmailSentStatus(`Error: ${err.message}`);
       setIsSendingEmail(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Cloud Architecture Overview */}
      <div className="glass-panel p-6 border-blue-500/20 bg-blue-500/5 mb-8">
        <div className="flex items-center gap-2 mb-4 text-blue-400">
          <Cloud className="w-5 h-5" />
          <h2 className="font-mono text-sm uppercase tracking-widest font-bold">Cloud-Native Event Architecture</h2>
        </div>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 py-4 text-sm font-mono opacity-80 text-center relative">
           
           <div className="flex-1 min-w-[140px] p-3 border border-[var(--color-line)] rounded-lg bg-black/40">
             <div className="text-white mb-1"><Server className="w-4 h-4 mx-auto mb-2 opacity-50" />API Gateway</div>
             <div className="text-[10px] text-blue-300">FastAPI/Cloud Run</div>
           </div>
           
           <ArrowRight className="w-4 h-4 hidden lg:block opacity-30 shrink-0" />
           <div className="h-4 w-[1px] bg-white/20 lg:hidden shrink-0"></div>

           <div className="flex-1 min-w-[140px] p-3 border border-orange-500/30 rounded-lg bg-orange-500/10">
             <div className="text-orange-200 mb-1"><Activity className="w-4 h-4 mx-auto mb-2 opacity-50" />Pub/Sub Bus</div>
             <div className="text-[10px] text-orange-400">legal-requests</div>
           </div>

           <ArrowRight className="w-4 h-4 hidden lg:block opacity-30 shrink-0" />
           <div className="h-4 w-[1px] bg-white/20 lg:hidden shrink-0"></div>
           
           <div className="flex-1 min-w-[200px] p-3 border border-accent/40 rounded-lg bg-accent/10">
             <div className="text-white mb-1"><Network className="w-4 h-4 mx-auto mb-2 text-accent" />Orchestrator Worker</div>
             <div className="text-[10px] text-accent/80">3-Agent Pipeline Layer</div>
           </div>

           <ArrowRight className="w-4 h-4 hidden lg:block opacity-30 shrink-0" />
           <div className="h-4 w-[1px] bg-white/20 lg:hidden shrink-0"></div>

           <div className="flex-1 min-w-[140px] p-3 border border-green-500/30 rounded-lg bg-green-500/10">
             <div className="text-green-200 mb-1"><Mail className="w-4 h-4 mx-auto mb-2 text-green-400" />Email Worker</div>
             <div className="text-[10px] text-green-400">SMTP Delivery</div>
           </div>

        </div>
      </div>

      <div className="glass-panel p-6 mb-8">
        <h2 className="font-serif text-2xl font-medium mb-3 flex items-center gap-3 text-white">
          <Network className="w-6 h-6 text-accent" />
          Autonomous Agentic Workflow
        </h2>
        <p className="text-sm opacity-70 mb-6 leading-relaxed max-w-3xl">
          Enter a complex legal scenario. The Central Orchestrator Agent will distribute the query across specialized sub-agents to retrieve citations, analyze precedents, evaluate compliance risks, and simulate alternate outcomes in a parallel pipeline.
        </p>

        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex flex-col md:flex-row gap-4 items-start md:items-center">
            <Search className="absolute left-4 top-4 w-5 h-5 opacity-40 shrink-0" />
            <textarea 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Describe a legal scenario (e.g. employee termination without notice...)"
              className="w-full bg-black/40 border border-[var(--color-line)] rounded-xl py-3 pl-12 pr-4 font-sans text-base focus:outline-none focus:border-accent/50 transition-colors min-h-[60px]"
              disabled={isProcessing}
            />
            <button 
              type="submit"
              disabled={isProcessing || !query.trim()}
              className="px-8 py-4 bg-[var(--color-ink)] text-[var(--color-bg)] rounded-xl font-medium hover:bg-accent hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap min-w-[160px]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Orchestrating...
                </>
              ) : (
                 <>
                   <PlayCircle className="w-5 h-5" />
                   Run Agents
                 </>
              )}
            </button>
          </div>
          {error && <p className="text-red-400 mt-3 font-mono text-sm">{error}</p>}
        </form>
      </div>

      <AnimatePresence mode="wait">
        {result && (
           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="grid lg:grid-cols-2 gap-6"
           >
             {/* Explainable Summary (Orchestrator Output) */}
             <div className="lg:col-span-2 glass-panel p-6 border-accent/30 bg-accent/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                  <div className="col-header flex items-center gap-2 text-accent">
                    <GitMerge className="w-4 h-4" /> Orchestrator Synthesis & Explainable Reasoning
                  </div>
                </div>
                <div className="prose prose-invert max-w-none text-white/90">
                  <p className="leading-relaxed text-lg font-serif">{result.explainable_summary}</p>
                </div>
                
                {emailError && (
                  <p className="text-red-400 mt-4 text-sm font-mono border-l-2 border-red-500 pl-3">{emailError}</p>
                )}
             </div>

              {/* Cloud-Native Dispatch Pipeline Output */}
             {result && (
                <div className="lg:col-span-2 glass-panel p-6 border-white/20 bg-white/5 relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-accent opacity-50"></div>
                  <div className="col-header flex items-center justify-between mb-4 text-white">
                    <div className="flex items-center gap-2">
                       <Cloud className="w-4 h-4" /> Cloud-Native Event Pipeline (Pub/Sub)
                    </div>
                  </div>
                  
                  <div className="p-4 bg-black/20 rounded-xl border border-[var(--color-line)] mt-2">
                    <h4 className="text-sm font-mono tracking-wide mb-3 opacity-80 uppercase">Delivery Agent Config</h4>
                    <div className="flex flex-col sm:flex-row gap-3 items-start">
                      <div className="flex-1 w-full">
                        <input 
                          type="email" 
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          placeholder="Recipient Email (e.g. lawyer@example.com)"
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 font-mono text-sm focus:outline-none focus:border-accent/50 text-white"
                          disabled={isSendingEmail || (taskStatus?.status === 'queued' || taskStatus?.status === 'processing')}
                        />
                      </div>
                      <button
                        onClick={handleDispatchPipeline}
                        disabled={isSendingEmail || !recipientEmail || taskStatus?.status === 'processing'}
                        className="px-6 py-2 bg-accent/20 hover:bg-accent/30 text-accent rounded-lg font-medium transition-colors disabled:opacity-50 whitespace-nowrap flex items-center justify-center gap-2 h-[38px]"
                      >
                        {isSendingEmail && taskStatus?.status !== 'completed' && taskStatus?.status !== 'error' ? (
                           <><Loader2 className="w-4 h-4 animate-spin" /> Orchestrating...</>
                        ) : (
                           <><PlayCircle className="w-4 h-4" /> Dispatch Pipeline</>
                        )}
                      </button>
                    </div>
                    {emailSentStatus && (
                      <p className={`mt-3 text-sm font-mono ${emailSentStatus.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
                        {emailSentStatus}
                      </p>
                    )}
                  </div>

                  {taskId && (
                    <div className="mt-6 bg-black/40 rounded-xl p-5 border border-white/10">
                      <div className="flex items-center gap-4 mb-4 font-mono text-xs text-white/50 border-b border-white/10 pb-3">
                        <span className="flex items-center gap-2">
                           <Server className="w-3 h-3" /> Task ID: {taskId}
                        </span>
                        <span className={`px-2 py-1 rounded bg-white/5 text-white/70 uppercase tracking-widest ${
                          taskStatus?.status === 'completed' ? 'text-green-400 bg-green-500/10' :
                          taskStatus?.status === 'error' ? 'text-red-400 bg-red-500/10' :
                          'text-accent'
                        }`}>
                          {taskStatus?.status || 'dispatched'}
                        </span>
                      </div>
                      
                      <div className="space-y-3 font-mono text-sm">
                        {taskStatus?.logs?.map((log: any, idx: number) => (
                           <div key={idx} className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start">
                             <div className="text-white/30 text-xs shrink-0 mt-0.5">{new Date(log.time).toLocaleTimeString()}</div>
                             <div className={`px-2 py-0.5 rounded text-xs shrink-0 w-[100px] text-center ${
                               log.agent === 'Orchestrator' ? 'bg-blue-500/20 text-blue-300' :
                               log.agent === 'Summarizer' ? 'bg-purple-500/20 text-purple-300' :
                               log.agent === 'Validator' ? 'bg-yellow-500/20 text-yellow-300' :
                               log.agent === 'Composer' ? 'bg-pink-500/20 text-pink-300' :
                               log.agent === 'Delivery' ? 'bg-green-500/20 text-green-300' :
                               'bg-white/10 text-white/50'
                             }`}>{log.agent}</div>
                             <div className="text-white/80">{log.message}</div>
                           </div>
                        ))}
                        {taskStatus?.status === 'processing' && (
                           <div className="flex items-center gap-2 text-white/30 mt-2">
                             <Loader2 className="w-3 h-3 animate-spin" /> Processing next step...
                           </div>
                        )}
                      </div>
                    </div>
                  )}

                  {taskStatus?.emailDraft && taskStatus?.status === 'completed' && (
                     <div className="mt-6 bg-black/40 rounded-xl p-5 border border-green-500/20 text-sm/relaxed text-white/90 font-serif mb-4 overflow-y-auto max-h-[400px]">
                        <div className="col-header flex items-center gap-2 mb-4 text-green-400 border-b border-green-500/20 pb-3">
                           <CheckCircle2 className="w-4 h-4" /> Generated & Delivered Draft
                        </div>
                        <div className="markdown-body prose prose-invert max-w-none">
                          <Markdown>{taskStatus.emailDraft}</Markdown>
                        </div>
                     </div>
                  )}
                </div>
             )}

             {/* Retrieval Agent */}
             <div className="glass-panel p-6 space-y-4">
               <div className="col-header flex items-center gap-2 border-b border-[var(--color-line)] pb-3">
                 <Database className="w-4 h-4 text-blue-400" /> Citation Retrieval Agent
               </div>
               <div className="space-y-4">
                 {result.retrieval_agent.map((item: any, i: number) => (
                   <div key={i} className="p-3 bg-black/20 rounded-lg border border-[var(--color-line)]">
                     <h4 className="font-mono text-sm text-blue-300 mb-1">{item.citation}</h4>
                     <p className="text-sm opacity-80">{item.explanation}</p>
                   </div>
                 ))}
               </div>
             </div>

             {/* Precedent Analysis Agent */}
             <div className="glass-panel p-6 space-y-4">
               <div className="col-header flex items-center gap-2 border-b border-[var(--color-line)] pb-3">
                 <Scale className="w-4 h-4 text-purple-400" /> Precedent Analysis Agent
               </div>
               <p className="text-sm/relaxed opacity-90">{result.precedent_agent.summary}</p>
               <div className="space-y-3 mt-4">
                  {result.precedent_agent.key_cases.map((kc: any, i: number) => (
                    <div key={i} className="flex flex-col gap-1 text-sm border-l-2 border-purple-500/30 pl-3">
                      <span className="font-mono font-medium text-purple-300">{kc.case_citation}</span>
                      <span className="opacity-70">{kc.ruling_trend}</span>
                    </div>
                  ))}
               </div>
             </div>

             {/* Compliance Checker Agent */}
             <div className="glass-panel p-6 space-y-4">
               <div className="col-header flex items-center gap-2 border-b border-[var(--color-line)] pb-3">
                 <ShieldCheck className="w-4 h-4 text-green-400" /> Compliance Checker Agent
               </div>
               
               <div className="flex items-center justify-between mb-2">
                 <span className="text-sm opacity-60">Calculated Risk Level:</span>
                 <span className={`px-3 py-1 text-xs font-mono font-bold rounded uppercase tracking-wider ${
                    result.compliance_agent.overall_risk_level === 'High' || result.compliance_agent.overall_risk_level === 'Critical' 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                      : result.compliance_agent.overall_risk_level === 'Medium'
                      ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
                      : 'bg-green-500/20 text-green-400 border border-green-500/30'
                 }`}>
                   {result.compliance_agent.overall_risk_level}
                 </span>
               </div>
               
               <p className="text-sm opacity-80">{result.compliance_agent.assessment}</p>
               
               {result.compliance_agent.flagged_risks.length > 0 && (
                 <div className="mt-4 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                   <span className="text-xs font-mono text-red-400 mb-2 block uppercase">Flagged Risks</span>
                   <ul className="list-disc pl-4 text-sm opacity-80 space-y-1">
                     {result.compliance_agent.flagged_risks.map((risk: string, i: number) => (
                       <li key={i} className="text-red-200">{risk}</li>
                     ))}
                   </ul>
                 </div>
               )}
             </div>

             {/* Simulation Agent */}
             <div className="glass-panel p-6 space-y-4">
               <div className="col-header flex items-center gap-2 border-b border-[var(--color-line)] pb-3">
                 <Activity className="w-4 h-4 text-orange-400" /> "What-If" Simulation Agent
               </div>
               <div className="space-y-4">
                 <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-1 h-full bg-orange-500/50"></div>
                   <span className="block text-xs font-mono text-orange-300 mb-2 uppercase opacity-70">Hypothetical Scenario</span>
                   <p className="text-sm opacity-90">{result.simulation_agent.what_if_scenario}</p>
                 </div>
                 <div className="p-4 bg-black/30 border border-white/5 rounded-lg">
                   <span className="block text-xs font-mono mb-2 uppercase opacity-50">Predicted Legal Outcome</span>
                   <p className="text-sm font-medium opacity-90 text-orange-100">{result.simulation_agent.predicted_outcome}</p>
                 </div>
               </div>
             </div>

           </motion.div>
        )}
      </AnimatePresence>
      
      {!result && !isProcessing && (
        <div className="text-center py-20 opacity-30 border border-dashed border-[var(--color-line)] rounded-xl">
           <Network className="w-12 h-12 mx-auto mb-4" />
           <p className="font-serif italic text-lg">Central Orchestrator is standing by for input scenario.</p>
        </div>
      )}
    </div>
  );
}
