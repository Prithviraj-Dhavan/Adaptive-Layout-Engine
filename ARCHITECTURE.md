# Architectural Whitepaper: Flam Adaptive Layout Engine

## 1. Executive Summary & Design Philosophy

Traditional responsive web design relies heavily on CSS media queries (`@media (max-width: 768px)`), CSS flex-wrap, or hardcoded lookup tables (`if (surface === "mobile") return LayoutA`). While effective for standard websites, this approach breaks down in programmatic multi-surface advertising where:
1. Surfaces vary drastically in **aspect ratios** ($0.56:1$ tall portrait to $7.68:1$ ultra-wide broadcast) rather than just linear viewport widths.
2. Surfaces impose **hard physical constraints** (e.g. broadcast 10-foot viewing distances requiring $\ge 32\text{px}$ text, retail kiosks requiring $\ge 60\text{px}$ touch targets).
3. Space constraints require **intelligent priority-based element degradation** (e.g. dropping branding logos and secondary badges) rather than clipping content or overflowing viewport bounds.

The **Flam Adaptive Layout Engine** solves this by implementing a **pure TypeScript, deterministic, constraint-based layout engine** that separates layout resolution from visual rendering.

---

## 2. System Architecture & Separation of Concerns

```
[Ad Specification (AdSpec)]        [Target Surface Profile (SurfaceProfile)]
             │                                        │
             └───────────────────┬────────────────────┘
                                 ▼
                     ┌───────────────────────┐
                     │   Constraint Solver   │
                     │    (resolveLayout)    │
                     └───────────┬───────────┘
                                 ▼
                    [Resolved Layout (Box AST)]
                     (x, y, w, h, font, audit)
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
     ┌───────────────────────┐       ┌───────────────────────┐
     │   DOM / CSS Backend   │       │   Canvas 2D Backend   │
     │  (Fluid Spring Anim)  │       │ (60 FPS Hardware Accel)│
     └───────────────────────┘       └───────────────────────┘
```

### Clean Architectural Boundaries
1. **Spec Definition Layer (`src/spec.ts`)**: Independent of surface, device, or screen. Expresses pure content intent, roles, and priority ranks ($1 \dots 5$).
2. **Surface Constraint Layer (`src/surfaces.ts`)**: Captures real physical parameters (dimensions, safe-area insets, viewing distance, touch modality, min tap target, min text size).
3. **Constraint Solver Subsystem (`src/engine/`)**: A pure mathematical solver that evaluates spatial budgets, executes text fitting, runs progressive degradation cascades, and audits collision bounds.
4. **Rendering Backends (`src/render-dom.tsx`, `src/render-canvas.ts`)**: Pure rendering consumers that take `ResolvedLayout` and draw it without executing any layout logic.

> **Extensibility Proof**:
> - Adding a new surface profile requires **zero changes** to the solver algorithm or renderers.
> - Adding a new rendering backend (e.g. WebGL, SVG, PDF, Android Canvas) requires **zero changes** to the spec or resolver.

---

## 3. Mathematical Formulation of the Constraint Solver

### 3.1 Surface Normalization
Given surface profile $S = \langle W, H, \text{safeArea}, \text{minTap}, \text{minText}, \text{viewDist}, \text{touch} \rangle$:
$$\Omega_{\text{safe}} = \left[ \text{safe.left}, W - \text{safe.right} \right] \times \left[ \text{safe.top}, H - \text{safe.bottom} \right]$$
$$W_{\text{avail}} = W - (\text{safe.left} + \text{safe.right}), \quad H_{\text{avail}} = H - (\text{safe.top} + \text{safe.bottom})$$
$$\text{Aspect Ratio } AR = \frac{W_{\text{avail}}}{H_{\text{avail}}}$$

### 3.2 Pure Geometric Strategy Selection
The structural arrangement pattern $\Psi$ is selected strictly via continuous geometric metrics:

$$\Psi(AR, H_{\text{avail}}, W_{\text{avail}}) = \begin{cases}
\text{EXTREME\_MICRO} & \text{if } H_{\text{avail}} < 130 \lor W_{\text{avail}} < 220 \\
\text{HORIZONTAL\_STRIP} & \text{if } AR \ge 3.2 \\
\text{SPLIT\_LANDSCAPE} & \text{if } 1.45 \le AR < 3.2 \\
\text{SQUARE\_BALANCED} & \text{if } 0.85 \le AR < 1.45 \\
\text{VERTICAL\_STACK} & \text{if } AR < 0.85
\end{cases}$$

