import { DetectionSettings } from '../types';

export const DEFAULT_SETTINGS: DetectionSettings = {
  minSpeedThreshold: 0,
  earThreshold: 0.18,
  eyeClosureDuration: 2,
  longBlinksPerMinute: 3,
  marThreshold: 0.6,
  yawnCountPerMinute: 2,
  warningEscalationDelay: 5,
  sensitivityPreset: 'medium',
};

export const LOW_SENSITIVITY: Partial<DetectionSettings> = {
  earThreshold: 0.14,
  eyeClosureDuration: 4,
  longBlinksPerMinute: 6,
  marThreshold: 0.7,
  yawnCountPerMinute: 4,
  warningEscalationDelay: 10,
  sensitivityPreset: 'low',
};

export const MEDIUM_SENSITIVITY: Partial<DetectionSettings> = {
  earThreshold: 0.18,
  eyeClosureDuration: 2,
  longBlinksPerMinute: 3,
  marThreshold: 0.6,
  yawnCountPerMinute: 2,
  warningEscalationDelay: 5,
  sensitivityPreset: 'medium',
};

export const HIGH_SENSITIVITY: Partial<DetectionSettings> = {
  earThreshold: 0.24,
  eyeClosureDuration: 1.5,
  longBlinksPerMinute: 2,
  marThreshold: 0.5,
  yawnCountPerMinute: 1,
  warningEscalationDelay: 3,
  sensitivityPreset: 'high',
};

export const STORAGE_KEYS = {
  SETTINGS: '@izzydrive_settings',
  ONBOARDING_COMPLETE: '@izzydrive_onboarding_complete',
  DETECTION_LOG: '@izzydrive_detection_log',
};

export const COLORS = {
  background: '#121212',
  surface: '#1E1E1E',
  surfaceLight: '#2C2C2C',
  primary: '#4FC3F7',
  primaryDark: '#0288D1',
  accent: '#FF6F00',
  warning: '#FFA726',
  danger: '#EF5350',
  success: '#66BB6A',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textMuted: '#757575',
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  overlayDanger: 'rgba(239, 83, 80, 0.85)',
};
