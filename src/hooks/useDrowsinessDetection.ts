import { useState, useRef, useCallback } from 'react';
import { FaceFeature } from 'expo-face-detector';
import { DetectionSettings, DetectionState, DetectionLogEntry } from '../types';
import { calculateEAR, calculateMAR, getFaceConfidence } from '../utils/faceAnalysis';
import {
  playAlarm,
  stopAlarm,
  triggerHapticWarning,
  triggerHapticSevere,
} from '../utils/alertManager';
import { appendDetectionLog } from '../utils/storage';

const INITIAL_STATE: DetectionState = {
  isMonitoring: false,
  eyeStatus: 'unknown',
  earValue: 1.0,
  marValue: 0,
  blinkCount: 0,
  yawnCount: 0,
  currentSpeed: 0,
  faceDetected: false,
  faceConfidence: 0,
  eyeClosureStartTime: null,
  warningLevel: 'none',
  warningStartTime: null,
  longBlinkTimestamps: [],
  yawnTimestamps: [],
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function useDrowsinessDetection(settings: DetectionSettings) {
  const [state, setState] = useState<DetectionState>(INITIAL_STATE);
  const stateRef = useRef<DetectionState>(INITIAL_STATE);
  const settingsRef = useRef<DetectionSettings>(settings);

  settingsRef.current = settings;

  const logEvent = useCallback((
    type: DetectionLogEntry['type'],
    details: string,
    earValue?: number,
    marValue?: number,
    speed?: number,
    warningLevel: 'mild' | 'severe' = 'mild'
  ) => {
    const entry: DetectionLogEntry = {
      id: generateId(),
      timestamp: Date.now(),
      type,
      details,
      earValue,
      marValue,
      speed,
      warningLevel,
    };
    appendDetectionLog(entry);
  }, []);

  const processFaces = useCallback((faces: FaceFeature[], currentSpeed: number) => {
    const s = settingsRef.current;
    const prev = stateRef.current;

    if (!prev.isMonitoring) return;

    const now = Date.now();

    if (!faces || faces.length === 0) {
      const newState: DetectionState = {
        ...prev,
        faceDetected: false,
        faceConfidence: 0,
        eyeStatus: 'unknown',
        currentSpeed,
      };
      stateRef.current = newState;
      setState(newState);
      return;
    }

    const face = faces[0];
    const ear = calculateEAR(face);
    const mar = calculateMAR(face);
    const confidence = getFaceConfidence(face);

    if (confidence < 0.4) {
      const newState: DetectionState = {
        ...prev,
        faceDetected: true,
        faceConfidence: confidence,
        earValue: ear,
        marValue: mar,
        eyeStatus: 'unknown',
        currentSpeed,
      };
      stateRef.current = newState;
      setState(newState);
      return;
    }

    const eyesClosed = ear < s.earThreshold;
    const eyeStatus = eyesClosed ? 'closed' : 'open';

    let eyeClosureStartTime = prev.eyeClosureStartTime;
    if (eyesClosed && !prev.eyeClosureStartTime) {
      eyeClosureStartTime = now;
    } else if (!eyesClosed) {
      eyeClosureStartTime = null;
    }

    const oneMinuteAgo = now - 60000;
    let longBlinkTimestamps = prev.longBlinkTimestamps.filter((t) => t > oneMinuteAgo);

    if (!eyesClosed && prev.eyeStatus === 'closed' && prev.eyeClosureStartTime) {
      const blinkDuration = (now - prev.eyeClosureStartTime) / 1000;
      if (blinkDuration >= 0.3) {
        longBlinkTimestamps = [...longBlinkTimestamps, now];
      }
    }

    const isYawning = mar > s.marThreshold;
    let yawnTimestamps = prev.yawnTimestamps.filter((t) => t > oneMinuteAgo);
    if (isYawning && prev.marValue <= s.marThreshold) {
      yawnTimestamps = [...yawnTimestamps, now];
    }

    const blinksPerMinute = longBlinkTimestamps.length;
    const yawnsPerMinute = yawnTimestamps.length;

    const speedAboveThreshold = currentSpeed >= s.minSpeedThreshold;
    let shouldFlag = false;
    const flagReasons: string[] = [];

    if (speedAboveThreshold) {
      if (eyesClosed && eyeClosureStartTime) {
        const closureSecs = (now - eyeClosureStartTime) / 1000;
        if (closureSecs >= s.eyeClosureDuration) {
          shouldFlag = true;
          flagReasons.push(`Eyes closed ${closureSecs.toFixed(1)}s`);
        }
      }

      if (blinksPerMinute > s.longBlinksPerMinute) {
        shouldFlag = true;
        flagReasons.push(`Blink rate: ${blinksPerMinute}/min`);
      }

      if (yawnsPerMinute > s.yawnCountPerMinute) {
        shouldFlag = true;
        flagReasons.push(`Yawns: ${yawnsPerMinute}/min`);
      }
    }

    let warningLevel = prev.warningLevel;
    let warningStartTime = prev.warningStartTime;

    if (shouldFlag) {
      if (warningLevel === 'none') {
        warningLevel = 'mild';
        warningStartTime = now;
        triggerHapticWarning();
        logEvent(
          flagReasons[0]?.includes('Eyes') ? 'eye_closure' :
          flagReasons[0]?.includes('Blink') ? 'blink_rate' :
          flagReasons[0]?.includes('Yawn') ? 'yawn' : 'combined',
          flagReasons.join(', '),
          ear, mar, currentSpeed, 'mild'
        );
      } else if (warningLevel === 'mild' && warningStartTime) {
        const warningDuration = (now - warningStartTime) / 1000;
        if (warningDuration >= s.warningEscalationDelay) {
          warningLevel = 'severe';
          playAlarm();
          triggerHapticSevere();
          logEvent('combined', `Escalated: ${flagReasons.join(', ')}`,
            ear, mar, currentSpeed, 'severe');
        }
      }
    } else {
      if (warningLevel !== 'none') {
        warningLevel = 'none';
        warningStartTime = null;
        stopAlarm();
      }
    }

    const newState: DetectionState = {
      ...prev,
      faceDetected: true,
      faceConfidence: confidence,
      eyeStatus,
      earValue: ear,
      marValue: mar,
      blinkCount: blinksPerMinute,
      yawnCount: yawnsPerMinute,
      currentSpeed,
      eyeClosureStartTime,
      warningLevel,
      warningStartTime,
      longBlinkTimestamps,
      yawnTimestamps,
    };

    stateRef.current = newState;
    setState(newState);
  }, [logEvent]);

  const startMonitoring = useCallback(() => {
    const newState: DetectionState = {
      ...INITIAL_STATE,
      isMonitoring: true,
    };
    stateRef.current = newState;
    setState(newState);
  }, []);

  const stopMonitoring = useCallback(() => {
    stopAlarm();
    const newState: DetectionState = {
      ...INITIAL_STATE,
      isMonitoring: false,
    };
    stateRef.current = newState;
    setState(newState);
  }, []);

  const dismissWarning = useCallback(() => {
    stopAlarm();
    const newState: DetectionState = {
      ...stateRef.current,
      warningLevel: 'none',
      warningStartTime: null,
    };
    stateRef.current = newState;
    setState(newState);
  }, []);

  return {
    state,
    processFaces,
    startMonitoring,
    stopMonitoring,
    dismissWarning,
  };
}
