# 🧮 Premium Calculator — Oasis Infobyte Level 2

> A sleek, fully functional browser-based calculator built as part of the **Oasis Infobyte Web Development Internship — Level 2**.

---

## 📸 Overview

A dark-themed, iOS/macOS-inspired calculator with a glass-morphism card design, vibrant orange accent colors, and smooth button interactions. It handles all standard arithmetic operations, operator chaining, keyboard input, and edge cases — all without using `eval()`.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Basic Arithmetic** | Addition, Subtraction, Multiplication, Division |
| **Operator Chaining** | Pressing an operator after another computes the pending result first |
| **Percentage** | Converts current value to percent (context-aware when mid-expression) |
| **Toggle Sign (+/−)** | Flips the sign of the current value |
| **Backspace** | Deletes the last entered digit |
| **Decimal Input** | Prevents duplicate decimal points |
| **Division by Zero** | Displays `Error` gracefully instead of crashing |
| **Large Number Handling** | Auto-switches to scientific notation for extreme values |
| **Keyboard Support** | Full numpad & keyboard shortcuts (see table below) |
| **Active Operator Highlight** | The pressed operator button stays highlighted until result is computed |
| **Responsive Design** | Works cleanly from 320 px wide upward |
| **Accessibility** | ARIA labels, roles, `aria-live` regions, visible focus rings |
| **No `eval()`** | All arithmetic is performed by a custom `safeCompute()` function |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 (semantic elements, ARIA) |
| Styling | CSS3 (Custom Properties, Grid, Glassmorphism, Animations) |
| Fonts | [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts |
| Icons | [Font Awesome 6](https://fontawesome.com/) via CDN |
| Logic | Vanilla JavaScript (ES2020, strict mode) |

---

## 📁 Folder Structure

```
WebDev-L2-Calculator/
├── index.html   ← Semantic markup, button grid, ARIA attributes
├── style.css    ← Dark theme, glassmorphism, responsive layout
├── script.js    ← State machine, arithmetic engine, event handling
└── README.md    ← This file
```

---

## 🚀 How to Run

1. Clone or download this folder.
2. Open **`index.html`** in any modern browser (Chrome, Firefox, Edge, Safari).
3. No build step, no dependencies to install — it just works.

```bash
# Optional: quick local server with Python
python -m http.server 8080
# Then visit http://localhost:8080
```

---

## 🔑 Keyboard Shortcuts

| Key(s) | Action |
|---|---|
| `0` – `9` | Enter digit |
| `.` | Decimal point |
| `+` | Addition |
| `-` | Subtraction |
| `*` | Multiplication |
| `/` | Division |
| `Enter` or `=` | Compute result |
| `Backspace` | Delete last digit |
| `Escape` | Clear all (AC) |
| `%` | Percent |

---

## 🏗 Key Implementation Details

### No `eval()`
All arithmetic is performed by `safeCompute(a, op, b)` using a plain `switch` statement over the operator symbol. This avoids the security and reliability pitfalls of `eval()`.

### State Machine Approach
A single `CalcState` object holds all relevant state:

```js
const CalcState = {
  currentInput,       // string displayed on screen
  previousInput,      // operand saved before an operator press
  operator,           // pending operator symbol
  shouldResetDisplay, // flag: next digit starts a fresh number
  expression,         // human-readable expression line
  justEvaluated,      // flag: last action was '='
};
```

Handlers read and mutate only this object; `updateDisplay()` is the single source of truth for the DOM.

### Event Delegation
A single `click` listener is attached to `#btnGrid`. It walks up the DOM with `closest('[data-action]')` to find the relevant button, reads `data-action` and `data-value`, then dispatches to the correct handler. This keeps the HTML clean (no inline `onclick`) and is efficient regardless of button count.

### Number Formatting
`formatNumber(num)` uses `toPrecision(10)` to cap significant digits, strips trailing zeros, and falls back to `toExponential(6)` for numbers that are too long for the display — keeping the UI clean without manual string parsing.

---

## 👨‍💻 Author

Built by an Oasis Infobyte Web Development Intern as part of **Level 2 Task — JavaScript Calculator**.

---

*Oasis Infobyte Internship · Web Development Track*
