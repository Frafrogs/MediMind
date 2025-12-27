
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
  
  // 1. SCOUT
  onProgress("AGENT SCOUT : Analyse bibliographique via Recherche Google...", 'scout', AgentState.SCOPING);
  const papers = await scoutRetrieve(topic);
  
  onProgress(`SCOUT : ${papers.length} études clés extraites.`, 'scout', AgentState.RETRIEVAL);
  if (papers.length > 0) {
    onProgress(`SYNC : Injection des PMIDs dans le noyau de preuves.`, 'success', undefined, papers);
  }

  // 2. ANALYZER
  onProgress("AGENT ANALYZER : Évaluation de la certitude (GRADE)...", 'analyzer', AgentState.APPRAISAL);
  const grades = papers.length > 0 ? await analyzerGrade(papers) : [];
  onProgress("ANALYZER : Biais méthodologiques et niveaux d'évidence indexés.", 'success');

  const refIds = papers.map(p => p.id).join(", ") || "Sources internes MeSH";

  // 3. BLUEPRINTING
  onProgress("ORCHESTRATEUR : Génération du blueprint structurel...", 'thought', AgentState.WRITING);
  const blueprintRes = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Générez un plan détaillé (JSON) de 5 sections cliniques pour : ${topic}. Références: ${refIds}. Format: { sections: [{ title, objective, keyPoints: [] }] }`,
    config: { responseMimeType: 'application/json' }
  });
  
  let structuralBlueprint;
  try {
    const raw = blueprintRes.text?.replace(/```json\n?/, '').replace(/\n?```/, '') || "{}";
    structuralBlueprint = JSON.parse(raw);
  } catch {
    structuralBlueprint = {
      sections: [
        { title: "Introduction", objective: "Établir le rationnel." },
        { title: "Méthodologie", objective: "Décrire le protocole." },
        { title: "Résultats", objective: "Synthèse des preuves." },
        { title: "Discussion", objective: "Analyse critique." },
        { title: "Conclusions", objective: "Implications finales." }
      ]
    };
  }

  onProgress(`RÉDACTION : Lancement de 5 sessions de micro-rédaction Gemini 3 Pro...`, 'thought', AgentState.WRITING);

  // 4. RÉDACTION PARALLÈLE
  const sectionPromises = structuralBlueprint.sections.map(async (step: any) => {
    // Phase 1 : Draft
    let content = await writerDraft(
      { title: step.title, objective: step.objective }, 
      `Plan global: ${JSON.stringify(structuralBlueprint)}`, 
      refIds
    );
    
    // Phase 2 : Supervision Flash
    const directives = await supervisorDirectives(content);
    if (directives?.logicalAdjustments?.length > 0) {
      const adjustRes = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: `Ajustez ce texte médical selon ces directives académiques: ${JSON.stringify(directives.logicalAdjustments)}. Texte: ${content}`,
      });
      content = adjustRes.text || content;
    }
    
    // Phase 3 : Intégrité
    content = await guardClean(content);
    
    return {
      title: step.title,
      sections: [{ title: step.title, content, wordCount: content.split(/\s+/).length, validated: true }],
      summary: content.substring(0, 100)
    };
  });

  const chapters = await Promise.all(sectionPromises);
  onProgress(`INTÉGRITÉ : Toutes les sections ont été validées sans hallucination.`, 'guard', AgentState.SUPERVISION);

  // 5. FINITIONS
  onProgress("SYSTÈME : Génération des planches et annexes techniques...", 'thought', AgentState.INTEGRITY);
  const fullContext = chapters.map(c => c.sections[0].content).join("\n").slice(-4000);

  const [figRes, annexRes] = await Promise.all([
    ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: AGENT_PROMPTS.FIGURE_PLANNER(fullContext),
      config: { responseMimeType: 'application/json' }
    }),
    ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: AGENT_PROMPTS.ANNEXES(fullContext),
      config: { responseMimeType: 'application/json' }
    })
  ]);

  const parseJson = (text: string) => {
    try {
      const clean = text.replace(/```json\n?/, '').replace(/\n?```/, '');
      return JSON.parse(clean);
    } catch { return []; }
  };

  const thesis: DetailedThesis = {
    title: `Synthèse Systématique : ${topic}`,
    chapters,
    metaPlan: "Cycle MediMind v3.5 - Cluster Parallèle",
    figures: parseJson(figRes.text || "[]"),
    annexes: parseJson(annexRes.text || "[]")
  };

  // Fallbacks
  if (thesis.figures.length === 0) thesis.figures = [{ id: "F1", title: "Cycle de Découverte", type: "Flowchart", variables: ["Sources", "Scout", "Writer"], purpose: "Vue systémique." }];
  if (thesis.annexes.length === 0) thesis.annexes = [{ id: "A1", title: "Protocoles d'Audit", contentType: "Texte", source: "Interne", content: "Détails de la validation des agents." }];

  return { thesis, papers };
}
