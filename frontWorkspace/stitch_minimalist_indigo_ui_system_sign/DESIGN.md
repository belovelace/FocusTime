# Design System Specification: The Architectural Monolith

## 1. Overview & Creative North Star
This design system is built upon the "Creative North Star" of **The Architectural Monolith**. 

Inspired by the precision of Linear and the spatial flexibility of Notion, this system moves away from the "boxed-in" nature of traditional SaaS interfaces. Instead of relying on borders to contain ideas, we use structural depth, intentional asymmetry, and high-end editorial spacing. The goal is to create a digital environment that feels like a quiet, high-end workspace—professional, focused, and expensive. We achieve this by breaking the rigid grid through "breathable" layouts and treating typography as a structural element rather than just a medium for information.

## 2. Colors: Tonal Architecture
The palette is rooted in Indigo Blue and Forest Green, but its sophistication lies in the neutral "Surface" tiers. 

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to define sections or containers. Physical boundaries are an admission of failed hierarchy. Boundaries must be defined through:
1.  **Background Color Shifts:** A `surface_container_low` section sitting against a `background` page.
2.  **Negative Space:** Using the 8px grid to create "gutters" that naturally separate content.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the following tiers to define importance:
*   **Surface (Base):** Your canvas (#F8F9FA).
*   **Surface Container Lowest (#FFFFFF):** Used for primary content blocks (cards, editors) to create a subtle lift.
*   **Surface Container High/Highest:** Used for navigation sidebars or utility panels to create a sense of groundedness.

### The "Glass & Gradient" Rule
To escape the "flat" look of generic systems:
*   **CTAs:** Use a subtle linear gradient for `primary` buttons, transitioning from `primary` (#1a40c2) to `primary_container` (#3b5bdb). This adds a "jewel" quality.
*   **Floating Elements:** Modals and dropdowns must use **Glassmorphism**. Use a semi-transparent `surface` color with a `backdrop-filter: blur(20px)`. This integrates the component into the environment rather than pasting it on top.

## 3. Typography: Editorial Authority
We use **Pretendard**, a typeface designed for Korean-English harmony. In this system, typography is the architecture.

*   **Display & Headlines:** Use `display-lg` to `headline-sm` with a tighter letter-spacing (-0.02em) to create an authoritative, editorial feel. These are your anchors.
*   **Body:** `body-md` is our workhorse. Ensure a generous line-height (1.6) to reduce visual cognitive load, echoing the "low-distraction" goal.
*   **Labels:** Use `label-md` in all-caps with increased letter-spacing (+0.05em) for category headers to differentiate them from interactive text.

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are forbidden. We define depth through **Ambient Light**.

*   **The Layering Principle:** Stack `surface_container` tiers. Place a `surface_container_lowest` card on a `surface_container_low` background to create a "soft lift."
*   **Ambient Shadows:** If a floating state is required (e.g., a dragged item), use a shadow with a blur radius of 32px or higher, at 4% opacity. The shadow color must be a tinted version of `on_surface` (a deep indigo-grey) rather than pure black.
*   **The "Ghost Border" Fallback:** If accessibility requires a stroke, use the `outline_variant` token at 15% opacity. It should be felt, not seen.

## 5. Components: Precision Primitives

### Buttons
*   **Primary:** 8px radius. Gradient fill. White text. Subtle inner-glow on hover.
*   **Secondary:** No background. Use `primary` text color. On hover, apply a `surface_container_high` background.
*   **Interaction:** All buttons should have a 100ms ease-in-out transition on background-color shifts.

### Cards & Containers
*   **Standard Card:** 12px border radius. No border. Background: `surface_container_lowest`.
*   **Layout:** Forbid the use of divider lines. Separate content using the Spacing Scale (e.g., 24px or 32px vertical gaps).

### Input Fields
*   **Style:** Minimalist. No bottom border or full box. Use a subtle `surface_container_high` background with an 8px radius. 
*   **Focus State:** The background shifts to `surface_container_lowest` and a 2px `primary` "Ghost Border" (20% opacity) appears.

### Chips
*   **Filter Chips:** Use `surface_container_high` with `on_surface_variant` text. When active, shift to `secondary_container` with `on_secondary_container` (Forest Green) to signify a "growth/active" state.

### Navigation Sidebar (Notion-Inspired)
*   **Visuals:** Use `surface_container_low`. Items should have an 8px radius on hover. Use `title-sm` for navigation links to maintain a professional, high-density feel.

## 6. Do's and Don'ts

### Do:
*   **Do** embrace white space. If a layout feels "empty," it is working.
*   **Do** use asymmetrical layouts. Align text to the left while keeping action buttons floating or offset to create visual interest.
*   **Do** use the Forest Green (`secondary`) sparingly for "Success" or "Growth" metrics to maintain the professional Indigo/Grey balance.

### Don't:
*   **Don't** use 100% black text. Always use `on_surface` (#191c1d) to keep the contrast high but the "vibe" soft.
*   **Don't** use standard 1px dividers between list items. Use 8px of empty space instead.
*   **Don't** use harsh, fast animations. Everything should feel like it has physical weight and momentum.