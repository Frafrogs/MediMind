
import { Brain, FileText, Search, Dna, Activity, ShieldCheck, Scale, Microscope, BookOpen, UserCheck, ShieldAlert } from 'lucide-react';

export const STEPS = [
  {
    id: 'SCOPING',
    label: 'Cadrage PRISMA',
    icon: Microscope,
    description: 'Initialisation des protocoles de recherche.',
    color: 'text-slate-400'
  },
  {
    id: 'RETRIEVAL',
    label: 'Scout Retrieval',
    icon: Search,
    description: 'Extraction systématique de la littérature.',
    color: 'text-sky-400'
  },
  {
    id: 'APPRAISAL',
    label: 'GRADE Analysis',
    icon: ShieldCheck,
    description: 'Évaluation de la certitude des preuves.',
    color: 'text-rose-400'
  },
  {
    id: 'WRITING',
    label: 'Micro-Sectioning',
    icon: FileText,
    description: 'Rédaction IMRAD haute-densité.',
    color: 'text-indigo-400'
  },
  {
    id: 'SUPERVISION',
    label: 'PhD Supervision',
    icon: UserCheck,
    description: 'Ajustements logiques et éditoriaux.',
    color: 'text-amber-400'
  },
  {
    id: 'INTEGRITY',
    label: 'Integrity Guard',
    icon: ShieldAlert,
    description: 'Audit anti-IA et plagiat.',
    color: 'text-teal-400'
  },
  {
    id: 'COMPLETE',
    label: 'Certification',
    icon: BookOpen,
    description: 'Compilation du manuscrit final.',
    color: 'text-emerald-400'
  }
];

export const MOCK_LOGS = [
  "Initialisation du noyau de Médecine Fondée sur les Preuves...",
  "Chargement des modules du Cochrane Handbook...",
  "Calibration des matrices d'évaluation GRADE...",
  "Agent prêt pour une analyse rigoureuse."
];
