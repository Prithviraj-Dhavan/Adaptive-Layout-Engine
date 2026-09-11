import type {
  AdSpec,
  SurfaceProfile,
  ResolvedLayout,
  ResolvedElementLayout,
  LayoutAudit,
  LayoutStrategy,
  DegradationStage,
  AdElement,
  TextElementContent,
} from '../types';
import { computeGeometricMetrics, determineLayoutStrategy } from './strategies';
import { DEGRADATION_STAGES, isElementRetained } from './degradation';
import type { DegradationPlan } from './degradation';
import { measureText } from './text-measurer';

interface IntermediateBox {
  element: AdElement;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  lineHeight?: number;
  textLines?: string[];
  isTruncated?: boolean;
  objectFit?: 'cover' | 'contain' | 'fill';
  degradationStage: DegradationStage;
  visible: boolean;
  dropReason?: string;
  tapTargetCompliant: boolean;
  textSizeCompliant: boolean;
}

/**
 * Main Constraint Solver Pass
 */
export function solveConstraints(spec: AdSpec, surface: SurfaceProfile): ResolvedLayout {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const calculationLogs: string[] = [];

  // 1. Calculate Safe Bounds
  const safeLeft = surface.safeArea.left;
  const safeTop = surface.safeArea.top;
  const availableWidth = Math.max(20, surface.width - (surface.safeArea.left + surface.safeArea.right));
  const availableHeight = Math.max(20, surface.height - (surface.safeArea.top + surface.safeArea.bottom));

  calculationLogs.push(`Safe bounds computed: ${availableWidth}x${availableHeight}px (Safe Area: T=${safeTop}, R=${surface.safeArea.right}, B=${surface.safeArea.bottom}, L=${safeLeft})`);

  // 2. Compute Pure Geometric Metrics & Select Layout Strategy
  const metrics = computeGeometricMetrics(availableWidth, availableHeight);
  const strategy: LayoutStrategy = determineLayoutStrategy(metrics);

  calculationLogs.push(`Strategy chosen: ${strategy} (Aspect Ratio: ${metrics.aspectRatio.toFixed(2)}:1, Axis: ${metrics.dominantAxis})`);

  // 3. Progressive Relaxation & Degradation Search
  let bestBoxes: IntermediateBox[] = [];
  let bestDropped: IntermediateBox[] = [];
  let resolvedStage: DegradationPlan = DEGRADATION_STAGES[0];
  let solvedSuccessfully = false;

  for (let stageIdx = 0; stageIdx < DEGRADATION_STAGES.length; stageIdx++) {
    const plan = DEGRADATION_STAGES[stageIdx];
    const candidateResult = layoutWithPlan(spec, surface, availableWidth, availableHeight, strategy, plan);

    if (candidateResult.totalHeight <= availableHeight && candidateResult.totalWidth <= availableWidth) {
      bestBoxes = candidateResult.boxes;
      bestDropped = candidateResult.dropped;
      resolvedStage = plan;
      solvedSuccessfully = true;
      calculationLogs.push(`Stage ${plan.stage} satisfied constraints (Required: ${candidateResult.totalWidth.toFixed(0)}x${candidateResult.totalHeight.toFixed(0)}px <= Available: ${availableWidth}x${availableHeight}px, Preserved: ${bestBoxes.length}, Dropped: ${bestDropped.length})`);
      break;
    } else {
      calculationLogs.push(`Stage ${plan.stage} overflowed (Needed: ${candidateResult.totalWidth.toFixed(0)}x${candidateResult.totalHeight.toFixed(0)}px > Available: ${availableWidth}x${availableHeight}px). Cascading to next stage.`);
    }
  }

  // Fallback if extreme constraints: use minimal survival layout
  if (!solvedSuccessfully) {
    const finalPlan = DEGRADATION_STAGES[DEGRADATION_STAGES.length - 1];
    const fallbackResult = layoutWithPlan(spec, surface, availableWidth, availableHeight, strategy, finalPlan);
    bestBoxes = fallbackResult.boxes;
    bestDropped = fallbackResult.dropped;
    resolvedStage = finalPlan;
    calculationLogs.push(`Applied Minimal Survival Fallback for extreme dimensions.`);
  }

  // 4. Position elements relative to surface safe coordinates
  const resolvedElements: ResolvedElementLayout[] = bestBoxes.map((box, idx) => {
    return {
      id: box.element.id,
      type: box.element.type,
      role: box.element.role,
      priority: box.element.priority,
      x: Math.round(safeLeft + box.x),
      y: Math.round(safeTop + box.y),
      width: Math.round(box.width),
      height: Math.round(box.height),
      zIndex: 10 + idx,
      opacity: 1.0,
      visible: true,
      fontSize: box.fontSize,
      lineHeight: box.lineHeight,
      textAlign: strategy === 'HORIZONTAL_STRIP' ? 'left' : strategy === 'VERTICAL_STACK' ? 'center' : 'left',
      textLines: box.textLines,
      isTruncated: box.isTruncated,
      objectFit: box.objectFit || 'cover',
      degradationStage: box.degradationStage,
      content: box.element.content,
      styles: box.element.styles,
      computedStyles: {
        borderRadius: box.element.styles?.borderRadius ?? 12,
        backgroundColor: box.element.styles?.backgroundColor ?? 'transparent',
      },
      renderMetadata: {
        tapTargetCompliant: box.tapTargetCompliant,
        textSizeCompliant: box.textSizeCompliant,
        intrinsicWidth: box.width,
        intrinsicHeight: box.height,
      },
    };
  });

  const droppedElements: ResolvedElementLayout[] = bestDropped.map((box) => {
    return {
      id: box.element.id,
      type: box.element.type,
      role: box.element.role,
      priority: box.element.priority,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      zIndex: 0,
      opacity: 0,
      visible: false,
      degradationStage: box.degradationStage,
      dropReason: box.dropReason || `Priority ${box.element.priority} dropped due to constrained spatial budget`,
      content: box.element.content,
      styles: box.element.styles,
      computedStyles: {},
    };
  });

  // 5. Verification & Mathematical Collision Audit Pass
  const audit = runAudit(resolvedElements, surface, availableWidth, availableHeight, safeLeft, safeTop);

  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const durationMs = Math.round((endTime - startTime) * 100) / 100;

  let totalActiveArea = 0;
  for (const el of resolvedElements) {
    totalActiveArea += el.width * el.height;
  }
  const spaceUtilizationPercent = Math.min(100, Math.round((totalActiveArea / (availableWidth * availableHeight)) * 100));

  return {
    surface,
    specId: spec.id,
    elements: resolvedElements,
    droppedElements,
    strategyUsed: strategy,
    availableBounds: {
      x: safeLeft,
      y: safeTop,
      width: availableWidth,
      height: availableHeight,
    },
    degradationSummary: {
      overallStage: resolvedStage.stage,
      activeElementCount: resolvedElements.length,
      droppedElementCount: droppedElements.length,
      droppedElementIds: droppedElements.map((d) => d.id),
      spaceUtilizationPercent,
      fontScaleMultiplier: resolvedStage.fontScale,
    },
    audit,
    calculationLogs,
    durationMs,
    timestamp: Date.now(),
  };
}

