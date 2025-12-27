
import React, { memo, useEffect, useRef, useState } from 'react';
import { 
  AgentState, 
  AgentLog, 
  ResearchPaper, 
  SynthesisResult, 
  ResearchMode
} from '../types';
import LogStream from './LogStream';
import { 
  Activity, ShieldCheck, Settings, Database,
  TrendingUp, Star, Loader2,
  Lock, BarChart3, Globe,
  Workflow, Grid, X, CheckCircle2, Shield, Cpu, Link as LinkIcon, MoreHorizontal
} from 'lucide-react';
import { STEPS } from '../constants';
import gsap from 'gsap';

interface WorkstationProps {
  topic: string;
  setTopic: (t: string) => void;
  mode: ResearchMode;
  setMode: (m: ResearchMode) => void;
  state: AgentState;
  logs: AgentLog[];
  papers: ResearchPaper[];
  synthesis: SynthesisResult | null;
  onRun: () => void;
  activeStepIndex: number;
}

const Workstation: React.FC<WorkstationProps> = ({
  topic, setTopic, mode, setMode, state, logs, papers, synthesis, onRun, activeStepIndex
}) => {
  const workstationRef = useRef<HTMLDivElement>(null);
  const [activeModal, setActiveModal] = useState<'SETTINGS' | 'LIBRARY' | 'ANALYTICS' | 'NETWORK' | 'NONE'>('NONE');
  const [isLocked, setIsLocked] = useState(false);

  const isIdle = state === AgentState.IDLE || state === AgentState.COMPLETE;
  const progressPercent = activeStepIndex === -1 ? 0 : Math.round(((activeStepIndex + 1) / STEPS.length) * 100);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.from(".hud-sidebar", { x: -30, opacity: 0, duration: 0.8, ease: "expo.out" })
        .from(".hud-card", { 
          scale: 0.95, 
          opacity: 0, 
          y: 20, 
          stagger: 0.05, 
          duration: 0.8, 
          ease: "power3.out",
          clearProps: "all"
        }, "-=0.4");
    }, workstationRef);
    return () => ctx.revert();
  }, []);

  const closeModal = () => setActiveModal('NONE');

  return (
    <div ref={workstationRef} className={`flex h-[calc(100vh-80px)] overflow-hidden bg-[#020617] relative bio-grid-pattern transition-all duration-700 ${isLocked ? 'blur-2xl grayscale brightness-50 pointer-events-none' : ''}`}>
      <div className="scan-overlay" />
      
      {/* SIDEBAR */}
      <aside className="hud-sidebar w-14 flex flex-col items-center py-6 bg-slate-950/60 border-r border-white/5 gap-6 shrink-0 z-30">
        <button onClick={() => setActiveModal('NONE')} className="w-9 h-9 rounded-lg bg-medical-500/10 flex items-center justify-center text-medical-500 border border-medical-500/20 shadow-md mb-2 hover:scale-110 transition-transform"><Grid className="w-4 h-4" /></button>
        <nav className="flex flex-col gap-5 text-slate-600">
          <button onClick={() => setActiveModal('ANALYTICS')} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/5 hover:text-white ${activeModal === 'ANALYTICS' ? 'text-medical-400 bg-medical-500/5' : ''}`}><TrendingUp className="w-4 h-4" /></button>
          <button onClick={() => setActiveModal('NETWORK')} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/5 hover:text-white ${activeModal === 'NETWORK' ? 'text-medical-400 bg-medical-500/5' : ''}`}><Globe className="w-4 h-4" /></button>
          <button onClick={() => setActiveModal('LIBRARY')} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/5 hover:text-white ${activeModal === 'LIBRARY' ? 'text-medical-400 bg-medical-500/5' : ''}`}><Database className="w-4 h-4" /></button>
          <button onClick={() => setActiveModal('SETTINGS')} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/5 hover:text-white ${activeModal === 'SETTINGS' ? 'text-medical-400 bg-medical-500/5' : ''}`}><Settings className="w-4 h-4" /></button>
        </nav>
        <div className="mt-auto">
          <button onClick={() => setIsLocked(true)} className="w-9 h-9 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-700 hover:text-medical-400 transition-all"><Lock className="w-3.5 h-3.5" /></button>
        </div>
      </aside>

      <div className="flex-1 overflow-hidden grid grid-cols-12 h-full relative z-10">
        <div className="col-span-8 p-8 flex flex-col gap-8 overflow-y-auto custom-scrollbar h-full">
          
          {/* HUD METRICS */}
          <div className="grid grid-cols-4 gap-6">
             {[
               { label: 'PROGRESS', value: `${progressPercent}%`, icon: Activity, color: 'text-medical-400' },
               { label: 'CERTAINTY', value: synthesis?.gradeLevel || 'Pending', icon: Star, color: 'text-amber-500' },
               { label: 'SECURITY', value: 'Shield ON', icon: ShieldCheck, color: 'text-emerald-500' },
               { label: 'THREAD', value: !isIdle ? 'Active' : 'Idle', icon: Cpu, color: !isIdle ? 'text-indigo-400 animate-pulse' : 'text-slate-600' },
             ].map((m, i) => (
               <div key={i} className="hud-card workstation-card p-4 rounded-2xl relative group border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                     <m.icon className={`w-3.5 h-3.5 ${m.color}`} />
                     <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">{m.label}</span>
                  </div>
                  <div className={`text-xl font-black font-sans uppercase ${m.color === 'text-medical-400' ? 'text-glow' : 'text-white'}`}>
                    {m.value}
                  </div>
               </div>
             ))}
          </div>

          {!isIdle && (
            <div className="hud-card p-6 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl animate-in fade-in zoom-in-95">
               <div className="flex items-center gap-3 mb-4">
                 <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg">
                    <Cpu className="w-5 h-5 text-white animate-spin" />
                 </div>
                 <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none mb-0.5">Deep Reasoning Mode</h3>
                    <span className="text-[8px] font-mono text-indigo-400 uppercase font-black tracking-widest">32k Tokens Allocated</span>
                 </div>
               </div>
               <div className="h-1 w-full bg-indigo-500/10 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 w-1/3 animate-[loading_2s_ease-in-out_infinite]" />
               </div>
            </div>
          )}

          {/* EVIDENCE MATRIX */}
          {papers.length > 0 && (
            <div className="hud-card glass-hud rounded-3xl p-8 border-white/10">
               <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">Evidence Anchors</h3>
                  </div>
                  <span className="text-[8px] font-mono text-slate-500">NCBI LIVE ENDPOINT</span>
               </div>
               <div className="grid grid-cols-1 gap-3">
                  {papers.map((paper, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-900/40 rounded-xl border border-white/5 hover:border-medical-500/30 transition-all group">
                       <div className="flex items-center gap-4">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-black text-[10px] border ${
                            paper.riskOfBias === 'LOW' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                            'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}>
                            {paper.riskOfBias[0]}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white mb-0.5 group-hover:text-medical-400 transition-colors line-clamp-1">{paper.title}</div>
                            <div className="flex gap-3">
                              <span className="text-[8px] text-slate-500 font-mono uppercase font-black">{paper.journal} • {paper.year}</span>
                            </div>
                          </div>
                       </div>
                       <a href={`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}`} target="_blank" rel="noreferrer" className="p-2 bg-white/5 hover:bg-medical-500 hover:text-slate-950 rounded-lg transition-all"><LinkIcon className="w-3.5 h-3.5" /></a>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* WORKFLOW STEPS */}
          <div className="hud-card glass-hud rounded-3xl p-8 border-white/10">
             <div className="flex items-center gap-3 mb-8">
                <Workflow className="w-6 h-6 text-medical-500" />
                <h3 className="text-sm font-black uppercase tracking-widest text-white">Orchestration Cycle</h3>
             </div>
             <div className="space-y-3">
               {STEPS.map((step, idx) => {
                 const isActive = idx === activeStepIndex;
                 const isCompleted = idx < activeStepIndex;
                 const Icon = step.icon;
                 return (
                   <div key={step.id} className={`flex items-center gap-5 p-5 rounded-2xl border transition-all duration-700 ${isActive ? 'bg-medical-500/5 border-medical-500/40 scale-[1.01]' : 'border-white/5 bg-slate-900/10 opacity-60'}`}>
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-medical-500 text-slate-950' : isCompleted ? 'bg-slate-800 text-emerald-400' : 'bg-slate-900 text-slate-700'}`}><Icon className="w-5 h-5" /></div>
                     <div className="flex-1">
                        <h4 className={`text-xs font-black mb-0.5 tracking-tight ${isActive ? 'text-white' : 'text-slate-400'}`}>{step.label}</h4>
                        <p className="text-[10px] text-slate-500 font-medium line-clamp-1">{step.description}</p>
                     </div>
                     {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                     {isActive && <Loader2 className="w-4 h-4 text-medical-500 animate-spin" />}
                   </div>
                 );
               })}
             </div>
          </div>
        </div>

        {/* TELEMETRY PANEL */}
        <aside className="hud-sidebar col-span-4 border-l border-white/5 flex flex-col bg-slate-950/40 backdrop-blur-3xl h-full overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-medical-500 animate-pulse" /><span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Telemetry</span></div>
            <button className="text-slate-700 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"><MoreHorizontal className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-hidden h-full"><LogStream logs={logs} /></div>
          <div className="p-8 border-t border-white/5 space-y-6">
             <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[9px] font-black uppercase text-white">Kernel Stable</span></div>
             <div className="bg-slate-900/60 p-6 rounded-2xl border border-white/5 relative group">
                <div className="flex items-center gap-3 mb-3"><ShieldCheck className="w-4 h-4 text-medical-500" /><span className="text-[9px] font-black uppercase text-white tracking-[0.2em]">Integrity Shield</span></div>
                <p className="text-[9px] text-slate-600 font-mono leading-relaxed font-bold">Encrypted AES-256.<br />Hallucination-free engine.</p>
             </div>
          </div>
        </aside>
      </div>

      {activeModal !== 'NONE' && (
        <div className="absolute inset-0 z-[300] flex items-center justify-center p-12">
          <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-3xl animate-in fade-in duration-500" onClick={closeModal} />
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-3xl max-h-[75vh] overflow-hidden shadow-2xl relative z-10 flex flex-col animate-in zoom-in-95 duration-400">
            <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-lg bg-medical-500/10 flex items-center justify-center text-medical-500 border border-medical-500/20">
                    {activeModal === 'SETTINGS' && <Settings className="w-6 h-6" />}
                    {activeModal === 'LIBRARY' && <Database className="w-6 h-6" />}
                    {activeModal === 'ANALYTICS' && <BarChart3 className="w-6 h-6" />}
                    {activeModal === 'NETWORK' && <Globe className="w-6 h-6" />}
                 </div>
                 <div>
                    <h2 className="text-xl font-black text-white tracking-tighter uppercase">{activeModal}</h2>
                    <p className="text-[8px] text-slate-600 font-mono tracking-widest uppercase font-black">Core Terminal</p>
                 </div>
              </div>
              <button onClick={closeModal} className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center border border-white/5"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="text-center text-slate-500 py-10 font-mono text-xs italic">Interface initialized. Monitoring active cluster...</div>
            </div>
          </div>
        </div>
      )}
      
      <style>{`@keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }`}</style>
    </div>
  );
};

export default memo(Workstation);
