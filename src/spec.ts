import type { AdSpec, AdElement, ElementContent } from './types';

/**
 * Type-safe ad specification builder.
 * Validates role constraints, priority bounds, and element integrity at creation time.
 */
export function defineAd<T extends AdSpec>(spec: T): T {
  // Runtime validation for missing IDs, invalid priority ranges, or empty elements
  if (!spec.id) {
    throw new Error('AdSpec must have a unique `id`');
  }
  if (!spec.elements || spec.elements.length === 0) {
    throw new Error(`AdSpec "${spec.id}" must contain at least one element`);
  }

  const seenIds = new Set<string>();
  for (const el of spec.elements) {
    if (seenIds.has(el.id)) {
      throw new Error(`Duplicate element ID "${el.id}" detected in AdSpec "${spec.id}"`);
    }
    seenIds.add(el.id);

    if (el.priority < 1 || el.priority > 5) {
      throw new Error(`Element "${el.id}" has invalid priority ${el.priority}. Must be 1 to 5.`);
    }
  }

  return spec;
}

/**
 * Helper to construct an individual element with strong typing
 */
export function createElement<TContent extends ElementContent>(
  element: AdElement<TContent>
): AdElement<TContent> {
  return element;
}

// ---------------------------------------------------------------------------
// Realistic Ad Specs for the Multi-Surface Demo
// ---------------------------------------------------------------------------

/**
 * Flagship Showcase 1: Palmo Pure Coconut Water (Reference: https://www.palmo.co.in/)
 */
export const palmoCoconutSpec: AdSpec = defineAd({
  id: 'palmo-pure-coconut',
  name: '🌴 Palmo Pure Coconut Water',
  campaign: 'Paradise In Every Sip 2026',
  theme: {
    primaryColor: '#121A15',      // Forest Obsidian
    secondaryColor: '#D4A373',    // Palm Husk Gold
    accentColor: '#10B981',       // Tropical Leaf Green
    backgroundColor: '#F8F8F0',   // Warm Oat Beige
    surfaceColor: '#EFEFE5',
    textColor: '#121A15',
    textMutedColor: '#47554F',
    fontFamily: "'Khand', 'Inter', system-ui, sans-serif",
    borderRadius: 20,
  },
  elements: [
    {
      id: 'brand-logo',
      type: 'image',
      role: 'branding',
      priority: 3,
      content: {
        id: 'brand-logo',
        src: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=240&q=80',
        alt: 'PALMO COCONUT CO.',
      },
      constraints: {
        minWidth: 80,
        maxWidth: 180,
        minHeight: 24,
        maxHeight: 44,
        aspectRatio: 3.5,
        allowDrop: true,
      },
      styles: {
        borderRadius: 8,
      },
    },
    {
      id: 'promo-badge',
      type: 'badge',
      role: 'badge',
      priority: 3,
      content: {
        id: 'promo-badge',
        text: '🌴 100% RAW & COLD-PRESSED',
        variant: 'pill',
      },
      constraints: {
        minWidth: 130,
        maxWidth: 240,
        minHeight: 24,
        maxHeight: 36,
        minFontSize: 11,
        maxFontSize: 13,
        allowDrop: true,
      },
      styles: {
        backgroundColor: 'rgba(18, 26, 21, 0.08)',
        textColor: '#121A15',
        borderColor: 'rgba(18, 26, 21, 0.25)',
        borderRadius: 9999,
        fontWeight: 'bold',
      },
    },
    {
      id: 'headline',
      type: 'text',
      role: 'primary',
      priority: 1,
      content: {
        id: 'headline',
        text: 'Paradise In Every Sip.',
        subtext: '500mg Potassium • 100% Raw • Zero Added Sugar • Never Concentrated',
        maxLines: 2,
      },
      constraints: {
        minFontSize: 16,
        maxFontSize: 44,
        allowTruncation: true,
        allowDrop: false,
      },
      styles: {
        textColor: '#121A15',
        fontWeight: 'black',
      },
    },
    {
      id: 'product-image',
      type: 'image',
      role: 'hero',
      priority: 1,
      content: {
        id: 'product-image',
        src: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=800&q=80',
        alt: 'Palmo 100% Raw Cold-Pressed Coconut',
        aspectRatio: 1.0,
      },
      constraints: {
        minWidth: 80,
        maxWidth: 600,
        minHeight: 80,
        maxHeight: 600,
        aspectRatio: 1.0,
        minAspectRatio: 0.75,
        maxAspectRatio: 2.2,
        preserveAspectRatio: true,
        allowDrop: false,
      },
      styles: {
        borderRadius: 20,
        shadow: '0 25px 50px -15px rgba(18, 26, 21, 0.25)',
      },
    },
    {
      id: 'price-tag',
      type: 'price-tag',
      role: 'secondary',
      priority: 2,
      content: {
        id: 'price-tag',
        currency: '₹',
        amount: '120',
        originalAmount: '₹150',
        discountPercentage: '500 MG POTASSIUM',
        period: 'Per 250ml',
      },
      constraints: {
        minWidth: 90,
        maxWidth: 220,
        minHeight: 28,
        maxHeight: 52,
        minFontSize: 15,
        maxFontSize: 28,
        allowDrop: true,
      },
      styles: {
        textColor: '#121A15',
        fontWeight: 'bold',
      },
    },
    {
      id: 'cta-button',
      type: 'button',
      role: 'action',
      priority: 1,
      content: {
        id: 'cta-button',
        label: 'Discover Flavors',
        sublabel: 'Cold Delivered in 24h',
        variant: 'primary',
        actionUrl: 'https://www.palmo.co.in/flavours',
      },
      constraints: {
        minWidth: 130,
        maxWidth: 320,
        minHeight: 44,
        maxHeight: 68,
        minFontSize: 14,
        maxFontSize: 18,
        allowDrop: false,
      },
      styles: {
        backgroundColor: '#121A15',
        textColor: '#F8F8F0',
        borderRadius: 14,
        fontWeight: 'bold',
        shadow: '0 10px 25px -5px rgba(18, 26, 21, 0.35)',
      },
    },
  ],
});