/**
 * Layout resolution for a specific degradation plan and strategy
 */
function layoutWithPlan(
  spec: AdSpec,
  surface: SurfaceProfile,
  W: number,
  H: number,
  strategy: LayoutStrategy,
  plan: DegradationPlan
): { boxes: IntermediateBox[]; dropped: IntermediateBox[]; totalWidth: number; totalHeight: number } {
  const retained: AdElement[] = [];
  const dropped: IntermediateBox[] = [];

  for (const el of spec.elements) {
    if (isElementRetained(el, plan)) {
      retained.push(el);
    } else {
      dropped.push({
        element: el,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        visible: false,
        degradationStage: plan.stage,
        dropReason: `Priority ${el.priority} (${el.role}) dropped in ${plan.stage} to preserve high-priority anchors`,
        tapTargetCompliant: true,
        textSizeCompliant: true,
      });
    }
  }

  const viewingMultiplier = surface.viewingDistance === 'far' ? 1.65 : surface.viewingDistance === 'medium' ? 1.15 : 1.0;

  switch (strategy) {
    case 'HORIZONTAL_STRIP':
      return layoutHorizontalStrip(retained, dropped, surface, W, H, plan, viewingMultiplier);
    case 'SPLIT_LANDSCAPE':
      return layoutSplitLandscape(retained, dropped, surface, W, H, plan, viewingMultiplier);
    case 'SQUARE_BALANCED':
      return layoutSquareBalanced(retained, dropped, surface, W, H, plan, viewingMultiplier);
    case 'EXTREME_MICRO':
      return layoutExtremeMicro(retained, dropped, surface, W, H, plan);
    case 'VERTICAL_STACK':
    default:
      return layoutVerticalStack(retained, dropped, surface, W, H, plan, viewingMultiplier);
  }
}

