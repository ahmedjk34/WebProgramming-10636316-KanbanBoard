console.log("🔐 Loading Authentication System...");

class AuthManager {
  constructor() {
    this.currentPage = this.detectCurrentPage();
    this.isSubmitting = false;

    console.log("🔐 AuthManager initialized for:", this.currentPage);
  }

  /**
   * Detect which authentication page we're on
   */
  detectCurrentPage() {
    const path = window.location.pathname;
    if (path.includes("login.html") || path.includes("login")) {
      return "login";
    } else if (path.includes("signup.html") || path.includes("signup")) {
      return "signup";
    }
    return "login"; // Default fallback
  }

  /**
   * Initialize authentication system
   */
  init() {
    console.log("🚀 Initializing authentication system...");

    this.setupThemeToggle();
    this.setupFormHandlers();
    this.setupPasswordToggles();
    this.setupGuestLogin();

    if (this.currentPage === "signup") {
      this.setupPasswordStrength();
    }

    console.log("✅ Authentication system initialized");
  }

  /**
   * Setup theme toggle functionality
   */
  setupThemeToggle() {
    const themeToggle = document.getElementById("theme-toggle");
    const themeIcon = document.getElementById("theme-icon");

    if (themeToggle && themeIcon) {
      // Load saved theme
      const savedTheme = localStorage.getItem("theme") || "light";
      document.body.setAttribute("data-theme", savedTheme);
      themeIcon.textContent = savedTheme === "dark" ? "☀️" : "🌙";

      themeToggle.addEventListener("click", () => {
        const currentTheme = document.body.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";

        document.body.setAttribute("data-theme", newTheme);
        themeIcon.textContent = newTheme === "dark" ? "☀️" : "🌙";
        localStorage.setItem("theme", newTheme);
      });
    }
  }

  /**
   * Setup form submission handlers
   */
  setupFormHandlers() {
    const loginForm = document.getElementById("login-form");
    const signupForm = document.getElementById("signup-form");

    if (loginForm) {
      loginForm.addEventListener("submit", (e) => this.handleLogin(e));
    }

    if (signupForm) {
      signupForm.addEventListener("submit", (e) => this.handleSignup(e));
    }
  }

  /**
   * Setup password visibility toggles
   */
  setupPasswordToggles() {
    const passwordToggles = document.querySelectorAll(".password-toggle");

    passwordToggles.forEach((toggle) => {
      toggle.addEventListener("click", (e) => {
        e.preventDefault();
        const input = toggle.previousElementSibling;
        const icon = toggle.querySelector(".toggle-icon");

        if (input.type === "password") {
          input.type = "text";
          icon.textContent = "🙈";
        } else {
          input.type = "password";
          icon.textContent = "👁️";
        }
      });
    });
  }

  /**
   * Setup password strength checker (signup only)
   */
  setupPasswordStrength() {
    const passwordInput = document.getElementById("password");
    const strengthFill = document.getElementById("strength-fill");
    const strengthText = document.getElementById("strength-text");

    if (passwordInput && strengthFill && strengthText) {
      passwordInput.addEventListener("input", (e) => {
        const strength = this.calculatePasswordStrength(e.target.value);
        this.updatePasswordStrength(strength, strengthFill, strengthText);
      });
    }
  }

