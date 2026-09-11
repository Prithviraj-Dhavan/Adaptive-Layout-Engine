import type { LayoutStrategy } from '../types';

export interface GeometricMetrics {
  width: number;
  height: number;
  aspectRatio: number;
  area: number;
  isExtremelyConstrained: boolean;
  dominantAxis: 'horizontal' | 'vertical' | 'balanced';
}

/**
 * Computes pure geometric metrics independent of any surface names or device IDs.
 */
export function computeGeometricMetrics(availableWidth: number, availableHeight: number): GeometricMetrics {
  const width = Math.max(1, availableWidth);
  const height = Math.max(1, availableHeight);
  const aspectRatio = width / height;
  const area = width * height;

  const isExtremelyConstrained = height < 130 || width < 220 || area < 45000;
  const dominantAxis = aspectRatio >= 1.5 ? 'horizontal' : aspectRatio <= 0.85 ? 'vertical' : 'balanced';

  return {
    width,
    height,
    aspectRatio,
    area,
    isExtremelyConstrained,
    dominantAxis,
  };
}

/**
 * Pure mathematical strategy selector.
 */
export function determineLayoutStrategy(metrics: GeometricMetrics): LayoutStrategy {
  if (metrics.isExtremelyConstrained) {
    return 'EXTREME_MICRO';
  }

  // 1. Ultra-wide Strip / Banner / Lower Third (AR >= 3.2)
  if (metrics.aspectRatio >= 3.2) {
    return 'HORIZONTAL_STRIP';
  }

  // 2. Landscape Split View (1.45 <= AR < 3.2)
  if (metrics.aspectRatio >= 1.45) {
    return 'SPLIT_LANDSCAPE';
  }

  // 3. Balanced / Square Kiosk / Tablet Portrait (0.85 <= AR < 1.45)
  if (metrics.aspectRatio >= 0.85) {
    return 'SQUARE_BALANCED';
  }

  // 4. Tall Vertical Stack / Mobile Interstitial (AR < 0.85)
  return 'VERTICAL_STACK';
}
