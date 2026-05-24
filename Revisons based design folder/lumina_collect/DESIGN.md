---
name: Lumina Collect
colors:
  surface: '#fcf8ff'
  surface-dim: '#dcd8e6'
  surface-bright: '#fcf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f2ff'
  surface-container: '#f0ecfa'
  surface-container-high: '#eae6f4'
  surface-container-highest: '#e4e0ee'
  on-surface: '#1b1b24'
  on-surface-variant: '#4b4451'
  inverse-surface: '#302f3a'
  inverse-on-surface: '#f3effd'
  outline: '#7c7482'
  outline-variant: '#cdc3d2'
  surface-tint: '#7548a9'
  primary: '#431076'
  on-primary: '#ffffff'
  primary-container: '#5b2d8e'
  on-primary-container: '#cda0ff'
  inverse-primary: '#dbb8ff'
  secondary: '#705d00'
  on-secondary: '#ffffff'
  secondary-container: '#fcd400'
  on-secondary-container: '#6e5c00'
  tertiary: '#232376'
  on-tertiary: '#ffffff'
  tertiary-container: '#3a3c8d'
  on-tertiary-container: '#aaacff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#efdbff'
  primary-fixed-dim: '#dbb8ff'
  on-primary-fixed: '#2b0053'
  on-primary-fixed-variant: '#5c2e8f'
  secondary-fixed: '#ffe16d'
  secondary-fixed-dim: '#e9c400'
  on-secondary-fixed: '#221b00'
  on-secondary-fixed-variant: '#544600'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#0b0763'
  on-tertiary-fixed-variant: '#3b3d8e'
  background: '#fcf8ff'
  on-background: '#1b1b24'
  surface-variant: '#e4e0ee'
  user-teal-start: '#26C6DA'
  user-blue-end: '#0288D1'
  status-available: '#22C55E'
  status-reserved: '#F59E0B'
  status-borrowed: '#1565C0'
  status-due: '#EF4444'
  glass-bg: rgba(255, 255, 255, 0.7)
typography:
  wordmark-lg:
    fontFamily: Pacifico
    fontSize: 34px
    fontWeight: '400'
    lineHeight: '1.2'
  wordmark-md:
    fontFamily: Pacifico
    fontSize: 24px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-display:
    fontFamily: Poppins
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Poppins
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Poppins
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Poppins
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Poppins
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.08em
  label-sm:
    fontFamily: Poppins
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
  wordmark-mobile:
    fontFamily: Pacifico
    fontSize: 20px
    fontWeight: '400'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-max: 1320px
  sidebar-width-admin: 240px
  sidebar-width-collapsed: 64px
  sidebar-width-user: 72px
---

## Brand & Style

The design system evolves the "Click & Collect" identity from a legacy institutional tool into a sophisticated, high-performance SaaS environment. It balances the authoritative weight of an academic institution with the fluid efficiency of modern library management.

The brand personality is **Trustworthy, Academic, and Efficient**. It serves two distinct audiences:
- **Librarians/Admins:** Who require high information density, clear status hierarchies, and a robust "control center" feel.
- **Users/Students:** Who need an approachable, inspiring, and frictionless browsing experience.

The chosen design style is **Corporate Modern with Glassmorphic Accents**. This approach uses structured grids and "SaaS-standard" layouts to provide reliability, while integrating translucent overlays, backdrop blurs, and refined elevation to provide a premium, contemporary feel.

- **Admin Portal:** Utilizes a "Deep Academic" palette (Purple & Gold) with structured panels and clear dividers.
- **User Portal:** Features "Ethereal Gradients" (White-to-Teal) to evoke a sense of digital exploration and lightness.

## Colors

The color strategy differentiates the administrative "Command" space from the user "Discovery" space while maintaining a unified core identity.

- **Primary & Tertiary:** Deep Purple and Navy are used for structural navigation and typography, providing high contrast and professional weight.
- **Secondary (Gold):** Used exclusively for high-priority administrative containers, data panels, and active highlights in the Admin Portal.
- **User Palette:** A radial gradient from White to Teal (`#26C6DA`) defines the User Portal, creating a distinct "light mode" environment that feels energetic and fresh.
- **Semantic Logic:** Status indicators are strictly enforced across both portals:
    - **Green:** Success/Available
    - **Amber/Gold:** Pending/Reserved
    - **Blue:** Active/Borrowed
    - **Red:** Alert/Overdue/Danger
