import type { AdElement, Priority, DegradationStage } from '../types';

export interface DegradationPlan {
  stage: DegradationStage;
  gapScale: number;
  paddingScale: number;
  fontScale: number;
  heroScale: number;
  heroMode: 'expanded' | 'balanced' | 'compact' | 'thumbnail' | 'none';
  allowedMinPriority: Priority;
  truncateSubtext: boolean;
  dropBranding: boolean;
  dropBadges: boolean;
  dropSecondary: boolean;
}

export const DEGRADATION_STAGES: DegradationPlan[] = [
  {
    stage: 'STAGE_0_OPTIMAL',
    gapScale: 1.0,
    paddingScale: 1.0,
    fontScale: 1.0,
    heroScale: 1.0,
    heroMode: 'expanded',
    allowedMinPriority: 3,
    truncateSubtext: false,
    dropBranding: false,
    dropBadges: false,
    dropSecondary: false,
  },
  {
    stage: 'STAGE_1_COMPACT_PADDING',
    gapScale: 0.75,
    paddingScale: 0.8,
    fontScale: 0.95,
    heroScale: 0.9,
    heroMode: 'balanced',
    allowedMinPriority: 3,
    truncateSubtext: false,
    dropBranding: false,
    dropBadges: false,
    dropSecondary: false,
  },
  {
    stage: 'STAGE_2_FONT_REDUCED',
    gapScale: 0.6,
    paddingScale: 0.65,
    fontScale: 0.85,
    heroScale: 0.8,
    heroMode: 'balanced',
    allowedMinPriority: 3,
    truncateSubtext: true,
    dropBranding: false,
    dropBadges: false,
    dropSecondary: false,
  },
  {
    stage: 'STAGE_3_HERO_ADAPTED',
    gapScale: 0.5,
    paddingScale: 0.55,
    fontScale: 0.8,
    heroScale: 0.65,
    heroMode: 'compact',
    allowedMinPriority: 3,
    truncateSubtext: true,
    dropBranding: false,
    dropBadges: false,
    dropSecondary: false,
  },
  {
    stage: 'STAGE_4_TEXT_TRUNCATED',
    gapScale: 0.45,
    paddingScale: 0.5,
    fontScale: 0.75,
    heroScale: 0.55,
    heroMode: 'compact',
    allowedMinPriority: 3,
    truncateSubtext: true,
    dropBranding: false,
    dropBadges: true,
    dropSecondary: false,
  },
  {
    stage: 'STAGE_5_PRIORITY_3_DROPPED',
    gapScale: 0.4,
    paddingScale: 0.45,
    fontScale: 0.72,
    heroScale: 0.45,
    heroMode: 'thumbnail',
    allowedMinPriority: 2,
    truncateSubtext: true,
    dropBranding: true,
    dropBadges: true,
    dropSecondary: false,
  },
  {
    stage: 'STAGE_6_PRIORITY_2_DROPPED',
    gapScale: 0.35,
    paddingScale: 0.4,
    fontScale: 0.7,
    heroScale: 0.35,
    heroMode: 'thumbnail',
    allowedMinPriority: 1,
    truncateSubtext: true,
    dropBranding: true,
    dropBadges: true,
    dropSecondary: true,
  },
  {
    stage: 'STAGE_7_MINIMAL_SURVIVAL',
    gapScale: 0.25,
    paddingScale: 0.3,
    fontScale: 0.65,
    heroScale: 0.25,
    heroMode: 'none',
    allowedMinPriority: 1,
    truncateSubtext: true,
    dropBranding: true,
    dropBadges: true,
    dropSecondary: true,
  },
];

export function isElementRetained(element: AdElement, plan: DegradationPlan): boolean {
  if (element.constraints?.allowDrop === false) {
    return true;
  }

  if (element.priority === 1) {
    return true;
  }

  if (plan.dropBranding && element.role === 'branding') {
    return false;
  }

  if (plan.dropBadges && element.role === 'badge') {
    return false;
  }

  if (plan.dropSecondary && element.role === 'secondary') {
    return false;
  }

  return element.priority <= plan.allowedMinPriority;
}
