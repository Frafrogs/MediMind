
import React, { useState, useCallback, useMemo } from 'react';
import { 
  AgentState, 
  ScientificArticle, 
  DetailedThesis,
  AgentLog,
  AppView,
  ResearchMode
} from './types';
import { generateFullThesis } from './services/thesisEngine';
import ArticleView from './components/ArticleView';
import LandingPage from './components/LandingPage';
import Workstation from './components/Workstation';
import Logo from './components/Logo';
import { STEPS } from './constants';
import { Search, Zap, Loader2, CheckCircle2 } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('LANDING');
  const [topic, setTopic] = useState<string>('Immunothérapie CAR T et Glioblastome');
  const [mode, setMode] = useState<ResearchMode>('RESEARCHER');
  const [state, setState] = useState<AgentState>(AgentState.IDLE);
  const [showProfile, setShowProfile] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [finalThesis, setFinalThesis] = useState<DetailedThesis | null>(null);

  const addLog = useCallback((message: string, type: AgentLog['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      message,
      type
    }]);
  }, []);

  const runMultiAgentPipeline = async () => {
    if (!process.env.API_KEY) {
      alert("Erreur : Clé API non configurée.");
      return;
    }

    setLogs([]);
    setFinalThesis(null);
    
    try {
      addLog(`MediMind Kernel v3.5 Initialized. Language: FR.`, 'info');
      
      setState(AgentState.RETRIEVAL);
      const thesis = await generateFullThesis(topic, mode, (msg, type) => addLog(msg, type));
      setFinalThesis(thesis);
      
      setState(AgentState.COMPLETE);
      addLog("Mission certifiée. Audit d'intégrité complété.", 'success');
      
      setIsFinishing(true);
      setTimeout(() => {
        setIsFinishing(false);
        setView('REPORT');
      }, 3000);

    } catch (error: any) {
      let friendlyMessage = error.message || "Unknown Error";
      if (friendlyMessage.includes('429') || friendlyMessage.includes('RESOURCE_EXHAUSTED')) {
        friendlyMessage = "API Quota Exceeded. Please wait a few minutes.";
      }
      addLog(`System Error : ${friendlyMessage}`, 'error');
      setState(AgentState.ERROR);
    }
  };

  const activeStepIndex = useMemo(() => {
    if (state === AgentState.IDLE) return -1;
    if (state === AgentState.COMPLETE) return STEPS.length;
    return STEPS.findIndex(s => s.id === state);
  }, [state]);

  const isIdle = state === AgentState.IDLE || state === AgentState.COMPLETE;

  // Mocked for ArticleView compatibility
  const mockArticle: ScientificArticle | null = finalThesis ? {
    title: finalThesis.title,
    abstract: finalThesis.chapters[0].sections[0].content.substring(0, 500),
    introduction: finalThesis.chapters[0].sections[0].content,
    methodology: finalThesis.chapters[1].sections[0].content,
    analysisPlan: finalThesis.chapters[2].sections[0].content,
    implications: finalThesis.chapters[3].sections[0].content,
    uncertaintyZones: finalThesis.chapters[4].sections[0].content,
    references: ["Vancouver Bibliography Compiled in Thesis View"]
  } : null;

  if (view === 'LANDING') return <LandingPage onStart={() => setView('DASHBOARD')} />;
  if (view === 'REPORT') return <ArticleView article={mockArticle} thesis={finalThesis} onBack={() => setView('DASHBOARD')} />;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-medical-500/30">
      
      {isFinishing && (
        <div className="fixed inset-0 z-[1000] bg-slate-950 flex flex-col items-center justify-center animate-in fade-in duration-700">
           <div className="w-24 h-24 bg-medical-500 rounded-[2rem] flex items-center justify-center mb-10 shadow-[0_0_80px_rgba(20,184,166,0.5)] animate-bounce">
              <CheckCircle2 className="w-12 h-12 text-slate-950" />
           </div>
           <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Integrity Audit Complete</h2>
           <p className="text-slate-500 font-mono text-sm tracking-widest uppercase">Generating Certified Clinical Report...</p>
        </div>
      )}

      <header className="h-20 border-b border-white/5 bg-slate-950 sticky top-0 z-[100] px-8 flex items-center justify-between shadow-2xl backdrop-blur-3xl bg-opacity-90">
        <div className="flex items-center gap-6 shrink-0">
          <Logo className="w-12 h-12 shadow-[0_0_20px_rgba(20,184,166,0.2)]" />
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-white tracking-tight leading-none mb-1">MediMind</h1>
            <span className="text-[10px] font-mono text-medical-500 uppercase tracking-[0.3em] font-black">Agentic Researcher</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-12 gap-6 max-w-5xl">
          <div className="flex-1 flex items-center gap-3 bg-slate-900/60 px-5 py-2.5 rounded-xl border border-white/5 shadow-inner focus-within:border-medical-500/30 transition-all group">
            <Search className="w-4 h-4 text-slate-600 group-focus-within:text-medical-500 transition-colors" />
            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} disabled={!isIdle} className="bg-transparent border-none text-white w-full focus:ring-0 text-sm font-bold placeholder:text-slate-700 font-sans" placeholder="Sujet de recherche doctoral..." />
          </div>

          <button onClick={runMultiAgentPipeline} disabled={!isIdle || !topic.trim()} className={`px-6 py-2.5 rounded-xl font-black text-[10px] tracking-widest flex items-center gap-3 transition-all transform active:scale-95 disabled:opacity-30 shadow-2xl shrink-0 ${!isIdle ? 'bg-white text-slate-950' : 'bg-medical-500/10 text-medical-400 border border-medical-500/30 hover:bg-medical-500/20'}`}>
            {!isIdle ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
            {isIdle ? 'LAUNCH_AGENTS' : 'PROCESSING'}
          </button>
        </div>
        
        <div className="flex items-center gap-4 relative shrink-0">
             <button onClick={() => setShowProfile(!showProfile)} className="w-10 h-10 rounded-full bg-slate-800 border-2 border-medical-500/20 flex items-center justify-center text-white font-bold text-xs ring-4 ring-medical-500/5 hover:ring-medical-500/10 transition-all shadow-inner">MD</button>
        </div>
      </header>

      <Workstation 
        topic={topic} 
        setTopic={setTopic} 
        mode={mode} 
        setMode={setMode} 
        state={state} 
        logs={logs} 
        papers={[]} 
        synthesis={null} 
        onRun={runMultiAgentPipeline} 
        activeStepIndex={activeStepIndex} 
      />
    </div>
  );
};

export default App;
