
import { GoogleGenAI, GenerateContentParameters } from "@google/genai";
import { ResearchPaper } from "../types";

/**
 * INITIALISATION SÉCURISÉE DU SDK
 * Utilise exclusivement process.env.API_KEY. 
 * En production SaaS, cet appel est intercepté par le proxy Cloudflare/Vite.
 */
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("MediMind_Critical_Error: API_KEY_NOT_FOUND. Vérifiez la configuration de l'environnement.");
  }
  return new GoogleGenAI({ apiKey });
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function repairJson(json: string): string {
  let text = json.trim();
  text = text.replace(/```json\n?/, '').replace(/\n?```/, '');
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
    const response = await ai.models.generateContent(params);
    if (!response) throw new Error("Réponse_Nulle");
    return response;
  } catch (error: any) {
    const errorStr = error.message || "";
    if (retries > 0 && (errorStr.includes('429') || errorStr.includes('quota') || errorStr.includes('exhausted'))) {
      await wait(delay);
      return callWithRetry(params, retries - 1, delay * 2);
    }
    throw error;
  }
};

const GLOBAL_CONVENTION = `
- Langue : FRANÇAIS
- Ton : Scientifique de haut niveau
- Sortie : JSON STRICT sans texte superflu
`;

export const AGENT_PROMPTS = {
  SCOUT: (topic: string) => `Rôle: Éclaireur Clinique.
${GLOBAL_CONVENTION}
Tâche: Extraire 6 études pivots PubMed pour: ${topic}.
JSON: {id, title, authors, journal, year, pmid, studyType, population, outcome, riskOfBias}.`,

  ANALYZER: (input: string) => `Rôle: Évaluateur GRADE.
${GLOBAL_CONVENTION}
Input: ${input}
JSON: [{refId, evidenceLevel, biasAssessment, clinicalImpact}].`,

  WRITER: (title: string, obj: string, mem: string, refs: string) => `Rôle: Rédacteur Médical.
Texte : ${title} | Objectif : ${obj}
Blueprint : ${mem}
Citations : ${refs}
Règle : Français académique uniquement. Pas de JSON.`,

  SUPERVISOR: (text: string) => `Rôle: Superviseur PhD.
${GLOBAL_CONVENTION}
Vérifier cohérence et rigueur.
JSON: {logicalAdjustments: [], missingData: []}.`,

  GUARD: (text: string) => `Rôle: Audit Intégrité.
Nettoyer patterns IA. Sortie texte brut uniquement.
Contenu : ${text}`,

  FIGURE_PLANNER: (text: string) => `Rôle: Data Visualizer.
${GLOBAL_CONVENTION}
JSON: [{id, title, type, variables, purpose}].`,

  ANNEXES: (text: string) => `Rôle: Technical Writer.
${GLOBAL_CONVENTION}
JSON: [{id, title, contentType, content}].`
};

export const scoutRetrieve = async (topic: string): Promise<ResearchPaper[]> => {
  const res = await callWithRetry({
    model: 'gemini-3-flash-preview',
    contents: AGENT_PROMPTS.SCOUT(topic),
    config: { tools: [{ googleSearch: {} }], responseMimeType: 'application/json' }
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
    contents: AGENT_PROMPTS.WRITER(section.title, section.objective, memory, refs),
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
  const res = await callWithRetry({ model: 'gemini-3-flash-preview', contents: AGENT_PROMPTS.GUARD(text) });
  return res.text || text;
};
