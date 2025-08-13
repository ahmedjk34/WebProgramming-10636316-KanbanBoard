/**
 * UI Manager Module
 * Handles all UI interactions, dialogs, forms, and event listeners
 */

console.log("📦 Loading UIManager module...");

class UIManager {
  constructor(dependencies = {}) {
    this.currentEditingTaskId = null;
    this.currentEditingProjectId = null;

    // Store dependencies
    this.dependencies = dependencies;
    this.taskManager = dependencies.taskManager;
    this.projectManager = dependencies.projectManager;
    this.workspaceManager = dependencies.workspaceManager;

    console.log(
      "🔧 UIManager initialized with dependencies:",
      Object.keys(dependencies)
    );
  }

  // ===== INITIALIZATION =====

  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    console.log("🎧 Setting up event listeners...");

    // Theme toggle
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", this.handleThemeToggle.bind(this));
    }

    // Filter controls
    this.setupFilterControls();

    // Add task button
    const addTaskBtn = document.getElementById("add-task-btn");
    if (addTaskBtn) {
      addTaskBtn.addEventListener("click", () => this.openTaskModal());
    }

    // Workspace toggle
    const workspaceToggle = document.getElementById("workspace-toggle");
    if (workspaceToggle) {
      workspaceToggle.addEventListener("click", () => {
        if (this.workspaceManager) {
          this.workspaceManager.openSidebar();
        }
      });
    }

    // Manage projects button
    const manageProjectsBtn = document.getElementById("manage-projects-btn");
    if (manageProjectsBtn) {
      manageProjectsBtn.addEventListener("click", () =>
        this.openProjectManagementDialog()
      );
    }

    console.log("✅ Event listeners setup complete");
  }

  /**
   * Setup filter controls
   */
  setupFilterControls() {
    // Setup custom dropdowns
    this.setupCustomDropdowns();

    const projectFilter = document.getElementById("project-filter");
    const priorityFilter = document.getElementById("priority-filter");

    if (projectFilter) {
      projectFilter.addEventListener(
        "change",
        this.handleFilterChange.bind(this)
      );
    }

    if (priorityFilter) {
      priorityFilter.addEventListener(
        "change",
        this.handleFilterChange.bind(this)
      );
    }
  }

  /**
   * Setup custom dropdown functionality
   */
  setupCustomDropdowns() {
    const dropdowns = document.querySelectorAll(".custom-dropdown");

    dropdowns.forEach((dropdown) => {
      const trigger = dropdown.querySelector(".dropdown-trigger");
      const menu = dropdown.querySelector(".dropdown-menu");

      if (trigger && menu) {
        // Toggle dropdown on trigger click
        trigger.addEventListener("click", (e) => {
          e.stopPropagation();

          // Close other dropdowns
          dropdowns.forEach((otherDropdown) => {
            if (otherDropdown !== dropdown) {
              otherDropdown.classList.remove("open");
            }
          });

          // Toggle current dropdown
          dropdown.classList.toggle("open");
        });

        // Handle menu item clicks
        const menuItems = menu.querySelectorAll(".dropdown-item");
        menuItems.forEach((item) => {
          item.addEventListener("click", (e) => {
            e.preventDefault();

            // Update trigger text
            const text = trigger.querySelector(".dropdown-text");
            if (text) {
              text.textContent = item.textContent.trim();
            }

            // Update hidden input value
            const hiddenInput = dropdown.querySelector('input[type="hidden"]');
            if (hiddenInput) {
              hiddenInput.value = item.getAttribute("data-value") || "";
            }

            // Update active state
            menuItems.forEach((menuItem) =>
              menuItem.classList.remove("active")
            );
            item.classList.add("active");

            // Close dropdown
            dropdown.classList.remove("open");

            // Trigger filter change
            this.handleFilterChange();
          });
        });
      }
    });

    // Close dropdowns when clicking outside
    document.addEventListener("click", () => {
      dropdowns.forEach((dropdown) => {
        dropdown.classList.remove("open");
      });
    });
  }

  // ===== EVENT HANDLERS =====

  /**
   * Handle theme toggle
   */
  handleThemeToggle() {
    console.log("🎨 Toggling theme...");
    if (window.toggleThemeWrapper) {
      window.toggleThemeWrapper();
    }
  }

  /**
   * Handle filter changes
   */
  handleFilterChange() {
    const projectFilter = document.getElementById("project-filter");
    const priorityFilter = document.getElementById("priority-filter");

    const projectId = projectFilter ? projectFilter.value : "";
    const priority = priorityFilter ? priorityFilter.value : "";

    console.log("🔍 Applying filters:", {
      projectId,
      priority,
      projectFilterElement: !!projectFilter,
      priorityFilterElement: !!priorityFilter,
    });

    if (this.taskManager) {
      this.taskManager.filterTasks(projectId, priority);
    } else {
      console.warn("⚠️ TaskManager not available for filtering");
    }
  }

  // ===== TASK MODAL MANAGEMENT =====

  /**
   * Open task modal for creating or editing
   * @param {number|null} taskId - Task ID for editing, null for creating
   */
  openTaskModal(taskId = null) {
    console.log(
      "📝 Opening task modal",
      taskId ? `for task ${taskId}` : "for new task"
    );

    const dialog = document.getElementById("task-dialog");
    if (!dialog) {
      console.error("❌ Task dialog not found!");
      return;
    }

    // Set current editing task ID
    this.currentEditingTaskId = taskId;
    window.currentEditingTaskId = taskId; // For backward compatibility

    // Reset form and populate if editing
    this.resetTaskForm();
    if (taskId) {
      this.populateTaskForm(taskId);
    }

    // Update dialog title and button text
    this.updateTaskDialogUI(taskId);

    // Setup form submission handler
    this.setupTaskFormHandler();

    // Lock scrolling and show dialog
    lockScroll();
    dialog.showModal();

    // Focus on title field
    setTimeout(() => {
      const titleField = document.getElementById("task-title");
      if (titleField) {
        titleField.focus();
      }
    }, 100);

    // Handle dialog events
    dialog.addEventListener("keydown", handleDialogKeydown);
    dialog.addEventListener("click", handleDialogClickOutside);
  }

  /**
   * Close task modal
   */
  closeTaskDialog() {
    const dialog = document.getElementById("task-dialog");
    if (dialog) {
      dialog.close();
      this.currentEditingTaskId = null;
      window.currentEditingTaskId = null;
      clearFormErrors();
      unlockScroll();
    }
  }

  /**
   * Reset task form
   */
  resetTaskForm() {
    const form = document.getElementById("task-form");
    if (form) {
      form.reset();
    }
    clearFormErrors();
  }

  /**
   * Populate task form with existing task data
   * @param {number} taskId - Task ID
   */
  populateTaskForm(taskId) {
    if (!this.taskManager) return;

    const task = this.taskManager.findTaskById(taskId);
    if (!task) {
      console.error("❌ Task not found:", taskId);
      return;
    }

    // Populate form fields
    const titleField = document.getElementById("task-title");
    const descriptionField = document.getElementById("task-description");
    const projectField = document.getElementById("task-project");
    const priorityField = document.getElementById("task-priority");
    const dueDateField = document.getElementById("task-due-date");
    const statusField = document.getElementById("task-status");

    if (titleField) titleField.value = task.title || "";
    if (descriptionField) descriptionField.value = task.description || "";
    if (projectField) projectField.value = task.project_id || "";
    if (priorityField) priorityField.value = task.priority || "medium";
    if (dueDateField) dueDateField.value = task.due_date || "";
    if (statusField) statusField.value = task.status || "todo";
  }

  /**
   * Update task dialog UI based on mode (create/edit)
   * @param {number|null} taskId - Task ID
   */
  updateTaskDialogUI(taskId) {
    const dialogTitle = document.querySelector(
      "#task-dialog .dialog-header h3"
    );
    const submitBtn = document.getElementById("task-submit-btn");
    const submitText = document.getElementById("task-submit-text");

    if (taskId) {
      // Edit mode
      if (dialogTitle) dialogTitle.textContent = "✏️ Edit Task";
      if (submitText) submitText.textContent = "Update Task";
      if (submitBtn)
        submitBtn.innerHTML =
          '<span class="btn-icon">💾</span><span id="task-submit-text">Update Task</span>';
    } else {
      // Create mode
      if (dialogTitle) dialogTitle.textContent = "➕ Add New Task";
      if (submitText) submitText.textContent = "Create Task";
      if (submitBtn)
        submitBtn.innerHTML =
          '<span class="btn-icon">🚀</span><span id="task-submit-text">Create Task</span>';
    }
  }

  // ===== DELETE MODAL MANAGEMENT =====

  /**
   * Open delete confirmation modal
   * @param {number} taskId - Task ID to delete
   */
  openDeleteModal(taskId) {
    console.log("🗑️ Opening delete confirmation for task:", taskId);

    const dialog = document.getElementById("delete-dialog");
    if (!dialog) {
      console.error("❌ Delete dialog not found!");
      return;
    }

    // Store task ID for deletion
    this.currentDeletingTaskId = taskId;

    // Get task details for confirmation
    const task = this.taskManager
      ? this.taskManager.findTaskById(taskId)
      : null;
    const taskTitle = task ? task.title : `Task ${taskId}`;

    // Update confirmation text
    const confirmText = document.getElementById("delete-task-title");
    if (confirmText) {
      confirmText.textContent = taskTitle;
    }

    // Setup delete confirmation button
    const confirmBtn = document.getElementById("confirm-delete-btn");
    if (confirmBtn) {
      confirmBtn.onclick = () => this.confirmDeleteTask(taskId);
    }

    // Lock scrolling and show dialog
    lockScroll();
    dialog.showModal();

    // Handle dialog events
    dialog.addEventListener("keydown", handleDialogKeydown);
    dialog.addEventListener("click", handleDialogClickOutside);
  }

  /**
   * Close delete confirmation modal
   */
  closeDeleteDialog() {
    const dialog = document.getElementById("delete-dialog");
    if (dialog) {
      dialog.close();
      this.currentDeletingTaskId = null;
      unlockScroll();
    }
  }

  /**
   * Confirm task deletion
   * @param {number} taskId - Task ID to delete
   */
  async confirmDeleteTask(taskId) {
    console.log("🗑️ Confirming deletion of task:", taskId);

    try {
      if (window.apiManager) {
        const result = await window.apiManager.deleteTask(taskId);

        if (result.success) {
          showSuccessMessage("Task deleted successfully!");
          this.closeDeleteDialog();

          // Refresh tasks
          if (this.taskManager) {
            await this.taskManager.refreshTasks();
          }
        } else {
          throw new Error(result.message);
        }
      }
    } catch (error) {
      console.error("❌ Error deleting task:", error);
      showErrorMessage("Failed to delete task");
    }
  }

  // ===== PROJECT MANAGEMENT DIALOG =====

  /**
   * Open project management dialog
   */
  openProjectManagementDialog() {
    console.log("🗂️ Opening project management dialog");

    const dialog = document.getElementById("project-management-dialog");
    if (!dialog) {
      console.error("❌ Project management dialog not found!");
      return;
    }

    // Lock scrolling and show dialog
    lockScroll();
    dialog.showModal();

    // Setup project management functionality
    this.setupProjectManagement();

    // Handle dialog events
    dialog.addEventListener("click", handleDialogClickOutside);
  }

  /**
   * Close project management dialog
   */
  closeProjectManagementDialog() {
    const dialog = document.getElementById("project-management-dialog");
    if (dialog) {
      dialog.close();
      unlockScroll();
    }
  }

  /**
   * Setup project management functionality
   */
  setupProjectManagement() {
    // Setup tab switching
    this.setupProjectTabs();

    // Load projects grid
    if (this.projectManager) {
      this.projectManager.loadProjectsGrid();
    }
  }

  /**
   * Setup project management tabs
   */
  setupProjectTabs() {
    const tabButtons = document.querySelectorAll(
      "#project-management-dialog .tab-btn"
    );
    const tabContents = document.querySelectorAll(
      "#project-management-dialog .tab-content"
    );

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const targetTab = button.getAttribute("data-tab");

        // Update active tab button
        tabButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");

        // Update active tab content
        tabContents.forEach((content) => {
          content.classList.remove("active");
          if (content.id === `${targetTab}-tab`) {
            content.classList.add("active");
          }
        });

        // Load content based on tab
        if (targetTab === "projects" && this.projectManager) {
          this.projectManager.loadProjectsGrid();
        } else if (targetTab === "statistics" && this.projectManager) {
          this.projectManager.loadProjectStatistics();
        }
      });
    });
  }

  // ===== UTILITY METHODS =====

  /**
   * Get current editing task ID
   * @returns {number|null} Current editing task ID
   */
  getCurrentEditingTaskId() {
    return this.currentEditingTaskId;
  }

  /**
   * Set current editing task ID
   * @param {number|null} taskId - Task ID
   */
  setCurrentEditingTaskId(taskId) {
    this.currentEditingTaskId = taskId;
    window.currentEditingTaskId = taskId;
  }

  /**
   * Setup task form submission handler
   */
  setupTaskFormHandler() {
    const taskForm = document.getElementById("task-form");
    if (taskForm && this.taskManager) {
      // Remove existing listener to prevent duplicates
      taskForm.removeEventListener("submit", this.boundTaskFormHandler);

      // Create bound handler if not exists
      if (!this.boundTaskFormHandler) {
        this.boundTaskFormHandler = this.taskManager.handleTaskFormSubmit.bind(
          this.taskManager
        );
      }

      // Add the event listener
      taskForm.addEventListener("submit", this.boundTaskFormHandler);
      console.log("✅ Task form handler setup complete");
    }
  }
}

// Export for use in other modules
window.UIManager = UIManager;

// Also make it globally available immediately
if (typeof UIManager !== "undefined") {
  console.log("✅ UIManager loaded successfully");
}
