function showLoading(show) {
  const loadingIndicator = document.getElementById("loading-indicator");
  if (loadingIndicator) {
    loadingIndicator.style.display = show ? "flex" : "none";
  }
}

function showEmptyState(show) {
  const emptyState = document.getElementById("empty-state");
  const kanbanBoard = document.getElementById("kanban-board");

  if (emptyState && kanbanBoard) {
    emptyState.style.display = show ? "flex" : "none";
    kanbanBoard.style.display = show ? "none" : "grid";
  }
}

function showError(message) {
  alert("Error: " + message);
}

function showSuccessMessage(message, title = "") {
  showNotification(message, "success", title);
}

function showErrorMessage(message, title = "") {
  showNotification(message, "error", title);
}

function showFieldError(errorId, message) {
  const errorElement = document.getElementById(errorId);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.add("show");
  }
}

function clearFormErrors() {
  const errorElements = document.querySelectorAll(".form-error");
  errorElements.forEach((element) => {
    element.classList.remove("show");
    element.textContent = "";
  });
}

function setFormLoading(
  loading,
  formId = "task-form",
  submitBtnId = "task-submit-btn"
) {
  const form = document.getElementById(formId);
  const submitBtn = document.getElementById(submitBtnId);

  if (loading) {
    if (form) form.classList.add("form-loading");
    if (submitBtn) submitBtn.disabled = true;
  } else {
    if (form) form.classList.remove("form-loading");
    if (submitBtn) submitBtn.disabled = false;
  }
}

function lockScroll() {
  const scrollY = window.scrollY;
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = "100%";
  document.body.classList.add("modal-open");
}

function unlockScroll() {
  const scrollY = document.body.style.top;
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.width = "";
  document.body.classList.remove("modal-open");
  window.scrollTo(0, parseInt(scrollY || "0") * -1);
}

function handleDialogKeydown(event) {
  if (event.key === "Escape") {
    event.preventDefault();
    event.target.close();
  }
}

function handleDialogClickOutside(event) {
  const dialog = event.target;
  const rect = dialog.getBoundingClientRect();

  if (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  ) {
    dialog.close();
  }
}

// ===== VALIDATION UTILITIES =====

/**
 * Validate task form data
 * @param {FormData} formData - Form data to validate
 * @returns {boolean} - Whether form is valid
 */
function validateTaskForm(formData) {
  let isValid = true;

  // Validate title
  const title = formData.get("title");
  if (!title || title.trim().length === 0) {
    showFieldError("title-error", "Task title is required");
    isValid = false;
  } else if (title.length > 255) {
    showFieldError("title-error", "Title must be less than 255 characters");
    isValid = false;
  }

  // Validate project
  const projectId = formData.get("project_id");
  if (!projectId) {
    showFieldError("project-error", "Please select a project");
    isValid = false;
  }

  return isValid;
}

// ===== THEME UTILITIES =====

/**
 * Initialize theme from localStorage
 * @param {string} currentTheme - Current theme value
 */
function initializeTheme(currentTheme) {
  document.documentElement.setAttribute("data-theme", currentTheme);
  updateThemeIcon(currentTheme);
}

/**
 * Toggle between light and dark theme
 * @param {string} currentTheme - Current theme value
 * @returns {string} - New theme value
 */
function toggleTheme(currentTheme) {
  const newTheme = currentTheme === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  updateThemeIcon(newTheme);

  // Add smooth transition effect
  document.body.style.transition = "all 0.3s ease";
  setTimeout(() => {
    document.body.style.transition = "";
  }, 300);

  return newTheme;
}

/**
 * Update theme icon based on current theme
 * @param {string} currentTheme - Current theme value
 */
function updateThemeIcon(currentTheme) {
  const themeIcon = document.getElementById("theme-icon");
  if (themeIcon) {
    themeIcon.textContent = currentTheme === "light" ? "🌙" : "☀️";
  }
}

// ===== PRIORITY AND STATUS UTILITIES =====

/**
 * Get priority icon for task
 * @param {string} priority - Task priority (low, medium, high)
 * @returns {string} - Priority icon
 */
function getPriorityIcon(priority) {
  const priorityIcons = {
    high: "🔴",
    medium: "🟡",
    low: "🟢",
  };
  return priorityIcons[priority] || "⚪";
}

/**
 * Get project status icon
 * @param {string} status - Project status
 * @returns {string} - Status icon
 */
function getProjectStatusIcon(status) {
  const icons = {
    planning: "📋",
    active: "🟢",
    on_hold: "🟡",
    completed: "✅",
    archived: "📦",
  };
  return icons[status] || "⚪";
}

// ===== ANIMATION UTILITIES =====

/**
 * Add welcome animation to the kanban board
 */
function addWelcomeAnimation() {
  const kanbanBoard = document.querySelector(".kanban-board");
  const columns = document.querySelectorAll(".kanban-column");

  if (kanbanBoard) {
    kanbanBoard.style.opacity = "0";
    kanbanBoard.style.transform = "translateY(20px)";

    setTimeout(() => {
      kanbanBoard.style.transition = "all 0.6s ease-out";
      kanbanBoard.style.opacity = "1";
      kanbanBoard.style.transform = "translateY(0)";
    }, 100);

    // Animate columns with stagger
    columns.forEach((column, index) => {
      column.style.opacity = "0";
      column.style.transform = "translateY(30px)";

      setTimeout(() => {
        column.style.transition = "all 0.5s ease-out";
        column.style.opacity = "1";
        column.style.transform = "translateY(0)";
      }, 200 + index * 100);
    });
  }
}

/**
 * Show notification to user (new system)
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (success, error, warning, info)
 * @param {string} title - Optional title for the notification
 * @param {number} duration - Duration in milliseconds (default: 5000)
 */
function showNotification(message, type = "info", title = "", duration = 5000) {
  const container = document.getElementById("notification-container");
  if (!container) {
    console.error("Notification container not found");
    return;
  }

  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;

  // Get icon based on type
  const icons = {
    success: "✅",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️",
  };

  const icon = icons[type] || icons.info;

  // Create notification content
  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-icon">${icon}</div>
      <div class="notification-text">
        ${title ? `<div class="notification-title">${title}</div>` : ""}
        <div class="notification-message">${message}</div>
      </div>
    </div>
    <button class="notification-close" onclick="closeNotification(this)">&times;</button>
  `;

  // Add to container
  container.appendChild(notification);

  // Trigger animation
  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => {
      closeNotification(notification.querySelector(".notification-close"));
    }, duration);
  }

  console.log(`${icon} ${type.toUpperCase()}: ${message}`);
}

/**
 * Close notification
 * @param {HTMLElement} closeBtn - Close button element
 */
function closeNotification(closeBtn) {
  const notification = closeBtn.closest(".notification");
  if (notification) {
    notification.classList.remove("show");
    setTimeout(() => {
      notification.remove();
    }, 300);
  }
}

// Export functions for module usage (if needed)
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    showLoading,
    showEmptyState,
    showError,
    showSuccessMessage,
    showErrorMessage,
    showFieldError,
    clearFormErrors,
    setFormLoading,
    lockScroll,
    unlockScroll,
    handleDialogKeydown,
    handleDialogClickOutside,
    validateTaskForm,
    initializeTheme,
    toggleTheme,
    updateThemeIcon,
    getPriorityIcon,
    getProjectStatusIcon,
    addWelcomeAnimation,
  };
}
