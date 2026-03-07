import { useEffect, useRef, useState, useCallback } from 'react';

interface TiltState {
  tiltX: number; // -1 (left) to +1 (right)
  permissionGranted: boolean;
  permissionDenied: boolean;
  isSupported: boolean;
}

function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

export function useDeviceTilt() {
  const [state, setState] = useState<TiltState>({
    tiltX: 0,
    permissionGranted: false,
    permissionDenied: false,
    isSupported: typeof DeviceMotionEvent !== 'undefined',
  });
  const rawTilt = useRef(0);
  const smoothedTilt = useRef(0);
  const animFrame = useRef<number>(0);

  const requestPermission = useCallback(async () => {
    if (typeof DeviceMotionEvent === 'undefined') {
      setState(s => ({ ...s, isSupported: false, permissionDenied: true }));
      return false;
    }

    // iOS 13+ requires explicit permission
    const DME = DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    if (typeof DME.requestPermission === 'function') {
      try {
        const result = await DME.requestPermission();
        if (result === 'granted') {
          setState(s => ({ ...s, permissionGranted: true, permissionDenied: false }));
          return true;
        } else {
          setState(s => ({ ...s, permissionDenied: true }));
          return false;
        }
      } catch {
        setState(s => ({ ...s, permissionDenied: true }));
        return false;
      }
    } else {
      // Non-iOS or older browsers - permission not needed
      setState(s => ({ ...s, permissionGranted: true }));
      return true;
    }
  }, []);

  useEffect(() => {
    if (!state.permissionGranted || !state.isSupported) return;

    const handleMotion = (e: DeviceMotionEvent) => {
      const ag = e.accelerationIncludingGravity;
      if (ag && ag.x !== null) {
        // Normalize: typical range -10 to +10, clamp to -1..+1
        const normalized = Math.max(-1, Math.min(1, (ag.x ?? 0) / 5));
        rawTilt.current = normalized;
      }
    };

    window.addEventListener('devicemotion', handleMotion);

    // Smoothing loop
    const smooth = () => {
      smoothedTilt.current = lerp(smoothedTilt.current, rawTilt.current, 0.15);
      setState(s => ({ ...s, tiltX: smoothedTilt.current }));
      animFrame.current = requestAnimationFrame(smooth);
    };
    animFrame.current = requestAnimationFrame(smooth);

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
      cancelAnimationFrame(animFrame.current);
    };
  }, [state.permissionGranted, state.isSupported]);

  return {
    tiltX: state.tiltX,
    permissionGranted: state.permissionGranted,
    permissionDenied: state.permissionDenied,
    isSupported: state.isSupported,
    requestPermission,
  };
}
