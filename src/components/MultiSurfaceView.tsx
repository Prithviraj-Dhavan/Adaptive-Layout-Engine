import React from 'react';
import type { AdSpec, SurfaceProfile, AdTheme } from '../types';
import { resolveLayout } from '../resolver';
import { DeviceFrame } from './DeviceFrame';
import { Smartphone, Tv, Store } from 'lucide-react';

interface MultiSurfaceViewProps {
  spec: AdSpec;
  theme?: Partial<AdTheme>;
  surfaces: Record<string, SurfaceProfile>;
  rendererMode: 'dom' | 'canvas' | 'split';
  showSafeAreas: boolean;
  showBoundingBoxes: boolean;
}

export const MultiSurfaceView: React.FC<MultiSurfaceViewProps> = ({
  spec,
  theme,
  surfaces,
  rendererMode,
  showSafeAreas,
  showBoundingBoxes,
}) => {
  const mobileLayout = resolveLayout(spec, surfaces.mobileInterstitial || Object.values(surfaces)[0]);
  const landscapeLayout = resolveLayout(spec, surfaces.mobileLandscape || Object.values(surfaces)[1]);
  const broadcastLayout = resolveLayout(spec, surfaces.broadcastLowerThird || Object.values(surfaces)[2]);
  const kioskLayout = resolveLayout(spec, surfaces.retailKiosk || Object.values(surfaces)[3]);

  const effectiveTheme = theme || spec.theme;

  return (
    <div className="w-full max-w-7xl mx-auto p-4 lg:p-8 flex flex-col gap-8">
      {/* Luxury Hero Header matching screenshot aesthetic */}
      <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-2">
        <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight font-display text-white">
          Multi-Surface Recomposition at <span className="text-peach-gradient">Scale</span>
        </h1>
        <p className="text-sm text-text-1 max-w-xl leading-relaxed">
          One declarative ad spec computed in real time across 4 fundamentally different aspect ratios with zero collisions.
        </p>
      </div>

      {/* 4-Surface Showcase Matrix Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* 1. Mobile Portrait */}
        <div className="luxury-card p-6 border border-white/10 flex flex-col items-center shadow-2xl relative overflow-hidden">
          <div className="w-full flex items-center justify-between text-xs font-semibold text-text-1 mb-4 font-mono">
            <span className="flex items-center gap-1.5 text-white font-bold">
              <Smartphone className="w-4 h-4 text-accent" /> 1. Mobile Interstitial (9:16)
            </span>
            <span className="bg-white/10 text-white px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/10">
              {mobileLayout.strategyUsed}
            </span>
          </div>
          <div className="flex justify-center py-2">
            <DeviceFrame
              layout={mobileLayout}
              theme={effectiveTheme}
              rendererMode={rendererMode}
              showSafeAreas={showSafeAreas}
              showBoundingBoxes={showBoundingBoxes}
              scale={0.78}
            />
          </div>
        </div>

        {/* 2. Mobile Landscape */}
        <div className="luxury-card p-6 border border-white/10 flex flex-col items-center shadow-2xl relative overflow-hidden">
          <div className="w-full flex items-center justify-between text-xs font-semibold text-text-1 mb-4 font-mono">
            <span className="flex items-center gap-1.5 text-white font-bold">
              <Smartphone className="w-4 h-4 text-accent-peach rotate-90" /> 2. Mobile Landscape (16:9)
            </span>
            <span className="bg-white/10 text-white px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/10">
              {landscapeLayout.strategyUsed}
            </span>
          </div>
          <div className="flex justify-center w-full py-2">
            <DeviceFrame
              layout={landscapeLayout}
              theme={effectiveTheme}
              rendererMode={rendererMode}
              showSafeAreas={showSafeAreas}
              showBoundingBoxes={showBoundingBoxes}
              scale={0.75}
            />
          </div>
        </div>

        {/* 3. Retail Kiosk */}
        <div className="luxury-card p-6 border border-white/10 flex flex-col items-center shadow-2xl relative overflow-hidden">
          <div className="w-full flex items-center justify-between text-xs font-semibold text-text-1 mb-4 font-mono">
            <span className="flex items-center gap-1.5 text-white font-bold">
              <Store className="w-4 h-4 text-mint" /> 3. Retail Kiosk (1:1 Square)
            </span>
            <span className="bg-white/10 text-white px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/10">
              {kioskLayout.strategyUsed}
            </span>
          </div>
          <div className="flex justify-center w-full py-2">
            <DeviceFrame
              layout={kioskLayout}
              theme={effectiveTheme}
              rendererMode={rendererMode}
              showSafeAreas={showSafeAreas}
              showBoundingBoxes={showBoundingBoxes}
              scale={0.42}
            />
          </div>
        </div>

        {/* 4. Broadcast Lower-Third */}
        <div className="luxury-card p-6 border border-white/10 flex flex-col items-center shadow-2xl relative overflow-hidden">
          <div className="w-full flex items-center justify-between text-xs font-semibold text-text-1 mb-4 font-mono">
            <span className="flex items-center gap-1.5 text-white font-bold">
              <Tv className="w-4 h-4 text-accent-peach" /> 4. Broadcast Lower-Third (7.68:1)
            </span>
            <span className="bg-white/10 text-white px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/10">
              {broadcastLayout.strategyUsed}
            </span>
          </div>
          <div className="flex justify-center w-full py-2">
            <DeviceFrame
              layout={broadcastLayout}
              theme={effectiveTheme}
              rendererMode={rendererMode}
              showSafeAreas={showSafeAreas}
              showBoundingBoxes={showBoundingBoxes}
              scale={0.45}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
