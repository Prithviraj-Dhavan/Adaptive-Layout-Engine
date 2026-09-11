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

const imageCache = new Map<string, HTMLImageElement>();

function getImage(src: string, onLoad: () => void): HTMLImageElement | null {
  if (imageCache.has(src)) {
    const img = imageCache.get(src)!;
    if (img.complete) return img;
    return null;
  }

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = src;
  img.onload = () => {
    imageCache.set(src, img);
    onLoad();
  };
  return null;
}

/**
 * High-Precision Canvas 2D Rendering Backend
 */
export function renderCanvas(
  canvas: HTMLCanvasElement,
  layout: ResolvedLayout,
  options: {
    scale?: number;
    theme?: Partial<AdTheme>;
    showSafeAreas?: boolean;
    showBoundingBoxes?: boolean;
  } = {}
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { surface, elements, availableBounds } = layout;
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 2;
  const scale = options.scale || 1.0;
  const theme = options.theme;

  const primaryColor = theme?.primaryColor || '#121A15';
  const secondaryColor = theme?.secondaryColor || '#D4A373';
  const accentColor = theme?.accentColor || '#10B981';
  const backgroundColor = theme?.backgroundColor || '#F8F8F0';
  const textColor = theme?.textColor || '#121A15';

  const isLightBg =
    backgroundColor.toLowerCase() === '#f8f8f0' ||
    backgroundColor.toLowerCase() === '#fef9c3' ||
    backgroundColor.toLowerCase() === '#fff1f2' ||
    backgroundColor.toLowerCase() === '#ffffff';

  const displayWidth = surface.width * scale;
  const displayHeight = surface.height * scale;

  canvas.width = displayWidth * dpr;
  canvas.height = displayHeight * dpr;
  canvas.style.width = `${displayWidth}px`;
  canvas.style.height = `${displayHeight}px`;

  ctx.save();
  ctx.scale(dpr * scale, dpr * scale);

  // 1. Draw Background
  ctx.fillStyle = backgroundColor;
  roundRect(ctx, 0, 0, surface.width, surface.height, surface.category === 'mobile' ? 32 : 14);
  ctx.fill();

  // Ambient Radial Light
  const grad = ctx.createRadialGradient(
    surface.width * 0.25,
    surface.height * 0.2,
    10,
    surface.width * 0.5,
    surface.height * 0.5,
    surface.width * 0.8
  );
  if (isLightBg) {
    grad.addColorStop(0, hexToRgba(secondaryColor, 0.12));
    grad.addColorStop(0.6, hexToRgba(accentColor, 0.06));
    grad.addColorStop(1, hexToRgba(backgroundColor, 0));
  } else {
    grad.addColorStop(0, hexToRgba(primaryColor, 0.25));
    grad.addColorStop(0.6, hexToRgba(secondaryColor, 0.12));
    grad.addColorStop(1, hexToRgba(backgroundColor, 0));
  }
  ctx.fillStyle = grad;
  ctx.fill();

  // 2. Safe Area Outline
  if (options.showSafeAreas) {
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.strokeRect(availableBounds.x, availableBounds.y, availableBounds.width, availableBounds.height);
    ctx.setLineDash([]);
  }

  // 3. Render Elements
  const redraw = () => renderCanvas(canvas, layout, options);

  for (const el of elements) {
    renderCanvasElement(ctx, el, redraw, {
      primaryColor,
      secondaryColor,
      accentColor,
      textColor,
      isLightBg,
    });

    if (options.showBoundingBoxes) {
      ctx.strokeStyle = hexToRgba(primaryColor, 0.5);
      ctx.lineWidth = 1;
      ctx.strokeRect(el.x, el.y, el.width, el.height);
    }
  }

  ctx.restore();
}

