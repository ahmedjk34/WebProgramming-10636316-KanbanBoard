/**
 * Task Manager Module
 * Handles all task-related functionality including CRUD operations, display, and filtering
 */

console.log("📦 Loading TaskManager module...");

class TaskManager {
  constructor() {
    this.tasks = [];
    this.filteredTasks = [];
  }

  // ===== TASK DATA MANAGEMENT =====

  /**
   * Set tasks data
   * @param {Array} tasks - Array of task objects
   */
  setTasks(tasks) {
    this.tasks = tasks;
    this.filteredTasks = tasks;
  }

  /**
   * Get all tasks
   * @returns {Array} Array of task objects
   */
  getTasks() {
    return this.tasks;
  }

  /**
   * Get filtered tasks
   * @returns {Array} Array of filtered task objects
   */
  getFilteredTasks() {
    return this.filteredTasks;
  }

  /**
   * Find task by ID
   * @param {number} taskId - Task ID
   * @returns {Object|null} Task object or null if not found
   */
  findTaskById(taskId) {
    return this.tasks.find((task) => task.id == taskId) || null;
  }

  // ===== TASK DISPLAY =====

  /**
   * Display tasks in their respective columns
   * @param {Object} tasksByStatus - Tasks grouped by status
   */
  displayTasks(tasksByStatus) {
    this.displayTasksEnhanced(tasksByStatus);
  }

  /**
   * Enhanced display with staggered animations
   * @param {Object} tasksByStatus - Tasks grouped by status
   */
  displayTasksEnhanced(tasksByStatus) {
    // Clear existing tasks
    document.getElementById("todo-tasks").innerHTML = "";
    document.getElementById("in_progress-tasks").innerHTML = "";
    document.getElementById("done-tasks").innerHTML = "";

    // Display tasks in each column with staggered animation
    Object.keys(tasksByStatus).forEach((status, columnIndex) => {
      const container = document.getElementById(
        `${status.replace("_", "_")}-tasks`
      );
      tasksByStatus[status].forEach((task, taskIndex) => {
        const taskElement = this.createTaskElementEnhanced(task);

        // Staggered animation delay
        taskElement.style.animationDelay = `${
          columnIndex * 100 + taskIndex * 50
        }ms`;

        container.appendChild(taskElement);
      });
    });

    // Setup drag and drop for all newly created tasks
    setTimeout(() => {
      if (window.dragDropManager) {
        window.dragDropManager.setupDragAndDropForTasks();
      }
    }, 500);
  }

  /**
   * Create enhanced task element with animations
   * @param {Object} task - Task object
   * @returns {HTMLElement} Task element
   */
  createTaskElementEnhanced(task) {
    const taskDiv = document.createElement("div");
    taskDiv.className = "task-card task-card-enhanced";
    taskDiv.setAttribute("data-task-id", task.id);
    taskDiv.setAttribute("draggable", "true");

    // Priority indicator (using utility function)
    const priorityIconValue = getPriorityIcon(task.priority);

    // Due date formatting
    let dueDateHtml = "";
    if (task.due_date) {
      const dueDate = new Date(task.due_date);
      const today = new Date();
      const isOverdue = dueDate < today && task.status !== "done";
      const isToday = dueDate.toDateString() === today.toDateString();

      dueDateHtml = `
        <div class="task-due-date ${isOverdue ? "overdue" : ""} ${
        isToday ? "today" : ""
      }">
          <span class="due-icon">${
            isOverdue ? "⚠️" : isToday ? "📅" : "📆"
          }</span>
          <span class="due-text">${dueDate.toLocaleDateString()}</span>
        </div>
      `;
    }

    taskDiv.innerHTML = `
      <div class="task-header">
        <div class="task-priority">${priorityIconValue}</div>
        <div class="task-project" style="background-color: ${
          task.project_color
        }">
          ${task.project_name}
        </div>
      </div>
      <div class="task-content">
        <h4 class="task-title">${task.title}</h4>
        <p class="task-description">${task.description || ""}</p>
        ${dueDateHtml}
      </div>
      <div class="task-actions">
        <button class="task-action-btn edit-btn" onclick="taskManager.editTask(${
          task.id
        })" title="Edit Task">
          <span class="action-icon">✏️</span>
        </button>
        <button class="task-action-btn delete-btn" onclick="taskManager.deleteTask(${
          task.id
        })" title="Delete Task">
          <span class="action-icon">🗑️</span>
        </button>
      </div>
    `;

    return taskDiv;
  }

  // ===== TASK FILTERING =====

  /**
   * Filter tasks by project and priority
   * @param {string} projectId - Project ID filter
   * @param {string} priority - Priority filter
   */
  filterTasks(projectId = "", priority = "") {
    // Add subtle loading effect
    const kanbanBoard = document.querySelector(".kanban-board");
    if (kanbanBoard) {
      kanbanBoard.style.opacity = "0.7";
      kanbanBoard.style.transform = "scale(0.98)";
    }

    let filteredTasks = this.tasks;

    if (projectId) {
      filteredTasks = filteredTasks.filter(
        (task) => task.project_id == projectId
      );
    }

    if (priority) {
      filteredTasks = filteredTasks.filter(
        (task) => task.priority === priority
      );
    }

    this.filteredTasks = filteredTasks;

    // Group filtered tasks by status
    const tasksByStatus = {
      todo: filteredTasks.filter((task) => task.status === "todo"),
      in_progress: filteredTasks.filter(
        (task) => task.status === "in_progress"
      ),
      done: filteredTasks.filter((task) => task.status === "done"),
    };

    // Smooth transition back
    setTimeout(() => {
      this.displayTasks(tasksByStatus);

      // Update counts
      this.updateTaskCounts({
        todo: tasksByStatus.todo.length,
        in_progress: tasksByStatus.in_progress.length,
        done: tasksByStatus.done.length,
      });

      // Restore appearance
      if (kanbanBoard) {
        kanbanBoard.style.opacity = "1";
        kanbanBoard.style.transform = "scale(1)";
      }
    }, 150);
  }

