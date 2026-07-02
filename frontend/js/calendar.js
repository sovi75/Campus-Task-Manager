// ============================================================
// calendar.js — Calendar Sync page logic
// Depends on: api.js, app.js
// ============================================================

let allTasks      = [];
let currentDate   = new Date();
let selectedDate  = new Date();

document.addEventListener('DOMContentLoaded', async () => {
  buildSidebar('calendar');
  buildTopbar('Calendar Sync');

  // Load last sync time
  loadSyncTime();

  // Load tasks and build calendar grid
  await loadTasks();

  // Set up calendar navigation handlers
  setupCalendarNav();

  // Set up sync simulator
  setupSyncSimulator();

  // Default day details to today
  selectDay(selectedDate);
});

// ---- Load Last Synced Timestamp ----
function loadSyncTime() {
  const syncTime = localStorage.getItem('calendar_last_synced') || 'Never';
  document.getElementById('sync-last-time').textContent = syncTime;
}

// ---- Query User Tasks ----
async function loadTasks() {
  try {
    const res = await window.api.get('/tasks');
    if (!res || res.status !== 'success') return;
    allTasks = res.data || [];
    
    checkReminders(allTasks);
    renderCalendar();
  } catch (err) {
    console.error('Load calendar tasks failed:', err);
  }
}

// ---- Render Interactive Calendar Grid ----
function renderCalendar() {
  const container = document.getElementById('calendar-days');
  const titleEl = document.getElementById('calendar-month-year');
  if (!container || !titleEl) return;

  container.innerHTML = '';

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Set header title
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  titleEl.textContent = `${monthNames[month]} ${year}`;

  // First day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Total days in current month
  const lastDayDate = new Date(year, month + 1, 0).getDate();

  // Total days in previous month
  const prevLastDayDate = new Date(year, month, 0).getDate();

  // Render previous month offset days
  for (let i = firstDayIndex; i > 0; i--) {
    const dayVal = prevLastDayDate - i + 1;
    const dateObj = new Date(year, month - 1, dayVal);
    container.appendChild(createDayCell(dayVal, dateObj, true));
  }

  // Render current month days
  const today = new Date();
  for (let day = 1; day <= lastDayDate; day++) {
    const dateObj = new Date(year, month, day);
    const isToday = dateObj.toDateString() === today.toDateString();
    container.appendChild(createDayCell(day, dateObj, false, isToday));
  }

  // Render next month offset days to fill grid (6 rows * 7 columns = 42 cells)
  const cellsRendered = firstDayIndex + lastDayDate;
  const nextMonthOffset = 42 - cellsRendered;
  for (let day = 1; day <= nextMonthOffset; day++) {
    const dateObj = new Date(year, month + 1, day);
    container.appendChild(createDayCell(day, dateObj, true));
  }
}

// ---- Create Calendar Day DOM Element ----
function createDayCell(dayNumber, dateObj, isOtherMonth, isToday = false) {
  const cell = document.createElement('div');
  cell.className = 'calendar-day';
  if (isOtherMonth) cell.classList.add('other-month');
  if (isToday) cell.classList.add('today');
  if (dateObj.toDateString() === selectedDate.toDateString()) cell.classList.add('selected');

  cell.innerHTML = `<span class="calendar-day-number">${dayNumber}</span>`;

  // Find tasks due on this date
  const dateStr = dateObj.toDateString();
  const dayTasks = allTasks.filter(task => {
    const taskDue = new Date(task.dueDate);
    return taskDue.toDateString() === dateStr;
  });

  if (dayTasks.length > 0) {
    const tasksContainer = document.createElement('div');
    tasksContainer.className = 'calendar-day-tasks';
    
    // Show maximum of 3 task dots to avoid grid overflow
    dayTasks.slice(0, 3).forEach(task => {
      const dot = document.createElement('div');
      dot.className = `calendar-task-dot ${task.status === 'Completed' ? 'completed' : getPriorityClass(task.priority).replace('chip-', '')}`;
      dot.textContent = task.title;
      dot.title = `${task.title} [${task.priority}]`;
      tasksContainer.appendChild(dot);
    });

    if (dayTasks.length > 3) {
      const moreLabel = document.createElement('div');
      moreLabel.style.fontSize = '9px';
      moreLabel.style.color = 'var(--text-muted)';
      moreLabel.style.fontWeight = '700';
      moreLabel.textContent = `+${dayTasks.length - 3} more`;
      tasksContainer.appendChild(moreLabel);
    }
    
    cell.appendChild(tasksContainer);
  }

  // Handle day click
  cell.addEventListener('click', () => {
    document.querySelectorAll('.calendar-day').forEach(c => c.classList.remove('selected'));
    cell.classList.add('selected');
    selectedDate = dateObj;
    selectDay(dateObj);
  });

  return cell;
}