/**
 * Flagship Showcase 2: Palmo Golden Pineapple Infusion
 */
export const palmoPineappleSpec: AdSpec = defineAd({
  id: 'palmo-golden-pineapple',
  name: '🍍 Palmo Golden Pineapple',
  campaign: 'Sun-Drenched Hydration 2026',
  theme: {
    primaryColor: '#B45309',
    secondaryColor: '#F59E0B',
    accentColor: '#059669',
    backgroundColor: '#FEF9C3',
    surfaceColor: '#FEF08A',
    textColor: '#1C1917',
    textMutedColor: '#78716C',
    fontFamily: "'Khand', 'Inter', system-ui, sans-serif",
    borderRadius: 20,
  },
  elements: [
    {
      id: 'brand-logo',
      type: 'image',
      role: 'branding',
      priority: 3,
      content: {
        id: 'brand-logo',
        src: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=240&q=80',
        alt: 'PALMO COCONUT CO.',
      },
      constraints: { minWidth: 80, maxWidth: 180, minHeight: 24, maxHeight: 44, allowDrop: true },
      styles: { borderRadius: 8 },
    },
    {
      id: 'promo-badge',
      type: 'badge',
      role: 'badge',
      priority: 3,
      content: {
        id: 'promo-badge',
        text: '🍍 REAL PINEAPPLE INFUSION',
        variant: 'pill',
      },
      constraints: { minWidth: 140, maxWidth: 240, minHeight: 24, maxHeight: 36, allowDrop: true },
      styles: {
        backgroundColor: 'rgba(180, 83, 9, 0.12)',
        textColor: '#92400E',
        borderColor: 'rgba(180, 83, 9, 0.3)',
        borderRadius: 9999,
        fontWeight: 'bold',
      },
    },
    {
      id: 'headline',
      type: 'text',
      role: 'primary',
      priority: 1,
      content: {
        id: 'headline',
        text: 'Tropical Sunshine. Raw Coconut.',
        subtext: '480mg Potassium • 50 KCL • Zero Added Sugar • Real Fruit Infused',
      },
      constraints: { minFontSize: 16, maxFontSize: 42, allowTruncation: true, allowDrop: false },
      styles: { textColor: '#1C1917', fontWeight: 'black' },
    },
    {
      id: 'product-image',
      type: 'image',
      role: 'hero',
      priority: 1,
      content: {
        id: 'product-image',
        src: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=800&q=80',
        alt: 'Palmo Golden Pineapple Coconut Water',
        aspectRatio: 1.0,
      },
      constraints: { minWidth: 80, maxWidth: 600, minHeight: 80, maxHeight: 600, allowDrop: false },
      styles: { borderRadius: 20, shadow: '0 25px 50px -15px rgba(217, 119, 6, 0.3)' },
    },
    {
      id: 'price-tag',
      type: 'price-tag',
      role: 'secondary',
      priority: 2,
      content: {
        id: 'price-tag',
        currency: '₹',
        amount: '135',
        originalAmount: '₹160',
        discountPercentage: '480 MG POTASSIUM',
      },
      constraints: { minWidth: 90, maxWidth: 220, minHeight: 28, maxHeight: 52, allowDrop: true },
      styles: { textColor: '#B45309', fontWeight: 'bold' },
    },
    {
      id: 'cta-button',
      type: 'button',
      role: 'action',
      priority: 1,
      content: {
        id: 'cta-button',
        label: 'Taste Paradise',
        sublabel: 'Cold Pressed Today',
        variant: 'primary',
      },
      constraints: { minWidth: 130, maxWidth: 320, minHeight: 44, maxHeight: 68, allowDrop: false },
      styles: {
        backgroundColor: '#B45309',
        textColor: '#FFFFFF',
        borderRadius: 14,
        fontWeight: 'bold',
        shadow: '0 10px 25px -5px rgba(180, 83, 9, 0.4)',
      },
    },
  ],
});

