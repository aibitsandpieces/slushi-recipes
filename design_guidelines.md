# Design Guidelines: Cocktail & SLUSHi Recipe Library

## Design Approach

**Selected Framework:** Material Design 3 with content-first adaptations

**Rationale:** Material Design provides excellent patterns for forms, data display, and grid layouts while allowing recipe imagery to shine. The system's card-based architecture perfectly suits a recipe library where visual content (photos) meets structured data (ingredients, measurements).

**Core Principles:**
- Content hierarchy: Recipe images and ingredients take visual priority
- Clarity over decoration: Every element serves the user's recipe management needs
- Consistency: Unified treatment across browse, detail, and forms

---

## Typography

**Font Family:** Inter (Google Fonts) for all text

**Hierarchy:**
- Page titles: 2.5rem, weight 700
- Recipe names (cards): 1.25rem, weight 600
- Recipe names (detail): 2rem, weight 700
- Section headers: 1.5rem, weight 600
- Body text: 1rem, weight 400
- Labels/metadata: 0.875rem, weight 500
- Input fields: 1rem, weight 400

---

## Layout System

**Spacing Units:** Tailwind units of 2, 4, 6, and 12
- Tight spacing: p-2, gap-2
- Standard spacing: p-4, gap-4, m-4
- Section spacing: p-6, gap-6
- Large spacing: p-12, gap-12

**Container Widths:**
- Main container: max-w-7xl with px-4
- Form containers: max-w-2xl
- Recipe detail: max-w-4xl

---

## Component Library

### Navigation Bar
- Full-width sticky header with subtle bottom border
- Logo/app name on left
- Search bar center (expandable on mobile)
- Add Recipe button (primary) on right
- Authentication status indicator

### Browse Grid
**Layout:**
- Responsive grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
- Gap: gap-6
- Each card with aspect-ratio-square image (crop consistently)

**Filter Bar:**
- Horizontal layout with: Type filter (All/Cocktail/SLUSHi), Tag chips (horizontal scroll), Favourites toggle
- Spacing: mb-6, gap-4
- Chips with rounded-full, px-4 py-2, clickable states

**Recipe Cards:**
- Image fills top portion (aspect-ratio-square with object-cover)
- Content section: p-4 with recipe name, type badge, tag chips (max 3 visible)
- Favourite star icon top-right corner overlay on image

### Recipe Detail Page
**Hero Section:**
- Full-width image container (max-h-96 with object-cover)
- Overlay gradient (bottom) with recipe name and favourite button
- Tag chips displayed below image

**Content Layout:**
- Two-column on desktop (lg:grid-cols-3): Ingredients (col-span-1) | Method & Notes (col-span-2)
- Single column on mobile
- Spacing: gap-12 between columns

**Ingredients Display:**
- Bordered container with p-6
- Each ingredient: py-2 with border-bottom (except last)
- For SLUSHi: Amount in ml displayed right-aligned with ingredient name left-aligned

**SLUSHi Scaling Panel:**
- Sticky sidebar component (lg:sticky lg:top-24)
- Contains: Target volume input/slider (475-1890ml range), Scale factor display, Scaled ingredients list
- Visual distinction with subtle border and p-6

**Method Steps:**
- Numbered list with counter circles
- Each step: mb-4, pl-12 (space for number)
- Counter: absolute positioned, rounded-full, w-8 h-8

### Add/Edit Recipe Form
**Layout:**
- Centered form: max-w-2xl
- Sections with mb-12 spacing
- Clear section headers (mb-6)

**Form Elements:**
- Text inputs: w-full, p-4, border, rounded-lg, focus states
- Image upload: Bordered dropzone (border-dashed) with preview
- Type selector: Segmented buttons (cocktail/slushi)
- Tag input: Chip-based input with autocomplete dropdown below
- Ingredients input: 
  - Cocktail: Textarea with line-by-line entry
  - SLUSHi: Dynamic row inputs (name + amount_ml) with Add/Remove buttons
- Method: Numbered textarea or dynamic step inputs
- Submit button: Full-width on mobile, max-w-xs on desktop, h-12

**Validation:**
- Inline error messages below fields (text-sm, mt-2)
- SLUSHi volume errors prominently displayed with icon

### Buttons
**Primary:** px-6 py-3, rounded-lg, weight 600
**Secondary:** px-6 py-3, rounded-lg, weight 600, border variant
**Icon buttons:** w-10 h-10, rounded-full
**Chip buttons:** px-4 py-2, rounded-full, text-sm

### Search & Filters
- Search input: Prominent position, w-full md:w-96, with search icon prefix
- Active filters displayed as dismissible chips below search

---

## Images

**Recipe Photos:**
- Browse grid: Square aspect ratio (1:1), consistent cropping with object-cover
- Detail page: Wide landscape (16:9 or 2:1), hero treatment with max-h-96
- Upload interface: Preview with 1:1 aspect ratio to show final appearance
- Placeholder for recipes without images: Subtle background with cocktail glass icon

**No decorative hero sections** - this is a utility app where recipe imagery provides the visual impact.

---

## Animations

Minimal and purposeful only:
- Card hover: Subtle lift (translateY(-2px))
- Button interactions: Standard states only
- Page transitions: None
- Form validation: Smooth error message appearance