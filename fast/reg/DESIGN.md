# Design System Specification

## 1. Overview & Creative North Star: "The Digital Curator"
This design system is built for high-performance, focus-intensive environments where clarity meets editorial sophistication. The **Creative North Star** is "The Digital Curator"—a philosophy that treats the user interface not as a rigid software grid, but as a gallery of information. 

By utilizing deep charcoal canvases, asymmetric layout breathing room, and a dramatic typographic scale, we move away from "standard SaaS" aesthetics. We embrace **intentional depth** through tonal layering rather than borders, creating a fluid, premium experience that feels carved from a single block of obsidian.

---

## 2. Colors: Tonal Depth & The "No-Line" Rule
The palette is rooted in a monochromatic spectrum of grays and blacks, utilizing subtle blue-tinted neutrals to maintain a "cool" professional temperature.

### The "No-Line" Rule
Standard 1px borders are strictly prohibited for sectioning. Structural boundaries must be achieved through **Background Color Shifts**. 
*   **Surface Hierarchy:** A card (`surface_container_lowest`) sitting on a section (`surface_container_low`) creates a soft, natural edge.
*   **Nesting:** Use `surface_container` levels (Lowest to Highest) to define importance. For example, the Sidebar uses `surface_container_low` against the `surface` (background) to create a subtle vertical anchor without a harsh dividing line.

### Glass & Gradient Accents
To elevate the UI beyond flat design:
*   **Glassmorphism:** Use semi-transparent variants of `primary_container` with a `backdrop-blur` (20px-40px) for floating popovers or active navigation tooltips.
*   **Signature Textures:** Main CTAs or active states should utilize a subtle linear gradient from `primary` to `primary_dim` (top-to-bottom) to provide a tactile, premium feel.

| Role | Hex Code | Usage |
| :--- | :--- | :--- |
| **Background** | `#0e0e0e` | Main application canvas. |
| **Surface (Lowest)** | `#000000` | Deepest inset elements or secondary cards. |
| **Surface (High)** | `#1f2020` | Elevated cards and prominent UI blocks. |
| **Primary** | `#c6c6c6` | High-emphasis text and active state icons. |
| **Outline Variant** | `#484848` | Only for "Ghost Borders" (see Elevation). |

---

## 3. Typography: Editorial Authority
The system pairs **Manrope** for high-impact displays with **Inter** for functional reading. This creates a rhythmic contrast between geometric headers and legible, modern body copy.

*   **Display (Manrope):** Set with tight letter-spacing (-2%) for a "Custom-Built" look. Used for hero welcomes and primary dashboard headings.
*   **Body & Label (Inter):** Standardized for all data-heavy contexts.
*   **Hierarchy Note:** Use `on_surface_variant` (#acabaa) for secondary metadata to create a 3-tier information hierarchy (Primary > Secondary > Tertiary).

---

## 4. Elevation & Depth: Tonal Layering
We reject the use of traditional drop shadows in favor of **Tonal Stacking**. Depth is a function of light, and in this dark theme, light is represented by color value.

1.  **The Layering Principle:**
    *   **Base:** `surface` (#0e0e0e)
    *   **Sectioning:** `surface_container_low` (#131313)
    *   **Active Elements:** `surface_container_high` (#1f2020)
2.  **Ambient Shadows:** If a floating element (like a context menu) requires a shadow, use a large blur (32px) at 8% opacity using the `on_surface` color tinted with blue. It should feel like a "glow of darkness" rather than a hard shadow.
3.  **The "Ghost Border":** For high-density areas where color shifts aren't enough, use `outline_variant` at **10-15% opacity**. This provides a "suggestion" of a border that disappears into the background, maintaining the sleek profile.

---

## 5. Components

### Navigation Sidebar (Left-Aligned)
*   **Structure:** Minimalist icons with `label-md` text.
*   **Active State:** Use a `primary_container` background with a `md` (0.75rem) corner radius. The icon and text should transition to `primary` white/gray.
*   **Spacing:** Use `spacing.6` (1.5rem) for vertical padding between items to ensure an "uncluttered" editorial feel.

### Cards & Content Displays
*   **Constraint:** **Forbid divider lines.** Separate content using vertical white space (`spacing.4` or `spacing.5`).
*   **Styling:** Use `surface_container_high` for card backgrounds with a `lg` (1rem) corner radius. 
*   **Interactive Cards:** On hover, shift the background from `surface_container_high` to `surface_bright` and apply a "Ghost Border."

### Buttons & Inputs
*   **Primary Button:** `primary` background with `on_primary` text. Use `full` (9999px) roundedness for a modern, pill-shaped aesthetic.
*   **Input Fields:** `surface_container_lowest` background. No border. On focus, use a subtle 1px "Ghost Border" at 20% opacity.
*   **Chips:** Use for categories/tags. Background `secondary_container` with `sm` (0.25rem) roundedness to contrast against the pill-shaped buttons.

---

## 6. Do's and Don'ts

### Do
*   **DO** use whitespace as a functional tool. If an element feels cramped, increase the spacing scale rather than adding a border.
*   **DO** use `tertiary` (#fbf8fb) sparingly for "Success" or "New" notifications to provide a high-contrast pop against the dark grays.
*   **DO** align text to a strict grid, but allow card widths to be asymmetric to create visual interest.

### Don't
*   **DON'T** use 100% white (#ffffff) for body text. Use `on_surface` (#e7e5e4) to reduce eye strain and maintain the "Digital Curator" mood.
*   **DON'T** use standard Material Design "Elevation" shadows. Stick to background tonal shifts.
*   **DON'T** mix corner radii. If a card is `lg`, all internal elements must be `md` or `sm` to maintain nested harmony.