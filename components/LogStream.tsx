import React, { useEffect, useRef, memo } from 'react';
import { AgentLog } from '../types';
import { Terminal, CheckCircle2, AlertCircle, BrainCircuit, Search, ShieldCheck, ChevronRight, UserCheck, Languages, UserMinus } from 'lucide-react';

interface LogStreamProps {
  logs: AgentLog[];
}

const LogStream: React.FC<LogStreamProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const getIcon = (type: AgentLog['type']) => {
    const iconClass = "w-3.5 h-3.5";
    switch (type) {
      case 'success': return <CheckCircle2 className={`${iconClass} text-emerald-400`} />;
      case 'error': return <AlertCircle className={`${iconClass} text-rose-500`} />;
      case 'thought': return <BrainCircuit className={`${iconClass} text-indigo-400`} />;
      case 'scout': return <Search className={`${iconClass} text-sky-400`} />;
      case 'guard': return <ShieldCheck className={`${iconClass} text-teal-400`} />;
      case 'supervisor': return <UserCheck className={`${iconClass} text-amber-400`} />;
      default: return <ChevronRight className={`${iconClass} text-slate-700`} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent font-mono">
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 custom-scrollbar">
        {logs.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-800 opacity-20">
             <Terminal className="w-12 h-12 mb-4" />
             <span className="text-[9px] font-black uppercase tracking-[0.5em]">Awaiting_Input</span>
          </div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-4 animate-log-entry">
            <div className="mt-1 shrink-0">{getIcon(log.type)}</div>
            <div className="flex flex-col flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  agent::{log.type || 'info'}
                </span>
                <span className="text-[8px] text-slate-700 font-bold">
                  {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                </span>
              </div>
              <span className={`text-[12px] leading-relaxed tracking-tight ${
                log.type === 'error' ? 'text-rose-400 bg-rose-500/5 p-2 rounded-lg border border-rose-500/10' :
                log.type === 'thought' ? 'text-indigo-200 italic' :
                'text-slate-300'
              }`}>
                {log.message}
              </span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <style>{`
        @keyframes log-entry {
          from { opacity: 0; transform: translateX(-5px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-log-entry {
          animation: log-entry 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default memo(LogStream);