
import React, { useState, useCallback, useMemo } from 'react';
import { 
  AgentState, 
  ScientificArticle, 
  DetailedThesis,
  AgentLog,
  AppView,
  ResearchMode,
  ResearchPaper
} from './types';
import { generateFullThesis } from './services/thesisEngine';
import ArticleView from './components/ArticleView';
import LandingPage from './components/LandingPage';
import Workstation from './components/Workstation';
import Logo from './components/Logo';
import { STEPS } from './constants';
import { Search, Zap, Loader2, CheckCircle2, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('LANDING');
  const [topic, setTopic] = useState<string>('Immunothérapie CAR T et Glioblastome');
  const [mode, setMode] = useState<ResearchMode>('RESEARCHER');
  const [state, setState] = useState<AgentState>(AgentState.IDLE);
  const [showProfile, setShowProfile] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [isQuotaError, setIsQuotaError] = useState(false);
  
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [finalThesis, setFinalThesis] = useState<DetailedThesis | null>(null);
  const [foundPapers, setFoundPapers] = useState<ResearchPaper[]>([]);

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
    setFoundPapers([]);
    setErrorDetails(null);
    setIsQuotaError(false);
    
    try {
      addLog(`Noyau MediMind v3.5 Initialisé. Mode : Parallèle Haute-Vitesse.`, 'info');
      
      setState(AgentState.SCOPING);
      
      const { thesis, papers } = await generateFullThesis(topic, mode, (msg, type, newState, data) => {
        addLog(msg, type);
        if (newState) setState(newState);
        if (data) setFoundPapers(data);
      });
      
      setFinalThesis(thesis);
      setFoundPapers(papers);
      
      setState(AgentState.COMPLETE);
      addLog("Mission certifiée. Compilation du manuscrit terminée.", 'success');
      
      setIsFinishing(true);
      setTimeout(() => {
        setIsFinishing(false);
        setView('REPORT');
      }, 1500);

    } catch (error: any) {
      console.error("Échec du Pipeline :", error);
      const errorStr = typeof error.message === 'string' ? error.message : JSON.stringify(error);
      
      let friendlyMessage = errorStr;
      let quotaHit = false;

      if (errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED') || errorStr.includes('quota')) {
        friendlyMessage = "Quota d'API dépassé. Veuillez vérifier vos limites de facturation Google Cloud.";
        quotaHit = true;
      } else if (errorStr.includes('JSON')) {
        friendlyMessage = "L'agent a renvoyé une réponse malformée. Re-tentative recommandée.";
      } else if (errorStr.includes('503')) {
        friendlyMessage = "Serveur Gemini temporairement indisponible.";
      }
      
      addLog(`Erreur Système : ${friendlyMessage}`, 'error');
      setErrorDetails(friendlyMessage);
      setIsQuotaError(quotaHit);
      setState(AgentState.ERROR);
    }
  };

  const activeStepIndex = useMemo(() => {
    if (state === AgentState.IDLE) return -1;
    if (state === AgentState.COMPLETE) return STEPS.length - 1;
    return STEPS.findIndex(s => s.id === state);
  }, [state]);

  const isIdle = state === AgentState.IDLE || state === AgentState.COMPLETE;

  const mockArticle: ScientificArticle | null = useMemo(() => {
    if (!finalThesis) return null;
    return {
      title: finalThesis.title,
      abstract: finalThesis.chapters[0]?.sections[0]?.content.substring(0, 500) || "Résumé en cours...",
      introduction: finalThesis.chapters[0]?.sections[0]?.content || "",
      methodology: finalThesis.chapters[1]?.sections[0]?.content || "",
      analysisPlan: finalThesis.chapters[2]?.sections[0]?.content || "",
      implications: finalThesis.chapters[3]?.sections[0]?.content || "",
      uncertaintyZones: finalThesis.chapters[4]?.sections[0]?.content || "",
      references: foundPapers.map(p => `${p.authors}. ${p.title}. ${p.journal} ${p.year}. PMID: ${p.pmid}`)
    };
  }, [finalThesis, foundPapers]);

  if (view === 'LANDING') return <LandingPage onStart={() => setView('DASHBOARD')} />;
  if (view === 'REPORT') return <ArticleView article={mockArticle} thesis={finalThesis} onBack={() => setView('DASHBOARD')} />;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-medical-500/30">
      
      {isFinishing && (
        <div className="fixed inset-0 z-[1000] bg-slate-950 flex flex-col items-center justify-center animate-in fade-in duration-700">
           <div className="w-24 h-24 bg-medical-500 rounded-[2rem] flex items-center justify-center mb-10 shadow-[0_0_80px_rgba(20,184,166,0.5)] animate-bounce">
              <CheckCircle2 className="w-12 h-12 text-slate-950" />
           </div>
           <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Audit Terminé</h2>
           <p className="text-slate-500 font-mono text-sm tracking-widest uppercase">Ouverture du Rapport Scientifique...</p>
        </div>
      )}

      {state === AgentState.ERROR && (
        <div className="fixed bottom-10 right-10 z-[500] max-w-md bg-slate-900 border border-rose-500/30 p-6 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-rose-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">
                {isQuotaError ? 'Quota Atteint' : 'Erreur Pipeline'}
              </h3>
              <p className="text-xs text-slate-400 font-mono leading-relaxed mb-3">{errorDetails}</p>
              {isQuotaError && (
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-[9px] font-black text-medical-400 hover:underline">Vérifier les limites de facturation</a>
              )}
            </div>
          </div>
          <button onClick={runMultiAgentPipeline} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[9px] font-black tracking-widest flex items-center justify-center gap-2 border border-white/5 shadow-lg">
            <RefreshCw className="w-3.5 h-3.5" /> RE-LANCER LE PROCESSUS
          </button>
        </div>
      )}

      <header className="h-20 border-b border-white/5 bg-slate-950 sticky top-0 z-[100] px-8 flex items-center justify-between shadow-2xl backdrop-blur-3xl bg-opacity-90">
        <div className="flex items-center gap-6 shrink-0" onClick={() => setView('LANDING')}>
          <Logo className="w-12 h-12 shadow-[0_0_20px_rgba(20,184,166,0.2)] cursor-pointer hover:scale-105 transition-transform" />
          <div className="flex flex-col cursor-pointer">
            <h1 className="text-xl font-bold text-white tracking-tight leading-none mb-1">MediMind</h1>
            <span className="text-[10px] font-mono text-medical-500 uppercase tracking-[0.3em] font-black">Chercheur Agentique</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-12 gap-6 max-w-5xl">
          <div className="flex-1 flex items-center gap-3 bg-slate-900/60 px-5 py-2.5 rounded-xl border border-white/5 shadow-inner focus-within:border-medical-500/30 transition-all group">
            <Search className="w-4 h-4 text-slate-600 group-focus-within:text-medical-500 transition-colors" />
            <input 
              type="text" 
              value={topic} 
              onChange={(e) => setTopic(e.target.value)} 
              disabled={(!isIdle && state !== AgentState.ERROR)} 
              className="bg-transparent border-none text-white w-full focus:ring-0 text-sm font-bold placeholder:text-slate-700 font-sans" 
              placeholder="Entrez votre sujet de recherche clinique..." 
            />
          </div>

          <button 
            onClick={runMultiAgentPipeline} 
            disabled={(!isIdle && state !== AgentState.ERROR) || !topic.trim()} 
            className={`px-8 py-2.5 rounded-xl font-black text-[11px] tracking-widest flex items-center gap-3 transition-all transform active:scale-95 disabled:opacity-30 shadow-2xl shrink-0 ${(!isIdle && state !== AgentState.ERROR) ? 'bg-white text-slate-950' : 'bg-medical-500/10 text-medical-400 border border-medical-500/30 hover:bg-medical-500/20'}`}
          >
            {(!isIdle && state !== AgentState.ERROR) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
            {isIdle || state === AgentState.ERROR ? 'LANCER' : 'PROCESSING'}
          </button>
        </div>
        
        <div className="flex items-center gap-4 shrink-0">
             <button onClick={() => setShowProfile(!showProfile)} className="w-10 h-10 rounded-full bg-slate-800 border-2 border-medical-500/20 flex items-center justify-center text-white font-bold text-xs hover:ring-4 ring-medical-500/10 transition-all shadow-xl">MD</button>
        </div>
      </header>

      <Workstation 
        topic={topic} 
        setTopic={setTopic} 
        mode={mode} 
        setMode={setMode} 
        state={state} 
        logs={logs} 
        papers={foundPapers} 
        synthesis={null} 
        onRun={runMultiAgentPipeline} 
        activeStepIndex={activeStepIndex} 
      />
    </div>
  );
};

export default App;
