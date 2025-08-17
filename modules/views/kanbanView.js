console.log("📋 Loading KanbanView module...");

class KanbanView extends BaseView {
  constructor(options = {}) {
    super(options);

    this.columns = ["todo", "in_progress", "done"];
    this.columnConfig = {
      todo: {
        title: "To Do",
        icon: "📝",
        color: "#6c757d",
      },
      in_progress: {
        title: "In Progress",
        icon: "⚡",
        color: "#ffc107",
      },
      done: {
        title: "Done",
        icon: "✅",
        color: "#28a745",
      },
    };

    this.dragDropManager = this.dependencies.dragDropManager;

    console.log("📋 KanbanView initialized");
  }

  /**
   * Create the view element - use existing kanban board
   */
  createViewElement() {
    // DYNAMIC INJECTION - Use container directly
    this.viewElement = this.container;
    console.log(`📦 Using container for dynamic Kanban injection`);
  }

  /**
   * Render the Kanban board
   */
  async render() {
    if (!this.viewElement) {
      throw new Error("View element not created");
    }

    const filteredTasks = this.getFilteredTasks();

    // Group tasks by status
    const tasksByStatus = this.groupTasksByStatus(filteredTasks);

    // Generate Kanban HTML
    let kanbanHTML = '<div class="kanban-board">';

    this.columns.forEach((columnKey) => {
      const columnConfig = this.columnConfig[columnKey];
      const columnTasks = tasksByStatus[columnKey] || [];

      kanbanHTML += `
        <div class="kanban-column" data-status="${columnKey}">
          <div class="column-header">
            <div class="column-title">
              <span class="column-icon">${columnConfig.icon}</span>
              <span class="column-name">${columnConfig.title}</span>
              <span class="task-count">${columnTasks.length}</span>
            </div>
            <div class="column-actions">
              <button class="btn btn-small btn-secondary add-task-btn" 
                      data-status="${columnKey}" 
                      title="Add Task">
                <span class="btn-icon">➕</span>
              </button>
            </div>
          </div>
          
          <div class="column-content" data-status="${columnKey}">
            <div class="task-list" data-status="${columnKey}">
              ${this.renderTasks(columnTasks)}
            </div>
            
            <div class="column-footer">
              <button class="btn btn-link add-task-link" data-status="${columnKey}">
                <span class="btn-icon">➕</span>
                Add a task
              </button>
            </div>
          </div>
        </div>
      `;
    });

    kanbanHTML += "</div>";

    // INJECT THE COMPLETE HTML INTO CONTAINER
    this.viewElement.innerHTML = kanbanHTML;

    // Setup drag and drop
    this.setupDragAndDrop();

    console.log(
      `🎨 DYNAMICALLY RENDERED Kanban view with ${filteredTasks.length} tasks`
    );
  }

