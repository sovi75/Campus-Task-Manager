// ============================================================
// study.js — Study Mode / Pomodoro Timer logic
// Depends on: api.js, app.js
// ============================================================

let allTasks          = [];
let currentDuration   = 25; // in minutes
let remainingSeconds  = 25 * 60;
let timerInterval     = null;
let isTimerRunning    = false;
let currentMode       = 'focus'; // focus, short, long

// Web Audio API ambient noise generator (NO files needed)
let audioCtx = null;
let noiseNode = null;
let filterNode = null;
let gainNode = null;

const quotes = [
  "Focus is a muscle, and you build it by using it.",
  "Your mind is for having ideas, not holding them. Focus on one task.",
  "Deep Work: Professional activities performed in a state of distraction-free concentration.",
  "The secret of getting ahead is getting started.",
  "Focus on being productive instead of busy.",
  "You don't need more time, you need more focus.",
  "One task at a time. The multitasker gets nothing done."
];

document.addEventListener('DOMContentLoaded', async () => {
  buildSidebar('study');
  buildTopbar('Study Mode');
  
  // Set up stats
  loadStats();
  
  // Load user tasks to selector
  await loadFocusTasks();

  // Bind timer controls
  setupTimerControls();

  // Bind sound controls
  setupSoundControls();

  // Initial display sync
  updateTimerDisplay();
  changeQuote();
});

// ---- Load focus statistics from localStorage ----
function loadStats() {
  const sessions = localStorage.getItem('study_sessions_completed') || '0';
  const totalMins = localStorage.getItem('study_total_minutes') || '0';
  
  document.getElementById('focus-session-count').textContent = sessions;
  document.getElementById('total-focus-time').textContent = `${totalMins} mins`;
}

// ---- Query pending tasks to focus on ----
async function loadFocusTasks() {
  const select = document.getElementById('study-task-selector');
  if (!select) return;

  try {
    const res = await window.api.get('/tasks');
    if (!res || res.status !== 'success') return;
    allTasks = res.data || [];
    
    // Filter to pending tasks
    const pendingTasks = allTasks.filter(t => t.status !== 'Completed');
    
    pendingTasks.forEach(task => {
      const opt = document.createElement('option');
      opt.value = task._id;
      opt.textContent = `${task.title} ${task.courseCode ? `[${task.courseCode}]` : ''}`;
      select.appendChild(opt);
    });

    // Handle selection change
    select.addEventListener('change', () => {
      const activeId = select.value;
      const detailCard = document.getElementById('active-task-detail');
      
      if (!activeId) {
        detailCard.style.display = 'none';
        return;
      }
      
      const task = pendingTasks.find(t => t._id === activeId);
      if (task) {
        document.getElementById('focus-task-title').textContent = task.title;
        
        const pri = document.getElementById('focus-task-priority');
        pri.textContent = task.priority;
        pri.className = `chip ${getPriorityClass(task.priority)}`;
        
        const cat = document.getElementById('focus-task-category');
        cat.textContent = task.category;
        cat.className = `chip ${getCategoryClass(task.category)}`;
        
        detailCard.style.display = 'flex';
      }
    });

  } catch (err) {
    console.error('Focus task query failed:', err);
  }
}

