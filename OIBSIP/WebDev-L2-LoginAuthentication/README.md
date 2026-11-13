# SecureAuth — Login Authentication System

> **Oasis Infobyte Web Development Internship — Level 2 Task**

---

> [!WARNING]
> **DEMONSTRATION ONLY — NOT FOR PRODUCTION USE**
>
> This is a **frontend-only** demonstration authentication system.
> `localStorage` and `sessionStorage` are accessible to **any JavaScript running on the page** (including browser extensions or XSS payloads). This implementation does **NOT** provide production-grade security.
>
> **Never use this pattern for real sensitive data.**
>
> A production system requires:
> - Server-side authentication (Node.js / Python / etc.)
> - `bcrypt` or `Argon2` hashing **on the server**
> - Secure, `HttpOnly`, `SameSite=Strict` cookies (not localStorage/sessionStorage)
> - HTTPS everywhere
> - CSRF protection
> - Rate limiting and brute-force protection

---

## 📋 Project Overview

**SecureAuth** is a fully functional, premium-quality Login Authentication System built entirely with vanilla HTML, CSS, and JavaScript. It demonstrates modern auth UX patterns, real cryptographic password hashing (PBKDF2 via the Web Crypto API), session management, and security-first DOM manipulation.

---

## ✨ Features

### Authentication
- **User Registration** with full validation and duplicate-email detection
- **User Login** with credential verification
- **Session management** via `sessionStorage` (auto-expires on tab close)
- **Protected dashboard** that immediately redirects unauthenticated visitors

### Security Implementation
| Feature | Implementation |
|---|---|
| Password hashing | PBKDF2-SHA-256, **100,000 iterations** |
| Random salt | 16-byte cryptographically random salt per user |
| Raw password storage | ❌ **Never stored** — hash + salt only |
| Session storage | `sessionStorage` (tab-scoped, not `localStorage`) |
| Auth redirects | `window.location.replace()` (prevents back-button bypass) |
| DOM injection | `textContent` only — **no `innerHTML`** for user data |
| Error messages | Generic ("Invalid email or password") — never reveals which field failed |

### UI / UX
- Split-screen layout: decorative branded hero panel + clean form panel
- Fully responsive (mobile-first)
- Password show/hide toggles on all password fields
- Live password strength meter with 4 requirement indicators
- Loading states on async operations (PBKDF2 hashing takes ~100ms)
- Animated alert boxes and toast notifications
- Initials-based avatars with deterministic gradient colors
- Dashboard with welcome banner, stats cards, and profile details

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 (semantic) |
| Styles | CSS3 (custom properties, Grid, Flexbox, animations) |
| Logic | Vanilla JavaScript (ES2022+) |
| Crypto | **Web Crypto API** (`crypto.subtle.deriveBits` — PBKDF2) |
| Icons | Font Awesome 6 (CDN) |
| Fonts | Google Fonts — Inter |
| Storage | `localStorage` (users), `sessionStorage` (session) |

---

## 📁 Folder Structure

```
WebDev-L2-LoginAuthentication/
├── index.html       # Login page (entry point)
├── register.html    # Registration page
├── dashboard.html   # Protected user dashboard
├── style.css        # Shared styles for all pages
├── script.js        # Shared auth logic (crypto, validation, UI)
└── README.md        # This file
```

---

## 🚀 How to Run

> No build step, no dependencies to install.

1. **Clone or download** this folder.
2. Open `index.html` in any modern browser:
   - Double-click the file, **or**
   - Use VS Code Live Server extension, **or**
   - Run a local server: `npx serve .` or `python -m http.server`
3. Register a new account → Log in → Explore the dashboard.

> [!NOTE]
> The Web Crypto API (`crypto.subtle`) requires either **HTTPS** or **localhost**. Opening via `file://` works in most browsers (Chrome, Edge, Firefox), but if it fails, use a local dev server (`npx serve .`).

---

## 🔐 Security Implementation Details

### Password Hashing Flow (Registration)
```
user password  →  generateSalt() → 16-byte random hex salt
                ↓
              hashPassword(password, salt)
                ↓
              crypto.subtle.importKey('PBKDF2')
                ↓
              crypto.subtle.deriveBits({
                iterations: 100_000,
                hash: 'SHA-256'
              })
                ↓
              256-bit hex hash
                ↓
              Store: { passwordHash, salt }  ← raw password discarded
```

### Login Verification Flow
```
submitted password + stored salt
  → hashPassword() → derived hash
  → constant-time comparison with stored hash
  → match: create session  |  no match: generic error
```

### Session Lifecycle
```
Login success  →  sessionStorage.setItem('secureauth_session', JSON)
                               ↓
Dashboard load  →  parse session  →  valid? render  |  invalid? replace('index.html')
                               ↓
Logout / tab close  →  sessionStorage cleared automatically
```

---

## ⚠️ Known Limitations

1. **Frontend-only** — Any user with DevTools can read `localStorage`.
2. **No rate limiting** — A script could attempt unlimited logins.
3. **No account recovery** — "Forgot password?" is UI only.
4. **PBKDF2 on the client** — The CPU cost is paid by the user's browser, not a server. A determined attacker who extracts the hash and salt can run PBKDF2 offline (though 100k iterations is still a meaningful barrier).
5. **No true "remember me"** — Sessions are tab-scoped by design.
6. **Email is case-insensitive at lookup but stored as entered** — consistent, but worth noting.

---

## 👨‍💻 Author

Built for the **Oasis Infobyte Web Development Internship — Level 2**.

---

*SecureAuth — demonstrating that good security UX and strong cryptographic practices aren't mutually exclusive.*
