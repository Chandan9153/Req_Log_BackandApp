/**
 * ==========================================================
 * REGISTRATION CONTROLLER & VALIDATIONS
 * ==========================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('register-form');
  const submitBtn = document.getElementById('register-btn');
  const alertBox = 'register-alert';

  const fullNameInput = document.getElementById('fullName');
  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  const mobileInput = document.getElementById('mobileNumber');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const strengthContainer = document.getElementById('strength-container');
  const strengthText = document.getElementById('strength-text');

  // 1. Password input event -> update strength meter
  passwordInput.addEventListener('input', () => {
    const pwd = passwordInput.value;
    if (pwd.length > 0) {
      strengthContainer.style.display = 'block';
      const strength = evaluatePasswordStrength(pwd);
      strengthContainer.className = 'password-strength-container ' + strength.className;
      strengthText.textContent = strength.text;
    } else {
      strengthContainer.style.display = 'none';
    }

    if (confirmPasswordInput.value.length > 0) {
      validatePasswordMatch();
    }
  });

  // 2. Confirm password event -> match check
  confirmPasswordInput.addEventListener('input', () => {
    validatePasswordMatch();
  });

  function validatePasswordMatch() {
    if (confirmPasswordInput.value && passwordInput.value !== confirmPasswordInput.value) {
      setFieldError('confirmPassword', 'Passwords do not match');
      return false;
    } else {
      clearFieldError('confirmPassword');
      return true;
    }
  }

  // Clear errors on field focus
  [fullNameInput, usernameInput, emailInput, mobileInput, passwordInput, confirmPasswordInput].forEach(input => {
    input.addEventListener('focus', () => {
      clearFieldError(input.id);
      AlertBox.hide(alertBox);
    });
  });

  // 3. Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllFieldErrors(form);
    AlertBox.hide(alertBox);

    const fullName = fullNameInput.value.trim();
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const mobileNumber = mobileInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    let hasErrors = false;

    // Validate Full Name
    if (!fullName) {
      setFieldError('fullName', 'Full name is required');
      hasErrors = true;
    } else if (fullName.length < 2) {
      setFieldError('fullName', 'Full name must be at least 2 characters');
      hasErrors = true;
    }

    // Validate Username
    if (!username) {
      setFieldError('username', 'Username is required');
      hasErrors = true;
    } else if (username.length < 3) {
      setFieldError('username', 'Username must be at least 3 characters');
      hasErrors = true;
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      setFieldError('username', 'Username can only contain letters, numbers, dots, and underscores');
      hasErrors = true;
    }

    // Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setFieldError('email', 'Email address is required');
      hasErrors = true;
    } else if (!emailRegex.test(email)) {
      setFieldError('email', 'Please enter a valid email address (e.g. name@domain.com)');
      hasErrors = true;
    }

    // Validate Mobile Number (optional)
    if (mobileNumber && !/^[+0-9\s()\-.]{7,25}$/.test(mobileNumber)) {
      setFieldError('mobileNumber', 'Please enter a valid phone number or leave empty');
      hasErrors = true;
    }

    // Validate Password
    if (!password) {
      setFieldError('password', 'Password is required');
      hasErrors = true;
    } else if (password.length < 8) {
      setFieldError('password', 'Password must contain at least 8 characters');
      hasErrors = true;
    }

    // Validate Confirm Password
    if (!confirmPassword) {
      setFieldError('confirmPassword', 'Please confirm your password');
      hasErrors = true;
    } else if (password !== confirmPassword) {
      setFieldError('confirmPassword', 'Passwords do not match');
      hasErrors = true;
    }

    if (hasErrors) {
      AlertBox.show(alertBox, 'Please review the highlighted fields above.', 'error');
      return;
    }

    // Submit payload to Spring Boot Backend API
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
      const response = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          username,
          email,
          mobileNumber,
          password,
          confirmPassword
        })
      });

      Toast.show('Account created successfully! Redirecting to login...', 'success');
      AlertBox.show(alertBox, 'Registration successful! Redirecting to login page...', 'success');

      // Pre-fill email on login page
      setTimeout(() => {
        window.location.href = `/login.html?registered=true&email=${encodeURIComponent(email)}`;
      }, 1200);

    } catch (err) {
      console.error('Registration failed:', err);
      let errorMsg = err.message || 'Registration failed. Please check your inputs.';

      if (err.data && err.data.data) {
        // Field-specific validation errors returned from Spring Boot
        const fieldErrors = err.data.data;
        Object.keys(fieldErrors).forEach(field => {
          setFieldError(field, fieldErrors[field]);
        });
      }

      if (errorMsg.toLowerCase().includes('email')) {
        setFieldError('email', errorMsg);
      } else if (errorMsg.toLowerCase().includes('username')) {
        setFieldError('username', errorMsg);
      }

      AlertBox.show(alertBox, errorMsg, 'error');
      Toast.show(errorMsg, 'error');

    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  });
});