// ---- Pomodoro Timer Engine ----
function setupTimerControls() {
  const startBtn = document.getElementById('timer-start-btn');
  const resetBtn = document.getElementById('timer-reset-btn');
  const progressBar = document.getElementById('progress-bar');

  // Mode changes
  const modeBtns = {
    focus: document.getElementById('mode-focus'),
    short: document.getElementById('mode-short'),
    long: document.getElementById('mode-long')
  };

  Object.keys(modeBtns).forEach(mode => {
    modeBtns[mode]?.addEventListener('click', () => {
      // Deactivate others
      Object.values(modeBtns).forEach(btn => btn?.classList.remove('active'));
      modeBtns[mode]?.classList.add('active');

      currentMode = mode;
      currentDuration = parseInt(modeBtns[mode].dataset.duration, 10);
      
      stopTimer();
      remainingSeconds = currentDuration * 60;
      updateTimerDisplay();
      
      if (progressBar) {
        progressBar.style.strokeDashoffset = '0';
      }

      startBtn.textContent = currentMode === 'focus' ? 'Start Focus' : 'Start Break';
      changeQuote();
    });
  });

  // Start / Pause
  startBtn?.addEventListener('click', () => {
    if (isTimerRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  // Reset
  resetBtn?.addEventListener('click', () => {
    stopTimer();
    remainingSeconds = currentDuration * 60;
    updateTimerDisplay();
    if (progressBar) {
      progressBar.style.strokeDashoffset = '0';
    }
  });
}

function startTimer() {
  const startBtn = document.getElementById('timer-start-btn');
  isTimerRunning = true;
  if (startBtn) startBtn.textContent = 'Pause';
  changeQuote();

  const totalSecs = currentDuration * 60;
  const progressBar = document.getElementById('progress-bar');

  timerInterval = setInterval(() => {
    if (remainingSeconds > 0) {
      remainingSeconds--;
      updateTimerDisplay();

      // Progress SVG recalculation (stroke-dasharray="283")
      if (progressBar) {
        const offset = 283 * (1 - remainingSeconds / totalSecs);
        progressBar.style.strokeDashoffset = offset;
      }
    } else {
      timerFinished();
    }
  }, 1000);
}

function pauseTimer() {
  const startBtn = document.getElementById('timer-start-btn');
  clearInterval(timerInterval);
  isTimerRunning = false;
  if (startBtn) {
    startBtn.textContent = currentMode === 'focus' ? 'Resume Focus' : 'Resume Break';
  }
}

function stopTimer() {
  clearInterval(timerInterval);
  isTimerRunning = false;
  const startBtn = document.getElementById('timer-start-btn');
  if (startBtn) {
    startBtn.textContent = currentMode === 'focus' ? 'Start Focus' : 'Start Break';
  }
}

function updateTimerDisplay() {
  const display = document.getElementById('time-display');
  if (!display) return;

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  
  const displayStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  display.textContent = displayStr;
  
  // Set tab title too
  document.title = `${displayStr} | Study Mode`;
}

function timerFinished() {
  stopTimer();
  beepAlert();

  if (currentMode === 'focus') {
    window.api.showToast('🎉 Focus session completed! Time for a short break.', 'success');
    
    // Save stats
    const sessions = parseInt(localStorage.getItem('study_sessions_completed') || '0', 10) + 1;
    const minutes = parseInt(localStorage.getItem('study_total_minutes') || '0', 10) + currentDuration;
    
    localStorage.setItem('study_sessions_completed', sessions);
    localStorage.setItem('study_total_minutes', minutes);
    loadStats();

    // Auto trigger check completed if active task selected
    triggerCompleteActiveTask();
  } else {
    window.api.showToast('🎯 Break over! Let\'s focus on our goals.', 'success');
  }

  // Set default Focus Mode back
  document.getElementById('mode-short')?.click();
}

async function triggerCompleteActiveTask() {
  const select = document.getElementById('study-task-selector');
  if (select && select.value) {
    const taskId = select.value;
    const userConfirm = confirm("Do you want to mark this task as COMPLETED in your list?");
    if (userConfirm) {
      try {
        await window.api.put(`/tasks/${taskId}`, { status: 'Completed' });
        window.api.showToast('Task marked Completed!', 'success');
        
        // Remove item from option list
        const opt = select.querySelector(`option[value="${taskId}"]`);
        opt?.remove();
        select.value = '';
        document.getElementById('active-task-detail').style.display = 'none';
      } catch (e) {
        console.error('Task auto complete failed', e);
      }
    }
  }
}

function changeQuote() {
  const quoteBox = document.getElementById('quote-box');
  if (!quoteBox) return;
  const rand = Math.floor(Math.random() * quotes.length);
  quoteBox.textContent = `"${quotes[rand]}"`;
}

// ---- Audio Beep Synthesis ----
function beepAlert() {
  try {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const osc = context.createOscillator();
    const gain = context.createGain();
    
    osc.connect(gain);
    gain.connect(context.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, context.currentTime); // A5 note
    gain.gain.setValueAtTime(0.5, context.currentTime);
    
    osc.start();
    osc.stop(context.currentTime + 0.8);
  } catch (e) {
    console.error('Audio beep failed', e);
  }
}

// ---- Web Audio Ambient Noise Player (No audio files required) ----
function setupSoundControls() {
  const soundToggles = document.querySelectorAll('.sound-play-toggle');

  soundToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const soundType = toggle.dataset.sound;
      const isPlaying = toggle.classList.contains('playing');

      // Stop all sounds first
      stopAmbientNoise();
      soundToggles.forEach(btn => {
        btn.classList.remove('playing');
        btn.textContent = '▶';
      });

      if (!isPlaying) {
        startAmbientNoise(soundType);
        toggle.classList.add('playing');
        toggle.textContent = '⏸';
      }
    });
  });
}

function startAmbientNoise(type) {
  try {
    // Initialize audio context
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const bufferSize = 2 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Generate White Noise
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    noiseNode = audioCtx.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    noiseNode.loop = true;

    // Filter setup (shape the noise for rain or lofi feel)
    filterNode = audioCtx.createBiquadFilter();
    gainNode = audioCtx.createGain();

    if (type === 'rain') {
      // Rain is brown-ish noise (lowpass filtered white noise)
      filterNode.type = 'lowpass';
      filterNode.frequency.value = 400; // soft rain patter
      gainNode.gain.value = 0.8;
    } else if (type === 'cafe') {
      // Cafe is bandpassed hum
      filterNode.type = 'bandpass';
      filterNode.frequency.value = 250;
      gainNode.gain.value = 0.5;
    } else if (type === 'lofi') {
      // Simulated crackle focus
      filterNode.type = 'peaking';
      filterNode.frequency.value = 800;
      gainNode.gain.value = 0.3;
    } else {
      // Pure White noise
      filterNode.type = 'allpass';
      gainNode.gain.value = 0.25;
    }

    noiseNode.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    noiseNode.start(0);
  } catch (e) {
    console.error('Failed to play ambient synthesis:', e);
    window.api.showToast('Web Audio synthesis failed in your browser.', 'error');
  }
}

function stopAmbientNoise() {
  if (noiseNode) {
    try {
      noiseNode.stop();
    } catch (e) {}
    noiseNode = null;
  }
}
