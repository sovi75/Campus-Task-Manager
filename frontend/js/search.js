// ============================================================
// search.js — Search page logic
// Depends on: api.js, app.js
// ============================================================

let allTasks     = [];
let searchQuery  = '';
let selectedTask = null;

document.addEventListener('DOMContentLoaded', async () => {
  buildSidebar('search');
  buildTopbar('Search Tasks');
  
  // Read query parameter
  const params = new URLSearchParams(window.location.search);
  searchQuery = params.get('q') || '';
  
  const searchInput = document.getElementById('global-search');
  if (searchInput && searchQuery) {
    searchInput.value = searchQuery;
  }

  await loadTasks();
  bindTaskForm();
});

// ---- Load All Tasks ----
async function loadTasks() {
  const container = document.getElementById('tasks-list');
  if (container) container.innerHTML = `<div style="padding:var(--sp-6);text-align:center;color:var(--text-muted);">Loading tasks...</div>`;

  try {
    const res = await window.api.get('/tasks');
    if (!res || res.status !== 'success') return;
    allTasks = res.data || [];
    checkReminders(allTasks);
    performSearch();
  } catch (err) {
    console.error('Load tasks error:', err);
  }
}

// ---- Perform Filter / Search ----
function performSearch() {
  const infoEl = document.getElementById('search-results-info');
  const titleEl = document.getElementById('search-query-title');
  
  if (titleEl) {
    titleEl.textContent = searchQuery ? `Search Results for "${searchQuery}"` : 'Search Tasks';
  }

  if (!searchQuery) {
    if (infoEl) infoEl.textContent = 'Enter a search term in the top bar to find tasks.';
    renderTaskCards([]);
    return;
  }

  const queryLower = searchQuery.toLowerCase();
  const filtered = allTasks.filter(task => {
    const titleMatch = task.title.toLowerCase().includes(queryLower);
    const descMatch = (task.description || '').toLowerCase().includes(queryLower);
    const courseMatch = (task.courseCode || '').toLowerCase().includes(queryLower);
    const categoryMatch = task.category.toLowerCase().includes(queryLower);
    return titleMatch || descMatch || courseMatch || categoryMatch;
  });

  if (infoEl) {
    infoEl.textContent = `Found ${filtered.length} task${filtered.length !== 1 ? 's' : ''} matching your search.`;
  }

  renderTaskCards(filtered);
}

// ---- Render Task Cards ----
function renderTaskCards(tasks) {
  const container = document.getElementById('tasks-list');
  if (!container) return;

  if (tasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:var(--sp-12);">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-title">${searchQuery ? 'No matches found' : 'Ready to search'}</div>
        <div class="empty-state-text">${searchQuery ? 'Double-check your spelling or search for something else.' : 'Type your search query in the search bar above.'}</div>
      </div>`;
    return;
  }

  container.innerHTML = tasks.map(task => buildTaskCard(task)).join('');

  // Bind checkbox events
  container.querySelectorAll('.task-card-checkbox').forEach(cb => {
    cb.addEventListener('click', (e) => {
      e.stopPropagation();
      handleCheckboxClick(cb);
    });
  });

  // Bind card detail display events
  container.querySelectorAll('.task-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.task-card-checkbox') || e.target.closest('.task-action-btn')) return;
      const taskId = card.dataset.id;
      const task = allTasks.find(t => t._id === taskId);
      if (task) showDetailPanel(task);
    });
  });

  // Bind edit events
  container.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const task = allTasks.find(t => t._id === btn.dataset.id);
      if (task) openTaskModal(task);
    });
  });

  // Bind delete events
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

  // Highlight search terms
  const titleHtml = highlightText(task.title, searchQuery);
  const descHtml = task.description ? `<div class="task-card-desc">${highlightText(task.description, searchQuery)}</div>` : '';

  return `
    <div class="task-card ${isChecked ? 'completed' : ''}"
         data-id="${task._id}"
         data-priority="${escapeHtml(task.priority)}">
      <button class="task-card-checkbox ${isChecked ? 'checked' : ''}"
              data-id="${task._id}"
              title="${isChecked ? 'Mark pending' : 'Mark complete'}">
        ${isChecked ? '✓' : ''}
      </button>
      <div class="task-card-content">
        <div class="task-card-title">${titleHtml}</div>
        ${descHtml}
        <div class="task-card-meta">
          <span class="chip ${getPriorityClass(task.priority)}">${task.priority}</span>
          <span class="chip ${getCategoryClass(task.category)}">${task.category}</span>
          <span class="chip ${getStatusClass(task.status, task.dueDate)}">${getStatusLabel(task.status, task.dueDate)}</span>
          <span class="task-card-due ${dueCls}">📅 ${rel}</span>
          ${task.courseCode ? `<span style="font-size:var(--text-xs);color:var(--text-muted);">${highlightText(task.courseCode, searchQuery)}</span>` : ''}
          ${task.reminders?.enabled ? `<span style="font-size:var(--text-xs);">🔔</span>` : ''}
        </div>
      </div>
      <div class="task-card-actions">
        <button class="task-action-btn edit-btn" data-id="${task._id}" title="Edit">✏️</button>
        <button class="task-action-btn delete-btn delete" data-id="${task._id}" title="Delete">🗑</button>
      </div>
    </div>`;
}

function highlightText(text, term) {
  if (!term) return escapeHtml(text);
  const escapedText = escapeHtml(text);
  const escapedTerm = escapeHtml(term);
  const regex = new RegExp(`(${escapedTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
  return escapedText.replace(regex, '<mark class="search-highlight">$1</mark>');
}

// ---- Checkbox toggling completed status ----
function handleCheckboxClick(cb) {
  const taskId = cb.dataset.id;
  toggleTaskComplete(taskId, cb.classList.contains('checked') ? 'Pending' : 'Completed');
}

async function toggleTaskComplete(taskId, newStatus) {
  try {
    await window.api.put(`/tasks/${taskId}`, { status: newStatus });
    window.api.showToast(newStatus === 'Completed' ? '✓ Task completed!' : 'Task marked as pending', 'success');
    await loadTasks();
    if (selectedTask && selectedTask._id === taskId) {
      const updated = allTasks.find(t => t._id === taskId);
      if (updated) showDetailPanel(updated);
    }
  } catch (err) {
    console.error('Toggle error:', err);
  }
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

  // Bind dynamic event listeners to detail elements
  document.getElementById('detail-close-btn')?.addEventListener('click', closeDetailPanel);
  document.getElementById('detail-edit-btn')?.addEventListener('click', () => openTaskModal(task));
  document.getElementById('detail-complete-btn')?.addEventListener('click', () => {
    toggleTaskComplete(task._id, task.status === 'Completed' ? 'Pending' : 'Completed');
  });
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
  } catch (err) {
    console.error('Delete error:', err);
  }
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