/**
 * Flagship Showcase 3: Palmo Ruby Watermelon Hydration
 */
export const palmoWatermelonSpec: AdSpec = defineAd({
  id: 'palmo-ruby-watermelon',
  name: '🍉 Palmo Ruby Watermelon',
  campaign: 'Crisp Summer Refreshment 2026',
  theme: {
    primaryColor: '#BE123C',
    secondaryColor: '#FB7185',
    accentColor: '#10B981',
    backgroundColor: '#FFF1F2',
    surfaceColor: '#FFE4E6',
    textColor: '#1F1215',
    textMutedColor: '#6B4A53',
    fontFamily: "'Khand', 'Inter', system-ui, sans-serif",
    borderRadius: 20,
  },
  elements: [
    {
      id: 'brand-logo',
      type: 'image',
      role: 'branding',
      priority: 3,
      content: {
        id: 'brand-logo',
        src: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=240&q=80',
        alt: 'PALMO COCONUT CO.',
      },
      constraints: { minWidth: 80, maxWidth: 180, minHeight: 24, maxHeight: 44, allowDrop: true },
      styles: { borderRadius: 8 },
    },
    {
      id: 'promo-badge',
      type: 'badge',
      role: 'badge',
      priority: 3,
      content: {
        id: 'promo-badge',
        text: '🍉 48 KCL • 0 GM SUGAR',
        variant: 'pill',
      },
      constraints: { minWidth: 140, maxWidth: 240, minHeight: 24, maxHeight: 36, allowDrop: true },
      styles: {
        backgroundColor: 'rgba(190, 18, 60, 0.12)',
        textColor: '#BE123C',
        borderColor: 'rgba(190, 18, 60, 0.3)',
        borderRadius: 9999,
        fontWeight: 'bold',
      },
    },
    {
      id: 'headline',
      type: 'text',
      role: 'primary',
      priority: 1,
      content: {
        id: 'headline',
        text: 'Cool Hydration. Pure Watermelon.',
        subtext: '500mg Potassium • 100% Raw • Zero Added Sugar • Quench Every Thirst',
      },
      constraints: { minFontSize: 16, maxFontSize: 42, allowTruncation: true, allowDrop: false },
      styles: { textColor: '#1F1215', fontWeight: 'black' },
    },
    {
      id: 'product-image',
      type: 'image',
      role: 'hero',
      priority: 1,
      content: {
        id: 'product-image',
        src: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80',
        alt: 'Palmo Ruby Watermelon Coconut Water',
        aspectRatio: 1.0,
      },
      constraints: { minWidth: 80, maxWidth: 600, minHeight: 80, maxHeight: 600, allowDrop: false },
      styles: { borderRadius: 20, shadow: '0 25px 50px -15px rgba(225, 29, 72, 0.3)' },
    },
    {
      id: 'price-tag',
      type: 'price-tag',
      role: 'secondary',
      priority: 2,
      content: {
        id: 'price-tag',
        currency: '₹',
        amount: '135',
        originalAmount: '₹160',
        discountPercentage: 'ZERO ADDED SUGAR',
      },
      constraints: { minWidth: 90, maxWidth: 220, minHeight: 28, maxHeight: 52, allowDrop: true },
      styles: { textColor: '#BE123C', fontWeight: 'bold' },
    },
    {
      id: 'cta-button',
      type: 'button',
      role: 'action',
      priority: 1,
      content: {
        id: 'cta-button',
        label: 'Claim 6-Pack',
        sublabel: 'Free Cold Shipping',
        variant: 'primary',
      },
      constraints: { minWidth: 130, maxWidth: 320, minHeight: 44, maxHeight: 68, allowDrop: false },
      styles: {
        backgroundColor: '#BE123C',
        textColor: '#FFFFFF',
        borderRadius: 14,
        fontWeight: 'bold',
        shadow: '0 10px 25px -5px rgba(190, 18, 60, 0.4)',
      },
    },
  ],
});

