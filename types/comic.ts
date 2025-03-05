export type ComicFormat = 'short' | 'standard' | 'detailed';

export interface ComicStructure {
  minPanels: number;
  maxPanels: number;
  structure: string[];
  dialogueLength: number; // max words per dialogue
  detailLevel: 'minimal' | 'balanced' | 'full';
}

export const COMIC_FORMATS: Record<ComicFormat, ComicStructure> = {
  short: {
    minPanels: 3,
    maxPanels: 4,
    structure: [
      'Introduction - Set up the scene',
      'Action - Something happens',
      'Reaction - Character responds',
      'Conclusion - Punchline or resolution'
    ],
    dialogueLength: 15,
    detailLevel: 'minimal'
  },
  standard: {
    minPanels: 6,
    maxPanels: 8,
    structure: [
      'Scene Setup - Introduce characters & location',
      'Problem Introduction - Conflict appears',
      'Action Begins - Characters respond',
      'Development - Story progresses',
      'Climax - Peak moment',
      'Resolution - Problem solved',
      'Reaction - Characters respond',
      'Ending - Final moment or lesson'
    ],
    dialogueLength: 25,
    detailLevel: 'balanced'
  },
  detailed: {
    minPanels: 10,
    maxPanels: 12,
    structure: [
      'Opening Scene - Setting establishment',
      'Character Introduction - Main characters appear',
      'Conflict Introduction - Problem arises',
      'First Attempt - Initial action',
      'Complication - Problem intensifies',
      'Character Development - Deeper insight',
      'Turning Point - Key moment',
      'Rising Action - Tension builds',
      'Climactic Scene - Major confrontation',
      'Resolution Begins - Problem solving',
      'Aftermath - Consequences shown',
      'Final Scene - Story conclusion'
    ],
    dialogueLength: 35,
    detailLevel: 'full'
  }
};
