/**
 * TaskFlow — script.js
 * Complete To-Do App Logic
 * Oasis Infobyte Level 2 — Web Development Internship
 */

'use strict';

/* ==========================================================
   UTILITY HELPERS
   ========================================================== */

/**
 * Debounce: delay fn execution until `wait` ms of silence.
 */
function debounce(fn, wait) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

/** Format "YYYY-MM-DD" → friendly label relative to today */
function formatDate(isoDate) {
  if (!isoDate) return '';
  const date  = new Date(isoDate + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (date.getTime() === today.getTime())    return 'Today';
  if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Returns true if isoDate ("YYYY-MM-DD") is strictly before today */
function isOverdue(isoDate) {
  if (!isoDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(isoDate + 'T00:00:00') < today;
}

/** Format full ISO timestamp for display */
function formatTimestamp(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' at ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

function truncate(str, len) {
  return str.length > len ? str.slice(0, len) + '…' : str;
}

function setTextById(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function createMetaItem(iconClass, text) {
  const span  = document.createElement('span');
  span.className = 'task-meta-item';
  const icon  = document.createElement('i');
  icon.className = iconClass;
  icon.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span');
  label.textContent = text;
  span.appendChild(icon);
  span.appendChild(label);
  return span;
}

function createActionBtn(iconClass, btnClass, label, action, id) {
  const btn = document.createElement('button');
  btn.className = `task-action-btn ${btnClass}`;
  btn.dataset.action = action;
  btn.dataset.id = id;
  btn.setAttribute('aria-label', label);
  btn.setAttribute('title', label);
  const icon = document.createElement('i');
  icon.className = iconClass;
  icon.setAttribute('aria-hidden', 'true');
  btn.appendChild(icon);
  return btn;
}

/* ==========================================================
   TASK MANAGER MODULE
   ========================================================== */
const TaskManager = (() => {

  /* ---- Constants ---- */
  const LS_KEY = 'taskflow_tasks';

  /* ---- State ---- */
  let tasks          = [];
  let currentFilter  = 'all';
  let currentSearch  = '';
  let pendingSortAsc = false;
  let _modalCb       = null;    // pending modal confirm callback

  /* ===========================================================
     LocalStorage
  =========================================================== */
  function saveTasks() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(tasks)); }
    catch (e) { console.error('TaskFlow: save error', e); }
  }

  function loadTasks() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      tasks = raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('TaskFlow: load error', e);
      tasks = [];
    }
  }

  /* ===========================================================
     CRUD Operations
  =========================================================== */

  /** Add a new task */
  function addTask(title, priority, dueDate) {
    const trimmed = title.trim();
    if (!trimmed) {
      showToast('Please enter a task title.', 'error');
      return false;
    }
    if (trimmed.length > 200) {
      showToast('Title is too long (max 200 chars).', 'error');
      return false;
    }

    const task = {
      id: Date.now() + Math.random(),
      title: trimmed,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      completed: false,
      addedAt: new Date().toISOString(),
      completedAt: null,
      editing: false,
    };

    tasks.unshift(task);
    saveTasks();
    renderTasks();
    updateStats();
    showToast(`"${truncate(trimmed, 30)}" added!`, 'success');
    return true;
  }

  /** Delete task after modal confirmation */
  function deleteTask(id) {
    const task = tasks.find(t => String(t.id) === String(id));
    if (!task) return;
    showModal(
      `Delete Task?`,
      `"${truncate(task.title, 60)}" will be permanently removed.`,
      () => {
        tasks = tasks.filter(t => String(t.id) !== String(id));
        saveTasks();
        renderTasks();
        updateStats();
        showToast('Task deleted.', 'info');
      }
    );
  }

  /** Toggle completed state */
  function toggleComplete(id) {
    const task = tasks.find(t => String(t.id) === String(id));
    if (!task) return;
    task.completed   = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;
    saveTasks();
    renderTasks();
    updateStats();
    showToast(
      task.completed
        ? `✅ "${truncate(task.title, 30)}" completed!`
        : `↩️ "${truncate(task.title, 30)}" marked pending.`,
      task.completed ? 'success' : 'info'
    );
  }

  /** Save inline edit */
  function editTask(id, newTitle) {
    const trimmed = newTitle.trim();
    if (!trimmed) { showToast('Title cannot be empty.', 'error'); return false; }
    const task = tasks.find(t => String(t.id) === String(id));
    if (!task) return false;
    task.title   = trimmed;
    task.editing = false;
    saveTasks();
    renderTasks();
    updateStats();
    showToast('Task updated.', 'info');
    return true;
  }

  /** Mark a task as being edited inline */
  function startEditing(id) {
    tasks.forEach(t => { t.editing = false; });
    const task = tasks.find(t => String(t.id) === String(id));
    if (!task || task.completed) return;
    task.editing = true;
    renderTasks();
    requestAnimationFrame(() => {
      const input = document.querySelector(`[data-edit-id="${id}"]`);
      if (input) { input.focus(); input.select(); }
    });
  }

  /** Cancel inline editing */
  function cancelEditing(id) {
    const task = tasks.find(t => String(t.id) === String(id));
    if (!task) return;
    task.editing = false;
    renderTasks();
  }

  /** Clear all completed tasks (after confirmation) */
  function clearCompleted() {
    const count = tasks.filter(t => t.completed).length;
    if (count === 0) { showToast('No completed tasks to clear.', 'info'); return; }
    showModal(
      `Clear ${count} completed task${count !== 1 ? 's' : ''}?`,
      'All completed tasks will be permanently removed.',
      () => {
        tasks = tasks.filter(t => !t.completed);
        saveTasks();
        renderTasks();
        updateStats();
        showToast(`${count} task${count !== 1 ? 's' : ''} cleared.`, 'info');
      }
    );
  }

  /* ===========================================================
     Filtering & Searching
  =========================================================== */

  function filterTasks(filter) {
    currentFilter = filter;
    renderTasks();
  }

  function searchTasks(query) {
    currentSearch = query.trim().toLowerCase();
    renderTasks();
  }

  function getFilteredTasks() {
    let list = [...tasks];

    if (currentSearch) {
      list = list.filter(t => t.title.toLowerCase().includes(currentSearch));
    }

    let pending, completed;

    if (currentFilter === 'all') {
      pending   = list.filter(t => !t.completed);
      completed = list.filter(t =>  t.completed);
    } else if (currentFilter === 'pending') {
      pending   = list.filter(t => !t.completed);
      completed = [];
    } else {
      pending   = [];
      completed = list.filter(t => t.completed);
    }

    if (pendingSortAsc) {
      pending.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
    }

    return { pending, completed };
  }

  /* ===========================================================
     Rendering
  =========================================================== */

  function renderTasks() {
    const { pending, completed } = getFilteredTasks();

    const pendingList     = document.getElementById('pendingList');
    const completedList   = document.getElementById('completedList');
    const emptyPending    = document.getElementById('emptyPending');
    const emptyCompleted  = document.getElementById('emptyCompleted');
    const pendingSection  = document.getElementById('pendingSection');
    const completedSection= document.getElementById('completedSection');

    if (!pendingList) return;

    pendingList.textContent   = '';
    completedList.textContent = '';

    pendingSection.classList.toggle('hidden',   currentFilter === 'completed');
    completedSection.classList.toggle('hidden', currentFilter === 'pending');

    // Pending
    if (pending.length === 0) {
      emptyPending.classList.remove('hidden');
    } else {
      emptyPending.classList.add('hidden');
      pending.forEach(t => pendingList.appendChild(renderTaskCard(t)));
    }

    // Completed
    if (completed.length === 0) {
      emptyCompleted.classList.remove('hidden');
    } else {
      emptyCompleted.classList.add('hidden');
      completed.forEach(t => completedList.appendChild(renderTaskCard(t)));
    }

    _updateBadges();
  }

  /** Build a task card DOM element — no innerHTML for user content */
  function renderTaskCard(task) {
    const li = document.createElement('li');
    li.className = `task-card priority-${task.priority}${task.completed ? ' completed' : ''}`;
    li.dataset.id = task.id;
    li.setAttribute('role', 'listitem');

    /* Complete button */
    const completeBtn = document.createElement('button');
    completeBtn.className = 'complete-btn';
    completeBtn.dataset.action = 'toggle';
    completeBtn.dataset.id = task.id;
    completeBtn.setAttribute('aria-label', task.completed ? 'Mark as pending' : 'Mark as complete');
    completeBtn.setAttribute('title',      task.completed ? 'Mark as pending' : 'Mark as complete');
    const checkIcon = document.createElement('i');
    checkIcon.className = 'fa-solid fa-check';
    checkIcon.setAttribute('aria-hidden', 'true');
    completeBtn.appendChild(checkIcon);

    /* Body */
    const body    = document.createElement('div');
    body.className = 'task-body';

    /* Title row */
    const titleRow = document.createElement('div');
    titleRow.className = 'task-title-row';

    if (task.editing) {
      const editInput = document.createElement('input');
      editInput.type      = 'text';
      editInput.className = 'task-title-input-edit';
      editInput.value     = task.title;
      editInput.dataset.editId = task.id;
      editInput.setAttribute('aria-label', 'Edit task title');
      editInput.setAttribute('maxlength', '200');
      editInput.addEventListener('keydown', e => {
        if (e.key === 'Enter')  { e.preventDefault(); editTask(task.id, editInput.value); }
        if (e.key === 'Escape') { cancelEditing(task.id); }
      });
      titleRow.appendChild(editInput);
    } else {
      const titleEl  = document.createElement('span');
      titleEl.className  = 'task-title';
      titleEl.textContent = task.title;
      titleRow.appendChild(titleEl);

      const priorityIcons = { high: '🔴', medium: '🟠', low: '🟢' };
      const badge = document.createElement('span');
      badge.className = `priority-badge ${task.priority}`;
      badge.textContent = `${priorityIcons[task.priority]} ${capitalize(task.priority)}`;
      titleRow.appendChild(badge);
    }

    body.appendChild(titleRow);

    /* Meta */
    const meta = document.createElement('div');
    meta.className = 'task-meta';
    meta.appendChild(createMetaItem('fa-solid fa-clock', `Added ${formatTimestamp(task.addedAt)}`));

    if (task.dueDate) {
      const overdue = !task.completed && isOverdue(task.dueDate);
      const dueMeta = createMetaItem(
        overdue ? 'fa-solid fa-triangle-exclamation' : 'fa-regular fa-calendar',
        overdue ? `Overdue: ${formatDate(task.dueDate)}` : `Due: ${formatDate(task.dueDate)}`
      );
      if (overdue) dueMeta.classList.add('overdue');
      meta.appendChild(dueMeta);
    }

    if (task.completed && task.completedAt) {
      meta.appendChild(createMetaItem('fa-solid fa-circle-check', `Done ${formatTimestamp(task.completedAt)}`));
    }

    body.appendChild(meta);

    /* Actions */
    const actions = document.createElement('div');
    actions.className = 'task-actions';

    if (task.editing) {
      actions.appendChild(createActionBtn('fa-solid fa-floppy-disk', 'task-action-btn save-btn',   'Save',           'save',        task.id));
      actions.appendChild(createActionBtn('fa-solid fa-xmark',       'task-action-btn delete-btn', 'Cancel editing', 'cancel-edit', task.id));
    } else {
      if (!task.completed) {
        actions.appendChild(createActionBtn('fa-solid fa-pen',   'task-action-btn edit-btn',   'Edit task',   'edit',   task.id));
      }
      actions.appendChild(createActionBtn('fa-solid fa-trash', 'task-action-btn delete-btn', 'Delete task', 'delete', task.id));
    }

    li.appendChild(completeBtn);
    li.appendChild(body);
    li.appendChild(actions);
    return li;
  }

  /* ===========================================================
     Stats
  =========================================================== */

  function updateStats() {
    const total     = tasks.length;
    const completed = tasks.filter(t =>  t.completed).length;
    const pending   = tasks.filter(t => !t.completed).length;
    const overdue   = tasks.filter(t => !t.completed && isOverdue(t.dueDate)).length;

    setTextById('statTotal',     total);
    setTextById('statPending',   pending);
    setTextById('statCompleted', completed);
    setTextById('statOverdue',   overdue);

    setTextById('pendingBadge',   pending);
    setTextById('completedBadge', completed);
    _updateBadges();
  }

  function _updateBadges() {
    const total     = tasks.length;
    const completed = tasks.filter(t =>  t.completed).length;
    const pending   = tasks.filter(t => !t.completed).length;
    setTextById('badge-all',       total);
    setTextById('badge-pending',   pending);
    setTextById('badge-completed', completed);
  }

  /* ===========================================================
     Toast
  =========================================================== */

  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = {
      success: 'fa-solid fa-circle-check',
      error:   'fa-solid fa-circle-xmark',
      info:    'fa-solid fa-circle-info',
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');

    const icon = document.createElement('i');
    icon.className = `${icons[type] || icons.info} toast-icon`;
    icon.setAttribute('aria-hidden', 'true');

    const msg = document.createElement('span');
    msg.className   = 'toast-message';
    msg.textContent = message;

    toast.appendChild(icon);
    toast.appendChild(msg);
    container.appendChild(toast);

    const dismiss = () => {
      toast.classList.add('toast-dismiss');
      setTimeout(() => { if (toast.parentNode) toast.remove(); }, 400);
    };

    const timer = setTimeout(dismiss, 3000);
    toast.addEventListener('click', () => { clearTimeout(timer); dismiss(); });
  }

  /* ===========================================================
     Modal
  =========================================================== */

  function showModal(title, message, onConfirm) {
    const overlay = document.getElementById('modalOverlay');
    if (!overlay) return;

    document.getElementById('modalTitle').textContent   = title;
    document.getElementById('modalMessage').textContent = message;
    _modalCb = onConfirm;

    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');

    setTimeout(() => {
      const btn = document.getElementById('modalConfirmBtn');
      if (btn) btn.focus();
    }, 60);
  }

  function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    _modalCb = null;
  }

  function confirmModal() {
    if (typeof _modalCb === 'function') _modalCb();
    closeModal();
  }

  /* ===========================================================
     Sort
  =========================================================== */

  function togglePendingSort() {
    pendingSortAsc = !pendingSortAsc;
    renderTasks();
    showToast(
      pendingSortAsc ? 'Sorted by due date (earliest first).' : 'Default order restored.',
      'info'
    );
  }

  /* ===========================================================
     Init
  =========================================================== */

  function init() {
    loadTasks();
    renderTasks();
    updateStats();
  }

  /* ===========================================================
     Public API
  =========================================================== */
  return {
    init,
    addTask,
    deleteTask,
    toggleComplete,
    editTask,
    startEditing,
    cancelEditing,
    clearCompleted,
    filterTasks,
    searchTasks,
    renderTasks,
    updateStats,
    showToast,
    showModal,
    closeModal,
    confirmModal,
    togglePendingSort,
    get currentFilter() { return currentFilter; },
  };

})();

