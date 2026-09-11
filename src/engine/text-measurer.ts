/**
 * Precision Canvas & Font Measurement Subsystem
 * 
 * Provides accurate multiline text wrapping, character limits, line heights,
 * and bounding dimensions based on font sizes and container constraints.
 */

let canvasContext: CanvasRenderingContext2D | null = null;

function getCanvasContext(): CanvasRenderingContext2D | null {
  if (canvasContext) return canvasContext;
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvasContext = canvas.getContext('2d');
  }
  return canvasContext;
}

export interface TextMeasureResult {
  width: number;
  height: number;
  lines: string[];
  lineCount: number;
  lineHeight: number;
  isTruncated: boolean;
  actualFontSize: number;
}

/**
 * Measure text with wrapping and truncation
 */
export function measureText(
  text: string,
  fontSize: number,
  maxWidth: number,
  maxLines: number = 3,
  fontWeight: string = 'normal',
  fontFamily: string = 'Inter, system-ui, sans-serif'
): TextMeasureResult {
  const ctx = getCanvasContext();
  const lineHeight = Math.round(fontSize * 1.28);
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';
  let isTruncated = false;

  // Fallback if canvas context is unavailable (e.g. headless node test)
  const charWidthRatio = fontWeight === 'bold' || fontWeight === 'black' ? 0.62 : 0.54;
  const approxMeasure = (str: string) => {
    if (ctx) {
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      return ctx.measureText(str).width;
    }
    return str.length * fontSize * charWidthRatio;
  };

  const safeMaxWidth = Math.max(20, maxWidth);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = approxMeasure(testLine);

    if (testWidth <= safeMaxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        if (lines.length >= maxLines) {
          isTruncated = true;
          // Add ellipsis to the last line
          let lastLine = lines[lines.length - 1];
          while (lastLine.length > 3 && approxMeasure(lastLine + '…') > safeMaxWidth) {
            lastLine = lastLine.slice(0, -1);
          }
          lines[lines.length - 1] = lastLine + '…';
          currentLine = '';
          break;
        }
      }
      currentLine = word;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  } else if (currentLine && lines.length >= maxLines) {
    isTruncated = true;
  }

  if (lines.length === 0) {
    lines.push(text.slice(0, 20) + '…');
    isTruncated = true;
  }

  let maxLineWidth = 0;
  for (const line of lines) {
    const w = approxMeasure(line);
    if (w > maxLineWidth) maxLineWidth = w;
  }

  const totalHeight = lines.length * lineHeight;

  return {
    width: Math.min(safeMaxWidth, Math.ceil(maxLineWidth)),
    height: totalHeight,
    lines,
    lineCount: lines.length,
    lineHeight,
    isTruncated,
    actualFontSize: fontSize,
  };
}

/**
 * Iteratively finds the optimal font size to fit text within width and height bounds
 */
export function fitTextWithinBounds(
  text: string,
  maxWidth: number,
  maxHeight: number,
  minFontSize: number,
  maxFontSize: number,
  maxLines: number = 3,
  fontWeight: string = 'bold',
  fontFamily: string = 'Inter, system-ui, sans-serif'
): TextMeasureResult {
  let low = minFontSize;
  let high = maxFontSize;
  let bestResult = measureText(text, minFontSize, maxWidth, maxLines, fontWeight, fontFamily);

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const result = measureText(text, mid, maxWidth, maxLines, fontWeight, fontFamily);

    if (result.height <= maxHeight && !result.isTruncated) {
      bestResult = result;
      low = mid + 1; // Try bigger font
    } else {
      high = mid - 1; // Too big, reduce
    }
  }

  return bestResult;
}
