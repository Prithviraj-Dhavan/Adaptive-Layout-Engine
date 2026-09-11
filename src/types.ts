/**
 * Core Type Definitions for the Multi-Surface Adaptive Layout Engine
 * 
 * Provides end-to-end type safety across:
 * 1. Declarative Ad Specifications (AdSpec, AdElement, Roles, Priorities)
 * 2. Surface Profiles & Real-world Constraints (Surfaces, SafeAreas, Touch, ViewingDistance)
 * 3. Resolved Layout Output (ResolvedLayout, ResolvedElementLayout, Degradation Audits)
 */

export type ElementRole =
  | 'primary'      // Main message / headline (Priority 1)
  | 'hero'         // Hero visual asset / product image / 3D model banner
  | 'action'       // Call To Action button (Priority 1 or 2)
  | 'branding'     // Logo / brand mark / sponsor watermark (Priority 3)
  | 'secondary'    // Pricing, ratings, specs, promo details (Priority 2 or 3)
  | 'badge'        // Discount tag, limited-time badge, new arrival chip
  | 'disclaimer';  // Legal terms, fine print, QR caption

export type AdElementType = 'text' | 'image' | 'button' | 'badge' | 'price-tag';

export type Priority = 1 | 2 | 3 | 4 | 5;

export interface SafeArea {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export type ViewingDistance = 'near' | 'medium' | 'far';

export interface ElementConstraints {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  aspectRatio?: number; // width / height
  minAspectRatio?: number;
  maxAspectRatio?: number;
  minFontSize?: number;
  maxFontSize?: number;
  allowTruncation?: boolean;
  allowDrop?: boolean;
  preserveAspectRatio?: boolean;
  minTapTargetOverride?: number;
  preferredAlignment?: 'start' | 'center' | 'end' | 'stretch';
}

export interface ElementStyles {
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderRadius?: number;
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'black';
  fontFamily?: string;
  shadow?: string;
  accentGradient?: string;
  glowColor?: string;
}

export interface BaseElementContent {
  id: string;
}

export interface TextElementContent extends BaseElementContent {
  text: string;
  subtext?: string;
  maxLines?: number;
}

export interface ImageElementContent extends BaseElementContent {
  src: string;
  alt: string;
  fallbackColor?: string;
  aspectRatio?: number;
  overlayGradient?: boolean;
}

export interface ButtonElementContent extends BaseElementContent {
  label: string;
  actionUrl?: string;
  icon?: string;
  sublabel?: string;
  variant?: 'primary' | 'secondary' | 'glass' | 'glow';
}

export interface BadgeElementContent extends BaseElementContent {
  text: string;
  icon?: string;
  variant?: 'pill' | 'ribbon' | 'minimal';
}

export interface PriceTagElementContent extends BaseElementContent {
  currency: string;
  amount: string;
  originalAmount?: string;
  discountPercentage?: string;
  period?: string;
}

export type ElementContent =
  | TextElementContent
  | ImageElementContent
  | ButtonElementContent
  | BadgeElementContent
  | PriceTagElementContent;

export interface AdElement<TContent extends ElementContent = ElementContent> {
  id: string;
  type: AdElementType;
  role: ElementRole;
  priority: Priority; // 1 = Highest (Must preserve), 5 = Lowest (Drop first)
  content: TContent;
  constraints?: ElementConstraints;
  styles?: ElementStyles;
}

export interface AdTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  textMutedColor: string;
  fontFamily: string;
  borderRadius: number;
}

export interface AdSpec {
  id: string;
  name: string;
  campaign?: string;
  elements: AdElement[];
  theme?: Partial<AdTheme>;
  preferredStrategy?: 'auto' | 'hero-dominant' | 'text-first' | 'split';
}

export interface SurfaceProfile {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  safeArea: SafeArea;
  minTapTarget: number; // e.g. 44px (Apple HIG), 48px (Material), 60px (Retail Kiosk), 0 (Broadcast)
  minTextSize: number; // e.g. 12px (mobile near), 16px (desktop medium), 32px (broadcast far)
  viewingDistance: ViewingDistance;
  touchOnly: boolean;
  orientation: 'portrait' | 'landscape' | 'square';
  devicePixelRatio?: number;
  category: 'mobile' | 'broadcast' | 'kiosk' | 'desktop' | 'wearable' | 'custom';
  ambientTheme?: 'dark' | 'light' | 'cinema' | 'storefront';
}

export type LayoutStrategy =
  | 'HORIZONTAL_STRIP'    // Aspect ratio >= 3.5 (Broadcast Lower Third, Banner)
  | 'SPLIT_LANDSCAPE'     // Aspect ratio between 1.6 and 3.5 (Landscape Mobile, Tablet, Billboard)
  | 'SQUARE_BALANCED'     // Aspect ratio between 0.85 and 1.6 (Square Kiosk, Instagram 1:1, Smart Display)
  | 'VERTICAL_STACK'      // Aspect ratio < 0.85 (Mobile Interstitial, Story 9:16)
  | 'EXTREME_MICRO';      // Extremely tiny surfaces / widgets (< 180px)

export type DegradationStage =
  | 'STAGE_0_OPTIMAL'            // All elements full size with generous margins
  | 'STAGE_1_COMPACT_PADDING'    // Spacing compressed by 30-50%
  | 'STAGE_2_FONT_REDUCED'       // Font sizes tightened towards readable threshold
  | 'STAGE_3_HERO_ADAPTED'       // Hero image adapted (aspect ratio adjusted/cropped)
  | 'STAGE_4_TEXT_TRUNCATED'     // Secondary text shortened/truncated
  | 'STAGE_5_PRIORITY_3_DROPPED' // Lowest priority elements dropped (e.g., logo branding / badges)
  | 'STAGE_6_PRIORITY_2_DROPPED' // Secondary priority dropped (e.g., price sub-labels / disclaimers)
  | 'STAGE_7_MINIMAL_SURVIVAL';  // Only priority 1 elements preserved (CTA + Headline)

export interface ResolvedElementLayout {
  id: string;
  type: AdElementType;
  role: ElementRole;
  priority: Priority;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  opacity: number;
  visible: boolean;
  fontSize?: number;
  lineHeight?: number;
  textAlign?: 'left' | 'center' | 'right';
  textLines?: string[];
  isTruncated?: boolean;
  objectFit?: 'cover' | 'contain' | 'fill';
  degradationStage: DegradationStage;
  dropReason?: string;
  content: ElementContent;
  styles?: ElementStyles;
  computedStyles: Record<string, string | number>;
  renderMetadata?: {
    tapTargetCompliant: boolean;
    textSizeCompliant: boolean;
    contrastRatio?: number;
    intrinsicWidth?: number;
    intrinsicHeight?: number;
  };
}

export interface LayoutAudit {
  hasCollisions: boolean;
  allTapTargetsCompliant: boolean;
  allTextSizesCompliant: boolean;
  noBoundsExceeded: boolean;
  wcagContrastPassed: boolean;
  collisionsDetected: string[];
  warnings: string[];
}

export interface DegradationSummary {
  overallStage: DegradationStage;
  activeElementCount: number;
  droppedElementCount: number;
  droppedElementIds: string[];
  spaceUtilizationPercent: number;
  fontScaleMultiplier: number;
}

export interface ResolvedLayout {
  surface: SurfaceProfile;
  specId: string;
  elements: ResolvedElementLayout[];
  droppedElements: ResolvedElementLayout[];
  strategyUsed: LayoutStrategy;
  availableBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  degradationSummary: DegradationSummary;
  audit: LayoutAudit;
  calculationLogs: string[];
  durationMs: number;
  timestamp: number;
}