/* ==========================================================
   BOOT — DOMContentLoaded
   ========================================================== */
document.addEventListener('DOMContentLoaded', () => {

  /* ---- Init app ---- */
  TaskManager.init();

  /* ---- DOM refs ---- */
  const addBtn          = document.getElementById('addTaskBtn');
  const taskInput       = document.getElementById('taskInput');
  const prioritySelect  = document.getElementById('prioritySelect');
  const dueDateInput    = document.getElementById('dueDateInput');
  const searchInput     = document.getElementById('searchInput');
  const hamburgerBtn    = document.getElementById('hamburgerBtn');
  const sidebar         = document.getElementById('sidebar');
  const sidebarOverlay  = document.getElementById('sidebarOverlay');
  const modalOverlay    = document.getElementById('modalOverlay');
  const modalConfirmBtn = document.getElementById('modalConfirmBtn');
  const modalCancelBtn  = document.getElementById('modalCancelBtn');
  const clearCompletedBtn = document.getElementById('clearCompletedBtn');
  const sortPendingBtn    = document.getElementById('sortPendingBtn');

  /* ---- Set min date to today ---- */
  dueDateInput.min = new Date().toISOString().split('T')[0];

  /* ===========================================================
     Add Task
  =========================================================== */
  addBtn.addEventListener('click', () => {
    const added = TaskManager.addTask(
      taskInput.value,
      prioritySelect.value,
      dueDateInput.value
    );
    if (added) {
      taskInput.value      = '';
      dueDateInput.value   = '';
      prioritySelect.value = 'medium';
      taskInput.focus();
    }
  });

  taskInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); addBtn.click(); }
  });

  /* ===========================================================
     Filter Nav
  =========================================================== */
  document.querySelectorAll('.nav-item[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-item[data-filter]').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      TaskManager.filterTasks(btn.dataset.filter);
      if (window.innerWidth <= 768) closeSidebar();
    });
  });

  /* ===========================================================
     Search (debounced)
  =========================================================== */
  searchInput.addEventListener('input', debounce(e => {
    TaskManager.searchTasks(e.target.value);
  }, 250));

  // Handle the native clear button on <input type="search">
  searchInput.addEventListener('search', () => {
    TaskManager.searchTasks(searchInput.value);
  });

  /* ===========================================================
     Event Delegation — Task Card Actions
  =========================================================== */
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const { action, id } = btn.dataset;

    switch (action) {
      case 'toggle':
        TaskManager.toggleComplete(id);
        break;
      case 'edit':
        TaskManager.startEditing(id);
        break;
      case 'delete':
        TaskManager.deleteTask(id);
        break;
      case 'save': {
        const inp = document.querySelector(`[data-edit-id="${id}"]`);
        if (inp) TaskManager.editTask(id, inp.value);
        break;
      }
      case 'cancel-edit':
        TaskManager.cancelEditing(id);
        break;
    }
  });

  /* ===========================================================
     Clear Completed & Sort
  =========================================================== */
  clearCompletedBtn.addEventListener('click', TaskManager.clearCompleted);

  sortPendingBtn.addEventListener('click', () => {
    TaskManager.togglePendingSort();
    sortPendingBtn.classList.toggle('active-sort');
  });

  /* ===========================================================
     Modal
  =========================================================== */
  modalConfirmBtn.addEventListener('click', TaskManager.confirmModal);
  modalCancelBtn.addEventListener('click',  TaskManager.closeModal);

  modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) TaskManager.closeModal();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      TaskManager.closeModal();
      closeSidebar();
    }
  });

  /* ===========================================================
     Mobile Sidebar
  =========================================================== */
  function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
    sidebarOverlay.setAttribute('aria-hidden', 'false');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
    sidebarOverlay.setAttribute('aria-hidden', 'true');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
  }

  hamburgerBtn.addEventListener('click', () => {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });

  sidebarOverlay.addEventListener('click', closeSidebar);

});
