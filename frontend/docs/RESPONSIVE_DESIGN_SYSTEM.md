# EasyFlashcard Responsive Design System & Architecture Guide

This document defines the responsive standards, CSS unit guidelines, and layout architecture for EasyFlashcard to ensure consistency, accessibility, and high visual polish across all screen sizes (mobile phones, tablets, laptops, standard monitors, and ultrawide displays).

---

## 1. Core Philosophy: Fluid-First & Defensive Design

Traditional responsive design relied heavily on rigid media query breakpoints that snapped layouts between static sizes (e.g. 340px tall until a media query dropped it to 280px). 

EasyFlashcard uses a **Fluid-First Architecture**:
1. **Continuous Interpolation with `clamp()`**: Components scale smoothly and continuously as the viewport changes size without jarring jumps.
2. **Defensive Layout**: Every flexible container uses defensive rules (`min-width: 0`, `overflow-wrap: break-word`, `min(100%, ...)`) to prevent content from blowing out or causing horizontal scrollbars on small screens.
3. **Viewport-Height (`dvh` / `vh`) Awareness**: Interactive tools (such as flashcard study stages) consider available vertical height so critical action controls remain visible above the fold on compact laptop displays.
4. **Touch-First Ergonomics**: Interactive elements on mobile provide $\ge 44\text{px}$ touch targets, thumb-accessible layout placement, and clean hiding of physical keyboard hints.

---

## 2. CSS Unit Decision Matrix: `px` vs `rem` vs `clamp()` vs Viewport Units

| Unit | Best For | Avoid For | Why? |
| :--- | :--- | :--- | :--- |
| **`rem`** | Typography, spacing, margins, paddings, border radii. | Fixed large layouts, micro borders. | Scales proportionally with user browser font size preferences (critical for accessibility). |
| **`clamp(min, preferred, max)`** | Card dimensions, headline font sizes, stage padding, modal widths. | Tiny UI details (icons, badges). | Provides fluid interpolation between small viewports (`360px`) and large screens (`1440px+`) with clear bounds. |
| **`%` and `min(100%, X)`** | Width constraints, responsive containers, card wrappers. | Fixed-height components without parent height. | Guarantees components will never exceed their parent container width on mobile devices. |
| **`dvh` / `vh`** | Fullscreen modals, focus mode stages, max-height constraints. | Long scrolling article content. | Respects mobile browser dynamic navigation bars while ensuring desktop cards don't force vertical scrolling. |
| **`px`** | Subtle borders (`1px solid ...`), hair-line dividers, fixed icons (`16px`, `18px`), micro-shadows. | Card widths, card heights, body font sizes, container max-widths. | Static pixels do not scale with screen DPI, browser text zoom, or responsive viewports. |

---

## 3. Breakpoint Hierarchy

Breakpoints are defined in `src/styles/_variables.scss` and accessed via mixins in `src/styles/_mixins.scss`:

```scss
$breakpoint-xs: 480px;   // Small smartphones
$breakpoint-sm: 640px;   // Standard smartphones & phablets
$breakpoint-md: 768px;   // Tablets portrait & small foldables
$breakpoint-lg: 1024px;  // Tablets landscape & compact laptops
$breakpoint-xl: 1280px;  // Desktop displays
$breakpoint-2xl: 1536px; // Large monitors & ultrawide displays
```

### SCSS Mixins Usage:
```scss
@use '@/styles/variables' as *;
@use '@/styles/mixins' as *;

.my-component {
  padding: $spacing-4;

  @include breakpoint-md {
    padding: $spacing-2;
  }
}
```

---

## 4. Component Design Patterns & Recipes

### 4.1 Fluid Flashcards (`Flashcard3D` & `StudyStage`)
Flashcards must be the focal point of the screen on ultrawide monitors without overflowing short laptop viewports:

```scss
// Fluid Card Sizing (src/styles/_variables.scss)
$card-height-lg: clamp(300px, 48vh, 500px);
$card-height-focus: clamp(380px, 60vh, 660px);

$stage-width-study: min(100%, 920px);
$stage-width-focus: min(94vw, 1080px);
```

#### Fluid Typography Inside Cards:
```scss
.flashcard-3d__text {
  // Normal mode: smoothly interpolates from 1.2rem (~19px) to 2.25rem (~36px)
  font-size: clamp(1.2rem, 1rem + 1.1vw, 2.25rem);
  font-weight: $font-weight-medium;
  line-height: 1.45;
  max-width: 92%;
  margin: 0 auto;

  &--back {
    font-size: clamp(1rem, 0.92rem + 0.55vw, 1.55rem);
    line-height: 1.6;
  }
}

// Focus mode: expands prominently for headline focus
.study-stage--focus .flashcard-3d__text {
  font-size: clamp(1.45rem, 1.2rem + 1.6vw, 2.85rem) !important;
}
```

### 4.2 Tactile Study Controls (`StudyControls`)
Interactive controls must adapt from a single-row desktop toolbar to a thumb-accessible mobile grid:

1. **Desktop (`>= 640px`)**: Single centered row with keyboard shortcut badges (`←`, `Space`, `→`, `Z`).
2. **Tablet (`460px - 640px`)**: Single centered row with keyboard badges hidden, buttons scaling down cleanly.
3. **Mobile Phones (`< 460px`)**: 2-Tier Thumb Ergonomics Grid:
   - **Row 1**: `[ ↶ Undo ]  [ ↺ Flip Card (wide center) ]  [ ★ Star ]`
   - **Row 2**: `[ ✕ Needs Practice (left half) ]  [ ✓ Mastered (right half) ]`

```scss
@media (max-width: 460px) {
  display: grid;
  grid-template-columns: 42px 1fr 1fr 42px;
  grid-template-rows: auto auto;
  gap: $spacing-2;

  &__icon-btn:first-of-type { grid-column: 1; grid-row: 1; }
  &__btn--flip              { grid-column: 2 / 4; grid-row: 1; width: 100%; }
  &__icon-btn:last-of-type  { grid-column: 4; grid-row: 1; }
  &__btn--retry             { grid-column: 1 / 3; grid-row: 2; width: 100%; }
  &__btn--master            { grid-column: 3 / 5; grid-row: 2; width: 100%; }
}
```

### 4.3 Responsive Grid Collections (Folders & Sets)
Always use defensive `minmax()` wrapped in `min(100%, ...)` to ensure grids never cause horizontal overflow on compact viewports:

```scss
// Recommended Grid Pattern
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
  gap: $spacing-4;
}
```

---

## 5. Development Checklist for New Features

Before committing new UI components, verify:
- [ ] **No Rigid Widths/Heights**: Did you use `clamp()`, `%`, or `min()` instead of static large pixel values (e.g. avoid `width: 800px; height: 400px;`)?
- [ ] **Fluid Typography**: Do titles, headings, and cards use `rem` or `clamp()` for font sizes?
- [ ] **Touch Target Size**: Are all clickable buttons and icon controls at least $44\text{px} \times 44\text{px}$ on touch devices?
- [ ] **No Horizontal Overflow**: Did you test on a simulated mobile screen (360px - 390px) to verify no horizontal scrollbar is created?
- [ ] **Keyboard Badges**: Are physical keyboard shortcut badges hidden on mobile screens?
- [ ] **Short Viewports**: Does the component function cleanly on a 768px height screen without cutting off interactive buttons?
