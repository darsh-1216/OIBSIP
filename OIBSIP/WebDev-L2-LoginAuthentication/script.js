// ============================================================
//  SecureAuth — script.js
//  Complete authentication logic using Web Crypto API
// ============================================================

'use strict';

// ── Constants ────────────────────────────────────────────────
const USERS_KEY   = 'secureauth_users';
const SESSION_KEY = 'secureauth_session';

// ── Crypto Helpers ───────────────────────────────────────────

/**
 * Generate a cryptographically random 16-byte hex salt.
 * @returns {Promise<string>} hex-encoded salt
 */
async function generateSalt() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Derive a 256-bit key from password + salt using PBKDF2-SHA-256.
 * @param {string} password  plain-text password
 * @param {string} salt      hex salt from generateSalt()
 * @returns {Promise<string>} hex-encoded hash
 */
async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name:       'PBKDF2',
      salt:       encoder.encode(salt),
      iterations: 100000,
      hash:       'SHA-256',
    },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(bits), b => b.toString(16).padStart(2, '0')).join('');
}

// ── LocalStorage Helpers ─────────────────────────────────────

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

// ── UI Helpers ───────────────────────────────────────────────

/**
 * Display an error alert inside a container element.
 * Uses textContent — never innerHTML — to prevent XSS.
 */
function showError(containerId, message) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.className = 'alert alert-error';
  el.innerHTML = '';                      // clear first
  const icon = document.createElement('i');
  icon.className = 'fa-solid fa-circle-exclamation';
  const txt = document.createTextNode(message);
  el.appendChild(icon);
  el.appendChild(txt);
  el.classList.remove('hidden');
}

/**
 * Display a success alert inside a container element.
 */
function showSuccess(containerId, message) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.className = 'alert alert-success';
  el.innerHTML = '';
  const icon = document.createElement('i');
  icon.className = 'fa-solid fa-circle-check';
  const txt = document.createTextNode(message);
  el.appendChild(icon);
  el.appendChild(txt);
  el.classList.remove('hidden');
}

function hideAlert(containerId) {
  const el = document.getElementById(containerId);
  if (el) el.classList.add('hidden');
}

/**
 * Toggle loading state on a submit button.
 * @param {string}  buttonId
 * @param {boolean} isLoading
 */
function setLoading(buttonId, isLoading) {
  const btn = document.getElementById(buttonId);
  if (!btn) return;
  if (isLoading) {
    btn.classList.add('is-loading');
    btn.disabled = true;
  } else {
    btn.classList.remove('is-loading');
    btn.disabled = false;
  }
}

/**
 * Generate a deterministic background color from a user's name.
 * Returns one of several vibrant gradients.
 * @param {string} name
 * @returns {string} CSS gradient string
 */
function generateAvatarColor(name) {
  const gradients = [
    'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'linear-gradient(135deg, #3b82f6, #6366f1)',
    'linear-gradient(135deg, #ec4899, #8b5cf6)',
    'linear-gradient(135deg, #14b8a6, #3b82f6)',
    'linear-gradient(135deg, #f59e0b, #ef4444)',
    'linear-gradient(135deg, #22c55e, #14b8a6)',
    'linear-gradient(135deg, #f97316, #ec4899)',
    'linear-gradient(135deg, #8b5cf6, #ec4899)',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

/**
 * Get initials from a full name (up to 2 chars).
 * @param {string} name
 * @returns {string}
 */
function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

// ── Toast Notification ───────────────────────────────────────

function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icon = document.createElement('i');
  icon.className = type === 'success'
    ? 'fa-solid fa-circle-check'
    : 'fa-solid fa-circle-exclamation';
  const txt = document.createTextNode(message);
  toast.appendChild(icon);
  toast.appendChild(txt);
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, 3500);
}

// ── Validation Helpers ───────────────────────────────────────

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function checkPasswordRequirements(password) {
  return {
    length:    password.length >= 8,
    number:    /\d/.test(password),
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
  };
}

// ── Password Toggle ──────────────────────────────────────────

function attachPasswordToggle(inputId, toggleId) {
  const input  = document.getElementById(inputId);
  const toggle = document.getElementById(toggleId);
  if (!input || !toggle) return;
  toggle.addEventListener('click', () => {
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    const icon = toggle.querySelector('i');
    if (icon) {
      icon.className = show ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
    }
  });
}

// ── Password Strength Meter (register page) ──────────────────

function initStrengthMeter(passwordInputId) {
  const passwordInput = document.getElementById(passwordInputId);
  if (!passwordInput) return;

  passwordInput.addEventListener('input', () => {
    updateStrengthMeter(passwordInput.value);
  });
}

function updateStrengthMeter(password) {
  const reqs = checkPasswordRequirements(password);
  const metCount = Object.values(reqs).filter(Boolean).length;

  // Update requirement icons
  const reqEls = {
    length:    document.getElementById('req-length'),
    number:    document.getElementById('req-number'),
    uppercase: document.getElementById('req-uppercase'),
    lowercase: document.getElementById('req-lowercase'),
  };
  for (const [key, el] of Object.entries(reqEls)) {
    if (!el) continue;
    const icon = el.querySelector('.req-icon');
    if (reqs[key]) {
      el.classList.add('met');
      if (icon) icon.className = 'req-icon fa-solid fa-circle-check';
    } else {
      el.classList.remove('met');
      if (icon) icon.className = 'req-icon fa-solid fa-circle';
    }
  }

  // Strength level: 0-4 met count
  const bars      = document.querySelectorAll('.strength-bar');
  const labelEl   = document.getElementById('strength-label');

  const levels = [
    { label: '', color: '' },
    { label: 'Weak',      color: 'weak'   },
    { label: 'Fair',      color: 'fair'   },
    { label: 'Good',      color: 'good'   },
    { label: 'Very Strong', color: 'strong' },
  ];

  bars.forEach((bar, i) => {
    bar.className = 'strength-bar';
    if (password.length > 0 && i < metCount) {
      bar.classList.add(levels[metCount].color);
    }
  });

  if (labelEl) {
    labelEl.textContent = password.length > 0 ? `Strength: ${levels[metCount].label}` : '';
  }
}

// ── Page Initializers ────────────────────────────────────────

// ---- LOGIN PAGE ----
function initLoginPage() {
  attachPasswordToggle('login-password', 'toggle-login-password');

  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert('login-alert');

    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      showError('login-alert', 'Please fill in all fields.');
      return;
    }

    setLoading('login-btn', true);

    try {
      const users  = getUsers();
      const user   = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      // Delay slightly to prevent timing attacks even on the wrong-user path
      await new Promise(r => setTimeout(r, 300));

      if (!user) {
        // Still hash to avoid leaking timing info
        await hashPassword(password, await generateSalt());
        showError('login-alert', 'Invalid email or password. Please try again.');
        return;
      }

      const hash = await hashPassword(password, user.salt);

      if (hash !== user.passwordHash) {
        showError('login-alert', 'Invalid email or password. Please try again.');
        return;
      }

      // Successful login — create session
      const session = {
        userId:  user.id,
        name:    user.name,
        email:   user.email,
        loginAt: new Date().toISOString(),
        createdAt: user.createdAt,
      };
      saveSession(session);
      window.location.replace('dashboard.html');

    } catch (err) {
      console.error('Login error:', err);
      showError('login-alert', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading('login-btn', false);
    }
  });
}

