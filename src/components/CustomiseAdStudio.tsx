import React, { useRef } from 'react';
import { 
  Smartphone, 
  Monitor, 
  Tv, 
  Square, 
  RotateCcw,
  Check,
  X,
  Upload,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';

export interface CustomAdParams {
  // Surface Geometry
  width: number;
  height: number;
  borderRadius: number;
  notch: boolean;

  // Typography & Narrative
  headline: string;
  headlineAccent: string;
  subline: string;

  // Hero Asset
  heroMode: 'image' | 'vector';
  heroImageUrl: string;
  heroPresetKey: string;

  // Badges & Meta
  badgeText: string;
  specCode: string;
  tag1: string;
  tag2: string;
  tag3: string;

  // Acquisition & Pricing
  currency: string;
  price: string;
  originalPrice: string;
  editionLabel: string;

  // Action CTA
  ctaLabel: string;

  // Chromatic Accent
  accentColor: string;
}

export const defaultCustomParams: CustomAdParams = {
  width: 375,
  height: 690,
  borderRadius: 48,
  notch: true,
  headline: 'Defy Gravity',
  headlineAccent: 'Future.',
  subline: 'Ultra-responsive ZoomX foam with carbon fiber flyplate & adaptive kinetic propulsion.',
  heroMode: 'image',
  heroImageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
  heroPresetKey: 'sneaker',
  badgeText: 'SURFACE SPECIMEN № 01',
  specCode: 'NIKE-KINETIC',
  tag1: 'ZOOMX FOAM',
  tag2: 'CARBON-PLATE',
  tag3: 'ULTRA-LIGHT',
  currency: '₹',
  price: '12,999',
  originalPrice: '17,995',
  editionLabel: 'LIMITED DROP',
  ctaLabel: 'ACQUIRE EDITION',
  accentColor: '#e14b2d',
};

export const heroPresets = [
  {
    id: 'sneaker',
    name: 'Kinetic Runner',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    mode: 'image' as const,
  },
  {
    id: 'headphones',
    name: 'Acoustic Monolith',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    mode: 'vector' as const,
  },
  {
    id: 'timepiece',
    name: 'Swiss Chronometer',
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
    mode: 'image' as const,
  },
  {
    id: 'spatial',
    name: 'Spatial Eyewear',
    url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=80',
    mode: 'image' as const,
  },
  {
    id: 'speaker',
    name: 'Bespoke Soundscape',
    url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80',
    mode: 'image' as const,
  },
];

export const colorPresets = [
  { name: 'Vermilion', hex: '#e14b2d' },
  { name: 'Burnt Amber', hex: '#964407' },
  { name: 'Royal Cobalt', hex: '#2563eb' },
  { name: 'Imperial Emerald', hex: '#059669' },
  { name: 'Deep Amethyst', hex: '#7c3aed' },
  { name: 'Raw Umber', hex: '#554339' },
  { name: 'Titanium Gold', hex: '#d97706' },
  { name: 'Monochrome Noir', hex: '#e5e5e5' },
];

interface CustomiseAdStudioProps {
  params: CustomAdParams;
  onChange: (updater: (prev: CustomAdParams) => CustomAdParams) => void;
  onReset: () => void;
  onClose?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
}

export const CustomiseAdStudio: React.FC<CustomiseAdStudioProps> = ({
  params,
  onChange,
  onReset,
  onClose,
  onSave,
  onCancel,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const update = <K extends keyof CustomAdParams>(key: K, value: CustomAdParams[K]) => {
    onChange((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onChange((prev) => ({
          ...prev,
          heroImageUrl: dataUrl,
          heroMode: 'image',
          heroPresetKey: 'custom-upload',
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const setSurfacePreset = (w: number, h: number, r: number, notch: boolean) => {
    onChange((prev) => ({
      ...prev,
      width: w,
      height: h,
      borderRadius: r,
      notch,
    }));
  };

  return (
    <div className="flex flex-col h-full bg-[#fbf8f4] dark:bg-[#110f0e] text-[#141210] dark:text-[#f5ede4] font-sans select-none overflow-y-auto">
      {/* Studio Header */}
      <div className="p-5 border-b border-[#e2dad2] dark:border-[#262320] flex items-center justify-between bg-[#f5efe8]/60 dark:bg-[#141210]/60 shrink-0 sticky top-0 z-10 backdrop-blur-md">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold text-[#e14b2d] uppercase tracking-monumental">Studio</span>
          </div>
          <h2 className="font-editorial text-2xl text-[#141210] dark:text-[#f5ede4] font-normal leading-tight mt-0.5">
            Customise your <span className="italic font-light text-[#e14b2d]">Ad.</span>
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onReset}
            className="w-8 h-8 rounded-sm border border-[#d6ccc2] dark:border-[#2b2622] bg-white/70 dark:bg-[#181513] text-[#5e534c] dark:text-[#c4b8ad] hover:text-[#e14b2d] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            title="Reset to Catalog Default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-sm border border-[#d6ccc2] dark:border-[#2b2622] bg-white/70 dark:bg-[#181513] text-[#5e534c] dark:text-[#c4b8ad] hover:text-[#141210] dark:hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs text-xs font-mono"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Chapters Container */}
      <div className="p-5 space-y-6 flex-1">
        {/* =========================================================================
            01 Chassis & Surface Dimensions
           ========================================================================= */}
        <section className="space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#e2dad2] dark:border-[#262320]">
            <div className="flex items-baseline space-x-2">
              <span className="text-[10px] font-mono font-bold text-[#e14b2d]">01</span>
              <h3 className="font-editorial text-base font-normal">Chassis & Surface Dimensions</h3>
            </div>
            <span className="text-[9px] font-mono text-[#73675e] dark:text-[#9e9086]">
              {params.width} × {params.height} px
            </span>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <label className="text-[9px] font-mono uppercase tracking-wider text-[#554339] dark:text-[#9e9086] block mb-1.5 font-semibold">
              Aspect Ratio Presets
            </label>
            <div className="grid grid-cols-4 gap-1.5 font-mono text-[10px]">
              <button
                onClick={() => setSurfacePreset(375, 690, 48, true)}
                className={`p-1.5 border rounded-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  params.width === 375 && params.height === 690
                    ? 'border-[#e14b2d] bg-[#e14b2d]/10 text-[#e14b2d] font-bold'
                    : 'border-[#d6ccc2] dark:border-[#2b2622] bg-white/50 dark:bg-[#181513] text-[#5e534c] dark:text-[#c4b8ad] hover:border-stone-400'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>9:16</span>
              </button>
              <button
                onClick={() => setSurfacePreset(680, 350, 36, false)}
                className={`p-1.5 border rounded-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  params.width === 680 && params.height === 350
                    ? 'border-[#e14b2d] bg-[#e14b2d]/10 text-[#e14b2d] font-bold'
                    : 'border-[#d6ccc2] dark:border-[#2b2622] bg-white/50 dark:bg-[#181513] text-[#5e534c] dark:text-[#c4b8ad] hover:border-stone-400'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>16:9</span>
              </button>
              <button
                onClick={() => setSurfacePreset(460, 460, 30, false)}
                className={`p-1.5 border rounded-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  params.width === 460 && params.height === 460
                    ? 'border-[#e14b2d] bg-[#e14b2d]/10 text-[#e14b2d] font-bold'
                    : 'border-[#d6ccc2] dark:border-[#2b2622] bg-white/50 dark:bg-[#181513] text-[#5e534c] dark:text-[#c4b8ad] hover:border-stone-400'
                }`}
              >
                <Square className="w-3.5 h-3.5" />
                <span>1:1</span>
              </button>
              <button
                onClick={() => setSurfacePreset(740, 170, 20, false)}
                className={`p-1.5 border rounded-xs flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  params.width === 740 && params.height === 170
                    ? 'border-[#e14b2d] bg-[#e14b2d]/10 text-[#e14b2d] font-bold'
                    : 'border-[#d6ccc2] dark:border-[#2b2622] bg-white/50 dark:bg-[#181513] text-[#5e534c] dark:text-[#c4b8ad] hover:border-stone-400'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>6:1</span>
              </button>
            </div>
          </div>

          {/* Direct Numeric Input Boxes (Image 1) */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#554339] dark:text-[#9e9086] block font-semibold">
                WIDTH (PX)
              </label>
              <input
                type="number"
                min="240"
                max="1200"
                value={params.width}
                onChange={(e) => update('width', Math.max(100, Number(e.target.value) || 0))}
                className="w-full bg-white/70 dark:bg-[#181513] border border-[#e2dad2] dark:border-[#262320] focus:border-[#e14b2d] rounded-xs px-3 py-2 text-sm font-mono text-[#141210] dark:text-[#f5ede4] outline-none transition-colors shadow-2xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#554339] dark:text-[#9e9086] block font-semibold">
                HEIGHT (PX)
              </label>
              <input
                type="number"
                min="100"
                max="1200"
                value={params.height}
                onChange={(e) => update('height', Math.max(80, Number(e.target.value) || 0))}
                className="w-full bg-white/70 dark:bg-[#181513] border border-[#e2dad2] dark:border-[#262320] focus:border-[#e14b2d] rounded-xs px-3 py-2 text-sm font-mono text-[#141210] dark:text-[#f5ede4] outline-none transition-colors shadow-2xs"
              />
            </div>
          </div>

          {/* Range Sliders & Alternative Controls (Image 2) */}
          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-[#554339] dark:text-[#9e9086]">Viewport Width</span>
                <span className="text-[#141210] dark:text-[#f5ede4] font-bold">{params.width} px</span>
              </div>
              <input
                type="range"
                min="280"
                max="960"
                step="5"
                value={params.width}
                onChange={(e) => update('width', Number(e.target.value))}
                className="w-full accent-[#e14b2d] cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-[#554339] dark:text-[#9e9086]">Viewport Height</span>
                <span className="text-[#141210] dark:text-[#f5ede4] font-bold">{params.height} px</span>
              </div>
              <input
                type="range"
                min="140"
                max="960"
                step="5"
                value={params.height}
                onChange={(e) => update('height', Number(e.target.value))}
                className="w-full accent-[#e14b2d] cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 items-end">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-[#554339] dark:text-[#9e9086]">Corner Radius</span>
                  <span className="text-[#141210] dark:text-[#f5ede4] font-bold">{params.borderRadius}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="56"
                  step="2"
                  value={params.borderRadius}
                  onChange={(e) => update('borderRadius', Number(e.target.value))}
                  className="w-full accent-[#e14b2d] cursor-pointer"
                />
              </div>

              <div className="flex flex-col justify-end">
                <button
                  onClick={() => update('notch', !params.notch)}
                  className={`h-9 border rounded-xs px-3 flex items-center justify-between text-[10px] font-mono transition-all cursor-pointer shadow-2xs ${
                    params.notch
                      ? 'border-[#e14b2d] bg-[#e14b2d]/10 text-[#e14b2d] font-bold'
                      : 'border-[#d6ccc2] dark:border-[#2b2622] bg-white/50 dark:bg-[#181513] text-[#73675e] dark:text-[#9e9086]'
                  }`}
                >
                  <span>Dynamic Notch</span>
                  <span className="text-[9px] uppercase font-bold">{params.notch ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            02 Hero Imagery & Visual Asset
           ========================================================================= */}
        <section className="space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#e2dad2] dark:border-[#262320]">
            <div className="flex items-baseline space-x-2">
              <span className="text-[10px] font-mono font-bold text-[#e14b2d]">02</span>
              <h3 className="font-editorial text-base font-normal">Hero Imagery & Visual Asset</h3>
            </div>
            {/* Mode Switcher */}
            <div className="flex items-center p-0.5 rounded-xs border border-[#d6ccc2] dark:border-[#2b2622] bg-white/40 dark:bg-[#181513]">
              <button
                onClick={() => update('heroMode', 'vector')}
                className={`px-2 py-0.5 text-[9px] font-mono transition-all cursor-pointer ${
                  params.heroMode === 'vector'
                    ? 'bg-[#e14b2d] text-white font-bold rounded-2xs'
                    : 'text-[#73675e] dark:text-[#9e9086]'
                }`}
              >
                Vector Icon
              </button>
              <button
                onClick={() => update('heroMode', 'image')}
                className={`px-2 py-0.5 text-[9px] font-mono transition-all cursor-pointer ${
                  params.heroMode === 'image'
                    ? 'bg-[#e14b2d] text-white font-bold rounded-2xs'
                    : 'text-[#73675e] dark:text-[#9e9086]'
                }`}
              >
                Photo Render
              </button>
            </div>
          </div>

          {/* Preset Visuals Selector */}
          <div>
            <label className="text-[9px] font-mono uppercase tracking-wider text-[#554339] dark:text-[#9e9086] block mb-1.5 font-semibold">
              Curated Specimen Presets
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {heroPresets.map((preset) => {
                const isSelected = params.heroPresetKey === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      onChange((prev) => ({
                        ...prev,
                        heroPresetKey: preset.id,
                        heroImageUrl: preset.url,
                        heroMode: preset.mode,
                      }));
                    }}
                    className={`p-2 border rounded-xs text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#e14b2d] bg-[#e14b2d]/10'
                        : 'border-[#d6ccc2] dark:border-[#2b2622] bg-white/50 dark:bg-[#181513] hover:border-stone-400'
                    }`}
                  >
                    <div className="w-full h-12 rounded-2xs overflow-hidden mb-1.5 bg-black/20 flex items-center justify-center">
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                    </div>
                    <span className={`text-[10px] font-editorial block truncate ${isSelected ? 'text-[#e14b2d] font-bold' : 'text-[#141210] dark:text-[#f5ede4]'}`}>
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upload from Device / Computer (Zero CORS, 100% Reliable) */}
          <div className="p-3 border border-dashed border-[#e14b2d]/40 rounded-xs bg-[#e14b2d]/5 dark:bg-[#e14b2d]/10 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#e14b2d] font-bold flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload from Device (Computer / Files)</span>
              </label>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2 px-3 bg-white dark:bg-[#181513] border border-[#d6ccc2] dark:border-[#332f2b] hover:border-[#e14b2d] text-[#141210] dark:text-[#f5ede4] rounded-xs text-[11px] font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs hover:bg-[#e14b2d] hover:text-white"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Choose Image from Explorer...</span>
              </button>
            </div>

            {params.heroImageUrl && params.heroImageUrl.startsWith('data:') && (
              <div className="flex items-center justify-between text-[9px] font-mono text-emerald-600 dark:text-emerald-400 pt-1">
                <span className="flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> Local photo loaded cleanly
                </span>
                <button
                  type="button"
                  onClick={() => update('heroImageUrl', '')}
                  className="text-[#73675e] dark:text-[#9e9086] hover:text-[#e14b2d] underline cursor-pointer"
                >
                  Clear Photo
                </button>
              </div>
            )}
          </div>

          {/* Custom Image URL Input */}
          <div className="space-y-1">
            <label className="text-[9px] font-mono uppercase tracking-wider text-[#554339] dark:text-[#9e9086] block font-semibold">
              Or Web Image URL (Unsplash / CDN / Direct Link)
            </label>
            <input
              type="text"
              value={params.heroImageUrl}
              onChange={(e) => {
                update('heroImageUrl', e.target.value);
                update('heroMode', 'image');
              }}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-white/70 dark:bg-[#181513] border border-[#e2dad2] dark:border-[#262320] rounded-xs px-3 py-1.5 text-xs font-mono text-[#141210] dark:text-[#f5ede4] outline-none focus:border-[#e14b2d]"
            />
          </div>
        </section>

        {/* =========================================================================
            03 Typography & Editorial Narrative
           ========================================================================= */}
        <section className="space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#e2dad2] dark:border-[#262320]">
            <div className="flex items-baseline space-x-2">
              <span className="text-[10px] font-mono font-bold text-[#e14b2d]">03</span>
              <h3 className="font-editorial text-base font-normal">Typography & Editorial Narrative</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#554339] dark:text-[#9e9086] block font-semibold">
                Primary Headline
              </label>
              <input
                type="text"
                value={params.headline}
                onChange={(e) => update('headline', e.target.value)}
                className="w-full bg-white/70 dark:bg-[#181513] border border-[#e2dad2] dark:border-[#262320] rounded-xs px-3 py-1.5 text-xs font-editorial text-[#141210] dark:text-[#f5ede4] outline-none focus:border-[#e14b2d]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#e14b2d] block font-semibold">
                Italic Accent Punchline
              </label>
              <input
                type="text"
                value={params.headlineAccent}
                onChange={(e) => update('headlineAccent', e.target.value)}
                className="w-full bg-white/70 dark:bg-[#181513] border border-[#e2dad2] dark:border-[#262320] rounded-xs px-3 py-1.5 text-xs font-editorial italic text-[#e14b2d] outline-none focus:border-[#e14b2d]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-mono uppercase tracking-wider text-[#554339] dark:text-[#9e9086] block font-semibold">
              Narrative Subtext
            </label>
            <textarea
              rows={2}
              value={params.subline}
              onChange={(e) => update('subline', e.target.value)}
              className="w-full bg-white/70 dark:bg-[#181513] border border-[#e2dad2] dark:border-[#262320] rounded-xs px-3 py-1.5 text-xs font-editorial italic text-[#554339] dark:text-[#c4b8ad] outline-none focus:border-[#e14b2d] resize-none"
            />
          </div>
        </section>

        {/* =========================================================================
            04 Feature Badges & Metadata Tags
           ========================================================================= */}
        <section className="space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#e2dad2] dark:border-[#262320]">
            <div className="flex items-baseline space-x-2">
              <span className="text-[10px] font-mono font-bold text-[#e14b2d]">04</span>
              <h3 className="font-editorial text-base font-normal">Feature Badges & Spec Pills</h3>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#554339] dark:text-[#9e9086] block font-semibold">
                Brand Specimen Title
              </label>
              <input
                type="text"
                value={params.badgeText}
                onChange={(e) => update('badgeText', e.target.value)}
                className="w-full bg-white/70 dark:bg-[#181513] border border-[#e2dad2] dark:border-[#262320] rounded-xs px-3 py-1.5 text-[11px] font-mono uppercase text-[#141210] dark:text-[#f5ede4] outline-none focus:border-[#e14b2d]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#554339] dark:text-[#9e9086] block font-semibold">
                Specimen Code Tag
              </label>
              <input
                type="text"
                value={params.specCode}
                onChange={(e) => update('specCode', e.target.value)}
                className="w-full bg-white/70 dark:bg-[#181513] border border-[#e2dad2] dark:border-[#262320] rounded-xs px-3 py-1.5 text-[11px] font-mono uppercase text-[#141210] dark:text-[#f5ede4] outline-none focus:border-[#e14b2d]"
              />
            </div>
          </div>

          <div>
            <label className="text-[9px] font-mono uppercase tracking-wider text-[#554339] dark:text-[#9e9086] block mb-1 font-semibold">
              Specification Chip Tags (Triptych)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={params.tag1}
                onChange={(e) => update('tag1', e.target.value)}
                className="w-full bg-white/70 dark:bg-[#181513] border border-[#e2dad2] dark:border-[#262320] rounded-xs px-2 py-1 text-[10px] font-mono uppercase text-center text-[#141210] dark:text-[#f5ede4] outline-none focus:border-[#e14b2d]"
              />
              <input
                type="text"
                value={params.tag2}
                onChange={(e) => update('tag2', e.target.value)}
                className="w-full bg-white/70 dark:bg-[#181513] border border-[#e14b2d]/50 bg-[#e14b2d]/5 rounded-xs px-2 py-1 text-[10px] font-mono uppercase text-center text-[#e14b2d] font-bold outline-none focus:border-[#e14b2d]"
              />
              <input
                type="text"
                value={params.tag3}
                onChange={(e) => update('tag3', e.target.value)}
                className="w-full bg-white/70 dark:bg-[#181513] border border-[#e2dad2] dark:border-[#262320] rounded-xs px-2 py-1 text-[10px] font-mono uppercase text-center text-[#141210] dark:text-[#f5ede4] outline-none focus:border-[#e14b2d]"
              />
            </div>
          </div>
        </section>

        {/* =========================================================================
            05 Acquisition Pricing & CTA Action
           ========================================================================= */}
        <section className="space-y-3">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#e2dad2] dark:border-[#262320]">
            <div className="flex items-baseline space-x-2">
              <span className="text-[10px] font-mono font-bold text-[#e14b2d]">05</span>
              <h3 className="font-editorial text-base font-normal">Acquisition Pricing & CTA Action</h3>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#554339] dark:text-[#9e9086] block font-semibold">
                Currency
              </label>
              <input
                type="text"
                value={params.currency}
                onChange={(e) => update('currency', e.target.value)}
                className="w-full bg-white/70 dark:bg-[#181513] border border-[#e2dad2] dark:border-[#262320] rounded-xs px-3 py-1.5 text-xs font-mono text-center text-[#141210] dark:text-[#f5ede4] outline-none focus:border-[#e14b2d]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#554339] dark:text-[#9e9086] block font-semibold">
                Offer Price
              </label>
              <input
                type="text"
                value={params.price}
                onChange={(e) => update('price', e.target.value)}
                className="w-full bg-white/70 dark:bg-[#181513] border border-[#e2dad2] dark:border-[#262320] rounded-xs px-3 py-1.5 text-xs font-mono font-bold text-[#141210] dark:text-[#f5ede4] outline-none focus:border-[#e14b2d]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#554339] dark:text-[#9e9086] block font-semibold">
                Regular Price
              </label>
              <input
                type="text"
                value={params.originalPrice}
                onChange={(e) => update('originalPrice', e.target.value)}
                className="w-full bg-white/70 dark:bg-[#181513] border border-[#e2dad2] dark:border-[#262320] rounded-xs px-3 py-1.5 text-xs font-mono line-through text-[#73675e] dark:text-[#887c72] outline-none focus:border-[#e14b2d]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#e14b2d] block font-semibold">
                Edition Badge Tag
              </label>
              <input
                type="text"
                value={params.editionLabel}
                onChange={(e) => update('editionLabel', e.target.value)}
                className="w-full bg-white/70 dark:bg-[#181513] border border-[#e2dad2] dark:border-[#262320] rounded-xs px-3 py-1.5 text-[11px] font-mono uppercase text-[#e14b2d] font-semibold outline-none focus:border-[#e14b2d]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-wider text-[#554339] dark:text-[#9e9086] block font-semibold">
                CTA Button Text
              </label>
              <input
                type="text"
                value={params.ctaLabel}
                onChange={(e) => update('ctaLabel', e.target.value)}
                className="w-full bg-white/70 dark:bg-[#181513] border border-[#e2dad2] dark:border-[#262320] rounded-xs px-3 py-1.5 text-[11px] font-mono uppercase font-bold text-[#141210] dark:text-[#f5ede4] outline-none focus:border-[#e14b2d]"
              />
            </div>
          </div>
        </section>

        {/* =========================================================================
            06 Chromatic Accent & Finish
           ========================================================================= */}
        <section className="space-y-3 pb-4">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#e2dad2] dark:border-[#262320]">
            <div className="flex items-baseline space-x-2">
              <span className="text-[10px] font-mono font-bold text-[#e14b2d]">06</span>
              <h3 className="font-editorial text-base font-normal">Chromatic Accent & Finish</h3>
            </div>
            <div className="flex items-center space-x-1.5">
              <div
                className="w-3.5 h-3.5 rounded-full border border-black/20 dark:border-white/20 shadow-2xs"
                style={{ backgroundColor: params.accentColor }}
              />
              <span className="text-[10px] font-mono uppercase">{params.accentColor}</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {colorPresets.map((c) => {
              const isSelected = params.accentColor.toLowerCase() === c.hex.toLowerCase();
              return (
                <button
                  key={c.hex}
                  onClick={() => update('accentColor', c.hex)}
                  className={`p-1.5 border rounded-xs flex items-center space-x-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#141210] dark:border-white bg-white dark:bg-[#1c1917] shadow-xs'
                      : 'border-[#d6ccc2] dark:border-[#2b2622] bg-white/40 dark:bg-[#181513] hover:border-stone-400'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />
                  <span className="text-[9px] font-mono truncate text-[#554339] dark:text-[#c4b8ad]">
                    {c.name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* =========================================================================
          Bottom Action Footer: Save Changes & Cancel
         ========================================================================= */}
      <div className="p-4 border-t border-[#e2dad2] dark:border-[#262320] bg-[#f5efe8]/95 dark:bg-[#141210]/95 backdrop-blur-md sticky bottom-0 z-20 flex items-center justify-between gap-3 shadow-lg shrink-0">
        <button
          id="btn-studio-cancel"
          onClick={onCancel || onClose}
          className="flex-1 py-2.5 px-4 rounded-lg border border-[#d6ccc2] dark:border-[#332f2b] bg-white/80 dark:bg-[#1a1715] text-[#5e534c] dark:text-[#c4b8ad] hover:text-[#141210] dark:hover:text-white text-xs font-mono uppercase tracking-wider font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer hover:bg-white dark:hover:bg-[#221e1a] shadow-2xs"
        >
          <X className="w-3.5 h-3.5" />
          <span>Cancel</span>
        </button>

        <button
          id="btn-studio-save"
          onClick={onSave || onClose}
          className="flex-1 py-2.5 px-4 rounded-lg border border-[#e14b2d] bg-[#e14b2d] hover:bg-[#c93e22] text-white text-xs font-mono uppercase tracking-wider font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-md active:scale-98"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  );
};