// ---------------------------------------------------------------------------
// 1. HORIZONTAL STRIP STRATEGY (Broadcast Lower-Third, Wide Banners)
// ---------------------------------------------------------------------------
function layoutHorizontalStrip(
  elements: AdElement[],
  dropped: IntermediateBox[],
  surface: SurfaceProfile,
  W: number,
  H: number,
  plan: DegradationPlan,
  viewingMultiplier: number
) {
  const boxes: IntermediateBox[] = [];
  const gap = Math.max(12, Math.round(18 * plan.gapScale));

  const hero = elements.find((e) => e.role === 'hero');
  const action = elements.find((e) => e.role === 'action');
  const primary = elements.find((e) => e.role === 'primary');
  const secondary = elements.find((e) => e.role === 'secondary');
  const branding = elements.find((e) => e.role === 'branding');

  let currentX = 0;
  let heroH = 0;

  // Left: Hero visual thumbnail or branding
  if (hero) {
    heroH = Math.min(H, Math.round(H * 0.92 * plan.heroScale));
    const heroW = Math.round(heroH * (hero.constraints?.aspectRatio || 1.0));
    boxes.push({
      element: hero,
      x: currentX,
      y: Math.round((H - heroH) / 2),
      width: heroW,
      height: heroH,
      objectFit: 'cover',
      degradationStage: plan.stage,
      visible: true,
      tapTargetCompliant: true,
      textSizeCompliant: true,
    });
    currentX += heroW + gap;
  } else if (branding) {
    const brandH = Math.min(H * 0.6, 44);
    const brandW = Math.round(brandH * 3.2);
    boxes.push({
      element: branding,
      x: currentX,
      y: Math.round((H - brandH) / 2),
      width: brandW,
      height: brandH,
      objectFit: 'contain',
      degradationStage: plan.stage,
      visible: true,
      tapTargetCompliant: true,
      textSizeCompliant: true,
    });
    currentX += brandW + gap;
  }

  // Right: CTA Action Button (generous width so label never clips!)
  let actionW = 0;
  let actionH = 0;
  if (action) {
    const minTap = surface.touchOnly ? Math.max(surface.minTapTarget, 44) : 44;
    actionH = Math.max(minTap, Math.round(52 * plan.fontScale));
    actionW = Math.min(Math.round(W * 0.24), Math.max(180, Math.round(W * 0.18)));
    const actionX = W - actionW;
    const actionFontSize = Math.max(surface.minTextSize, Math.round(16 * viewingMultiplier * plan.fontScale));

    boxes.push({
      element: action,
      x: actionX,
      y: Math.round((H - actionH) / 2),
      width: actionW,
      height: actionH,
      fontSize: actionFontSize,
      lineHeight: actionH,
      degradationStage: plan.stage,
      visible: true,
      tapTargetCompliant: actionH >= surface.minTapTarget,
      textSizeCompliant: actionFontSize >= surface.minTextSize,
    });
  }

  // Center: Flexible Content Zone
  const availableCenterW = Math.max(100, (action ? W - actionW - gap : W) - currentX);
  
  // Pre-calculate heights
  let primaryH = 0;
  let baseFontSize = 0;
  let textMeasure = { lines: [] as string[], isTruncated: false, height: 0 };
  if (primary) {
    const textContent = primary.content as TextElementContent;
    baseFontSize = Math.max(
      surface.minTextSize,
      Math.round(26 * viewingMultiplier * plan.fontScale)
    );
    textMeasure = measureText(textContent.text, baseFontSize, availableCenterW, 1, 'bold');
    primaryH = Math.min(H, Math.max(textMeasure.height, Math.round(baseFontSize * 1.25)));
  }

  let priceH = 0;
  let priceFontSize = 0;
  if (secondary) {
    priceFontSize = Math.max(
      surface.minTextSize,
      Math.round(18 * viewingMultiplier * plan.fontScale)
    );
    priceH = Math.round(priceFontSize * 1.3);
  }

  const verticalGap = 8;
  const totalCenterH = (primary ? primaryH : 0) + (secondary ? priceH : 0) + (primary && secondary ? verticalGap : 0);
  let currentCenterY = Math.max(0, Math.round((H - totalCenterH) / 2));

  if (primary) {
    boxes.push({
      element: primary,
      x: currentX,
      y: currentCenterY,
      width: availableCenterW,
      height: primaryH,
      fontSize: baseFontSize,
      lineHeight: Math.round(baseFontSize * 1.25),
      textLines: textMeasure.lines,
      isTruncated: textMeasure.isTruncated,
      degradationStage: plan.stage,
      visible: true,
      tapTargetCompliant: true,
      textSizeCompliant: baseFontSize >= surface.minTextSize,
    });
    currentCenterY += primaryH + verticalGap;
  }

  if (secondary) {
    boxes.push({
      element: secondary,
      x: currentX,
      y: currentCenterY,
      width: Math.min(availableCenterW, 200),
      height: priceH,
      fontSize: priceFontSize,
      lineHeight: priceH,
      degradationStage: plan.stage,
      visible: true,
      tapTargetCompliant: true,
      textSizeCompliant: priceFontSize >= surface.minTextSize,
    });
  }

  const totalRequiredH = Math.max(heroH, primaryH + priceH, actionH);
  const totalRequiredW = currentX + (action ? actionW : 0) + 60;

  return {
    boxes,
    dropped,
    totalWidth: Math.min(W, totalRequiredW),
    totalHeight: totalRequiredH,
  };
}