- **Neutral (Lavender):** `#F0ECFA` serves as the global surface color for the Admin Portal, reducing eye strain compared to pure white while reinforcing the brand hue.

## Typography

The typography system pairs the expressive, humanist qualities of **Pacifico** with the geometric precision of **Poppins**.

- **Brand Identity:** Pacifico is reserved strictly for the wordmark and logo lockups. It should never be used for UI controls or data.
- **Interface & Data:** Poppins is the workhorse for all functional elements. 
    - Use **Label-Caps** for portal breadcrumbs (e.g., `/ LIBRARIAN PORTAL /`) and section headers to create a "technical" feel.
    - **Headline-Display** is used for dashboard KPIs and card titles to ensure immediate scannability.
    - **Body-MD** is the default for table data and standard descriptions.
- **Hierarchy:** Visual importance is conveyed through weight shifts (400 to 700) and letter spacing rather than excessive size changes, maintaining a compact "SaaS" density.

## Layout & Spacing

The system employs a **4px geometric grid** to ensure mathematical harmony across all components.

- **Admin Layout:** A fixed "App Shell" with a collapsible left sidebar. Content is organized into a fluid 12-column grid within the main panel. High-density data tables should use `sm` (8px) internal padding.
- **User Layout:** A more open, centered layout with a "Discovery" grid for book cards. The gap between book items is set to `md` (16px).
- **Responsive Breakpoints:**
    - **Mobile (<768px):** Sidebar collapses to a bottom navigation or hidden drawer. Margins reduce to `md` (16px).
    - **Tablet (768px - 1024px):** Sidebar collapses to icons only (`sidebar-width-collapsed`).
    - **Desktop (>1024px):** Full sidebar and max-width container (`1320px`) for the main stage.
- **Refinement:** Elements should prioritize vertical alignment. Section titles and breadcrumbs must align perfectly with the left edge of the content cards.

## Elevation & Depth

Visual hierarchy is achieved through a mix of **Tonal Layering** and **Glassmorphic Overlays**.

- **Base Layer:** The Admin Portal uses a flat Light Lavender surface.
- **Mid Layer (Cards/Panels):** UI cards use a 1px refined border (`#E0E0E0`) and a very soft ambient shadow: `0 4px 20px rgba(26, 26, 110, 0.04)`. This creates separation without looking "heavy."
- **High Layer (Overlays/Dropdowns):** Glassmorphism is applied to all floating elements. Use a background blur of `12px` and a semi-transparent white fill (`rgba(255, 255, 255, 0.8)`). A 1px translucent white border adds a "crystal" edge.
- **Active States:** Interactive elements (buttons, active sidebar links) use a subtle inner glow or a more pronounced shadow to indicate "pressability."

## Shapes

The shape language is **Softly Structured**. 

- **Containers & Cards:** Use a consistent `0.5rem` (8px) radius to feel modern but organized.
- **Interactive Elements:** Buttons and Input fields also follow the `rounded` (8px) standard.
- **Status Pills:** Status indicators (Available, Reserved, etc.) must always use a **Pill-shaped** (full radius) geometry to distinguish them from clickable buttons.
- **Refinement:** Borders should be kept thin (1px) and use the Tertiary Navy at low opacity for a "refined pen-tool" look.

## Components

- **Buttons:**
    - **Primary:** Deep Purple fill, white text, 8px radius. On hover, apply a subtle Y-axis lift (-2px).
    - **Secondary/Ghost:** Tertiary Navy outline (1.5px), transparent fill.
- **Glass Dropdowns:** Navigation and hamburger menus must use the glassmorphic style (backdrop blur + 80% opacity) with 1px white borders.
- **Cards:**
    - **Admin Data Cards:** Lavender background, Purple border-top (3px) for category identification.
    - **User Book Cards:** Pure white, soft shadow, 12px radius.
- **Inputs:** 
    - Search bars should be "pill-shaped" in the User portal but "rounded-lg" in the Admin portal.
    - Focus states use a 2px outer glow in Primary Purple.
- **Status Dots:** 10px circular indicators used in tables and legends to represent the core semantic colors (Green, Yellow, Blue, Red).
- **Navigation:**
    - **Sidebar:** Active items in Admin use a Gold background with a 4px Deep Purple left-accent bar. 
    - **Sidebar (User):** Icons use the Teal-to-Blue gradient when active.