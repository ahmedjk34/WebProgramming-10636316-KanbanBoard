console.log("📝 Loading ListView module...");

class ListView extends BaseView {
  constructor(options = {}) {
    super(options);

    this.sortBy = "created_at";
    this.sortOrder = "desc";
    this.groupBy = "none"; // none, project, status, priority, due_date

    console.log("📝 ListView initialized");
  }

  /**
   * Create the view element - DYNAMIC INJECTION
   */
  createViewElement() {
    // Use container directly for dynamic injection
    this.viewElement = this.container;
    console.log(`📦 Using container for dynamic List injection`);
  }

  /**
   * Render the List view - COMPLETE DYNAMIC HTML INJECTION
   */
  async render() {
    if (!this.viewElement) {
      throw new Error("View element not created");
    }

    const filteredTasks = this.getFilteredTasks();

    // Sort tasks
    const sortedTasks = this.sortTasks(filteredTasks);

    // Group tasks if needed
    const groupedTasks = this.groupTasks(sortedTasks);

    // Generate COMPLETE List HTML
    let listHTML = this.renderListControls();
    listHTML += this.renderTaskList(groupedTasks);

    // INJECT THE COMPLETE HTML INTO CONTAINER
    this.viewElement.innerHTML = listHTML;

    console.log(
      `🎨 DYNAMICALLY RENDERED List view with ${filteredTasks.length} tasks`
    );
  }

  /**
   * Render list controls
   */
  renderListControls() {
    const projects = this.getProjects();

    return `
      <div class="list-controls">
        <div class="list-filters">
          <div class="filter-group">
            <label for="project-filter-list">Project:</label>
            <select id="project-filter-list" class="filter-select">
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
            <label for="status-filter-list">Status:</label>
            <select id="status-filter-list" class="filter-select">
              <option value="">All Statuses</option>
              <option value="todo" ${
                this.config.filters.status === "todo" ? "selected" : ""
              }>To Do</option>
              <option value="in_progress" ${
                this.config.filters.status === "in_progress" ? "selected" : ""
              }>In Progress</option>
              <option value="done" ${
                this.config.filters.status === "done" ? "selected" : ""
              }>Done</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label for="priority-filter-list">Priority:</label>
            <select id="priority-filter-list" class="filter-select">
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
            <label for="search-filter-list">Search:</label>
            <input type="text" id="search-filter-list" class="filter-input" 
                   placeholder="Search tasks..." 
                   value="${this.config.filters.search}">
          </div>
        </div>
        
        <div class="list-sorting">
          <div class="sort-group">
            <label for="sort-by">Sort by:</label>
            <select id="sort-by" class="sort-select">
              <option value="created_at" ${
                this.sortBy === "created_at" ? "selected" : ""
              }>Created Date</option>
              <option value="title" ${
                this.sortBy === "title" ? "selected" : ""
              }>Title</option>
              <option value="priority" ${
                this.sortBy === "priority" ? "selected" : ""
              }>Priority</option>
              <option value="due_date" ${
                this.sortBy === "due_date" ? "selected" : ""
              }>Due Date</option>
              <option value="status" ${
                this.sortBy === "status" ? "selected" : ""
              }>Status</option>
            </select>
          </div>
          
          <div class="sort-group">
            <label for="sort-order">Order:</label>
            <select id="sort-order" class="sort-select">
              <option value="asc" ${
                this.sortOrder === "asc" ? "selected" : ""
              }>Ascending</option>
              <option value="desc" ${
                this.sortOrder === "desc" ? "selected" : ""
              }>Descending</option>
            </select>
          </div>
          
          <div class="sort-group">
            <label for="group-by">Group by:</label>
            <select id="group-by" class="sort-select">
              <option value="none" ${
                this.groupBy === "none" ? "selected" : ""
              }>None</option>
              <option value="project" ${
                this.groupBy === "project" ? "selected" : ""
              }>Project</option>
              <option value="status" ${
                this.groupBy === "status" ? "selected" : ""
              }>Status</option>
              <option value="priority" ${
                this.groupBy === "priority" ? "selected" : ""
              }>Priority</option>
              <option value="due_date" ${
                this.groupBy === "due_date" ? "selected" : ""
              }>Due Date</option>
            </select>
          </div>
        </div>
        
        <div class="list-actions">
          <button class="btn btn-secondary" id="refresh-list">
            <span class="btn-icon">🔄</span>
            Refresh
          </button>
          <button class="btn btn-primary" id="add-task-list">
            <span class="btn-icon">➕</span>
            Add Task
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render task list
   */
  renderTaskList(groupedTasks) {
    if (this.groupBy === "none") {
      return `
        <div class="task-list-container">
          <div class="task-list-header">
            <div class="task-count">${groupedTasks.length} tasks</div>
          </div>
          <div class="task-list">
            ${groupedTasks.map((task) => this.renderTaskRow(task)).join("")}
          </div>
        </div>
      `;
    } else {
      let listHTML = '<div class="task-list-container grouped">';

      Object.entries(groupedTasks).forEach(([groupKey, tasks]) => {
        const groupTitle = this.getGroupTitle(groupKey);

        listHTML += `
          <div class="task-group">
            <div class="group-header">
              <h3 class="group-title">${groupTitle}</h3>
              <span class="group-count">${tasks.length} tasks</span>
            </div>
            <div class="task-list">
              ${tasks.map((task) => this.renderTaskRow(task)).join("")}
            </div>
          </div>
        `;
      });

      listHTML += "</div>";
      return listHTML;
    }
  }

  /**
   * Render a single task row
   */
  renderTaskRow(task) {
    const project = this.getProjects().find((p) => p.id == task.project_id);
    const projectName = project ? project.name : "Unknown Project";
    const projectColor = project ? project.color : "#6c757d";

    const priorityIcon = this.getPriorityIcon(task.priority);
    const statusIcon = this.getStatusIcon(task.status);
    const dueDateClass = this.getDueDateClass(task.due_date);
    const dueDateText = task.due_date ? this.formatDate(task.due_date) : "";

    return `
      <div class="task-row" data-task-id="${task.id}">
        <div class="task-checkbox">
          <input type="checkbox" 
                 id="task-${task.id}" 
                 ${task.status === "done" ? "checked" : ""}
                 data-task-id="${task.id}">
        </div>
        
        <div class="task-priority">
          <span class="priority-icon priority-${task.priority}" title="${
      task.priority
    } priority">
            ${priorityIcon}
          </span>
        </div>
        
