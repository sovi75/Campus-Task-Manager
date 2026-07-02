// ============================================================
// app.js — Shared Layout: Auth Guard, Sidebar, Header, Logout
// Must be loaded AFTER api.js on every protected page.
// ============================================================

// ---- Auth Guard: redirect to login if no token ----
(function authGuard() {
  if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
  }
})();

// ---- Helpers ----
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('user')) || {}; }
  catch { return {}; }
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateRelative(dateStr) {
  if (!dateStr) return '—';
  const now  = new Date();
  const date = new Date(dateStr);
  const diff = date - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0)   return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days <= 7)  return `Due in ${days} days`;
  return formatDate(dateStr);
}

function isOverdue(dateStr, status) {
  if (status === 'Completed') return false;
  return new Date(dateStr) < new Date();
}

function isDueToday(dateStr) {
  const d   = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function getPriorityClass(priority) {
  return { High: 'chip-high', Medium: 'chip-medium', Low: 'chip-low' }[priority] || 'chip-low';
}

function getCategoryClass(cat) {
  const map = { Assignment: 'chip-assignment', Exam: 'chip-exam', Project: 'chip-project', Personal: 'chip-personal' };
  return map[cat] || 'chip-assignment';
}

function getStatusClass(status, dueDate) {
  if (status === 'Completed') return 'chip-completed';
  if (isOverdue(dueDate, status)) return 'chip-overdue';
  return 'chip-pending';
}

function getStatusLabel(status, dueDate) {
  if (status === 'Completed') return 'Completed';
  if (isOverdue(dueDate, status)) return 'Overdue';
  return 'Pending';
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ---- Build Sidebar ----
function buildSidebar(activePage) {
  const user = getCurrentUser();
  const initials = (user.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard',     icon: '⊞', href: 'dashboard.html' },
    { id: 'tasks',     label: 'All Tasks',     icon: '☰', href: 'tasks.html' },
    { id: 'study',     label: 'Study Mode',    icon: '⏱', href: 'study.html' },
    { id: 'calendar',  label: 'Calendar Sync', icon: '📅', href: 'calendar.html' },
    { id: 'search',    label: 'Search',        icon: '⌕', href: 'search.html' },
  ];

  const filterItems = [
    { id: 'pending',   label: 'Pending',   icon: '○', href: `tasks.html?status=Pending` },
    { id: 'completed', label: 'Completed', icon: '✓', href: `tasks.html?status=Completed` },
    { id: 'high',      label: 'High Priority', icon: '↑', href: `tasks.html?priority=High` },
  ];

  const catItems = [
    { label: 'Assignment', icon: '📝', href: `tasks.html?category=Assignment` },
    { label: 'Exam',       icon: '📋', href: `tasks.html?category=Exam` },
    { label: 'Project',    icon: '🗂', href: `tasks.html?category=Project` },
    { label: 'Personal',   icon: '👤', href: `tasks.html?category=Personal` },
  ];

  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  sidebar.innerHTML = `
    <a class="sidebar-logo" href="dashboard.html">
      <div class="sidebar-logo-icon">
        <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
      </div>
      <div class="sidebar-logo-text">
        Campus Task<span>Manager</span>
      </div>
    </a>

    <nav class="sidebar-nav">
      <div class="sidebar-section-label">Navigation</div>
      ${navItems.map(item => `
        <a href="${item.href}" class="nav-item ${activePage === item.id ? 'active' : ''}">
          <span class="nav-icon">${item.icon}</span>
          ${item.label}
        </a>
      `).join('')}

      <div class="sidebar-section-label">Quick Filters</div>
      ${filterItems.map(item => `
        <a href="${item.href}" class="nav-item ${activePage === item.id ? 'active' : ''}">
          <span class="nav-icon">${item.icon}</span>
          ${item.label}
        </a>
      `).join('')}

      <div class="sidebar-section-label">Categories</div>
      ${catItems.map(item => `
        <a href="${item.href}" class="nav-item">
          <span class="nav-icon">${item.icon}</span>
          ${item.label}
        </a>
      `).join('')}
    </nav>

    <div class="sidebar-user">
      <div class="sidebar-avatar">${initials}</div>
      <div class="sidebar-user-info">
        <div class="sidebar-user-name">${escapeHtml(user.name || 'Student')}</div>
        <div class="sidebar-user-email">${escapeHtml(user.email || '')}</div>
      </div>
      <button id="logout-btn" title="Logout" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:1.1rem;padding:4px;border-radius:var(--r-sm);" onmouseover="this.style.color='var(--color-danger)'" onmouseout="this.style.color='var(--text-muted)'">⏻</button>
    </div>
  `;

  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    window.api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
  });
}

