import { FaceFeature } from 'expo-face-detector';

/**
 * Eye Aspect Ratio (EAR) calculation.
 *
 * expo-face-detector provides eye open probabilities directly
 * (leftEyeOpenProbability, rightEyeOpenProbability).
 * We use the average of both as our EAR proxy:
 * - 1.0 = fully open
 * - 0.0 = fully closed
 *
 * The user can configure a threshold (default 0.18).
 * If the average probability < threshold, eyes are considered "closed".
 */
export function calculateEAR(face: FaceFeature): number {
  const leftEyeOpen = face.leftEyeOpenProbability ?? 1.0;
  const rightEyeOpen = face.rightEyeOpenProbability ?? 1.0;
  return (leftEyeOpen + rightEyeOpen) / 2;
}

/**
 * Mouth Aspect Ratio (MAR) calculation.
 *
 * We use landmark positions from expo-face-detector:
 * - noseBasePosition, bottomMouthPosition, leftMouthPosition, rightMouthPosition
 *
 * MAR = vertical mouth opening / horizontal mouth width
 * Typical values: ~0.3-0.4 closed, ~0.6-0.8 yawning
 */
export function calculateMAR(face: FaceFeature): number {
  const noseBase = face.noseBasePosition;
  const mouthBottom = face.bottomMouthPosition;
  const mouthLeft = face.leftMouthPosition;
  const mouthRight = face.rightMouthPosition;

  if (noseBase && mouthBottom && mouthLeft && mouthRight) {
    const verticalDist = Math.abs(mouthBottom.y - noseBase.y);
    const horizontalDist = Math.abs(mouthRight.x - mouthLeft.x);
    if (horizontalDist > 0) {
      return verticalDist / horizontalDist;
    }
  }

  // Fallback: use smiling probability as inverse proxy
  const smileProb = face.smilingProbability ?? 0.5;
  return Math.max(0, 1.0 - smileProb) * 0.8;
}

/**
 * Determine face detection confidence based on available landmarks.
 */
export function getFaceConfidence(face: FaceFeature): number {
  let score = 0;
  let total = 0;

  if (face.leftEyeOpenProbability !== undefined) score += 1;
  total += 1;

  if (face.rightEyeOpenProbability !== undefined) score += 1;
  total += 1;

  if (face.smilingProbability !== undefined) score += 1;
  total += 1;

  if (face.noseBasePosition) score += 1;
  total += 1;

  if (face.leftEyePosition) score += 1;
  total += 1;

  if (face.rightEyePosition) score += 1;
  total += 1;

  if (face.leftMouthPosition) score += 1;
  total += 1;

  if (face.rightMouthPosition) score += 1;
  total += 1;

  if (face.bottomMouthPosition) score += 1;
  total += 1;

  return total > 0 ? score / total : 0;
}
