
export type AgentRole =
  | "SCOUT"
  | "ANALYZER"
  | "WRITER"
  | "EDITOR"
  | "GUARD"
  | "REVIEWER2"
  | "TRANSLATOR"
  | "SUPERVISOR"
  | "FIGURE_PLANNER"
  | "ANNEX_GENERATOR"
  | "BIBLIOGRAPHY_COMPILER";

export interface MemorySnapshot {
  globalSummary: string;
  chapterSummaries: Record<string, string>;
  keyFindings: string[];
}

export interface WritingConstraints {
  maxWords: number;
  maxSentenceLength: number;
  tone: "ACADEMIC_MEDICAL";
}

export interface AgentInput {
  topic: string;
  section: string;
  memory: MemorySnapshot;
  constraints: WritingConstraints;
}

export interface AgentOutput {
  content: string;
  confidenceScore?: number;
  citations?: string[];
  flags?: string[];
}

export enum AgentState {
  IDLE = 'IDLE',
  SCOPING = 'SCOPING',
  RETRIEVAL = 'RETRIEVAL',
  APPRAISAL = 'APPRAISAL',
  SYNTHESIS = 'SYNTHESIS',
  DESIGNING = 'DESIGNING',
  WRITING = 'WRITING',
  INTEGRITY = 'INTEGRITY',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export type AppView = 'LANDING' | 'DASHBOARD' | 'REPORT';
export type ResearchMode = 'STUDENT' | 'RESEARCHER';

export interface ResearchPaper {
  id: string; // Ref-01, Ref-02...
  title: string;
  authors: string;
  journal: string;
  year: string;
  pmid: string;
  doi: string;
  studyType: string; 
  riskOfBias: 'LOW' | 'MODERATE' | 'HIGH';
  population: string;
  outcome: string;
  abstractSnippet: string;
  evidenceLevel?: 'High' | 'Moderate' | 'Low' | 'Very Low';
  uncertaintyFactor?: string;
}

export interface SynthesisResult {
  gradeLevel: 'HIGH' | 'MODERATE' | 'LOW' | 'VERY_LOW';
  clinicalConsensus: string[];
  biasAssessment: string;
  evidenceGaps: string[];
}

export interface HypothesisResult {
  statement: string;
  mechanism: string;
  hillCriteria: string;
}

export interface StudyDesign {
  title: string;
  phase: string;
  designType: string;
  randomization: string;
  blinding: string;
  primaryEndpoint: string;
  sampleSizePower: string;
}

export interface ScientificArticle {
  title: string;
  abstract: string;
  introduction: string;
  methodology: string;
  analysisPlan: string;
  implications: string;
  uncertaintyZones: string;
  references: string[];
}

export interface ThesisSection {
  title: string;
  content: string;
  wordCount: number;
  validated: boolean;
}

export interface ThesisChapter {
  title: string;
  sections: ThesisSection[];
  summary: string;
}

export interface FigureBlueprint {
  id: string;
  type: string;
  title: string;
  variables: string[];
  purpose: string;
}

export interface DetailedThesis {
  title: string;
  chapters: ThesisChapter[];
  metaPlan: string;
  figures: FigureBlueprint[];
  annexes: { id: string; title: string; contentType: string; source: string }[];
}

export interface AgentLog {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'thought' | 'security' | 'scout' | 'guard' | 'supervisor' | 'editor' | 'reviewer' | 'translator' | 'analyzer';
}
