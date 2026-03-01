import { useState, useEffect, useCallback } from 'react';
import { DetectionSettings } from '../types';
import { DEFAULT_SETTINGS } from '../constants/defaults';
import { loadSettings, saveSettings } from '../utils/storage';

export function useSettings() {
  const [settings, setSettings] = useState<DetectionSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadSettings().then((loaded) => {
      setSettings(loaded);
      setIsLoaded(true);
    });
  }, []);

  const updateSettings = useCallback(async (newSettings: DetectionSettings) => {
    setSettings(newSettings);
    await saveSettings(newSettings);
  }, []);

  const resetToDefaults = useCallback(async () => {
    setSettings({ ...DEFAULT_SETTINGS });
    await saveSettings({ ...DEFAULT_SETTINGS });
  }, []);

  return { settings, updateSettings, resetToDefaults, isLoaded };
}
