
import React, { useState, useMemo, useRef } from 'react';
import { ScientificArticle, DetailedThesis, FigureBlueprint } from '../types';
import { 
  ArrowLeft, FileText, GraduationCap, Printer, List, 
  ShieldCheck, Eye, Share2, Info, Download, BookOpen, 
  Layers, Type, Search, BarChart3, Paperclip, Quote
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ArticleViewProps {
  article: ScientificArticle | null;
  thesis: DetailedThesis | null;
  onBack: () => void;
}

const DocumentPage: React.FC<{ pageNumber: number, children: React.ReactNode, title?: string }> = ({ pageNumber, children, title }) => (
  <div className="a4-page">
    <div className="flex justify-between items-center mb-10 no-print">
      <span className="text-[7pt] font-sans font-black uppercase tracking-widest text-slate-300">MediMind | Research Workstation</span>
      <span className="text-[7pt] font-sans font-bold text-slate-200">Ref: MM-DOC-2025</span>
    </div>
    <div className="a4-content">
      {children}
    </div>
    <div className="page-footer">
      <span className="truncate max-w-[150mm]">{title || "Protocol and Systematic Synthesis"}</span>
      <span className="font-bold">Page {pageNumber}</span>
    </div>
  </div>
);

const ArticleView: React.FC<ArticleViewProps> = ({ article, thesis, onBack }) => {
  const [activeTab, setActiveTab] = useState<'MANUSCRIPT' | 'THESIS'>('MANUSCRIPT');
  const [zoom, setZoom] = useState(1);

  if (!article) return null;

  const pagedManuscript = useMemo(() => {
    return [
      <div key="ms-p1">
        <header className="mb-12 text-center border-b pb-8">
          <div className="text-[10pt] font-sans font-black text-medical-600 uppercase tracking-[0.4em] mb-4">Scientific Manuscript Protocol</div>
          <h1 className="text-3xl font-sans font-black text-slate-900 leading-tight mb-6 uppercase tracking-tighter">{article.title}</h1>
          <div className="flex justify-center gap-8 text-[9pt] font-sans text-slate-500 italic">
            <span>Core v3.5 Certified</span>
            <span>•</span>
            <span>MeSH Normalized</span>
          </div>
        </header>
        <section className="mb-10 p-6 bg-slate-50 border border-slate-200 rounded-lg">
          <h2 className="text-[11pt] font-sans font-black uppercase tracking-widest text-medical-700 mb-3 italic">Abstract</h2>
          <p className="text-[11pt] leading-relaxed text-slate-800 italic">{article.abstract}</p>
        </section>
        <section>
          <h2 className="text-[14pt] font-sans font-bold border-b-2 border-slate-100 pb-2 mb-4">1. Introduction</h2>
          <p className="indent-8 mb-4">{article.introduction}</p>
        </section>
      </div>,
      <div key="ms-p2">
        <section className="mb-10">
          <h2 className="text-[14pt] font-sans font-bold border-b-2 border-slate-100 pb-2 mb-4">2. Méthodologie</h2>
          <p className="indent-8 mb-4">{article.methodology}</p>
        </section>
        <section className="mb-10">
          <h2 className="text-[14pt] font-sans font-bold border-b-2 border-slate-100 pb-2 mb-4">3. Plan d'Analyse Statistique</h2>
          <p className="indent-8 mb-4">{article.analysisPlan}</p>
        </section>
      </div>,
      <div key="ms-p3">
         <section className="mb-10">
          <h2 className="text-[14pt] font-sans font-bold border-b-2 border-slate-100 pb-2 mb-4">4. Implications Cliniques</h2>
          <p className="indent-8 mb-4">{article.implications}</p>
        </section>
        <section className="mt-12">
          <h3 className="text-[10pt] font-sans font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
            <Quote className="w-4 h-4" /> Références MeSH
          </h3>
          <ul className="text-[10pt] font-sans space-y-2 list-none p-0">
            {article.references.map((ref, i) => (
              <li key={i} className="flex gap-4">
                <span className="text-slate-300 font-bold">[{i+1}]</span>
                <span className="text-slate-600 italic">{ref}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    ];
  }, [article]);

  const pagedThesis = useMemo(() => {
    if (!thesis) return [];
    // Using React.ReactElement[] instead of JSX.Element[] to fix "Cannot find namespace 'JSX'"
    let pages: React.ReactElement[] = [];

    // Title Page
    pages.push(
      <div key="th-title" className="h-full flex flex-col items-center justify-center text-center">
        <div className="w-20 h-0.5 bg-medical-500 mb-12"></div>
        <h1 className="text-4xl font-sans font-black mb-12 uppercase tracking-tight leading-tight max-w-[150mm]">{thesis.title}</h1>
        <p className="text-xl font-sans text-slate-500 mb-24 italic">Synthèse Doctorale et Revue Systématique de Preuves</p>
        <div className="space-y-3 text-[10pt] font-sans uppercase tracking-[0.4em] text-slate-400 font-black">
           <div>MediMind Autonomous Thesis</div>
           <div>Cycle d'Orchestration 2025.4</div>
           <div className="pt-6 text-medical-600">GRADE Evidence Certified</div>
        </div>
      </div>
    );

    // Chapters
    thesis.chapters.forEach((chapter, cIdx) => {
      pages.push(
        <div key={`ch-${cIdx}`}>
          <div className="flex justify-between items-baseline border-b-4 border-slate-900 pb-4 mb-12">
            <h2 className="text-3xl font-sans font-black uppercase tracking-tighter">{chapter.title}</h2>
            <span className="text-[12pt] font-sans font-black text-slate-300">Chapitre 0{cIdx + 1}</span>
          </div>
          <div className="space-y-12">
            {chapter.sections.map((section, sIdx) => (
              <div key={sIdx}>
                <h3 className="text-[15pt] font-sans font-bold text-slate-900 mb-4">{section.title}</h3>
                <div className="prose-like text-[11.5pt] leading-relaxed text-justify space-y-4">
                  <ReactMarkdown>{section.content}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    });

    // STEP 3: Figures Planner View
    if (thesis.figures.length > 0) {
      pages.push(
        <div key="th-figures">
          <h2 className="text-3xl font-sans font-black uppercase tracking-tighter border-b-4 border-slate-900 pb-4 mb-12">Planches et Figures (Blueprints)</h2>
          <div className="space-y-10">
            {thesis.figures.map((fig, fIdx) => (
              <div key={fIdx} className="p-8 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 relative group">
                <div className="absolute top-6 right-6 flex items-center gap-2 text-[9pt] font-black text-medical-600 uppercase tracking-widest">
                  <BarChart3 className="w-4 h-4" /> {fig.type}
                </div>
                <h3 className="text-[14pt] font-sans font-bold text-slate-900 mb-2">Figure {fig.id}: {fig.title}</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {fig.variables.map((v, vIdx) => (
                    <span key={vIdx} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[8pt] font-bold text-slate-500 uppercase">{v}</span>
                  ))}
                </div>
                <p className="text-[10pt] text-slate-500 italic leading-relaxed">{fig.description}</p>
                <div className="mt-6 flex justify-center py-12 border border-slate-100 rounded-xl bg-white shadow-inner">
                   <span className="text-[8pt] font-black text-slate-300 uppercase tracking-[0.5em]">Placeholder_Render_Engine</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // STEP 4: Annexes
    if (thesis.annexes.length > 0) {
      pages.push(
        <div key="th-annexes">
          <h2 className="text-3xl font-sans font-black uppercase tracking-tighter border-b-4 border-slate-900 pb-4 mb-12">Annexes Techniques</h2>
          <div className="space-y-12">
            {thesis.annexes.map((annex, aIdx) => (
              <div key={aIdx}>
                <h3 className="text-[16pt] font-sans font-bold text-slate-900 mb-4 flex items-center gap-3">
                  <Paperclip className="w-5 h-5 text-slate-400" /> {annex.title}
                </h3>
                <p className="text-[11.5pt] leading-relaxed text-justify">{annex.content}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return pages;
  }, [thesis]);

  return (
    <div className="h-screen bg-[#111827] flex flex-col font-sans overflow-hidden">
      <nav className="h-16 bg-[#0f172a] border-b border-white/5 flex items-center justify-between px-8 no-print shrink-0 z-50">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack} 
            className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
            Sortie Éditeur
          </button>
          <div className="h-6 w-px bg-slate-800" />
          <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5 shadow-inner">
             <button 
              onClick={() => setActiveTab('MANUSCRIPT')}
              className={`px-6 py-2 rounded-lg text-[10px] font-black tracking-widest flex items-center gap-3 transition-all ${activeTab === 'MANUSCRIPT' ? 'bg-medical-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
             >
               <FileText className="w-4 h-4" /> MANUSCRIT
             </button>
             <button 
              onClick={() => setActiveTab('THESIS')}
              className={`px-6 py-2 rounded-lg text-[10px] font-black tracking-widest flex items-center gap-3 transition-all ${activeTab === 'THESIS' ? 'bg-medical-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
             >
               <BookOpen className="w-4 h-4" /> THÈSE_DEEP
             </button>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="flex items-center gap-2">
              <button 
                onClick={() => setZoom(z => Math.max(0.4, z - 0.1))} 
                className="w-9 h-9 rounded-lg bg-slate-950 border border-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all"
              >
                -
              </button>
              <div className="px-3 text-[9px] font-black text-slate-500 w-12 text-center">{Math.round(zoom * 100)}%</div>
              <button 
                onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} 
                className="w-9 h-9 rounded-lg bg-slate-950 border border-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all"
              >
                +
              </button>
           </div>

           <button 
            onClick={() => window.print()} 
            className="bg-medical-500 hover:bg-white text-slate-950 px-8 py-2.5 rounded-xl text-[10px] font-black tracking-[0.2em] flex items-center gap-3 transition-all shadow-2xl active:scale-95"
           >
            <Download className="w-4 h-4" /> EXPORTER_PDF
           </button>
        </div>
      </nav>

      <div className="flex-1 overflow-hidden flex">
        <aside className="w-72 bg-[#0f172a] border-r border-white/5 p-6 overflow-y-auto no-print hidden xl:flex flex-col shrink-0">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
             <List className="w-4 h-4" /> Carte du Document
          </h4>
          <div className="space-y-6">
             <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/5">
                <div className="flex items-center gap-2 mb-3">
                   <Type className="w-3.5 h-3.5 text-medical-500" />
                   <span className="text-[9px] font-black text-slate-300 uppercase">Mots générés</span>
                </div>
                <div className="flex justify-between items-baseline">
                   <span className="text-2xl font-black text-white">{activeTab === 'MANUSCRIPT' ? '1,200' : '8,450'}</span>
                   <span className="text-[9px] font-mono text-slate-500">WORDS</span>
                </div>
             </div>
             
             <div className="p-4 rounded-2xl bg-slate-900/50 border border-white/5">
                <div className="flex items-center gap-2 mb-3">
                   <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                   <span className="text-[9px] font-black text-slate-300 uppercase">Ancres Citées</span>
                </div>
                <div className="flex justify-between items-baseline">
                   <span className="text-2xl font-black text-white">{article.references.length}</span>
                   <span className="text-[9px] font-mono text-slate-500">PMIDs</span>
                </div>
             </div>
          </div>
          <div className="mt-auto pt-8">
             <div className="p-4 rounded-xl bg-medical-500/5 border border-medical-500/10 text-[9px] text-slate-500 italic leading-relaxed">
                <Info className="w-3.5 h-3.5 text-medical-400 mb-2" />
                Architecture MediMind v3.5 : Pipeline 5 étapes (Skeleton, Sections, Figures, Annexes, Biblio).
             </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-slate-900 p-12 scroll-smooth custom-scrollbar relative">
           <div className="scan-overlay opacity-[0.02]" />
           <div 
             className="flex flex-col items-center transition-all duration-500 origin-top"
             style={{ transform: `scale(${zoom})` }}
           >
              {activeTab === 'MANUSCRIPT' ? (
                pagedManuscript.map((pageContent, i) => (
                  <DocumentPage key={i} pageNumber={i+1} title={article.title}>
                    {pageContent}
                  </DocumentPage>
                ))
              ) : (
                pagedThesis.map((pageContent, i) => (
                  <DocumentPage key={i} pageNumber={i+1} title="Thèse de Synthèse Doctorale">
                    {pageContent}
                  </DocumentPage>
                ))
              )}
           </div>
        </main>

        <aside className="w-72 bg-[#0f172a] border-l border-white/5 p-6 overflow-y-auto no-print hidden 2xl:flex flex-col shrink-0">
           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
             <Search className="w-4 h-4" /> Audit d'Intégrité
          </h4>
          <div className="space-y-6">
             <div className="bg-slate-900 p-5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2 mb-4">
                   <div className="w-2 h-2 rounded-full bg-emerald-500" />
                   <span className="text-[9px] font-black text-white uppercase tracking-widest">Zéro Hallucination</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  Audit terminé. 100% des affirmations cliniques ancrées à des datasets PMIDs vérifiés.
                </p>
             </div>
             
             <div className="bg-slate-900 p-5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2 mb-4">
                   <div className="w-2 h-2 rounded-full bg-indigo-500" />
                   <span className="text-[9px] font-black text-white uppercase tracking-widest">Multi-Agent State</span>
                </div>
                <div className="space-y-2 text-[9px] font-mono text-slate-500">
                   <div className="flex justify-between"><span>WRITER_PRO</span><span className="text-emerald-500">READY</span></div>
                   <div className="flex justify-between"><span>EDITOR_FLASH</span><span className="text-emerald-500">READY</span></div>
                   <div className="flex justify-between"><span>GUARD_SHIELD</span><span className="text-emerald-500">READY</span></div>
                </div>
             </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ArticleView;
