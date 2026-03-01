import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import OnboardingScreen from './src/screens/OnboardingScreen';
import MonitoringScreen from './src/screens/MonitoringScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import DetectionLogScreen from './src/screens/DetectionLogScreen';
import { useSettings } from './src/hooks/useSettings';
import { isOnboardingComplete } from './src/utils/storage';
import { COLORS } from './src/constants/defaults';

type Screen = 'monitoring' | 'settings' | 'log' | 'onboarding';

export default function App() {
  const { settings, isLoaded } = useSettings();
  const [currentScreen, setCurrentScreen] = useState<Screen>('monitoring');
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    isOnboardingComplete().then((done) => {
      setOnboardingDone(done);
      if (!done) {
        setCurrentScreen('onboarding');
      }
    });
  }, []);

  // Loading state
  if (!isLoaded || onboardingDone === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent />
      {currentScreen === 'onboarding' && (
        <OnboardingScreen
          onComplete={() => {
            setOnboardingDone(true);
            setCurrentScreen('monitoring');
          }}
        />
      )}
      {currentScreen === 'monitoring' && (
        <MonitoringScreen
          settings={settings}
          onOpenSettings={() => setCurrentScreen('settings')}
          onOpenLog={() => setCurrentScreen('log')}
        />
      )}
      {currentScreen === 'settings' && (
        <SettingsScreen onBack={() => setCurrentScreen('monitoring')} />
      )}
      {currentScreen === 'log' && (
        <DetectionLogScreen onBack={() => setCurrentScreen('monitoring')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
