import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { DetectionSettings, SensitivityPreset } from '../types';
import {
  COLORS,
  DEFAULT_SETTINGS,
  LOW_SENSITIVITY,
  MEDIUM_SENSITIVITY,
  HIGH_SENSITIVITY,
} from '../constants/defaults';
import { loadSettings, saveSettings } from '../utils/storage';

interface SettingsScreenProps {
  onBack: () => void;
}

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [settings, setSettings] = useState<DetectionSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadSettings().then((loaded) => {
      setSettings(loaded);
      setIsLoaded(true);
    });
  }, []);

  const updateField = <K extends keyof DetectionSettings>(
    key: K,
    value: DetectionSettings[K]
  ) => {
    const updated = { ...settings, [key]: value, sensitivityPreset: 'custom' as const };
    setSettings(updated);
    saveSettings(updated);
  };

  const applyPreset = (preset: SensitivityPreset) => {
    let presetValues: Partial<DetectionSettings>;
    switch (preset) {
      case 'low':
        presetValues = LOW_SENSITIVITY;
        break;
      case 'high':
        presetValues = HIGH_SENSITIVITY;
        break;
      default:
        presetValues = MEDIUM_SENSITIVITY;
        break;
    }
    const updated = { ...settings, ...presetValues };
    setSettings(updated);
    saveSettings(updated);
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset to Defaults',
      'Are you sure you want to reset all settings to their default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setSettings({ ...DEFAULT_SETTINGS });
            saveSettings({ ...DEFAULT_SETTINGS });
          },
        },
      ]
    );
  };

  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Sensitivity Presets */}
        <Text style={styles.sectionTitle}>Sensitivity Presets</Text>
        <View style={styles.presetsRow}>
          {(['low', 'medium', 'high'] as SensitivityPreset[]).map((preset) => (
            <TouchableOpacity
              key={preset}
              style={[
                styles.presetButton,
                settings.sensitivityPreset === preset && styles.presetButtonActive,
              ]}
              onPress={() => applyPreset(preset)}
            >
              <Text
                style={[
                  styles.presetText,
                  settings.sensitivityPreset === preset && styles.presetTextActive,
                ]}
              >
                {preset.charAt(0).toUpperCase() + preset.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {settings.sensitivityPreset === 'custom' && (
          <Text style={styles.customNote}>Custom settings active</Text>
        )}

        {/* Speed Threshold */}
        <Text style={styles.sectionTitle}>Speed Settings</Text>
        <SliderSetting
          label="Min Speed Threshold"
          value={settings.minSpeedThreshold}
          min={0}
          max={80}
          step={1}
          unit="mph"
          description="Monitoring activates above this speed (0 = always active)"
          onChange={(v) => updateField('minSpeedThreshold', v)}
        />

        {/* Eye Detection */}
        <Text style={styles.sectionTitle}>Eye Detection</Text>
        <SliderSetting
          label="EAR Threshold (Eye Closure)"
          value={settings.earThreshold}
          min={0.1}
          max={0.3}
          step={0.01}
          unit=""
          decimals={2}
          description="Eyes considered closed if avg EAR below this value"
          onChange={(v) => updateField('earThreshold', v)}
        />
        <SliderSetting
          label="Eye Closure Duration"
          value={settings.eyeClosureDuration}
          min={1}
          max={5}
          step={0.5}
          unit="sec"
          decimals={1}
          description="Flag if eyes closed longer than this"
          onChange={(v) => updateField('eyeClosureDuration', v)}
        />
        <SliderSetting
          label="Long Blinks per Minute"
          value={settings.longBlinksPerMinute}
          min={1}
          max={10}
          step={1}
          unit="/min"
          description="Flag if more long closures per minute than this"
          onChange={(v) => updateField('longBlinksPerMinute', v)}
        />

        {/* Yawn Detection */}
        <Text style={styles.sectionTitle}>Yawn Detection</Text>
        <SliderSetting
          label="MAR Threshold (Yawn)"
          value={settings.marThreshold}
          min={0.4}
          max={0.8}
          step={0.01}
          unit=""
          decimals={2}
          description="Mouth considered wide open (yawning) if MAR above this"
          onChange={(v) => updateField('marThreshold', v)}
        />
        <SliderSetting
          label="Yawns per Minute"
          value={settings.yawnCountPerMinute}
          min={1}
          max={5}
          step={1}
          unit="/min"
          description="Flag if more yawns per minute than this"
          onChange={(v) => updateField('yawnCountPerMinute', v)}
        />

        {/* Warning Settings */}
        <Text style={styles.sectionTitle}>Warning Behavior</Text>
        <SliderSetting
          label="Escalation Delay"
          value={settings.warningEscalationDelay}
          min={3}
          max={15}
          step={1}
          unit="sec"
          description="Time before mild warning escalates to alarm + vibrate"
          onChange={(v) => updateField('warningEscalationDelay', v)}
        />

        {/* Reset */}
        <TouchableOpacity style={styles.resetButton} onPress={resetToDefaults}>
          <Text style={styles.resetText}>Reset to Defaults</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

interface SliderSettingProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  decimals?: number;
  description: string;
  onChange: (value: number) => void;
}

function SliderSetting({
  label,
  value,
  min,
  max,
  step,
  unit,
  decimals = 0,
  description,
  onChange,
}: SliderSettingProps) {
  return (
    <View style={styles.settingItem}>
      <View style={styles.settingHeader}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingValue}>
          {value.toFixed(decimals)} {unit}
        </Text>
      </View>
      <Text style={styles.settingDescription}>{description}</Text>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={COLORS.primary}
        maximumTrackTintColor={COLORS.surfaceLight}
        thumbTintColor={COLORS.primary}
      />
      <View style={styles.sliderLabels}>
        <Text style={styles.sliderLabel}>
          {min.toFixed(decimals)} {unit}
        </Text>
        <Text style={styles.sliderLabel}>
          {max.toFixed(decimals)} {unit}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  backButton: {
    width: 70,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 24,
    marginBottom: 12,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
  },
  presetButtonActive: {
    backgroundColor: COLORS.primary,
  },
  presetText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  presetTextActive: {
    color: COLORS.background,
  },
  customNote: {
    fontSize: 12,
    color: COLORS.accent,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  settingItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  settingValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 8,
  },
  settingDescription: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 12,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  sliderLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  resetButton: {
    marginTop: 24,
    backgroundColor: COLORS.danger,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
});
