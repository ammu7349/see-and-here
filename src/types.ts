export interface SceneAnalysis {
  immediateWalkingPath: string;
  objectsInReach: string;
  lightAndOrientation: string;
  obstacleAssessment: string;
  overallSummary: string;
  clarityScore: number;
  verifiedSafe: boolean;
  modelName: string;
}

export type DemoState = 'results' | 'empty' | 'analyzing' | 'playing' | 'error';
export type ActiveTab = 'live' | 'radar' | 'history' | 'settings';
export type TextSize = 'normal' | 'large' | 'xlarge';

export interface SoundEvent {
  id: string;
  timestamp: string;
  label: string;
  category: 'emergency' | 'household' | 'voice';
  decibels: number;
  directionDegrees: number; // 0 = 12 o'clock (front), 90 = 3 o'clock (right), 180 = behind, 270 = left
  distanceEstimate: string;
  urgent: boolean;
}

export interface HistoryScan {
  id: string;
  timestamp: number;
  displayTime: string;
  locationLabel: string;
  imageUrl: string;
  analysis: SceneAnalysis;
}

export interface SensoryPreferences {
  hapticFeedback: boolean;
  autoNarrate: boolean;
  highContrast: boolean;
  textSize: TextSize;
  speechRate: number;
  voice: string;
  distanceUnits: 'feet' | 'meters';
  detailLevel: 'concise' | 'standard' | 'in-depth';
  micListening: boolean;
}
