import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';
import { DetectionSettings } from '../types';
import { COLORS } from '../constants/defaults';
import { useDrowsinessDetection } from '../hooks/useDrowsinessDetection';
import { useSpeed } from '../hooks/useSpeed';
import { initializeAudio, stopAlarm } from '../utils/alertManager';

interface MonitoringScreenProps {
  settings: DetectionSettings;
  onOpenSettings: () => void;
  onOpenLog: () => void;
}

export default function MonitoringScreen({
  settings,
  onOpenSettings,
  onOpenLog,
}: MonitoringScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const { speed, startTracking, stopTracking } = useSpeed();
  const {
    state,
    processFaces,
    startMonitoring,
    stopMonitoring,
    dismissWarning,
  } = useDrowsinessDetection(settings);

  const cameraRef = useRef<CameraView>(null);
  const detectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isProcessingRef = useRef(false);
  const flashAnim = useRef(new Animated.Value(0)).current;
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const flashLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const speedRef = useRef(0);

  // Keep speed ref up to date
  speedRef.current = speed;

  // Initialize audio on mount
  useEffect(() => {
    initializeAudio();
  }, []);

  // Periodic face detection via frame capture
  const runFaceDetection = useCallback(async () => {
    if (isProcessingRef.current || !cameraRef.current) return;
    isProcessingRef.current = true;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.3,
        skipProcessing: true,
        shutterSound: false,
      });

      if (photo && photo.uri) {
        const result = await FaceDetector.detectFacesAsync(photo.uri, {
          mode: FaceDetector.FaceDetectorMode.fast,
          detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
          runClassifications: FaceDetector.FaceDetectorClassifications.all,
        });

        processFaces(result.faces, speedRef.current);
      }
    } catch {
      // Camera might not be ready yet, skip this frame
    } finally {
      isProcessingRef.current = false;
    }
  }, [processFaces]);

  // Start/stop detection interval when monitoring state changes
  useEffect(() => {
    if (state.isMonitoring) {
      detectionIntervalRef.current = setInterval(runFaceDetection, 500);
    } else {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    }

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    };
  }, [state.isMonitoring, runFaceDetection]);

  // Handle red flash animation for severe warnings
  useEffect(() => {
    if (state.warningLevel === 'severe') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(flashAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(flashAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
      flashLoopRef.current = loop;
      loop.start();
    } else {
      if (flashLoopRef.current) {
        flashLoopRef.current.stop();
        flashLoopRef.current = null;
      }
      flashAnim.setValue(0);
    }

    return () => {
      if (flashLoopRef.current) {
        flashLoopRef.current.stop();
      }
    };
  }, [state.warningLevel, flashAnim]);

  // Handle banner animation
  useEffect(() => {
    Animated.timing(bannerAnim, {
      toValue: state.warningLevel !== 'none' ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [state.warningLevel, bannerAnim]);

  const handleToggleMonitoring = useCallback(async () => {
    if (state.isMonitoring) {
      stopMonitoring();
      stopTracking();
    } else {
      startMonitoring();
      await startTracking();
    }
  }, [state.isMonitoring, startMonitoring, stopMonitoring, startTracking, stopTracking]);

  // Permission handling
  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionIcon}>📷</Text>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          IzzyDrive needs camera access to monitor for drowsiness while driving.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Full-screen camera preview */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
      />

      {/* Red flash overlay for severe warning */}
      <Animated.View
        style={[
          styles.flashOverlay,
          {
            opacity: flashAnim,
          },
        ]}
        pointerEvents="none"
      />

      {/* Top-left overlay: Speed info */}
      <View style={styles.topLeftOverlay}>
        <Text style={styles.overlayLabel}>SPEED</Text>
        <Text style={styles.speedValue}>{speed} mph</Text>
        <Text style={styles.speedThreshold}>
          Min: {settings.minSpeedThreshold} mph
        </Text>
        {speed < settings.minSpeedThreshold && state.isMonitoring && (
          <Text style={styles.belowThresholdText}>Below threshold</Text>
        )}
      </View>

      {/* Top-right overlay: Monitoring status + eye info */}
      <View style={styles.topRightOverlay}>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: state.isMonitoring
                  ? state.faceDetected
                    ? COLORS.success
                    : COLORS.warning
                  : COLORS.textMuted,
              },
            ]}
          />
          <Text style={styles.overlayLabel}>
            {state.isMonitoring
              ? state.faceDetected
                ? 'MONITORING'
                : 'NO FACE'
              : 'STOPPED'}
          </Text>
        </View>
        {state.isMonitoring && state.faceDetected && (
          <>
            <Text
              style={[
                styles.eyeStatus,
                state.eyeStatus === 'closed' && styles.eyeStatusClosed,
              ]}
            >
              Eyes: {state.eyeStatus === 'open' ? 'Open' : state.eyeStatus === 'closed' ? 'Closed' : '—'}
            </Text>
            <Text style={styles.overlayDetail}>
              Blinks: {state.blinkCount}/min
            </Text>
            <Text style={styles.overlayDetail}>
              Yawns: {state.yawnCount}/min
            </Text>
            <Text style={styles.overlayDetail}>
              EAR: {state.earValue.toFixed(2)} | MAR: {state.marValue.toFixed(2)}
            </Text>
          </>
        )}
        {state.isMonitoring && state.faceDetected && state.faceConfidence < 0.4 && (
          <Text style={styles.lowConfidenceText}>
            Face partially visible{'\n'}Adjust angle
          </Text>
        )}
      </View>

      {/* Bottom-center: Warning banner */}
      <Animated.View
        style={[
          styles.warningBanner,
          state.warningLevel === 'severe'
            ? styles.warningBannerSevere
            : styles.warningBannerMild,
          {
            transform: [
              {
                translateY: bannerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [100, 0],
                }),
              },
            ],
            opacity: bannerAnim,
          },
        ]}
      >
        <TouchableOpacity onPress={dismissWarning} style={styles.warningContent}>
          {state.warningLevel === 'severe' ? (
            <>
              <Text style={styles.warningIconSevere}>🚨</Text>
              <Text style={styles.warningTextSevere}>
                WAKE UP! Pull over safely!
              </Text>
              <Text style={styles.warningDismiss}>Tap to dismiss</Text>
            </>
          ) : (
            <>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningTextMild}>
                Drowsiness detected – take a break?
              </Text>
              <Text style={styles.warningDismissMild}>Tap to dismiss</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Bottom bar: Controls */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.iconButton} onPress={onOpenLog}>
          <Text style={styles.iconButtonText}>📋</Text>
          <Text style={styles.iconButtonLabel}>Log</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.mainButton,
            state.isMonitoring ? styles.mainButtonStop : styles.mainButtonStart,
          ]}
          onPress={handleToggleMonitoring}
        >
          <Text style={styles.mainButtonText}>
            {state.isMonitoring ? 'STOP' : 'START'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={onOpenSettings}>
          <Text style={styles.iconButtonText}>⚙️</Text>
          <Text style={styles.iconButtonLabel}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlayDanger,
  },
  topLeftOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    backgroundColor: COLORS.overlay,
    borderRadius: 12,
    padding: 12,
    minWidth: 120,
  },
  overlayLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: 2,
  },
  speedValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  speedThreshold: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  belowThresholdText: {
    fontSize: 10,
    color: COLORS.warning,
    marginTop: 2,
    fontStyle: 'italic',
  },
  topRightOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 16,
    backgroundColor: COLORS.overlay,
    borderRadius: 12,
    padding: 12,
    minWidth: 140,
    alignItems: 'flex-end',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  eyeStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.success,
    marginBottom: 2,
  },
  eyeStatusClosed: {
    color: COLORS.danger,
  },
  overlayDetail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  lowConfidenceText: {
    fontSize: 11,
    color: COLORS.warning,
    marginTop: 6,
    textAlign: 'right',
    fontStyle: 'italic',
  },
  warningBanner: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  warningBannerMild: {
    backgroundColor: 'rgba(255, 167, 38, 0.9)',
  },
  warningBannerSevere: {
    backgroundColor: 'rgba(239, 83, 80, 0.95)',
  },
  warningContent: {
    padding: 16,
    alignItems: 'center',
  },
  warningIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  warningIconSevere: {
    fontSize: 32,
    marginBottom: 4,
  },
  warningTextMild: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.background,
    textAlign: 'center',
  },
  warningTextSevere: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  warningDismiss: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  warningDismissMild: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.5)',
    marginTop: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    paddingTop: 12,
    backgroundColor: COLORS.overlay,
  },
  iconButton: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  iconButtonText: {
    fontSize: 24,
  },
  iconButtonLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  mainButton: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 30,
    minWidth: 130,
    alignItems: 'center',
  },
  mainButtonStart: {
    backgroundColor: COLORS.success,
  },
  mainButtonStop: {
    backgroundColor: COLORS.danger,
  },
  mainButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: 2,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.background,
  },
});
