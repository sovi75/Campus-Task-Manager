// ============================================================
// tasks.js — All Tasks page logic
// Depends on: api.js, app.js
// ============================================================

let allTasks        = [];
let activeFilter    = { status: '', priority: '', category: '' };
let selectedTaskIds = new Set();
let selectedTask    = null;

document.addEventListener('DOMContentLoaded', async () => {
  buildSidebar('tasks');
  buildTopbar('All Tasks');
  applyUrlFilters();
  await loadTasks();
  bindFilterEvents();
  bindTaskForm();
});

// ---- Read URL params to pre-set filters ----
function applyUrlFilters() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('status'))   activeFilter.status   = params.get('status');
  if (params.get('priority')) activeFilter.priority = params.get('priority');
  if (params.get('category')) activeFilter.category = params.get('category');

  // Sync filter tabs
  if (activeFilter.status) {
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.status === activeFilter.status || (tab.dataset.status === '' && !activeFilter.status));
    });
  }

  // Sync selects
  const priSel = document.getElementById('priority-filter');
  const catSel = document.getElementById('category-filter');
  if (priSel && activeFilter.priority) priSel.value = activeFilter.priority;
  if (catSel && activeFilter.category) catSel.value = activeFilter.category;
}

// ---- Load All Tasks ----
async function loadTasks() {
  const container = document.getElementById('tasks-list');
  if (container) container.innerHTML = `<div style="padding:var(--sp-6);text-align:center;color:var(--text-muted);">Loading tasks...</div>`;

  try {
    const res = await window.api.get('/tasks');
    if (!res || res.status !== 'success') return;
    allTasks = res.data || [];
    checkReminders(allTasks);
    selectedTaskIds.clear();
    hideBulkBar();
    renderTasks();
  } catch (err) {
    console.error('Load tasks error:', err);
  }
}

// ---- Render filtered task list ----
function renderTasks() {
  const searchVal = document.getElementById('task-search')?.value.toLowerCase().trim() || '';

  let filtered = allTasks.filter(task => {
    if (activeFilter.status   && task.status   !== activeFilter.status)   return false;
    if (activeFilter.priority && task.priority !== activeFilter.priority) return false;
    if (activeFilter.category && task.category !== activeFilter.category) return false;
    if (searchVal) {
      const haystack = (task.title + ' ' + (task.description || '') + ' ' + (task.courseCode || '')).toLowerCase();
      if (!haystack.includes(searchVal)) return false;
    }
    return true;
  });

  // Sort
  const sortVal = document.getElementById('sort-select')?.value || 'dueDate_asc';
  filtered = sortTasks(filtered, sortVal);

  updateResultCount(filtered.length);
  renderTaskCards(filtered);
}

function sortTasks(tasks, sortVal) {
  return [...tasks].sort((a, b) => {
    switch (sortVal) {
      case 'dueDate_asc':   return new Date(a.dueDate) - new Date(b.dueDate);
      case 'dueDate_desc':  return new Date(b.dueDate) - new Date(a.dueDate);
      case 'priority':      return ['High','Medium','Low'].indexOf(a.priority) - ['High','Medium','Low'].indexOf(b.priority);
      case 'title':         return a.title.localeCompare(b.title);
      case 'createdAt_desc':return new Date(b.createdAt) - new Date(a.createdAt);
      default:              return 0;
    }
  });
}

function updateResultCount(count) {
  const el = document.getElementById('result-count');
  if (el) el.textContent = `${count} task${count !== 1 ? 's' : ''}`;
}

