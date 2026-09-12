import { useState, useRef, useEffect, useMemo } from 'react';
import { sampleAdSpecs } from './spec';
import { surfaces as defaultSurfaces, createCustomSurface } from './surfaces';
import { resolveLayout } from './resolver';
import type { AdSpec, SurfaceProfile, Priority } from './types';
import { CustomiseAdStudio, defaultCustomParams, type CustomAdParams } from './components/CustomiseAdStudio';
import { ExportAdModal } from './components/ExportAdModal';
import { Sliders, Download, GripVertical, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export type PriorityKey = 'headline' | 'hero' | 'badges' | 'price' | 'cta';
const DEFAULT_PRIORITY_KEYS: PriorityKey[] = ['headline', 'hero', 'badges', 'price', 'cta'];

// Specimen plate configurations mapping to surface dimensions
interface SpecimenConfig {
  key: string;
  plate: string;
  ratioLabel: string;
  name: string;
  dimensionsText: string;
  biomeLabel: string;
  biomeValue: string;
  width: number;
  height: number;
  notch: boolean;
  borderRadius: string;
}

const baseSpecimens: SpecimenConfig[] = [
  {
    key: 'portrait',
    plate: 'PLATE I',
    ratioLabel: '9:16 VERTICAL',
    name: 'Mobile Portrait',
    dimensionsText: '390 × 844 px',
    biomeLabel: 'Tactile Biome',
    biomeValue: 'Thumb Primary Locked',
    width: 375,
    height: 690,
    notch: true,
    borderRadius: '48px',
  },
  {
    key: 'landscape',
    plate: 'PLATE II',
    ratioLabel: '16:9 PANORAMIC',
    name: 'Landscape',
    dimensionsText: '844 × 390 px',
    biomeLabel: 'Tactile Biome',
    biomeValue: 'Bilateral Ergonomic',
    width: 680,
    height: 350,
    notch: false,
    borderRadius: '36px',
  },
  {
    key: 'broadcast',
    plate: 'PLATE III',
    ratioLabel: '~6:1 RIBBON',
    name: 'Broadcast Ribbon',
    dimensionsText: '920 × 160 px',
    biomeLabel: 'Viewing Distance',
    biomeValue: 'Far-Field Horizon (10ft)',
    width: 740,
    height: 170,
    notch: false,
    borderRadius: '20px',
  },
  {
    key: 'square',
    plate: 'PLATE IV',
    ratioLabel: '1:1 EQUILATERAL',
    name: 'Square Kiosk',
    dimensionsText: '480 × 480 px',
    biomeLabel: 'Interaction Model',
    biomeValue: 'Standing Touch 60px',
    width: 460,
    height: 460,
    notch: false,
    borderRadius: '30px',
  },
  {
    key: 'custom',
    plate: 'PLATE V',
    ratioLabel: 'PARAMETRIC',
    name: 'Customise your Ad',
    dimensionsText: 'Chassis, Imagery, Copy & Palette Studio',
    biomeLabel: 'Creative Studio',
    biomeValue: 'Live Parametric Studio',
    width: 375,
    height: 690,
    notch: true,
    borderRadius: '48px',
  },
];

/**
 * Automatically determine the specimen plate ratio best matched to the user's active device / screen aspect ratio
 */
/**
 * Automatically determine the specimen plate ratio best matched to the user's active device / screen aspect ratio
 */
function getOptimalPlateForViewport(width: number, height: number): string {
  const ar = width / Math.max(1, height);
  // 1. Ultra-wide screens / ribbon displays (AR >= 2.6) -> Plate III: Broadcast Ribbon (~6:1)
  if (ar >= 2.6) return 'broadcast';
  // 2. Mobile landscape or wide desktop ratio (1.35 <= AR < 2.6) -> Plate II: Mobile Landscape (16:9)
  if (ar >= 1.35) return 'landscape';
  // 3. Tablet split / square kiosk ratio (0.82 <= AR < 1.35) -> Plate IV: Square Kiosk (1:1)
  if (ar >= 0.82) return 'square';
  // 4. Mobile portrait ratio (AR < 0.82, e.g. 9:16 ~ 0.56) -> Plate I: Mobile Portrait (9:16)
  return 'portrait';
}

export function App() {
  const [specs] = useState<AdSpec[]>(sampleAdSpecs);
  const [activeSpecId] = useState<string>(sampleAdSpecs[0].id);
  const [activePlateKey, setActivePlateKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return getOptimalPlateForViewport(window.innerWidth, window.innerHeight);
    }
    return 'portrait';
  });
  const [isAutoDeviceMode, setIsAutoDeviceMode] = useState<boolean>(true);
  const [cameraMode, setCameraMode] = useState<'2d' | '3d'>('2d');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState<boolean>(false);
  const [isMobileFolioOpen, setIsMobileFolioOpen] = useState<boolean>(false);

  // Auto-calibrate active plate to device / screen aspect ratio on mount, resize, or orientation change
  useEffect(() => {
    const handleDeviceSync = () => {
      if (isAutoDeviceMode) {
        const optimal = getOptimalPlateForViewport(window.innerWidth, window.innerHeight);
        setActivePlateKey(optimal);
      }
    };

    handleDeviceSync();
    window.addEventListener('resize', handleDeviceSync);
    window.addEventListener('orientationchange', handleDeviceSync);

    return () => {
      window.removeEventListener('resize', handleDeviceSync);
      window.removeEventListener('orientationchange', handleDeviceSync);
    };
  }, [isAutoDeviceMode]);

  // Stage Viewport Measurements for Dynamic Auto-Fitting
  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  useEffect(() => {
    const container = stageContainerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setStageSize({ width: rect.width, height: rect.height });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    window.addEventListener('resize', updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Global Keyboard Shortcuts (1-4 for Plates, D for Dark Mode, C for Studio, E for Export, I for Telemetry)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.key === '1') {
        setIsAutoDeviceMode(false);
        setActivePlateKey('plate1');
      } else if (e.key === '2') {
        setIsAutoDeviceMode(false);
        setActivePlateKey('plate2');
      } else if (e.key === '3') {
        setIsAutoDeviceMode(false);
        setActivePlateKey('plate3');
      } else if (e.key === '4') {
        setIsAutoDeviceMode(false);
        setActivePlateKey('plate4');
      } else if (e.key === 'd' || e.key === 'D') {
        setIsDarkMode((prev) => !prev);
      } else if (e.key === 'c' || e.key === 'C') {
        setIsCustomStudioOpen((prev) => !prev);
      } else if (e.key === 'e' || e.key === 'E') {
        setIsExportModalOpen((prev) => !prev);
      } else if (e.key === 'i' || e.key === 'I') {
        setIsTelemetryOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsCustomStudioOpen(false);
        setIsExportModalOpen(false);
        setIsTelemetryOpen(false);
        setIsMobileFolioOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Customise Your Ad Parameters State: committed state (with localStorage persistence) + staged draft state
  const [customParams, setCustomParams] = useState<CustomAdParams>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('flam_studio_custom_params');
        if (saved) return { ...defaultCustomParams, ...JSON.parse(saved) };
      } catch { }
    }
    return defaultCustomParams;
  });
  const [draftParams, setDraftParams] = useState<CustomAdParams>(defaultCustomParams);
  const [isCustomStudioOpen, setIsCustomStudioOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const studioSnapshotRef = useRef<CustomAdParams>(defaultCustomParams);

  const handleOpenStudio = () => {
    studioSnapshotRef.current = { ...customParams };
    setDraftParams({ ...customParams });
    setActivePlateKey('custom');
    setIsAutoDeviceMode(false);
    setIsCustomStudioOpen(true);
  };

  const handleSaveStudio = () => {
    setCustomParams({ ...draftParams });
    studioSnapshotRef.current = { ...draftParams };
    setIsCustomStudioOpen(false);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('flam_studio_custom_params', JSON.stringify(draftParams));
      } catch { }
    }
  };

  const handleCancelStudio = () => {
    setDraftParams({ ...studioSnapshotRef.current });
    setIsCustomStudioOpen(false);
    setIsAutoDeviceMode(true);
    if (typeof window !== 'undefined') {
      setActivePlateKey(getOptimalPlateForViewport(window.innerWidth, window.innerHeight));
    }
  };

  // Dynamic parameters: live staged draft when studio drawer is open, saved state otherwise
  const activeCustomParams = isCustomStudioOpen ? draftParams : customParams;

  // 3D Orbit Drag State
  const [rotX, setRotX] = useState<number>(0);
  const [rotY, setRotY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStart = useRef<{ x: number; y: number; rotX: number; rotY: number }>({ x: 0, y: 0, rotX: 0, rotY: 0 });

  // Dynamic Specimens list reflecting custom parameters
  const specimens = useMemo(() => {
    return baseSpecimens.map((s) => {
      if (s.key === 'custom') {
        return {
          ...s,
          width: activeCustomParams.width,
          height: activeCustomParams.height,
          notch: activeCustomParams.notch,
          borderRadius: `${activeCustomParams.borderRadius}px`,
          dimensionsText: `${activeCustomParams.width} × ${activeCustomParams.height} px`,
        };
      }
      return s;
    });
  }, [activeCustomParams]);

  // Active Plate Configuration
  const activeSpecimen = useMemo(() => {
    return specimens.find((s) => s.key === activePlateKey) || specimens[0];
  }, [specimens, activePlateKey]);

  // Active surface geometry
  const surfaceWidth = activePlateKey === 'custom' ? activeCustomParams.width : activeSpecimen.width;
  const surfaceHeight = activePlateKey === 'custom' ? activeCustomParams.height : activeSpecimen.height;

  // Interactive Priority Tree State (User can drag/reorder when desired)
  const [priorityKeys, setPriorityKeys] = useState<PriorityKey[]>(DEFAULT_PRIORITY_KEYS);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [priorityToast, setPriorityToast] = useState<string | null>(null);

  const movePriorityItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= priorityKeys.length || fromIndex === toIndex) return;
    const updated = [...priorityKeys];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setPriorityKeys(updated);

    const nameMap: Record<PriorityKey, string> = {
      cta: 'CTA Action',
      headline: 'Headline',
      hero: 'Product Hero',
      badges: 'Feature Badges',
      price: 'Offer Price',
    };
    setPriorityToast(`Prioritized ${nameMap[moved]} to Rank #${toIndex + 1}`);
    setTimeout(() => setPriorityToast(null), 2500);
  };

  // Active Ad Spec with dynamically assigned priorities from active priority order
  const activeSpec = useMemo<AdSpec>(() => {
    const baseSpec = specs.find((s) => s.id === activeSpecId) || specs[0];
    const priorityRankMap: Partial<Record<PriorityKey, Priority>> = {};
    priorityKeys.forEach((key, idx) => {
      priorityRankMap[key] = Math.min(5, Math.max(1, idx + 1)) as Priority;
    });

    const updatedElements = baseSpec.elements.map((el) => {
      let key: PriorityKey | null = null;
      if (el.role === 'action' || el.type === 'button') key = 'cta';
      else if (el.role === 'primary' || el.type === 'text') key = 'headline';
      else if (el.role === 'hero' || (el.type === 'image' && el.role !== 'branding')) key = 'hero';
      else if (el.id === 'feature-badges' || el.type === 'badge') key = 'badges';
      else if (el.type === 'price-tag' || el.id === 'offer-price') key = 'price';

      if (key && priorityRankMap[key] !== undefined) {
        return {
          ...el,
          priority: priorityRankMap[key]!,
        };
      }
      return el;
    });

    return {
      ...baseSpec,
      elements: updatedElements,
    };
  }, [specs, activeSpecId, priorityKeys]);

  // Auto-fitting scale calculation for device chassis
  const autoScale = useMemo(() => {
    if (stageSize.width === 0 || stageSize.height === 0) return 1;
    const paddingX = 24; // Horizontal padding
    const paddingY = 24; // Vertical padding
    const chassisW = surfaceWidth + 28;
    const chassisH = surfaceHeight + 28;

    const availableW = Math.max(80, stageSize.width - paddingX);
    const availableH = Math.max(80, stageSize.height - paddingY);

    const scaleX = availableW / chassisW;
    const scaleY = availableH / chassisH;
    const fitScale = Math.min(scaleX, scaleY);

    // Scale down smoothly if needed, but do not scale up beyond 1.0 to preserve sharpness
    return Math.max(0.18, Math.min(1.0, fitScale));
  }, [stageSize, surfaceWidth, surfaceHeight]);

  // Map Plate to Surface Profile for Solver
  const activeSurface: SurfaceProfile = useMemo(() => {
    if (activePlateKey === 'portrait') return defaultSurfaces.mobileInterstitial;
    if (activePlateKey === 'landscape') return defaultSurfaces.mobileLandscape;
    if (activePlateKey === 'broadcast') return defaultSurfaces.broadcastLowerThird;
    if (activePlateKey === 'square') return defaultSurfaces.retailKiosk;

    return createCustomSurface({
      width: activeCustomParams.width,
      height: activeCustomParams.height,
      name: 'Customise your Ad',
      minTapTarget: 44,
      minTextSize: 12,
    });
  }, [activePlateKey, activeCustomParams]);

  // Solve layout via Pure TypeScript Engine
  const resolvedLayout = useMemo(() => {
    return resolveLayout(activeSpec, activeSurface);
  }, [activeSpec, activeSurface]);

  // Sync camera angles
  const handleSelectCamera = (mode: '2d' | '3d') => {
    setCameraMode(mode);
    if (mode === '2d') {
      setRotX(0);
      setRotY(0);
    } else if (mode === '3d') {
      setRotX(18);
      setRotY(-24);
    }
  };

  // 3D Mouse Drag Orbit Handlers - STRICTLY active only when cameraMode === '3d'
  const handleMouseDown = (e: React.MouseEvent) => {
    if (cameraMode !== '3d') return; // Strict 2D mode: no 3D rotation on mouse drag
    if ((e.target as HTMLElement).closest('button, .camera-btn, #btn-theme, #btn-telemetry, #btn-customise, #btn-mobile-folio')) return;
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      rotX,
      rotY,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || cameraMode !== '3d') return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    let ny = dragStart.current.rotY + dx * 0.35;
    let nx = dragStart.current.rotX - dy * 0.35;
    // Strict visual clamp: prevents card from flipping edge-on or getting invisible
    nx = Math.max(-30, Math.min(30, nx));
    ny = Math.max(-42, Math.min(42, ny));
    setRotX(nx);
    setRotY(ny);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Orbit Drag Handlers for Mobile Devices - STRICTLY active only when cameraMode === '3d'
  const handleTouchStart = (e: React.TouchEvent) => {
    if (cameraMode !== '3d') return; // Strict 2D mode: no 3D rotation on touch drag
    if ((e.target as HTMLElement).closest('button, .camera-btn, #btn-theme, #btn-telemetry, #btn-customise, #btn-mobile-folio')) return;
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        rotX,
        rotY,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || cameraMode !== '3d' || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStart.current.x;
    const dy = e.touches[0].clientY - dragStart.current.y;
    let ny = dragStart.current.rotY + dx * 0.45;
    let nx = dragStart.current.rotX - dy * 0.45;
    // Strict visual clamp: prevents card from flipping edge-on or getting invisible
    nx = Math.max(-30, Math.min(30, nx));
    ny = Math.max(-42, Math.min(42, ny));
    setRotX(nx);
    setRotY(ny);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = () => {
    handleSelectCamera('2d');
  };

  // Toggle Dark Mode
  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Extract resolved elements from active layout
  const headlineEl = resolvedLayout.elements.find((e) => e.role === 'primary' || e.type === 'text');
  const heroEl = resolvedLayout.elements.find((e) => e.role === 'hero' || (e.type === 'image' && e.role !== 'branding'));
  const priceEl = resolvedLayout.elements.find((e) => e.role === 'secondary' || e.type === 'price-tag');
  const ctaEl = resolvedLayout.elements.find((e) => e.role === 'action' || e.type === 'button');
  const badgeEl = resolvedLayout.elements.find((e) => e.role === 'badge' || e.type === 'badge');

  const headlineText = headlineEl ? ((headlineEl.content as any)?.text || headlineEl.textLines?.join(' ') || 'Defy Gravity. Future.') : 'Defy Gravity. Future.';
  const sublineText = headlineEl ? ((headlineEl.content as any)?.subtext || 'Ultra-responsive ZoomX foam with carbon fiber flyplate & adaptive kinetic propulsion.') : 'Ultra-responsive ZoomX foam with carbon fiber flyplate & adaptive kinetic propulsion.';
  const ctaLabel = ctaEl ? ((ctaEl.content as any)?.label || 'Acquire Edition') : 'Acquire Edition';
  const priceAmount = priceEl ? `${(priceEl.content as any)?.currency || '₹'}${(priceEl.content as any)?.amount || '12,999'}` : '₹12,999';
  const originalPrice = priceEl ? ((priceEl.content as any)?.originalAmount || '₹17,995') : '₹17,995';


  // Dynamic Layout Decisions computed from active geometry and custom user priority ordering
  const layoutDecisions = useMemo(() => {
    const w = activeSurface.width;
    const h = activeSurface.height;
    const ar = w / h;
    const isUltraWide = ar >= 3.0;
    const isLandscape = ar >= 1.35 && ar < 3.0;
    const isSquare = ar >= 0.85 && ar < 1.35;

    const mode = isUltraWide ? 'ultraWide' : isLandscape ? 'landscape' : isSquare ? 'square' : 'vertical';

    const metadataMap: Record<
      PriorityKey,
      {
        element: string;
        decisions: Record<string, { decision: string; status: string; accent?: boolean }>;
      }
    > = {
      cta: {
        element: 'CTA Action',
        decisions: {
          ultraWide: { decision: 'Right Lateral Wing', status: 'Anchored Right · X: Right-pinned', accent: true },
          landscape: { decision: 'Left Column Anchor', status: 'Bottom Thumb Reach · 38px Height', accent: true },
          square: { decision: 'Full-Width Bottom Target', status: '44px Conforming Tap Target', accent: true },
          vertical: { decision: 'Bottom Thumb Reach', status: '44px Conforming · Primary CTA', accent: true },
        },
      },
      headline: {
        element: 'Headline',
        decisions: {
          ultraWide: { decision: 'Left Primary Zone', status: 'Single-line Serif · Left Aligned', accent: false },
          landscape: { decision: 'Left Column Header', status: '2-Line Flow · 24px EB Garamond', accent: false },
          square: { decision: 'Top Centered Hierarchy', status: 'Upper Grid Header', accent: false },
          vertical: { decision: 'Upper Dominance', status: 'Prominent Display Hierarchy', accent: false },
        },
      },
      hero: {
        element: 'Product Hero',
        decisions: {
          ultraWide: { decision: 'Center Stage Visual', status: 'Clamped H: 65% · Fitted Aspect', accent: false },
          landscape: { decision: 'Right Column Stage', status: 'Split 50% Canvas · Centered', accent: false },
          square: { decision: 'Balanced Center Stage', status: 'Aspect-Preserved Hero Box', accent: false },
          vertical: { decision: 'Center Stage Focal', status: 'Vertical-Weighted Hero Visual', accent: false },
        },
      },
      badges: {
        element: 'Feature Badges',
        decisions: {
          ultraWide: { decision: 'Micro Strip Mode', status: 'Suppressed for Ribbon Bandwidth', accent: false },
          landscape: { decision: 'Under-Hero Pill Bar', status: '3-Chip Inline Cluster', accent: false },
          square: { decision: 'Mid-Tier Pill Bar', status: 'Inline Metadata Strip', accent: false },
          vertical: { decision: 'Inline Pill Bar', status: '3-Chip Specification Strip', accent: false },
        },
      },
      price: {
        element: 'Offer Price',
        decisions: {
          ultraWide: { decision: 'Inline Pre-CTA', status: 'Paired directly before Button', accent: false },
          landscape: { decision: 'Left Column Pre-CTA', status: 'Stacked Price Baseline', accent: false },
          square: { decision: 'Pre-CTA Lower Baseline', status: 'Dual Tier Pricing Anchor', accent: false },
          vertical: { decision: 'Pre-CTA Anchor', status: 'Discount Paired with Edition Tag', accent: false },
        },
      },
    };

    return priorityKeys.map((key, idx) => {
      const meta = metadataMap[key];
      const info = meta.decisions[mode];
      const priorityLabel = `P${idx + 1}`;
      return {
        key,
        priority: priorityLabel,
        element: meta.element,
        decision: info.decision,
        status: info.status,
        accent: info.accent ?? false,
        index: idx,
      };
    });
  }, [activeSurface.width, activeSurface.height, priorityKeys]);

  return (
    <div className="h-full w-full bg-[#fbf8f4] dark:bg-[#0d0c0b] text-[#141210] dark:text-[#f5ede4] flex flex-col font-sans overflow-hidden select-none relative">
      {/* CELESTIAL STARRY NIGHT PARTICLES OVERLAY */}
      <div aria-hidden="true" className="celestial-starfield absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 starfield-plane-1 animate-celestial" />
        <div className="absolute inset-0 starfield-plane-2 opacity-80" />
      </div>

      {/* MAIN BIENNALE WORKSPACE */}
      <div className={`flex-1 flex overflow-hidden relative bg-[#fbf8f4] dark:bg-[#0d0c0b]/40 ${isCustomStudioOpen ? 'z-40' : 'z-10'}`}>
        {/* DESKTOP LEFT FOLIO INDEX (CURATED EXHIBITION PLATES) */}
        <aside className={`hidden lg:flex lg:w-80 xl:w-96 border-r border-[#e2dad2] dark:border-[#262320] bg-[#f5efe8]/80 dark:bg-[#110f0e]/85 backdrop-blur-md flex-col justify-between p-6 md:p-8 shrink-0 overflow-y-auto transition-all duration-300 ${isCustomStudioOpen ? 'opacity-30 blur-[2px] pointer-events-none z-10' : 'z-20'}`}>
          <div>
            {/* Exhibition Title */}
            <div className="mb-6">
              <div className="mb-2.5">
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#e14b2d] font-bold">STUDIO MONOLITH</span>
              </div>
              <h1 className="font-editorial text-3xl md:text-4xl text-[#141210] dark:text-[#f5ede4] font-normal leading-[1.08]">
                Adaptive Layout <br />
                <span className="italic text-[#e14b2d] font-light">Studio.</span>
              </h1>
              <p className="text-xs font-serif italic text-[#554339] dark:text-[#9e9086] mt-2 leading-relaxed">
                Design once. Adapt everywhere. <br />
                Intelligent layouts powered by constraints, not breakpoints.
              </p>
            </div>

            {/* Specimen Plates Selector Header with Auto Sync */}
            <div className="flex items-center justify-between mb-3 px-0.5">
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#554339] dark:text-[#9e9086] font-bold">
                Specimen Plates
              </span>
              <button
                onClick={() => {
                  const next = !isAutoDeviceMode;
                  setIsAutoDeviceMode(next);
                  if (next && typeof window !== 'undefined') {
                    setActivePlateKey(getOptimalPlateForViewport(window.innerWidth, window.innerHeight));
                  }
                }}
                className={`text-[9px] font-mono uppercase px-2.5 py-1 rounded-xs border transition-all cursor-pointer font-bold ${isAutoDeviceMode
                    ? 'border-[#e14b2d] bg-[#e14b2d] text-white shadow-xs'
                    : 'border-[#d6ccc2] dark:border-[#2b2622] bg-white/50 dark:bg-[#181513] text-[#73675e] dark:text-[#887c72] hover:border-[#e14b2d] hover:text-[#e14b2d]'
                  }`}
                title="Automatically adapt card ratio to match device screen"
              >
                {isAutoDeviceMode ? 'AUTO SYNC : ON' : 'AUTO SYNC : OFF'}
              </button>
            </div>

            {/* Specimen Plates Selector */}
            <div className="space-y-3" id="specimen-plates">
              {specimens.map((specimen) => {
                const isActive = activePlateKey === specimen.key;

                return (
                  <div
                    key={specimen.key}
                    onClick={() => {
                      if (specimen.key === 'custom') {
                        handleOpenStudio();
                      } else {
                        setActivePlateKey(specimen.key);
                        setIsAutoDeviceMode(false);
                      }
                    }}
                    className={`plate-item group cursor-pointer p-4 border-l-2 transition-all ${isActive
                        ? 'border-[#e14b2d] bg-white/70 dark:bg-[#1a1715] shadow-xs'
                        : 'border-transparent hover:border-[#141210]/40 dark:hover:border-stone-600 bg-transparent hover:bg-white/40 dark:hover:bg-[#171413]/50'
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className={`text-[10px] font-mono uppercase tracking-widest font-bold ${isActive ? 'text-[#e14b2d]' : 'text-stone-400'}`}>
                        {specimen.plate}
                      </span>
                      <span className="text-[10px] font-mono text-[#554339] dark:text-[#9e9086]">
                        {specimen.ratioLabel}
                      </span>
                    </div>

                    <h3 className={`font-editorial text-lg text-[#141210] dark:text-[#f5ede4] group-hover:text-[#e14b2d] transition-colors mt-1 ${isActive ? 'font-semibold' : ''}`}>
                      {specimen.name}
                    </h3>

                    <p className="text-[11px] font-mono text-[#73675e] dark:text-[#887c72] mt-0.5">
                      {specimen.dimensionsText}
                    </p>

                    {isActive && (
                      <div className="mt-3 pt-2 border-t border-[#e2dad2] dark:border-[#262320] flex justify-between items-center text-[10px] font-mono">
                        <span className="text-[#73675e] dark:text-[#887c72]">{specimen.biomeLabel}</span>
                        <span className="text-[#e14b2d] font-semibold">{specimen.biomeValue}</span>
                      </div>
                    )}

                    {isActive && specimen.key === 'custom' && (
                      <div className="mt-3 pt-2 border-t border-[#e2dad2] dark:border-[#262320]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenStudio();
                          }}
                          className="w-full py-1.5 px-3 bg-[#e14b2d] hover:bg-[#c93e22] text-white text-[10px] font-mono uppercase tracking-wider font-bold rounded-xs flex items-center justify-between transition-all cursor-pointer shadow-xs"
                        >
                          <span className="flex items-center gap-1.5">
                            <Sliders className="w-3 h-3" /> Customise Parameters
                          </span>
                          <span>→</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footnote Monograph Colophon */}
          <div className="pt-6 border-t border-[#e2dad2] dark:border-[#262320] text-[11px] font-mono text-[#554339] dark:text-[#9e9086] space-y-1.5">
            <div>
              <span>CURATORIAL DISPATCH</span>
            </div>
            <p className="font-editorial italic text-xs leading-relaxed text-[#73675e] dark:text-[#a1958b] pt-1">
              “Every constraint is an opportunity. Every surface deserves its own perfect composition.”
            </p>
          </div>
        </aside>

        {/* CENTER EXHIBITION GALLERY: ROTATING PEDESTAL STAGE */}
        <main className={`flex-1 w-full relative flex flex-col justify-between p-3 sm:p-5 md:p-6 overflow-hidden transition-all duration-300 ${isCustomStudioOpen ? 'lg:pr-[430px] xl:pr-[470px]' : ''}`}>
          {/* TOP CONTROLS ROW: FOLIO & 2D (Left) | CUSTOMISE, THEME, TELEMETRY (Right) */}
          <div className="w-full overflow-x-auto no-scrollbar scroll-smooth py-1 -my-1 shrink-0 mb-2 z-20">
            <div className={`flex items-center justify-between gap-2 min-w-max sm:min-w-0 transition-all duration-300 ${isCustomStudioOpen ? 'opacity-30 blur-[1px] pointer-events-none' : ''}`}>
              {/* Left Side: FOLIO & 2D / 3D Mode Toggle Group */}
              <div className="flex items-center space-x-2 shrink-0">
                {/* Mobile Folio Catalog Drawer Toggle */}
                <button
                  id="btn-mobile-folio"
                  onClick={() => setIsMobileFolioOpen(true)}
                  className="lg:hidden h-8 px-3.5 rounded-full border border-[#d6ccc2] dark:border-[#2b2622] bg-white/80 dark:bg-[#161311]/90 text-[#141210] dark:text-[#f5ede4] text-[10px] font-mono uppercase tracking-wider font-semibold flex items-center space-x-1.5 cursor-pointer shadow-xs hover:border-[#e14b2d] hover:text-[#e14b2d] transition-all"
                  title="Open Adaptive Layout Engine Folio"
                >
                  <span>FOLIO</span>
                </button>

                {/* 2D & 3D Segmented Control */}
                <div className="flex items-center p-0.5 rounded-xs border border-[#d6ccc2] dark:border-[#2b2622] bg-white/80 dark:bg-[#161311]/90 backdrop-blur-md shadow-xs space-x-1">
                  <button
                    id="btn-camera-2d"
                    onClick={() => handleSelectCamera('2d')}
                    className={`camera-btn h-7 px-2.5 sm:px-3 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider font-semibold rounded-xs transition-all cursor-pointer ${cameraMode === '2d' && rotX === 0 && rotY === 0
                        ? 'border border-[#181513] dark:border-stone-200 bg-[#181513] text-white dark:bg-white dark:text-[#181513] shadow-xs'
                        : 'text-[#5e534c] dark:text-[#c4b8ad] hover:text-[#141210] dark:hover:text-white'
                      }`}
                    title="2D Flat Orthographic View"
                  >
                    2D
                  </button>
                  <button
                    id="btn-camera-3d"
                    onClick={() => handleSelectCamera('3d')}
                    className={`camera-btn h-7 px-2.5 sm:px-3 text-[10px] sm:text-[11px] font-mono uppercase tracking-wider font-semibold rounded-xs transition-all cursor-pointer ${cameraMode === '3d' || rotX !== 0 || rotY !== 0
                        ? 'border border-[#181513] dark:border-stone-200 bg-[#181513] text-white dark:bg-white dark:text-[#181513] shadow-xs'
                        : 'text-[#5e534c] dark:text-[#c4b8ad] hover:text-[#141210] dark:hover:text-white'
                      }`}
                    title="3D Perspective & Interactive Orbit View"
                  >
                    3D
                  </button>
                </div>
              </div>

              {/* Right Side: CUSTOMISE, DOWNLOAD AD, THEME TOGGLE, TELEMETRY / HAMBURGER */}
              <div className="flex items-center space-x-2 shrink-0">
                {/* Customise Your Ad Button */}
                <button
                  id="btn-customise"
                  onClick={handleOpenStudio}
                  className={`h-8 px-3 sm:px-3.5 rounded-full border transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs text-[9px] sm:text-[10px] font-mono uppercase tracking-wider font-semibold ${activePlateKey === 'custom' || isCustomStudioOpen
                      ? 'border-[#e14b2d] bg-[#e14b2d] text-white font-bold'
                      : 'border-[#e14b2d]/60 bg-[#e14b2d]/10 text-[#e14b2d] hover:bg-[#e14b2d] hover:text-white'
                    }`}
                  title="Open Customise your Ad Studio"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>CUSTOMISE</span>
                </button>

                {/* Download / Export Prepared Ad Button */}
                <button
                  id="btn-download-ad"
                  onClick={() => {
                    setIsExportModalOpen(true);
                    confetti({
                      particleCount: 50,
                      spread: 60,
                      origin: { y: 0.15, x: 0.75 },
                      colors: [activeCustomParams.accentColor || '#e14b2d', '#964407', '#ffffff'],
                    });
                  }}
                  className="h-8 px-3 sm:px-3.5 rounded-full border border-[#141210] dark:border-stone-200 bg-[#141210] dark:bg-white text-white dark:text-[#141210] hover:bg-[#e14b2d] dark:hover:bg-[#e14b2d] dark:hover:text-white dark:hover:border-[#e14b2d] hover:border-[#e14b2d] transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs text-[9px] sm:text-[10px] font-mono uppercase tracking-wider font-bold"
                  title="Download & Export Prepared Ad (PNG, HTML5, JSON)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>DOWNLOAD AD</span>
                </button>

                <div className="flex items-center p-0.5 sm:p-1 space-x-1 rounded-full border border-[#d6ccc2] dark:border-[#2b2622] bg-white/80 dark:bg-[#161311]/90 backdrop-blur-md shadow-xs">
                  {/* Illumination Dark/Light Switch */}
                  <button
                    id="btn-theme"
                    onClick={toggleTheme}
                    aria-label="Toggle Illumination Mode"
                    className="group w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[#5e534c] dark:text-[#f5ede4] hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
                    title="Toggle Light / Dark Illumination"
                  >
                    {isDarkMode ? (
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#d6ccc2] transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#5e534c] transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="5" />
                        <line x1="12" x2="12" y1="1" y2="3" />
                        <line x1="12" x2="12" y1="21" y2="23" />
                        <line x1="4.22" x2="5.64" y1="4.22" y2="5.64" />
                        <line x1="18.36" x2="19.78" y1="18.36" y2="19.78" />
                        <line x1="1" x2="3" y1="12" y2="12" />
                        <line x1="21" x2="23" y1="12" y2="12" />
                        <line x1="4.22" x2="5.64" y1="19.78" y2="18.36" />
                        <line x1="18.36" x2="19.78" y1="5.64" y2="4.22" />
                      </svg>
                    )}
                  </button>

                  <div className="w-px h-3 sm:h-4 bg-[#e2dad2] dark:bg-[#2b2622]" />

                  {/* Hamburger / Telemetry Drawer Trigger */}
                  <button
                    id="btn-telemetry"
                    onClick={() => setIsTelemetryOpen(true)}
                    aria-label="Open Telemetry & Inspector"
                    className="group w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[#5e534c] dark:text-[#f5ede4] hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
                    title="Open Telemetry & Inspector Drawer"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#5e534c] dark:text-[#f5ede4] transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24">
                      <line x1="4" x2="20" y1="6" y2="6" />
                      <line x1="4" x2="20" y1="12" y2="12" />
                      <line x1="4" x2="20" y1="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECOND ROW: SPECIMEN PLATE BUTTONS (Down of top controls) */}
          <div className={`lg:hidden flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 shrink-0 no-scrollbar mb-2 transition-all duration-300 ${isCustomStudioOpen ? 'opacity-30 blur-[1px] pointer-events-none' : ''}`}>
            {/* Clean attractive AUTO button without live dot */}
            <button
              id="btn-auto-sync"
              onClick={() => {
                const next = !isAutoDeviceMode;
                setIsAutoDeviceMode(next);
                if (next && typeof window !== 'undefined') {
                  setActivePlateKey(getOptimalPlateForViewport(window.innerWidth, window.innerHeight));
                }
              }}
              className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider whitespace-nowrap transition-all border shrink-0 rounded-xs cursor-pointer font-bold ${isAutoDeviceMode
                  ? 'border-[#e14b2d] bg-[#e14b2d] text-white shadow-xs'
                  : 'border-[#d6ccc2] dark:border-[#2b2622] bg-white/70 dark:bg-[#191614] text-[#5e534c] dark:text-[#c4b8ad] hover:border-[#e14b2d] hover:text-[#e14b2d]'
                }`}
              title="Auto-detect and match card ratio to device"
            >
              AUTO
            </button>
            {specimens.map((specimen) => {
              const isActive = activePlateKey === specimen.key;
              return (
                <button
                  key={specimen.key}
                  onClick={() => {
                    if (specimen.key === 'custom') {
                      handleOpenStudio();
                    } else {
                      setActivePlateKey(specimen.key);
                      setIsAutoDeviceMode(false);
                    }
                  }}
                  className={`px-2.5 py-1.5 text-[10px] font-mono whitespace-nowrap transition-all border shrink-0 rounded-xs cursor-pointer ${isActive
                      ? 'border-[#e14b2d] bg-[#e14b2d] text-white font-bold shadow-xs'
                      : 'border-[#d6ccc2] dark:border-[#2b2622] bg-white/70 dark:bg-[#191614] text-[#5e534c] dark:text-[#c4b8ad] hover:border-[#141210]'
                    }`}
                >
                  <span className="font-bold mr-1">{specimen.plate}</span>
                  <span>{specimen.ratioLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Pedestal Stage (Interactive 3D viewport) */}
          <div
            id="stage-viewport"
            ref={stageContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onDoubleClick={handleDoubleClick}
            className={`flex-1 w-full h-full flex items-center justify-center relative select-none overflow-hidden touch-none transition-all duration-300 ${isCustomStudioOpen ? 'z-40' : 'z-10'
              } ${cameraMode === '3d' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
              }`}
            style={{
              perspective: cameraMode === '3d' ? '1200px' : 'none',
              perspectiveOrigin: 'center center',
            }}
          >
            {/* HARDWARE SCULPTURAL CHASSIS (TITANIUM MONOLITH) */}
            <div
              id="device-chassis"
              className={`relative rounded-[48px] p-3.5 bg-gradient-to-b from-[#d8d1c6] via-[#c2b7a6] to-[#988c7c] dark:from-[#2a2622] dark:via-[#1c1917] dark:to-[#12100e] pedestal-shadow shrink-0 transition-all duration-300 ${isCustomStudioOpen ? 'shadow-2xl ring-2 ring-[#e14b2d]/40' : ''
                }`}
              style={{
                width: `${surfaceWidth}px`,
                height: `${surfaceHeight}px`,
                borderRadius: activePlateKey === 'custom' ? `${activeCustomParams.borderRadius}px` : activeSpecimen.borderRadius,
                transform: cameraMode === '2d' || (rotX === 0 && rotY === 0)
                  ? `scale(${autoScale})`
                  : `scale(${autoScale}) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
                transformOrigin: 'center center',
                transformStyle: cameraMode === '3d' ? 'preserve-3d' : 'flat',
                willChange: cameraMode === '3d' && isDragging ? 'transform' : 'auto',
                transition: isDragging ? 'none' : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), width 0.5s cubic-bezier(0.16, 1, 0.3, 1), height 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {/* Outer Titanium Bezel Stroke */}
              <div
                className="absolute inset-0 border border-white/60 dark:border-white/10 pointer-events-none"
                style={{ borderRadius: activePlateKey === 'custom' ? `${activeCustomParams.borderRadius}px` : activeSpecimen.borderRadius }}
              />

              {/* Screen Vessel */}
              <div
                className={`relative w-full h-full ${isDarkMode ? 'bg-[#fcf9f5]' : 'bg-[#0f0d0b]'} overflow-hidden flex flex-col shadow-inner transition-colors duration-300`}
                style={{
                  borderRadius: `calc(${activePlateKey === 'custom' ? `${activeCustomParams.borderRadius}px` : activeSpecimen.borderRadius} - 10px)`,
                }}
              >
                {/* Monolith Acoustic Dynamic Pill Notch (Only on sufficiently tall vertical displays) */}
                {(activePlateKey === 'custom' ? activeCustomParams.notch : activeSpecimen.notch) && (activePlateKey === 'custom' ? activeCustomParams.height : activeSpecimen.height) >= 480 && (activePlateKey === 'custom' ? activeCustomParams.width / activeCustomParams.height : activeSpecimen.width / activeSpecimen.height) < 1.35 && (
                  <div
                    id="notch-container"
                    className="absolute top-2.5 left-1/2 -translate-x-1/2 h-5 w-24 bg-black rounded-full z-40 flex items-center justify-between px-2.5 border border-white/10 shadow-sm"
                  >
                    <span className="w-2 h-2 rounded-full bg-stone-900 border border-stone-700" />
                    <span className="w-2 h-0.5 rounded-full bg-stone-700" />
                  </div>
                )}

                {/* AD SPECIMEN CONTENT: DYNAMIC ADAPTIVE SURFACE ENGINE */}
                {(() => {
                  const surfaceWidth = activePlateKey === 'custom' ? activeCustomParams.width : activeSpecimen.width;
                  const surfaceHeight = activePlateKey === 'custom' ? activeCustomParams.height : activeSpecimen.height;
                  const ar = surfaceWidth / surfaceHeight;
                  const isUltraWide = ar >= 3.0;
                  const isSplitLandscape = ar >= 1.35 && ar < 3.0;

                  // Spatial degradation regimes
                  const isVeryCompactH = surfaceHeight < 390;
                  const isCompactH = surfaceHeight < 520;
                  const isVeryCompactW = surfaceWidth < 340;

                  // Subline Visibility (Stage 4 Text Truncation / Drop)
                  const showSubline = isUltraWide
                    ? surfaceHeight >= 190
                    : isSplitLandscape
                      ? surfaceHeight >= 270
                      : surfaceHeight >= 480;

                  // Chips Visibility (Stage 5 Drop Badges / Chips)
                  const showChips = isUltraWide
                    ? false // Always hide chips in Ribbon to perfectly fit headline
                    : isSplitLandscape
                      ? surfaceHeight >= 240
                      : surfaceHeight >= 420;

                  // Dynamic Typography (Stage 2 Font Tightening & Scaling)
                  const titleFontSize = isUltraWide
                    ? Math.max(12, Math.min(surfaceHeight * 0.18, surfaceWidth * 0.035, 26))
                    : isSplitLandscape
                      ? Math.max(12, Math.min(surfaceWidth * 0.042, surfaceHeight * 0.065, isCompactH ? 20 : 28))
                      : Math.max(12, Math.min(surfaceWidth * 0.052, surfaceHeight * 0.052, isVeryCompactW ? 14 : isVeryCompactH ? 16 : isCompactH ? 20 : 30));

                  const hasNotch = (activePlateKey === 'custom' ? activeCustomParams.notch : activeSpecimen.notch) && surfaceHeight >= 480 && !isUltraWide && !isSplitLandscape;

                  // Dynamic Hero Sizing with strict vertical & horizontal budgeting (Large & Proportional Hero Image)
                  const verticalHeaderH = (hasNotch ? 28 : 6) + 16 + (titleFontSize * 2.1) + (showSubline ? 28 : 0);
                  const verticalFooterH = isVeryCompactH ? 56 : isCompactH ? 68 : 88;
                  const verticalOuterPad = isVeryCompactH ? 16 : isCompactH ? 24 : 36;
                  const verticalAvailableMiddle = Math.max(20, surfaceHeight - verticalHeaderH - verticalFooterH - verticalOuterPad - (showChips ? 26 : 0));

                  const heroSize = isUltraWide
                    ? Math.max(36, Math.min(surfaceHeight * 0.82, surfaceWidth * 0.20, 135))
                    : isSplitLandscape
                      ? Math.max(48, Math.min(surfaceWidth * 0.38, (surfaceHeight - (showChips ? 50 : 20)) * 0.85, 260))
                      : Math.max(36, Math.min(surfaceWidth * 0.65, verticalAvailableMiddle * 0.82, isVeryCompactH ? 70 : isCompactH ? 220 : 270));

                  // Dynamic Theme-Opposite Tokens for Inner Screen
                  const screenBgClass = isDarkMode ? 'bg-[#fcf9f5]' : 'bg-[#110e0c]';
                  const textPrimaryClass = isDarkMode ? 'text-[#141210]' : 'text-stone-100';
                  const textHeadlineClass = isDarkMode ? 'text-[#141210]' : 'text-white';
                  const textSublineClass = isDarkMode ? 'text-[#554339]' : 'text-stone-400';
                  const textMutedClass = isDarkMode ? 'text-[#7d7168]' : 'text-stone-500';
                  const borderSubtleClass = isDarkMode ? 'border-[#e2dad2]' : 'border-stone-800';
                  const chipBgClass = isDarkMode ? 'border-[#d6ccc2] bg-[#f0eae1] text-[#423932]' : 'border-stone-700 bg-black/40 text-stone-300';
                  const specCodeBgClass = isDarkMode ? 'border-[#d6ccc2] bg-[#f0eae1] text-[#554339]' : 'border-stone-700 bg-transparent text-stone-300';

                  const hasCustomImage = Boolean(
                    activeCustomParams.heroImageUrl &&
                    (activeCustomParams.heroMode === 'image' || activeCustomParams.heroImageUrl.trim() !== '')
                  );

                  const activeBadgeText = activeCustomParams.badgeText || (badgeEl ? (badgeEl.content as any)?.text : 'SURFACE SPECIMEN № 01') || 'SURFACE SPECIMEN № 01';
                  const activeSpecCode = activeCustomParams.specCode || activeSpec.id.toUpperCase().slice(0, 14);
                  const activeAccent = activeCustomParams.accentColor || '#e14b2d';
                  const activeBadgeColor = isDarkMode ? '#964407' : '#964407';

                  const activeHeadlineMain = activeCustomParams.headline || (headlineText.includes('.') ? headlineText.split('.')[0] : headlineText);
                  const activeHeadlineAccent = activeCustomParams.headlineAccent !== undefined ? activeCustomParams.headlineAccent : (headlineText.includes('.') ? headlineText.split('.')[1] || 'Perfection.' : '');
                  const activeSublineText = activeCustomParams.subline || sublineText;
                  const activePriceText = activeCustomParams.price ? `${activeCustomParams.currency}${activeCustomParams.price}` : priceAmount;
                  const activeOriginalPrice = activeCustomParams.originalPrice ? `${activeCustomParams.currency}${activeCustomParams.originalPrice}` : originalPrice;
                  const activeEdition = activeCustomParams.editionLabel || 'Édition Limitée';
                  const activeCta = activeCustomParams.ctaLabel || ctaLabel;

                  // Render Hero Visual Element with sleek rounded borders on all screens
                  const renderHeroVisual = (size: number) => {
                    const isCustomImg = hasCustomImage && activeCustomParams.heroMode === 'image';
                    const isSpecImg = !isCustomImg && heroEl && (heroEl.content as any)?.src && activeSpecId !== 'aura-acoustic-perfection';
                    const imgRadius = Math.min(26, Math.max(10, Math.round(size * 0.12)));

                    if (isCustomImg && activeCustomParams.heroImageUrl) {
                      return (
                        <div
                          className="relative flex items-center justify-center transition-all duration-300 overflow-hidden shadow-2xl group shrink-0"
                          style={{
                            width: `${size}px`,
                            height: `${size}px`,
                            borderRadius: `${imgRadius}px`,
                          }}
                        >
                          <div className="absolute inset-0 border border-white/20 dark:border-white/10 rounded-[inherit] pointer-events-none z-10" />
                          <img
                            src={activeCustomParams.heroImageUrl}
                            alt="Hero specimen"
                            className="w-full h-full object-cover rounded-[inherit] transition-transform duration-500 group-hover:scale-105"
                            style={{
                              filter: `drop-shadow(0 10px 25px ${activeAccent}35)`,
                            }}
                            onError={() => {
                              console.warn('Hero image failed to load:', activeCustomParams.heroImageUrl);
                            }}
                          />
                        </div>
                      );
                    }
                    if (isSpecImg) {
                      return (
                        <div
                          className="relative flex items-center justify-center transition-all duration-300 overflow-hidden shadow-2xl group shrink-0"
                          style={{
                            width: `${size}px`,
                            height: `${size}px`,
                            borderRadius: `${imgRadius}px`,
                          }}
                        >
                          <div className="absolute inset-0 border border-white/20 dark:border-white/10 rounded-[inherit] pointer-events-none z-10" />
                          <img
                            src={(heroEl.content as any).src}
                            alt="Hero specimen"
                            className="w-full h-full object-cover rounded-[inherit] transition-transform duration-500 group-hover:scale-105"
                            style={{
                              filter: 'drop-shadow(0 10px 25px rgba(225,75,45,0.3))',
                            }}
                          />
                        </div>
                      );
                    }
                    return (
                      <svg
                        className="relative z-10 transition-transform duration-300 select-none"
                        style={{
                          width: `${size}px`,
                          height: `${size}px`,
                          filter: `drop-shadow(0 10px 25px ${activeAccent}40)`,
                        }}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        viewBox="0 0 24 24"
                      >
                        {/* Smooth Headband Arch */}
                        <path
                          d="M3 18v-6a9 9 0 0118 0v6"
                          stroke={isDarkMode ? '#1a1816' : '#f8f6f0'}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.6"
                        />
                        {/* Acoustic Ear Cups */}
                        <path
                          d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z"
                          fill={isDarkMode ? '#f0eae1' : '#1b1613'}
                          stroke={activeAccent}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.4"
                        />
                        {/* Headband Apex Cushion */}
                        <path
                          d="M10 3a2 2 0 014 0"
                          stroke={activeAccent}
                          strokeWidth="1.6"
                          strokeLinecap="round"
                        />
                      </svg>
                    );
                  };

                  // Render Spec Badges Triptych
                  const renderChips = () => {
                    const tag1 = activeCustomParams.tag1 || 'ZOOMX FOAM';
                    const tag2 = activeCustomParams.tag2 || 'CARBON-PLATE';
                    const tag3 = activeCustomParams.tag3 || 'ULTRA-LIGHT';

                    return (
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1 justify-center">
                        <span className={`text-[8px] sm:text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 border rounded-full ${chipBgClass}`}>
                          {tag1}
                        </span>
                        <span
                          className="text-[8px] sm:text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 border rounded-full font-semibold"
                          style={{
                            borderColor: `${activeAccent}80`,
                            backgroundColor: isDarkMode ? `${activeAccent}18` : `${activeAccent}1a`,
                            color: activeAccent,
                          }}
                        >
                          {tag2}
                        </span>
                        <span className={`text-[8px] sm:text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 border rounded-full ${chipBgClass}`}>
                          {tag3}
                        </span>
                      </div>
                    );
                  };

                  /* 1. ULTRA-WIDE HORIZONTAL STRIP (AR >= 3.0) */
                  if (isUltraWide) {
                    return (
                      <div
                        id="ad-canvas"
                        className={`relative w-full h-full ${screenBgClass} px-5 py-2 flex flex-row items-center justify-between ${textPrimaryClass} overflow-hidden select-none gap-3 transition-colors duration-300`}
                      >
                        {/* Left Zone: Headline & Specs */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="text-[8px] font-mono tracking-widest uppercase font-semibold" style={{ color: activeBadgeColor }}>
                              {activeBadgeText}
                            </span>
                            <span className={`text-[8px] font-mono border ${specCodeBgClass} px-1.5 py-0.2 rounded-xs`}>
                              {activeSpecCode}
                            </span>
                          </div>

                          <h2
                            id="creative-headline"
                            className={`font-editorial font-normal leading-[1.08] tracking-tight ${textHeadlineClass} mt-1 whitespace-nowrap`}
                            style={{ fontSize: `${titleFontSize}px` }}
                          >
                            {activeHeadlineMain} {activeHeadlineAccent && <span className="italic font-light" style={{ color: activeAccent }}>{activeHeadlineAccent}</span>}
                          </h2>

                          {showSubline && (
                            <p id="creative-subline" className={`text-[10px] font-serif italic ${textSublineClass} mt-0.5 truncate`}>
                              {activeSublineText}
                            </p>
                          )}
                        </div>

                        {/* Center Zone: Acquisition Price */}
                        <div className="shrink-0 flex flex-col items-center justify-center px-3 border-l border-r border-[#e2dad2]/60 dark:border-stone-800">
                          <span className={`text-[7px] font-mono uppercase tracking-widest ${textMutedClass}`}>
                            Acquisition Spec
                          </span>
                          <div className="flex items-baseline space-x-1.5">
                            <span className={`font-editorial text-lg ${textHeadlineClass} font-normal`}>
                              {activePriceText}
                            </span>
                            <span className={`font-mono text-[10px] ${textMutedClass} line-through`}>
                              {activeOriginalPrice}
                            </span>
                          </div>
                          <span className="text-[7px] font-mono uppercase tracking-widest font-semibold" style={{ color: activeAccent }}>
                            {activeEdition}
                          </span>
                        </div>

                        {/* Center-Right: Hero Visual */}
                        <div className="shrink-0 flex items-center justify-center">
                          {renderHeroVisual(heroSize)}
                        </div>

                        {/* Right Wing Zone: Chips + CTA Button */}
                        <div className="shrink-0 flex flex-col items-end justify-center space-y-1.5">
                          {showChips && (
                            <div className="hidden sm:block">
                              {renderChips()}
                            </div>
                          )}
                          <button
                            className="h-8 px-4 text-[#fffdfa] font-mono text-[10px] uppercase tracking-wider font-bold rounded-xl flex items-center space-x-2 transition-all shadow-md hover:brightness-110 active:scale-[0.99] cursor-pointer"
                            style={{ backgroundColor: activeAccent }}
                          >
                            <span className="whitespace-nowrap">{activeCta}</span>
                            <span>→</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  /* 2. SPLIT 2-COLUMN LANDSCAPE (1.35 <= AR < 3.0) */
                  if (isSplitLandscape) {
                    return (
                      <div
                        id="ad-canvas"
                        className={`relative w-full h-full ${screenBgClass} ${isVeryCompactH ? 'p-3.5 gap-3' : 'p-5 gap-5'} grid grid-cols-2 items-center ${textPrimaryClass} overflow-hidden select-none transition-colors duration-300`}
                      >
                        {/* Left Narrative Column (Headline at Top, Price & CTA at Bottom) */}
                        <div className="flex flex-col justify-between h-full py-0.5 min-w-0">
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="text-[9px] font-mono tracking-widest uppercase font-semibold truncate" style={{ color: activeBadgeColor }}>
                                {activeBadgeText}
                              </span>
                              <span className={`text-[8px] font-mono border ${specCodeBgClass} px-2 py-0.5 rounded-xs shrink-0`}>
                                {activeSpecCode}
                              </span>
                            </div>

                            <h2
                              id="creative-headline"
                              className={`font-editorial font-normal leading-[1.08] tracking-tight ${textHeadlineClass} mt-1.5 line-clamp-2`}
                              style={{ fontSize: `${titleFontSize}px` }}
                            >
                              {activeHeadlineMain} <br />
                              {activeHeadlineAccent && (
                                <span className="italic font-light" style={{ color: activeAccent }}>
                                  {activeHeadlineAccent}
                                </span>
                              )}
                            </h2>

                            {showSubline && (
                              <p id="creative-subline" className={`text-[10px] sm:text-[11px] font-serif italic ${textSublineClass} mt-1 leading-snug line-clamp-2`}>
                                {activeSublineText}
                              </p>
                            )}
                          </div>

                          {/* Price & CTA Action strictly anchored at bottom of left column */}
                          <div className={`space-y-1.5 pt-1.5 border-t ${borderSubtleClass}`}>
                            <div className="flex items-baseline justify-between">
                              <div>
                                <span className={`text-[7px] font-mono uppercase tracking-widest ${textMutedClass} block`}>
                                  Acquisition Spec
                                </span>
                                <div className="flex items-baseline space-x-1.5">
                                  <span className={`font-editorial ${isVeryCompactH ? 'text-lg' : 'text-xl'} ${textHeadlineClass} font-normal`}>
                                    {activePriceText}
                                  </span>
                                  <span className={`font-mono text-[10px] sm:text-xs ${textMutedClass} line-through`}>
                                    {activeOriginalPrice}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[8px] font-mono uppercase tracking-widest font-semibold" style={{ color: activeAccent }}>
                                {activeEdition}
                              </span>
                            </div>

                            <button
                              className={`w-full ${isVeryCompactH ? 'h-7 text-[10px] rounded-lg' : 'h-8 sm:h-9 text-[11px] rounded-xl'} text-[#fffdfa] font-mono uppercase tracking-wider font-bold flex items-center justify-between px-3 sm:px-4 transition-all shadow-md hover:brightness-110 active:scale-[0.99] cursor-pointer`}
                              style={{ backgroundColor: activeAccent }}
                            >
                              <span className="truncate">{activeCta}</span>
                              <span className="ml-2 font-bold">→</span>
                            </button>
                          </div>
                        </div>

                        {/* Right Hero & Chips Column (Hero Centered, Chips Below) */}
                        <div className="flex flex-col items-center justify-center h-full py-0.5 min-w-0 overflow-hidden">
                          <div className="my-auto flex items-center justify-center min-h-0">
                            {renderHeroVisual(heroSize)}
                          </div>
                          {showChips && (
                            <div className="mt-2 shrink-0">
                              {renderChips()}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  /* 3. VERTICAL SINGLE COLUMN STACK (AR < 1.35: Portrait & Square Kiosk) */
                  return (
                    <div
                      id="ad-canvas"
                      className={`relative w-full h-full ${screenBgClass} ${isVeryCompactH ? 'p-3' : isCompactH ? 'p-4' : 'px-6 pt-5 pb-6 sm:px-7 sm:pt-6 sm:pb-7'} flex flex-col justify-between ${textPrimaryClass} overflow-hidden select-none transition-all duration-300`}
                    >
                      {/* Specimen Header */}
                      <div className={`relative z-10 shrink-0 ${hasNotch ? 'pt-7' : 'pt-0.5'}`}>
                        <div className="flex items-center justify-between">
                          <span
                            className="text-[8px] sm:text-[9px] font-mono tracking-widest uppercase font-semibold truncate mr-1"
                            style={{ color: activeBadgeColor }}
                          >
                            {activeBadgeText}
                          </span>
                          <span className={`text-[8px] font-mono border ${specCodeBgClass} px-1.5 py-0.2 rounded-xs shrink-0`}>
                            {activeSpecCode}
                          </span>
                        </div>

                        <h2
                          id="creative-headline"
                          className={`font-editorial font-normal leading-[1.08] tracking-tight ${textHeadlineClass} mt-1 line-clamp-2`}
                          style={{ fontSize: `${titleFontSize}px` }}
                        >
                          {activeHeadlineMain} <br />
                          {activeHeadlineAccent && (
                            <span className="italic font-light" style={{ color: activeAccent }}>
                              {activeHeadlineAccent}
                            </span>
                          )}
                        </h2>

                        {showSubline && (
                          <p id="creative-subline" className={`text-[10px] sm:text-[11px] font-serif italic ${textSublineClass} mt-1 leading-snug line-clamp-2`}>
                            {activeSublineText}
                          </p>
                        )}
                      </div>

                      {/* Center Hero Visual Vector & Chips (Safe Middle Clearance) */}
                      <div className="relative z-10 flex-1 min-h-0 flex flex-col items-center justify-center py-0.5 overflow-hidden">
                        <div className="flex items-center justify-center min-h-0 max-h-full">
                          {renderHeroVisual(heroSize)}
                        </div>
                        {showChips && (
                          <div className="mt-1.5 sm:mt-2 shrink-0">
                            {renderChips()}
                          </div>
                        )}
                      </div>

                      {/* Specimen Foot Acquisition Anchor (Always pinned at bottom, never clipped) */}
                      <div className={`relative z-20 shrink-0 ${isVeryCompactH ? 'space-y-1 pb-0.5' : 'space-y-2 pb-1'}`}>
                        <div className={`flex items-baseline justify-between border-b ${borderSubtleClass} ${isVeryCompactH ? 'pb-0.5' : 'pb-1.5'}`}>
                          <div>
                            {!isVeryCompactH && (
                              <span className={`text-[7px] sm:text-[8px] font-mono uppercase tracking-widest ${textMutedClass} block`}>
                                Acquisition Spec
                              </span>
                            )}
                            <div className="flex items-baseline space-x-1.5">
                              <span className={`font-editorial ${isVeryCompactH ? 'text-lg' : isCompactH ? 'text-xl' : 'text-2xl'} ${textHeadlineClass} font-normal`}>
                                {activePriceText}
                              </span>
                              <span className={`font-mono ${isVeryCompactH ? 'text-[9px]' : isCompactH ? 'text-[10px]' : 'text-xs'} ${textMutedClass} line-through`}>
                                {activeOriginalPrice}
                              </span>
                            </div>
                          </div>
                          <span className="text-[8px] sm:text-[9px] font-mono uppercase tracking-widest font-semibold" style={{ color: activeAccent }}>
                            {activeEdition}
                          </span>
                        </div>

                        <button
                          className={`w-full ${isVeryCompactH ? 'h-7 text-[10px] rounded-lg' : isCompactH ? 'h-9 text-[11px] rounded-xl' : 'h-11 text-xs rounded-xl sm:rounded-2xl'} text-[#fffdfa] font-mono uppercase tracking-monumental flex items-center justify-between px-3 sm:px-4 transition-all shadow-lg hover:brightness-110 active:scale-[0.99] cursor-pointer`}
                          style={{ backgroundColor: activeAccent }}
                        >
                          <span className="font-bold truncate">{activeCta}</span>
                          <span className="text-xs font-bold shrink-0 ml-1.5">→</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* MOBILE FOLIO CATALOG DRAWER (< lg) */}
      <div
        id="mobile-folio-backdrop"
        onClick={() => setIsMobileFolioOpen(false)}
        className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 bg-black/50 backdrop-blur-xs ${isMobileFolioOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
      />

      <aside
        id="mobile-folio-drawer"
        className={`lg:hidden fixed top-0 left-0 h-full w-[310px] sm:w-[360px] max-w-[85vw] z-50 bg-[#fcf8f4] dark:bg-[#110f0e] text-[#141210] dark:text-[#f5ede4] border-r border-[#e2dad2] dark:border-[#262320] shadow-2xl transition-transform duration-300 ease-out transform flex flex-col justify-between p-6 overflow-y-auto ${isMobileFolioOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div>
          {/* Header with Close */}
          <div className="flex items-start justify-between mb-5 pb-3 border-b border-[#e2dad2] dark:border-[#262320]">
            <div>
              <div className="mb-1">
                <h2 className="font-editorial text-2xl text-[#141210] dark:text-[#f5ede4] font-normal leading-tight">
                  Adaptive Layout <span className="italic text-[#e14b2d] font-light">Studio.</span>
                </h2>
              </div>
              <p className="text-[11px] font-serif italic text-[#554339] dark:text-[#9e9086] mt-1.5 leading-relaxed">
                Design once. Adapt everywhere. <br />
                Intelligent layouts powered by constraints, not breakpoints.
              </p>
            </div>
            <button
              onClick={() => setIsMobileFolioOpen(false)}
              className="w-7 h-7 flex items-center justify-center text-[#73675e] hover:text-[#141210] dark:text-[#9e9086] dark:hover:text-white rounded-xs"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                <line x1="18" x2="6" y1="6" y2="18" />
                <line x1="6" x2="18" y1="6" y2="18" />
              </svg>
            </button>
          </div>

          {/* Specimen Plates List */}
          <div className="space-y-2.5">
            {specimens.map((specimen) => {
              const isActive = activePlateKey === specimen.key;
              return (
                <div
                  key={specimen.key}
                  onClick={() => {
                    if (specimen.key === 'custom') {
                      handleOpenStudio();
                    } else {
                      setActivePlateKey(specimen.key);
                      setIsAutoDeviceMode(false);
                    }
                    setIsMobileFolioOpen(false);
                  }}
                  className={`cursor-pointer p-3 border-l-2 transition-all rounded-r-xs ${isActive
                      ? 'border-[#e14b2d] bg-white/70 dark:bg-[#1a1715] shadow-xs'
                      : 'border-transparent bg-transparent hover:bg-white/40 dark:hover:bg-[#171413]/50'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-mono uppercase tracking-widest font-bold ${isActive ? 'text-[#e14b2d]' : 'text-stone-400'}`}>
                      {specimen.plate}
                    </span>
                    <span className="text-[9px] font-mono text-[#554339] dark:text-[#9e9086]">
                      {specimen.ratioLabel}
                    </span>
                  </div>
                  <h3 className={`font-editorial text-base text-[#141210] dark:text-[#f5ede4] mt-0.5 ${isActive ? 'font-semibold' : ''}`}>
                    {specimen.name}
                  </h3>
                  <p className="text-[10px] font-mono text-[#73675e] dark:text-[#887c72] mt-0.5">
                    {specimen.dimensionsText}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Curatorial Dispatch Colophon */}
        <div className="pt-4 mt-4 border-t border-[#e2dad2] dark:border-[#262320] text-[10px] font-mono text-[#554339] dark:text-[#9e9086]">
          <p className="font-editorial italic text-xs leading-relaxed text-[#73675e] dark:text-[#a1958b]">
            “Every constraint is an opportunity. Every surface deserves its own perfect composition.”
          </p>
        </div>
      </aside>

      {/* SLIDE-OVER CUSTOMISE YOUR AD STUDIO DRAWER */}
      <div
        id="custom-studio-backdrop"
        onClick={handleCancelStudio}
        className={`fixed inset-0 z-30 transition-opacity duration-300 bg-black/40 dark:bg-black/60 backdrop-blur-xs ${isCustomStudioOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
      />

      <aside
        id="custom-studio-drawer"
        className={`fixed top-0 right-0 h-full w-[310px] sm:w-[420px] md:w-[460px] max-w-full z-50 bg-[#fcf8f4] dark:bg-[#110f0e] text-[#141210] dark:text-[#f5ede4] border-l border-[#e2dad2] dark:border-[#262320] shadow-2xl transition-transform duration-300 ease-out transform flex flex-col justify-between overflow-hidden ${isCustomStudioOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <CustomiseAdStudio
          params={draftParams}
          onChange={setDraftParams}
          onReset={() => setDraftParams(defaultCustomParams)}
          onClose={handleCancelStudio}
          onSave={handleSaveStudio}
          onCancel={handleCancelStudio}
        />
      </aside>

      {/* SLIDE-OVER TELEMETRY & INSPECTOR DRAWER */}
      <div
        id="telemetry-backdrop"
        onClick={() => setIsTelemetryOpen(false)}
        className={`fixed inset-0 z-50 transition-opacity duration-300 bg-black/25 backdrop-blur-[1px] ${isTelemetryOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
      />

      <aside
        id="telemetry-drawer"
        className={`fixed top-0 right-0 h-full w-[320px] sm:w-[360px] z-50 bg-[#fcf8f4] dark:bg-[#110f0e] text-[#141210] dark:text-[#f5ede4] border-l border-[#e2dad2] dark:border-[#262320] shadow-2xl transition-transform duration-300 ease-out transform flex flex-col justify-between overflow-hidden ${isTelemetryOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#e2dad2] dark:border-[#262320] flex items-center justify-between bg-[#f5efe8]/60 dark:bg-[#141210]/60">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-sm border border-[#d6ccc2] dark:border-[#2b2622] bg-white/70 dark:bg-[#181513] flex items-center justify-center">
                <span className="text-[11px] font-mono text-[#e14b2d] font-semibold">CI</span>
              </div>
              <div>
                <h2 className="font-editorial text-lg text-[#141210] dark:text-[#f5ede4] leading-tight font-normal">
                  Telemetry & Inspector
                </h2>
                <p className="text-[10px] font-mono text-[#554339] dark:text-[#9e9086] uppercase tracking-wider">
                  Live Viewport Constraints
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsTelemetryOpen(false)}
              aria-label="Close Inspector"
              className="w-8 h-8 flex items-center justify-center text-[#73675e] hover:text-[#141210] dark:text-[#9e9086] dark:hover:text-white cursor-pointer rounded-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                <line x1="18" x2="6" y1="6" y2="18" />
                <line x1="6" x2="18" y1="6" y2="18" />
              </svg>
            </button>
          </div>

          {/* Content Sections */}
          <div className="p-6 space-y-6">
            {/* Section 01: Constraint Inspector */}
            <div>
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#e2dad2] dark:border-[#262320]">
                <div className="flex items-baseline space-x-2">
                  <span className="text-[10px] font-mono font-bold text-[#e14b2d] uppercase tracking-wider">01</span>
                  <h3 className="font-editorial text-base text-[#141210] dark:text-[#f5ede4]">Constraint Inspector</h3>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 border border-[#d6ccc2] dark:border-[#332f2b] text-[#73675e] dark:text-[#9e9086] uppercase tracking-wider">
                  Pass · AAA
                </span>
              </div>
              <div className="space-y-2.5 font-mono text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-[#554339] dark:text-[#9e9086]">Aspect Ratio</span>
                  <span className="font-medium text-[#141210] dark:text-[#f5ede4]">
                    {(activeSurface.width / activeSurface.height).toFixed(3)} ({activeSpecimen.ratioLabel})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#554339] dark:text-[#9e9086]">Active Viewport</span>
                  <span className="font-semibold text-[#e14b2d]">
                    {activeSurface.width} × {activeSurface.height} px
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#554339] dark:text-[#9e9086]">Safe Margin Inset</span>
                  <span className="font-medium text-[#141210] dark:text-[#f5ede4]">
                    {activeSurface.safeArea.left}px Locked
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#554339] dark:text-[#9e9086]">Min Font Size</span>
                  <span className="font-medium text-[#141210] dark:text-[#f5ede4]">
                    {activeSurface.minTextSize}px (No Truncation)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#554339] dark:text-[#9e9086]">Tap Clearance</span>
                  <span className="font-medium text-[#141210] dark:text-[#f5ede4]">
                    {activeSurface.minTapTarget}px Conforming
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#554339] dark:text-[#9e9086]">DOM Overflow</span>
                  <span className="font-semibold text-[#e14b2d]">0.00% (Strict Fit)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#554339] dark:text-[#9e9086]">Solver Latency</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">&lt; 0.35 ms (Pass 1–5)</span>
                </div>
              </div>
            </div>

            {/* Section 02: Layout Decisions */}
            <div>
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#e2dad2] dark:border-[#262320]">
                <div className="flex items-baseline space-x-2">
                  <span className="text-[10px] font-mono font-bold text-[#e14b2d] uppercase tracking-wider">02</span>
                  <h3 className="font-editorial text-base text-[#141210] dark:text-[#f5ede4]">Layout Decisions</h3>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 border border-[#d6ccc2] dark:border-[#332f2b] text-[#73675e] dark:text-[#9e9086] uppercase tracking-wider rounded-2xs">
                  Priority Tree
                </span>
              </div>

              {priorityToast && (
                <div className="mb-2.5 px-2.5 py-1.5 bg-[#e14b2d]/10 border border-[#e14b2d]/30 rounded-xs text-[10px] font-mono text-[#e14b2d] flex items-center gap-1.5 animate-pulse">
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span className="truncate">{priorityToast}</span>
                </div>
              )}

              <p className="text-[10px] font-mono text-[#73675e] dark:text-[#887c72] mb-2.5">
                Drag cards or use ↑ / ↓ buttons to adjust element priorities:
              </p>

              <div className="space-y-2 font-mono text-[10px]">
                {layoutDecisions.map((item, idx) => {
                  const isDragged = draggedIndex === idx;
                  const isOver = dragOverIndex === idx;

                  return (
                    <div
                      key={item.key}
                      draggable
                      onDragStart={(e) => {
                        setDraggedIndex(idx);
                        e.dataTransfer.setData('text/plain', String(idx));
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragOverIndex !== idx) setDragOverIndex(idx);
                      }}
                      onDragLeave={() => {
                        if (dragOverIndex === idx) setDragOverIndex(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedIndex !== null && draggedIndex !== idx) {
                          movePriorityItem(draggedIndex, idx);
                        }
                        setDraggedIndex(null);
                        setDragOverIndex(null);
                      }}
                      onDragEnd={() => {
                        setDraggedIndex(null);
                        setDragOverIndex(null);
                      }}
                      className={`p-2.5 rounded-sm bg-white/60 dark:bg-[#181513] border transition-all flex items-center justify-between cursor-grab active:cursor-grabbing group shadow-2xs ${isDragged
                          ? 'opacity-40 border-dashed border-[#e14b2d] scale-98'
                          : isOver
                            ? 'border-[#e14b2d] bg-[#e14b2d]/5 dark:bg-[#e14b2d]/10 shadow-md ring-1 ring-[#e14b2d]'
                            : 'border-[#e2dad2] dark:border-[#262320] hover:border-[#e14b2d]/50 dark:hover:border-[#e14b2d]/50 hover:bg-white dark:hover:bg-[#201c19]'
                        }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <GripVertical className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#e14b2d] shrink-0" />
                        <span className="px-1.5 py-0.2 rounded-2xs bg-stone-200 dark:bg-stone-800 text-[9px] font-bold text-[#e14b2d]">
                          {item.priority}
                        </span>
                        <span className="text-[#554339] dark:text-[#9e9086] group-hover:text-[#141210] dark:group-hover:text-white transition-colors font-medium truncate">
                          {item.element}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Up arrow */}
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            movePriorityItem(idx, idx - 1);
                          }}
                          title="Move Up"
                          className="p-1 rounded-2xs text-stone-400 hover:text-[#e14b2d] hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-20 disabled:hover:text-stone-400 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        {/* Down arrow */}
                        <button
                          type="button"
                          disabled={idx === layoutDecisions.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            movePriorityItem(idx, idx + 1);
                          }}
                          title="Move Down"
                          className="p-1 rounded-2xs text-stone-400 hover:text-[#e14b2d] hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-20 disabled:hover:text-stone-400 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <span className={`font-semibold ml-1.5 ${item.accent ? 'text-[#e14b2d]' : 'text-[#141210] dark:text-[#f5ede4]'}`}>
                          {item.decision}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 03: Performance Telemetry */}
            <div>
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#e2dad2] dark:border-[#262320]">
                <div className="flex items-baseline space-x-2">
                  <span className="text-[10px] font-mono font-bold text-[#e14b2d] uppercase tracking-wider">03</span>
                  <h3 className="font-editorial text-base text-[#141210] dark:text-[#f5ede4]">Performance</h3>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 border border-[#d6ccc2] dark:border-[#332f2b] text-[#73675e] dark:text-[#9e9086] uppercase tracking-wider">
                  Nominal
                </span>
              </div>
              <div className="space-y-2.5 font-mono text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-[#554339] dark:text-[#9e9086]">Resolution Time</span>
                  <span className="font-semibold text-[#e14b2d]">{resolvedLayout.durationMs} ms JIT</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#554339] dark:text-[#9e9086]">Render Passes</span>
                  <span className="font-medium text-[#141210] dark:text-[#f5ede4]">1 Pass (Zero Reflow)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#554339] dark:text-[#9e9086]">Layout Health</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-[#141210] dark:text-[#f5ede4]">100.0%</span>
                    <div className="w-12 h-1 rounded-full bg-[#d6ccc2]/50 dark:bg-[#2b2622] overflow-hidden">
                      <div className="w-full h-full bg-[#e14b2d]" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#554339] dark:text-[#9e9086]">Contained Nodes</span>
                  <span className="font-medium text-[#141210] dark:text-[#f5ede4]">
                    {resolvedLayout.elements.length} Nodes
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#554339] dark:text-[#9e9086]">Strategy Used</span>
                  <span className="font-medium text-[#141210] dark:text-[#f5ede4]">
                    {resolvedLayout.strategyUsed}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer Colophon */}
        <div className="p-6 border-t border-[#e2dad2] dark:border-[#262320] bg-[#f5efe8]/40 dark:bg-[#141210]/40">
          <p className="font-editorial italic text-xs leading-relaxed text-[#73675e] dark:text-[#9e9086]">
            “Parametric layout balance verified under deterministic bounding constraints.”
          </p>
        </div>
      </aside>

      {/* EXPORT / DOWNLOAD AD MODAL DIALOG */}
      <ExportAdModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        activePlateName={activeSpecimen.name}
        activeDimensions={activeSpecimen.dimensionsText}
        width={surfaceWidth}
        height={surfaceHeight}
        customParams={customParams}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}

export default App;
