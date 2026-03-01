import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

let alarmSound: Audio.Sound | null = null;
let isAlarmPlaying = false;

export async function initializeAudio(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: false,
    });
  } catch (e) {
    console.warn('Failed to initialize audio:', e);
  }
}

export async function playAlarm(): Promise<void> {
  if (isAlarmPlaying) return;
  
  try {
    isAlarmPlaying = true;

    if (alarmSound) {
      await alarmSound.unloadAsync();
      alarmSound = null;
    }

    // Use a system-generated tone via expo-av
    // We create a repeating beep pattern using haptics + audio
    const { sound } = await Audio.Sound.createAsync(
      // Use a built-in alert sound or generate a tone
      // For now, we use a URI to a public alarm sound
      { uri: 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg' },
      { shouldPlay: true, isLooping: true, volume: 1.0 }
    );
    alarmSound = sound;

    // Heavy vibration pattern
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (e) {
    console.warn('Failed to play alarm:', e);
    isAlarmPlaying = false;
  }
}

export async function stopAlarm(): Promise<void> {
  isAlarmPlaying = false;
  try {
    if (alarmSound) {
      await alarmSound.stopAsync();
      await alarmSound.unloadAsync();
      alarmSound = null;
    }
  } catch (e) {
    console.warn('Failed to stop alarm:', e);
  }
}

export async function triggerHapticWarning(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (e) {
    console.warn('Failed to trigger haptic:', e);
  }
}

export async function triggerHapticSevere(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    // Double vibration for severity
    setTimeout(async () => {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch {
        // ignore
      }
    }, 300);
  } catch (e) {
    console.warn('Failed to trigger severe haptic:', e);
  }
}

export function getIsAlarmPlaying(): boolean {
  return isAlarmPlaying;
}
