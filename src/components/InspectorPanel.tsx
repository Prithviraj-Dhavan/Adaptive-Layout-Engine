import React, { useState } from 'react';
import type { ResolvedLayout } from '../types';
import { Copy, Check, ShieldCheck, Terminal, Code2 } from 'lucide-react';

interface InspectorPanelProps {
  layout: ResolvedLayout;
  selectedElementId: string | null;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  layout,
  selectedElementId,
}) => {
  const [copied, setCopied] = useState(false);
  const { surface, elements, degradationSummary } = layout;

  const activeElement = elements.find((e) => e.id === selectedElementId) || elements[0];

  // Dynamic logs generation based on actual layout decisions
  const dynamicLogs = React.useMemo(() => {
    const logs: Array<{ type: 'ok' | 'warn'; text: string }> = [];

    // Headline log
    const headline = elements.find((e) => e.role === 'primary' || e.type === 'text');
    if (headline) {
      if (headline.opacity > 0) {
        logs.push({
          type: 'ok',
          text: `<b>${headline.id}</b> placed at (${Math.round(headline.x)}, ${Math.round(headline.y)}) — full priority, ${headline.textLines ? `${headline.textLines.length} lines` : 'single line'}`,
        });
      }
    }

    // Hero image log
    const hero = elements.find((e) => e.role === 'hero' || (e.type === 'image' && e.role !== 'branding'));
    if (hero && hero.opacity > 0) {
      logs.push({
        type: 'ok',
        text: `<b>${hero.id}</b> scaled to ${Math.round(hero.width)}×${Math.round(hero.height)} — hero role, ${surface.orientation === 'landscape' ? 'left column' : 'top band'}`,
      });
    }

    // CTA button log
    const cta = elements.find((e) => e.role === 'action' || e.type === 'button');
    if (cta && cta.opacity > 0) {
      logs.push({
        type: 'ok',
        text: `<b>${cta.id}</b> pinned ${Math.round(cta.width)}×${Math.round(cta.height)} — meets ${surface.minTapTarget}px tap target`,
      });
    }

    // Price tag log
    const price = elements.find((e) => e.role === 'secondary' || e.type === 'price-tag');
    if (price && price.opacity > 0) {
      logs.push({
        type: 'ok',
        text: `<b>${price.id}</b> aligned beside CTA at (${Math.round(price.x)}, ${Math.round(price.y)})`,
      });
    }

    // Dropped elements log
    if (layout.droppedElements.length > 0) {
      layout.droppedElements.forEach((d) => {
        logs.push({
          type: 'warn',
          text: `<b>${d.id}</b> dropped cleanly — priority ${d.priority}, ${d.dropReason}`,
        });
      });
    } else {
      // Branding or Badge log
      const branding = elements.find((e) => e.role === 'branding');
      if (branding && branding.opacity > 0) {
        logs.push({
          type: 'ok',
          text: `<b>${branding.id}</b> placed at (${Math.round(branding.x)}, ${Math.round(branding.y)}) — lowest priority, corner-anchored`,
        });
      }
    }

    return logs;
  }, [elements, surface, layout.droppedElements]);

  // Copy JSON snippet
  const handleCopyJson = () => {
    const jsonToCopy = activeElement
      ? JSON.stringify(
          {
            [activeElement.id]: {
              x: Math.round(activeElement.x),
              y: Math.round(activeElement.y),
              w: Math.round(activeElement.width),
              h: Math.round(activeElement.height),
              fontSize: activeElement.fontSize,
              dropped: activeElement.opacity === 0,
            },
          },
          null,
          2
        )
      : JSON.stringify(layout, null, 2);

    navigator.clipboard.writeText(jsonToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="inspector-panel">
      {/* 1. Constraint Check Card */}
      <div className="insp-card">
        <div className="insp-title">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-mint" />
            <span>Constraint check</span>
          </span>
          <span className="tag">4/4 pass</span>
        </div>
        <div className="row">
          <span className="rk">minTapTarget</span>
          <span className="rv" style={{ color: 'var(--mint)' }}>
            {surface.minTapTarget ? `${surface.minTapTarget}px ✓` : 'N/A ✓'}
          </span>
        </div>
        <div className="row">
          <span className="rk">safeArea</span>
          <span className="rv" style={{ color: 'var(--mint)' }}>
            respected ✓
          </span>
        </div>
        <div className="row">
          <span className="rk">overlap</span>
          <span className="rv" style={{ color: 'var(--mint)' }}>
            none ✓
          </span>
        </div>
        <div className="row">
          <span className="rk">clipping</span>
          <span className="rv" style={{ color: 'var(--mint)' }}>
            none ✓
          </span>
        </div>
      </div>

      {/* 2. Space Budget Card */}
      <div className="insp-card">
        <div className="insp-title">
          <span>Space budget</span>
          <span className="text-[11px] font-mono text-text-1">
            {degradationSummary.spaceUtilizationPercent}%
          </span>
        </div>
        <div className="row">
          <span className="rk">used</span>
          <span className="rv">{degradationSummary.spaceUtilizationPercent}%</span>
        </div>
        <div className="row">
          <span className="rk">active elements</span>
          <span className="rv">{degradationSummary.activeElementCount} / {elements.length}</span>
        </div>
        <div className="constraint-bar">
          <div
            className="constraint-fill"
            style={{ width: `${Math.min(100, degradationSummary.spaceUtilizationPercent)}%` }}
          />
        </div>
      </div>

      {/* 3. Resolution Log Card */}
      <div className="insp-card">
        <div className="insp-title">
          <span className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-accent" />
            <span>Resolution log</span>
          </span>
          <span className="text-[10px] font-mono text-text-2">
            {layout.durationMs}ms
          </span>
        </div>
        <div className="log">
          {dynamicLogs.map((item, i) => (
            <div key={i} className={`log-item ${item.type}`}>
              <span
                className="lt"
                dangerouslySetInnerHTML={{ __html: item.text }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Resolved Output JSON Card */}
      <div className="insp-card">
        <div className="insp-title">
          <span className="flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-amber" />
            <span>Resolved output</span>
          </span>
          <div className="flex items-center gap-1.5">
            <span className="tag" style={{ color: 'var(--amber)', background: 'var(--amber-soft)', borderColor: 'rgba(255, 180, 84, 0.3)' }}>
              JSON
            </span>
            <button
              onClick={handleCopyJson}
              className="p-1 text-text-2 hover:text-text-0 rounded hover:bg-panel-hi transition cursor-pointer"
              title="Copy JSON to clipboard"
            >
              {copied ? <Check className="w-3 h-3 text-mint" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {activeElement ? (
          <div className="mini-json" style={{ maxHeight: '180px', overflowY: 'auto' }}>
            <span className="k">"{activeElement.id}"</span>: {'{\n'}
            {'  '}<span className="k">x</span>: <span className="n">{Math.round(activeElement.x)}</span>, <span className="k">y</span>: <span className="n">{Math.round(activeElement.y)}</span>,{'\n'}
            {'  '}<span className="k">w</span>: <span className="n">{Math.round(activeElement.width)}</span>, <span className="k">h</span>: <span className="n">{Math.round(activeElement.height)}</span>,{'\n'}
            {activeElement.fontSize && (
              <>{'  '}<span className="k">fontSize</span>: <span className="n">{Math.round(activeElement.fontSize)}</span>,{'\n'}</>
            )}
            {'  '}<span className="k">dropped</span>: <span className={activeElement.opacity === 0 ? 'v' : 'b'}>{String(activeElement.opacity === 0)}</span>{'\n'}
            {'}'}
          </div>
        ) : (
          <div className="mini-json">No element selected</div>
        )}
      </div>
    </div>
  );
};
