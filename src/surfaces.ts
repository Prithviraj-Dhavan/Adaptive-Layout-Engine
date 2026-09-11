import type { SurfaceProfile, SafeArea } from './types';

/**
 * Standard Default Safe Area
 */
export const defaultSafeArea: SafeArea = {
  top: 16,
  right: 16,
  bottom: 16,
  left: 16,
};

/**
 * Core surface profiles as specified in the Flam R&D Assignment
 */
export const surfaces: Record<string, SurfaceProfile> = {
  mobileInterstitial: {
    id: 'mobileInterstitial',
    name: 'Mobile Interstitial (9:16)',
    description: 'Smartphone full-screen interstitial with top notch and bottom home indicator safe area.',
    width: 375,
    height: 667,
    safeArea: {
      top: 44,
      bottom: 34,
      left: 20,
      right: 20,
    },
    minTapTarget: 44,
    minTextSize: 13,
    viewingDistance: 'near',
    touchOnly: true,
    orientation: 'portrait',
    devicePixelRatio: 3,
    category: 'mobile',
    ambientTheme: 'dark',
  },

  mobileLandscape: {
    id: 'mobileLandscape',
    name: 'Mobile Landscape (16:9)',
    description: 'Horizontal mobile game or video mid-roll banner with dynamic side safe zones.',
    width: 667,
    height: 375,
    safeArea: {
      top: 16,
      bottom: 16,
      left: 44,
      right: 44,
    },
    minTapTarget: 44,
    minTextSize: 12,
    viewingDistance: 'near',
    touchOnly: true,
    orientation: 'landscape',
    devicePixelRatio: 3,
    category: 'mobile',
    ambientTheme: 'dark',
  },

  broadcastLowerThird: {
    id: 'broadcastLowerThird',
    name: 'Broadcast Lower-Third (1920x250)',
    description: 'Live TV / streaming broadcast overlay. 10-foot UI viewing distance, high minimum text size, no touch.',
    width: 1920,
    height: 250,
    safeArea: {
      top: 20,
      bottom: 24,
      left: 80,
      right: 80,
    },
    minTapTarget: 0,
    minTextSize: 32,
    viewingDistance: 'far',
    touchOnly: false,
    orientation: 'landscape',
    devicePixelRatio: 1,
    category: 'broadcast',
    ambientTheme: 'cinema',
  },

  retailKiosk: {
    id: 'retailKiosk',
    name: 'Retail Kiosk (1:1 Square)',
    description: 'In-store interactive display terminal. Large 60px touch targets for accessibility and standing reach.',
    width: 1080,
    height: 1080,
    safeArea: {
      top: 56,
      bottom: 56,
      left: 56,
      right: 56,
    },
    minTapTarget: 60,
    minTextSize: 20,
    viewingDistance: 'medium',
    touchOnly: true,
    orientation: 'square',
    devicePixelRatio: 2,
    category: 'kiosk',
    ambientTheme: 'storefront',
  },

  constrainedMicroStrip: {
    id: 'constrainedMicroStrip',
    name: 'Constrained Micro Strip (360x110)',
    description: 'Stress-test surface with severe vertical limits. Demonstrates automatic priority-based element degradation without clipping.',
    width: 360,
    height: 110,
    safeArea: {
      top: 8,
      bottom: 8,
      left: 12,
      right: 12,
    },
    minTapTarget: 38,
    minTextSize: 11,
    viewingDistance: 'near',
    touchOnly: true,
    orientation: 'landscape',
    devicePixelRatio: 2,
    category: 'mobile',
    ambientTheme: 'dark',
  },

  wearableDisplay: {
    id: 'wearableDisplay',
    name: 'Smart Watch (200x200)',
    description: 'Glanceable micro-screen with strict Priority-1 isolation.',
    width: 200,
    height: 200,
    safeArea: {
      top: 14,
      bottom: 14,
      left: 14,
      right: 14,
    },
    minTapTarget: 36,
    minTextSize: 10,
    viewingDistance: 'near',
    touchOnly: true,
    orientation: 'square',
    devicePixelRatio: 2,
    category: 'wearable',
    ambientTheme: 'dark',
  },
};

export function createCustomSurface(params: {
  width: number;
  height: number;
  name?: string;
  minTapTarget?: number;
  minTextSize?: number;
  viewingDistance?: 'near' | 'medium' | 'far';
  touchOnly?: boolean;
  safeArea?: Partial<SafeArea>;
}): SurfaceProfile {
  const width = Math.max(80, Math.round(params.width));
  const height = Math.max(60, Math.round(params.height));
  const ar = width / height;

  const orientation = ar > 1.2 ? 'landscape' : ar < 0.85 ? 'portrait' : 'square';

  return {
    id: `custom-${width}x${height}`,
    name: params.name || `Custom (${width}x${height})`,
    description: `Dynamic surface generated at runtime with aspect ratio ${(width / height).toFixed(2)}:1`,
    width,
    height,
    safeArea: {
      top: params.safeArea?.top ?? 12,
      bottom: params.safeArea?.bottom ?? 12,
      left: params.safeArea?.left ?? 12,
      right: params.safeArea?.right ?? 12,
    },
    minTapTarget: params.minTapTarget ?? (params.touchOnly !== false ? 44 : 0),
    minTextSize: params.minTextSize ?? (params.viewingDistance === 'far' ? 28 : 12),
    viewingDistance: params.viewingDistance ?? (width > 1200 && height < 400 ? 'far' : 'near'),
    touchOnly: params.touchOnly ?? true,
    orientation,
    devicePixelRatio: 2,
    category: 'custom',
    ambientTheme: 'dark',
  };
}
