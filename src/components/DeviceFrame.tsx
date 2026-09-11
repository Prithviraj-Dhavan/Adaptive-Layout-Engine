import React, { useRef, useEffect } from 'react';
import type { ResolvedLayout, AdTheme } from '../types';
import { RenderDOM } from '../render-dom';
import { renderCanvas } from '../render-canvas';
import { Radio, ShieldCheck, Touchpad } from 'lucide-react';

interface DeviceFrameProps {
  layout: ResolvedLayout;
  theme?: Partial<AdTheme>;
  rendererMode: 'dom' | 'canvas' | 'split';
  showSafeAreas: boolean;
  showBoundingBoxes: boolean;
  scale?: number;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  layout,
  theme,
  rendererMode,
  showSafeAreas,
  showBoundingBoxes,
  scale = 1.0,
}) => {
  const { surface } = layout;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const primaryColor = theme?.primaryColor || '#6366F1';
  const secondaryColor = theme?.secondaryColor || '#EC4899';

  useEffect(() => {
    if (canvasRef.current && (rendererMode === 'canvas' || rendererMode === 'split')) {
      renderCanvas(canvasRef.current, layout, {
        scale,
        theme,
        showSafeAreas,
        showBoundingBoxes,
      });
    }
  }, [layout, theme, rendererMode, scale, showSafeAreas, showBoundingBoxes]);

  // 1. Broadcast Lower-Third Frame
  if (surface.category === 'broadcast' || surface.id === 'broadcastLowerThird') {
    const broadcastScale = Math.min(scale, 0.42);

    return (
      <div className="relative flex flex-col items-center">
        {/* Dynamic Underglow */}
        <div
          className="absolute -inset-4 blur-3xl opacity-30 pointer-events-none rounded-3xl transition-all duration-700"
          style={{
            background: `radial-gradient(circle, ${primaryColor} 0%, ${secondaryColor} 60%, transparent 80%)`,
          }}
        />

        <div className="relative z-10 w-full max-w-[840px] flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-[11px] text-slate-400 px-4 py-1.5 bg-slate-900/90 rounded-t-2xl border border-white/10 font-mono">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-red-400 font-bold animate-pulse">
                <Radio className="w-3.5 h-3.5" /> LIVE ON AIR
              </span>
              <span className="text-slate-600">|</span>
              <span>1080p60 SDI BROADCAST FEED</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-indigo-400 font-bold">FAR VIEWING (10ft)</span>
              <span className="bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded text-[9px] font-bold border border-indigo-500/30">
                Min Text: {surface.minTextSize}px
              </span>
            </div>
          </div>

          <div className="relative w-full aspect-video rounded-b-2xl overflow-hidden shadow-2xl border border-white/10 bg-slate-950 flex flex-col justify-end p-4">
            <img
              src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80"
              alt="Broadcast Studio Backdrop"
              className="absolute inset-0 w-full h-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />

            <div className="relative z-10 w-full flex justify-center">
              {rendererMode === 'canvas' ? (
                <canvas ref={canvasRef} className="rounded-xl shadow-2xl" />
              ) : (
                <RenderDOM
                  layout={layout}
                  theme={theme}
                  scale={broadcastScale}
                  showSafeAreas={showSafeAreas}
                  showBoundingBoxes={showBoundingBoxes}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Retail Kiosk Frame (Square 1:1)
  if (surface.category === 'kiosk' || surface.id === 'retailKiosk') {
    const kioskScale = Math.min(scale, 0.45);

    return (
      <div className="relative flex flex-col items-center">
        {/* Dynamic Underglow */}
        <div
          className="absolute -inset-6 blur-3xl opacity-35 pointer-events-none rounded-3xl transition-all duration-700"
          style={{
            background: `radial-gradient(circle, ${primaryColor} 0%, ${secondaryColor} 60%, transparent 80%)`,
          }}
        />

        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-slate-900/90 text-slate-300 text-[11px] font-mono font-bold px-6 py-1.5 rounded-t-2xl border-t border-x border-white/10 flex items-center gap-3">
            <Touchpad className="w-3.5 h-3.5 text-emerald-400" />
            <span>FLAM RETAIL KIOSK TERMINAL (1080×1080 TOUCH-ACTIVE)</span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[9px]">
              Min Tap Target: {surface.minTapTarget}px
            </span>
          </div>

          <div className="p-3 bg-gradient-to-b from-slate-800/80 via-slate-900/90 to-slate-950 rounded-3xl border border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
            {rendererMode === 'canvas' ? (
              <canvas ref={canvasRef} className="rounded-2xl shadow-inner" />
            ) : (
              <RenderDOM
                layout={layout}
                theme={theme}
                scale={kioskScale}
                showSafeAreas={showSafeAreas}
                showBoundingBoxes={showBoundingBoxes}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. Mobile Interstitial & Landscape Phones / Tablets
  const mobileScale = surface.orientation === 'portrait' ? Math.min(scale, 0.9) : Math.min(scale, 0.85);

  return (
    <div className="relative flex flex-col items-center">
      {/* Dynamic Ambient Underglow */}
      <div
        className="absolute -inset-8 blur-3xl opacity-40 pointer-events-none rounded-full transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${primaryColor} 0%, ${secondaryColor} 50%, transparent 75%)`,
        }}
      />

      {/* Hardware Chassis */}
      <div
        className={`relative z-10 p-3 bg-gradient-to-b from-slate-700/60 via-slate-900/90 to-black shadow-[0_25px_60px_-12px_rgba(0,0,0,0.9)] border border-white/20 transition-all duration-300 ring-1 ring-white/10 ${
          surface.orientation === 'portrait' ? 'rounded-[46px]' : 'rounded-[32px]'
        }`}
      >
        {/* Dynamic Island on Portrait Mobile */}
        {surface.category === 'mobile' && surface.orientation === 'portrait' && (
          <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-50 flex items-center justify-between px-3 shadow-inner">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-emerald-900/50" />
          </div>
        )}

        {rendererMode === 'canvas' ? (
          <canvas ref={canvasRef} className="rounded-[34px] shadow-inner" />
        ) : (
          <RenderDOM
            layout={layout}
            theme={theme}
            scale={mobileScale}
            showSafeAreas={showSafeAreas}
            showBoundingBoxes={showBoundingBoxes}
          />
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 font-mono">
        <span className="flex items-center gap-1 text-emerald-400 font-bold">
          <ShieldCheck className="w-3.5 h-3.5" /> 100% Collision-Free
        </span>
        <span>•</span>
        <span>Strategy: <strong className="text-white">{layout.strategyUsed}</strong></span>
        <span>•</span>
        <span>Solver: <strong className="text-indigo-300">{layout.durationMs}ms</strong></span>
      </div>
    </div>
  );
};
