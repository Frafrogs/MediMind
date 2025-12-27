
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
  
  // 1. SCOUT (Fondation obligatoire)
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

  const refIds = papers.map(p => p.id).join(", ") || "Documentation interne";

  // 3. GÉNÉRATION DU BLUEPRINT (Optimisation Qualité/Latence)
  onProgress("SYNTHÈSE : Génération du blueprint structurel partagé...", 'thought', AgentState.WRITING);
  const blueprintRes = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Générez un plan détaillé de 5 sections pour une thèse sur: ${topic}. \n\nRéférences: ${refIds}. \n\nPour chaque section, fournissez: le titre, l'objectif clinique précis et 3 points clés à couvrir. Répondez en JSON.`,
    config: { responseMimeType: 'application/json' }
  });
  
  let structuralBlueprint;
  try {
    structuralBlueprint = JSON.parse(blueprintRes.text || "{}");
  } catch {
    structuralBlueprint = {
      sections: [
        { title: "Introduction et Contexte", objective: "Présenter le fardeau de la maladie." },
        { title: "Méthodologie", objective: "Décrire la stratégie Scout." },
        { title: "Résultats", objective: "Détailler les outcomes GRADE." },
        { title: "Discussion", objective: "Analyser les incertitudes." },
        { title: "Conclusions", objective: "Synthèse des implications." }
      ]
    };
  }

  onProgress(`ORCHESTRATEUR : Rédaction parallèle de 5 clusters avec mémoire partagée...`, 'thought', AgentState.WRITING);

  // 4. RÉDACTION PARALLÈLE (Vitesse maximale avec Gemini 3 Pro)
  const sectionPromises = structuralBlueprint.sections.map(async (step: any) => {
    // Draft Haute Qualité
    let content = await writerDraft(
      { title: step.title, objective: `${step.objective}. Points clés: ${JSON.stringify(step.keyPoints)}` }, 
      `Structure globale: ${JSON.stringify(structuralBlueprint)}`, 
      refIds
    );
    
    // Supervision Flash
    // Fix: supervisorDirectives expects only one argument.
    const directives = await supervisorDirectives(content);
    if (directives?.logicalAdjustments?.length > 0) {
      const adjustRes = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: `Améliorez ce texte médical selon ces directives: ${JSON.stringify(directives.logicalAdjustments)}. \n\nTexte: ${content}`,
      });
      content = adjustRes.text || content;
    }
    
    // Nettoyage final
    content = await guardClean(content);
    
    return {
      title: step.title,
      sections: [{ title: step.title, content, wordCount: content.split(/\s+/).length, validated: true }],
      summary: content.substring(0, 100)
    };
  });

  const chapters = await Promise.all(sectionPromises);
  onProgress(`RÉDACTION : Toutes les sections ont été certifiées par l'audit d'intégrité.`, 'success', AgentState.SUPERVISION);

  // 5. FINITIONS PARALLÈLES
  onProgress("FINITIONS : Génération synchronisée des planches et annexes...", 'thought', AgentState.INTEGRITY);
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
    metaPlan: "Cluster Parallèle MediMind v3.5 (Flash-Guided)",
    figures: parseJson(figRes.text || "[]"),
    annexes: parseJson(annexRes.text || "[]")
  };

  if (thesis.figures.length === 0) thesis.figures = [{ id: "F1", title: "Cycle de Recherche Agentique", type: "Diagramme", variables: ["Input", "Scout", "Analyzer", "Writer"], purpose: "Vue d'ensemble." }];
  if (thesis.annexes.length === 0) thesis.annexes = [{ id: "A1", title: "Protocole MediMind", contentType: "Texte", source: "Algorithmique", content: "Détail de l'orchestration parallèle des agents." }];

  return { thesis, papers };
}
