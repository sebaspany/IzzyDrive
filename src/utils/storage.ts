import AsyncStorage from '@react-native-async-storage/async-storage';
import { DetectionSettings, DetectionLogEntry } from '../types';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../constants/defaults';

export async function loadSettings(): Promise<DetectionSettings> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (json) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(json) };
    }
    return { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings: DetectionSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings:', e);
  }
}

export async function isOnboardingComplete(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function setOnboardingComplete(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
  } catch (e) {
    console.warn('Failed to save onboarding state:', e);
  }
}

export async function loadDetectionLog(): Promise<DetectionLogEntry[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.DETECTION_LOG);
    if (json) {
      return JSON.parse(json);
    }
    return [];
  } catch {
    return [];
  }
}

export async function appendDetectionLog(entry: DetectionLogEntry): Promise<void> {
  try {
    const log = await loadDetectionLog();
    log.push(entry);
    // Keep last 500 entries
    const trimmed = log.slice(-500);
    await AsyncStorage.setItem(STORAGE_KEYS.DETECTION_LOG, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Failed to append detection log:', e);
  }
}

export async function clearDetectionLog(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.DETECTION_LOG, JSON.stringify([]));
  } catch (e) {
    console.warn('Failed to clear detection log:', e);
  }
}
