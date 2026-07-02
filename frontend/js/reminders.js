// ============================================================
// reminders.js — Periodic Reminder Checker
// Loaded on all protected pages to check deadlines in real-time.
// ============================================================

(function initReminders() {
  // Store notified task IDs in localStorage to avoid duplicate notifications in the same session
  let notifiedTasks = {};
  try {
    notifiedTasks = JSON.parse(localStorage.getItem('notified_reminders') || '{}');
  } catch (e) {
    notifiedTasks = {};
  }

  // Periodic reminder checking function
  async function runCheck() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await window.api.get('/tasks');
      if (!res || res.status !== 'success') return;
      const tasks = res.data || [];

      const now = new Date();
      let updated = false;

      tasks.forEach(task => {
        if (task.status === 'Completed' || !task.reminders?.enabled) return;

        const due = new Date(task.dueDate);
        const diff = due - now; // diff in milliseconds
        const minutes = diff / (1000 * 60);
        const option = task.reminders.option;

        let shouldNotify = false;
        let notificationMsg = '';
        let typeKey = '';

        if (option === '1 hour before' && minutes > 0 && minutes <= 60) {
          shouldNotify = true;
          notificationMsg = `⏰ "${task.title}" is due in ${Math.round(minutes)} minutes!`;
          typeKey = `${task._id}_1h`;
        } else if (option === '1 day before' && minutes > 0 && minutes <= 24 * 60) {
          shouldNotify = true;
          const hoursLeft = Math.round(minutes / 60);
          notificationMsg = `🔔 "${task.title}" is due in ${hoursLeft} hours!`;
          typeKey = `${task._id}_1d`;
        } else if (option === 'At time of due' && Math.abs(minutes) <= 5) {
          shouldNotify = true;
          notificationMsg = `🚨 "${task.title}" is due now!`;
          typeKey = `${task._id}_due`;
        }

        // Show notification if not already notified
        if (shouldNotify && !notifiedTasks[typeKey]) {
          window.api.showToast(notificationMsg, 'error');
          
          // Request browser notifications if supported and permitted
          if (window.Notification && Notification.permission === 'granted') {
            new Notification('Campus Task Manager Reminder', {
              body: notificationMsg,
              icon: 'favicon.ico'
            });
          }

          notifiedTasks[typeKey] = now.toISOString();
          updated = true;
        }
      });

      if (updated) {
        localStorage.setItem('notified_reminders', JSON.stringify(notifiedTasks));
      }
    } catch (err) {
      console.error('Reminder check failed:', err);
    }
  }

  // Request native permission
  if (window.Notification && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // Initial check and set interval check every 30 seconds
  document.addEventListener('DOMContentLoaded', () => {
    // Wait a brief moment to allow page resources to load
    setTimeout(runCheck, 1500);
    setInterval(runCheck, 30000);
  });
})();
