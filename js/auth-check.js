console.log("🔐 Loading Authentication Check...");

class AuthChecker {
  constructor() {
    this.isChecking = false;
    this.redirectToLogin = false;
  }

  /**
   * Initialize authentication check
   */
  async init() {
    console.log("🔍 Checking authentication status...");

    try {
      this.isChecking = true;

      // Check if user is authenticated
      const response = await fetch("php/api/auth/check_auth.php");
      const result = await response.json();

      if (result.success && result.authenticated) {
        console.log("✅ User is authenticated");

        // Store user data in localStorage for easy access
        if (result.data && result.data.user) {
          localStorage.setItem("user_data", JSON.stringify(result.data.user));
        }

        if (result.data && result.data.preferences) {
          localStorage.setItem(
            "user_preferences",
            JSON.stringify(result.data.preferences)
          );
        }

        // Continue with app initialization
        this.continueWithApp();
      } else {
        console.log("❌ User is not authenticated, redirecting to login");
        this.redirectToLogin = true;

        // Show notification before redirect
        this.showNotification("Please log in to continue", "info");

        // Redirect to login page
        setTimeout(() => {
          window.location.href = "login.html";
        }, 1500);
      }
    } catch (error) {
      console.error("❌ Authentication check failed:", error);

      // On error, redirect to login for safety
      this.redirectToLogin = true;
      this.showNotification(
        "Authentication check failed. Please log in.",
        "error"
      );

      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Continue with app initialization
   */
  continueWithApp() {
    console.log("🚀 Proceeding with app initialization...");

    // Remove any loading indicators
    const loadingIndicator = document.getElementById("loading-indicator");
    if (loadingIndicator) {
      loadingIndicator.style.display = "none";
    }

    // Show main content
    const mainContent = document.querySelector(".main-content");
    if (mainContent) {
      mainContent.style.display = "block";
    }

    // Show header
    const header = document.querySelector(".app-header");
    if (header) {
      header.style.display = "block";
    }

    // Add logout button to header if not exists
    this.addLogoutButton();

    // Update user info in header
    this.updateUserInfo();
  }

  /**
   * Add logout button to header
   */
  addLogoutButton() {
    const headerControls = document.querySelector(".header-controls");
    if (!headerControls) return;

    // Check if logout button already exists
    if (document.getElementById("logout-btn")) return;

    const logoutBtn = document.createElement("button");
    logoutBtn.id = "logout-btn";
    logoutBtn.className = "btn btn-secondary";
    logoutBtn.innerHTML = '<span class="btn-icon">🚪</span>Logout';
    logoutBtn.title = "Logout from your account";
    logoutBtn.onclick = () => this.handleLogout();

    // Insert before theme toggle
    const themeToggle = document.querySelector("#theme-toggle");
    if (themeToggle) {
      headerControls.insertBefore(logoutBtn, themeToggle);
    } else {
      headerControls.appendChild(logoutBtn);
    }
  }

  /**
   * Update user information in header
   */
  updateUserInfo() {
    const userData = JSON.parse(localStorage.getItem("user_data") || "{}");

    if (userData.first_name) {
      // Update workspace name to show user's name
      const workspaceName = document.getElementById("header-workspace-name");
      if (workspaceName) {
        workspaceName.textContent = `${userData.first_name}'s Workspace`;
      }

      // Update current workspace name in sidebar
      const currentWorkspaceName = document.getElementById(
        "current-workspace-name"
      );
      if (currentWorkspaceName) {
        currentWorkspaceName.textContent = `${userData.first_name}'s Workspace`;
      }
    }
  }

  /**
   * Handle logout
   */
  async handleLogout() {
    try {
      console.log("🚪 Logging out...");

      const response = await fetch("php/api/auth/logout.php");
      const result = await response.json();

      if (result.success) {
        // Clear localStorage
        localStorage.removeItem("user_data");
        localStorage.removeItem("user_preferences");
        localStorage.removeItem("auth_token");

        this.showNotification("Logged out successfully", "success");

        // Redirect to login page
        setTimeout(() => {
          window.location.href = "login.html";
        }, 1000);
      } else {
        this.showNotification("Logout failed", "error");
      }
    } catch (error) {
      console.error("Logout error:", error);
      this.showNotification("Logout failed", "error");
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

  /**
   * Check if we should redirect to login
   */
  shouldRedirectToLogin() {
    return this.redirectToLogin;
  }
}

// Create global auth checker instance
window.authChecker = new AuthChecker();

// Initialize authentication check when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("🔐 DOM loaded, starting authentication check...");

  // Hide main content and show loading while checking auth
  const mainContent = document.querySelector(".main-content");
  if (mainContent) {
    mainContent.style.display = "none";
  }

  const header = document.querySelector(".app-header");
  if (header) {
    header.style.display = "none";
  }

  // Initialize auth check
  window.authChecker.init();
});

console.log("✅ Authentication check system loaded");