        <div class="task-content">
          <div class="task-title ${task.status === "done" ? "completed" : ""}">
            ${this.escapeHtml(task.title)}
          </div>
          ${
            task.description
              ? `
            <div class="task-description">
              ${this.escapeHtml(task.description)}
            </div>
          `
              : ""
          }
        </div>
        
        <div class="task-project" style="color: ${projectColor}">
          <span class="project-indicator" style="background-color: ${projectColor}"></span>
          ${this.escapeHtml(projectName)}
        </div>
        
        <div class="task-status">
          <span class="status-badge status-${task.status}">
            ${statusIcon} ${task.status.replace("_", " ")}
          </span>
        </div>
        
        <div class="task-due-date ${dueDateClass}">
          ${dueDateText}
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
    `;
  }

  /**
   * Sort tasks
   */
  sortTasks(tasks) {
    return [...tasks].sort((a, b) => {
      let aValue = a[this.sortBy];
      let bValue = b[this.sortBy];

      // Handle special cases
      if (this.sortBy === "priority") {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        aValue = priorityOrder[a.priority] || 0;
        bValue = priorityOrder[b.priority] || 0;
      } else if (this.sortBy === "due_date") {
        aValue = a.due_date ? new Date(a.due_date) : new Date("9999-12-31");
        bValue = b.due_date ? new Date(b.due_date) : new Date("9999-12-31");
      } else if (this.sortBy === "title") {
        aValue = (aValue || "").toLowerCase();
        bValue = (bValue || "").toLowerCase();
      }

      // Compare values
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      return this.sortOrder === "desc" ? -comparison : comparison;
    });
  }

  /**
   * Group tasks
   */
  groupTasks(tasks) {
    if (this.groupBy === "none") {
      return tasks;
    }

    const grouped = {};

    tasks.forEach((task) => {
      let groupKey;

      switch (this.groupBy) {
        case "project":
          const project = this.getProjects().find(
            (p) => p.id == task.project_id
          );
          groupKey = project ? project.name : "Unknown Project";
          break;
        case "status":
          groupKey = task.status;
          break;
        case "priority":
          groupKey = task.priority;
          break;
        case "due_date":
          if (task.due_date) {
            const dueDate = new Date(task.due_date);
            const today = new Date();
            const diffDays = Math.ceil(
              (dueDate - today) / (1000 * 60 * 60 * 24)
            );

            if (diffDays < 0) groupKey = "Overdue";
            else if (diffDays === 0) groupKey = "Due Today";
            else if (diffDays <= 7) groupKey = "Due This Week";
            else if (diffDays <= 30) groupKey = "Due This Month";
            else groupKey = "Due Later";
          } else {
            groupKey = "No Due Date";
          }
          break;
        default:
          groupKey = "Other";
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(task);
    });

    return grouped;
  }

  /**
   * Get group title
   */
  getGroupTitle(groupKey) {
    switch (this.groupBy) {
      case "status":
        return groupKey
          .replace("_", " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
      case "priority":
        return (
          groupKey.charAt(0).toUpperCase() + groupKey.slice(1) + " Priority"
        );
      default:
        return groupKey;
    }
  }

  /**
   * Setup event listeners for List view
   */
  setupEventListeners() {
    super.setupEventListeners();

    if (!this.viewElement) return;

    // Filter change handlers
    const projectFilter = this.viewElement.querySelector(
      "#project-filter-list"
    );
    const statusFilter = this.viewElement.querySelector("#status-filter-list");
    const priorityFilter = this.viewElement.querySelector(
      "#priority-filter-list"
    );
    const searchFilter = this.viewElement.querySelector("#search-filter-list");

    if (projectFilter) {
      projectFilter.addEventListener("change", (e) => {
        this.updateFilters({ project: e.target.value || null });
      });
    }

    if (statusFilter) {
      statusFilter.addEventListener("change", (e) => {
        this.updateFilters({ status: e.target.value || null });
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

    // Sort change handlers
    const sortBy = this.viewElement.querySelector("#sort-by");
    const sortOrder = this.viewElement.querySelector("#sort-order");
    const groupBy = this.viewElement.querySelector("#group-by");

    if (sortBy) {
      sortBy.addEventListener("change", (e) => {
        this.sortBy = e.target.value;
        this.render();
      });
    }

    if (sortOrder) {
      sortOrder.addEventListener("change", (e) => {
        this.sortOrder = e.target.value;
        this.render();
      });
    }

    if (groupBy) {
      groupBy.addEventListener("change", (e) => {
        this.groupBy = e.target.value;
        this.render();
      });
    }

    // Action button handlers
    const refreshBtn = this.viewElement.querySelector("#refresh-list");
    const addTaskBtn = this.viewElement.querySelector("#add-task-list");

    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => this.refresh());
    }

    if (addTaskBtn) {
      addTaskBtn.addEventListener("click", () => this.showAddTaskModal());
    }

    // Task action handlers
    this.viewElement.addEventListener("click", (e) => {
      if (e.target.closest(".edit-task")) {
        const taskId = e.target.closest(".edit-task").dataset.taskId;
        this.showEditTaskModal(taskId);
      }

      if (e.target.closest(".delete-task")) {
        const taskId = e.target.closest(".delete-task").dataset.taskId;
        this.confirmDeleteTask(taskId);
      }
    });

    // Checkbox handlers
    this.viewElement.addEventListener("change", (e) => {
      if (e.target.type === "checkbox" && e.target.dataset.taskId) {
        const taskId = e.target.dataset.taskId;
        const isCompleted = e.target.checked;
        this.toggleTaskCompletion(taskId, isCompleted);
      }
    });

    console.log("🎧 List view event listeners setup");
  }

  /**
   * Toggle task completion
   */
  async toggleTaskCompletion(taskId, isCompleted) {
    const task = this.getAllTasks().find((t) => t.id == taskId);
    if (task) {
      const newStatus = isCompleted ? "done" : "todo";
      await this.handleTaskAction("update", { ...task, status: newStatus });
    }
  }

  /**
   * Show add task modal
   */
  showAddTaskModal() {
    if (this.uiManager && this.uiManager.showTaskModal) {
      this.uiManager.showTaskModal("create");
    }
  }

  /**
   * Show edit task modal
   */
  showEditTaskModal(taskId) {
    const task = this.getAllTasks().find((t) => t.id == taskId);
    if (task && this.uiManager && this.uiManager.showTaskModal) {
      this.uiManager.showTaskModal("edit", task);
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
   * Utility functions
   */
  getPriorityIcon(priority) {
    const icons = {
      high: "🔴",
      medium: "🟡",
      low: "🟢",
    };
    return icons[priority] || "⚪";
  }

  getStatusIcon(status) {
    const icons = {
      todo: "📝",
      in_progress: "⚡",
      done: "✅",
    };
    return icons[status] || "❓";
  }

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

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year:
        date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    });
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Make ListView available globally
window.ListView = ListView;

console.log("✅ ListView module loaded successfully");