function renderTaskCards(tasks) {
  const container = document.getElementById('tasks-list');
  if (!container) return;

  if (tasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:var(--sp-12);">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-title">No tasks found</div>
        <div class="empty-state-text">Try adjusting your filters or create a new task.</div>
        <button class="btn btn-primary" id="empty-add-task-btn" style="margin-top:var(--sp-4);">＋ Add Task</button>
      </div>`;
    
    document.getElementById('empty-add-task-btn')?.addEventListener('click', () => openTaskModal());
    return;
  }

  container.innerHTML = tasks.map(task => buildTaskCard(task)).join('');

  // Bind selection events for bulk actions
  container.querySelectorAll('.task-select-checkbox').forEach(cb => {
    cb.addEventListener('click', (e) => {
      e.stopPropagation();
      const taskId = cb.dataset.id;
      if (cb.checked) {
        selectedTaskIds.add(taskId);
        cb.closest('.task-card').classList.add('selected');
      } else {
        selectedTaskIds.delete(taskId);
        cb.closest('.task-card').classList.remove('selected');
      }
      updateBulkBar();
    });
  });

  // Bind checkbox events (complete toggle)
  container.querySelectorAll('.task-card-checkbox').forEach(cb => {
    cb.addEventListener('click', (e) => { e.stopPropagation(); handleCheckboxClick(cb); });
  });

  container.querySelectorAll('.task-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.task-card-checkbox') || e.target.closest('.task-select-checkbox') || e.target.closest('.task-action-btn')) return;
      const taskId = card.dataset.id;
      const task   = allTasks.find(t => t._id === taskId);
      if (task) showDetailPanel(task);
    });
  });

  container.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const task = allTasks.find(t => t._id === btn.dataset.id);
      if (task) openTaskModal(task);
    });
  });

  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const task = allTasks.find(t => t._id === btn.dataset.id);
      if (task) openDeleteModal(task._id, task.title, handleDeleteTask);
    });
  });
}

function buildTaskCard(task) {
  const isChecked = task.status === 'Completed';
  const isOD      = isOverdue(task.dueDate, task.status);
  const isTD      = isDueToday(task.dueDate);
  const dueCls    = isOD ? 'overdue' : isTD ? 'today' : '';
  const rel       = formatDateRelative(task.dueDate);
  const isSelected= selectedTaskIds.has(task._id);

  return `
    <div class="task-card ${isChecked ? 'completed' : ''} ${isSelected ? 'selected' : ''}"
         data-id="${task._id}"
         data-priority="${escapeHtml(task.priority)}">
      <!-- Select checkbox for bulk operations -->
      <input type="checkbox" class="task-select-checkbox" data-id="${task._id}" ${isSelected ? 'checked' : ''} title="Select for bulk action" style="margin-top: 6px; cursor: pointer; accent-color: var(--primary); flex-shrink: 0;">
      
      <button class="task-card-checkbox ${isChecked ? 'checked' : ''}"
              data-id="${task._id}"
              title="${isChecked ? 'Mark pending' : 'Mark complete'}">
        ${isChecked ? '✓' : ''}
      </button>
      <div class="task-card-content">
        <div class="task-card-title">${escapeHtml(task.title)}</div>
        ${task.description ? `<div class="task-card-desc">${escapeHtml(task.description)}</div>` : ''}
        <div class="task-card-meta">
          <span class="chip ${getPriorityClass(task.priority)}">${task.priority}</span>
          <span class="chip ${getCategoryClass(task.category)}">${task.category}</span>
          <span class="chip ${getStatusClass(task.status, task.dueDate)}">${getStatusLabel(task.status, task.dueDate)}</span>
          <span class="task-card-due ${dueCls}">📅 ${rel}</span>
          ${task.courseCode ? `<span style="font-size:var(--text-xs);color:var(--text-muted);">${escapeHtml(task.courseCode)}</span>` : ''}
          ${task.reminders?.enabled ? `<span style="font-size:var(--text-xs);">🔔</span>` : ''}
        </div>
      </div>
      <div class="task-card-actions">
        <button class="task-action-btn edit-btn" data-id="${task._id}" title="Edit">✏️</button>
        <button class="task-action-btn delete-btn delete" data-id="${task._id}" title="Delete">🗑</button>
      </div>
    </div>`;
}

// ---- Checkbox handling (select + bulk) ----
function handleCheckboxClick(cb) {
  const taskId = cb.dataset.id;
  const task   = allTasks.find(t => t._id === taskId);
  if (!task) return;

  if (cb.classList.contains('checked')) {
    // Already completed: mark pending
    toggleTaskComplete(taskId, 'Pending');
  } else {
    // Mark completed
    toggleTaskComplete(taskId, 'Completed');
  }
}

async function toggleTaskComplete(taskId, newStatus) {
  try {
    await window.api.put(`/tasks/${taskId}`, { status: newStatus });
    window.api.showToast(newStatus === 'Completed' ? '✓ Task completed!' : 'Task marked as pending', 'success');
    await loadTasks();
    // Refresh detail panel if open
    if (selectedTask && selectedTask._id === taskId) {
      const updated = allTasks.find(t => t._id === taskId);
      if (updated) showDetailPanel(updated);
    }
  } catch (err) { console.error('Toggle error:', err); }
}

// ---- Detail Panel ----
function showDetailPanel(task) {
  selectedTask = task;
  const panel  = document.getElementById('task-detail-panel');
  if (!panel) return;
  panel.classList.add('visible');

  const isOD = isOverdue(task.dueDate, task.status);
  const isTD = isDueToday(task.dueDate);

  panel.innerHTML = `
    <div class="task-detail-header">
      <div class="task-detail-title">${escapeHtml(task.title)}</div>
      <button class="modal-close" id="detail-close-btn">✕</button>
    </div>
    <div class="task-detail-body">
      <div class="task-detail-field">
        <div class="task-detail-field-label">Status</div>
        <span class="chip ${getStatusClass(task.status, task.dueDate)}">${getStatusLabel(task.status, task.dueDate)}</span>
      </div>
      <div class="task-detail-field">
        <div class="task-detail-field-label">Priority</div>
        <span class="chip ${getPriorityClass(task.priority)}">${task.priority}</span>
      </div>
      <div class="task-detail-field">
        <div class="task-detail-field-label">Category</div>
        <span class="chip ${getCategoryClass(task.category)}">${task.category}</span>
      </div>
      <div class="task-detail-field">
        <div class="task-detail-field-label">Due Date</div>
        <div class="task-detail-field-value ${isOD ? 'text-danger' : isTD ? 'text-warning' : ''}" style="color:${isOD ? 'var(--color-danger)' : isTD ? 'var(--color-warning)' : ''}">
          ${formatDate(task.dueDate)} <span style="font-size:var(--text-xs);font-weight:400;">(${formatDateRelative(task.dueDate)})</span>
        </div>
      </div>
      ${task.courseCode ? `<div class="task-detail-field"><div class="task-detail-field-label">Course</div><div class="task-detail-field-value">${escapeHtml(task.courseCode)}</div></div>` : ''}
      ${task.description ? `<div class="task-detail-field"><div class="task-detail-field-label">Description</div><div class="task-detail-desc">${escapeHtml(task.description)}</div></div>` : ''}
      <div class="task-detail-field">
        <div class="task-detail-field-label">Reminder</div>
        <div class="task-detail-field-value">${task.reminders?.enabled ? `🔔 ${task.reminders.option}` : 'None'}</div>
      </div>
      <div class="task-detail-field">
        <div class="task-detail-field-label">Created</div>
        <div class="task-detail-field-value">${formatDate(task.createdAt)}</div>
      </div>
    </div>
    <div class="task-detail-footer">
      <button class="btn btn-secondary" style="flex:1;" id="detail-edit-btn">✏️ Edit</button>
      <button class="btn btn-primary" style="flex:1;" id="detail-complete-btn">
        ${task.status === 'Completed' ? '↩ Mark Pending' : '✓ Complete'}
      </button>
    </div>`;

  // Bind events dynamically to prevent issues with JSON stringification inside inline onclicks
  document.getElementById('detail-close-btn')?.addEventListener('click', closeDetailPanel);
  document.getElementById('detail-edit-btn')?.addEventListener('click', () => openTaskModal(task));
  document.getElementById('detail-complete-btn')?.addEventListener('click', () => {
    toggleTaskComplete(task._id, task.status === 'Completed' ? 'Pending' : 'Completed');
  });
}

function updateBulkBar() {
  const bar = document.getElementById('bulk-bar');
  if (!bar) return;
  
  if (selectedTaskIds.size > 0) {
    bar.classList.add('visible');
    const info = document.getElementById('bulk-info') || bar.querySelector('.bulk-bar-info');
    if (info) {
      info.textContent = `${selectedTaskIds.size} task${selectedTaskIds.size > 1 ? 's' : ''} selected`;
    }
  } else {
    bar.classList.remove('visible');
  }
}

function closeDetailPanel() {
  selectedTask = null;
  const panel = document.getElementById('task-detail-panel');
  if (panel) panel.classList.remove('visible');
}

// ---- Delete ----
async function handleDeleteTask(taskId) {
  try {
    await window.api.delete(`/tasks/${taskId}`);
    window.api.showToast('Task deleted', 'success');
    if (selectedTask?._id === taskId) closeDetailPanel();
    await loadTasks();
  } catch (err) { console.error('Delete error:', err); }
}

// ---- Bulk Actions ----
async function bulkComplete() {
  if (selectedTaskIds.size === 0) return;
  try {
    await window.api.post('/tasks/bulk-status', { ids: [...selectedTaskIds], status: 'Completed' });
    window.api.showToast(`${selectedTaskIds.size} tasks marked as completed`, 'success');
    selectedTaskIds.clear();
    hideBulkBar();
    await loadTasks();
  } catch (err) { console.error('Bulk complete error:', err); }
}

async function bulkDelete() {
  if (selectedTaskIds.size === 0) return;
  if (!confirm(`Delete ${selectedTaskIds.size} selected tasks?`)) return;
  try {
    await window.api.post('/tasks/bulk-delete', { ids: [...selectedTaskIds] });
    window.api.showToast(`${selectedTaskIds.size} tasks deleted`, 'success');
    selectedTaskIds.clear();
    hideBulkBar();
    await loadTasks();
  } catch (err) { console.error('Bulk delete error:', err); }
}

function hideBulkBar() {
  const bar = document.getElementById('bulk-bar');
  if (bar) bar.classList.remove('visible');
}

// ---- Filter / Search Events ----
function bindFilterEvents() {
  // Filter tabs (status)
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeFilter.status = tab.dataset.status || '';
      renderTasks();
    });
  });

  // Priority dropdown
  document.getElementById('priority-filter')?.addEventListener('change', (e) => {
    activeFilter.priority = e.target.value;
    renderTasks();
  });

  // Category dropdown
  document.getElementById('category-filter')?.addEventListener('change', (e) => {
    activeFilter.category = e.target.value;
    renderTasks();
  });

  // Sort dropdown
  document.getElementById('sort-select')?.addEventListener('change', renderTasks);

  // Inline search
  document.getElementById('task-search')?.addEventListener('input', renderTasks);

  // Bulk action buttons
  document.getElementById('bulk-complete-btn')?.addEventListener('click', bulkComplete);
  document.getElementById('bulk-delete-btn')?.addEventListener('click', bulkDelete);
}

// ---- Task Form (modal) ----
function bindTaskForm() {
  const form = document.getElementById('task-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const taskId   = document.getElementById('modal-task-id')?.value;
    const titleVal = document.getElementById('modal-title-input')?.value.trim();
    const dueVal   = document.getElementById('modal-due')?.value;

    if (!titleVal) {
      window.api.showToast('Task title is required', 'error');
      document.getElementById('modal-title-input')?.focus();
      return;
    }
    if (!dueVal) {
      window.api.showToast('Due date is required', 'error');
      document.getElementById('modal-due')?.focus();
      return;
    }

    const payload = {
      title:       titleVal,
      description: document.getElementById('modal-desc')?.value.trim() || '',
      dueDate:     dueVal,
      priority:    document.getElementById('modal-priority')?.value || 'Medium',
      category:    document.getElementById('modal-category')?.value || 'Assignment',
      courseCode:  document.getElementById('modal-course')?.value.trim() || '',
      reminders: {
        enabled: document.getElementById('modal-reminder')?.checked || false,
        option:  document.getElementById('modal-reminder-option')?.value || 'none'
      }
    };

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Saving...'; }

    try {
      if (taskId) {
        await window.api.put(`/tasks/${taskId}`, payload);
        window.api.showToast('Task updated!', 'success');
      } else {
        await window.api.post('/tasks', payload);
        window.api.showToast('Task created!', 'success');
      }
      closeTaskModal();
      await loadTasks();
    } catch (err) {
      console.error('Save task error:', err);
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save Task'; }
    }
  });
}
