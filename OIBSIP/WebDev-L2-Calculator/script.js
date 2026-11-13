/**
 * Calculator — script.js
 * Oasis Infobyte · Level 2
 *
 * Design decisions:
 *  • NO eval() — arithmetic via safeCompute()
 *  • Event delegation on #btnGrid + document keydown
 *  • State encapsulated in CalcState object
 *  • formatNumber() rounds to 10 significant digits, falls back to
 *    exponential for very large / very small values
 */

'use strict';

/* ═══════════════════════════════════════════════
   STATE
   ═══════════════════════════════════════════════ */
const CalcState = {
  currentInput:       '0',   // string shown in result line
  previousInput:      '',    // string saved before operator press
  operator:           null,  // '+' | '−' | '×' | '÷' | null
  shouldResetDisplay: false, // true right after operator / equals
  expression:         '',    // string shown in expression line
  justEvaluated:      false, // true right after pressing =
};

/* ═══════════════════════════════════════════════
   DOM REFS
   ═══════════════════════════════════════════════ */
const exprEl   = document.getElementById('expression');
const resultEl = document.getElementById('result');
const btnGrid  = document.getElementById('btnGrid');

/* ═══════════════════════════════════════════════
   DISPLAY
   ═══════════════════════════════════════════════ */
function updateDisplay() {
  exprEl.textContent   = CalcState.expression;
  resultEl.textContent = CalcState.currentInput;

  // Responsive font: shrink when number is very long
  const len = CalcState.currentInput.length;
  resultEl.classList.toggle('shrink', len > 9);
}

/** Trigger a quick pop animation on the result line */
function popDisplay() {
  resultEl.classList.remove('pop');
  // Force reflow so animation restarts
  void resultEl.offsetWidth;
  resultEl.classList.add('pop');
}

/* ═══════════════════════════════════════════════
   ARITHMETIC (no eval)
   ═══════════════════════════════════════════════ */
/**
 * Safely compute a op b.
 * Returns a Number (may be Infinity for /0 detected upstream).
 */
function safeCompute(a, op, b) {
  const numA = parseFloat(a);
  const numB = parseFloat(b);

  if (isNaN(numA) || isNaN(numB)) return NaN;

  switch (op) {
    case '+': return numA + numB;
    case '−': return numA - numB;
    case '×': return numA * numB;
    case '÷':
      if (numB === 0) return Infinity; // signal division by zero
      return numA / numB;
    default:  return numB;
  }
}

/**
 * Format a numeric result for display.
 *  • Strips trailing zeros after decimal
 *  • Limits to 10 significant digits
 *  • Falls back to exponential notation for extremes
 */
function formatNumber(num) {
  if (!isFinite(num)) return 'Error';     // Infinity / -Infinity / NaN
  if (isNaN(num))     return 'Error';

  // Use toPrecision to handle significant digits, then clean up
  let str = parseFloat(num.toPrecision(10)).toString();

  // If still very long (edge case with floats), use exponential
  if (str.replace('.', '').replace('-', '').length > 15) {
    str = num.toExponential(6);
  }

  return str;
}

/* ═══════════════════════════════════════════════
   HANDLERS
   ═══════════════════════════════════════════════ */
function handleNumber(digit) {
  if (CalcState.shouldResetDisplay || CalcState.currentInput === '0') {
    // Start fresh, but preserve a minus sign if present
    if (CalcState.shouldResetDisplay) {
      CalcState.currentInput      = digit;
      CalcState.shouldResetDisplay = false;
    } else {
      CalcState.currentInput = digit === '0' ? '0' : digit;
    }
  } else {
    // Guard against absurdly long input
    if (CalcState.currentInput.replace('-', '').replace('.', '').length >= 16) return;
    CalcState.currentInput += digit;
  }
  // If user starts typing after '=', clear the expression
  if (CalcState.justEvaluated) {
    CalcState.expression    = '';
    CalcState.justEvaluated = false;
  }
  updateDisplay();
}

function handleDecimal() {
  if (CalcState.shouldResetDisplay) {
    CalcState.currentInput      = '0.';
    CalcState.shouldResetDisplay = false;
    if (CalcState.justEvaluated) { CalcState.expression = ''; CalcState.justEvaluated = false; }
    updateDisplay();
    return;
  }
  if (CalcState.currentInput.includes('.')) return; // already has decimal
  CalcState.currentInput += '.';
  updateDisplay();
}

function handleOperator(op) {
  // If a previous operator is pending and user hasn't yet entered a new number,
  // just replace the operator (allow chaining operators without computing)
  if (CalcState.shouldResetDisplay && CalcState.operator) {
    CalcState.operator = op;
    // Update expression to reflect new operator
    CalcState.expression =
      `${formatNumber(parseFloat(CalcState.previousInput))} ${op}`;
    // De-activate all operator buttons, activate new one
    highlightOperator(op);
    updateDisplay();
    return;
  }

  // If there's a pending operation, compute it first (operator chaining)
  if (CalcState.operator && CalcState.previousInput !== '' && !CalcState.shouldResetDisplay) {
    const result = safeCompute(CalcState.previousInput, CalcState.operator, CalcState.currentInput);
    if (!isFinite(result) || isNaN(result)) {
      showError();
      return;
    }
    CalcState.currentInput = formatNumber(result);
    popDisplay();
  }

  CalcState.previousInput      = CalcState.currentInput;
  CalcState.operator            = op;
  CalcState.shouldResetDisplay  = true;
  CalcState.justEvaluated       = false;
  CalcState.expression          = `${CalcState.currentInput} ${op}`;
  highlightOperator(op);
  updateDisplay();
}

