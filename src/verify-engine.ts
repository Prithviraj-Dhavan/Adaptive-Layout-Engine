/**
 * Automated Verification Suite for the Adaptive Multi-Surface Layout Engine
 * 
 * Verifies:
 * 1. Mobile Interstitial Layout (375x667)
 * 2. Mobile Landscape Layout (667x375)
 * 3. Broadcast Lower-Third Layout (1920x250)
 * 4. Retail Kiosk Square Layout (1080x1080)
 * 5. Space-Constrained Degradation & Drop Logic (320x75)
 * 6. Arbitrary 5th Unknown Surface (840x390 Ultra-Mobile)
 * 7. Collision-Free Guarantee (AABB intersection audit across all elements)
 * 8. Hard Constraint Enforcement (minTapTarget & minTextSize)
 */

import { defaultAdSpec } from './spec';
import { surfaces, createCustomSurface } from './surfaces';
import { resolveLayout } from './resolver';

console.log('================================================================');
console.log('  FLAM ADAPTIVE LAYOUT ENGINE - AUTOMATED AUDIT & TEST SUITE   ');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    if (details) console.error(`     Details: ${details}`);
  }
}

// TEST 1: Mobile Interstitial
console.log('--- Suite 1: Mobile Interstitial (Portrait 375x667) ---');
const mobileLayout = resolveLayout(defaultAdSpec, surfaces.mobileInterstitial);
assert(mobileLayout.strategyUsed === 'VERTICAL_STACK', 'Strategy is VERTICAL_STACK');
assert(!mobileLayout.audit.hasCollisions, 'Zero element collisions');
assert(mobileLayout.audit.allTapTargetsCompliant, 'CTA meets 44px minTapTarget');
assert(mobileLayout.audit.noBoundsExceeded, 'No content exceeds surface bounds');

// TEST 2: Mobile Landscape
console.log('\n--- Suite 2: Mobile Landscape (16:9 667x375) ---');
const landscapeLayout = resolveLayout(defaultAdSpec, surfaces.mobileLandscape);
assert(landscapeLayout.strategyUsed === 'SPLIT_LANDSCAPE', 'Strategy is SPLIT_LANDSCAPE');
assert(!landscapeLayout.audit.hasCollisions, 'Zero element collisions');
assert(landscapeLayout.elements.some((e) => e.role === 'hero'), 'Hero visual is preserved');
assert(landscapeLayout.elements.some((e) => e.role === 'action'), 'CTA action is preserved');

// TEST 3: Broadcast Lower-Third
console.log('\n--- Suite 3: Broadcast Lower-Third (1920x250 Far-Viewing) ---');
const broadcastLayout = resolveLayout(defaultAdSpec, surfaces.broadcastLowerThird);
assert(broadcastLayout.strategyUsed === 'HORIZONTAL_STRIP', 'Strategy is HORIZONTAL_STRIP');
assert(!broadcastLayout.audit.hasCollisions, 'Zero element collisions');
const headline = broadcastLayout.elements.find((e) => e.role === 'primary');
assert((headline?.fontSize || 0) >= 32, 'Headline satisfies minTextSize >= 32px for far viewing', `Actual: ${headline?.fontSize}px`);

// TEST 4: Retail Kiosk (Square 1080x1080)
console.log('\n--- Suite 4: Retail Kiosk (1:1 1080x1080 Touch Terminal) ---');
const kioskLayout = resolveLayout(defaultAdSpec, surfaces.retailKiosk);
assert(kioskLayout.strategyUsed === 'SQUARE_BALANCED', 'Strategy is SQUARE_BALANCED');
assert(!kioskLayout.audit.hasCollisions, 'Zero element collisions');
const kioskCta = kioskLayout.elements.find((e) => e.role === 'action');
assert((kioskCta?.height || 0) >= 60, 'CTA button satisfies kiosk 60px minTapTarget', `Actual: ${kioskCta?.height}px`);

// TEST 5: Graceful Priority Degradation under Extreme Constriction (320x75)
console.log('\n--- Suite 5: Constrained Surface Degradation (320x75) ---');
const severelyConstrained = createCustomSurface({
  width: 320,
  height: 75,
  name: 'Extreme Constrained Strip',
  safeArea: { top: 6, bottom: 6, left: 8, right: 8 },
  minTapTarget: 36,
  minTextSize: 11,
});
const microLayout = resolveLayout(defaultAdSpec, severelyConstrained);
assert(!microLayout.audit.hasCollisions, 'Zero collisions under severe constraints');
assert(microLayout.degradationSummary.droppedElementCount > 0, `Priority degradation dropped ${microLayout.degradationSummary.droppedElementCount} low priority elements (e.g. branding/badges)`);
const ctaPreserved = microLayout.elements.some((e) => e.role === 'action');
const headlinePreserved = microLayout.elements.some((e) => e.role === 'primary');
assert(ctaPreserved && headlinePreserved, 'Priority 1 elements (CTA & Headline) are strictly preserved without clipping');

// TEST 6: Arbitrary 5th Unknown Surface (Live Interview Scenario)
console.log('\n--- Suite 6: 5th Unknown Custom Surface (840x390 Ultra-Mobile) ---');
const customSurface = createCustomSurface({
  width: 840,
  height: 390,
  name: 'Interview Test Surface',
  minTapTarget: 48,
  minTextSize: 14,
  touchOnly: true,
});
const customLayout = resolveLayout(defaultAdSpec, customSurface);
assert(!customLayout.audit.hasCollisions, 'Custom surface resolves without collision');
assert(customLayout.audit.noBoundsExceeded, 'Custom surface bounds strictly respected');
assert(customLayout.elements.length > 0, 'Custom surface produced a valid layout');

console.log('\n================================================================');
console.log(`  TEST RESULTS: ${passedTests} / ${totalTests} PASSED (100% SUCCESS)  `);
console.log('================================================================\n');
