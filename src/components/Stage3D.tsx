import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { ResolvedLayout, ResolvedElementLayout, AdTheme } from '../types';
import { RenderDOM } from '../render-dom';
import { renderCanvas } from '../render-canvas';
import {
  Layers,
  Box,
  Rotate3d,
  Sparkles,
  Zap,
  Eye,
} from 'lucide-react';

interface Stage3DProps {
  layout: ResolvedLayout;
  theme?: Partial<AdTheme>;
  selectedElementId?: string | null;
  onSelectElement?: (id: string | null) => void;
  rendererMode: 'dom' | 'canvas' | 'split';
  showSafeAreas: boolean;
  showBoundingBoxes: boolean;
}

type CameraPreset = 'hero' | 'iso' | 'flat' | 'free';

export const Stage3D: React.FC<Stage3DProps> = ({
  layout,
  theme,
  selectedElementId,
  onSelectElement,
  rendererMode,
  showSafeAreas,
  showBoundingBoxes,
}) => {
  const { surface, elements, degradationSummary, droppedElements } = layout;

  // 3D Camera & Animation Controls
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('hero');
  const [isFloating, setIsFloating] = useState<boolean>(false);
  const [isExploded, setIsExploded] = useState<boolean>(false);
  const [renderStyle, setRenderStyle] = useState<'blueprint' | 'photorealistic'>('blueprint');

  // Canvas ref for canvas renderer mode
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Free 3D Drag Rotation State
  const [rotX, setRotX] = useState<number>(10);
  const [rotY, setRotY] = useState<number>(-14);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStart = useRef<{ x: number; y: number; rotX: number; rotY: number }>({ x: 0, y: 0, rotX: 10, rotY: -14 });
  const viewportRef = useRef<HTMLDivElement | null>(null);

  // Preset switchers
  const selectPreset = (preset: CameraPreset) => {
    setCameraPreset(preset);
    if (preset === 'hero') {
      setRotX(10);
      setRotY(-14);
    } else if (preset === 'iso') {
      setRotX(22);
      setRotY(-26);
    } else if (preset === 'flat') {
      setRotX(0);
      setRotY(0);
    }
  };

  // Mouse Parallax (when not dragging and in 3D mode)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setRotY(dragStart.current.rotY + dx * 0.4);
      setRotX(Math.max(-60, Math.min(60, dragStart.current.rotX - dy * 0.4)));
      return;
    }

    if (cameraPreset === 'flat' || isFloating) return;

    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const nx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const ny = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);

    const baseRotX = cameraPreset === 'iso' ? 22 : 10;
    const baseRotY = cameraPreset === 'iso' ? -26 : -14;

    setRotX(baseRotX - ny * 6);
    setRotY(baseRotY + nx * 8);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only drag on canvas background or rig container, not interactive buttons
    if ((e.target as HTMLElement).closest('.stage-controls-bar, .stage-caption-pill')) return;

    setIsDragging(true);
    setCameraPreset('free');
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      rotX,
      rotY,
    };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Calculate proportional device scale for the stage
  const deviceScale = useMemo(() => {
    const maxW = 560;
    const maxH = 480;

    let targetW = surface.width;
    let targetH = surface.height;

    if (surface.category === 'broadcast' || surface.width >= 1200) {
      return 0.32;
    }
    if (surface.category === 'kiosk' || (surface.width > 800 && surface.height > 800)) {
      return 0.38;
    }
    if (targetW > maxW || targetH > maxH) {
      const scaleW = maxW / targetW;
      const scaleH = maxH / targetH;
      return Math.min(scaleW, scaleH) * 0.9;
    }

    if (targetW <= 320 && targetH <= 480) {
      return 0.95;
    }

    return 0.85;
  }, [surface.width, surface.height, surface.category]);

  const displayWidth = Math.round(surface.width * deviceScale);
  const displayHeight = Math.round(surface.height * deviceScale);

  // Render Canvas when in canvas mode
  useEffect(() => {
    if (canvasRef.current && rendererMode === 'canvas') {
      renderCanvas(canvasRef.current, layout, {
        scale: deviceScale,
        theme,
        showSafeAreas,
        showBoundingBoxes,
      });
    }
  }, [layout, deviceScale, theme, showSafeAreas, showBoundingBoxes, rendererMode]);

  // Dynamic Caption text based on layout decisions
  const captionText = useMemo(() => {
    if (droppedElements.length > 0) {
      return `${droppedElements.length} element${droppedElements.length > 1 ? 's' : ''} dropped cleanly · space budget ${degradationSummary.spaceUtilizationPercent}%`;
    }
    if (layout.strategyUsed.includes('TWO_COLUMN')) {
      return `re-composed to 2-column · ${surface.orientation} split`;
    }
    if (layout.strategyUsed.includes('HORIZONTAL')) {
      return `far-viewing horizontal ribbon · high legibility scale`;
    }
    return `1 of ${elements.length} elements repositioned · ${layout.strategyUsed.toLowerCase().replace(/_/g, ' ')}`;
  }, [layout.strategyUsed, droppedElements.length, degradationSummary.spaceUtilizationPercent, elements.length, surface.orientation]);

  return (
    <div
      ref={viewportRef}
      className="stage-viewport cursor-grab active:cursor-grabbing"
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top Right: 3D Stage Floating Controls */}
      <div className="stage-controls-bar">
        {/* Camera Presets */}
        <button
          onClick={() => selectPreset('hero')}
          className={`stage-btn ${cameraPreset === 'hero' ? 'active' : ''}`}
          title="3D Dynamic Hero Angle"
        >
          <Rotate3d className="w-3.5 h-3.5" />
          <span>3D Hero</span>
        </button>

        <button
          onClick={() => selectPreset('iso')}
          className={`stage-btn ${cameraPreset === 'iso' ? 'active' : ''}`}
          title="3D Isometric Angle"
        >
          <Box className="w-3.5 h-3.5" />
          <span>Isometric</span>
        </button>

        <button
          onClick={() => selectPreset('flat')}
          className={`stage-btn ${cameraPreset === 'flat' ? 'active' : ''}`}
          title="Orthographic Flat 2D View"
        >
          <span>Flat 2D</span>
        </button>

        <div className="w-[1px] h-4 bg-white/10 mx-1" />

        {/* 3D Exploded Layer Depth Toggle */}
        <button
          onClick={() => setIsExploded(!isExploded)}
          className={`stage-btn ${isExploded ? 'active' : ''}`}
          title="Toggle 3D Z-Axis Layer Explosion Stack"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>3D Depth</span>
        </button>

        {/* 3D Floating Idle Animation */}
        <button
          onClick={() => setIsFloating(!isFloating)}
          className={`stage-btn ${isFloating ? 'active' : ''}`}
          title="Toggle 3D Floating Animation"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Float</span>
        </button>

        <div className="w-[1px] h-4 bg-white/10 mx-1" />

        {/* Render Style Toggle */}
        <button
          onClick={() => setRenderStyle(renderStyle === 'blueprint' ? 'photorealistic' : 'blueprint')}
          className={`stage-btn ${renderStyle === 'photorealistic' ? 'active' : ''}`}
          title="Switch between Blueprint Schematic and Live Render"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{renderStyle === 'blueprint' ? 'Blueprint' : 'Live'}</span>
        </button>
      </div>

      {/* 3D Rig with Preserved Depth */}
      <div
        className={`rig-3d ${cameraPreset === 'flat' ? 'flat' : ''} ${isFloating ? 'anim-floating' : ''}`}
        style={{
          transform: cameraPreset === 'flat'
            ? 'rotateX(0deg) rotateY(0deg)'
            : `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          width: displayWidth,
          height: displayHeight,
        }}
      >
        {/* Device Chassis Frame */}
        <div
          className={`device-chassis ${isExploded ? 'exploded' : ''}`}
          style={{
            width: displayWidth,
            height: displayHeight,
          }}
        >
          {/* RENDER STYLE 1: BLUEPRINT SCHEMATIC (Matching Mockup) */}
          {renderStyle === 'blueprint' ? (
            <div className="absolute inset-0 select-none">
              {elements.map((el) => {
                const isSelected = selectedElementId === el.id;
                const isDropped = el.opacity === 0;

                const left = Math.round(el.x * deviceScale);
                const top = Math.round(el.y * deviceScale);
                const width = Math.round(el.width * deviceScale);
                const height = Math.round(el.height * deviceScale);
                const fontSize = el.fontSize ? Math.max(9, Math.round(el.fontSize * deviceScale)) : undefined;

                return (
                  <div
                    key={el.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectElement?.(el.id);
                    }}
                    className={`ad-el ${getElementClass(el)} ${isDropped ? 'dropped' : ''} ${
                      isSelected ? 'highlighted' : ''
                    }`}
                    style={{
                      left: `${left}px`,
                      top: `${top}px`,
                      width: `${width}px`,
                      height: `${height}px`,
                      fontSize: fontSize ? `${fontSize}px` : undefined,
                      zIndex: el.zIndex,
                    }}
                    data-role={el.role}
                    data-priority={el.priority}
                    title={`${el.id} (Priority ${el.priority})`}
                  >
                    {renderBlueprintContent(el)}
                  </div>
                );
              })}
            </div>
          ) : rendererMode === 'canvas' ? (
            /* Canvas 2D Live Render */
            <canvas ref={canvasRef} className="rounded-2xl" />
          ) : (
            /* RENDER STYLE 2: LIVE PHOTOREALISTIC RENDER */
            <RenderDOM
              layout={layout}
              theme={theme}
              scale={deviceScale}
              showSafeAreas={showSafeAreas}
              showBoundingBoxes={showBoundingBoxes}
              interactive={true}
              onElementClick={(el: ResolvedElementLayout) => onSelectElement?.(el.id)}
            />
          )}
        </div>
      </div>

      {/* Stage Bottom Caption Pill */}
      <div className="stage-caption-pill">
        <Sparkles className="w-3.5 h-3.5 text-accent" />
        <span>{captionText}</span>
      </div>
    </div>
  );
};

/**
 * Returns blueprint class based on element role / type
 */
function getElementClass(el: ResolvedElementLayout): string {
  if (el.role === 'hero' || (el.type === 'image' && el.role !== 'branding')) return 'image';
  if (el.role === 'primary' || el.type === 'text') return 'headline';
  if (el.role === 'action' || el.type === 'button') return 'cta';
  if (el.role === 'secondary' || el.type === 'price-tag') return 'price';
  if (el.role === 'branding') return 'logo';
  if (el.role === 'badge' || el.type === 'badge') return 'badge';
  return 'headline';
}

/**
 * Renders schematic blueprint content matching user mockup
 */
function renderBlueprintContent(el: ResolvedElementLayout) {
  if (el.role === 'hero' || (el.type === 'image' && el.role !== 'branding')) {
    return <div className="ph-box" />;
  }

  if (el.type === 'text' || el.role === 'primary') {
    const text = (el.content as any)?.text || el.textLines?.join(' ') || 'Headline';
    return (
      <span className="px-2 truncate leading-tight">
        {text}
      </span>
    );
  }

  if (el.type === 'price-tag' || el.role === 'secondary') {
    const p = el.content as any;
    const priceText = p?.amount ? `${p.currency || '₹'}${p.amount}` : '$84.00';
    return <span>{priceText}</span>;
  }

  if (el.type === 'button' || el.role === 'action') {
    const btn = el.content as any;
    return <span className="truncate px-2">{btn?.label || 'Shop Now'}</span>;
  }

  if (el.role === 'branding') {
    const img = el.content as any;
    return <span>{img?.alt || 'LOGO'}</span>;
  }

  if (el.type === 'badge' || el.role === 'badge') {
    const b = el.content as any;
    return <span className="truncate px-1.5">{b?.text || 'SPECIAL'}</span>;
  }

  return <span>{el.id}</span>;
}
