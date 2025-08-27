console.log("🏗️ Loading BaseView module...");

class BaseView {
  constructor(options = {}) {
    this.container = options.container;
    this.viewKey = options.viewKey;
    this.dependencies = options.dependencies || {};

    // Common dependencies
    this.apiManager = this.dependencies.apiManager;
    this.taskManager = this.dependencies.taskManager;
    this.projectManager = this.dependencies.projectManager;
    this.uiManager = this.dependencies.uiManager;

    // View state
    this.isInitialized = false;
    this.isVisible = false;
    this.viewElement = null;
    this.data = {
      tasks: [],
      projects: [],
      workspaces: [],
    };

    // View configuration
    this.config = {
      refreshInterval: null,
      autoRefresh: false,
      filters: {
        project: null,
        workspace: null,

        priority: null,
        search: "",
      },
    };

    console.log(`🏗️ BaseView initialized for ${this.viewKey}`);
  }

  /**
   * Initialize the view (to be overridden by subclasses)
   */
  async init() {
    try {
      console.log(`🚀 Initializing ${this.viewKey} view...`);

      // Create view element
      this.createViewElement();

      // Load initial data
      await this.loadData();

      // Render the view
      await this.render();

      // Setup event listeners
      this.setupEventListeners();

      // Mark as initialized
      this.isInitialized = true;

      console.log(`✅ ${this.viewKey} view initialized successfully`);
    } catch (error) {
      console.error(`❌ Failed to initialize ${this.viewKey} view:`, error);
      throw error;
    }
  }

  /**
   * Create the main view element
   */
  createViewElement() {
    // DYNAMIC INJECTION - Use container directly
    this.viewElement = this.container;
    console.log(`📦 Using container for dynamic injection: ${this.viewKey}`);
  }

  /**
   * Load data for the view
   */
  async loadData() {
    try {
      console.log(`📊 Loading data for ${this.viewKey} view...`);

      // Load tasks
      if (this.taskManager) {
        // Use getTasks() method instead of getAllTasks()
        this.data.tasks = this.taskManager.getTasks() || [];
      }

      // Load projects
      if (this.projectManager) {
        // Use getProjects() method instead of getAllProjects()
        this.data.projects = this.projectManager.getProjects() || [];
      }

      // Apply filters
      this.applyFilters();

      console.log(`✅ Data loaded for ${this.viewKey} view`);
    } catch (error) {
      console.error(`❌ Failed to load data for ${this.viewKey} view:`, error);
      throw error;
    }
  }

  /**
   * Apply current filters to data
   */
  applyFilters() {
    let filteredTasks = [...this.data.tasks];

    // Project filter
    if (this.config.filters.project) {
      filteredTasks = filteredTasks.filter(
        (task) => task.project_id === this.config.filters.project
      );
    }

    // Priority filter
    if (this.config.filters.priority) {
      filteredTasks = filteredTasks.filter(
        (task) => task.priority === this.config.filters.priority
      );
    }

    // Search filter
    if (this.config.filters.search) {
      const searchTerm = this.config.filters.search.toLowerCase();
      filteredTasks = filteredTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(searchTerm) ||
          (task.description &&
            task.description.toLowerCase().includes(searchTerm))
      );
    }