/**
 * Spec 4: Flam Nebula XR Pro Headphones
 */
export const defaultAdSpec: AdSpec = palmoCoconutSpec;

export const flamNebulaSpec: AdSpec = defineAd({
  id: 'flam-nebula-xr',
  name: '⚡ Flam Nebula XR Spatial Audio',
  campaign: 'Spatial Audio Launch 2026',
  theme: {
    primaryColor: '#6366F1',
    secondaryColor: '#EC4899',
    accentColor: '#10B981',
    backgroundColor: '#0F172A',
    surfaceColor: '#1E293B',
    textColor: '#F8FAFC',
    textMutedColor: '#94A3B8',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    borderRadius: 16,
  },
  elements: [
    {
      id: 'brand-logo',
      type: 'image',
      role: 'branding',
      priority: 3,
      content: {
        id: 'brand-logo',
        src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=240&q=80',
        alt: 'FLAM Audio Logo',
        overlayGradient: false,
      },
      constraints: {
        minWidth: 70,
        maxWidth: 160,
        minHeight: 24,
        maxHeight: 44,
        aspectRatio: 3.2,
        allowDrop: true,
      },
      styles: { borderRadius: 8 },
    },
    {
      id: 'promo-badge',
      type: 'badge',
      role: 'badge',
      priority: 3,
      content: {
        id: 'promo-badge',
        text: '⚡ NEW SPATIAL GEN-3',
        variant: 'pill',
      },
      constraints: {
        minWidth: 120,
        maxWidth: 220,
        minHeight: 24,
        maxHeight: 34,
        minFontSize: 11,
        maxFontSize: 13,
        allowDrop: true,
      },
      styles: {
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        textColor: '#818CF8',
        borderColor: 'rgba(99, 102, 241, 0.35)',
        borderRadius: 9999,
        fontWeight: 'bold',
      },
    },
    {
      id: 'headline',
      type: 'text',
      role: 'primary',
      priority: 1,
      content: {
        id: 'headline',
        text: 'Experience Sound in 4D Space.',
        subtext: 'Next-gen binaural drivers with sub-millisecond head tracking.',
        maxLines: 2,
      },
      constraints: {
        minFontSize: 14,
        maxFontSize: 36,
        allowTruncation: true,
        allowDrop: false,
      },
      styles: { textColor: '#FFFFFF', fontWeight: 'black' },
    },
    {
      id: 'product-image',
      type: 'image',
      role: 'hero',
      priority: 1,
      content: {
        id: 'product-image',
        src: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
        alt: 'Flam Nebula Wireless Audiophile Headphones',
        aspectRatio: 1.0,
      },
      constraints: {
        minWidth: 80,
        maxWidth: 600,
        minHeight: 80,
        maxHeight: 600,
        aspectRatio: 1.0,
        minAspectRatio: 0.75,
        maxAspectRatio: 2.2,
        preserveAspectRatio: true,
        allowDrop: false,
      },
      styles: {
        borderRadius: 18,
        shadow: '0 20px 40px -15px rgba(99, 102, 241, 0.4)',
      },
    },
    {
      id: 'price-tag',
      type: 'price-tag',
      role: 'secondary',
      priority: 2,
      content: {
        id: 'price-tag',
        currency: '$',
        amount: '299',
        originalAmount: '$399',
        discountPercentage: '25% OFF',
        period: 'Limited Launch',
      },
      constraints: {
        minWidth: 80,
        maxWidth: 200,
        minHeight: 28,
        maxHeight: 52,
        minFontSize: 14,
        maxFontSize: 28,
        allowDrop: true,
      },
      styles: { textColor: '#10B981', fontWeight: 'bold' },
    },
    {
      id: 'cta-button',
      type: 'button',
      role: 'action',
      priority: 1,
      content: {
        id: 'cta-button',
        label: 'Pre-Order Now',
        sublabel: 'Ships Free in 24h',
        variant: 'primary',
        actionUrl: 'https://flam.app/order',
      },
      constraints: {
        minWidth: 120,
        maxWidth: 320,
        minHeight: 44,
        maxHeight: 68,
        minFontSize: 13,
        maxFontSize: 18,
        allowDrop: false,
      },
      styles: {
        backgroundColor: '#6366F1',
        textColor: '#FFFFFF',
        borderRadius: 14,
        fontWeight: 'bold',
        shadow: '0 10px 25px -5px rgba(99, 102, 241, 0.6)',
      },
    },
  ],
});