  /**
   * Setup guest login functionality
   */
  setupGuestLogin() {
    const guestBtn = document.getElementById("guest-login-btn");

    if (guestBtn) {
      guestBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleGuestLogin();
      });
    }
  }

  /**
   * Calculate password strength
   */
  calculatePasswordStrength(password) {
    let score = 0;

    if (password.length >= 8) score += 1;
    if (password.match(/[a-z]/)) score += 1;
    if (password.match(/[A-Z]/)) score += 1;
    if (password.match(/[0-9]/)) score += 1;
    if (password.match(/[^a-zA-Z0-9]/)) score += 1;

    if (score <= 2) return { level: "weak", percentage: 25 };
    if (score <= 3) return { level: "fair", percentage: 50 };
    if (score <= 4) return { level: "good", percentage: 75 };
    return { level: "strong", percentage: 100 };
  }

  /**
   * Update password strength display
   */
  updatePasswordStrength(strength, strengthFill, strengthText) {
    strengthFill.className = `strength-fill ${strength.level}`;
    strengthText.textContent = `Password strength: ${strength.level}`;
  }

  /**
   * Handle login form submission
   */
  async handleLogin(e) {
    e.preventDefault();

    if (this.isSubmitting) return;

    const form = e.target;
    const formData = new FormData(form);

    // Clear previous errors
    this.clearErrors();

    // Validate form
    if (!this.validateLoginForm(formData)) {
      return;
    }

    this.isSubmitting = true;
    this.setSubmitButtonState(form, true);

    try {
      const response = await fetch("php/api/auth/login.php", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        this.showNotification("Login successful! Redirecting...", "success");

        // Store auth token if provided
        if (result.data.token) {
          localStorage.setItem("auth_token", result.data.token);
        }

        // Store user data
        if (result.data.user) {
          localStorage.setItem("user_data", JSON.stringify(result.data.user));
        }

        // Redirect to main app
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1500);
      } else {
        this.showNotification(result.message || "Login failed", "error");
        this.displayFieldError("email", result.errors?.email);
        this.displayFieldError("password", result.errors?.password);
      }
    } catch (error) {
      console.error("Login error:", error);
      this.showNotification("Network error. Please try again.", "error");
    } finally {
      this.isSubmitting = false;
      this.setSubmitButtonState(form, false);
    }
  }

  /**
   * Handle guest login
   */
  async handleGuestLogin() {
    if (this.isSubmitting) return;

    this.isSubmitting = true;

    // Show loading state on guest button
    const guestBtn = document.getElementById("guest-login-btn");
    if (guestBtn) {
      guestBtn.disabled = true;
      guestBtn.innerHTML =
        '<span class="btn-icon">⏳</span>Creating Guest Session...';
    }

    try {
      const response = await fetch("php/api/auth/guest_login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.success) {
        this.showNotification(
          "Guest session created! Welcome to the demo.",
          "success"
        );

        // Store auth token if provided
        if (result.data.token) {
          localStorage.setItem("auth_token", result.data.token);
        }

        // Store user data
        if (result.data.user) {
          localStorage.setItem("user_data", JSON.stringify(result.data.user));
        }

        // Store guest flag
        localStorage.setItem("is_guest", "true");

        // Redirect to main app
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1500);
      } else {
        this.showNotification(result.message || "Guest login failed", "error");
      }
    } catch (error) {
      console.error("Guest login error:", error);
      this.showNotification("Network error. Please try again.", "error");
    } finally {
      this.isSubmitting = false;

      // Reset guest button
      if (guestBtn) {
        guestBtn.disabled = false;
        guestBtn.innerHTML = '<span class="btn-icon">👤</span>Visit as Guest';
      }
    }
  }

  /**
   * Handle signup form submission
   */
  async handleSignup(e) {
    e.preventDefault();

    if (this.isSubmitting) return;

    const form = e.target;
    const formData = new FormData(form);

    // Clear previous errors
    this.clearErrors();

    // Validate form
    if (!this.validateSignupForm(formData)) {
      return;
    }

    this.isSubmitting = true;
    this.setSubmitButtonState(form, true);

    try {
      const response = await fetch("php/api/auth/signup.php", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Check if auto-login was performed
        if (result.data && result.data.auto_login) {
          this.showNotification(
            "Account created and logged in successfully! Redirecting...",
            "success"
          );

          // Store auth token if provided
          if (result.data.token) {
            localStorage.setItem("auth_token", result.data.token);
          }

          // Store user data
          if (result.data.user) {
            localStorage.setItem("user_data", JSON.stringify(result.data.user));
          }

          // Redirect to main app
          setTimeout(() => {
            window.location.href = "index.html";
          }, 1500);
        } else {
          this.showNotification(
            "Account created successfully! Please log in.",
            "success"
          );

          // Redirect to login page
          setTimeout(() => {
            window.location.href = "login.html";
          }, 2000);
        }
      } else {
        this.showNotification(result.message || "Signup failed", "error");

        // Display field-specific errors
        if (result.errors) {
          Object.keys(result.errors).forEach((field) => {
            this.displayFieldError(field, result.errors[field]);
          });
        }
      }
    } catch (error) {
      console.error("Signup error:", error);
      this.showNotification("Network error. Please try again.", "error");
    } finally {
      this.isSubmitting = false;
      this.setSubmitButtonState(form, false);
    }
  }

  /**
   * Validate login form
   */
  validateLoginForm(formData) {
    const email = formData.get("email");
    const password = formData.get("password");

    let isValid = true;

    if (!email || !this.isValidEmail(email)) {
      this.displayFieldError("email", "Please enter a valid email address");
      isValid = false;
    }

    if (!password || password.length < 6) {
      this.displayFieldError(
        "password",
        "Password must be at least 6 characters"
      );
      isValid = false;
    }

    return isValid;
  }

  /**
   * Validate signup form
   */
  validateSignupForm(formData) {
    const firstName = formData.get("first_name");
    const lastName = formData.get("last_name");
    const email = formData.get("email");
    const username = formData.get("username");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirm_password");
    const terms = formData.get("terms");

    let isValid = true;

    if (!firstName || firstName.trim().length < 2) {
      this.displayFieldError(
        "first-name",
        "First name must be at least 2 characters"
      );
      isValid = false;
    }

    if (!lastName || lastName.trim().length < 2) {
      this.displayFieldError(
        "last-name",
        "Last name must be at least 2 characters"
      );
      isValid = false;
    }

    if (!email || !this.isValidEmail(email)) {
      this.displayFieldError("email", "Please enter a valid email address");
      isValid = false;
    }

    if (!username || username.length < 3) {
      this.displayFieldError(
        "username",
        "Username must be at least 3 characters"
      );
      isValid = false;
    }

    if (!password || password.length < 8) {
      this.displayFieldError(
        "password",
        "Password must be at least 8 characters"
      );
      isValid = false;
    }

    if (password !== confirmPassword) {
      this.displayFieldError("confirm-password", "Passwords do not match");
      isValid = false;
    }

    if (!terms) {
      this.showNotification("Please accept the Terms of Service", "error");
      isValid = false;
    }

    return isValid;
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Display field-specific error
   */
  displayFieldError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    if (errorElement && message) {
      errorElement.textContent = message;
      errorElement.classList.add("show");
    }
  }

  /**
   * Clear all form errors
   */
  clearErrors() {
    const errorElements = document.querySelectorAll(".form-error");
    errorElements.forEach((element) => {
      element.textContent = "";
      element.classList.remove("show");
    });
  }

  /**
   * Set submit button state
   */
  setSubmitButtonState(form, isSubmitting) {
    const submitButton = form.querySelector(".auth-submit");
    if (submitButton) {
      if (isSubmitting) {
        submitButton.disabled = true;
        submitButton.innerHTML =
          '<span class="btn-icon">⏳</span>Processing...';
      } else {
        submitButton.disabled = false;
        submitButton.innerHTML =
          this.currentPage === "login"
            ? '<span class="btn-icon">🚀</span>Sign In'
            : '<span class="btn-icon">🚀</span>Create Account';
      }
    }
  }

  /**
   * Show notification
   */
  showNotification(message, type = "info") {
    // Use existing notification system if available
    if (typeof showNotification === "function") {
      showNotification(message, type);
    } else {
      // Fallback notification
      const notification = document.createElement("div");
      notification.className = `notification ${type}`;
      notification.innerHTML = `
        <div class="notification-content">
          <span class="notification-icon">${this.getNotificationIcon(
            type
          )}</span>
          <div class="notification-text">
            <div class="notification-title">${this.getNotificationTitle(
              type
            )}</div>
            <div class="notification-message">${message}</div>
          </div>
        </div>
      `;

      const container = document.getElementById("notification-container");
      if (container) {
        container.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add("show"), 100);

        // Remove notification after 5 seconds
        setTimeout(() => {
          notification.classList.remove("show");
          setTimeout(() => notification.remove(), 400);
        }, 5000);
      }
    }
  }

  /**
   * Get notification icon based on type
   */
  getNotificationIcon(type) {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      default:
        return "ℹ️";
    }
  }

  /**
   * Get notification title based on type
   */
  getNotificationTitle(type) {
    switch (type) {
      case "success":
        return "Success";
      case "error":
        return "Error";
      case "warning":
        return "Warning";
      default:
        return "Info";
    }
  }
}

// Initialize authentication system when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("🔐 DOM loaded, initializing authentication...");

  const authManager = new AuthManager();
  authManager.init();

  // Make auth manager available globally
  window.authManager = authManager;
});

console.log("✅ Authentication system loaded successfully");
