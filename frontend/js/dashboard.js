// ============================================================
// dashboard.js — Dashboard page logic
// Depends on: api.js, app.js
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  // Build shared layout
  buildSidebar('dashboard');
  buildTopbar('Dashboard');
  renderGreeting();

  // Load everything in parallel
  await loadDashboardData();
});

// ---- Greeting Banner ----
function renderGreeting() {
  const user = getCurrentUser();
  const now  = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const banner = document.getElementById('greeting-banner');
  if (!banner) return;

  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  banner.innerHTML = `
    <div class="greeting-text">
      <h2>${greeting}, ${escapeHtml(user.name?.split(' ')[0] || 'Student')}! 👋</h2>
      <p>Here's what's on your plate today.</p>
    </div>
    <div class="greeting-date">${dateStr}</div>
  `;
}

// ---- Main Data Loader ----
async function loadDashboardData() {
  try {
    // Fetch all tasks
    const res = await window.api.get('/tasks');
    if (!res || res.status !== 'success') return;

    const tasks = res.data || [];

    // Run reminders check
    checkReminders(tasks);

    // Compute stats
    renderStats(tasks);

    // Today's focus (pending tasks due today or overdue, max 5)
    const todayTasks = tasks
      .filter(t => t.status !== 'Completed' && (isDueToday(t.dueDate) || isOverdue(t.dueDate, t.status)))
      .sort((a, b) => {
        const pOrd = { High: 0, Medium: 1, Low: 2 };
        return (pOrd[a.priority] ?? 1) - (pOrd[b.priority] ?? 1);
      })
      .slice(0, 6);

    renderTodayFocus(todayTasks, tasks);

    // Upcoming deadlines (pending, future, next 7 days)
    const upcoming = tasks
      .filter(t => t.status !== 'Completed' && !isOverdue(t.dueDate, t.status))
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 6);

    renderUpcoming(upcoming);

    // Recent tasks (last 5 created regardless of status)
    const recent = [...tasks]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    renderRecent(recent, tasks);

  } catch (err) {
    console.error('Dashboard load error:', err);
  }
}

// ---- Stats ----
function renderStats(tasks) {
  const total     = tasks.length;
  const completed = tasks.filter(t => t.status === 'Completed').length;
  const overdue   = tasks.filter(t => isOverdue(t.dueDate, t.status)).length;
  const pending   = tasks.filter(t => t.status === 'Pending' && !isOverdue(t.dueDate, t.status)).length;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('stat-total',     total);
  set('stat-pending',   pending);
  set('stat-completed', completed);
  set('stat-overdue',   overdue);
}

// ---- Today's Focus ----
function renderTodayFocus(todayTasks, allTasks) {
  const container = document.getElementById('today-list');
  if (!container) return;

  if (todayTasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:var(--sp-8)">
        <div class="empty-state-icon">🎉</div>
        <div class="empty-state-title">All clear!</div>
        <div class="empty-state-text">No overdue or due-today tasks. Great job staying on track!</div>
      </div>`;
    return;
  }

  container.innerHTML = todayTasks.map(task => buildTaskItem(task)).join('');

  // Bind checkbox toggling
  container.querySelectorAll('.task-checkbox').forEach(cb => {
    cb.addEventListener('click', (e) => {
      e.stopPropagation();
      const taskId = cb.dataset.id;
      toggleTaskStatus(taskId, cb.classList.contains('checked') ? 'Pending' : 'Completed', allTasks);
    });
  });
}

// ---- Upcoming Deadlines ----
function renderUpcoming(tasks) {
  const tbody = document.getElementById('upcoming-body');
  if (!tbody) return;

  if (tasks.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty-state" style="text-align:center;padding:var(--sp-8);color:var(--text-muted);">No upcoming deadlines 🎯</td></tr>`;
    return;
  }

  tbody.innerHTML = tasks.map(task => {
    const rel  = formatDateRelative(task.dueDate);
    const isOD = isOverdue(task.dueDate, task.status);
    const isTD = isDueToday(task.dueDate);
    const dueCls = isOD ? 'overdue' : isTD ? 'today' : (new Date(task.dueDate) - new Date() < 3*24*60*60*1000 ? 'soon' : '');
    return `
      <tr>
        <td>
          <div style="font-weight:600;font-size:var(--text-sm);">${escapeHtml(task.title)}</div>
          ${task.courseCode ? `<div style="font-size:var(--text-xs);color:var(--text-muted);">${escapeHtml(task.courseCode)}</div>` : ''}
        </td>
        <td><span class="chip ${getCategoryClass(task.category)}">${task.category}</span></td>
        <td><span class="chip ${getPriorityClass(task.priority)}">${task.priority}</span></td>
        <td class="due-date-cell ${dueCls}">${rel}</td>
      </tr>`;
  }).join('');
}

