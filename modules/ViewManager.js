console.log("👁️ Loading ViewManager module...");

class ViewManager {
  constructor(dependencies = {}) {
    this.dependencies = dependencies;
    this.apiManager = dependencies.apiManager;
    this.taskManager = dependencies.taskManager;
    this.uiManager = dependencies.uiManager;

    this.currentView = "kanban";
    this.availableViews = {
      kanban: {
        name: "Kanban Board",
        icon: "📋",
        description: "Traditional kanban board with drag & drop",
        component: "KanbanView",
      },
      calendar: {
        name: "Calendar View",
        icon: "📅",
        description: "Tasks displayed on a calendar",
        component: "CalendarView",
      },
      timeline: {
        name: "Timeline View",
        icon: "📊",
        description: "Gantt chart timeline visualization",
        component: "TimelineView",
      },
      list: {
        name: "List View",
        icon: "📝",
        description: "Traditional task list format",
        component: "ListView",
      },
      card: {
        name: "Card View",
        icon: "🗃️",
        description: "Pinterest-style task cards",
        component: "CardView",
      },
    };

    this.viewInstances = new Map();
    this.viewContainer = null;
    this.viewSwitcher = null;

    console.log("👁️ ViewManager initialized");
  }

  /**
   * Initialize the view management system
   */
  async init() {
    try {
      console.log("🚀 Initializing ViewManager...");

      // Setup view container and switcher
      this.setupViewContainer();
      this.setupViewSwitcher();

      // Load user's preferred view
      await this.loadUserPreferences();

      // Initialize the current view
      await this.switchToView(this.currentView);

      console.log("✅ ViewManager initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize ViewManager:", error);
      throw error;
    }
  }

  /**
   * Setup the main view container - CORRECTED LOGIC
   */
  setupViewContainer() {
    // CRITICAL FIX: The kanban board is INSIDE the view-container in HTML
    this.viewContainer = document.getElementById("view-container");
    const originalKanban = document.getElementById("kanban-board");

    if (originalKanban && this.viewContainer) {
      console.log(
        "✅ Found original kanban INSIDE view-container - Setting up proper view switching"
      );

      // STORE the original kanban HTML for restoration
      this.originalKanbanHTML = originalKanban.outerHTML;
      this.originalKanbanBoard = originalKanban;
      this.hasOriginalKanban = true;

      console.log("💾 Stored original kanban HTML for proper view switching");
      return;
    }

    // Fallback: create new container only if original doesn't exist
    if (!this.viewContainer) {
      this.viewContainer = document.createElement("div");
      this.viewContainer.id = "view-container";
      this.viewContainer.className = "view-container";

      const mainContent =
        document.querySelector(".main-content") || document.body;
      const header = document.querySelector(".app-header");

      if (header && header.nextSibling) {
        mainContent.insertBefore(this.viewContainer, header.nextSibling);
      } else {
        mainContent.appendChild(this.viewContainer);
      }
    }

    this.hasOriginalKanban = false;
    console.log("📦 View container setup complete");
  }

  /**
   * Setup the view switcher UI
   */
  setupViewSwitcher() {
    // Look for existing view switcher
    this.viewSwitcher = document.getElementById("view-switcher");

    if (!this.viewSwitcher) {
      // Create view switcher
      this.viewSwitcher = document.createElement("div");
      this.viewSwitcher.id = "view-switcher";
      this.viewSwitcher.className = "view-switcher";

      // Add to header controls
      const headerControls = document.querySelector(".header-controls");
      if (headerControls) {
        headerControls.insertBefore(
          this.viewSwitcher,
          headerControls.firstChild
        );
      }
    }

    // Generate view switcher HTML
    let switcherHTML = '<div class="view-switcher-dropdown">';
    switcherHTML += '<button class="view-switcher-trigger" type="button">';
    switcherHTML += `<span class="current-view-icon">${
      this.availableViews[this.currentView].icon
    }</span>`;
    switcherHTML += `<span class="current-view-name">${
      this.availableViews[this.currentView].name
    }</span>`;
    switcherHTML += '<span class="dropdown-arrow">▼</span>';
    switcherHTML += "</button>";

    switcherHTML += '<div class="view-switcher-menu">';
    Object.entries(this.availableViews).forEach(([viewKey, viewConfig]) => {
      const isActive = viewKey === this.currentView ? "active" : "";
      switcherHTML += `
        <div class="view-option ${isActive}" data-view="${viewKey}">
          <span class="view-icon">${viewConfig.icon}</span>
          <div class="view-info">
            <span class="view-name">${viewConfig.name}</span>
            <span class="view-description">${viewConfig.description}</span>
          </div>
        </div>
      `;
    });
    switcherHTML += "</div>";
    switcherHTML += "</div>";

    this.viewSwitcher.innerHTML = switcherHTML;

    // Setup event listeners
    this.setupViewSwitcherEvents();

    console.log("🔄 View switcher setup complete");
  }

