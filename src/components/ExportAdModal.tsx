import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Image as ImageIcon, 
  FileText,
  Loader2,
  FolderDown,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { jsPDF } from 'jspdf';
import type { CustomAdParams } from './CustomiseAdStudio';

interface ExportAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePlateName: string;
  activeDimensions: string;
  width: number;
  height: number;
  customParams: CustomAdParams;
  isDarkMode: boolean;
}

/**
 * Robust image loader that handles:
 * 1. Base64 Data URLs & Blob URLs (instant, zero CORS)
 * 2. Direct CORS-enabled URLs (Unsplash, etc.)
 * 3. External restricted CDNs / e-commerce links via fast CORS proxy fallbacks
 */
async function loadCleanImage(url: string): Promise<HTMLImageElement | null> {
  if (!url || typeof url !== 'string' || !url.trim()) return null;
  const trimmed = url.trim();

  // If already base64 data URL or blob URL, load directly
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = trimmed;
    });
  }

  const tryLoad = (src: string, withCors: boolean): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      if (withCors) {
        img.crossOrigin = 'anonymous';
      }
      const timer = setTimeout(() => {
        img.src = '';
        resolve(null);
      }, 6000);

      img.onload = () => {
        clearTimeout(timer);
        resolve(img);
      };
      img.onerror = () => {
        clearTimeout(timer);
        resolve(null);
      };
      img.src = src;
    });
  };

  // 1. Try direct with CORS
  const directImg = await tryLoad(trimmed, true);
  if (directImg && directImg.naturalWidth > 0) return directImg;

  // 2. Try fetching as Blob & converting to ObjectURL
  try {
    const res = await fetch(trimmed, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const blobImg = await tryLoad(blobUrl, false);
      if (blobImg && blobImg.naturalWidth > 0) return blobImg;
    }
  } catch {
    // direct fetch failed, try proxies
  }

  // 3. Try fast CORS proxy services that return Access-Control-Allow-Origin: *
  const proxyEndpoints = [
    `https://images.weserv.nl/?url=${encodeURIComponent(trimmed)}&output=png`,
    `https://corsproxy.io/?url=${encodeURIComponent(trimmed)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(trimmed)}`,
  ];

  for (const proxyUrl of proxyEndpoints) {
    try {
      const proxyImg = await tryLoad(proxyUrl, true);
      if (proxyImg && proxyImg.naturalWidth > 0) return proxyImg;
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Robust HTML5 Canvas renderer that creates a 100% reliable 2x Retina PNG/JPEG/PDF source
 * with no blank canvases, no CORS taints, and direct download to the user's Downloads folder.
 */
async function renderAdToCanvas(
  width: number,
  height: number,
  customParams: CustomAdParams,
  isDarkMode: boolean
): Promise<HTMLCanvasElement> {
  // Ensure document fonts are loaded before painting
  if (document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // ignore font readiness errors
    }
  }

  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(200, width * scale);
  canvas.height = Math.max(100, height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d canvas context');

  const w = canvas.width;
  const h = canvas.height;
  const ar = width / height;
  const isUltraWide = ar >= 3.0;
  const isLandscape = ar >= 1.35 && ar < 3.0;

  // Colors
  const bgColor = isDarkMode ? '#fcf9f5' : '#110e0c';
  const textColor = isDarkMode ? '#141210' : '#f8f6f0';
  const subtextColor = isDarkMode ? '#554339' : '#a89d91';
  const mutedColor = isDarkMode ? '#7d7168' : '#73675e';
  const borderColor = isDarkMode ? '#e2dad2' : '#262320';
  const chipBg = isDarkMode ? '#f0eae1' : '#1c1714';
  const chipBorder = isDarkMode ? '#d6ccc2' : '#3d342c';
  const accentColor = customParams.accentColor || '#e14b2d';
  const badgeColor = '#964407';
  const radius = Math.min(customParams.borderRadius * scale, 48 * scale);

  // Background card with rounded corners
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, radius);
  ctx.fillStyle = bgColor;
  ctx.fill();
  ctx.lineWidth = 1.5 * scale;
  ctx.strokeStyle = borderColor;
  ctx.stroke();
  ctx.clip(); // clip contents inside card

  // Dynamic Notch (if enabled and portrait/vertical)
  if (customParams.notch && !isUltraWide && !isLandscape && h >= 400 * scale) {
    const notchW = 100 * scale;
    const notchH = 18 * scale;
    const notchX = (w - notchW) / 2;
    const notchY = 10 * scale;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(notchX, notchY, notchW, notchH, 9 * scale);
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1 * scale;
    ctx.stroke();
    // Lens dot
    ctx.beginPath();
    ctx.arc(notchX + 16 * scale, notchY + notchH / 2, 3 * scale, 0, Math.PI * 2);
    ctx.fillStyle = '#1c1917';
    ctx.fill();
    ctx.restore();
  }

  // Helper to draw vector headset icon
  const drawVectorHero = (cx: number, cy: number, size: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    const s = size / 24;
    ctx.scale(s, s);
    ctx.translate(-12, -12);

    // Headband
    ctx.beginPath();
    ctx.arc(12, 12, 9, Math.PI, 0, false);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = isDarkMode ? '#1a1816' : '#f8f6f0';
    ctx.stroke();

    // Ear cups
    ctx.fillStyle = isDarkMode ? '#f0eae1' : '#1b1613';
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.4;

    // Left ear cup
    ctx.beginPath();
    ctx.roundRect(1, 14, 5, 8, 2);
    ctx.fill();
    ctx.stroke();

    // Right ear cup
    ctx.beginPath();
    ctx.roundRect(18, 14, 5, 8, 2);
    ctx.fill();
    ctx.stroke();

    // Center accent dot
    ctx.beginPath();
    ctx.arc(12, 12, 2, 0, Math.PI * 2);
    ctx.fillStyle = accentColor;
    ctx.fill();

    ctx.restore();
  };

  // Helper to load and draw photo image
  const drawHeroImage = async (cx: number, cy: number, size: number) => {
    if (customParams.heroMode === 'image' && customParams.heroImageUrl) {
      const loadedImg = await loadCleanImage(customParams.heroImageUrl);
      if (loadedImg) {
        ctx.save();
        const naturalW = loadedImg.naturalWidth || size;
        const naturalH = loadedImg.naturalHeight || size;
        const imgAr = naturalW / naturalH;
        let drawW = size;
        let drawH = size;
        if (imgAr > 1) {
          drawH = size / imgAr;
        } else {
          drawW = size * imgAr;
        }

        const imgRadius = 14 * scale;
        const imgX = cx - drawW / 2;
        const imgY = cy - drawH / 2;

        // Clip rounded rectangle for image
        ctx.beginPath();
        ctx.roundRect(imgX, imgY, drawW, drawH, imgRadius);
        ctx.clip();

        // Draw image
        ctx.drawImage(loadedImg, imgX, imgY, drawW, drawH);
        ctx.restore();

        // Glowing border around image
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(imgX, imgY, drawW, drawH, imgRadius);
        ctx.strokeStyle = `${accentColor}40`;
        ctx.lineWidth = 2 * scale;
        ctx.stroke();
        ctx.restore();
        return;
      }
    }
    // Fallback if vector or image load failed
    drawVectorHero(cx, cy, size);
  };

  // Helper to draw chips
  const drawChips = (cx: number, cy: number) => {
    const tags = [
      { text: customParams.tag1 || '48DB ANC', isAccent: false },
      { text: customParams.tag2 || 'TI-DRIVER', isAccent: true },
      { text: customParams.tag3 || 'LOSSLESS', isAccent: false },
    ];

    ctx.font = `600 ${9 * scale}px 'JetBrains Mono', monospace`;
    const totalTagWidths = tags.map((t) => ctx.measureText(t.text).width + 16 * scale);
    const spacing = 8 * scale;
    const totalWidth = totalTagWidths.reduce((a, b) => a + b, 0) + spacing * (tags.length - 1);
    let startX = cx - totalWidth / 2;

    tags.forEach((t, i) => {
      const tagW = totalTagWidths[i];
      const tagH = 18 * scale;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(startX, cy - tagH / 2, tagW, tagH, 2 * scale);
      ctx.fillStyle = t.isAccent ? (isDarkMode ? `${accentColor}18` : `${accentColor}20`) : chipBg;
      ctx.fill();
      ctx.strokeStyle = t.isAccent ? accentColor : chipBorder;
      ctx.lineWidth = 1 * scale;
      ctx.stroke();

      ctx.fillStyle = t.isAccent ? accentColor : (isDarkMode ? '#423932' : '#c4b8ad');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.text, startX + tagW / 2, cy);
      ctx.restore();

      startX += tagW + spacing;
    });
  };

  // 1. ULTRA-WIDE RIBBON LAYOUT (6:1)
  if (isUltraWide) {
    const pad = 24 * scale;
    const heroSize = Math.max(36 * scale, Math.min(h * 0.82, w * 0.20, 135 * scale));

    // Left info
    ctx.font = `700 ${9 * scale}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = badgeColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(customParams.badgeText.toUpperCase(), pad, pad + 6 * scale);

    ctx.font = `normal ${22 * scale}px 'EB Garamond', Georgia, serif`;
    ctx.fillStyle = textColor;
    ctx.fillText(customParams.headline, pad, pad + 30 * scale);

    if (customParams.headlineAccent) {
      const mainW = ctx.measureText(customParams.headline + ' ').width;
      ctx.font = `italic 300 ${22 * scale}px 'EB Garamond', Georgia, serif`;
      ctx.fillStyle = accentColor;
      ctx.fillText(customParams.headlineAccent, pad + mainW, pad + 30 * scale);
    }

    // Center Hero
    await drawHeroImage(w / 2, h / 2, heroSize);

    // Right Action & Price
    const rightPad = w - pad;
    const btnW = 160 * scale;
    const btnH = 36 * scale;
    const btnX = rightPad - btnW;
    const btnY = h / 2 - btnH / 2;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 2 * scale);
    ctx.fillStyle = accentColor;
    ctx.fill();
    ctx.font = `700 ${10 * scale}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${customParams.ctaLabel.toUpperCase()} →`, btnX + btnW / 2, btnY + btnH / 2);
    ctx.restore();

    // Price
    ctx.font = `normal ${20 * scale}px 'EB Garamond', serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`${customParams.currency}${customParams.price}`, btnX - 16 * scale, h / 2 + 4 * scale);

    ctx.font = `400 ${10 * scale}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = mutedColor;
    ctx.fillText(`${customParams.currency}${customParams.originalPrice}`, btnX - 16 * scale, h / 2 + 18 * scale);
  } 
  // 2. LANDSCAPE 2-COLUMN LAYOUT (16:9)
  else if (isLandscape) {
    const pad = 30 * scale;
    const colW = w / 2;
    const heroSize = Math.max(48 * scale, Math.min(w * 0.38, (h - 50 * scale) * 0.85, 260 * scale));

    // Left Column: Badge
    ctx.font = `700 ${9 * scale}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = badgeColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(customParams.badgeText.toUpperCase(), pad, pad + 10 * scale);

    // Headline
    ctx.font = `normal ${24 * scale}px 'EB Garamond', Georgia, serif`;
    ctx.fillStyle = textColor;
    ctx.fillText(customParams.headline, pad, pad + 38 * scale);

    if (customParams.headlineAccent) {
      ctx.font = `italic 300 ${24 * scale}px 'EB Garamond', Georgia, serif`;
      ctx.fillStyle = accentColor;
      ctx.fillText(customParams.headlineAccent, pad, pad + 64 * scale);
    }

    // Subline
    ctx.font = `italic 400 ${11 * scale}px 'EB Garamond', Georgia, serif`;
    ctx.fillStyle = subtextColor;
    ctx.fillText(customParams.subline.slice(0, 60) + '...', pad, pad + 90 * scale);

    // Bottom Left CTA & Price
    const btnW = colW - pad * 1.5;
    const btnH = 38 * scale;
    const btnY = h - pad - btnH;

    // Price Row
    ctx.font = `normal ${24 * scale}px 'EB Garamond', serif`;
    ctx.fillStyle = textColor;
    ctx.fillText(`${customParams.currency}${customParams.price}`, pad, btnY - 14 * scale);

    ctx.font = `400 ${11 * scale}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = mutedColor;
    ctx.fillText(`${customParams.currency}${customParams.originalPrice}`, pad + 60 * scale, btnY - 14 * scale);

    // Button
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(pad, btnY, btnW, btnH, 2 * scale);
    ctx.fillStyle = accentColor;
    ctx.fill();
    ctx.font = `700 ${11 * scale}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${customParams.ctaLabel.toUpperCase()} →`, pad + btnW / 2, btnY + btnH / 2);
    ctx.restore();

    // Right Column: Hero Image & Chips
    const heroCx = colW + colW / 2;
    const heroCy = h / 2 - 16 * scale;
    await drawHeroImage(heroCx, heroCy, heroSize);
    drawChips(heroCx, heroCy + heroSize / 2 + 24 * scale);
  }
  // 3. VERTICAL / SQUARE LAYOUT (9:16, 1:1, or Custom)
  else {
    const isVeryCompactH = h < 390 * scale;
    const isCompactH = h < 520 * scale;
    const pad = (isVeryCompactH ? 14 : isCompactH ? 20 : 28) * scale;
    const showSubline = h >= 480 * scale;
    const showChips = h >= 420 * scale;

    const headlineFontSize = Math.max(
      12 * scale,
      Math.min(w * 0.052, h * 0.052, (isVeryCompactH ? 16 : isCompactH ? 20 : 30) * scale)
    );

    const hasNotch = customParams.notch && h >= 480 * scale;
    const verticalHeaderH = (hasNotch ? 28 : 6) * scale + 16 * scale + headlineFontSize * 2.1 + (showSubline ? 28 * scale : 0);
    const verticalFooterH = (isVeryCompactH ? 56 : isCompactH ? 68 : 88) * scale;
    const verticalOuterPad = (isVeryCompactH ? 16 : isCompactH ? 24 : 36) * scale;
    const verticalAvailableMiddle = Math.max(20 * scale, h - verticalHeaderH - verticalFooterH - verticalOuterPad - (showChips ? 26 * scale : 0));

    const heroSize = Math.max(
      36 * scale,
      Math.min(w * 0.65, verticalAvailableMiddle * 0.82, (isVeryCompactH ? 70 : isCompactH ? 220 : 270) * scale)
    );

    // Top Badges
    const topY = pad + (hasNotch ? 16 * scale : 0);
    ctx.font = `700 ${9 * scale}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = badgeColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(customParams.badgeText.toUpperCase(), pad, topY + 12 * scale);

    ctx.font = `600 ${8 * scale}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'right';
    ctx.fillText(customParams.specCode.toUpperCase(), w - pad, topY + 12 * scale);

    // Headline
    ctx.font = `normal ${headlineFontSize}px 'EB Garamond', Georgia, serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    ctx.fillText(customParams.headline, pad, topY + 12 * scale + headlineFontSize * 1.1);

    if (customParams.headlineAccent) {
      ctx.font = `italic 300 ${headlineFontSize}px 'EB Garamond', Georgia, serif`;
      ctx.fillStyle = accentColor;
      ctx.fillText(customParams.headlineAccent, pad, topY + 12 * scale + headlineFontSize * 2.2);
    }

    // Subline
    if (showSubline) {
      ctx.font = `italic 400 ${11 * scale}px 'EB Garamond', Georgia, serif`;
      ctx.fillStyle = subtextColor;
      ctx.fillText(customParams.subline.slice(0, 55) + '...', pad, topY + 12 * scale + headlineFontSize * 2.2 + 18 * scale);
    }

    // Center Hero Image & Chips (Safe Middle Clearance)
    const heroCx = w / 2;
    const heroCy = verticalHeaderH + verticalOuterPad / 2 + verticalAvailableMiddle / 2;
    await drawHeroImage(heroCx, heroCy, heroSize);
    if (showChips) {
      drawChips(heroCx, heroCy + heroSize / 2 + 18 * scale);
    }

    // Bottom Price & CTA
    const btnW = w - pad * 2;
    const btnH = (isVeryCompactH ? 28 : isCompactH ? 36 : 44) * scale;
    const btnY = h - pad - btnH;

    // Price line
    ctx.font = `normal ${(isVeryCompactH ? 18 : isCompactH ? 22 : 24) * scale}px 'EB Garamond', serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    ctx.fillText(`${customParams.currency}${customParams.price}`, pad, btnY - 10 * scale);

    ctx.font = `400 ${10 * scale}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = mutedColor;
    ctx.fillText(`${customParams.currency}${customParams.originalPrice}`, pad + 65 * scale, btnY - 10 * scale);

    ctx.font = `600 ${8 * scale}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = accentColor;
    ctx.textAlign = 'right';
    ctx.fillText(customParams.editionLabel.toUpperCase(), w - pad, btnY - 10 * scale);

    // CTA Button
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(pad, btnY, btnW, btnH, 8 * scale);
    ctx.fillStyle = accentColor;
    ctx.fill();
    ctx.font = `700 ${(isVeryCompactH ? 10 : 11) * scale}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${customParams.ctaLabel.toUpperCase()}  →`, pad + btnW / 2, btnY + btnH / 2);
    ctx.restore();
  }

  ctx.restore();
  return canvas;
}

export const ExportAdModal: React.FC<ExportAdModalProps> = ({
  isOpen,
  onClose,
  activePlateName,
  activeDimensions,
  width,
  height,
  customParams,
  isDarkMode,
}) => {
  const [activeTab, setActiveTab] = useState<'png' | 'jpeg' | 'pdf'>('png');
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');

  // Generate live visual preview on modal open or params change
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    renderAdToCanvas(width, height, customParams, isDarkMode).then((canvas) => {
      if (isMounted) {
        setPreviewDataUrl(canvas.toDataURL('image/png'));
      }
    }).catch((err) => {
      console.warn('Preview render warning:', err);
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, width, height, customParams, isDarkMode]);

  if (!isOpen) return null;

  // Direct PNG File Download into OS Downloads folder
  const handleDownloadPng = async () => {
    setIsExporting(true);
    setDownloadSuccess(false);

    try {
      if (document.fonts) {
        try {
          await document.fonts.ready;
        } catch {
          // ignore font readiness
        }
      }

      const canvas = await renderAdToCanvas(width, height, customParams, isDarkMode);
      const filename = `AD-${(customParams.specCode || 'SPECIMEN').toUpperCase()}-${width}x${height}.png`;

      // 1. Try Native Windows Save File Picker (Chrome/Edge on Windows 10/11)
      if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
        try {
          const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png', 1.0));
          if (blob) {
            const fileHandle = await (window as any).showSaveFilePicker({
              suggestedName: filename,
              types: [
                {
                  description: 'PNG Image (*.png)',
                  accept: { 'image/png': ['.png'] },
                },
              ],
            });
            const writableStream = await fileHandle.createWritable();
            await writableStream.write(blob);
            await writableStream.close();

            setDownloadSuccess(true);
            setIsExporting(false);

            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.7 },
              colors: [customParams.accentColor, '#d6ccc2', '#ffffff'],
            });

            setTimeout(() => setDownloadSuccess(false), 3500);
            return;
          }
        } catch (saveErr: any) {
          if (saveErr.name === 'AbortError') {
            setIsExporting(false);
            return;
          }
        }
      }

      // 2. Standard Native Browser Anchor Download with Persistent Blob URL
      canvas.toBlob((blob) => {
        if (!blob) {
          const dataUrl = canvas.toDataURL('image/png', 1.0);
          const link = document.createElement('a');
          link.style.display = 'none';
          link.href = dataUrl;
          link.download = filename;
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          setTimeout(() => {
            if (document.body.contains(link)) document.body.removeChild(link);
          }, 2000);
        } else {
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.style.display = 'none';
          link.href = blobUrl;
          link.download = filename;
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();

          // Keep active for 60 seconds so Chrome writes full PNG file to Downloads folder
          setTimeout(() => {
            if (document.body.contains(link)) document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
          }, 60000);
        }

        setDownloadSuccess(true);
        setIsExporting(false);

        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.7 },
          colors: [customParams.accentColor, '#d6ccc2', '#ffffff'],
        });

        setTimeout(() => setDownloadSuccess(false), 3500);
      }, 'image/png', 1.0);
    } catch (err) {
      console.error('PNG render error:', err);
      setIsExporting(false);
    }
  };

  // Direct JPEG File Download into OS Downloads folder
  const handleDownloadJpeg = async () => {
    setIsExporting(true);
    setDownloadSuccess(false);

    try {
      if (document.fonts) {
        try {
          await document.fonts.ready;
        } catch {
          // ignore font readiness
        }
      }

      const canvas = await renderAdToCanvas(width, height, customParams, isDarkMode);
      const filename = `AD-${(customParams.specCode || 'SPECIMEN').toUpperCase()}-${width}x${height}.jpg`;

      // 1. Try Native Windows Save File Picker
      if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
        try {
          const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.95));
          if (blob) {
            const fileHandle = await (window as any).showSaveFilePicker({
              suggestedName: filename,
              types: [
                {
                  description: 'JPEG Image (*.jpg, *.jpeg)',
                  accept: { 'image/jpeg': ['.jpg', '.jpeg'] },
                },
              ],
            });
            const writableStream = await fileHandle.createWritable();
            await writableStream.write(blob);
            await writableStream.close();

            setDownloadSuccess(true);
            setIsExporting(false);

            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.7 },
              colors: [customParams.accentColor, '#d6ccc2', '#ffffff'],
            });

            setTimeout(() => setDownloadSuccess(false), 3500);
            return;
          }
        } catch (saveErr: any) {
          if (saveErr.name === 'AbortError') {
            setIsExporting(false);
            return;
          }
        }
      }

      // 2. Standard Native Browser Anchor Download with Persistent Blob URL
      canvas.toBlob((blob) => {
        if (!blob) {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
          const link = document.createElement('a');
          link.style.display = 'none';
          link.href = dataUrl;
          link.download = filename;
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          setTimeout(() => {
            if (document.body.contains(link)) document.body.removeChild(link);
          }, 2000);
        } else {
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.style.display = 'none';
          link.href = blobUrl;
          link.download = filename;
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();

          setTimeout(() => {
            if (document.body.contains(link)) document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
          }, 60000);
        }

        setDownloadSuccess(true);
        setIsExporting(false);

        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.7 },
          colors: [customParams.accentColor, '#d6ccc2', '#ffffff'],
        });

        setTimeout(() => setDownloadSuccess(false), 3500);
      }, 'image/jpeg', 0.95);
    } catch (err) {
      console.error('JPEG render error:', err);
      setIsExporting(false);
    }
  };

  // Direct PDF File Download into OS Downloads folder
  const handleDownloadPdf = async () => {
    setIsExporting(true);
    setDownloadSuccess(false);

    try {
      if (document.fonts) {
        try {
          await document.fonts.ready;
        } catch {
          // ignore font readiness
        }
      }

      const canvas = await renderAdToCanvas(width, height, customParams, isDarkMode);
      const filename = `AD-${(customParams.specCode || 'SPECIMEN').toUpperCase()}-${width}x${height}.pdf`;

      const orientation = width >= height ? 'landscape' : 'portrait';
      const pdf = new jsPDF({
        orientation,
        unit: 'px',
        format: [width, height],
        hotfixes: ['px_scaling'],
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);

      // 1. Try Native Windows Save File Picker
      if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
        try {
          const pdfBlob = pdf.output('blob');
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [
              {
                description: 'PDF Document (*.pdf)',
                accept: { 'application/pdf': ['.pdf'] },
              },
            ],
          });
          const writableStream = await fileHandle.createWritable();
          await writableStream.write(pdfBlob);
          await writableStream.close();

          setDownloadSuccess(true);
          setIsExporting(false);

          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.7 },
            colors: [customParams.accentColor, '#d6ccc2', '#ffffff'],
          });

          setTimeout(() => setDownloadSuccess(false), 3500);
          return;
        } catch (saveErr: any) {
          if (saveErr.name === 'AbortError') {
            setIsExporting(false);
            return;
          }
        }
      }

      // 2. Standard jsPDF save fallback
      pdf.save(filename);
      setDownloadSuccess(true);
      setIsExporting(false);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.7 },
        colors: [customParams.accentColor, '#d6ccc2', '#ffffff'],
      });

      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error('PDF export error:', err);
      setIsExporting(false);
    }
  };

  const currentFilename = `AD-${(customParams.specCode || 'SPECIMEN').toUpperCase()}-${width}x${height}.${
    activeTab === 'png' ? 'png' : activeTab === 'jpeg' ? 'jpg' : 'pdf'
  }`;

  const currentAction = () => {
    if (activeTab === 'png') handleDownloadPng();
    else if (activeTab === 'jpeg') handleDownloadJpeg();
    else handleDownloadPdf();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-2xl bg-[#fcf9f5] dark:bg-[#141210] border border-[#e2dad2] dark:border-[#2b2622] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#e2dad2] dark:border-[#262320] flex items-center justify-between bg-[#f5efe8]/60 dark:bg-[#181513]/60 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#e14b2d]/10 text-[#e14b2d] flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold text-[#e14b2d] uppercase tracking-wider">
                  Export Ad Asset
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 border border-[#d6ccc2] dark:border-[#332f2b] text-[#73675e] dark:text-[#9e9086]">
                  {activePlateName} • {activeDimensions}
                </span>
              </div>
              <h2 className="font-editorial text-xl text-[#141210] dark:text-[#f5ede4] font-normal leading-tight mt-0.5">
                Download Prepared <span className="italic text-[#e14b2d]">Ad Creative.</span>
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#d6ccc2] dark:border-[#2b2622] bg-white/70 dark:bg-[#181513] text-[#5e534c] dark:text-[#c4b8ad] hover:text-[#e14b2d] dark:hover:text-white hover:border-[#e14b2d] dark:hover:border-stone-600 flex items-center justify-center transition-all cursor-pointer shadow-2xs text-xs font-mono"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation: PNG, JPEG, PDF */}
        <div className="flex border-b border-[#e2dad2] dark:border-[#262320] bg-[#f5efe8]/40 dark:bg-[#110f0e] px-5 pt-2 gap-2 text-xs font-mono">
          <button
            id="tab-png-export"
            onClick={() => setActiveTab('png')}
            className={`pb-2 px-3 border-b-2 font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'png'
                ? 'border-[#e14b2d] text-[#e14b2d]'
                : 'border-transparent text-[#73675e] dark:text-[#a89d91] hover:text-[#e14b2d] dark:hover:text-[#f5ede4] hover:bg-black/5 dark:hover:bg-white/5 rounded-t-sm'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>High-Res PNG</span>
          </button>
          <button
            id="tab-jpeg-export"
            onClick={() => setActiveTab('jpeg')}
            className={`pb-2 px-3 border-b-2 font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'jpeg'
                ? 'border-[#e14b2d] text-[#e14b2d]'
                : 'border-transparent text-[#73675e] dark:text-[#a89d91] hover:text-[#e14b2d] dark:hover:text-[#f5ede4] hover:bg-black/5 dark:hover:bg-white/5 rounded-t-sm'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Optimized JPEG</span>
          </button>
          <button
            id="tab-pdf-export"
            onClick={() => setActiveTab('pdf')}
            className={`pb-2 px-3 border-b-2 font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'pdf'
                ? 'border-[#e14b2d] text-[#e14b2d]'
                : 'border-transparent text-[#73675e] dark:text-[#a89d91] hover:text-[#e14b2d] dark:hover:text-[#f5ede4] hover:bg-black/5 dark:hover:bg-white/5 rounded-t-sm'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Print-Ready PDF</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <div className="space-y-4">
            {/* Visual Thumbnail Live Preview Box */}
            <div className="p-4 border border-[#e2dad2] dark:border-[#262320] rounded-lg bg-black/5 dark:bg-black/30 flex flex-col items-center justify-center">
              <span className="text-[10px] font-mono text-[#73675e] dark:text-[#887c72] uppercase tracking-wider mb-2.5 self-start">
                Live Render Preview ({width} × {height} px)
              </span>
              <div className="max-h-56 max-w-full flex items-center justify-center overflow-hidden rounded-md shadow-md border border-white/20">
                {previewDataUrl ? (
                  <img 
                    src={previewDataUrl} 
                    alt="Ad Preview" 
                    className="max-h-52 object-contain"
                  />
                ) : (
                  <div className="h-40 w-40 flex items-center justify-center text-xs font-mono text-stone-400">
                    Generating Preview...
                  </div>
                )}
              </div>
            </div>

            {/* Action Box */}
            <div className="p-4 border border-dashed border-[#d6ccc2] dark:border-[#332f2b] rounded-lg bg-white/40 dark:bg-[#181513]/40 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-3 text-left">
                <div className="w-10 h-10 rounded-full bg-[#e14b2d]/10 text-[#e14b2d] flex items-center justify-center shrink-0">
                  <FolderDown className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-mono font-bold text-[#141210] dark:text-[#f5ede4]">
                    Saves to your Downloads folder:
                  </h4>
                  <span className="text-[11px] font-mono text-[#e14b2d] font-semibold block truncate max-w-xs sm:max-w-sm">
                    {currentFilename}
                  </span>
                </div>
              </div>

              <button
                id="btn-download-export-action"
                onClick={currentAction}
                disabled={isExporting}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#e14b2d] hover:bg-[#c93e22] text-white text-xs font-mono uppercase tracking-wider font-bold rounded-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md active:scale-98 disabled:opacity-50 shrink-0"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving File...</span>
                  </>
                ) : downloadSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Downloaded!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>
                      {activeTab === 'png' ? 'Download PNG' : activeTab === 'jpeg' ? 'Download JPEG' : 'Download PDF'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Clean Modal Footer */}
        <div className="p-4 border-t border-[#e2dad2] dark:border-[#262320] bg-[#f5efe8]/60 dark:bg-[#141210]/60 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-[#d6ccc2] dark:border-[#2b2622] rounded-xs text-xs font-mono text-[#5e534c] dark:text-[#c4b8ad] hover:text-[#e14b2d] dark:hover:text-white hover:border-[#e14b2d] dark:hover:border-stone-600 bg-white/50 dark:bg-[#181513] cursor-pointer transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