    this.data.filteredTasks = filteredTasks;
    console.log(`🔍 Applied filters, ${filteredTasks.length} tasks remaining`);
  }

  /**
   * Render the view (to be overridden by subclasses)
   */
  async render() {
    if (!this.viewElement) {
      throw new Error("View element not created");
    }

    // Default implementation - subclasses should override
    this.viewElement.innerHTML = `
      <div class="view-placeholder">
        <div class="placeholder-content">
          <h2>${
            this.viewKey.charAt(0).toUpperCase() + this.viewKey.slice(1)
          } View</h2>
          <p>This view is not yet implemented.</p>
          <p>Found ${this.data.filteredTasks?.length || 0} tasks to display.</p>
        </div>
      </div>
    `;

    console.log(`🎨 Dynamically rendered ${this.viewKey} view`);
  }

  /**
   * Setup event listeners (to be overridden by subclasses)
   */
  setupEventListeners() {
    // Listen for data updates
    window.addEventListener("tasksUpdated", () => {
      this.refresh();
    });

    window.addEventListener("projectsUpdated", () => {
      this.refresh();
    });

    console.log(`🎧 Event listeners setup for ${this.viewKey} view`);
  }

  /**
   * Show the view
   */
  async show() {
    try {
      if (!this.isInitialized) {
        await this.init();
      }

      if (this.viewElement) {
        this.viewElement.style.display = "block";
        this.isVisible = true;

        // Trigger view shown event
        this.onViewShown();

        console.log(`👁️ ${this.viewKey} view shown`);
      }
    } catch (error) {
      console.error(`❌ Failed to show ${this.viewKey} view:`, error);
      throw error;
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
   * Refresh the view
   */
  async refresh() {
    try {
      console.log(`🔄 Refreshing ${this.viewKey} view...`);

      // Reload data
      await this.loadData();

      // Re-render if visible
      if (this.isVisible) {
        await this.render();
      }

      console.log(`✅ ${this.viewKey} view refreshed`);
    } catch (error) {
      console.error(`❌ Failed to refresh ${this.viewKey} view:`, error);
    }
  }

  /**
   * Update filters
   */
  updateFilters(newFilters) {
    this.config.filters = { ...this.config.filters, ...newFilters };
    this.applyFilters();

    if (this.isVisible) {
      this.render();
    }

    console.log(`🔍 Updated filters for ${this.viewKey} view`);
  }

  /**
   * Get filtered tasks
   */
  getFilteredTasks() {
    return this.data.filteredTasks || this.data.tasks;
  }

  /**
   * Get all tasks
   */
  getAllTasks() {
    return this.data.tasks;
  }

  /**
   * Get projects
   */
  getProjects() {
    return this.data.projects;
  }

  /**
   * Called when view is shown
   */
  onViewShown() {
    // Start auto-refresh if enabled
    if (this.config.autoRefresh && this.config.refreshInterval) {
      this.startAutoRefresh();
    }

    // Subclasses can override this
  }

  /**
   * Called when view is hidden
   */
  onViewHidden() {
    // Stop auto-refresh
    this.stopAutoRefresh();

    // Subclasses can override this
  }

  /**
   * Start auto-refresh
   */
  startAutoRefresh() {
    this.stopAutoRefresh(); // Clear any existing interval

    if (this.config.refreshInterval > 0) {
      this.refreshTimer = setInterval(() => {
        this.refresh();
      }, this.config.refreshInterval * 1000);

      console.log(
        `🔄 Auto-refresh started for ${this.viewKey} view (${this.config.refreshInterval}s)`
      );
    }
  }

  /**
   * Stop auto-refresh
   */
  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
      console.log(`⏹️ Auto-refresh stopped for ${this.viewKey} view`);
    }
  }

  /**
   * Handle task action (create, update, delete)
   */
  async handleTaskAction(action, taskData) {
    try {
      let result;

      switch (action) {
        case "create":
          result = await this.taskManager.createTask(taskData);
          break;
        case "update":
          result = await this.taskManager.updateTask(taskData.id, taskData);
          break;
        case "delete":
          result = await this.taskManager.deleteTask(taskData.id);
          break;
        default:
          throw new Error(`Unknown task action: ${action}`);
      }

      // Refresh view after action
      await this.refresh();

      return result;
    } catch (error) {
      console.error(`❌ Failed to handle task action ${action}:`, error);
      throw error;
    }
  }

  /**
   * Show loading state
   */
  showLoading(message = "Loading...") {
    if (this.viewElement) {
      this.viewElement.innerHTML = `
        <div class="view-loading">
          <div class="loading-content">
            <div class="spinner"></div>
            <p>${message}</p>
          </div>
        </div>
      `;
    }
  }

  /**
   * Show error state
   */
  showError(message = "An error occurred") {
    if (this.viewElement) {
      this.viewElement.innerHTML = `
        <div class="view-error">
          <div class="error-content">
            <div class="error-icon">⚠️</div>
            <h3>Error</h3>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="this.closest('.view-content').dispatchEvent(new CustomEvent('retry'))">
              <span class="btn-icon">🔄</span>
              Retry
            </button>
          </div>
        </div>
      `;

      // Setup retry handler
      this.viewElement.addEventListener("retry", () => {
        this.refresh();
      });
    }
  }

  /**
   * Destroy the view
   */
  destroy() {
    // Stop auto-refresh
    this.stopAutoRefresh();

    // Remove event listeners
    // (Specific listeners should be removed by subclasses)

    // Remove view element
    if (this.viewElement && this.viewElement.parentNode) {
      this.viewElement.parentNode.removeChild(this.viewElement);
    }

    // Clear references
    this.viewElement = null;
    this.data = null;
    this.dependencies = null;

    console.log(`🗑️ ${this.viewKey} view destroyed`);
  }
}

// Make BaseView available globally
window.BaseView = BaseView;

console.log("✅ BaseView module loaded successfully");