  /**
   * Render filters and controls
   */
  renderFilters() {
    const projects = this.getProjects();

    return `
      <div class="view-controls">
        <div class="view-filters">
          <div class="filter-group">
            <label for="project-filter">Project:</label>
            <select id="project-filter" class="filter-select">
              <option value="">All Projects</option>
              ${projects
                .map(
                  (project) => `
                <option value="${project.id}" ${
                    this.config.filters.project == project.id ? "selected" : ""
                  }>
                  ${project.name}
                </option>
              `
                )
                .join("")}
            </select>
          </div>
          
          <div class="filter-group">
            <label for="priority-filter">Priority:</label>
            <select id="priority-filter" class="filter-select">
              <option value="">All Priorities</option>
              <option value="high" ${
                this.config.filters.priority === "high" ? "selected" : ""
              }>High</option>
              <option value="medium" ${
                this.config.filters.priority === "medium" ? "selected" : ""
              }>Medium</option>
              <option value="low" ${
                this.config.filters.priority === "low" ? "selected" : ""
              }>Low</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label for="search-filter">Search:</label>
            <input type="text" id="search-filter" class="filter-input" 
                   placeholder="Search tasks..." 
                   value="${this.config.filters.search}">
          </div>
        </div>
        
        <div class="view-actions">
          <button class="btn btn-secondary" id="refresh-view">
            <span class="btn-icon">🔄</span>
            Refresh
          </button>
          <button class="btn btn-primary" id="add-task-global">
            <span class="btn-icon">➕</span>
            Add Task
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Group tasks by status
   */
  groupTasksByStatus(tasks) {
    const grouped = {};

    this.columns.forEach((status) => {
      grouped[status] = [];
    });

    tasks.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });

    return grouped;
  }

  /**
   * Render tasks for a column
   */
  renderTasks(tasks) {
    return tasks.map((task) => this.renderTask(task)).join("");
  }

  /**
   * Render a single task card
   */
  renderTask(task) {
    const project = this.getProjects().find((p) => p.id == task.project_id);
    const projectName = project ? project.name : "Unknown Project";
    const projectColor = project ? project.color : "#6c757d";

    const priorityClass = `priority-${task.priority}`;
    const priorityIcon = this.getPriorityIcon(task.priority);

    const dueDateClass = this.getDueDateClass(task.due_date);
    const dueDateText = task.due_date ? this.formatDate(task.due_date) : "";

    return `
      <div class="task-card" 
           data-task-id="${task.id}" 
           data-status="${task.status}"
           draggable="true">
        
        <div class="task-header">
          <div class="task-priority ${priorityClass}">
            <span class="priority-icon">${priorityIcon}</span>
          </div>
          <div class="task-actions">
            <button class="task-action-btn edit-task" data-task-id="${
              task.id
            }" title="Edit Task">
              <span>✏️</span>
            </button>
            <button class="task-action-btn delete-task" data-task-id="${
              task.id
            }" title="Delete Task">
              <span>🗑️</span>
            </button>
          </div>
        </div>
        
        <div class="task-content">
          <h4 class="task-title">${this.escapeHtml(task.title)}</h4>
          ${
            task.description
              ? `<p class="task-description">${this.escapeHtml(
                  task.description
                )}</p>`
              : ""
          }
        </div>
        
        <div class="task-footer">
          <div class="task-project" style="border-left-color: ${projectColor}">
            <span class="project-name">${this.escapeHtml(projectName)}</span>
          </div>
          ${
            dueDateText
              ? `<div class="task-due-date ${dueDateClass}">${dueDateText}</div>`
              : ""
          }
        </div>
      </div>
    `;
  }

  /**
   * Setup event listeners for Kanban view
   */
  setupEventListeners() {
    super.setupEventListeners();

    if (!this.viewElement) return;

    // Filter change handlers
    const projectFilter = this.viewElement.querySelector("#project-filter");
    const priorityFilter = this.viewElement.querySelector("#priority-filter");
    const searchFilter = this.viewElement.querySelector("#search-filter");

    if (projectFilter) {
      projectFilter.addEventListener("change", (e) => {
        this.updateFilters({ project: e.target.value || null });
      });
    }

    if (priorityFilter) {
      priorityFilter.addEventListener("change", (e) => {
        this.updateFilters({ priority: e.target.value || null });
      });
    }

    if (searchFilter) {
      searchFilter.addEventListener("input", (e) => {
        this.updateFilters({ search: e.target.value });
      });
    }

    // Action button handlers
    const refreshBtn = this.viewElement.querySelector("#refresh-view");
    const addTaskBtn = this.viewElement.querySelector("#add-task-global");

    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => this.refresh());
    }

    if (addTaskBtn) {
      addTaskBtn.addEventListener("click", () => this.showAddTaskModal());
    }

    // Add task buttons in columns
    this.viewElement.addEventListener("click", (e) => {
      if (
        e.target.closest(".add-task-btn") ||
        e.target.closest(".add-task-link")
      ) {
        const status = e.target.closest("[data-status]").dataset.status;
        this.showAddTaskModal(status);
      }

      if (e.target.closest(".edit-task")) {
        const taskId = e.target.closest(".edit-task").dataset.taskId;
        this.showEditTaskModal(taskId);
      }

      if (e.target.closest(".delete-task")) {
        const taskId = e.target.closest(".delete-task").dataset.taskId;
        this.confirmDeleteTask(taskId);
      }
    });

    console.log("🎧 Kanban view event listeners setup");
  }

  /**
   * Setup drag and drop functionality
   */
  setupDragAndDrop() {
    if (!this.dragDropManager) {
      console.warn("⚠️ DragDropManager not available");
      return;
    }

    // Use the correct DragDropManager methods
    if (typeof this.dragDropManager.setupDragAndDropForTasks === "function") {
      this.dragDropManager.setupDragAndDropForTasks();
      console.log("🎯 Drag and drop setup for Kanban view");
    } else if (typeof this.dragDropManager.refreshDragAndDrop === "function") {
      this.dragDropManager.refreshDragAndDrop();
      console.log("🎯 Drag and drop refreshed for Kanban view");
    } else {
      console.warn("⚠️ DragDropManager methods not available");
      console.log(
        "Available methods:",
        Object.getOwnPropertyNames(this.dragDropManager)
      );
    }
  }

  /**
   * Show add task modal
   */
  showAddTaskModal(defaultStatus = "todo") {
    if (this.uiManager && this.uiManager.showTaskModal) {
      this.uiManager.showTaskModal("create", null, { status: defaultStatus });
    } else {
      console.warn("⚠️ UIManager or showTaskModal not available");
    }
  }

  /**
   * Show edit task modal
   */
  showEditTaskModal(taskId) {
    const task = this.getAllTasks().find((t) => t.id == taskId);
    if (task && this.uiManager && this.uiManager.showTaskModal) {
      this.uiManager.showTaskModal("edit", task);
    } else {
      console.warn("⚠️ Task not found or UIManager not available");
    }
  }

  /**
   * Confirm delete task
   */
  confirmDeleteTask(taskId) {
    const task = this.getAllTasks().find((t) => t.id == taskId);
    if (task) {
      if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
        this.handleTaskAction("delete", { id: taskId });
      }
    }
  }

  /**
   * Get priority icon
   */
  getPriorityIcon(priority) {
    const icons = {
      high: "🔴",
      medium: "🟡",
      low: "🟢",
    };
    return icons[priority] || "⚪";
  }

  /**
   * Get due date class
   */
  getDueDateClass(dueDate) {
    if (!dueDate) return "";

    const today = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "overdue";
    if (diffDays === 0) return "due-today";
    if (diffDays <= 3) return "due-soon";
    return "";
  }

  /**
   * Format date for display
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Show the view
   */
  async show() {
    if (this.viewElement) {
      this.viewElement.style.display = "block";
      this.isVisible = true;

      // Refresh data and render
      await this.refresh();

      // Trigger view shown event
      this.onViewShown();

      console.log(`👁️ ${this.viewKey} view shown`);
    }
  }

  /**
   * Hide the view
   */
  async hide() {
    if (this.viewElement) {
      this.viewElement.style.display = "none";
      this.isVisible = false;

      // Trigger view hidden event
      this.onViewHidden();

      console.log(`🙈 ${this.viewKey} view hidden`);
    }
  }

  /**
   * Handle view shown
   */
  onViewShown() {
    super.onViewShown();

    // Re-setup drag and drop when view becomes visible
    setTimeout(() => {
      this.setupDragAndDrop();
    }, 100);
  }
}

// Make KanbanView available globally
window.KanbanView = KanbanView;

console.log("✅ KanbanView module loaded successfully");
