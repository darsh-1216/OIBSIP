# Marie Curie — Tribute Page

> **Oasis Infobyte Web Development Internship · Level 2 Task**
> A premium editorial tribute page honouring Marie Curie, physicist, chemist, and two-time Nobel Prize laureate.

---

## 📋 Overview

This project is a fully responsive, editorial-quality **tribute page** dedicated to **Marie Curie** (1867–1934) — the Polish-French scientist who pioneered the study of radioactivity, discovered the elements polonium and radium, and became the first person in history to win Nobel Prizes in two separate scientific disciplines (Physics, 1903; Chemistry, 1911).

The page was built as the **Level 2 Web Development task** for the Oasis Infobyte internship programme, demonstrating semantic HTML5, modern CSS architecture (custom properties, CSS Grid, Flexbox, animations), and thoughtful UI/UX design.

---

## ✨ Features

| Feature | Detail |
|---|---|
| **Sticky Navigation** | Transparent on load → blur-backdrop + dark fill on scroll |
| **Mobile Nav Toggle** | Hamburger button opens/closes the link list on small screens |
| **Full-viewport Hero** | Dark-navy background, radial glows, subtle star-field, animated entrance |
| **Circular Portrait** | Gold-gradient frame around the Wikimedia Commons photo; elegant "MC" fallback |
| **About Section** | 4 original biography paragraphs + sticky "Quick Facts" sidebar card |
| **Timeline** | 10-entry vertical timeline, alternating left/right on desktop, single-column on mobile; hover-lift cards |
| **Quotes Section** | 3 notable quotes in stylised dark blockquotes with decorative oversized quotation marks |
| **Legacy Cards** | 6-card CSS Grid showcasing her lasting scientific and cultural impact, with animated top-border on hover |
| **Responsive Design** | Mobile-first; tested breakpoints at 480 px, 768 px, 1024 px |
| **CSS Animations** | `fadeUp` entrance animation; scroll-indicator bounce; card hover lifts; gold border reveal |
| **Accessibility** | Semantic HTML5 landmarks, `aria-label`, `aria-expanded`, `:focus-visible` ring |
| **Image Fallback** | `onerror` handler swaps broken `<img>` for a styled "MC" initials div |
| **Smooth Scroll** | `scroll-behavior: smooth` on `<html>` |
| **No Broken URLs** | Hero image uses the real Wikimedia Commons CDN URL; all other visuals are CSS-only |

---

## 🛠 Technologies Used

- **HTML5** — Semantic elements (`<nav>`, `<header>`, `<section>`, `<article>`, `<figure>`, `<footer>`, `<blockquote>`)
- **CSS3**
  - Custom Properties (design tokens for colours, fonts, spacing, radii, shadows)
  - CSS Grid & Flexbox
  - `clamp()` for fluid typography
  - `@keyframes` animations
  - `backdrop-filter` for the scrolled-nav glass effect
  - `scroll-behavior: smooth`
  - Media queries (mobile-first)
- **Google Fonts** — *Playfair Display* (serif headings) + *Lato* (clean body copy)
- **Vanilla JavaScript** (< 25 lines)
  - Navbar scroll-class toggle
  - Mobile nav open/close toggle

---

## 🎨 Design Decisions

### Colour Palette

| Role | Value | Usage |
|---|---|---|
| Hero background | `#0f0f23` / `#1a1a2e` | Deep dark navy for the hero |
| Gold accent | `#c9a84c` / `#e2c880` | Badges, borders, year pills, decorations |
| Cream / off-white | `#fefdf8` / `#f8f4f0` | About & Legacy sections — warm, readable |
| Light grey | `#f0eff5` | Timeline section — subtle contrast |
| Dark (Quotes) | `#0f0f23` | Quotes section — dramatic, editorial |

### Typography

- **Playfair Display** — a high-contrast editorial serif that pairs elegantly with historical/scientific subject matter. Used for all headings, the hero title, and quote text.
- **Lato** — a humanist sans-serif chosen for body copy for its exceptional legibility at small sizes and clean rhythm alongside Playfair Display.

### Layout Approach

- **Mobile-first** — base styles target small screens; `min-width` breakpoints progressively enhance layout.
- **CSS Grid for sections** — the about grid, legacy grid, and quotes grid all use `auto-fit / minmax` to reflow naturally.
- **Sticky fact card** — on desktop the Quick Facts card stays visible as the user reads the bio paragraphs (`position: sticky; top: 90px`).
- **Alternating timeline** — classic editorial timeline with centre spine; collapses to a left-spine single-column on mobile.

---

## 🖼 Image Sources & Credits

| Asset | Source | Licence |
|---|---|---|
| Marie Curie portrait (c. 1920) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Marie_Curie_c1920.jpg) | Public Domain |
| All other visuals | CSS-only (gradients, shadows, emoji icons) | — |

---

## 🚀 How to Run

No build step or server is needed — this is a plain static site.

1. **Clone / download** the `WebDev-L2-TributePage` folder.
2. Open `index.html` in any modern browser:
   - Double-click the file in your file explorer, **or**
   - Use VS Code's **Live Server** extension for hot reload, **or**
   - Run `npx serve .` in the project folder for a local HTTP server.
3. The page works entirely offline except for:
   - The **Google Fonts** stylesheet (requires internet — degrades gracefully to system serif/sans-serif if offline).
   - The **hero portrait** from Wikimedia Commons (the "MC" fallback `div` displays if the image fails to load).

---

## 📱 Responsive Design Notes

| Breakpoint | Behaviour |
|---|---|
| **≥ 1025 px** (desktop) | Full two-column about grid, alternating timeline, 3-column footer, 3-column quotes grid |
| **769 – 1024 px** (tablet) | Single-column about (fact card unsticky), 2-column footer, alternating timeline |
| **≤ 768 px** (mobile) | Hamburger nav, single-column timeline (left-spine), single-column legacy & quotes grids, 1-column footer |
| **≤ 480 px** (small mobile) | Stacked hero badges, reduced font sizes, tighter spacing |

---

## 📄 Licence & Attribution

All **biographical text** is original writing created for this project — it does not reproduce Wikipedia or other sources verbatim.

Factual historical information drawn from:
- Nobel Prize official biography: https://www.nobelprize.org/prizes/physics/1903/marie-curie/biographical/
- American Physical Society: https://www.aps.org/publications/apsnews/200112/history.cfm
- Institut Curie: https://www.curie.fr/en

&copy; 2024 — Built for the **Oasis Infobyte** Web Development Level 2 Internship.
