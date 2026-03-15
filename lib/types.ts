export interface User {
  id: string;
  username: string;
  password: string;
  created_at: string;
}

export interface Rating {
  id: string;
  rater_id: string;
  target_id: string;
  rudeness: number;
  self_conscious: number;
  childish: number;
  random_talk: number;
  behavior: number;
  useless_kindness: number;
  created_at: string;
  updated_at: string;
}

export interface SessionData {
  userId: string;
  username: string;
}

export interface CategoryDef {
  key: string;
  dbKey: keyof Pick<Rating, 'rudeness' | 'self_conscious' | 'childish' | 'random_talk' | 'behavior' | 'useless_kindness'>;
  label: string;
  emoji: string;
}

export const CATEGORIES: CategoryDef[] = [
  { key: 'rudeness', dbKey: 'rudeness', label: '失礼さ', emoji: '😤' },
  { key: 'selfConscious', dbKey: 'self_conscious', label: '自意識過剰さ', emoji: '🪞' },
  { key: 'childish', dbKey: 'childish', label: '子供っぽさ', emoji: '👶' },
  { key: 'random', dbKey: 'random_talk', label: '脈略のなさ', emoji: '🌀' },
  { key: 'behavior', dbKey: 'behavior', label: '日頃の行い', emoji: '💀' },
  { key: 'kindness', dbKey: 'useless_kindness', label: '意味のない優しさ', emoji: '🫠' },
];

export const COLORS = {
  bg: '#0a0a0f',
  card: '#151520',
  cardHover: '#1a1a2e',
  accent: '#ff3e3e',
  accentGlow: 'rgba(255,62,62,0.3)',
  gold: '#ffd700',
  text: '#e8e8f0',
  textDim: '#6a6a80',
  border: '#2a2a3e',
  inputBg: '#0e0e18',
  success: '#4ade80',
  chart: ['#ff3e3e', '#ff8c42', '#ffd700', '#4ade80', '#38bdf8', '#a78bfa'],
};

export interface AverageData {
  [key: string]: number;
  _count: number;
}

export interface RankingEntry {
  username: string;
  userId: string;
  avg: AverageData | null;
  total: number;
  count: number;
}