// ---- Build Top Bar ----
function buildTopbar(title) {
  const topbar = document.getElementById('topbar');
  if (!topbar) return;

  topbar.innerHTML = `
    <button id="sidebar-toggle" class="btn btn-ghost btn-icon" style="display:none;" aria-label="Toggle sidebar">☰</button>
    <h1 class="topbar-title">${escapeHtml(title)}</h1>
    <div class="search-bar-wrap">
      <span class="search-icon">⌕</span>
      <input type="search" id="global-search" class="search-input" placeholder="Search tasks..." autocomplete="off">
    </div>
    <button id="new-task-btn" class="btn btn-primary" style="white-space:nowrap; gap:6px;">
      <span>＋</span> New Task
    </button>
  `;

  // Global search → search page
  const searchInput = document.getElementById('global-search');
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && searchInput.value.trim()) {
      window.location.href = `search.html?q=${encodeURIComponent(searchInput.value.trim())}`;
    }
  });

  // New task button → opens modal (modal must exist on page)
  document.getElementById('new-task-btn')?.addEventListener('click', () => {
    openTaskModal();
  });

  // Mobile sidebar toggle
  const toggleBtn = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  if (window.innerWidth <= 768) {
    toggleBtn.style.display = 'flex';
    toggleBtn?.addEventListener('click', () => sidebar?.classList.toggle('open'));
  }
}

// ---- Task Modal (Add / Edit) ----
function openTaskModal(taskData = null) {
  const isEdit = !!taskData;
  const overlay = document.getElementById('task-modal-overlay');
  if (!overlay) return;

  const modalTitle = document.getElementById('modal-title');
  const form       = document.getElementById('task-form');
  if (modalTitle) modalTitle.textContent = isEdit ? 'Edit Task' : 'Add New Task';

  if (form) {
    form.reset();
    if (isEdit) {
      document.getElementById('modal-task-id').value    = taskData._id || '';
      document.getElementById('modal-title-input').value= taskData.title || '';
      document.getElementById('modal-desc').value       = taskData.description || '';
      document.getElementById('modal-due').value        = taskData.dueDate ? taskData.dueDate.split('T')[0] : '';
      document.getElementById('modal-priority').value   = taskData.priority || 'Medium';
      document.getElementById('modal-category').value   = taskData.category || 'Assignment';
      document.getElementById('modal-course').value     = taskData.courseCode || '';
      document.getElementById('modal-reminder').checked = taskData.reminders?.enabled || false;
      const reminderOpt = document.getElementById('modal-reminder-option');
      if (reminderOpt) reminderOpt.value = taskData.reminders?.option || 'none';
    }
  }

  overlay.classList.remove('hidden');
  document.getElementById('modal-title-input')?.focus();
}

function closeTaskModal() {
  const overlay = document.getElementById('task-modal-overlay');
  if (overlay) overlay.classList.add('hidden');
}

// ---- Delete Confirmation Modal ----
function openDeleteModal(taskId, taskTitle, onConfirm) {
  const overlay = document.getElementById('delete-modal-overlay');
  if (!overlay) return;

  const titleEl = document.getElementById('delete-task-title');
  if (titleEl) titleEl.textContent = `"${taskTitle}"`;

  overlay.classList.remove('hidden');

  const confirmBtn = document.getElementById('delete-confirm-btn');
  if (confirmBtn) {
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
    newBtn.addEventListener('click', async () => {
      overlay.classList.add('hidden');
      await onConfirm(taskId);
    });
  }
}

function closeDeleteModal() {
  const overlay = document.getElementById('delete-modal-overlay');
  if (overlay) overlay.classList.add('hidden');
}

// ---- Reminder Checker ----
function checkReminders(tasks) {
  const now = new Date();
  tasks.forEach(task => {
    if (task.status === 'Completed' || !task.reminders?.enabled) return;

    const due    = new Date(task.dueDate);
    const diff   = due - now;
    const hours  = diff / (1000 * 60 * 60);
    const option = task.reminders.option;

    if (option === '1 hour before'  && hours > 0 && hours <= 1) {
      window.api.showToast(`⏰ Reminder: "${task.title}" is due in less than 1 hour!`, 'error');
    } else if (option === '1 day before' && hours > 0 && hours <= 24) {
      window.api.showToast(`🔔 Reminder: "${task.title}" is due in less than a day!`, 'error');
    } else if (option === 'At time of due' && Math.abs(diff) < 5 * 60 * 1000) {
      window.api.showToast(`🔔 Task due now: "${task.title}"`, 'error');
    }
  });
}

// ---- Init on DOMContentLoaded ----
document.addEventListener('DOMContentLoaded', () => {
  // Close modal handlers
  document.getElementById('modal-close-btn')?.addEventListener('click', closeTaskModal);
  document.getElementById('modal-cancel-btn')?.addEventListener('click', closeTaskModal);
  document.getElementById('delete-cancel-btn')?.addEventListener('click', closeDeleteModal);

  // Close on overlay click
  document.getElementById('task-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeTaskModal();
  });
  document.getElementById('delete-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeDeleteModal();
  });

  // ESC key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeTaskModal(); closeDeleteModal(); }
  });

  // Reminder toggle shows/hides option select
  const reminderToggle = document.getElementById('modal-reminder');
  const reminderOpts   = document.getElementById('reminder-options');
  if (reminderToggle && reminderOpts) {
    reminderToggle.addEventListener('change', () => {
      reminderOpts.style.display = reminderToggle.checked ? 'block' : 'none';
    });
  }
});
