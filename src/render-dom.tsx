import type { FC } from 'react';
import type {
  ResolvedLayout,
  ResolvedElementLayout,
  TextElementContent,
  ImageElementContent,
  ButtonElementContent,
  BadgeElementContent,
  PriceTagElementContent,
  AdTheme,
} from './types';

interface RenderDOMProps {
  layout: ResolvedLayout;
  theme?: Partial<AdTheme>;
  showSafeAreas?: boolean;
  showBoundingBoxes?: boolean;
  interactive?: boolean;
  onElementClick?: (element: ResolvedElementLayout) => void;
  scale?: number;
}

export const RenderDOM: FC<RenderDOMProps> = ({
  layout,
  theme,
  showSafeAreas = false,
  showBoundingBoxes = false,
  interactive = true,
  onElementClick,
  scale = 1.0,
}) => {
  const { surface, elements, availableBounds } = layout;

  const primaryColor = theme?.primaryColor || '#121A15';
  const secondaryColor = theme?.secondaryColor || '#D4A373';
  const accentColor = theme?.accentColor || '#10B981';
  const backgroundColor = theme?.backgroundColor || '#F8F8F0';
  const textColor = theme?.textColor || '#121A15';
  const textMutedColor = theme?.textMutedColor || '#47554F';

  const isLightBg =
    backgroundColor.toLowerCase() === '#f8f8f0' ||
    backgroundColor.toLowerCase() === '#fef9c3' ||
    backgroundColor.toLowerCase() === '#fff1f2' ||
    backgroundColor.toLowerCase() === '#ffffff';

  return (
    <div
      className="relative overflow-hidden select-none transition-all duration-300 ease-out"
      style={{
        width: surface.width * scale,
        height: surface.height * scale,
        backgroundColor: backgroundColor,
        borderRadius:
          surface.category === 'mobile'
            ? 32 * scale
            : surface.category === 'wearable'
            ? 24 * scale
            : 16 * scale,
        boxShadow: isLightBg
          ? `0 20px 45px -10px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.08)`
          : `0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1), 0 0 40px -15px ${primaryColor}40`,
        transformOrigin: 'top left',
      }}
      data-surface-id={surface.id}
      data-strategy={layout.strategyUsed}
    >
      {/* Subtle Ambient Radial Light Mesh */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 transition-all duration-700"
        style={{
          background: isLightBg
            ? `radial-gradient(circle at 15% 15%, ${secondaryColor}20 0%, transparent 55%), radial-gradient(circle at 85% 85%, ${accentColor}15 0%, transparent 55%)`
            : `radial-gradient(circle at 20% 20%, ${primaryColor}30 0%, transparent 60%), radial-gradient(circle at 80% 80%, ${secondaryColor}20 0%, transparent 60%)`,
        }}
      />

      {/* Safe Area Debug Overlay */}
      {showSafeAreas && (
        <div
          className="absolute pointer-events-none border border-dashed border-emerald-500/70 z-50 transition-all duration-300"
          style={{
            top: availableBounds.y * scale,
            left: availableBounds.x * scale,
            width: availableBounds.width * scale,
            height: availableBounds.height * scale,
            boxShadow: 'inset 0 0 0 1px rgba(16, 185, 129, 0.25)',
          }}
        >
          <span className="absolute top-1 left-1.5 text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/90 px-1.5 py-0.5 rounded shadow">
            Safe Bounds ({availableBounds.width}×{availableBounds.height})
          </span>
        </div>
      )}

      {/* Resolved Elements Container */}
      <div className="absolute inset-0">
        {elements.map((el) => {
          const isClicked = () => onElementClick && onElementClick(el);

          return (
            <div
              key={el.id}
              onClick={interactive ? isClicked : undefined}
              className={`absolute transition-all duration-300 ease-out ${
                interactive ? 'cursor-pointer hover:brightness-105 active:scale-[0.99]' : ''
              } ${showBoundingBoxes ? 'outline outline-1 outline-indigo-500/60' : ''}`}
              style={{
                left: el.x * scale,
                top: el.y * scale,
                width: el.width * scale,
                height: el.height * scale,
                zIndex: el.zIndex,
                opacity: el.opacity,
              }}
              data-element-id={el.id}
              data-role={el.role}
              data-priority={el.priority}
            >
              {renderElementContent(el, scale, {
                primaryColor,
                secondaryColor,
                accentColor,
                textColor,
                textMutedColor,
                isLightBg,
              })}

              {showBoundingBoxes && (
                <span className="absolute top-0 right-0 text-[8px] font-mono text-indigo-200 bg-indigo-950/90 px-1 rounded-bl">
                  P{el.priority} {el.width}×{el.height}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

function renderElementContent(
  el: ResolvedElementLayout,
  scale: number,
  themeColors: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    textColor: string;
    textMutedColor: string;
    isLightBg: boolean;
  }
) {
  const scaledFontSize = Math.max(10, Math.round((el.fontSize || 14) * scale));
  const scaledLineHeight = Math.max(12, Math.round((el.lineHeight || 20) * scale));
  const { primaryColor, accentColor, textColor, textMutedColor, isLightBg } = themeColors;

  switch (el.type) {
    case 'image': {
      const img = el.content as ImageElementContent;
      const isBranding = el.role === 'branding';

      if (isBranding) {
        return (
          <div className="w-full h-full flex items-center justify-start">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-md border shadow-sm transition-all overflow-hidden"
              style={{
                backgroundColor: isLightBg ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)',
                borderColor: isLightBg ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.15)',
              }}
            >
              <div
                className="w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold text-white shadow-sm flex-shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                🌴
              </div>
              <span
                className="font-bold tracking-wider uppercase truncate"
                style={{
                  fontSize: Math.max(8.5, Math.round(scaledFontSize * 0.72)),
                  color: textColor,
                  fontFamily: "'Outfit', 'Inter', sans-serif",
                  letterSpacing: '0.03em',
                }}
              >
                {img.alt || 'PALMO'}
              </span>
            </div>
          </div>
        );
      }

      return (
        <div
          className="w-full h-full relative overflow-hidden rounded-2xl group transition-all"
          style={{
            borderRadius: Math.max(10, Math.round((el.styles?.borderRadius || 16) * scale)),
            boxShadow: isLightBg
              ? '0 10px 25px -8px rgba(0, 0, 0, 0.15)'
              : `0 12px 30px -8px rgba(0, 0, 0, 0.5)`,
          }}
        >
          <img
            src={img.src}
            alt={img.alt}
            className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      );
    }

    case 'badge': {
      const badge = el.content as BadgeElementContent;
      return (
        <div
          className="w-full h-full flex items-center justify-center px-2 py-0.5 rounded-full border shadow-sm transition-all overflow-hidden"
          style={{
            backgroundColor: isLightBg ? 'rgba(0, 0, 0, 0.05)' : `${primaryColor}25`,
            borderColor: isLightBg ? 'rgba(0, 0, 0, 0.15)' : `${primaryColor}50`,
            color: isLightBg ? textColor : '#FFFFFF',
            fontSize: Math.max(8.5, Math.round(scaledFontSize * 0.76)),
            fontWeight: 700,
            fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
            letterSpacing: '0.01em',
          }}
        >
          <span className="truncate">{badge.text}</span>
        </div>
      );
    }

    case 'text': {
      const text = el.content as TextElementContent;
      return (
        <div
          className="w-full h-full flex flex-col justify-center overflow-hidden"
          style={{
            textAlign: el.textAlign || 'left',
          }}
        >
          {/* Ultra-Clean Display Headline */}
          <h2
            className="font-extrabold tracking-tight line-clamp-2 transition-colors"
            style={{
              fontSize: scaledFontSize,
              lineHeight: `${scaledLineHeight}px`,
              color: textColor,
              fontFamily: "'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif",
              letterSpacing: '-0.02em',
            }}
          >
            {el.textLines ? el.textLines.join(' ') : text.text}
          </h2>

          {/* Subtext */}
          {text.subtext && !el.isTruncated && scaledFontSize > 13 && (
            <p
              className="mt-1 line-clamp-1 font-medium transition-colors"
              style={{
                fontSize: Math.max(10, Math.round(scaledFontSize * 0.55)),
                color: textMutedColor,
                fontFamily: "'Inter', sans-serif",
                letterSpacing: '0.01em',
              }}
            >
              {text.subtext}
            </p>
          )}
        </div>
      );
    }

    case 'price-tag': {
      const price = el.content as PriceTagElementContent;
      return (
        <div className="w-full h-full flex items-center gap-2 overflow-hidden">
          <div className="flex items-baseline gap-1 flex-shrink-0">
            <span
              className="font-black tracking-tight transition-colors"
              style={{
                fontSize: scaledFontSize,
                color: isLightBg ? textColor : accentColor,
                fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
              }}
            >
              {price.currency}
              {price.amount}
            </span>
            {price.originalAmount && (
              <span
                className="line-through opacity-50 font-medium text-xs"
                style={{
                  fontSize: Math.max(9, Math.round(scaledFontSize * 0.65)),
                  color: textMutedColor,
                }}
              >
                {price.originalAmount}
              </span>
            )}
          </div>
          {price.discountPercentage && (
            <span
              className="px-2 py-0.5 rounded-full font-bold border transition-all truncate"
              style={{
                fontSize: Math.max(9, Math.round(scaledFontSize * 0.48)),
                backgroundColor: isLightBg ? 'rgba(0, 0, 0, 0.06)' : `${accentColor}25`,
                color: isLightBg ? textColor : accentColor,
                borderColor: isLightBg ? 'rgba(0, 0, 0, 0.12)' : `${accentColor}40`,
                fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
              }}
            >
              {price.discountPercentage}
            </span>
          )}
        </div>
      );
    }

    case 'button': {
      const btn = el.content as ButtonElementContent;
      return (
        <button
          className="w-full h-full relative group overflow-hidden rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all duration-300 active:scale-95 cursor-pointer px-3"
          style={{
            backgroundColor: primaryColor,
            color: isLightBg ? '#FFFFFF' : '#FFFFFF',
            fontSize: scaledFontSize,
            borderRadius: Math.max(10, Math.round((el.styles?.borderRadius || 14) * scale)),
            boxShadow: isLightBg
              ? '0 8px 20px -4px rgba(0, 0, 0, 0.25)'
              : `0 8px 25px -4px ${primaryColor}70`,
            fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
          }}
        >
          <span className="relative z-10 font-bold tracking-wide truncate">
            {btn.label}
          </span>
          <svg
            className="w-4 h-4 transition-transform group-hover:translate-x-1 relative z-10 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{ width: scaledFontSize * 0.85, height: scaledFontSize * 0.85 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          <div className="absolute inset-0 bg-white/15 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      );
    }

    default:
      return null;
  }
}