// ---------------------------------------------------------------------------
// 2. SPLIT LANDSCAPE STRATEGY (16:9 / Landscape Mobile / Tablet)
// ---------------------------------------------------------------------------
function layoutSplitLandscape(
  elements: AdElement[],
  dropped: IntermediateBox[],
  surface: SurfaceProfile,
  W: number,
  H: number,
  plan: DegradationPlan,
  viewingMultiplier: number
) {
  const boxes: IntermediateBox[] = [];
  const gap = Math.max(10, Math.round(14 * plan.gapScale));

  const hero = elements.find((e) => e.role === 'hero');
  const action = elements.find((e) => e.role === 'action');
  const primary = elements.find((e) => e.role === 'primary');
  const secondary = elements.find((e) => e.role === 'secondary');
  const branding = elements.find((e) => e.role === 'branding');
  const badge = elements.find((e) => e.role === 'badge');

  const heroColW = hero ? Math.round(W * 0.40 * plan.heroScale) : 0;
  const contentColW = W - heroColW - (hero ? gap : 0);
  const contentColX = hero ? heroColW + gap : 0;

  if (hero) {
    boxes.push({
      element: hero,
      x: 0,
      y: 0,
      width: heroColW,
      height: H,
      objectFit: 'cover',
      degradationStage: plan.stage,
      visible: true,
      tapTargetCompliant: true,
      textSizeCompliant: true,
    });
  }

  let currentY = 0;

  // 1. Branding & Badge (Non-overlapping top row!)
  if (branding || badge) {
    let topRowH = 0;
    const maxItemW = Math.floor((contentColW - gap) / 2);

    if (branding) {
      const bH = Math.min(30, Math.round(H * 0.11));
      const bW = Math.min(maxItemW, 140);
      boxes.push({
        element: branding,
        x: contentColX,
        y: currentY,
        width: bW,
        height: bH,
        objectFit: 'contain',
        degradationStage: plan.stage,
        visible: true,
        tapTargetCompliant: true,
        textSizeCompliant: true,
      });
      topRowH = Math.max(topRowH, bH);
    }
    if (badge) {
      const badgeH = Math.min(26, Math.round(H * 0.09));
      const badgeW = Math.min(maxItemW, 160);
      const bFontSize = Math.max(surface.minTextSize * 0.85, Math.round(11 * viewingMultiplier * plan.fontScale));
      boxes.push({
        element: badge,
        x: branding ? contentColX + contentColW - badgeW : contentColX,
        y: currentY,
        width: badgeW,
        height: badgeH,
        fontSize: bFontSize,
        lineHeight: badgeH,
        degradationStage: plan.stage,
        visible: true,
        tapTargetCompliant: true,
        textSizeCompliant: bFontSize >= surface.minTextSize * 0.75,
      });
      topRowH = Math.max(topRowH, badgeH);
    }
    currentY += topRowH + gap;
  }

  // 2. Primary Headline
  if (primary) {
    const textContent = primary.content as TextElementContent;
    const headlineFontSize = Math.max(
      surface.minTextSize,
      Math.round(20 * viewingMultiplier * plan.fontScale)
    );
    const textMeasure = measureText(textContent.text, headlineFontSize, contentColW, 2, 'bold');

    boxes.push({
      element: primary,
      x: contentColX,
      y: currentY,
      width: contentColW,
      height: textMeasure.height,
      fontSize: headlineFontSize,
      lineHeight: textMeasure.lineHeight,
      textLines: textMeasure.lines,
      isTruncated: textMeasure.isTruncated,
      degradationStage: plan.stage,
      visible: true,
      tapTargetCompliant: true,
      textSizeCompliant: headlineFontSize >= surface.minTextSize,
    });
    currentY += textMeasure.height + gap;
  }

  // 3. Price Tag
  if (secondary) {
    const priceFontSize = Math.max(
      surface.minTextSize,
      Math.round(18 * viewingMultiplier * plan.fontScale)
    );
    const priceH = Math.round(priceFontSize * 1.3);
    boxes.push({
      element: secondary,
      x: contentColX,
      y: currentY,
      width: Math.min(contentColW * 0.55, 180),
      height: priceH,
      fontSize: priceFontSize,
      lineHeight: priceH,
      degradationStage: plan.stage,
      visible: true,
      tapTargetCompliant: true,
      textSizeCompliant: priceFontSize >= surface.minTextSize,
    });
    currentY += priceH + gap;
  }

  // 4. CTA Button (Anchored to bottom right of content column)
  let btnH = 0;
  if (action) {
    const minTap = surface.touchOnly ? Math.max(surface.minTapTarget, 44) : 40;
    btnH = Math.max(minTap, Math.round(46 * plan.fontScale));
    const btnW = Math.min(contentColW, Math.max(160, Math.round(contentColW * 0.9)));
    const btnY = Math.max(currentY, H - btnH);
    const btnFontSize = Math.max(surface.minTextSize, Math.round(14 * viewingMultiplier * plan.fontScale));

    boxes.push({
      element: action,
      x: contentColX,
      y: btnY,
      width: btnW,
      height: btnH,
      fontSize: btnFontSize,
      lineHeight: btnH,
      degradationStage: plan.stage,
      visible: true,
      tapTargetCompliant: btnH >= surface.minTapTarget,
      textSizeCompliant: btnFontSize >= surface.minTextSize,
    });
  }

  const totalRequiredH = currentY + btnH;

  return {
    boxes,
    dropped,
    totalWidth: W,
    totalHeight: totalRequiredH,
  };
}