function hexToRgba(hex: string, alpha: number): string {
  try {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch {
    return `rgba(18, 26, 21, ${alpha})`;
  }
}

function renderCanvasElement(
  ctx: CanvasRenderingContext2D,
  el: ResolvedElementLayout,
  onImageLoad: () => void,
  themeColors: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    textColor: string;
    isLightBg: boolean;
  }
) {
  const { primaryColor, accentColor, textColor, isLightBg } = themeColors;
  ctx.save();
  ctx.globalAlpha = el.opacity;

  switch (el.type) {
    case 'image': {
      const imgContent = el.content as ImageElementContent;
      const isBranding = el.role === 'branding';

      if (isBranding) {
        ctx.fillStyle = isLightBg ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)';
        roundRect(ctx, el.x, el.y, el.width, el.height, 6);
        ctx.fill();

        ctx.strokeStyle = isLightBg ? 'rgba(0, 0, 0, 0.12)' : hexToRgba(primaryColor, 0.3);
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = primaryColor;
        roundRect(ctx, el.x + 4, el.y + (el.height - 18) / 2, 18, 18, 4);
        ctx.fill();

        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🌴', el.x + 13, el.y + el.height / 2);

        ctx.font = 'bold 11px Outfit, Inter, sans-serif';
        ctx.fillStyle = textColor;
        ctx.textAlign = 'left';
        ctx.fillText(imgContent.alt || 'PALMO', el.x + 28, el.y + el.height / 2 + 3);
      } else {
        const radius = Math.max(8, el.styles?.borderRadius || 16);
        roundRect(ctx, el.x, el.y, el.width, el.height, radius);
        ctx.clip();

        const img = getImage(imgContent.src, onImageLoad);
        if (img) {
          ctx.drawImage(img, el.x, el.y, el.width, el.height);
        } else {
          ctx.fillStyle = isLightBg ? '#E2E8F0' : '#1E293B';
          ctx.fillRect(el.x, el.y, el.width, el.height);
        }
      }
      break;
    }

    case 'badge': {
      const badge = el.content as BadgeElementContent;
      ctx.fillStyle = isLightBg ? 'rgba(0, 0, 0, 0.05)' : hexToRgba(primaryColor, 0.2);
      roundRect(ctx, el.x, el.y, el.width, el.height, 9999);
      ctx.fill();

      ctx.strokeStyle = isLightBg ? 'rgba(0, 0, 0, 0.12)' : hexToRgba(primaryColor, 0.45);
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = isLightBg ? textColor : primaryColor;
      ctx.font = `bold ${Math.max(10, Math.round((el.fontSize || 11) * 0.9))}px "Plus Jakarta Sans", Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badge.text, el.x + el.width / 2, el.y + el.height / 2);
      break;
    }

    case 'text': {
      const text = el.content as TextElementContent;
      ctx.fillStyle = textColor;
      ctx.font = `800 ${Math.max(12, Math.round(el.fontSize || 20))}px Outfit, "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = el.textAlign === 'center' ? 'center' : 'left';
      ctx.textBaseline = 'top';

      const textX = el.textAlign === 'center' ? el.x + el.width / 2 : el.x;
      const lines = el.textLines || [text.text];
      const lineHeight = el.lineHeight || Math.round((el.fontSize || 20) * 1.25);

      lines.forEach((line, idx) => {
        ctx.fillText(line, textX, el.y + idx * lineHeight);
      });
      break;
    }

    case 'price-tag': {
      const price = el.content as PriceTagElementContent;
      ctx.fillStyle = isLightBg ? textColor : accentColor;
      ctx.font = `800 ${Math.max(12, Math.round(el.fontSize || 18))}px Outfit, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${price.currency}${price.amount}`, el.x, el.y + el.height / 2);
      break;
    }

    case 'button': {
      const btn = el.content as ButtonElementContent;
      ctx.fillStyle = primaryColor;
      roundRect(ctx, el.x, el.y, el.width, el.height, el.styles?.borderRadius || 14);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${Math.max(11, Math.round(el.fontSize || 14))}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(btn.label, el.x + el.width / 2, el.y + el.height / 2);
      break;
    }
  }

  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