// ---- REGISTER PAGE ----
function initRegisterPage() {
  attachPasswordToggle('reg-password', 'toggle-reg-password');
  attachPasswordToggle('reg-confirm',  'toggle-reg-confirm');
  initStrengthMeter('reg-password');

  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert('register-alert');

    const name     = document.getElementById('reg-name').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm  = document.getElementById('reg-confirm').value;

    // Client-side validation
    if (!name || !email || !password || !confirm) {
      showError('register-alert', 'Please fill in all fields.');
      return;
    }
    if (!isValidEmail(email)) {
      showError('register-alert', 'Please enter a valid email address.');
      return;
    }
    const reqs = checkPasswordRequirements(password);
    if (!reqs.length) {
      showError('register-alert', 'Password must be at least 8 characters.');
      return;
    }
    if (!reqs.number) {
      showError('register-alert', 'Password must contain at least one number.');
      return;
    }
    if (password !== confirm) {
      showError('register-alert', 'Passwords do not match.');
      return;
    }

    setLoading('register-btn', true);

    try {
      const users = getUsers();

      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        showError('register-alert', 'An account with this email already exists.');
        return;
      }

      const salt         = await generateSalt();
      const passwordHash = await hashPassword(password, salt);

      const newUser = {
        id:           crypto.randomUUID(),
        name,
        email,
        passwordHash,
        salt,
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      saveUsers(users);

      showSuccess('register-alert', 'Account created! Redirecting to login…');

      setTimeout(() => {
        window.location.replace('index.html');
      }, 1500);

    } catch (err) {
      console.error('Registration error:', err);
      showError('register-alert', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading('register-btn', false);
    }
  });
}

// ---- DASHBOARD PAGE ----
function initDashboardPage() {
  // Guard: check for valid session immediately
  const session = getSession();
  if (!session || !session.userId || !session.name || !session.email) {
    window.location.replace('index.html');
    return;
  }

  // Populate avatar elements
  const initials   = getInitials(session.name);
  const avatarGrad = generateAvatarColor(session.name);

  document.querySelectorAll('.user-avatar').forEach(el => {
    el.style.background = avatarGrad;
    el.textContent = initials;      // textContent — safe
  });

  // Populate name/email via textContent — never innerHTML
  document.querySelectorAll('.user-name').forEach(el => {
    el.textContent = session.name;
  });
  document.querySelectorAll('.user-email').forEach(el => {
    el.textContent = session.email;
  });

  // Welcome banner
  const welcomeNameEl = document.getElementById('welcome-name');
  if (welcomeNameEl) welcomeNameEl.textContent = session.name.split(' ')[0];

  // Format login time
  const loginDate    = new Date(session.loginAt);
  const loginTimeStr = loginDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const loginDateStr = loginDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  const lastLoginEl = document.getElementById('last-login');
  if (lastLoginEl) lastLoginEl.textContent = `${loginDateStr} ${loginTimeStr}`;

  // Format member-since date
  if (session.createdAt) {
    const createdDate = new Date(session.createdAt);
    const memberSinceEl = document.getElementById('member-since');
    if (memberSinceEl) {
      memberSinceEl.textContent = createdDate.toLocaleDateString([], {
        month: 'long', day: 'numeric', year: 'numeric'
      });
    }
  }

  // Logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearSession();
      window.location.replace('index.html');
    });
  }
}

// ── Page Detection & Boot ────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const bodyId = document.body.dataset.page;

  if (bodyId === 'login')     initLoginPage();
  if (bodyId === 'register')  initRegisterPage();
  if (bodyId === 'dashboard') initDashboardPage();
});
