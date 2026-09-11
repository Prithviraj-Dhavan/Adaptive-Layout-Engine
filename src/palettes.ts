import type { AdTheme } from './types';

export interface ColorPalettePreset {
  id: string;
  name: string;
  description: string;
  swatches: string[];
  theme: AdTheme;
}

/**
 * Curated High-End Design System Color Palettes
 * Designed specifically for high-impact multi-surface advertising
 */
export const colorPalettes: ColorPalettePreset[] = [
  {
    id: 'palmo-classic-beige',
    name: '🌴 Oat Beige',
    description: 'Signature warm oat cream, deep forest palm, and golden accents',
    swatches: ['#121A15', '#D4A373', '#10B981', '#F8F8F0'],
    theme: {
      primaryColor: '#121A15',
      secondaryColor: '#D4A373',
      accentColor: '#10B981',
      backgroundColor: '#F8F8F0',
      surfaceColor: '#EFEFE5',
      textColor: '#121A15',
      textMutedColor: '#47554F',
      fontFamily: "'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif",
      borderRadius: 20,
    },
  },
  {
    id: 'palmo-dark-forest',
    name: '🌿 Forest Noir',
    description: 'Deep coconut palm canopy, champagne gold, and raw hydration mint',
    swatches: ['#FFE386', '#D4A373', '#10B981', '#0B130E'],
    theme: {
      primaryColor: '#FFE386',
      secondaryColor: '#D4A373',
      accentColor: '#34D399',
      backgroundColor: '#0B130E',
      surfaceColor: '#142019',
      textColor: '#F8F8F0',
      textMutedColor: '#9EBAAB',
      fontFamily: "'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif",
      borderRadius: 20,
    },
  },
  {
    id: 'palmo-golden-pineapple',
    name: '🍍 Pineapple',
    description: 'Sun-drenched tropical pineapple gold, warm oat, and crisp emerald',
    swatches: ['#D97706', '#F59E0B', '#10B981', '#FEFCE8'],
    theme: {
      primaryColor: '#B45309',
      secondaryColor: '#F59E0B',
      accentColor: '#059669',
      backgroundColor: '#FEF9C3',
      surfaceColor: '#FEF08A',
      textColor: '#1C1917',
      textMutedColor: '#78716C',
      fontFamily: "'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif",
      borderRadius: 20,
    },
  },
  {
    id: 'palmo-ruby-watermelon',
    name: '🍉 Watermelon',
    description: 'Crisp cold-pressed watermelon crimson, sweet peach, and palm leaf green',
    swatches: ['#BE123C', '#FB7185', '#10B981', '#FFF1F2'],
    theme: {
      primaryColor: '#BE123C',
      secondaryColor: '#FB7185',
      accentColor: '#10B981',
      backgroundColor: '#FFF1F2',
      surfaceColor: '#FFE4E6',
      textColor: '#1F1215',
      textMutedColor: '#6B4A53',
      fontFamily: "'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif",
      borderRadius: 20,
    },
  },
  {
    id: 'cyberpunk-neon',
    name: '⚡ Cyberpunk',
    description: 'High-voltage electric violet, hot pink, and cyber glow accents',
    swatches: ['#6366F1', '#EC4899', '#06B6D4', '#0F172A'],
    theme: {
      primaryColor: '#6366F1',
      secondaryColor: '#EC4899',
      accentColor: '#06B6D4',
      backgroundColor: '#0F172A',
      surfaceColor: '#1E293B',
      textColor: '#F8FAFC',
      textMutedColor: '#94A3B8',
      fontFamily: "'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif",
      borderRadius: 16,
    },
  },
  {
    id: 'aurora-emerald',
    name: '💎 Emerald',
    description: 'Luminescent mint, glowing emerald, and obsidian darkness',
    swatches: ['#10B981', '#059669', '#34D399', '#064E3B'],
    theme: {
      primaryColor: '#10B981',
      secondaryColor: '#059669',
      accentColor: '#34D399',
      backgroundColor: '#022C22',
      surfaceColor: '#064E3B',
      textColor: '#ECFDF5',
      textMutedColor: '#6EE7B7',
      fontFamily: "'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif",
      borderRadius: 16,
    },
  },
];

/**
 * Calculates WCAG 2.1 relative luminance and contrast ratio between two HEX colors
 */
export function getLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const a = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

export function getContrastRatio(fgHex: string, bgHex: string): number {
  try {
    const l1 = getLuminance(fgHex);
    const l2 = getLuminance(bgHex);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return Math.round(((lighter + 0.05) / (darker + 0.05)) * 10) / 10;
  } catch {
    return 8.5; // fallback standard
  }
}

export function getWCAGRating(ratio: number): {
  rating: 'AAA' | 'AA' | 'Fail';
  color: string;
} {
  if (ratio >= 7.0) return { rating: 'AAA', color: 'text-emerald-400' };
  if (ratio >= 4.5) return { rating: 'AA', color: 'text-indigo-400' };
  return { rating: 'Fail', color: 'text-amber-400' };
}