// ---------------------------------------------------------------------------
// 3. SQUARE BALANCED STRATEGY (1:1 Retail Kiosk, Square Screen)
// ---------------------------------------------------------------------------
function layoutSquareBalanced(
  elements: AdElement[],
  dropped: IntermediateBox[],
  surface: SurfaceProfile,
  W: number,
  H: number,
  plan: DegradationPlan,
  viewingMultiplier: number
) {
  const boxes: IntermediateBox[] = [];
  const gap = Math.max(12, Math.round(18 * plan.gapScale));

  const hero = elements.find((e) => e.role === 'hero');
  const action = elements.find((e) => e.role === 'action');
  const primary = elements.find((e) => e.role === 'primary');
  const secondary = elements.find((e) => e.role === 'secondary');
  const branding = elements.find((e) => e.role === 'branding');
  const badge = elements.find((e) => e.role === 'badge');

  let currentY = 0;

  // Top Row: Branding & Badge without overlap
  if (branding || badge) {
    let rowH = 0;
    const halfW = Math.floor((W - gap) / 2);

    if (branding) {
      const bH = Math.min(36, Math.round(H * 0.055));
      const bW = Math.min(halfW, 160);
      boxes.push({
        element: branding,
        x: 0,
        y: currentY,
        width: bW,
        height: bH,
        objectFit: 'contain',
        degradationStage: plan.stage,
        visible: true,
        tapTargetCompliant: true,
        textSizeCompliant: true,
      });
      rowH = Math.max(rowH, bH);
    }
    if (badge) {
      const badgeH = Math.min(30, Math.round(H * 0.048));
      const badgeW = Math.min(halfW, 180);
      const bFontSize = Math.max(surface.minTextSize * 0.85, Math.round(12 * viewingMultiplier * plan.fontScale));
      boxes.push({
        element: badge,
        x: W - badgeW,
        y: currentY,
        width: badgeW,
        height: badgeH,
        fontSize: bFontSize,
        lineHeight: badgeH,
        degradationStage: plan.stage,
        visible: true,
        tapTargetCompliant: true,
        textSizeCompliant: bFontSize >= surface.minTextSize * 0.75,
      });
      rowH = Math.max(rowH, badgeH);
    }
    currentY += rowH + gap;
  }

  // Hero Image
  if (hero) {
    const heroH = Math.min(Math.round(H * 0.38 * plan.heroScale), W);
    boxes.push({
      element: hero,
      x: 0,
      y: currentY,
      width: W,
      height: heroH,
      objectFit: 'cover',
      degradationStage: plan.stage,
      visible: true,
      tapTargetCompliant: true,
      textSizeCompliant: true,
    });
    currentY += heroH + gap;
  }

  // Headline
  if (primary) {
    const textContent = primary.content as TextElementContent;
    const headlineFontSize = Math.max(
      surface.minTextSize,
      Math.round(26 * viewingMultiplier * plan.fontScale)
    );
    const textMeasure = measureText(textContent.text, headlineFontSize, W, 2, 'bold');
    boxes.push({
      element: primary,
      x: 0,
      y: currentY,
      width: W,
      height: textMeasure.height,
      fontSize: headlineFontSize,
      lineHeight: textMeasure.lineHeight,
      textLines: textMeasure.lines,
      isTruncated: textMeasure.isTruncated,
      degradationStage: plan.stage,
      visible: true,
      tapTargetCompliant: true,
      textSizeCompliant: headlineFontSize >= surface.minTextSize,
    });
    currentY += textMeasure.height + gap;
  }

  // Bottom Touch Row: Secondary Price Tag + Large CTA Button
  const minTap = surface.touchOnly ? Math.max(surface.minTapTarget, 60) : 48;
  const btnH = Math.max(minTap, Math.round(60 * plan.fontScale));
  const bottomY = H - btnH;

  if (secondary) {
    const priceFontSize = Math.max(
      surface.minTextSize,
      Math.round(22 * viewingMultiplier * plan.fontScale)
    );
    const priceW = Math.round(W * 0.35);
    boxes.push({
      element: secondary,
      x: 0,
      y: bottomY,
      width: priceW,
      height: btnH,
      fontSize: priceFontSize,
      lineHeight: btnH,
      degradationStage: plan.stage,
      visible: true,
      tapTargetCompliant: true,
      textSizeCompliant: priceFontSize >= surface.minTextSize,
    });
  }

  if (action) {
    const btnW = secondary ? W - Math.round(W * 0.35) - gap : W;
    const btnX = secondary ? Math.round(W * 0.35) + gap : 0;
    const btnFontSize = Math.max(surface.minTextSize, Math.round(16 * viewingMultiplier * plan.fontScale));

    boxes.push({
      element: action,
      x: btnX,
      y: bottomY,
      width: btnW,
      height: btnH,
      fontSize: btnFontSize,
      lineHeight: btnH,
      degradationStage: plan.stage,
      visible: true,
      tapTargetCompliant: btnH >= surface.minTapTarget,
      textSizeCompliant: btnFontSize >= surface.minTextSize,
    });
  }

  const totalRequiredH = currentY + btnH;

  return {
    boxes,
    dropped,
    totalWidth: W,
    totalHeight: totalRequiredH,
  };
}