// ---- Select Day and Show Sidebar Tasks ----
function selectDay(dateObj) {
  const title = document.getElementById('selected-day-title');
  const container = document.getElementById('selected-day-tasks');
  if (!title || !container) return;

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  title.textContent = `Tasks Due: ${dateObj.getDate()} ${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

  const dateStr = dateObj.toDateString();
  const dayTasks = allTasks.filter(task => {
    return new Date(task.dueDate).toDateString() === dateStr;
  });

  if (dayTasks.length === 0) {
    container.innerHTML = `
      <div style="font-size: var(--text-xs); color: var(--text-muted); text-align: center; padding: var(--sp-6);">
        💤 No tasks due on this date.
      </div>`;
    return;
  }

  container.innerHTML = dayTasks.map(task => {
    const isCompleted = task.status === 'Completed';
    return `
      <div style="display:flex; align-items:flex-start; gap:var(--sp-2); padding:var(--sp-2) 0; border-bottom:1px solid var(--border);">
        <input type="checkbox" class="task-day-checkbox" data-id="${task._id}" ${isCompleted ? 'checked' : ''} style="margin-top: 3px; cursor: pointer; accent-color: var(--primary);">
        <div style="flex:1; min-width:0;">
          <div style="font-weight:600; font-size:var(--text-xs); color:var(--text-primary); ${isCompleted ? 'text-decoration:line-through;color:var(--text-muted);' : ''}">${escapeHtml(task.title)}</div>
          <div style="display:flex; gap:4px; margin-top:2px;">
            <span class="chip ${getPriorityClass(task.priority)}" style="font-size:8px; padding:1px 4px;">${task.priority}</span>
            <span class="chip ${getCategoryClass(task.category)}" style="font-size:8px; padding:1px 4px;">${task.category}</span>
          </div>
        </div>
      </div>`;
  }).join('');

  // Bind checkbox toggle complete
  container.querySelectorAll('.task-day-checkbox').forEach(cb => {
    cb.addEventListener('change', async () => {
      const taskId = cb.dataset.id;
      const newStatus = cb.checked ? 'Completed' : 'Pending';
      try {
        await window.api.put(`/tasks/${taskId}`, { status: newStatus });
        window.api.showToast(newStatus === 'Completed' ? '✓ Task completed!' : 'Task marked as pending', 'success');
        
        // Reload all data
        await loadTasks();
        selectDay(selectedDate);
      } catch (err) {
        console.error('Day task status toggle failed:', err);
      }
    });
  });
}

// ---- Calendar Grid Navigation ----
function setupCalendarNav() {
  document.getElementById('cal-prev-btn')?.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });

  document.getElementById('cal-next-btn')?.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });

  document.getElementById('cal-today-btn')?.addEventListener('click', () => {
    currentDate = new Date();
    selectedDate = new Date();
    renderCalendar();
    selectDay(selectedDate);
  });
}

// ---- Sync Simulator Modal Controller ----
function setupSyncSimulator() {
  const syncBtn = document.getElementById('sync-start-btn');
  const overlay = document.getElementById('sync-modal-overlay');
  const progressFill = document.getElementById('sync-progress-fill');
  const stepLabel = document.getElementById('sync-step-label');
  const detailLabel = document.getElementById('sync-detail-label');

  syncBtn?.addEventListener('click', () => {
    if (overlay) overlay.classList.remove('hidden');
    if (progressFill) progressFill.style.width = '0%';

    const steps = [
      { progress: 20, step: "Connecting to secure calendar server...", detail: "Checking secure OAuth tokens" },
      { progress: 50, step: "Authorizing external credentials...", detail: "Updating secure sync profile" },
      { progress: 85, step: `Syncing ${allTasks.length} campus deadlines...`, detail: "Uploading syllabus tasks to cloud calendar" },
      { progress: 100, step: "Calendar successfully updated!", detail: "Done! Synced with Google & Outlook" }
    ];

    let currentStep = 0;

    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        const item = steps[currentStep];
        if (progressFill) progressFill.style.width = `${item.progress}%`;
        if (stepLabel) stepLabel.textContent = item.step;
        if (detailLabel) detailLabel.textContent = item.detail;
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          if (overlay) overlay.classList.add('hidden');
          
          // Complete success actions
          beepAlert();
          window.api.showToast(`📅 Calendar synced successfully! ${allTasks.length} tasks matching.`, 'success');

          // Log sync timestamp
          const now = new Date();
          const timestamp = now.toLocaleString('en-IN', {
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            day: 'numeric', month: 'short', year: 'numeric'
          });
          localStorage.setItem('calendar_last_synced', timestamp);
          loadSyncTime();
        }, 1000);
      }
    }, 1500);
  });
}

function beepAlert() {
  try {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const osc = context.createOscillator();
    const gain = context.createGain();
    
    osc.connect(gain);
    gain.connect(context.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, context.currentTime); // E5 note
    gain.gain.setValueAtTime(0.3, context.currentTime);
    
    osc.start();
    osc.stop(context.currentTime + 0.3);
  } catch (e) {
    console.error('Audio beep failed', e);
  }
}