/**
 * Spec 5: Cyber-Runner Hyper Sneaker
 */
export const sneakerAdSpec: AdSpec = defineAd({
  id: 'cyber-runner-sneaker',
  name: '👟 AeroVelocity Kinetic Sneaker',
  campaign: 'Urban Velocity Q3',
  theme: {
    primaryColor: '#F59E0B',
    secondaryColor: '#EF4444',
    accentColor: '#06B6D4',
    backgroundColor: '#09090B',
    surfaceColor: '#18181B',
    textColor: '#FAFAFA',
    textMutedColor: '#A1A1AA',
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: 20,
  },
  elements: [
    {
      id: 'brand-logo',
      type: 'image',
      role: 'branding',
      priority: 3,
      content: {
        id: 'brand-logo',
        src: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=240&q=80',
        alt: 'Velocity Labs Logo',
      },
      constraints: { minWidth: 60, maxWidth: 140, minHeight: 20, maxHeight: 36, allowDrop: true },
      styles: { borderRadius: 6 },
    },
    {
      id: 'headline',
      type: 'text',
      role: 'primary',
      priority: 1,
      content: {
        id: 'headline',
        text: 'Defy Gravity. Run the Future.',
        subtext: 'Carbon-fiber spring plate with adaptive nitrogen cushioning.',
      },
      constraints: { minFontSize: 14, maxFontSize: 38, allowTruncation: true, allowDrop: false },
      styles: { textColor: '#FFFFFF', fontWeight: 'black' },
    },
    {
      id: 'product-image',
      type: 'image',
      role: 'hero',
      priority: 1,
      content: {
        id: 'product-image',
        src: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
        alt: 'AeroVelocity Crimson Sneaker',
        aspectRatio: 1.2,
      },
      constraints: {
        minWidth: 80,
        maxWidth: 650,
        minHeight: 80,
        maxHeight: 550,
        aspectRatio: 1.2,
        preserveAspectRatio: true,
        allowDrop: false,
      },
      styles: { borderRadius: 16, shadow: '0 25px 50px -12px rgba(239, 68, 68, 0.4)' },
    },
    {
      id: 'price-tag',
      type: 'price-tag',
      role: 'secondary',
      priority: 2,
      content: {
        id: 'price-tag',
        currency: '$',
        amount: '189',
        originalAmount: '$240',
        discountPercentage: 'LIMITED DROP',
      },
      constraints: { minWidth: 80, maxWidth: 180, minHeight: 26, maxHeight: 48, allowDrop: true },
      styles: { textColor: '#F59E0B', fontWeight: 'bold' },
    },
    {
      id: 'cta-button',
      type: 'button',
      role: 'action',
      priority: 1,
      content: {
        id: 'cta-button',
        label: 'Claim Your Pair',
        sublabel: 'Only 250 Produced',
        variant: 'glow',
      },
      constraints: { minWidth: 130, maxWidth: 300, minHeight: 44, maxHeight: 64, allowDrop: false },
      styles: {
        backgroundColor: '#EF4444',
        textColor: '#FFFFFF',
        borderRadius: 14,
        fontWeight: 'black',
        shadow: '0 10px 30px -5px rgba(239, 68, 68, 0.7)',
      },
    },
  ],
});

