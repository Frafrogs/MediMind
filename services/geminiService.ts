
import { GoogleGenAI, Type, GenerateContentParameters } from "@google/genai";
import { ResearchPaper, SynthesisResult, ScientificArticle, ResearchMode } from "../types";

/**
 * ARCHITECTURE SÉCURISÉE : 
 * La clé API est récupérée exclusivement via process.env.API_KEY.
 * Pour une mise en production (SaaS Médical), cet appel devrait être proxifié 
 * par un Cloudflare Worker pour éviter toute exposition client.
 */
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Clé API MediMind manquante. Vérifiez la configuration de l'environnement.");
  }
  return new GoogleGenAI({ apiKey });
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function repairJson(json: string): string {
  let text = json.trim();
  if (!text.startsWith('{') && !text.startsWith('[')) {
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      text = text.substring(firstBrace);
    } else if (firstBracket !== -1) {
      text = text.substring(firstBracket);
    }
  }
  return text;
}

const callWithRetry = async (params: GenerateContentParameters, retries = 3, delay = 2000): Promise<any> => {
  const ai = getAI();
  try {
    return await ai.models.generateContent(params);
  } catch (error: any) {
    const errorStr = error.message || JSON.stringify(error);
    const isRateLimit = errorStr.includes('429') || errorStr.includes('quota');
    
    if (retries > 0 && isRateLimit) {
      await wait(delay);
      return callWithRetry(params, retries - 1, delay * 2);
    }
    throw error;
  }
};

const GLOBAL_CONVENTION = `
- Langue : FRANÇAIS (Impératif)
- Ton : Académique, clinique, neutre
- Audience : MD / PhD / Revue à comité de lecture
- Sortie : JSON valide uniquement sauf pour la rédaction de texte brut.
`;

export const AGENT_PROMPTS = {
  SCOUT: (topic: string) => `Vous êtes un éclaireur en recherche clinique.
${GLOBAL_CONVENTION}
Tâche : Identifier 6 études clés (PubMed/NIH) pour : ${topic}
Sortie : JSON tableau d'objets {id, title, authors, journal, year, pmid, studyType, population, outcome, limitation}.`,

  ANALYZER: (scoutOutput: string) => `Évaluateur GRADE.
${GLOBAL_CONVENTION}
Analyse de certitude : ${scoutOutput}
Sortie : JSON tableau {Ref-ID, Evidence, Bias, Uncertainty}.`,

  WRITER: (title: string, objective: string, memory: string, refs: string, tokenTarget: number) => `Rédacteur Médical.
${GLOBAL_CONVENTION}
Section : ${title} | Objectif : ${objective}
Contexte Structural : ${memory}
Citations : ${refs}
Règles : IMRAD, Français impeccable. Texte brut uniquement.`,

  SUPERVISOR: (currentSection: string) => `Superviseur PhD.
${GLOBAL_CONVENTION}
Audit de la section. Sortie JSON : {logicalAdjustments: [], redundanciesToRemove: [], missingAngles: [], suggestedFigureTitle: ""}.
Texte : ${currentSection}`,

  GUARD: (text: string) => `Auditeur d'Intégrité.
${GLOBAL_CONVENTION}
Éliminer les patterns IA, renforcer la rigueur. Version nettoyée UNIQUEMENT.
Texte : ${text}`,

  FIGURE_PLANNER: (sectionText: string) => `Planificateur de Figures.
${GLOBAL_CONVENTION}
Proposez 2 figures pour : ${sectionText.substring(0, 1000)}
Sortie : JSON tableau {id, title, type, variables, purpose, description}.`,

  ANNEXES: (manuscriptText: string) => `Matériel supplémentaire.
${GLOBAL_CONVENTION}
Sortie : JSON tableau {id, title, contentType, source, content}.`
};

export const scoutRetrieve = async (topic: string): Promise<ResearchPaper[]> => {
  const res = await callWithRetry({
    model: 'gemini-3-flash-preview',
    contents: AGENT_PROMPTS.SCOUT(topic),
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: 'application/json'
    }
  });
  return JSON.parse(repairJson(res.text || "[]"));
};

export const analyzerGrade = async (papers: ResearchPaper[]): Promise<any[]> => {
  const input = papers.map(p => `${p.id}: ${p.title}`).join('\n');
  const res = await callWithRetry({
    model: 'gemini-3-flash-preview',
    contents: AGENT_PROMPTS.ANALYZER(input),
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(repairJson(res.text || "[]"));
};

export const writerDraft = async (section: { title: string, objective: string }, memory: string, refs: string) => {
  const res = await callWithRetry({
    model: 'gemini-3-pro-preview',
    contents: AGENT_PROMPTS.WRITER(section.title, section.objective, memory, refs, 500),
    config: { thinkingConfig: { thinkingBudget: 4096 } }
  });
  return res.text || "";
};

export const supervisorDirectives = async (current: string) => {
  const res = await callWithRetry({
    model: 'gemini-3-flash-preview',
    contents: AGENT_PROMPTS.SUPERVISOR(current),
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(repairJson(res.text || "{}"));
};

export const guardClean = async (text: string) => {
  const res = await callWithRetry({
    model: 'gemini-3-flash-preview',
    contents: AGENT_PROMPTS.GUARD(text),
  });
  return res.text || text;
};