function handleEquals() {
  if (!CalcState.operator || CalcState.previousInput === '') return;

  const a   = CalcState.previousInput;
  const b   = CalcState.currentInput;
  const op  = CalcState.operator;
  const exp = `${formatNumber(parseFloat(a))} ${op} ${b} =`;

  const result = safeCompute(a, op, b);

  if (!isFinite(result) || isNaN(result)) {
    CalcState.expression = exp;
    showError();
    return;
  }

  CalcState.expression          = exp;
  CalcState.currentInput        = formatNumber(result);
  CalcState.previousInput       = '';
  CalcState.operator             = null;
  CalcState.shouldResetDisplay   = true;
  CalcState.justEvaluated        = true;
  highlightOperator(null);
  popDisplay();
  updateDisplay();
}

function handleClear() {
  CalcState.currentInput        = '0';
  CalcState.previousInput       = '';
  CalcState.operator             = null;
  CalcState.shouldResetDisplay   = false;
  CalcState.expression           = '';
  CalcState.justEvaluated        = false;
  highlightOperator(null);
  updateDisplay();
}

function handleBackspace() {
  // If display was just set by an operator/equals, clear it entirely
  if (CalcState.shouldResetDisplay || CalcState.currentInput === 'Error') {
    handleClear();
    return;
  }
  if (CalcState.currentInput.length <= 1) {
    CalcState.currentInput = '0';
  } else {
    CalcState.currentInput = CalcState.currentInput.slice(0, -1);
    // If only a minus sign left, reset to 0
    if (CalcState.currentInput === '-') CalcState.currentInput = '0';
  }
  updateDisplay();
}

function handlePlusMinus() {
  if (CalcState.currentInput === '0' || CalcState.currentInput === 'Error') return;
  if (CalcState.currentInput.startsWith('-')) {
    CalcState.currentInput = CalcState.currentInput.slice(1);
  } else {
    CalcState.currentInput = '-' + CalcState.currentInput;
  }
  updateDisplay();
}

function handlePercent() {
  if (CalcState.currentInput === 'Error') return;
  const val = parseFloat(CalcState.currentInput);
  if (isNaN(val)) return;

  let result;
  if (CalcState.operator && CalcState.previousInput !== '') {
    // Percentage of the previous value  (e.g. 200 + 10% = 200 + 20)
    result = (parseFloat(CalcState.previousInput) * val) / 100;
  } else {
    result = val / 100;
  }

  CalcState.currentInput        = formatNumber(result);
  CalcState.shouldResetDisplay   = false;
  updateDisplay();
}

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */
function showError() {
  CalcState.currentInput        = 'Error';
  CalcState.previousInput       = '';
  CalcState.operator             = null;
  CalcState.shouldResetDisplay   = true;
  CalcState.justEvaluated        = false;
  highlightOperator(null);
  updateDisplay();
}

/** Highlight the active operator button (or clear all highlights) */
function highlightOperator(op) {
  document.querySelectorAll('.btn--operator').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.value === op);
  });
}

/* ═══════════════════════════════════════════════
   EVENT DELEGATION — button grid
   ═══════════════════════════════════════════════ */
btnGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const value  = btn.dataset.value;

  switch (action) {
    case 'number':    handleNumber(value);   break;
    case 'decimal':   handleDecimal();       break;
    case 'operator':  handleOperator(value); break;
    case 'equals':    handleEquals();        break;
    case 'clear':     handleClear();         break;
    case 'backspace': handleBackspace();     break;
    case 'plus-minus':handlePlusMinus();     break;
    case 'percent':   handlePercent();       break;
  }
});

/* ═══════════════════════════════════════════════
   KEYBOARD SUPPORT
   ═══════════════════════════════════════════════ */
document.addEventListener('keydown', (e) => {
  // Don't fire if user is focused on an input element elsewhere
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  const key = e.key;

  if (key >= '0' && key <= '9') {
    e.preventDefault();
    handleNumber(key);
    flashButton(`[data-action="number"][data-value="${key}"]`);
  } else if (key === '.') {
    e.preventDefault();
    handleDecimal();
    flashButton('[data-action="decimal"]');
  } else if (key === '+') {
    e.preventDefault();
    handleOperator('+');
    flashButton('[data-action="operator"][data-value="+"]');
  } else if (key === '-') {
    e.preventDefault();
    handleOperator('−');
    flashButton('[data-action="operator"][data-value="−"]');
  } else if (key === '*') {
    e.preventDefault();
    handleOperator('×');
    flashButton('[data-action="operator"][data-value="×"]');
  } else if (key === '/') {
    e.preventDefault();
    handleOperator('÷');
    flashButton('[data-action="operator"][data-value="÷"]');
  } else if (key === 'Enter' || key === '=') {
    e.preventDefault();
    handleEquals();
    flashButton('[data-action="equals"]');
  } else if (key === 'Backspace') {
    e.preventDefault();
    handleBackspace();
    flashButton('[data-action="backspace"]');
  } else if (key === 'Escape') {
    e.preventDefault();
    handleClear();
    flashButton('[data-action="clear"]');
  } else if (key === '%') {
    e.preventDefault();
    handlePercent();
    flashButton('[data-action="percent"]');
  }
});

/**
 * Briefly give the matching button an :active appearance
 * when triggered via keyboard.
 */
function flashButton(selector) {
  const btn = document.querySelector(selector);
  if (!btn) return;
  btn.classList.add('kb-flash');
  setTimeout(() => btn.classList.remove('kb-flash'), 160);
}

/* Add a tiny CSS rule for kb-flash dynamically */
(function injectFlashStyle() {
  const style = document.createElement('style');
  style.textContent = `.kb-flash { transform: scale(0.93) !important; filter: brightness(1.3); }`;
  document.head.appendChild(style);
})();

/* ═══════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════ */
updateDisplay();
