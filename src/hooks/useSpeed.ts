import { useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';

const MS_TO_MPH = 2.23694;

export function useSpeed() {
  const [speed, setSpeed] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const requestPermission = useCallback(async () => {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        setErrorMsg('Location permission denied');
        return false;
      }

      // Try to get background permission too (for speed tracking while screen is dimmed)
      try {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
          console.log('Background location not granted, using foreground only');
        }
      } catch {
        console.log('Background location not available');
      }

      setHasPermission(true);
      setErrorMsg(null);
      return true;
    } catch (e) {
      setErrorMsg('Failed to request location permission');
      return false;
    }
  }, []);

  const startTracking = useCallback(async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) return;
    }

    try {
      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (location) => {
          const speedMs = location.coords.speed;
          if (speedMs !== null && speedMs >= 0) {
            setSpeed(Math.round(speedMs * MS_TO_MPH));
          } else {
            setSpeed(0);
          }
        }
      );
    } catch (e) {
      console.warn('Failed to start location tracking:', e);
      setErrorMsg('Failed to start GPS tracking');
    }
  }, [hasPermission, requestPermission]);

  const stopTracking = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    setSpeed(0);
  }, []);

  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
    };
  }, []);

  return { speed, hasPermission, errorMsg, requestPermission, startTracking, stopTracking };
}
