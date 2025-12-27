import React from 'react';
import { STEPS } from '../constants';
import { AgentState } from '../types';

interface StepIndicatorProps {
  currentState: AgentState;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentState }) => {
  const getCurrentStepIndex = () => {
    if (currentState === AgentState.IDLE) return -1;
    if (currentState === AgentState.COMPLETE) return STEPS.length;
    return STEPS.findIndex(s => s.id === currentState);
  };

  const currentIndex = getCurrentStepIndex();

  return (
    <div className="w-full">
      <div className="flex justify-between items-start relative">
        {/* Connecting Line */}
        <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-800 -z-0" />
        <div 
          className="absolute top-5 left-0 h-0.5 bg-sky-500 transition-all duration-700 ease-in-out -z-0"
          style={{ width: `${Math.max(0, Math.min(100, (currentIndex / (STEPS.length - 1)) * 100))}%` }}
        />

        {STEPS.map((step, idx) => {
          const isActive = idx === currentIndex;
          const isCompleted = idx < currentIndex;
          const isPending = idx > currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex flex-col items-center relative z-10 w-24">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isActive ? 'bg-sky-900 border-sky-400 scale-110 shadow-[0_0_15px_rgba(56,189,248,0.5)]' :
                  isCompleted ? 'bg-slate-900 border-sky-600 text-sky-500' :
                  'bg-slate-900 border-slate-700 text-slate-700'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />
              </div>
              <div className={`mt-2 text-[10px] md:text-xs font-medium text-center transition-colors duration-300 ${
                isActive ? 'text-sky-400' : isCompleted ? 'text-slate-400' : 'text-slate-600'
              }`}>
                {step.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;