  /**
   * Update task count displays
   * @param {Object} counts - Task counts by status
   */
  updateTaskCounts(counts) {
    const todoCount = document.getElementById("todo-count");
    const inProgressCount = document.getElementById("in_progress-count");
    const doneCount = document.getElementById("done-count");

    if (todoCount) todoCount.textContent = counts.todo || 0;
    if (inProgressCount) inProgressCount.textContent = counts.in_progress || 0;
    if (doneCount) doneCount.textContent = counts.done || 0;

    console.log("📊 Updated task counts:", counts);
  }

  // ===== TASK ACTIONS =====

  /**
   * Edit task - opens task modal
   * @param {number} taskId - Task ID
   */
  editTask(taskId) {
    console.log("🖊️ Opening edit modal for task:", taskId);
    if (window.uiManager) {
      window.uiManager.openTaskModal(taskId);
    }
  }

  /**
   * Delete task - opens delete confirmation
   * @param {number} taskId - Task ID
   */
  deleteTask(taskId) {
    console.log("🗑️ Opening delete confirmation for task:", taskId);
    if (window.uiManager) {
      window.uiManager.openDeleteModal(taskId);
    }
  }

  /**
   * Update task status (for drag & drop)
   * @param {number} taskId - Task ID
   * @param {string} newStatus - New status
   * @param {string} oldStatus - Old status
   */
  async updateTaskStatus(taskId, newStatus, oldStatus) {
    try {
      console.log(
        `🔄 Updating task ${taskId} status: ${oldStatus} → ${newStatus}`
      );

      // Show loading state
      const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
      if (taskElement) {
        taskElement.style.opacity = "0.6";
        taskElement.style.pointerEvents = "none";
      }

      // Update via API
      if (window.apiManager) {
        const result = await window.apiManager.updateTaskStatus(
          taskId,
          newStatus
        );

        if (result.success) {
          // Update local task data
          const task = this.findTaskById(taskId);
          if (task) {
            task.status = newStatus;
          }

          // Refresh display
          await this.refreshTasks();

          showSuccessMessage(`Task moved to ${newStatus.replace("_", " ")}`);
        } else {
          throw new Error(result.message);
        }
      }
    } catch (error) {
      console.error("❌ Error updating task status:", error);
      showErrorMessage("Failed to update task status");

      // Restore task element
      const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
      if (taskElement) {
        taskElement.style.opacity = "1";
        taskElement.style.pointerEvents = "auto";
      }
    }
  }

  /**
   * Refresh tasks from API
   */
  async refreshTasks() {
    if (window.apiManager) {
      try {
        const result = await window.apiManager.loadTasks();
        if (result.success) {
          this.setTasks(result.data.tasks);
          this.displayTasks(result.data.tasks_by_status);
          this.updateTaskCounts(result.data.counts);
        }
      } catch (error) {
        console.error("❌ Error refreshing tasks:", error);
      }
    }
  }

  // ===== TASK FORM HANDLING =====

  /**
   * Setup task form submission handling
   */
  setupTaskFormHandling() {
    const taskForm = document.getElementById("task-form");
    if (taskForm) {
      taskForm.addEventListener("submit", this.handleTaskFormSubmit.bind(this));
    }
  }

  /**
   * Refresh tasks from API
   */
  async refreshTasks() {
    if (window.apiManager) {
      try {
        const result = await window.apiManager.loadTasks();
        if (result.success) {
          this.setTasks(result.data.tasks);
          this.displayTasks(result.data.tasks_by_status);
          this.updateTaskCounts(result.data.counts);
        }
      } catch (error) {
        console.error("❌ Error refreshing tasks:", error);
      }
    }
  }

  // ===== TASK FORM HANDLING =====

  /**
   * Handle task form submission
   * @param {Event} e - Form submit event
   */
  async handleTaskFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);

    // Validate form
    if (!validateTaskForm(formData)) {
      return;
    }

    // Show loading state
    setFormLoading(true);

    try {
      const taskData = {
        title: formData.get("title"),
        description: formData.get("description"),
        project_id: formData.get("project_id"),
        priority: formData.get("priority"),
        due_date: formData.get("due_date"),
        status: formData.get("status") || "todo",
      };

      let result;
      if (window.currentEditingTaskId) {
        // Update existing task
        result = await window.apiManager.updateTask(
          window.currentEditingTaskId,
          taskData
        );
      } else {
        // Create new task
        result = await window.apiManager.createTask(taskData);
      }

      if (result.success) {
        showSuccessMessage(
          window.currentEditingTaskId
            ? "Task updated successfully!"
            : "Task created successfully!",
          window.currentEditingTaskId ? "Task Updated" : "Task Created"
        );

        // Close dialog and refresh
        if (window.uiManager) {
          window.uiManager.closeTaskDialog();
        }
        await this.refreshTasks();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("❌ Error saving task:", error);
      showErrorMessage("Failed to save task. Please try again.", "Save Failed");
    } finally {
      setFormLoading(false);
    }
  }
}

// Export for use in other modules
window.TaskManager = TaskManager;

// Also make it globally available immediately
if (typeof TaskManager !== "undefined") {
  console.log("✅ TaskManager loaded successfully");
}
