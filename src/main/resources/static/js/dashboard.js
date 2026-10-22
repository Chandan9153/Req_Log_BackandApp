/**
 * ==========================================================
 * DASHBOARD CONTROLLER & ROUTE GUARD
 * ==========================================================
 */

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Authenticate Route Guard
  await checkAuthenticationAndLoadProfile();

  // 2. Setup Dashboard UI Handlers
  initTabNavigation();
  initChangePasswordForm();
  initLogoutHandler();
});

/**
 * Checks session against Spring Security API `/api/auth/me`.
 * If unauthenticated, immediately redirects to login.html.
 */
async function checkAuthenticationAndLoadProfile() {
  try {
    const response = await apiFetch('/api/auth/me');
    if (!response || !response.data) {
      throw new Error('User not authenticated');
    }

    currentUser = response.data;
    renderUserProfile(currentUser);

  } catch (err) {
    console.warn('Authentication check failed:', err);
    // Unauthenticated -> redirect to login with guard parameter
    window.location.href = '/login.html?redirect=dashboard.html&sessionExpired=true';
  }
}

/**
 * Renders user profile information into dashboard DOM elements.
 */
function renderUserProfile(user) {
  // 1. Avatar initials
  const initials = getInitials(user.fullName || user.username);
  const avatarEl = document.getElementById('nav-avatar');
  if (avatarEl) avatarEl.textContent = initials;

  // 2. Nav username
  const navUserName = document.getElementById('nav-user-name');
  if (navUserName) navUserName.textContent = user.fullName || user.username;

  // 3. Hero greeting
  const heroWelcome = document.getElementById('hero-welcome');
  if (heroWelcome) {
    const greeting = getTimeGreeting();
    heroWelcome.textContent = `${greeting}, ${user.fullName || user.username}!`;
  }

  // 4. Quick stats
  setText('stat-full-name', user.fullName || '--');
  setText('stat-username', '@' + (user.username || '--'));
  setText('stat-created-at', formatDate(user.createdAt));

  // 5. Profile Tab info cards
  setText('profile-full-name', user.fullName || '--');
  setText('profile-username', '@' + (user.username || '--'));
  setText('profile-email', user.email || '--');
  setText('profile-user-id', '#' + (user.id || '--'));
  setText('profile-created-at', formatFullDateTime(user.createdAt));

  const mobileEl = document.getElementById('profile-mobile');
  const badgeMobile = document.getElementById('badge-mobile');
  if (user.mobileNumber && user.mobileNumber.trim().length > 0) {
    if (mobileEl) mobileEl.textContent = user.mobileNumber;
    if (badgeMobile) {
      badgeMobile.className = 'badge-pill success';
      badgeMobile.textContent = 'Provided';
    }
  } else {
    if (mobileEl) mobileEl.textContent = 'Not provided';
    if (badgeMobile) {
      badgeMobile.className = 'badge-pill';
      badgeMobile.style.backgroundColor = '#f1f5f9';
      badgeMobile.style.color = '#64748b';
      badgeMobile.textContent = 'Optional';
    }
  }
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(dateStr) {
  if (!dateStr) return 'Recently';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

function formatFullDateTime(dateStr) {
  if (!dateStr) return 'Recently';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateStr;
  }
}

/**
 * Initializes Tab navigation
 */
function initTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTabId = btn.getAttribute('data-tab');

      // Update button active state
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update pane active state
      tabPanes.forEach(pane => {
        if (pane.id === targetTabId) {
          pane.classList.add('active');
        } else {
          pane.classList.remove('active');
        }
      });
    });
  });

  // Action button in hero banner
  const actionEditPwd = document.getElementById('action-edit-password');
  if (actionEditPwd) {
    actionEditPwd.addEventListener('click', () => {
      const securityTabBtn = document.querySelector('.tab-btn[data-tab="tab-security"]');
      if (securityTabBtn) securityTabBtn.click();
    });
  }
}

/**
 * Change Password form handler
 */
function initChangePasswordForm() {
  const form = document.getElementById('change-password-form');
  if (!form) return;

  const currentPwdInput = document.getElementById('currentPassword');
  const newPwdInput = document.getElementById('newPassword');
  const confirmPwdInput = document.getElementById('confirmPassword');
  const submitBtn = document.getElementById('change-pwd-btn');
  const alertBox = 'change-password-alert';
  const strengthContainer = document.getElementById('strength-container');
  const strengthText = document.getElementById('strength-text');

  // New password strength meter
  newPwdInput.addEventListener('input', () => {
    const pwd = newPwdInput.value;
    if (pwd.length > 0) {
      strengthContainer.style.display = 'block';
      const strength = evaluatePasswordStrength(pwd);
      strengthContainer.className = 'password-strength-container ' + strength.className;
      strengthText.textContent = strength.text;
    } else {
      strengthContainer.style.display = 'none';
    }
  });

  // Confirm password matching
  confirmPwdInput.addEventListener('input', () => {
    if (confirmPwdInput.value && newPwdInput.value !== confirmPwdInput.value) {
      setFieldError('confirmPassword', 'New passwords do not match');
    } else {
      clearFieldError('confirmPassword');
    }
  });

  // Clear errors on focus
  [currentPwdInput, newPwdInput, confirmPwdInput].forEach(inp => {
    inp.addEventListener('focus', () => {
      clearFieldError(inp.id);
      AlertBox.hide(alertBox);
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllFieldErrors(form);
    AlertBox.hide(alertBox);

    const currentPassword = currentPwdInput.value;
    const newPassword = newPwdInput.value;
    const confirmPassword = confirmPwdInput.value;

    let hasErrors = false;

    if (!currentPassword) {
      setFieldError('currentPassword', 'Current password is required');
      hasErrors = true;
    }

    if (!newPassword) {
      setFieldError('newPassword', 'New password is required');
      hasErrors = true;
    } else if (newPassword.length < 8) {
      setFieldError('newPassword', 'Password must contain at least 8 characters');
      hasErrors = true;
    }

    if (!confirmPassword) {
      setFieldError('confirmPassword', 'Please confirm your new password');
      hasErrors = true;
    } else if (newPassword !== confirmPassword) {
      setFieldError('confirmPassword', 'Passwords do not match');
      hasErrors = true;
    }

    if (hasErrors) return;

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
      await apiFetch('/api/user/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword
        })
      });

      form.reset();
      strengthContainer.style.display = 'none';
      AlertBox.show(alertBox, 'Password successfully changed! Your account is secure.', 'success');
      Toast.show('Password updated successfully!', 'success');

    } catch (err) {
      console.error('Password change failed:', err);
      const errorMsg = err.message || 'Failed to update password. Please check your current password.';
      AlertBox.show(alertBox, errorMsg, 'error');
      Toast.show(errorMsg, 'error');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  });
}

/**
 * Logout handler
 */
function initLogoutHandler() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      logoutBtn.disabled = true;
      Toast.show('Logging out...', 'info');
      await performLogout();
    });
  }
}