### 3.3 Text Fitting & Measurement Subsystem
Let text $T$, candidate font size $f$, and container width $W_c$ be given. The text measurement function calculates the wrapped line count $L(T, f, W_c)$ and line height $h_{\text{line}}(f) = 1.28f$:
$$H_{\text{text}}(f) = L(T, f, W_c) \times h_{\text{line}}(f)$$
The engine clamps font size $f$ such that:
$$f = \max\left(\text{minText}, \min\left(\text{maxFontSize}, f_{\text{base}} \times \mu_{\text{view}} \times \sigma_{\text{plan}}\right)\right)$$
where $\mu_{\text{view}} = 1.65$ for `far` viewing distances (Broadcast) and $\sigma_{\text{plan}}$ is the degradation font scale factor.

---

## 4. Priority Degradation & Drop Logic

Let elements $E = \{e_1, e_2, \dots, e_n\}$ have priorities $P(e_i) \in \{1, 2, 3, 4, 5\}$, where $1$ is highest (mandatory) and $5$ is lowest (most droppable).

### Degradation Cascade Pipeline
When candidate total required volume $V_{\text{req}} > \Omega_{\text{safe}}$, the solver steps through the degradation stages $\Delta_0 \to \Delta_7$:

```
Stage 0 (Optimal: 100% Margins, All Active)
  │ (If Overflows)
  ▼
Stage 1 (Compress Spacing: Gaps * 0.75, Padding * 0.8)
  │ (If Overflows)
  ▼
Stage 2 (Font Tightening: Font Scale * 0.85)
  │ (If Overflows)
  ▼
Stage 3 (Hero Image Compression: Hero Scale * 0.65)
  │ (If Overflows)
  ▼
Stage 4 (Text Truncation: Subtext truncated, Badges dropped)
  │ (If Overflows)
  ▼
Stage 5 (Drop Priority 3+: Branding Logo & Badges Dropped)
  │ (If Overflows)
  ▼
Stage 6 (Drop Priority 2: Price Sub-Labels Dropped)
  │ (If Overflows)
  ▼
Stage 7 (Minimal Survival: Only Priority 1 CTA + Headline Preserved)
```

### Formal Preservation Invariant
$$\forall e \in E, \quad P(e) = 1 \implies \text{Visible}(e, \text{ResolvedLayout}) = \text{True}$$
Priority 1 elements (Primary Headline and Action CTA) are **mathematically invariant** and are never dropped regardless of constraint severity.

---

## 5. Collision & Boundary Verification Proof

To guarantee that no elements overlap or exceed surface boundaries, the engine runs an Axis-Aligned Bounding Box (AABB) intersection pass after computing coordinates:

$$\forall e_i, e_j \in E_{\text{visible}}, i \ne j: \quad \left( e_i.x + e_i.w \le e_j.x \lor e_j.x + e_j.w \le e_i.x \lor e_i.y + e_i.h \le e_j.y \lor e_j.y + e_j.h \le e_i.y \right)$$

$$\forall e_i \in E_{\text{visible}}: \quad \left( e_i.x \ge \text{safe.left} \land e_i.y \ge \text{safe.top} \land e_i.x + e_i.w \le W - \text{safe.right} \land e_i.y + e_i.h \le H - \text{safe.bottom} \right)$$

If any intersection or boundary violation occurs, it is flagged in `audit.collisionsDetected` and `audit.warnings`.

---

## 6. Live Interview Walkthrough & Explanation Guide

### Scenario 1: "Why did the Retail Kiosk CTA end up at 60px height instead of 44px?"
- **Answer**: The solver inspected `surface.minTapTarget = 60` and `surface.touchOnly = true`. During Pass 1, the action button height constraint was clamped:
  $$\text{btnHeight} = \max(\text{surface.minTapTarget}, \text{baseHeight}) = \max(60, 48) = 60\text{px}$$

### Scenario 2: "Why did the Broadcast Lower-Third text scale up to 32px?"
- **Answer**: The broadcast profile specifies `viewingDistance: "far"` and `minTextSize: 32`. Pass 1 applied the far-viewing multiplier $\mu_{\text{view}} = 1.65$ and clamped the font size to $\ge 32\text{px}$ to guarantee 10-foot viewing legibility.

### Scenario 3: "How does the engine handle a brand new 5th surface provided live?"
- **Answer**: The engine computes continuous aspect ratio $AR = W / H$ and available safe area. It selects the structural strategy $\Psi(AR)$ and runs the 8-stage degradation search. No new code or surface dictionary entries are required.
