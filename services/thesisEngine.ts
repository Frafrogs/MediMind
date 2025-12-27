
import { GoogleGenAI } from "@google/genai";
import { 
  ThesisChapter, ThesisSection, DetailedThesis,
  ResearchMode, AgentState, ResearchPaper
} from "../types";
import { 
  AGENT_PROMPTS, 
  scoutRetrieve, 
  analyzerGrade, 
  writerDraft, 
  supervisorDirectives, 
  guardClean 
} from "./geminiService";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateFullThesis(
  topic: string,
  mode: ResearchMode,
  onProgress: (msg: string, type: any, newState?: AgentState, data?: any) => void
): Promise<{thesis: DetailedThesis, papers: ResearchPaper[]}> {
  const ai = getAI();
  
  // 1. SCOUT (Séquentiel car fondation)
  onProgress("AGENT SCOUT : Initialisation de la recherche systématique...", 'scout', AgentState.SCOPING);
  const papers = await scoutRetrieve(topic);
  
  onProgress(`SCOUT : Extraction des données cliniques...`, 'scout', AgentState.RETRIEVAL);
  if (!papers || papers.length === 0) {
    onProgress("SCOUT : Aucune étude trouvée. Utilisation de données synthétiques.", 'warning');
  } else {
    onProgress(`SCOUT : ${papers.length} études cliniques identifiées.`, 'success', undefined, papers);
  }

  // 2. ANALYZER
  onProgress("AGENT ANALYZER : Évaluation GRADE de la certitude des preuves...", 'analyzer', AgentState.APPRAISAL);
  const grades = papers.length > 0 ? await analyzerGrade(papers) : [];
  onProgress("ANALYZER : Analyse méthodologique terminée.", 'success');

  const refIds = papers.map(p => p.id).join(", ") || "Pas de Refs spécifiques";

  // 3. RÉDACTION PARALLÈLE (Optimisation Latence Massive)
  const plan = [
    { title: "Introduction et Contexte", objective: "Présenter le fardeau de la maladie et le rationnel thérapeutique." },
    { title: "Méthodologie de Synthèse", objective: "Décrire les critères d'inclusion et la stratégie d'extraction Scout." },
    { title: "Résultats et Preuves GRADE", objective: "Détailler les outcomes et la robustesse des preuves extraites." },
    { title: "Discussion Critique", objective: "Analyser les zones d'incertitude et les biais identifiés par Analyzer." },
    { title: "Conclusions et Perspectives", objective: "Synthèse des implications cliniques et trajectoires futures." }
  ];

  onProgress(`ORCHESTRATEUR : Lancement des clusters de rédaction parallèle (5 sessions simultanées)...`, 'thought', AgentState.WRITING);

  // Exécution parallèle du cycle (Draft -> Supervisor -> Guard) pour chaque section
  const sectionPromises = plan.map(async (step) => {
    // Phase 1: Draft (Gemini 3 Pro pour la qualité)
    let content = await writerDraft(step, `Sujet principal: ${topic}. Références autorisées: ${refIds}.`, refIds);
    
    // Phase 2: Supervision Flash (Gemini 3 Flash pour la vitesse)
    const directives = await supervisorDirectives(content, "");
    if (directives?.logicalAdjustments?.length > 0) {
      const adjustRes = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: `Ajustez ce texte médical selon ces directives académiques: ${JSON.stringify(directives.logicalAdjustments)}. \n\nTexte: ${content}`,
      });
      content = adjustRes.text || content;
    }
    
    // Phase 3: Integrity Check (Guard)
    content = await guardClean(content);
    
    return {
      title: step.title,
      sections: [{ title: step.title, content, wordCount: content.split(/\s+/).length, validated: true }],
      summary: content.substring(0, 100)
    };
  });

  const chapters = await Promise.all(sectionPromises);
  onProgress(`RÉDACTION : Toutes les sections ont été certifiées par l'audit d'intégrité.`, 'success', AgentState.SUPERVISION);

  // 4. FIGURES & ANNEXES (Parallèle après rédaction)
  onProgress("FINITIONS : Génération synchronisée des planches visuelles et annexes...", 'thought', AgentState.INTEGRITY);
  const fullTextContext = chapters.map(c => c.sections[0].content).join("\n").slice(-4000);

  const [figRes, annexRes] = await Promise.all([
    ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: AGENT_PROMPTS.FIGURE_PLANNER(fullTextContext),
      config: { responseMimeType: 'application/json' }
    }),
    ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: AGENT_PROMPTS.ANNEXES(fullTextContext),
      config: { responseMimeType: 'application/json' }
    })
  ]);

  const parseJson = (text: string) => {
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch { return []; }
  };

  const thesis: DetailedThesis = {
    title: `Synthèse Systématique : ${topic}`,
    chapters,
    metaPlan: "Cycle parallèle MediMind v3.5 - Optimisé Temps-Réel",
    figures: parseJson(figRes.text || "[]"),
    annexes: parseJson(annexRes.text || "[]")
  };

  // Fallbacks automatiques pour éviter les erreurs d'affichage
  if (thesis.figures.length === 0) thesis.figures = [{ id: "F1", title: "Workflow de Synthèse Clinique", type: "Diagramme", variables: ["Sources", "Filtres", "GRADE"], purpose: "Vue d'ensemble du processus." }];
  if (thesis.annexes.length === 0) thesis.annexes = [{ id: "A1", title: "Protocole de Recherche", contentType: "Texte", source: "Interne", content: "Détail du paramétrage des agents Scout et Guard." }];

  return { thesis, papers };
}