/**
 * Spec 6: Cyberpunk Drone
 */
export const droneAdSpec: AdSpec = defineAd({
  id: 'flam-sky-drone',
  name: '🛸 SkyFalcon 8K Cinematic Drone',
  campaign: 'Aerial Creators 2026',
  theme: {
    primaryColor: '#06B6D4',
    secondaryColor: '#3B82F6',
    accentColor: '#10B981',
    backgroundColor: '#030712',
    surfaceColor: '#111827',
    textColor: '#F9FAFB',
    textMutedColor: '#9CA3AF',
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: 16,
  },
  elements: [
    {
      id: 'brand-logo',
      type: 'image',
      role: 'branding',
      priority: 3,
      content: {
        id: 'brand-logo',
        src: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=240&q=80',
        alt: 'SkyFalcon Labs',
      },
      constraints: { minWidth: 60, maxWidth: 140, minHeight: 20, maxHeight: 36, allowDrop: true },
      styles: { borderRadius: 6 },
    },
    {
      id: 'promo-badge',
      type: 'badge',
      role: 'badge',
      priority: 3,
      content: {
        id: 'promo-badge',
        text: '🎥 8K 120FPS HDR',
        variant: 'pill',
      },
      constraints: { minWidth: 100, maxWidth: 180, minHeight: 22, maxHeight: 32, allowDrop: true },
      styles: {
        backgroundColor: 'rgba(6, 182, 212, 0.15)',
        textColor: '#22D3EE',
        borderColor: 'rgba(6, 182, 212, 0.4)',
        borderRadius: 9999,
        fontWeight: 'bold',
      },
    },
    {
      id: 'headline',
      type: 'text',
      role: 'primary',
      priority: 1,
      content: {
        id: 'headline',
        text: 'Cinema In The Sky. Zero Compromise.',
        subtext: '45-minute battery life with 360° LiDAR obstacle avoidance.',
      },
      constraints: { minFontSize: 14, maxFontSize: 36, allowTruncation: true, allowDrop: false },
      styles: { textColor: '#FFFFFF', fontWeight: 'black' },
    },
    {
      id: 'product-image',
      type: 'image',
      role: 'hero',
      priority: 1,
      content: {
        id: 'product-image',
        src: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=800&q=80',
        alt: 'SkyFalcon 8K Pro Drone',
        aspectRatio: 1.33,
      },
      constraints: {
        minWidth: 80,
        maxWidth: 600,
        minHeight: 80,
        maxHeight: 500,
        aspectRatio: 1.33,
        preserveAspectRatio: true,
        allowDrop: false,
      },
      styles: { borderRadius: 16, shadow: '0 20px 40px -10px rgba(6, 182, 212, 0.4)' },
    },
    {
      id: 'price-tag',
      type: 'price-tag',
      role: 'secondary',
      priority: 2,
      content: {
        id: 'price-tag',
        currency: '$',
        amount: '899',
        originalAmount: '$1,199',
        discountPercentage: 'SAVE $300',
      },
      constraints: { minWidth: 90, maxWidth: 190, minHeight: 28, maxHeight: 50, allowDrop: true },
      styles: { textColor: '#06B6D4', fontWeight: 'bold' },
    },
    {
      id: 'cta-button',
      type: 'button',
      role: 'action',
      priority: 1,
      content: {
        id: 'cta-button',
        label: 'Explore Flight Modes',
        sublabel: 'Free VR Controller Included',
        variant: 'primary',
      },
      constraints: { minWidth: 130, maxWidth: 320, minHeight: 44, maxHeight: 64, allowDrop: false },
      styles: {
        backgroundColor: '#06B6D4',
        textColor: '#04131E',
        borderRadius: 14,
        fontWeight: 'black',
        shadow: '0 10px 25px -5px rgba(6, 182, 212, 0.6)',
      },
    },
  ],
});

