# Design System Documentation: The Engineering-Grade Interface

## 1. Overview & Creative North Star: "The Precise Monolith"
This design system is built for the high-performance developer. It moves beyond standard "dark mode" templates to create a high-fidelity environment that feels like a precision instrument. The Creative North Star is **The Precise Monolith**: an aesthetic defined by extreme structural clarity, tonal depth rather than line-work, and a rhythmic, data-dense layout.

We break the "generic SaaS" look by rejecting the 1px solid border. Instead, we use **Tonal Architecture**—layering different shades of Slate and Indigo to create hierarchy. The interface should feel like a sophisticated IDE: dense, low-friction, and unapologetically technical.

---

## 2. Colors & Surface Philosophy
The palette is rooted in `surface` (#070d1f) to provide a "Deep Dark" foundation that reduces eye strain during long coding sessions.

### Surface Hierarchy & Nesting
To achieve a premium feel, we use **Nesting** to define importance. Containers do not sit "on top" of the background; they are carved into it or extruded from it.
- **Base Layer:** `surface` (#070d1f).
- **Secondary Sectioning:** `surface_container_low` (#0c1326). Use this for sidebars or inactive panels.
- **Active Workspace:** `surface_container` (#11192e). The primary area for code editors or terminal emulators.
- **Prominent Elements:** `surface_container_highest` (#1c253e). Use this for modals or active popovers.

### The "No-Line" & "Glass" Rules
*   **The No-Line Rule:** Do not use 1px solid borders to separate major layout sections. Separation is achieved through `surface_container` shifts.
*   **Signature Textures:** For primary actions, use a subtle vertical gradient from `primary` (#a3a6ff) to `primary_dim` (#6063ee). This adds "soul" to the otherwise clinical Slate environment.
*   **Glassmorphism:** For floating menus (command palettes), use `surface_container_highest` at 80% opacity with a `20px` backdrop-blur. This keeps the developer's context visible underneath.

---

## 3. Typography: The Editorial Tech Stack
We pair the Swiss-style precision of **Inter** with the mechanical clarity of **JetBrains Mono**.

| Level | Token | Font | Size | Intent |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `display-md` | Inter (700) | 2.75rem | High-impact landing or hero headlines. |
| **Headline** | `headline-sm` | Inter (600) | 1.5rem | Dashboard section headers. |
| **Title** | `title-sm` | Inter (500) | 1rem | Card titles and modal headers. |
| **Body** | `body-md` | Inter (400) | 0.875rem | Primary reading and UI labels. |
| **Code** | `N/A` | JB Mono | 0.875rem | Terminal, code blocks, and data values. |

**Hierarchy Note:** Use `on_surface_variant` (#a5aac2) for secondary labels. The high contrast between the Slate background and the Indigo/Emerald accents provides instant scanability.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are forbidden. We use **Ambient Shadows** and **Tonal Lift**.

*   **The Layering Principle:** Place a `surface_container_lowest` (#000000) card on a `surface_container_low` (#0c1326) background to create a "recessed" look for logs or terminals.
*   **Ambient Shadows:** For floating elements, use a shadow with a 32px blur, 0px offset, at 8% opacity using the `on_primary_fixed` (#000000) token. It should feel like a soft glow of darkness.
*   **The Ghost Border:** If a border is required (e.g., input focus), use `outline_variant` (#41475b) at 20% opacity. 

---

## 5. Components: Sleek & Engineered

### Buttons & Chips
*   **Primary Button:** Background: Gradient `primary` to `primary_dim`. Text: `on_primary` (#0f00a4). Radius: `DEFAULT` (4px).
*   **Secondary/Ghost:** No background. `outline` (#6f758b) Ghost Border. Text: `primary`.
*   **Chips:** Use `secondary_container` (#006c49) with `on_secondary` (#005a3c) text for active "Running" states. Use JetBrains Mono for text within chips to reinforce the tech aesthetic.

### Input Fields & Controls
*   **Inputs:** Background: `surface_container_high`. No border. Bottom-only 2px accent of `primary` on focus.
*   **Checkboxes/Radios:** Small, 4px rounded squares. When active, use `secondary` (#69f6b8) for "Success" or "Ready" states.
*   **Cards:** Forbid divider lines. Use `spacing-8` (1.75rem) to separate content sections within a card.

### Developer-Specific Components
*   **The Status Bar:** A 24px tall strip at the very bottom using `primary_container` (#9396ff) and `on_primary_container` (#0a0081) for high-visibility system messages.
*   **The Diff-View:** Use `error_container` (#a70138) for deletions and `secondary_container` (#006c49) for additions. Backgrounds should be 15% opacity to keep text legible.

---

## 6. Do's and Don'ts

### Do
*   **Do** use `0.25rem` (4px) rounding for everything. It strikes the balance between modern and "engineered."
*   **Do** leverage JetBrains Mono for any data-heavy UI, not just code blocks.
*   **Do** use vertical white space (`spacing-12` or `16`) to create "breathing rooms" between complex data sets.

### Don't
*   **Don't** use 100% white (#FFFFFF). Always use `on_surface` (#dfe4fe) to prevent "halo" effects on dark backgrounds.
*   **Don't** use standard Lucide icons at their default weight. Use a `1.5px` or `1.25px` stroke weight to match the thin, professional aesthetic.
*   **Don't** use "Alert Red" for errors unless it's a critical system failure. Use `error_dim` (#d73357) for a more sophisticated, "low-light" warning.