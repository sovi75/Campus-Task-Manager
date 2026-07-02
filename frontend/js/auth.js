// ============================================================
// auth.js — Handles login and registration form interactions.
// Depends on: api.js (window.api must be loaded first)
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // ---- Redirect if already logged in ----
  const existingToken = localStorage.getItem('token');
  if (existingToken) {
    // Only redirect if dashboard.html exists (avoid loop if it hasn't been built)
    fetch('dashboard.html', { method: 'HEAD' })
      .then(res => { if (res.ok) window.location.href = 'dashboard.html'; })
      .catch(() => {});
  }

  const loginForm    = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  // ---- Register Form ----
  if (registerForm) {
    const nameInput     = document.getElementById('name');
    const emailInput    = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    setupClearErrors([nameInput, emailInput, passwordInput]);

    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!validateRegisterForm(nameInput, emailInput, passwordInput)) return;

      const submitBtn = registerForm.querySelector('button[type="submit"]');
      setLoading(submitBtn, true, 'Creating account...');

      try {
        const res = await window.api.post('/auth/register', {
          name:     nameInput.value.trim(),
          email:    emailInput.value.trim(),
          password: passwordInput.value
        });

        if (res && res.status === 'success') {
          saveSession(res.data);
          window.api.showToast('Account created! Redirecting to dashboard...', 'success');
          setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
        }
      } catch (_) {
        // Error already shown by api.js toast
      } finally {
        setLoading(submitBtn, false, 'Sign Up');
      }
    });
  }

  // ---- Login Form ----
  if (loginForm) {
    const emailInput    = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    setupClearErrors([emailInput, passwordInput]);

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!validateLoginForm(emailInput, passwordInput)) return;

      const submitBtn = loginForm.querySelector('button[type="submit"]');
      setLoading(submitBtn, true, 'Signing in...');

      try {
        const res = await window.api.post('/auth/login', {
          email:    emailInput.value.trim(),
          password: passwordInput.value
        });

        if (res && res.status === 'success') {
          saveSession(res.data);
          window.api.showToast('Login successful! Redirecting...', 'success');
          setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
        }
      } catch (_) {
        // Error already shown by api.js toast
      } finally {
        setLoading(submitBtn, false, 'Sign In');
      }
    });
  }

  // ============================================================
  // Helpers
  // ============================================================

  function saveSession(data) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({
      _id:   data._id,
      name:  data.name,
      email: data.email
    }));
  }

  function setLoading(btn, isLoading, text) {
    btn.disabled  = isLoading;
    btn.innerHTML = isLoading
      ? `<span class="btn-spinner"></span> ${text}`
      : text;
  }

  function setupClearErrors(inputs) {
    inputs.forEach(input => {
      if (!input) return;
      input.addEventListener('input', () => {
        input.classList.remove('is-invalid');
        const errEl = document.getElementById(`${input.id}-error`);
        if (errEl) errEl.textContent = '';
      });
    });
  }

  function setError(input, message) {
    input.classList.add('is-invalid');
    const errEl = document.getElementById(`${input.id}-error`);
    if (errEl) errEl.textContent = message;
  }

  function validateRegisterForm(nameInput, emailInput, passwordInput) {
    let valid = true;

    if (!nameInput.value.trim()) {
      setError(nameInput, 'Full name is required'); valid = false;
    }

    const emailVal = emailInput.value.trim();
    if (!emailVal) {
      setError(emailInput, 'Email address is required'); valid = false;
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(emailVal)) {
      setError(emailInput, 'Please enter a valid email address'); valid = false;
    }

    if (!passwordInput.value) {
      setError(passwordInput, 'Password is required'); valid = false;
    } else if (passwordInput.value.length < 6) {
      setError(passwordInput, 'Password must be at least 6 characters'); valid = false;
    }

    return valid;
  }

  function validateLoginForm(emailInput, passwordInput) {
    let valid = true;

    if (!emailInput.value.trim()) {
      setError(emailInput, 'Email address is required'); valid = false;
    }

    if (!passwordInput.value) {
      setError(passwordInput, 'Password is required'); valid = false;
    }

    return valid;
  }
});
