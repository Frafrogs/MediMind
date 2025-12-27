
import { GoogleGenAI, Type } from "@google/genai";
import { 
  ThesisChapter, ThesisSection, DetailedThesis, ScientificArticle,
  ResearchMode, FigureBlueprint, ResearchPaper
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
  onProgress: (msg: string, type?: any) => void
): Promise<DetailedThesis> {
  const ai = getAI();
  const chapters: ThesisChapter[] = [];
  
  // 1. SCOUT
  onProgress("AGENT SCOUT : Lancement de la revue systématique...", 'scout');
  const papers = await scoutRetrieve(topic);
  onProgress(`SCOUT : ${papers.length} études cliniques identifiées.`, 'success');

  // 2. ANALYZER
  onProgress("AGENT ANALYZER : Évaluation GRADE de la certitude des preuves...", 'analyzer');
  const grades = await analyzerGrade(papers);
  onProgress("ANALYZER : Analyse méthodologique terminée.", 'success');

  // Map grades back to papers for writer context
  const annotatedPapers = papers.map(p => {
    const grade = grades.find(g => g['Ref-ID'] === p.id);
    return { ...p, evidenceLevel: grade?.Evidence, uncertaintyFactor: grade?.Uncertainty };
  });

  // 3. WRITING CYCLE (Micro-sections)
  const plan = [
    { title: "Introduction et Contexte", objective: "Présenter le fardeau de la maladie et le rationnel thérapeutique." },
    { title: "Méthodologie de Synthèse", objective: "Décrire les critères d'inclusion et la stratégie d'extraction Scout." },
    { title: "Résultats et Preuves GRADE", objective: "Détailler les outcomes et la robustesse des preuves extraites." },
    { title: "Discussion Critique", objective: "Analyser les zones d'incertitude et les biais identifiés par Analyzer." },
    { title: "Conclusions et Perspectives", objective: "Synthèse des implications cliniques et trajectoires futures." }
  ];

  let cumulativeMemory = "";
  const refIds = papers.map(p => p.id).join(", ");

  for (const step of plan) {
    onProgress(`WRITER : Rédaction de la micro-section "${step.title}"...`, 'thought');
    
    // Draft
    let content = await writerDraft(step, cumulativeMemory.substring(0, 500), refIds);
    
    // Supervisor
    onProgress(`SUPERVISOR : Audit de cohérence et directives éditoriales...`, 'supervisor');
    const directives = await supervisorDirectives(content, cumulativeMemory.substring(0, 300));
    
    // Adjust (Self-Correction via Writer)
    if (directives.logicalAdjustments?.length > 0) {
      onProgress(`WRITER : Application des ajustements Supervisor...`, 'thought');
      const adjustRes = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Adjust this text based on directives: ${JSON.stringify(directives.logicalAdjustments)}. Text: ${content}`,
      });
      content = adjustRes.text || content;
    }

    // Guard
    onProgress(`GUARD : Nettoyage anti-IA et audit d'intégrité...`, 'guard');
    content = await guardClean(content);

    chapters.push({
      title: step.title,
      sections: [{ title: step.title, content, wordCount: content.split(/\s+/).length, validated: true }],
      summary: content.substring(0, 100)
    });

    cumulativeMemory += ` | ${step.title}: ${content.substring(0, 200)}`;
  }

  // 4. FIGURE PLANNER
  onProgress("FIGURE PLANNER : Définition des planches visuelles...", 'thought');
  const figRes = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: AGENT_PROMPTS.FIGURE_PLANNER(cumulativeMemory),
    config: { responseMimeType: 'application/json' }
  });
  const figures = JSON.parse(figRes.text || "[]");

  // 5. ANNEXES
  onProgress("ANNEXES : Génération du matériel supplémentaire...", 'thought');
  const annexRes = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: AGENT_PROMPTS.ANNEXES(cumulativeMemory),
    config: { responseMimeType: 'application/json' }
  });
  const annexes = JSON.parse(annexRes.text || "[]");

  return {
    title: `Synthèse Systématique : ${topic}`,
    chapters,
    metaPlan: cumulativeMemory,
    figures,
    annexes
  };
}
