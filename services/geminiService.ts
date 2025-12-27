
import { GoogleGenAI, Type, GenerateContentParameters } from "@google/genai";
import { ResearchPaper, SynthesisResult, ScientificArticle, ResearchMode } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

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
  const quoteCount = (text.match(/"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    text += '"';
  }
  const stack: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '{' || char === '[') {
      stack.push(char === '{' ? '}' : ']');
    } else if (char === '}' || char === ']') {
      if (stack.length > 0 && stack[stack.length - 1] === char) {
        stack.pop();
      }
    }
  }
  while (stack.length > 0) {
    text += stack.pop();
  }
  return text;
}

const callWithRetry = async (params: GenerateContentParameters, retries = 5, delay = 2000): Promise<any> => {
  const ai = getAI();
  try {
    return await ai.models.generateContent(params);
  } catch (error: any) {
    const errorStr = typeof error.message === 'string' ? error.message : JSON.stringify(error);
    const isRateLimit = errorStr.includes('429') || 
                        errorStr.includes('RESOURCE_EXHAUSTED') || 
                        errorStr.includes('quota');
    const isServerBusy = errorStr.includes('503') || errorStr.includes('500') || errorStr.includes('busy');

    if (retries > 0 && (isRateLimit || isServerBusy)) {
      const actualDelay = isRateLimit ? delay * 2 : delay;
      console.warn(`API Quota/Busy hit. Retrying in ${actualDelay}ms... (${retries} retries left)`);
      await wait(actualDelay);
      return callWithRetry(params, retries - 1, actualDelay * 1.5);
    }
    throw error;
  }
};

const GLOBAL_CONVENTION = `
- Langue : FRANÇAIS (Impératif)
- Ton : Académique, clinique, neutre
- Audience : MD / PhD / Revue à comité de lecture
- Aucun commentaire meta
- Aucune référence à soi-même en tant qu'IA
- Sortie : JSON valide uniquement sauf pour la rédaction de texte brut.
`;

export const AGENT_PROMPTS = {
  SCOUT: (topic: string) => `Vous êtes un éclaireur en recherche clinique.
${GLOBAL_CONVENTION}
Tâche : Identifier les études clés évaluées par les pairs pour : ${topic}
Contraintes : MAX 6 études, prioriser phase I-II, humain uniquement.
Sortie STRICTEMENT un tableau JSON d'objets : {id, title, authors, journal, year, pmid, studyType, population, outcome, limitation}.`,

  ANALYZER: (scoutOutput: string) => `Vous êtes un évaluateur méthodologique.
${GLOBAL_CONVENTION}
Tâche : Évaluation GRADE pour ces études :
${scoutOutput}
Format de sortie : Tableau JSON d'objets avec les champs : Ref-ID, Evidence (High/Moderate/Low/Very Low), Bias (Low/Moderate/High), Uncertainty (1 phrase).`,

  WRITER: (title: string, objective: string, memory: string, refs: string, tokenTarget: number) => `Vous êtes un rédacteur scientifique médical.
${GLOBAL_CONVENTION}
Section : ${title}
Objectif : ${objective}
Contexte : ${memory}
Refs : ${refs}
Règles : IMRAD, Français impeccable, Pas de meta-discours, Max ${tokenTarget} tokens. Sortie texte brut uniquement.`,

  SUPERVISOR: (currentSection: string, previousSections: string) => `Vous êtes un superviseur académique.
${GLOBAL_CONVENTION}
Tâche : Fournir des directives éditoriales pour la section actuelle.
Sortie STRICTEMENT JSON : {logicalAdjustments: [], redundanciesToRemove: [], missingAngles: [], suggestedFigureTitle: ""}.
Section Actuelle : ${currentSection}`,

  GUARD: (text: string) => `Vous êtes un auditeur linguistique scientifique.
${GLOBAL_CONVENTION}
Tâche : Nettoyer les patterns IA, fluidifier, maintenir la rigueur. Renvoyer la version nettoyée UNIQUEMENT.
Texte : ${text}`,

  FIGURE_PLANNER: (sectionText: string) => `Vous êtes un planificateur de figures scientifiques.
${GLOBAL_CONVENTION}
Basé sur : ${sectionText}
Proposez 2 figures. Sortie tableau JSON : {id, title, type, variables, purpose}.`,

  ANNEXES: (manuscriptText: string) => `Vous générez du matériel supplémentaire.
${GLOBAL_CONVENTION}
Lister les annexes. Sortie tableau JSON : {id, title, contentType, source}.`,

  BIBLIOGRAPHY: (refs: string) => `Vous êtes un compilateur de références.
${GLOBAL_CONVENTION}
Sortie bibliographie style Vancouver. Une par ligne.`,

  TRANSLATION: (text: string, lang: string) => `Traduire en ${lang}. Sortie texte brut uniquement.`
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
  try {
    return JSON.parse(repairJson(res.text || "[]"));
  } catch (e) {
    console.error("Erreur de parsing JSON dans SCOUT:", e, res.text);
    return [];
  }
};

export const analyzerGrade = async (papers: ResearchPaper[]): Promise<any[]> => {
  const input = papers.map(p => `${p.id}: ${p.title} (${p.studyType})`).join('\n');
  const res = await callWithRetry({
    model: 'gemini-3-flash-preview',
    contents: AGENT_PROMPTS.ANALYZER(input),
    config: { responseMimeType: 'application/json' }
  });
  try {
    return JSON.parse(repairJson(res.text || "[]"));
  } catch (e) {
    console.error("Erreur de parsing JSON dans ANALYZER:", e, res.text);
    return [];
  }
};

export const writerDraft = async (section: { title: string, objective: string }, memory: string, refs: string) => {
  const res = await callWithRetry({
    model: 'gemini-3-pro-preview',
    contents: AGENT_PROMPTS.WRITER(section.title, section.objective, memory, refs, 500),
    config: { thinkingConfig: { thinkingBudget: 4096 } }
  });
  return res.text || "";
};

export const supervisorDirectives = async (current: string, previous: string) => {
  const res = await callWithRetry({
    model: 'gemini-3-flash-preview',
    contents: AGENT_PROMPTS.SUPERVISOR(current, previous),
    config: { responseMimeType: 'application/json' }
  });
  try {
    return JSON.parse(repairJson(res.text || "{}"));
  } catch (e) {
    console.error("Erreur de parsing JSON dans SUPERVISOR:", e, res.text);
    return { logicalAdjustments: [], redundanciesToRemove: [], missingAngles: [] };
  }
};

export const guardClean = async (text: string) => {
  const res = await callWithRetry({
    model: 'gemini-3-flash-preview',
    contents: AGENT_PROMPTS.GUARD(text),
  });
  return res.text || text;
};
