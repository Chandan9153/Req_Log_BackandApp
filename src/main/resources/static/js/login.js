/**
 * ==========================================================
 * LOGIN CONTROLLER & MODAL LOGIC
 * ==========================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const rememberMeCheckbox = document.getElementById('rememberMe');
  const submitBtn = document.getElementById('login-btn');
  const alertBox = 'login-alert';

  // Forgot password modal elements
  const forgotTrigger = document.getElementById('forgot-password-trigger');
  const modal = document.getElementById('forgot-password-modal');
  const modalClose = document.getElementById('modal-close');
  const forgotForm = document.getElementById('forgot-password-form');
  const resetEmailInput = document.getElementById('resetEmail');
  const resetSubmitBtn = document.getElementById('reset-submit-btn');
  const modalAlert = 'modal-alert';
  const modalResult = document.getElementById('modal-token-result');
  const modalLinkDisplay = document.getElementById('modal-link-display');
  const modalDirectLink = document.getElementById('modal-direct-link');

  // 1. Process URL query parameters for feedback messages
  const params = new URLSearchParams(window.location.search);

  if (params.get('registered') === 'true') {
    AlertBox.show(alertBox, 'Registration successful! Please sign in with your credentials.', 'success');
    Toast.show('Account created! Please sign in.', 'success');
    if (params.get('email')) {
      emailInput.value = decodeURIComponent(params.get('email'));
      passwordInput.focus();
    }
  } else if (params.get('loggedOut') === 'true') {
    AlertBox.show(alertBox, 'You have been logged out successfully.', 'info');
    Toast.show('Logged out successfully.', 'info');
  } else if (params.get('reset') === 'true') {
    AlertBox.show(alertBox, 'Your password was successfully reset. You can now log in.', 'success');
    Toast.show('Password reset successfully! Please sign in.', 'success');
  } else if (params.get('sessionExpired') === 'true') {
    AlertBox.show(alertBox, 'Your session has expired. Please sign in again.', 'info');
    Toast.show('Session expired. Please sign in again.', 'info');
  }

  // 2. Remember Me restoration
  const savedEmail = localStorage.getItem('auth_remembered_email');
  if (savedEmail && !emailInput.value) {
    emailInput.value = savedEmail;
    rememberMeCheckbox.checked = true;
    passwordInput.focus();
  }

  // Clear errors on input focus
  [emailInput, passwordInput].forEach(inp => {
    inp.addEventListener('focus', () => {
      clearFieldError(inp.id);
      AlertBox.hide(alertBox);
    });
  });

  // 3. Login Form Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllFieldErrors(form);
    AlertBox.hide(alertBox);

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const rememberMe = rememberMeCheckbox.checked;

    let hasErrors = false;

    if (!email) {
      setFieldError('email', 'Email or username is required');
      hasErrors = true;
    }

    if (!password) {
      setFieldError('password', 'Password is required');
      hasErrors = true;
    }

    if (hasErrors) return;

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          rememberMe
        })
      });

      // Handle remember me storage
      if (rememberMe) {
        localStorage.setItem('auth_remembered_email', email);
      } else {
        localStorage.removeItem('auth_remembered_email');
      }

      Toast.show('Login successful! Redirecting to dashboard...', 'success');
      AlertBox.show(alertBox, 'Login successful! Redirecting...', 'success');

      // Check redirect target
      const redirectUrl = params.get('redirect') || '/dashboard.html';
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 700);

    } catch (err) {
      console.error('Login error:', err);
      const errorMsg = err.message || 'Invalid email/username or password.';
      AlertBox.show(alertBox, errorMsg, 'error');
      Toast.show(errorMsg, 'error');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  });

  // 4. Forgot Password Modal handling
  forgotTrigger.addEventListener('click', (e) => {
    e.preventDefault();
    modal.classList.add('show');
    resetEmailInput.value = emailInput.value || '';
    modalResult.style.display = 'none';
    AlertBox.hide(modalAlert);
    resetEmailInput.focus();
  });

  modalClose.addEventListener('click', () => {
    modal.classList.remove('show');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
    }
  });

  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFieldError('resetEmail');
    AlertBox.hide(modalAlert);

    const resetEmail = resetEmailInput.value.trim();
    if (!resetEmail) {
      setFieldError('resetEmail', 'Email is required');
      return;
    }

    resetSubmitBtn.classList.add('loading');
    resetSubmitBtn.disabled = true;

    try {
      const res = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: resetEmail })
      });

      AlertBox.show(modalAlert, res.message, 'success');
      Toast.show('Reset token generated!', 'success');

      if (res.data && res.data.resetUrl) {
        modalResult.style.display = 'block';
        const fullUrl = window.location.origin + res.data.resetUrl;
        modalLinkDisplay.textContent = fullUrl;
        modalDirectLink.href = res.data.resetUrl;
      }

    } catch (err) {
      AlertBox.show(modalAlert, err.message || 'No user found with that email.', 'error');
      Toast.show(err.message || 'Password reset request failed', 'error');
    } finally {
      resetSubmitBtn.classList.remove('loading');
      resetSubmitBtn.disabled = false;
    }
  });
});
