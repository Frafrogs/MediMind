
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
  const [activeModal, setActiveModal] = useState<'PARAMÈTRES' | 'BIBLIOTHÈQUE' | 'ANALYSES' | 'RÉSEAU' | 'NONE'>('NONE');
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
      
      <aside className="hud-sidebar w-14 flex flex-col items-center py-6 bg-slate-950/60 border-r border-white/5 gap-6 shrink-0 z-30">
        <button onClick={() => setActiveModal('NONE')} className="w-9 h-9 rounded-lg bg-medical-500/10 flex items-center justify-center text-medical-500 border border-medical-500/20 shadow-md mb-2 hover:scale-110 transition-transform"><Grid className="w-4 h-4" /></button>
        <nav className="flex flex-col gap-5 text-slate-600">
          <button onClick={() => setActiveModal('ANALYSES')} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/5 hover:text-white ${activeModal === 'ANALYSES' ? 'text-medical-400 bg-medical-500/5' : ''}`} title="Analyses"><TrendingUp className="w-4 h-4" /></button>
          <button onClick={() => setActiveModal('RÉSEAU')} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/5 hover:text-white ${activeModal === 'RÉSEAU' ? 'text-medical-400 bg-medical-500/5' : ''}`} title="Réseau Global"><Globe className="w-4 h-4" /></button>
          <button onClick={() => setActiveModal('BIBLIOTHÈQUE')} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/5 hover:text-white ${activeModal === 'BIBLIOTHÈQUE' ? 'text-medical-400 bg-medical-500/5' : ''}`} title="Bibliothèque de Preuves"><Database className="w-4 h-4" /></button>
          <button onClick={() => setActiveModal('PARAMÈTRES')} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/5 hover:text-white ${activeModal === 'PARAMÈTRES' ? 'text-medical-400 bg-medical-500/5' : ''}`} title="Paramètres Système"><Settings className="w-4 h-4" /></button>
        </nav>
        <div className="mt-auto">
          <button onClick={() => setIsLocked(true)} className="w-9 h-9 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-700 hover:text-medical-400 transition-all" title="Verrouiller"><Lock className="w-3.5 h-3.5" /></button>
        </div>
      </aside>

      <div className="flex-1 overflow-hidden grid grid-cols-12 h-full relative z-10">
        <div className="col-span-8 p-8 flex flex-col gap-8 overflow-y-auto custom-scrollbar h-full scroll-smooth">
          
          <div className="grid grid-cols-4 gap-6">
             {[
               { label: 'PROGRESSION', value: `${progressPercent}%`, icon: Activity, color: 'text-medical-400' },
               { label: 'CERTITUDE', value: synthesis?.gradeLevel || 'En attente', icon: Star, color: 'text-amber-500' },
               { label: 'SÉCURITÉ', value: 'Bouclier ACTIF', icon: ShieldCheck, color: 'text-emerald-500' },
               { label: 'THREAD', value: !isIdle ? 'Actif' : 'Veille', icon: Cpu, color: !isIdle ? 'text-indigo-400 animate-pulse' : 'text-slate-600' },
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
                    <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none mb-0.5">Raisonnement Approfondi</h3>
                    <span className="text-[8px] font-mono text-indigo-400 uppercase font-black tracking-widest">32k Tokens Alloués</span>
                 </div>
               </div>
               <div className="h-1 w-full bg-indigo-500/10 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 w-1/3 animate-[loading_2s_ease-in-out_infinite]" />
               </div>
            </div>
          )}

          <div className="hud-card glass-hud rounded-3xl p-8 border-white/10 relative">
             <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-3">
                  <Workflow className="w-6 h-6 text-medical-500" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-white">Cycle d'Orchestration</h3>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/50 rounded-full border border-white/5">
                   <span className="w-1.5 h-1.5 rounded-full bg-medical-500 animate-pulse" />
                   <span className="text-[8px] font-mono font-black text-slate-400 uppercase tracking-widest">Exécution Directe</span>
                </div>
             </div>
             
             <div className="relative max-h-[500px] overflow-y-auto custom-scrollbar pr-4">
                <div className="absolute left-[23px] top-[24px] bottom-[24px] w-0.5 bg-slate-800 rounded-full z-0">
                    <div 
                      className="w-full bg-medical-500 shadow-[0_0_15px_rgba(20,184,166,0.6)] transition-all duration-1000 ease-in-out rounded-full"
                      style={{ height: `${activeStepIndex === -1 ? 0 : (activeStepIndex / (STEPS.length - 1)) * 100}%` }}
                    />
                </div>

                <div className="space-y-4 relative z-10">
                  {STEPS.map((step, idx) => {
                    const isActive = idx === activeStepIndex;
                    const isCompleted = idx < activeStepIndex;
                    const Icon = step.icon;
                    
                    return (
                      <div key={step.id} className={`flex items-center gap-5 p-5 rounded-2xl border transition-all duration-500 ${
                        isActive ? 'bg-medical-500/10 border-medical-500/40 translate-x-1 ring-1 ring-medical-500/20' : 
                        isCompleted ? 'border-white/5 bg-slate-900/10' :
                        'border-transparent bg-transparent opacity-20 grayscale scale-[0.98]'
                      }`}>
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 relative transition-all duration-500 ${
                          isActive ? 'bg-medical-500 text-slate-950 shadow-[0_0_25px_rgba(20,184,166,0.4)] scale-110' : 
                          isCompleted ? 'bg-slate-800 text-emerald-400 border border-emerald-500/20' : 
                          'bg-slate-900 text-slate-700'
                        }`}>
                            <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
                            {isActive && (
                              <div className="absolute -inset-1 rounded-xl border border-medical-500/50 animate-[ping_2s_linear_infinite]" />
                            )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className={`text-xs font-black uppercase tracking-tight transition-colors duration-500 ${isActive ? 'text-white' : isCompleted ? 'text-slate-300' : 'text-slate-500'}`}>
                                {step.label}
                              </h4>
                            </div>
                            <p className={`text-[10px] font-medium leading-tight transition-colors duration-500 ${isActive ? 'text-medical-400/80' : 'text-slate-600'}`}>
                              {step.description}
                            </p>
                        </div>

                        <div className="shrink-0 w-8 flex justify-center">
                          {isCompleted && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-in zoom-in" />
                          )}
                          {isActive && <Loader2 className="w-5 h-5 text-medical-500 animate-spin" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
             </div>
          </div>

          {papers.length > 0 && (
            <div className="hud-card glass-hud rounded-3xl p-8 border-white/10">
               <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">Ancres de Preuves</h3>
                  </div>
               </div>
               <div className="grid grid-cols-1 gap-3">
                  {papers.map((paper, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-900/40 rounded-xl border border-white/5 hover:border-medical-500/30 transition-all group">
                       <div className="flex items-center gap-4">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono font-black text-[10px] border ${
                            paper.riskOfBias === 'LOW' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                            'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}>
                            {paper.riskOfBias?.[0] || 'U'}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white mb-0.5 group-hover:text-medical-400 transition-colors line-clamp-1">{paper.title}</div>
                            <span className="text-[8px] text-slate-500 font-mono uppercase font-black">{paper.journal} • {paper.year}</span>
                          </div>
                       </div>
                       <a href={`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}`} target="_blank" rel="noreferrer" className="p-2 bg-white/5 hover:bg-medical-500 hover:text-slate-950 rounded-lg transition-all"><LinkIcon className="w-3.5 h-3.5" /></a>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>

        <aside className="hud-sidebar col-span-4 border-l border-white/5 flex flex-col bg-slate-950/40 backdrop-blur-3xl h-full overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-medical-500 animate-pulse" /><span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Télémétrie</span></div>
            <button className="text-slate-700 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"><MoreHorizontal className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-hidden h-full"><LogStream logs={logs} /></div>
          <div className="p-8 border-t border-white/5 space-y-6">
             <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[9px] font-black uppercase text-white">Noyau Stable</span></div>
             <div className="bg-slate-900/60 p-6 rounded-2xl border border-white/5 relative group">
                <div className="flex items-center gap-3 mb-3"><ShieldCheck className="w-4 h-4 text-medical-500" /><span className="text-[9px] font-black uppercase text-white tracking-[0.2em]">Bouclier d'Intégrité</span></div>
                <p className="text-[9px] text-slate-600 font-mono leading-relaxed font-bold">Chiffré AES-256.<br />Moteur sans hallucination.</p>
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
                    {activeModal === 'PARAMÈTRES' && <Settings className="w-6 h-6" />}
                    {activeModal === 'BIBLIOTHÈQUE' && <Database className="w-6 h-6" />}
                    {activeModal === 'ANALYSES' && <BarChart3 className="w-6 h-6" />}
                    {activeModal === 'RÉSEAU' && <Globe className="w-6 h-6" />}
                 </div>
                 <div>
                    <h2 className="text-xl font-black text-white tracking-tighter uppercase">{activeModal}</h2>
                 </div>
              </div>
              <button onClick={closeModal} className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center border border-white/5"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="text-center text-slate-500 py-10 font-mono text-xs italic">Interface initialisée. Surveillance du cluster actif...</div>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }
        .text-glow {
          text-shadow: 0 0 10px rgba(20, 184, 166, 0.5);
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(20,184,166,0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(20,184,166,0.4); }
      `}</style>
    </div>
  );
};

export default memo(Workstation);
