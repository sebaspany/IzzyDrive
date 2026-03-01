import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { COLORS } from '../constants/defaults';
import { setOnboardingComplete } from '../utils/storage';

const { width } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

const TIPS = [
  {
    icon: '📱',
    title: 'Mount Your Phone',
    description:
      'Place your phone on the center console or dashboard, angled toward your face. Use a sturdy mount to minimize vibration.',
  },
  {
    icon: '😎',
    title: 'Remove Sunglasses',
    description:
      'For best eye detection accuracy, remove sunglasses or tinted eyewear. Regular prescription glasses are fine.',
  },
  {
    icon: '🔧',
    title: 'Test at 0 mph First',
    description:
      'Start with the minimum speed threshold at 0 mph to test detection while stationary. Make sure it detects your face before driving.',
  },
  {
    icon: '⚙️',
    title: 'Adjust Sensitivity',
    description:
      'If detection is too sensitive or too loose due to your mounting angle or lighting, use the Settings screen to fine-tune thresholds.',
  },
  {
    icon: '💡',
    title: 'Lighting Matters',
    description:
      'Ensure adequate lighting on your face. Dashboard ambient light usually works, but avoid strong backlighting.',
  },
  {
    icon: '🔋',
    title: 'Battery Tips',
    description:
      'Camera + GPS use significant battery. Keep your phone plugged in while using IzzyDrive for extended drives.',
  },
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentPage, setCurrentPage] = useState(0);

  const handleNext = () => {
    if (currentPage < TIPS.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    await setOnboardingComplete();
    onComplete();
  };

  const tip = TIPS[currentPage];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>IzzyDrive</Text>
        <Text style={styles.subtitle}>Stay Awake, Stay Safe – Your Smart Driver Companion</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.icon}>{tip.icon}</Text>
        <Text style={styles.tipTitle}>{tip.title}</Text>
        <Text style={styles.tipDescription}>{tip.description}</Text>
      </View>

      <View style={styles.pagination}>
        {TIPS.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, index === currentPage && styles.dotActive]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.skipButton} onPress={handleFinish}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextText}>
            {currentPage === TIPS.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  icon: {
    fontSize: 72,
    marginBottom: 24,
  },
  tipTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  tipDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textMuted,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipText: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  nextButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  nextText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.background,
  },
});