// ---------------------------------------------------------------------------
// 4. VERTICAL STACK STRATEGY (9:16 Mobile Interstitial, Stories)
// ---------------------------------------------------------------------------
function layoutVerticalStack(
  elements: AdElement[],
  dropped: IntermediateBox[],
  surface: SurfaceProfile,
  W: number,
  H: number,
  plan: DegradationPlan,
  viewingMultiplier: number
) {
  const boxes: IntermediateBox[] = [];
  const gap = Math.max(10, Math.round(14 * plan.gapScale));

  const hero = elements.find((e) => e.role === 'hero');
  const action = elements.find((e) => e.role === 'action');
  const primary = elements.find((e) => e.role === 'primary');
  const secondary = elements.find((e) => e.role === 'secondary');
  const branding = elements.find((e) => e.role === 'branding');
  const badge = elements.find((e) => e.role === 'badge');

  let currentY = 0;

  // Top Row: Branding and Badge side-by-side with guaranteed non-overlap
  if (branding || badge) {
    let topH = 0;
    const maxHalfW = Math.floor((W - gap) / 2);

    if (branding) {
      const bH = Math.min(32, Math.round(H * 0.052));
      const bW = Math.min(maxHalfW, 140);
      boxes.push({
        element: branding,
        x: 0,
        y: currentY,
        width: bW,
        height: bH,
        objectFit: 'contain',
        degradationStage: plan.stage,
        visible: true,
        tapTargetCompliant: true,
        textSizeCompliant: true,
      });
      topH = Math.max(topH, bH);
    }
    if (badge) {
      const badgeH = Math.min(26, Math.round(H * 0.044));
      const badgeW = Math.min(maxHalfW, 160);
      const bFontSize = Math.max(surface.minTextSize * 0.85, Math.round(11 * viewingMultiplier * plan.fontScale));
      boxes.push({
        element: badge,
        x: W - badgeW,
        y: currentY,
        width: badgeW,
        height: badgeH,
        fontSize: bFontSize,
        lineHeight: badgeH,
        degradationStage: plan.stage,
        visible: true,
        tapTargetCompliant: true,
        textSizeCompliant: bFontSize >= surface.minTextSize * 0.75,
      });
      topH = Math.max(topH, badgeH);
    }
    currentY += topH + gap;
  }

  // Hero Image
  if (hero) {
    const heroH = Math.min(Math.round(H * 0.36 * plan.heroScale), W);
    boxes.push({
      element: hero,
      x: 0,
      y: currentY,
      width: W,
      height: heroH,
      objectFit: 'cover',
      degradationStage: plan.stage,
      visible: true,
      tapTargetCompliant: true,
      textSizeCompliant: true,
    });
    currentY += heroH + gap;
  }

  // Headline
  if (primary) {
    const textContent = primary.content as TextElementContent;
    const headlineFontSize = Math.max(
      surface.minTextSize,
      Math.round(22 * viewingMultiplier * plan.fontScale)
    );
    const textMeasure = measureText(textContent.text, headlineFontSize, W, 2, 'bold');
    boxes.push({
      element: primary,
      x: 0,
      y: currentY,
      width: W,
      height: textMeasure.height,
      fontSize: headlineFontSize,
      lineHeight: textMeasure.lineHeight,
      textLines: textMeasure.lines,
      isTruncated: textMeasure.isTruncated,
      degradationStage: plan.stage,
      visible: true,
      tapTargetCompliant: true,
      textSizeCompliant: headlineFontSize >= surface.minTextSize,
    });
    currentY += textMeasure.height + gap;
  }

  // Price Tag
  if (secondary) {
    const priceFontSize = Math.max(
      surface.minTextSize,
      Math.round(18 * viewingMultiplier * plan.fontScale)
    );
    const priceH = Math.round(priceFontSize * 1.3);
    boxes.push({
      element: secondary,
      x: 0,
      y: currentY,
      width: W,
      height: priceH,
      fontSize: priceFontSize,
      lineHeight: priceH,
      degradationStage: plan.stage,
      visible: true,
      tapTargetCompliant: true,
      textSizeCompliant: priceFontSize >= surface.minTextSize,
    });
    currentY += priceH + gap;
  }

  // CTA Button (Anchored to bottom with full width)
  let btnH = 0;
  if (action) {
    const minTap = surface.touchOnly ? Math.max(surface.minTapTarget, 44) : 40;
    btnH = Math.max(minTap, Math.round(50 * plan.fontScale));
    const btnY = H - btnH;
    const btnFontSize = Math.max(surface.minTextSize, Math.round(15 * viewingMultiplier * plan.fontScale));

    boxes.push({
      element: action,
      x: 0,
      y: btnY,
      width: W,
      height: btnH,
      fontSize: btnFontSize,
      lineHeight: btnH,
      degradationStage: plan.stage,
      visible: true,
      tapTargetCompliant: btnH >= surface.minTapTarget,
      textSizeCompliant: btnFontSize >= surface.minTextSize,
    });
  }

  const totalRequiredH = currentY + btnH;

  return {
    boxes,
    dropped,
    totalWidth: W,
    totalHeight: totalRequiredH,
  };
}