// ---- Recent Tasks ----
function renderRecent(tasks, allTasks) {
  const container = document.getElementById('recent-list');
  if (!container) return;

  if (tasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:var(--sp-8)">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-title">No tasks yet</div>
        <div class="empty-state-text">Add your first task using the "New Task" button above.</div>
      </div>`;
    return;
  }

  container.innerHTML = tasks.map(task => buildTaskItem(task)).join('');

  // Bind checkbox toggling
  container.querySelectorAll('.task-checkbox').forEach(cb => {
    cb.addEventListener('click', (e) => {
      e.stopPropagation();
      const taskId = cb.dataset.id;
      toggleTaskStatus(taskId, cb.classList.contains('checked') ? 'Pending' : 'Completed', allTasks);
    });
  });
}

// ---- Build a single task list item HTML ----
function buildTaskItem(task) {
  const isChecked = task.status === 'Completed';
  const isOD      = isOverdue(task.dueDate, task.status);
  const isTD      = isDueToday(task.dueDate);
  const dueCls    = isOD ? 'overdue' : isTD ? 'today' : '';
  const rel       = formatDateRelative(task.dueDate);

  return `
    <div class="task-item ${isChecked ? 'completed' : ''}">
      <button class="task-checkbox ${isChecked ? 'checked' : ''}" data-id="${task._id}" title="${isChecked ? 'Mark pending' : 'Mark complete'}">
        ${isChecked ? '✓' : ''}
      </button>
      <div class="task-item-content">
        <div class="task-item-title">${escapeHtml(task.title)}</div>
        <div class="task-item-meta">
          <span class="chip ${getPriorityClass(task.priority)}">${task.priority}</span>
          <span class="chip ${getCategoryClass(task.category)}">${task.category}</span>
          <span class="task-item-due ${dueCls}">📅 ${rel}</span>
          ${task.courseCode ? `<span style="font-size:var(--text-xs);color:var(--text-muted);">${escapeHtml(task.courseCode)}</span>` : ''}
        </div>
      </div>
    </div>`;
}

// ---- Toggle task status ----
async function toggleTaskStatus(taskId, newStatus, allTasks) {
  try {
    await window.api.put(`/tasks/${taskId}`, { status: newStatus });
    window.api.showToast(newStatus === 'Completed' ? '✓ Task completed!' : 'Task marked as pending', 'success');
    await loadDashboardData(); // Refresh everything
  } catch (err) {
    console.error('Toggle status error:', err);
  }
}

// ---- Task Form Submission (modal) ----
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('task-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const taskId    = document.getElementById('modal-task-id')?.value;
    const titleVal  = document.getElementById('modal-title-input')?.value.trim();
    const dueVal    = document.getElementById('modal-due')?.value;

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
        window.api.showToast('Task updated successfully!', 'success');
      } else {
        await window.api.post('/tasks', payload);
        window.api.showToast('Task created successfully!', 'success');
      }
      closeTaskModal();
      await loadDashboardData();
    } catch (err) {
      console.error('Save task error:', err);
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save Task'; }
    }
  });

  // Quick Add Form
  const quickForm  = document.getElementById('quick-add-form');
  const quickInput = document.getElementById('quick-add-input');

  if (quickForm && quickInput) {
    quickForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = quickInput.value.trim();
      if (!title) return;

      try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        await window.api.post('/tasks', {
          title,
          dueDate:  tomorrow.toISOString().split('T')[0],
          priority: 'Medium',
          category: 'Assignment'
        });
        quickInput.value = '';
        window.api.showToast('Task added!', 'success');
        await loadDashboardData();
      } catch (err) {
        console.error('Quick add error:', err);
      }
    });
  }
});
