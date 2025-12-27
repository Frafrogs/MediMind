
import { Brain, FileText, Search, Dna, Activity, ShieldCheck, Scale, Microscope, BookOpen, UserCheck, ShieldAlert } from 'lucide-react';

export const STEPS = [
  {
    id: 'SCOPING',
    label: 'Cadrage PRISMA',
    icon: Microscope,
    description: 'Initialisation des protocoles de recherche et critères d\'inclusion.',
    color: 'text-slate-400'
  },
  {
    id: 'RETRIEVAL',
    label: 'Extraction Scout',
    icon: Search,
    description: 'Recherche systématique de la littérature scientifique.',
    color: 'text-sky-400'
  },
  {
    id: 'APPRAISAL',
    label: 'Analyse GRADE',
    icon: ShieldCheck,
    description: 'Évaluation de la certitude des preuves cliniques.',
    color: 'text-rose-400'
  },
  {
    id: 'WRITING',
    label: 'Micro-Rédaction',
    icon: FileText,
    description: 'Génération de contenu IMRAD haute-densité.',
    color: 'text-indigo-400'
  },
  {
    id: 'SUPERVISION',
    label: 'Supervision PhD',
    icon: UserCheck,
    description: 'Ajustements logiques et éditoriaux avancés.',
    color: 'text-amber-400'
  },
  {
    id: 'INTEGRITY',
    label: 'Garde d\'Intégrité',
    icon: ShieldAlert,
    description: 'Audit anti-hallucination et vérification des sources.',
    color: 'text-teal-400'
  },
  {
    id: 'COMPLETE',
    label: 'Certification',
    icon: BookOpen,
    description: 'Compilation finale du manuscrit certifié.',
    color: 'text-emerald-400'
  }
];

export const MOCK_LOGS = [
  "Initialisation du noyau de Médecine Fondée sur les Preuves...",
  "Chargement des modules du Cochrane Handbook...",
  "Calibration des matrices d'évaluation GRADE...",
  "Agent prêt pour une analyse rigoureuse."
];
