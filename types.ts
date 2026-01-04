export enum AppView {
  DASHBOARD = 'DASHBOARD',
  MEETING_ARCHIVE = 'MEETING_ARCHIVE',
  CRM_INTEL = 'CRM_INTEL',
  TRAINING_SIMULATOR = 'TRAINING_SIMULATOR',
}

export type Language = 'en' | 'zh-cn' | 'zh-tw';

export enum RoleplayMode {
  TEXT = 'TEXT',
  VOICE = 'VOICE',
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
  isAudio?: boolean; // If true, it was a spoken interaction
}

export interface CustomerProfile {
  id: string;
  name: string;
  industry: string;
  painPoints: string[];
  personalityTraits: string[];
  lastContact: string;
  status: 'Lead' | 'Active' | 'Churned';
  notes: string;
  conversationLogs?: { date: string; summary: string; fullText: string }[];
}

export interface SimulationConfig {
  scenario: string; // e.g., "Insurance Sales", "Tech Support"
  difficulty: 'Easy' | 'Medium' | 'Hard';
  customerName: string;
  customerPersona: string;
}

export interface MeetingRecord {
  id: string;
  title: string;
  date: string;
  summary: string;
  transcript: string;
  // Extended fields
  participants?: string[];
  minutes?: string[]; // Official minutes/action items
  tags: string[];
  mindMapNodes?: { id: string, label: string, parentId?: string }[];
  highlights?: { text: string; sentiment: 'positive' | 'negative' | 'neutral' }[];
}
