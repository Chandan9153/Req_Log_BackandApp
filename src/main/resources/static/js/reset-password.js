/**
 * ==========================================================
 * RESET PASSWORD CONTROLLER
 * ==========================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('reset-form');
  const tokenInput = document.getElementById('token');
  const newPasswordInput = document.getElementById('newPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const submitBtn = document.getElementById('reset-btn');
  const alertBox = 'reset-alert';
  const tokenBadge = document.getElementById('token-status-badge');
  const strengthContainer = document.getElementById('strength-container');
  const strengthText = document.getElementById('strength-text');

  // Read token from URL query string if present
  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get('token');
  if (tokenFromUrl) {
    tokenInput.value = tokenFromUrl;
    validateTokenWithServer(tokenFromUrl);
  }

  // Live password strength updates
  newPasswordInput.addEventListener('input', () => {
    const pwd = newPasswordInput.value;
    if (pwd.length > 0) {
      strengthContainer.style.display = 'block';
      const strength = evaluatePasswordStrength(pwd);
      strengthContainer.className = 'password-strength-container ' + strength.className;
      strengthText.textContent = strength.text;
    } else {
      strengthContainer.style.display = 'none';
    }
  });

  // Check matching password
  confirmPasswordInput.addEventListener('input', () => {
    if (confirmPasswordInput.value && newPasswordInput.value !== confirmPasswordInput.value) {
      setFieldError('confirmPassword', 'Passwords do not match');
    } else {
      clearFieldError('confirmPassword');
    }
  });

  async function validateTokenWithServer(token) {
    try {
      const res = await apiFetch(`/api/auth/validate-reset-token?token=${encodeURIComponent(token)}`);
      tokenBadge.style.display = 'inline-flex';
      tokenBadge.className = 'badge-pill success';
      tokenBadge.textContent = 'Token Valid';
      newPasswordInput.focus();
    } catch (err) {
      tokenBadge.style.display = 'inline-flex';
      tokenBadge.className = 'badge-pill';
      tokenBadge.style.backgroundColor = '#fee2e2';
      tokenBadge.style.color = '#dc2626';
      tokenBadge.textContent = 'Token Invalid / Expired';
      AlertBox.show(alertBox, 'This reset link is either invalid or has expired. Please request a new one.', 'error');
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllFieldErrors(form);
    AlertBox.hide(alertBox);

    const token = tokenInput.value.trim();
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    let hasErrors = false;

    if (!token) {
      setFieldError('token', 'Reset token is required');
      hasErrors = true;
    }

    if (!newPassword) {
      setFieldError('newPassword', 'New password is required');
      hasErrors = true;
    } else if (newPassword.length < 8) {
      setFieldError('newPassword', 'Password must be at least 8 characters long');
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
      await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword
        })
      });

      Toast.show('Password successfully reset! Redirecting to login...', 'success');
      AlertBox.show(alertBox, 'Password reset successful! Redirecting to sign in...', 'success');

      setTimeout(() => {
        window.location.href = '/login.html?reset=true';
      }, 1500);

    } catch (err) {
      const errorMsg = err.message || 'Failed to reset password. Please check your token.';
      AlertBox.show(alertBox, errorMsg, 'error');
      Toast.show(errorMsg, 'error');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  });
});
