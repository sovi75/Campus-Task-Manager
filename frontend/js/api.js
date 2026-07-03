// ============================================================
// api.js — Global API Fetch Client
// Provides: api.get(), api.post(), api.put(), api.delete()
// and api.showToast() for use across all pages.
// ============================================================

const API_BASE_URL = '/api';

// ----- Toast Notification Utility -----
const showToast = (message, type = 'success') => {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  // Icon
  const icon = type === 'success' ? '✓' : '✕';
  toast.innerHTML = `<span class="toast-icon">${icon}</span> ${message}`;

  container.appendChild(toast);

  // Auto remove after 4 seconds
  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, 4000);
};

// ----- Core Request Wrapper -----
const request = async (method, endpoint, body = null) => {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = { method, headers };
  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Handle 401 Unauthorized — redirect to login unless on auth pages
    if (response.status === 401) {
      const isAuthPage =
        window.location.pathname.includes('login.html') ||
        window.location.pathname.includes('register.html');

      if (!isAuthPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
        return null;
      }
      // On auth pages: just parse and throw the error message
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || 'Invalid credentials');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong. Please try again.');
    }

    return data;
  } catch (error) {
    // Only toast if it's a real API error, not a JS syntax error
    const msg = error.message || 'Network error. Is the server running?';
    console.error(`API Error [${method} ${endpoint}]:`, msg);
    showToast(msg, 'error');
    throw error;
  }
};

// ----- Expose globally on window -----
window.api = {
  get:       (endpoint)       => request('GET',    endpoint),
  post:      (endpoint, body) => request('POST',   endpoint, body),
  put:       (endpoint, body) => request('PUT',    endpoint, body),
  delete:    (endpoint)       => request('DELETE', endpoint),
  showToast
};
