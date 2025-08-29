console.log("📊 Loading Analytics Application...");

class AnalyticsApp {
  constructor() {
    this.modules = {};
    this.currentView = "activity";
    this.isLoading = false;
    this.autoRefreshEnabled = false;
    this.refreshInterval = null;

    console.log("📊 AnalyticsApp initialized");
  }

  /**
   * Initialize the analytics application
   */
  async init() {
    try {
      console.log("🚀 Initializing Analytics Dashboard...");

      // Show loading state
      this.showLoading(true);

      // Initialize modules
      await this.initializeModules();

      // Setup event listeners
      this.setupEventListeners();

      // Load initial data
      await this.loadInitialData();

      // Setup auto-refresh if enabled
      await this.setupAutoRefresh();

      // Hide loading state
      this.showLoading(false);

      console.log("✅ Analytics Dashboard initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize Analytics Dashboard:", error);
      this.showError(error.message);
    }
  }

  /**
   * Initialize all required modules
   */
  async initializeModules() {
    console.log("🔧 Initializing modules...");

    // Check if required classes are available
    if (typeof APIManager === "undefined") {
      throw new Error("APIManager module not loaded");
    }
    if (typeof AnalyticsDataManager === "undefined") {
      throw new Error("AnalyticsDataManager module not loaded");
    }
    if (typeof ChartManager === "undefined") {
      throw new Error("ChartManager module not loaded");
    }
    if (typeof UIManager === "undefined") {
      throw new Error("UIManager module not loaded");
    }

    // Initialize API Manager
    this.modules.apiManager = new APIManager();

    // Initialize Analytics Data Manager
    this.modules.analyticsManager = new AnalyticsDataManager({
      apiManager: this.modules.apiManager,
    });

    // Initialize Chart Manager
    this.modules.chartManager = new ChartManager();

    // Initialize UI Manager
    this.modules.uiManager = new UIManager();

    console.log("✅ All modules initialized");
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    console.log("🎧 Setting up event listeners...");

    // Workspace filter
    const workspaceFilter = document.getElementById("workspace-filter");
    if (workspaceFilter) {
      this.setupDropdownListener(workspaceFilter, (value) => {
        this.onWorkspaceChange(value);
      });
    }

    // Time range filter
    const timeRangeFilter = document.getElementById("time-range-filter");
    if (timeRangeFilter) {
      this.setupDropdownListener(timeRangeFilter, (value) => {
        this.onTimeRangeChange(parseInt(value));
      });
    }

    // Refresh button
    const refreshBtn = document.getElementById("refresh-analytics");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => this.refreshData());
    }

    // Export button
    const exportBtn = document.getElementById("export-data");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => this.exportData());
    }

    // Chart toggle buttons
    const chartToggles = document.querySelectorAll(".chart-toggle");
    chartToggles.forEach((toggle) => {
      toggle.addEventListener("click", (e) => {
        const chartType = e.target.dataset.chart;
        this.switchChart(chartType);
      });
    });

    // Theme toggle
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", () => this.toggleTheme());
    }

    // Auto-refresh on analytics data update
    window.addEventListener("analyticsRefresh", (e) => {
      this.updateDashboard(e.detail.data);
    });

    console.log("✅ Event listeners setup complete");
  }

  /**
   * Setup dropdown listener
   */
  setupDropdownListener(dropdown, callback) {
    const trigger = dropdown.querySelector(".dropdown-trigger");
    const menu = dropdown.querySelector(".dropdown-menu");
    const hiddenInput = dropdown.querySelector('input[type="hidden"]');

    // Toggle dropdown
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.classList.toggle("show");
    });

    // Handle item selection
    menu.addEventListener("click", (e) => {
      if (e.target.classList.contains("dropdown-item")) {
        const value = e.target.dataset.value;
        const text = e.target.textContent;

        // Update UI
        trigger.querySelector(".dropdown-text").textContent = text;
        hiddenInput.value = value;

        // Update active state
        menu.querySelectorAll(".dropdown-item").forEach((item) => {
          item.classList.remove("active");
        });
        e.target.classList.add("active");

        // Close dropdown
        menu.classList.remove("show");

        // Call callback
        callback(value);
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", () => {
      menu.classList.remove("show");
    });
  }

  /**
   * Load initial data
   */
  async loadInitialData() {
    console.log("📊 Loading initial analytics data...");

    try {
      // Check if we're on a page with analytics elements
      const workspaceFilter = document.getElementById("workspace-filter-value");
      const timeRangeFilter = document.getElementById("time-range-value");

      if (!workspaceFilter || !timeRangeFilter) {
        console.log(
          "ℹ️ Analytics elements not found, skipping analytics initialization"
        );
        return;
      }

      // Load workspaces for filter
      await this.loadWorkspaces();

      // Load main analytics data
      const workspaceId = workspaceFilter.value || null;
      const days = parseInt(timeRangeFilter.value) || 30;

      let data;
      try {
        data = await this.modules.analyticsManager.loadOverview(
          workspaceId,
          days
        );
        console.log("✅ Real analytics data loaded successfully");
      } catch (apiError) {
        console.warn("⚠️ API failed, using mock data:", apiError);
        data = this.generateMockAnalyticsData();
        console.log("✅ Mock analytics data generated");
      }

      // Store current data for reference
      this.currentData = data;

      // Update dashboard
      this.updateDashboard(data);

      console.log("✅ Initial data loaded successfully");
    } catch (error) {
      console.error("❌ Failed to load initial data:", error);
      // Use mock data as fallback
      const mockData = this.generateMockAnalyticsData();
      this.currentData = mockData;
      this.updateDashboard(mockData);
    }
  }

  /**
   * Load workspaces for filter dropdown
   */
  async loadWorkspaces() {
    try {
      const response = await fetch("php/api/workspaces/get_workspaces.php");
      const result = await response.json();

      if (result.success && result.data) {
        const workspaceMenu = document.querySelector(
          "#workspace-filter .dropdown-menu"
        );
        if (workspaceMenu) {
          // Keep "All Workspaces" option
          const allOption = workspaceMenu.querySelector('[data-value=""]');
          workspaceMenu.innerHTML = "";
          if (allOption) {
            workspaceMenu.appendChild(allOption);
          }

          // Add workspace options
          result.data.forEach((workspace) => {
            const item = document.createElement("div");
            item.className = "dropdown-item";
            item.dataset.value = workspace.id;
            item.textContent = `${workspace.icon} ${workspace.name}`;
            workspaceMenu.appendChild(item);
          });
        }
      }
    } catch (error) {
      console.warn("⚠️ Failed to load workspaces for filter:", error);
    }
  }

  /**
   * Update dashboard with new data
   */
  updateDashboard(data) {
    console.log("🔄 Updating dashboard with new data...");

    try {
      // Update overview statistics
      this.updateOverviewStats(data);

      // Update charts
      this.updateCharts(data);

      // Update project analytics
      this.updateProjectAnalytics(data);

      // Update productivity heatmap
      this.updateProductivityHeatmap(data);

      // Update activity feed
      this.updateActivityFeed(data);

      // Update workspace comparison (if applicable)
      this.updateWorkspaceComparison(data);

      // Update productivity heatmap
      this.createProductivityHeatmap();

      // Update projects analytics
      this.updateProjectsAnalytics(data);

      console.log("✅ Dashboard updated successfully");
    } catch (error) {
      console.error("❌ Failed to update dashboard:", error);
    }
  }

  /**
   * Update overview statistics cards
   */
  updateOverviewStats(data) {
    const statsContainer = document.getElementById("overview-stats");
    if (!statsContainer) return;

    const stats = this.modules.analyticsManager.generateOverviewStats(data);

    let statsHTML = "";
    stats.forEach((stat) => {
      statsHTML += `
        <div class="stat-card" style="border-left-color: ${stat.color}">
          <div class="stat-header">
            <span class="stat-icon">${stat.icon}</span>
            <span class="stat-title">${stat.title}</span>
          </div>
          <div class="stat-value" style="color: ${stat.color}">${
        stat.value
      }</div>
          <div class="stat-trend ${
            stat.trend.isPositive ? "positive" : "negative"
          }">
            <span class="trend-icon">${
              stat.trend.direction === "up"
                ? "↗️"
                : stat.trend.direction === "down"
                ? "↘️"
                : "➡️"
            }</span>
            <span class="trend-text">${stat.trend.percentage}%</span>
          </div>
        </div>
      `;
    });

    statsContainer.innerHTML = statsHTML;
  }

  /**
   * Update charts based on current view
   */
  updateCharts(data) {
    const chartCanvas = document.getElementById("main-chart");
    if (!chartCanvas) return;

    try {
      switch (this.currentView) {
        case "activity":
          this.modules.chartManager.createActivityChart("main-chart", data);
          break;
        case "completion":
          this.modules.chartManager.createCompletionChart("main-chart", data);
          break;
        case "priority":
          this.modules.chartManager.createPriorityChart("main-chart", data);
          break;
        default:
          this.modules.chartManager.createActivityChart("main-chart", data);
      }
    } catch (error) {
      console.warn("⚠️ Chart creation failed, using fallback:", error);
      this.createFallbackChart(chartCanvas, data);
    }
  }

  /**
   * Create fallback chart when ChartManager fails
   */
  createFallbackChart(canvas, data) {
    const ctx = canvas.getContext("2d");

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create simple chart
    const chartData = data.chartData?.activity || {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          label: "Activity",
          data: [5, 8, 12, 6, 9, 3, 2],
          borderColor: "#667eea",
          backgroundColor: "rgba(102, 126, 234, 0.1)",
        },
      ],
    };

    // Simple chart rendering
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Draw background
    ctx.fillStyle = "#f8f9fa";
    ctx.fillRect(0, 0, width, height);

    // Draw title
    ctx.fillStyle = "#333";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Activity Trends", width / 2, 20);

    // Draw chart area
    ctx.strokeStyle = "#ddd";
    ctx.strokeRect(padding, padding, chartWidth, chartHeight);

    // Draw data
    const maxValue = Math.max(...chartData.datasets[0].data);
    const barWidth = chartWidth / chartData.labels.length;

    chartData.datasets[0].data.forEach((value, index) => {
      const barHeight = (value / maxValue) * chartHeight;
      const x = padding + index * barWidth + barWidth * 0.1;
      const y = padding + chartHeight - barHeight;

      ctx.fillStyle = chartData.datasets[0].backgroundColor;
      ctx.fillRect(x, y, barWidth * 0.8, barHeight);

      ctx.fillStyle = chartData.datasets[0].borderColor;
      ctx.strokeRect(x, y, barWidth * 0.8, barHeight);

      // Draw label
      ctx.fillStyle = "#666";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(chartData.labels[index], x + barWidth * 0.4, height - 10);
    });
  }

  /**
   * Update project analytics section
   */
  updateProjectAnalytics(data) {
    const container = document.getElementById("projects-analytics");
    if (!container || !data.projects) return;

    let projectsHTML = "";
    data.projects.forEach((project) => {
      const completionWidth = Math.max(project.completion_percentage || 0, 5);

      projectsHTML += `
        <div class="project-analytics-card">
          <div class="project-header">
            <div class="project-info">
              <span class="project-color" style="background-color: ${
                project.color
              }"></span>
              <span class="project-name">${project.name}</span>
              <span class="workspace-badge">${project.workspace_icon} ${
        project.workspace_name
      }</span>
            </div>
            <div class="project-stats">
              <span class="completion-rate">${(
                project.completion_percentage || 0
              ).toFixed(0)}%</span>
            </div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${completionWidth}%; background-color: ${
        project.color
      }"></div>
          </div>
          <div class="project-details">
            <div class="detail-item">
              <span class="detail-label">Total Tasks:</span>
              <span class="detail-value">${project.total_tasks}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Completed:</span>
              <span class="detail-value">${project.completed_tasks}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">In Progress:</span>
              <span class="detail-value">${project.in_progress_tasks}</span>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = projectsHTML;
  }

  /**
   * Update productivity heatmap
   */
  updateProductivityHeatmap(data) {
    this.modules.chartManager.createProductivityHeatmap(
      "productivity-heatmap",
      data
    );
  }

  /**
   * Update activity feed
   */
  async updateActivityFeed(data) {
    const container = document.getElementById("activity-feed");
    if (!container) return;

    try {
      let activities;

      // Try to load from API first
      try {
        const activityData =
          await this.modules.analyticsManager.loadActivityLog({
            days: 7,
            limit: 10,
          });
        activities = this.modules.analyticsManager.formatActivityData(
          activityData.activities || []
        );
      } catch (apiError) {
        console.warn("⚠️ Activity API failed, using mock data:", apiError);
        // Use mock activities from data or generate new ones
        activities = this.modules.analyticsManager.formatActivityData(
          data.activities || this.generateMockActivities()
        );
      }

      let activityHTML = "";
      activities.forEach((activity) => {
        activityHTML += `
          <div class="activity-item">
            <div class="activity-icon">${activity.icon}</div>
            <div class="activity-content">
              <div class="activity-text">${activity.actionText}</div>
              <div class="activity-meta">
                <span class="activity-time">${activity.timeAgo}</span>
                <span class="activity-workspace">${
                  activity.workspace?.icon || "🏢"
                } ${activity.workspace?.name || "Unknown Workspace"}</span>
              </div>
            </div>
          </div>
        `;
      });

      container.innerHTML =
        activityHTML || '<div class="no-activity">No recent activity</div>';
    } catch (error) {
      console.error("❌ Failed to update activity feed:", error);
      container.innerHTML =
        '<div class="error-message">Failed to load activity feed</div>';
    }
  }

  /**
   * Update workspace comparison
   */
  updateWorkspaceComparison(data) {
    const container = document.getElementById("workspace-comparison");
    const section = document.getElementById("workspace-comparison-section");

    if (!container || !section) return;

    // Hide section if filtering by specific workspace
    const workspaceId = document.getElementById("workspace-filter-value").value;
    if (workspaceId) {
      section.style.display = "none";
      return;
    }

    section.style.display = "block";

    if (!data.workspaces || data.workspaces.length === 0) {
      container.innerHTML =
        '<div class="no-data">No workspace data available</div>';
      return;
    }

    let workspaceHTML = "";
    data.workspaces.forEach((workspace) => {
      workspaceHTML += `
        <div class="workspace-card">
          <div class="workspace-header">
            <span class="workspace-icon">${workspace.icon}</span>
            <span class="workspace-name">${workspace.name}</span>
          </div>
          <div class="workspace-stats">
            <div class="stat-item">
              <span class="stat-label">Projects</span>
              <span class="stat-value">${workspace.total_projects}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Tasks</span>
              <span class="stat-value">${workspace.total_tasks}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Completion</span>
              <span class="stat-value">${(
                workspace.completion_rate || 0
              ).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = workspaceHTML;
  }

  /**
   * Handle workspace filter change
   */
  async onWorkspaceChange(workspaceId) {
    console.log(`🏢 Workspace filter changed to: ${workspaceId || "All"}`);
    await this.refreshData();
  }

  /**
   * Handle time range filter change
   */
  async onTimeRangeChange(days) {
    console.log(`📅 Time range changed to: ${days} days`);
    await this.refreshData();
  }

  /**
   * Switch chart view
   */
  switchChart(chartType) {
    console.log(`📊 Switching to ${chartType} chart`);

    // Update active button
    document.querySelectorAll(".chart-toggle").forEach((btn) => {
      btn.classList.remove("active");
    });
    document
      .querySelector(`[data-chart="${chartType}"]`)
      .classList.add("active");

    // Update current view
    this.currentView = chartType;

    // Update chart with current data
    if (this.modules.analyticsManager.currentData) {
      this.updateCharts(this.modules.analyticsManager.currentData);
    }
  }

  /**
   * Refresh analytics data
   */
  async refreshData() {
    if (this.isLoading) return;

    console.log("🔄 Refreshing analytics data...");

    try {
      this.isLoading = true;
      this.showLoading(true);

      const workspaceId =
        document.getElementById("workspace-filter-value").value || null;
      const days =
        parseInt(document.getElementById("time-range-value").value) || 30;

      const data = await this.modules.analyticsManager.loadOverview(
        workspaceId,
        days
      );
      this.updateDashboard(data);

      // Show success notification
      this.showNotification("Analytics data refreshed successfully", "success");
    } catch (error) {
      console.error("❌ Failed to refresh data:", error);
      this.showNotification("Failed to refresh analytics data", "error");
    } finally {
      this.isLoading = false;
      this.showLoading(false);
    }
  }

  /**
   * Export analytics data
   */
  exportData() {
    try {
      if (!this.modules.analyticsManager.currentData) {
        this.showNotification("No data to export", "warning");
        return;
      }

      this.modules.analyticsManager.exportData("json");
      this.showNotification("Analytics data exported successfully", "success");
    } catch (error) {
      console.error("❌ Failed to export data:", error);
      this.showNotification("Failed to export analytics data", "error");
    }
  }

  /**
   * Setup auto-refresh
   */
  async setupAutoRefresh() {
    try {
      const preferences = await this.modules.analyticsManager.getPreferences();
      const autoRefreshEnabled =
        preferences.global?.auto_refresh_enabled === "true";
      const refreshInterval =
        parseInt(preferences.global?.analytics_refresh_interval) || 30;

      if (autoRefreshEnabled) {
        this.modules.analyticsManager.startAutoRefresh(refreshInterval);
        this.autoRefreshEnabled = true;
        console.log(`🔄 Auto-refresh enabled (${refreshInterval}s)`);
      }
    } catch (error) {
      console.warn("⚠️ Failed to setup auto-refresh:", error);
    }
  }

  /**
   * Toggle theme
   */
  toggleTheme() {
    const body = document.body;
    const currentTheme = body.dataset.theme;
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    body.dataset.theme = newTheme;

    // Update theme icon
    const themeIcon = document.getElementById("theme-icon");
    if (themeIcon) {
      themeIcon.textContent = newTheme === "dark" ? "☀️" : "🌙";
    }

    // Save preference
    this.modules.analyticsManager.updatePreference("theme", newTheme);

    console.log(`🎨 Theme switched to: ${newTheme}`);
  }

  /**
   * Show loading state
   */
  showLoading(show = true) {
    const loadingElement = document.getElementById("analytics-loading");
    const dashboardElement = document.getElementById("analytics-dashboard");
    const errorElement = document.getElementById("analytics-error");

    if (show) {
      if (loadingElement) loadingElement.style.display = "flex";
      if (dashboardElement) dashboardElement.style.display = "none";
      if (errorElement) errorElement.style.display = "none";
    } else {
      if (loadingElement) loadingElement.style.display = "none";
      if (dashboardElement) dashboardElement.style.display = "block";
    }
  }

  /**
   * Show error state
   */
  showError(message) {
    const errorElement = document.getElementById("analytics-error");
    const loadingElement = document.getElementById("analytics-loading");
    const dashboardElement = document.getElementById("analytics-dashboard");

    if (errorElement) {
      errorElement.style.display = "flex";
      const errorText = errorElement.querySelector("p");
      if (errorText) {
        errorText.textContent = message;
      }
    }

    if (loadingElement) loadingElement.style.display = "none";
    if (dashboardElement) dashboardElement.style.display = "none";
  }

  /**
   * Show notification
   */
  showNotification(message, type = "info") {
    // Use existing notification system if available
    if (typeof showNotification === "function") {
      showNotification(message, type);
    } else {
      console.log(`📢 ${type.toUpperCase()}: ${message}`);
    }
  }

  /**
   * Toggle project view between different formats
   */
  toggleProjectView() {
    const container = document.getElementById("projects-analytics");
    if (!container) return;

    const currentView = container.dataset.view || "cards";
    const newView = currentView === "cards" ? "table" : "cards";

    container.dataset.view = newView;

    if (this.currentData && this.currentData.projects) {
      this.updateProjectsAnalytics(this.currentData);
    }

    this.showNotification(`Switched to ${newView} view`, "info");
  }

  /**
   * Load more activity items
   */
  async loadMoreActivity() {
    const container = document.getElementById("activity-feed");
    if (!container) return;

    try {
      // Get current activity count
      const currentActivities =
        container.querySelectorAll(".activity-item").length;

      // Load more activity (next 10 items)
      const activityData = await this.modules.analyticsManager.loadActivityLog({
        days: 30,
        limit: currentActivities + 10,
      });

      const activities = this.modules.analyticsManager.formatActivityData(
        activityData.activities || []
      );

      let activityHTML = "";
      activities.forEach((activity) => {
        activityHTML += `
          <div class="activity-item">
            <div class="activity-icon">${activity.icon}</div>
            <div class="activity-content">
              <div class="activity-text">${activity.actionText}</div>
              <div class="activity-meta">
                <span class="activity-time">${activity.timeAgo}</span>
                <span class="activity-workspace">${
                  activity.workspace?.icon || "🏢"
                } ${activity.workspace?.name || "Unknown Workspace"}</span>
              </div>
            </div>
          </div>
        `;
      });

      container.innerHTML =
        activityHTML || '<div class="no-activity">No activity found</div>';
      this.showNotification("Loaded more activity items", "success");
    } catch (error) {
      console.error("❌ Failed to load more activity:", error);
      this.showNotification("Failed to load more activity", "error");
    }
  }

  /**
   * Generate comprehensive mock analytics data
   */
  generateMockAnalyticsData() {
    console.log("🎲 Generating mock analytics data...");

    const mockData = {
      overview: {
        total_tasks: 45,
        completed_tasks: 32,
        active_tasks: 13,
        total_projects: 8,
        completed_projects: 3,
        active_projects: 5,
        completion_rate: 71,
        in_progress_tasks: 8,
        overdue_tasks: 2,
      },
      projects: [
        {
          id: 1,
          name: "Website Redesign",
          color: "#667eea",
          status: "active",
          task_count: 12,
          done_count: 8,
          todo_count: 2,
          in_progress_count: 2,
        },
        {
          id: 2,
          name: "Mobile App Development",
          color: "#f093fb",
          status: "active",
          task_count: 18,
          done_count: 15,
          todo_count: 1,
          in_progress_count: 2,
        },
        {
          id: 3,
          name: "Database Migration",
          color: "#4facfe",
          status: "completed",
          task_count: 8,
          done_count: 8,
          todo_count: 0,
          in_progress_count: 0,
        },
        {
          id: 4,
          name: "API Integration",
          color: "#43e97b",
          status: "active",
          task_count: 15,
          done_count: 10,
          todo_count: 3,
          in_progress_count: 2,
        },
        {
          id: 5,
          name: "Security Audit",
          color: "#fa709a",
          status: "paused",
          task_count: 6,
          done_count: 2,
          todo_count: 3,
          in_progress_count: 1,
        },
      ],
      activities: [
        {
          id: 1,
          action_type: "created",
          task: { title: "Design Homepage" },
          project: { name: "Website Redesign" },
          workspace: { name: "Development", icon: "💻" },
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 2,
          action_type: "status_changed",
          task: { title: "API Integration" },
          project: { name: "Mobile App Development" },
          workspace: { name: "Development", icon: "💻" },
          new_value: "completed",
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 3,
          action_type: "updated",
          task: { title: "Database Schema" },
          project: { name: "Database Migration" },
          workspace: { name: "Development", icon: "💻" },
          created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 4,
          action_type: "created",
          task: { title: "User Authentication" },
          project: { name: "API Integration" },
          workspace: { name: "Development", icon: "💻" },
          created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 5,
          action_type: "priority_changed",
          task: { title: "Security Testing" },
          project: { name: "Security Audit" },
          workspace: { name: "Development", icon: "💻" },
          new_value: "high",
          created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        },
      ],
      workspaces: [
        {
          id: 1,
          name: "Development",
          icon: "💻",
          total_projects: 5,
          total_tasks: 45,
          completion_rate: 71,
        },
        {
          id: 2,
          name: "Marketing",
          icon: "📢",
          total_projects: 2,
          total_tasks: 12,
          completion_rate: 58,
        },
        {
          id: 3,
          name: "Design",
          icon: "🎨",
          total_projects: 1,
          total_tasks: 8,
          completion_rate: 87,
        },
      ],
      chartData: {
        activity: {
          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          datasets: [
            {
              label: "Tasks Created",
              data: [5, 8, 12, 6, 9, 3, 2],
              borderColor: "#667eea",
              backgroundColor: "rgba(102, 126, 234, 0.1)",
            },
            {
              label: "Tasks Completed",
              data: [3, 6, 10, 4, 7, 2, 1],
              borderColor: "#43e97b",
              backgroundColor: "rgba(67, 233, 123, 0.1)",
            },
          ],
        },
        completion: {
          labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
          datasets: [
            {
              label: "Completion Rate",
              data: [65, 72, 68, 71],
              borderColor: "#fa709a",
              backgroundColor: "rgba(250, 112, 154, 0.1)",
            },
          ],
        },
        priority: {
          labels: ["Low", "Medium", "High", "Critical"],
          datasets: [
            {
              data: [15, 25, 8, 2],
              backgroundColor: ["#43e97b", "#f093fb", "#fa709a", "#e74c3c"],
            },
          ],
        },
      },
    };

    console.log("✅ Mock analytics data generated:", mockData);
    return mockData;
  }

  /**
   * Generate productivity heatmap data
   */
  generateHeatmapData() {
    // Generate mock heatmap data for the last 7 weeks
    const heatmapData = [];
    const today = new Date();

    for (let week = 6; week >= 0; week--) {
      const weekData = [];
      for (let day = 0; day < 7; day++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (week * 7 + day));

        // Generate random activity level (0-4)
        const activityLevel = Math.floor(Math.random() * 5);

        weekData.push({
          date: date.toISOString().split("T")[0],
          value: activityLevel,
          count: activityLevel * 2 + Math.floor(Math.random() * 5),
        });
      }
      heatmapData.push(weekData);
    }

    return heatmapData;
  }

  /**
   * Generate mock activities for fallback
   */
  generateMockActivities() {
    const mockActivities = [
      {
        id: 1,
        action_type: "created",
        task: { title: "Design Homepage" },
        project: { name: "Website Redesign" },
        workspace: { name: "Development", icon: "💻" },
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 2,
        action_type: "status_changed",
        task: { title: "API Integration" },
        project: { name: "Mobile App Development" },
        workspace: { name: "Development", icon: "💻" },
        new_value: "completed",
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 3,
        action_type: "updated",
        task: { title: "Database Schema" },
        project: { name: "Database Migration" },
        workspace: { name: "Development", icon: "💻" },
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 4,
        action_type: "created",
        task: { title: "User Authentication" },
        project: { name: "API Integration" },
        workspace: { name: "Development", icon: "💻" },
        created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 5,
        action_type: "priority_changed",
        task: { title: "Security Testing" },
        project: { name: "Security Audit" },
        workspace: { name: "Development", icon: "💻" },
        new_value: "high",
        created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      },
    ];
    return mockActivities;
  }

  /**
   * Create productivity heatmap
   */
  createProductivityHeatmap() {
    const container = document.getElementById("productivity-heatmap");
    if (!container) return;

    const heatmapData = this.generateHeatmapData();

    let heatmapHTML = '<div class="heatmap-grid">';

    // Add day labels
    heatmapHTML += '<div class="heatmap-labels">';
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    days.forEach((day) => {
      heatmapHTML += `<div class="day-label">${day}</div>`;
    });
    heatmapHTML += "</div>";

    // Add heatmap cells
    heatmapData.forEach((week, weekIndex) => {
      heatmapHTML += '<div class="heatmap-week">';
      week.forEach((day, dayIndex) => {
        const intensity = day.value;
        const intensityClass =
          intensity === 0
            ? "empty"
            : intensity === 1
            ? "low"
            : intensity === 2
            ? "medium"
            : intensity === 3
            ? "high"
            : "very-high";

        heatmapHTML += `
          <div class="heatmap-cell ${intensityClass}" 
               title="${day.date}: ${day.count} activities"
               data-date="${day.date}"
               data-count="${day.count}">
          </div>
        `;
      });
      heatmapHTML += "</div>";
    });

    heatmapHTML += "</div>";
    container.innerHTML = heatmapHTML;
  }

  /**
   * Update projects analytics with different view modes
   */
  updateProjectsAnalytics(data) {
    const container = document.getElementById("projects-analytics");
    if (!container) return;

    const currentView = container.dataset.view || "cards";

    if (currentView === "table") {
      this.updateProjectsTable(data);
    } else {
      this.updateProjectsCards(data);
    }
  }

  /**
   * Update projects in table view
   */
  updateProjectsTable(data) {
    const container = document.getElementById("projects-analytics");
    if (!container) return;

    if (!data.projects || data.projects.length === 0) {
      container.innerHTML = '<div class="no-data">No projects available</div>';
      return;
    }

    let tableHTML = `
      <div class="projects-table">
        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Total Tasks</th>
              <th>Completed</th>
              <th>Progress</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
    `;

    data.projects.forEach((project) => {
      const progress =
        project.task_count > 0
          ? Math.round((project.done_count / project.task_count) * 100)
          : 0;

      tableHTML += `
        <tr>
          <td>
            <div class="project-info">
              <span class="project-icon" style="color: ${
                project.color
              }">📁</span>
              <span class="project-name">${project.name}</span>
            </div>
          </td>
          <td>${project.task_count || 0}</td>
          <td>${project.done_count || 0}</td>
          <td>
            <div class="progress-bar small">
              <div class="progress-fill" style="width: ${progress}%; background: ${
        project.color
      }"></div>
            </div>
            <span class="progress-text">${progress}%</span>
          </td>
          <td>
            <span class="status-badge ${project.status || "active"}">${
        project.status || "Active"
      }</span>
          </td>
          <td>
            <button class="btn btn-small btn-secondary" onclick="viewProjectDetails(${
              project.id
            })">
              <span class="btn-icon">👁️</span>
              View
            </button>
          </td>
        </tr>
      `;
    });

    tableHTML += `
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = tableHTML;
  }

  /**
   * Update projects in card view
   */
  updateProjectsCards(data) {
    const container = document.getElementById("projects-analytics");
    if (!container) return;

    if (!data.projects || data.projects.length === 0) {
      container.innerHTML = '<div class="no-data">No projects available</div>';
      return;
    }

    let cardsHTML = '<div class="projects-grid">';

    data.projects.forEach((project) => {
      const progress =
        project.task_count > 0
          ? Math.round((project.done_count / project.task_count) * 100)
          : 0;

      cardsHTML += `
        <div class="project-card" style="border-left: 4px solid ${
          project.color
        }">
          <div class="project-header">
            <h4 style="color: ${project.color}">${project.name}</h4>
            <span class="status-badge ${project.status || "active"}">${
        project.status || "Active"
      }</span>
          </div>
          <div class="project-stats">
            <div class="stat-item">
              <span class="stat-label">Total Tasks</span>
              <span class="stat-value">${project.task_count || 0}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Completed</span>
              <span class="stat-value">${project.done_count || 0}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Progress</span>
              <span class="stat-value">${progress}%</span>
            </div>
          </div>
          <div class="project-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progress}%; background: ${
        project.color
      }"></div>
            </div>
          </div>
          <div class="project-actions">
            <button class="btn btn-small btn-secondary" onclick="viewProjectDetails(${
              project.id
            })">
              <span class="btn-icon">👁️</span>
              View Details
            </button>
          </div>
        </div>
      `;
    });

    cardsHTML += "</div>";
    container.innerHTML = cardsHTML;
  }
}

// Global functions for HTML onclick handlers
window.refreshOverview = () => {
  if (window.analyticsApp) {
    window.analyticsApp.refreshData();
  }
};

window.toggleProjectView = () => {
  console.log("🔄 Toggling project view...");
  if (window.analyticsApp) {
    window.analyticsApp.toggleProjectView();
  }
};

window.loadMoreActivity = () => {
  console.log("⬇️ Loading more activity...");
  if (window.analyticsApp) {
    window.analyticsApp.loadMoreActivity();
  }
};

window.exportWorkspaceData = () => {
  if (window.analyticsApp) {
    window.analyticsApp.exportData();
  }
};

window.viewProjectDetails = (projectId) => {
  console.log("👁️ Viewing project details:", projectId);
  // For now, show a notification. In a real app, this would open a detailed view
  if (window.analyticsApp) {
    window.analyticsApp.showNotification(
      `Viewing details for project ${projectId}`,
      "info"
    );
  }
};

window.initializeAnalytics = () => {
  if (window.analyticsApp) {
    window.analyticsApp.init();
  }
};

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 DOM loaded, initializing Analytics App...");

  try {
    window.analyticsApp = new AnalyticsApp();
    await window.analyticsApp.init();
  } catch (error) {
    console.error("❌ Failed to initialize Analytics App:", error);
  }
});

console.log("✅ Analytics Application script loaded successfully");
