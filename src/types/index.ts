export interface DetectionSettings {
  minSpeedThreshold: number; // 0-80 mph, default 0
  earThreshold: number; // 0.10-0.30, default 0.18
  eyeClosureDuration: number; // 1-5 seconds, default 2
  longBlinksPerMinute: number; // 1-10, default 3
  marThreshold: number; // 0.4-0.8, default 0.6
  yawnCountPerMinute: number; // 1-5, default 2
  warningEscalationDelay: number; // 3-15 seconds, default 5
  sensitivityPreset: 'low' | 'medium' | 'high' | 'custom';
}

export interface DetectionState {
  isMonitoring: boolean;
  eyeStatus: 'open' | 'closed' | 'unknown';
  earValue: number;
  marValue: number;
  blinkCount: number;
  yawnCount: number;
  currentSpeed: number;
  faceDetected: boolean;
  faceConfidence: number;
  eyeClosureStartTime: number | null;
  warningLevel: 'none' | 'mild' | 'severe';
  warningStartTime: number | null;
  longBlinkTimestamps: number[];
  yawnTimestamps: number[];
}

export interface DetectionLogEntry {
  id: string;
  timestamp: number;
  type: 'eye_closure' | 'blink_rate' | 'yawn' | 'combined' | 'face_lost';
  details: string;
  earValue?: number;
  marValue?: number;
  speed?: number;
  warningLevel: 'mild' | 'severe';
}

export type SensitivityPreset = 'low' | 'medium' | 'high' | 'custom';