export const auraAcousticSpec: AdSpec = defineAd({
  id: 'aura-acoustic-perfection',
  name: '🎧 Aura Acoustic Exhibit',
  campaign: 'BIENNALE MONOGRAPH VOL. IV',
  theme: {
    primaryColor: '#e14b2d',      // Vermilion
    secondaryColor: '#964407',    // Burnt Amber
    accentColor: '#554339',       // Raw Umber
    backgroundColor: '#110e0c',   // Deep Espresso
    surfaceColor: '#1c1917',
    textColor: '#f5ede4',         // Bone
    textMutedColor: '#9e9086',
    fontFamily: "'EB Garamond', 'Georgia', serif",
    borderRadius: 38,
  },
  elements: [
    {
      id: 'specimen-badge',
      type: 'badge',
      role: 'badge',
      priority: 4,
      content: {
        id: 'specimen-badge',
        text: 'SURFACE SPECIMEN № 01',
        variant: 'pill',
      },
      constraints: { minWidth: 120, maxWidth: 200, minHeight: 20, maxHeight: 30, allowDrop: true },
      styles: {
        backgroundColor: 'transparent',
        textColor: '#964407',
        fontWeight: 'bold',
      },
    },
    {
      id: 'creative-headline',
      type: 'text',
      role: 'primary',
      priority: 1,
      content: {
        id: 'creative-headline',
        text: 'Acoustic Perfection.',
        subtext: 'Adaptive 48dB Hybrid ANC with real-time room resonance & dynamic spatial masonry.',
        maxLines: 2,
      },
      constraints: {
        minFontSize: 18,
        maxFontSize: 38,
        allowTruncation: true,
        allowDrop: false,
      },
      styles: {
        textColor: '#ffffff',
        fontWeight: 'normal',
      },
    },
    {
      id: 'product-hero',
      type: 'image',
      role: 'hero',
      priority: 2,
      content: {
        id: 'product-hero',
        src: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
        alt: 'Aura Monolith Acoustic Titanium Headphone',
        aspectRatio: 1.0,
      },
      constraints: {
        minWidth: 80,
        maxWidth: 500,
        minHeight: 80,
        maxHeight: 500,
        aspectRatio: 1.0,
        preserveAspectRatio: true,
        allowDrop: false,
      },
      styles: {
        borderRadius: 24,
      },
    },
    {
      id: 'feature-badges',
      type: 'badge',
      role: 'secondary',
      priority: 3,
      content: {
        id: 'feature-badges',
        text: '48dB ANC • TI-DRIVER • LOSSLESS',
      },
      constraints: { minWidth: 140, maxWidth: 300, minHeight: 24, maxHeight: 36, allowDrop: true },
      styles: {
        textColor: '#e14b2d',
      },
    },
    {
      id: 'offer-price',
      type: 'price-tag',
      role: 'secondary',
      priority: 4,
      content: {
        id: 'offer-price',
        currency: '$',
        amount: '349',
        originalAmount: '$429',
        discountPercentage: 'ÉDITION LIMITÉE',
      },
      constraints: { minWidth: 90, maxWidth: 200, minHeight: 28, maxHeight: 48, allowDrop: true },
      styles: { textColor: '#ffffff', fontWeight: 'bold' },
    },
    {
      id: 'acquire-btn',
      type: 'button',
      role: 'action',
      priority: 1,
      content: {
        id: 'acquire-btn',
        label: 'Acquire Edition →',
        variant: 'primary',
      },
      constraints: { minWidth: 140, maxWidth: 380, minHeight: 48, maxHeight: 64, allowDrop: false },
      styles: {
        backgroundColor: '#e14b2d',
        textColor: '#fffdfa',
        borderRadius: 0,
        fontWeight: 'bold',
      },
    },
  ],
});

export const sampleAdSpecs: AdSpec[] = [
  auraAcousticSpec,
  palmoCoconutSpec,
  palmoPineappleSpec,
  palmoWatermelonSpec,
];

