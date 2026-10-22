/**
 * ==========================================================
 * SHARED AUTHENTICATION UTILITIES & HELPERS
 * ==========================================================
 */

// 1. Toast Notification System
const Toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.getElementById('toast-container');
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        document.body.appendChild(this.container);
      }
    }
  },

  show(message, type = 'info', duration = 4000) {
    this.init();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>`;
    } else {
      iconSvg = `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
    }

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-message">${message}</div>
      <button class="toast-close" aria-label="Close">&times;</button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.dismiss(toast));

    this.container.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(toast);
      }, duration);
    }
  },

  dismiss(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.add('toast-hiding');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 250);
  }
};

// 2. Alert Box Helper (For inline card alerts)
const AlertBox = {
  show(boxId, message, type = 'error') {
    const box = document.getElementById(boxId);
    if (!box) return;

    box.className = `alert-box alert-${type} show`;
    let iconSvg = '';
    if (type === 'error') {
      iconSvg = `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    } else if (type === 'success') {
      iconSvg = `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
    } else {
      iconSvg = `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    box.innerHTML = `${iconSvg}<div>${message}</div>`;
  },

  hide(boxId) {
    const box = document.getElementById(boxId);
    if (!box) return;
    box.className = 'alert-box';
    box.innerHTML = '';
  }
};

// 3. Form Field Error Management
function setFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  const formGroup = field.closest('.form-group');
  if (formGroup) {
    formGroup.classList.add('has-error');
    formGroup.classList.remove('has-success');
    let errEl = formGroup.querySelector('.form-error-text');
    if (!errEl) {
      errEl = document.createElement('div');
      errEl.className = 'form-error-text';
      formGroup.appendChild(errEl);
    }
    errEl.innerHTML = `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> ${message}`;
  }
}

function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  const formGroup = field.closest('.form-group');
  if (formGroup) {
    formGroup.classList.remove('has-error');
    const errEl = formGroup.querySelector('.form-error-text');
    if (errEl) errEl.innerHTML = '';
  }
}

function clearAllFieldErrors(form) {
  const groups = form.querySelectorAll('.form-group');
  groups.forEach(g => {
    g.classList.remove('has-error');
    const errEl = g.querySelector('.form-error-text');
    if (errEl) errEl.innerHTML = '';
  });
}

// 4. Password Visibility Toggle
function initPasswordToggles() {
  document.querySelectorAll('.password-toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      // Switch icon
      if (isPassword) {
        btn.innerHTML = `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>`;
        btn.setAttribute('aria-label', 'Hide password');
      } else {
        btn.innerHTML = `<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`;
        btn.setAttribute('aria-label', 'Show password');
      }
    });
  });
}

// 5. Password Strength Meter Calculation
function evaluatePasswordStrength(password) {
  if (!password) {
    return { score: 0, text: 'Too short', className: '' };
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (password.length < 8) {
    return { score: 1, text: 'Weak (min 8 chars)', className: 'strength-weak' };
  }

  if (score <= 2) {
    return { score: 1, text: 'Weak', className: 'strength-weak' };
  } else if (score === 3) {
    return { score: 2, text: 'Fair', className: 'strength-fair' };
  } else if (score === 4) {
    return { score: 3, text: 'Good', className: 'strength-good' };
  } else {
    return { score: 4, text: 'Strong', className: 'strength-strong' };
  }
}

// 6. Generic API Fetch wrapper with session credentials
async function apiFetch(url, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {})
    },
    credentials: 'include' // Send JSESSIONID cookie
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      let errorMessage = 'Request failed. Please try again.';
      if (data && data.message) {
        errorMessage = data.message;
      }
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    throw err;
  }
}

// 7. Perform Logout
async function performLogout() {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' });
  } catch (err) {
    console.warn('Logout API failed:', err);
  } finally {
    sessionStorage.clear();
    window.location.href = '/login.html?loggedOut=true';
  }
}

// Initialize toggles automatically on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggles();
});