  /**
   * Setup view switcher event listeners
   */
  setupViewSwitcherEvents() {
    const trigger = this.viewSwitcher.querySelector(".view-switcher-trigger");
    const menu = this.viewSwitcher.querySelector(".view-switcher-menu");

    // Toggle dropdown
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.classList.toggle("show");
    });

    // Handle view selection
    menu.addEventListener("click", (e) => {
      const viewOption = e.target.closest(".view-option");
      if (viewOption) {
        const viewKey = viewOption.dataset.view;
        this.switchToView(viewKey);
        menu.classList.remove("show");
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", () => {
      menu.classList.remove("show");
    });

    console.log("🎧 View switcher events setup complete");
  }

  /**
   * Load user preferences for default view
   */
  async loadUserPreferences() {
    try {
      if (this.apiManager) {
        const response = await fetch("php/api/preferences/get_preferences.php");
        const result = await response.json();

        if (result.success && result.data.global.default_view) {
          const preferredView = result.data.global.default_view;
          if (this.availableViews[preferredView]) {
            this.currentView = preferredView;
            console.log(`👤 User preferred view: ${preferredView}`);
          }
        }
      }
    } catch (error) {
      console.warn("⚠️ Could not load user preferences:", error);
    }
  }

  /**
   * Switch to a specific view
   */
  async switchToView(viewKey) {
    try {
      if (!this.availableViews[viewKey]) {
        throw new Error(`Unknown view: ${viewKey}`);
      }

      console.log(`🔄 Switching to ${viewKey} view...`);

      // Show loading state
      this.showViewLoading(true);

      // Hide current view
      if (this.currentView !== viewKey) {
        await this.hideCurrentView();
      }

      // Update current view
      const previousView = this.currentView;
      this.currentView = viewKey;

      // Update view switcher UI
      this.updateViewSwitcherUI();

      // Load and show new view
      await this.loadAndShowView(viewKey);

      // Save preference
      await this.saveViewPreference(viewKey);

      // Trigger view change event
      this.triggerViewChangeEvent(previousView, viewKey);

      // Hide loading state
      this.showViewLoading(false);

      console.log(`✅ Successfully switched to ${viewKey} view`);
    } catch (error) {
      console.error(`❌ Failed to switch to ${viewKey} view:`, error);
      this.showViewError(error.message);
    }
  }

  /**
   * Hide the current view
   */
  async hideCurrentView() {
    const currentViewInstance = this.viewInstances.get(this.currentView);
    if (currentViewInstance && typeof currentViewInstance.hide === "function") {
      await currentViewInstance.hide();
    }

    // CORRECTED LOGIC: Clear the view-container content
    if (this.currentView === "kanban" && this.hasOriginalKanban) {
      // For kanban, we'll replace the content when switching back
      console.log(`🙈 Hiding kanban view - will restore when switching back`);
    } else {
      console.log(`🗑️ Clearing view container for view switch`);
    }

    // Always clear the view container for clean switching
    this.viewContainer.innerHTML = "";
  }

  /**
   * Load and show a specific view
   */
  async loadAndShowView(viewKey) {
    // CORRECTED LOGIC: Handle kanban vs other views properly
    if (viewKey === "kanban" && this.hasOriginalKanban) {
      // RESTORE the original kanban HTML into the view-container
      await this.restoreOriginalKanban();
      console.log(`✅ Restored original kanban HTML into view-container`);
      return;
    }

    // For other views, use the ViewManager system
    let viewInstance = this.viewInstances.get(viewKey);

    if (!viewInstance) {
      // Create new view instance
      viewInstance = await this.createViewInstance(viewKey);
      this.viewInstances.set(viewKey, viewInstance);
    }

    // Render and show the view
    if (typeof viewInstance.render === "function") {
      await viewInstance.render();
    }

    if (typeof viewInstance.show === "function") {
      await viewInstance.show();
    }

    console.log(`✅ Loaded and displayed ${viewKey} view`);
  }

  /**
   * Restore the original kanban HTML - CORRECTED VERSION
   */
  async restoreOriginalKanban() {
    if (!this.hasOriginalKanban || !this.originalKanbanHTML) {
      console.warn("⚠️ No original kanban HTML to restore");
      return;
    }

    try {
      // CRITICAL FIX: Inject the original kanban HTML directly into view-container
      this.viewContainer.innerHTML = this.originalKanbanHTML;

      // Update reference to the restored element
      this.originalKanbanBoard = document.getElementById("kanban-board");

      if (!this.originalKanbanBoard) {
        throw new Error("Failed to find restored kanban board");
      }

      // Ensure view-container is visible
      this.viewContainer.style.display = "flex";
      this.viewContainer.style.visibility = "visible";
      this.viewContainer.style.opacity = "1";

      // Re-initialize ALL functionality for the restored HTML
      setTimeout(() => {
        // Re-initialize drag and drop
        if (window.app && window.app.dragDropManager) {
          window.app.dragDropManager.setupDragAndDropForTasks();
          console.log("🎯 Re-initialized drag & drop for restored kanban");
        }

        // Re-initialize UI manager (for dropdowns and other interactions)
        if (window.app && window.app.uiManager) {
          window.app.uiManager.setupEventListeners();
          console.log(
            "🎧 Re-initialized UI event listeners for restored kanban"
          );
        }

        // Debug the final state
        const computedStyle = window.getComputedStyle(this.originalKanbanBoard);
        const containerStyle = window.getComputedStyle(this.viewContainer);

        console.log("👁️ Final visibility debug:", {
          container: {
            display: containerStyle.display,
            visibility: containerStyle.visibility,
            opacity: containerStyle.opacity,
          },
          kanban: {
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity,
            width: computedStyle.width,
            height: computedStyle.height,
          },
        });

        console.log("✅ Kanban restoration and re-initialization complete");
      }, 100);

      console.log(
        "🔄 Original kanban HTML restored into view-container successfully"
      );
    } catch (error) {
      console.error("❌ Failed to restore original kanban HTML:", error);
      // Fallback: show an error message
      this.viewContainer.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #dc3545;">
          <h3>⚠️ Failed to restore Kanban view</h3>
          <p>Please refresh the page to reload the Kanban board.</p>
          <button onclick="location.reload()" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Refresh Page
          </button>
        </div>
      `;
    }
  }

  /**
   * Force style recalculation to prevent conflicts
   */
  forceStyleRecalculation() {
    const kanbanBoard = this.viewContainer.querySelector(".kanban-board");
    if (kanbanBoard) {
      // Force browser to recalculate styles
      kanbanBoard.style.display = "none";
      kanbanBoard.offsetHeight; // Trigger reflow
      kanbanBoard.style.display = "grid";

      console.log("🔄 Forced style recalculation for kanban board");
    }
  }

  /**
   * Create a new view instance
   */
  async createViewInstance(viewKey) {
    const viewConfig = this.availableViews[viewKey];
    const componentName = viewConfig.component;

    // Check if the view class is available
    if (typeof window[componentName] === "undefined") {
      // Try to load the view module dynamically
      await this.loadViewModule(viewKey);
    }

    if (typeof window[componentName] === "undefined") {
      throw new Error(`View component ${componentName} not found`);
    }

    // Create view instance
    const ViewClass = window[componentName];
    const viewInstance = new ViewClass({
      container: this.viewContainer,
      viewKey: viewKey,
      dependencies: this.dependencies,
    });

    // Initialize the view
    if (typeof viewInstance.init === "function") {
      await viewInstance.init();
    }

    console.log(`📦 Created ${viewKey} view instance`);
    return viewInstance;
  }

  /**
   * Load view module dynamically
   */
  async loadViewModule(viewKey) {
    try {
      const modulePath = `modules/views/${viewKey}View.js`;

      // Create script element to load the module
      const script = document.createElement("script");
      script.src = modulePath;
      script.type = "text/javascript";

      // Return a promise that resolves when the script loads
      return new Promise((resolve, reject) => {
        script.onload = () => {
          console.log(`📦 Loaded ${viewKey} view module`);
          resolve();
        };
        script.onerror = () => {
          console.warn(
            `⚠️ Could not load ${viewKey} view module from ${modulePath}`
          );
          resolve(); // Don't reject, we'll handle missing modules gracefully
        };
        document.head.appendChild(script);
      });
    } catch (error) {
      console.warn(`⚠️ Error loading ${viewKey} view module:`, error);
    }
  }

  /**
   * Update view switcher UI
   */
  updateViewSwitcherUI() {
    const currentViewIcon =
      this.viewSwitcher.querySelector(".current-view-icon");
    const currentViewName =
      this.viewSwitcher.querySelector(".current-view-name");

    if (currentViewIcon && currentViewName) {
      const viewConfig = this.availableViews[this.currentView];
      currentViewIcon.textContent = viewConfig.icon;
      currentViewName.textContent = viewConfig.name;
    }

    // Update active state in menu
    const viewOptions = this.viewSwitcher.querySelectorAll(".view-option");
    viewOptions.forEach((option) => {
      option.classList.remove("active");
      if (option.dataset.view === this.currentView) {
        option.classList.add("active");
      }
    });
  }

  /**
   * Save view preference
   */
  async saveViewPreference(viewKey) {
    try {
      if (this.apiManager) {
        await fetch("php/api/preferences/update_preferences.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            preference_key: "default_view",
            preference_value: viewKey,
          }),
        });
        console.log(`💾 Saved view preference: ${viewKey}`);
      }
    } catch (error) {
      console.warn("⚠️ Could not save view preference:", error);
    }
  }

  /**
   * Trigger view change event
   */
  triggerViewChangeEvent(previousView, newView) {
    const event = new CustomEvent("viewChanged", {
      detail: {
        previousView,
        newView,
        viewConfig: this.availableViews[newView],
      },
    });
    window.dispatchEvent(event);
    console.log(`📡 View change event triggered: ${previousView} → ${newView}`);
  }

  /**
   * Show view loading state
   */
  showViewLoading(show = true) {
    let loadingElement = this.viewContainer.querySelector(".view-loading");

    if (show) {
      if (!loadingElement) {
        loadingElement = document.createElement("div");
        loadingElement.className = "view-loading";
        loadingElement.innerHTML = `
          <div class="loading-content">
            <div class="spinner"></div>
            <p>Loading ${this.availableViews[this.currentView].name}...</p>
          </div>
        `;
        this.viewContainer.appendChild(loadingElement);
      }
      loadingElement.style.display = "flex";
    } else {
      if (loadingElement) {
        loadingElement.style.display = "none";
      }
    }
  }

  /**
   * Show view error state
   */
  showViewError(message) {
    let errorElement = this.viewContainer.querySelector(".view-error");

    if (!errorElement) {
      errorElement = document.createElement("div");
      errorElement.className = "view-error";
      this.viewContainer.appendChild(errorElement);
    }

    errorElement.innerHTML = `
      <div class="error-content">
        <div class="error-icon">⚠️</div>
        <h3>View Loading Error</h3>
        <p>${message}</p>
        <button class="btn btn-primary" onclick="location.reload()">
          <span class="btn-icon">🔄</span>
          Reload Page
        </button>
      </div>
    `;
    errorElement.style.display = "flex";
  }

  /**
   * Get current view
   */
  getCurrentView() {
    return this.currentView;
  }

  /**
   * Get available views
   */
  getAvailableViews() {
    return this.availableViews;
  }

  /**
   * Get view instance
   */
  getViewInstance(viewKey) {
    return this.viewInstances.get(viewKey);
  }

  /**
   * Refresh current view
   */
  async refreshCurrentView() {
    const viewInstance = this.viewInstances.get(this.currentView);
    if (viewInstance && typeof viewInstance.refresh === "function") {
      await viewInstance.refresh();
      console.log(`🔄 Refreshed ${this.currentView} view`);
    }
  }

  /**
   * Destroy view manager
   */
  destroy() {
    // Destroy all view instances
    this.viewInstances.forEach((instance, viewKey) => {
      if (typeof instance.destroy === "function") {
        instance.destroy();
      }
    });
    this.viewInstances.clear();

    // Remove event listeners
    // (Event listeners are automatically removed when elements are removed)

    console.log("🗑️ ViewManager destroyed");
  }
}

// Make ViewManager available globally
window.ViewManager = ViewManager;

console.log("✅ ViewManager module loaded successfully");
