
import { GoogleGenAI, Type, GenerateContentParameters } from "@google/genai";
import { ResearchPaper, SynthesisResult, ScientificArticle, ResearchMode } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const callWithRetry = async (params: GenerateContentParameters, retries = 3, delay = 1000): Promise<any> => {
  const ai = getAI();
  try {
    return await ai.models.generateContent(params);
  } catch (error: any) {
    if (retries > 0 && (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED'))) {
      console.warn(`Quota exceeded. Retrying in ${delay}ms... (${retries} retries left)`);
      await wait(delay);
      return callWithRetry(params, retries - 1, delay * 2);
    }
    throw error;
  }
};

const GLOBAL_CONVENTION = `
- Language: FR (source of truth)
- Tone: Academic, clinical, neutral
- Audience: MD / PhD / peer-reviewed journal
- No meta commentary
- No AI self-reference
`;

export const AGENT_PROMPTS = {
  SCOUT: (topic: string) => `You are a clinical research scout.
${GLOBAL_CONVENTION}
Task:
Identify key peer-reviewed studies relevant to the following research question.

Constraints:
- Output MAX 6 studies
- Prioritize phase I–II clinical trials
- Human studies only
- Provide only high-impact information

Research question:
${topic}

Output STRICTLY a JSON array of objects with fields: id (Ref-01...), title, authors, journal, year, pmid, studyType, population, outcome, limitation.`,

  ANALYZER: (scoutOutput: string) => `You are a methodological evaluator.
${GLOBAL_CONVENTION}
Input:
${scoutOutput}

Task:
Evaluate the certainty of evidence using GRADE principles.

For each reference:
- Evidence level: High / Moderate / Low / Very Low
- Risk of bias: Low / Moderate / High
- Main uncertainty factor (1 short sentence)

Output format: JSON array of objects with Ref-ID, Evidence, Bias, Uncertainty.
Do NOT repeat study descriptions. Do NOT add clinical interpretation.`,

  WRITER: (title: string, objective: string, memory: string, refs: string, tokenTarget: number) => `You are a medical scientific writer.
${GLOBAL_CONVENTION}
Section to write:
${title}

Objective:
${objective}

Context summary (MAX 5 lines):
${memory}

References allowed:
${refs}

Writing rules:
- IMRAD-compliant
- Academic style
- No introduction phrases
- No conclusion phrases
- Cite references as [Ref-01], not PMIDs
- Do not exceed ${tokenTarget} tokens
- Avoid redundancy with previous sections

Write only the section body.`,

  SUPERVISOR: (currentSection: string, previousSections: string) => `You are an academic supervisor.
${GLOBAL_CONVENTION}
Input:
- Current section: ${currentSection}
- Summary of previous sections: ${previousSections}

Task:
Provide editorial directives ONLY.

Output STRICTLY JSON with:
- logicalAdjustments (bullet points)
- redundanciesToRemove (bullet points)
- missingAngles (bullet points)
- suggestedFigureTitle (string)

Do NOT rewrite text. Do NOT add content. Do NOT exceed 120 tokens.`,

  GUARD: (text: string) => `You are a scientific language auditor.
${GLOBAL_CONVENTION}
Task:
Edit the text ONLY to:
- Remove AI-pattern phrases
- Normalize academic tone
- Improve sentence flow without changing meaning

Strict rules:
- Do NOT add new information
- Do NOT remove references
- Do NOT change structure
- Do NOT mention AI

Return the cleaned version only.
Text: ${text}`,

  FIGURE_PLANNER: (sectionText: string) => `You are a scientific figure planner.
${GLOBAL_CONVENTION}
Based on the following section:
${sectionText}

Propose up to 2 figures.

For each figure provide in a JSON array:
- id
- title
- type (e.g. Kaplan-Meier, schematic, bar chart)
- variables
- purpose (1 line)

Do NOT describe results. Do NOT invent data.`,

  ANNEXES: (manuscriptText: string) => `You are generating supplementary material.
${GLOBAL_CONVENTION}
Task:
List annexes relevant to the manuscript.

For each annex in JSON array:
- id
- title
- contentType (table, protocol, scale, dataset)
- source (Ref-ID if applicable)

Do NOT repeat manuscript text.
Manuscript: ${manuscriptText}`,

  BIBLIOGRAPHY: (refs: string) => `You are a reference compiler.
${GLOBAL_CONVENTION}
Input:
List of reference IDs with PMIDs or DOIs.
${refs}

Output:
- Vancouver style bibliography
- Ordered by appearance
- One reference per line

Do NOT add explanations.`,

  TRANSLATION: (text: string, lang: string) => `Translate the following scientific text into ${lang}.
${GLOBAL_CONVENTION}
Rules:
- Preserve structure and references
- Maintain academic tone
- Do NOT summarize
- Do NOT expand
- Do NOT add explanations

Text:
${text}`
};

// Specialized Agent Callers
export const scoutRetrieve = async (topic: string): Promise<ResearchPaper[]> => {
  const res = await callWithRetry({
    model: 'gemini-3-flash-preview',
    contents: AGENT_PROMPTS.SCOUT(topic),
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            authors: { type: Type.STRING },
            journal: { type: Type.STRING },
            year: { type: Type.STRING },
            pmid: { type: Type.STRING },
            studyType: { type: Type.STRING },
            population: { type: Type.STRING },
            outcome: { type: Type.STRING },
            limitation: { type: Type.STRING }
          }
        }
      }
    }
  });
  return JSON.parse(res.text || "[]");
};

export const analyzerGrade = async (papers: ResearchPaper[]): Promise<any[]> => {
  const input = papers.map(p => `${p.id}: ${p.title} (${p.studyType})`).join('\n');
  const res = await callWithRetry({
    model: 'gemini-3-flash-preview',
    contents: AGENT_PROMPTS.ANALYZER(input),
    config: { responseMimeType: 'application/json' }
  });
  return JSON.parse(res.text || "[]");
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
  return JSON.parse(res.text || "{}");
};

export const guardClean = async (text: string) => {
  const res = await callWithRetry({
    model: 'gemini-3-flash-preview',
    contents: AGENT_PROMPTS.GUARD(text),
  });
  return res.text || text;
};
