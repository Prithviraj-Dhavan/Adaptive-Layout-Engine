import type { AdSpec, SurfaceProfile, ResolvedLayout } from './types';
import { solveConstraints } from './engine/solver';

/**
 * Public Entrypoint for the Adaptive Multi-Surface Layout Engine.
 */
export function resolveLayout(adSpec: AdSpec, surface: SurfaceProfile): ResolvedLayout {
  if (!adSpec || !adSpec.elements || adSpec.elements.length === 0) {
    throw new Error('resolveLayout requires a valid AdSpec with at least one element.');
  }
  if (!surface || surface.width <= 0 || surface.height <= 0) {
    throw new Error('resolveLayout requires a valid SurfaceProfile with positive width and height.');
  }

  return solveConstraints(adSpec, surface);
}

export { solveConstraints } from './engine/solver';
export { determineLayoutStrategy, computeGeometricMetrics } from './engine/strategies';
export { measureText, fitTextWithinBounds } from './engine/text-measurer';
export { DEGRADATION_STAGES } from './engine/degradation';