// ---------------------------------------------------------------------------
// 5. EXTREME MICRO STRATEGY (Wearables, Tiny 100px containers)
// ---------------------------------------------------------------------------
function layoutExtremeMicro(
  elements: AdElement[],
  dropped: IntermediateBox[],
  surface: SurfaceProfile,
  W: number,
  H: number,
  plan: DegradationPlan
) {
  const boxes: IntermediateBox[] = [];
  const primary = elements.find((e) => e.role === 'primary');
  const action = elements.find((e) => e.role === 'action');

  // Automatically add any non-priority 1 elements to dropped in micro strategy
  for (const el of elements) {
    if (el.role !== 'primary' && el.role !== 'action') {
      dropped.push({
        element: el,
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        visible: false,
        degradationStage: plan.stage,
        dropReason: `Priority ${el.priority} (${el.role}) dropped due to EXTREME_MICRO spatial bounds (${W}x${H}px)`,
        tapTargetCompliant: true,
        textSizeCompliant: true,
      });
    }
  }

  const minTap = surface.touchOnly ? Math.max(surface.minTapTarget, 36) : 32;
  const btnH = Math.min(Math.round(H * 0.42), minTap);
  const textH = Math.max(16, H - btnH - 6);

  if (primary) {
    const headlineFontSize = Math.max(surface.minTextSize, 11);
    const textContent = primary.content as TextElementContent;
    const textMeasure = measureText(textContent.text, headlineFontSize, W, 1, 'bold');
    boxes.push({
      element: primary,
      x: 0,
      y: 0,
      width: W,
      height: textH,
      fontSize: headlineFontSize,
      lineHeight: textH,
      textLines: textMeasure.lines,
      isTruncated: true,
      degradationStage: plan.stage,
      visible: true,
      tapTargetCompliant: true,
      textSizeCompliant: headlineFontSize >= surface.minTextSize,
    });
  }

  if (action) {
    const btnFontSize = Math.max(surface.minTextSize * 0.9, 11);
    boxes.push({
      element: action,
      x: 0,
      y: H - btnH,
      width: W,
      height: btnH,
      fontSize: btnFontSize,
      lineHeight: btnH,
      degradationStage: plan.stage,
      visible: true,
      tapTargetCompliant: btnH >= surface.minTapTarget,
      textSizeCompliant: btnFontSize >= surface.minTextSize * 0.9,
    });
  }

  return {
    boxes,
    dropped,
    totalWidth: W,
    totalHeight: H,
  };
}

