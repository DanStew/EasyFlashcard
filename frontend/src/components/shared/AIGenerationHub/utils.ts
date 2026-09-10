// ==========================================
// AIGenerationHub - Utilities & Metadata
// ==========================================

export interface StudioFeaturePill {
  id: string;
  iconName: string;
  title: string;
  description: string;
}

export const STUDIO_FEATURES: StudioFeaturePill[] = [
  {
    id: 'grounding',
    iconName: 'FileCheck',
    title: 'Strict Document Grounding',
    description: 'Directly grounded in your lecture slides with slide and page citation markers.',
  },
  {
    id: 'latex',
    iconName: 'Sigma',
    title: 'LaTeX Math & Science Formulas',
    description: 'Accurate KaTeX equations ($E=mc^2$) and code blocks formatted automatically.',
  },
  {
    id: 'agents',
    iconName: 'Workflow',
    title: 'LangGraph Multi-Agent Audit',
    description: 'Automated Curriculum Planner and Quality Reviewer ensure no missed concepts.',
  },
];