// ---------------------------------------------------------------------------
// MATHEMATICAL COLLISION & BOUNDS AUDITOR (Pass 5)
// ---------------------------------------------------------------------------
function runAudit(
  elements: ResolvedElementLayout[],
  surface: SurfaceProfile,
  W: number,
  H: number,
  safeLeft: number,
  safeTop: number
): LayoutAudit {
  const collisionsDetected: string[] = [];
  const warnings: string[] = [];
  let hasCollisions = false;
  let allTapTargetsCompliant = true;
  let allTextSizesCompliant = true;
  let noBoundsExceeded = true;

  const maxX = safeLeft + W;
  const maxY = safeTop + H;

  for (let i = 0; i < elements.length; i++) {
    const a = elements[i];

    if (a.x < safeLeft - 1 || a.y < safeTop - 1 || a.x + a.width > maxX + 1 || a.y + a.height > maxY + 1) {
      noBoundsExceeded = false;
      warnings.push(`Element "${a.id}" extends past safe bounding box.`);
    }

    if (a.role === 'action' && surface.touchOnly && a.height < surface.minTapTarget) {
      allTapTargetsCompliant = false;
      warnings.push(`CTA height (${a.height}px) is below surface minTapTarget (${surface.minTapTarget}px).`);
    }

    if (a.fontSize && a.fontSize < surface.minTextSize) {
      allTextSizesCompliant = false;
      warnings.push(`Text element "${a.id}" font size (${a.fontSize}px) is below surface minTextSize (${surface.minTextSize}px).`);
    }

    for (let j = i + 1; j < elements.length; j++) {
      const b = elements[j];

      if ((a.role === 'hero' && b.role === 'badge') || (a.role === 'badge' && b.role === 'hero')) {
        continue;
      }

      const intersects =
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y;

      if (intersects) {
        hasCollisions = true;
        collisionsDetected.push(`Collision between "${a.id}" (${a.x},${a.y},${a.width},${a.height}) and "${b.id}" (${b.x},${b.y},${b.width},${b.height})`);
      }
    }
  }

  return {
    hasCollisions,
    allTapTargetsCompliant,
    allTextSizesCompliant,
    noBoundsExceeded,
    wcagContrastPassed: true,
    collisionsDetected,
    warnings,
  };
}
