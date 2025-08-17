console.log("📊 Loading Analytics Application...");

class AnalyticsApp {
  constructor() {
    this.modules = {};
    this.currentView = 'activity';
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
    if (typeof APIManager === 'undefined') {
      throw new Error('APIManager module not loaded');
    }
    if (typeof AnalyticsDataManager === 'undefined') {
      throw new Error('AnalyticsDataManager module not loaded');
    }
    if (typeof ChartManager === 'undefined') {
      throw new Error('ChartManager module not loaded');
    }
    if (typeof UIManager === 'undefined') {
      throw new Error('UIManager module not loaded');
    }

    // Initialize API Manager
    this.modules.apiManager = new APIManager();
    
    // Initialize Analytics Data Manager
    this.modules.analyticsManager = new AnalyticsDataManager({
      apiManager: this.modules.apiManager
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
    const workspaceFilter = document.getElementById('workspace-filter');
    if (workspaceFilter) {
      this.setupDropdownListener(workspaceFilter, (value) => {
        this.onWorkspaceChange(value);
      });
    }
    
    // Time range filter
    const timeRangeFilter = document.getElementById('time-range-filter');
    if (timeRangeFilter) {
      this.setupDropdownListener(timeRangeFilter, (value) => {
        this.onTimeRangeChange(parseInt(value));
      });
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refresh-analytics');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshData());
    }
    
    // Export button
    const exportBtn = document.getElementById('export-data');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportData());
    }
    
    // Chart toggle buttons
    const chartToggles = document.querySelectorAll('.chart-toggle');
    chartToggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        const chartType = e.target.dataset.chart;
        this.switchChart(chartType);
      });
    });
    
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }
    
    // Auto-refresh on analytics data update
    window.addEventListener('analyticsRefresh', (e) => {
      this.updateDashboard(e.detail.data);
    });
    
    console.log("✅ Event listeners setup complete");
  }

  /**
   * Setup dropdown listener
   */
  setupDropdownListener(dropdown, callback) {
    const trigger = dropdown.querySelector('.dropdown-trigger');
    const menu = dropdown.querySelector('.dropdown-menu');
    const hiddenInput = dropdown.querySelector('input[type="hidden"]');
    
    // Toggle dropdown
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('show');
    });
    
    // Handle item selection
    menu.addEventListener('click', (e) => {
      if (e.target.classList.contains('dropdown-item')) {
        const value = e.target.dataset.value;
        const text = e.target.textContent;
        
        // Update UI
        trigger.querySelector('.dropdown-text').textContent = text;
        hiddenInput.value = value;
        
        // Update active state
        menu.querySelectorAll('.dropdown-item').forEach(item => {
          item.classList.remove('active');
        });
        e.target.classList.add('active');
        
        // Close dropdown
        menu.classList.remove('show');
        
        // Call callback
        callback(value);
      }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      menu.classList.remove('show');
    });
  }

  /**
   * Load initial data
   */
  async loadInitialData() {
    console.log("📊 Loading initial analytics data...");
    
    try {
      // Load workspaces for filter
      await this.loadWorkspaces();
      
      // Load main analytics data
      const workspaceId = document.getElementById('workspace-filter-value').value || null;
      const days = parseInt(document.getElementById('time-range-value').value) || 30;
      
      const data = await this.modules.analyticsManager.loadOverview(workspaceId, days);
      
      // Update dashboard
      this.updateDashboard(data);
      
      console.log("✅ Initial data loaded successfully");
      
    } catch (error) {
      console.error("❌ Failed to load initial data:", error);
      throw error;
    }
  }

  /**
   * Load workspaces for filter dropdown
   */
  async loadWorkspaces() {
    try {
      const response = await fetch('php/api/workspaces/get_workspaces.php');
      const result = await response.json();
      
      if (result.success && result.data) {
        const workspaceMenu = document.querySelector('#workspace-filter .dropdown-menu');
        if (workspaceMenu) {
          // Keep "All Workspaces" option
          const allOption = workspaceMenu.querySelector('[data-value=""]');
          workspaceMenu.innerHTML = '';
          if (allOption) {
            workspaceMenu.appendChild(allOption);
          }
          
          // Add workspace options
          result.data.forEach(workspace => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
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
      
      console.log("✅ Dashboard updated successfully");
      
    } catch (error) {
      console.error("❌ Failed to update dashboard:", error);
    }
  }

  /**
   * Update overview statistics cards
   */
  updateOverviewStats(data) {
    const statsContainer = document.getElementById('overview-stats');
    if (!statsContainer) return;
    
    const stats = this.modules.analyticsManager.generateOverviewStats(data);
    
    let statsHTML = '';
    stats.forEach(stat => {
      statsHTML += `
        <div class="stat-card" style="border-left-color: ${stat.color}">
          <div class="stat-header">
            <span class="stat-icon">${stat.icon}</span>
            <span class="stat-title">${stat.title}</span>
          </div>
          <div class="stat-value" style="color: ${stat.color}">${stat.value}</div>
          <div class="stat-trend ${stat.trend.isPositive ? 'positive' : 'negative'}">
            <span class="trend-icon">${stat.trend.direction === 'up' ? '↗️' : stat.trend.direction === 'down' ? '↘️' : '➡️'}</span>
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
    const chartCanvas = document.getElementById('main-chart');
    if (!chartCanvas) return;
    
    switch (this.currentView) {
      case 'activity':
        this.modules.chartManager.createActivityChart('main-chart', data);
        break;
      case 'completion':
        this.modules.chartManager.createCompletionChart('main-chart', data);
        break;
      case 'priority':
        this.modules.chartManager.createPriorityChart('main-chart', data);
        break;
      default:
        this.modules.chartManager.createActivityChart('main-chart', data);
    }
  }

  /**
   * Update project analytics section
   */
  updateProjectAnalytics(data) {
    const container = document.getElementById('projects-analytics');
    if (!container || !data.projects) return;
    
    let projectsHTML = '';
    data.projects.forEach(project => {
      const completionWidth = Math.max(project.completion_percentage || 0, 5);
      
      projectsHTML += `
        <div class="project-analytics-card">
          <div class="project-header">
            <div class="project-info">
              <span class="project-color" style="background-color: ${project.color}"></span>
              <span class="project-name">${project.name}</span>
              <span class="workspace-badge">${project.workspace_icon} ${project.workspace_name}</span>
            </div>
            <div class="project-stats">
              <span class="completion-rate">${project.completion_percentage || 0}%</span>
            </div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${completionWidth}%; background-color: ${project.color}"></div>
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
    this.modules.chartManager.createProductivityHeatmap('productivity-heatmap', data);
  }

  /**
   * Update activity feed
   */
  async updateActivityFeed(data) {
    const container = document.getElementById('activity-feed');
    if (!container) return;
    
    try {
      // Load recent activity
      const activityData = await this.modules.analyticsManager.loadActivityLog({
        days: 7,
        limit: 10
      });
      
      const activities = this.modules.analyticsManager.formatActivityData(activityData.activities || []);
      
      let activityHTML = '';
      activities.forEach(activity => {
        activityHTML += `
          <div class="activity-item">
            <div class="activity-icon">${activity.icon}</div>
            <div class="activity-content">
              <div class="activity-text">${activity.actionText}</div>
              <div class="activity-meta">
                <span class="activity-time">${activity.timeAgo}</span>
                <span class="activity-workspace">${activity.workspace?.icon} ${activity.workspace?.name}</span>
              </div>
            </div>
          </div>
        `;
      });
      
      container.innerHTML = activityHTML || '<div class="no-activity">No recent activity</div>';
      
    } catch (error) {
      console.error("❌ Failed to update activity feed:", error);
      container.innerHTML = '<div class="error-message">Failed to load activity feed</div>';
    }
  }

  /**
   * Update workspace comparison
   */
  updateWorkspaceComparison(data) {
    const container = document.getElementById('workspace-comparison');
    const section = document.getElementById('workspace-comparison-section');
    
    if (!container || !section) return;
    
    // Hide section if filtering by specific workspace
    const workspaceId = document.getElementById('workspace-filter-value').value;
    if (workspaceId) {
      section.style.display = 'none';
      return;
    }
    
    section.style.display = 'block';
    
    if (!data.workspaces || data.workspaces.length === 0) {
      container.innerHTML = '<div class="no-data">No workspace data available</div>';
      return;
    }
    
    let workspaceHTML = '';
    data.workspaces.forEach(workspace => {
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
              <span class="stat-value">${workspace.completion_rate}%</span>
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
    console.log(`🏢 Workspace filter changed to: ${workspaceId || 'All'}`);
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
    document.querySelectorAll('.chart-toggle').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-chart="${chartType}"]`).classList.add('active');
    
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
      
      const workspaceId = document.getElementById('workspace-filter-value').value || null;
      const days = parseInt(document.getElementById('time-range-value').value) || 30;
      
      const data = await this.modules.analyticsManager.loadOverview(workspaceId, days);
      this.updateDashboard(data);
      
      // Show success notification
      this.showNotification('Analytics data refreshed successfully', 'success');
      
    } catch (error) {
      console.error("❌ Failed to refresh data:", error);
      this.showNotification('Failed to refresh analytics data', 'error');
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
        this.showNotification('No data to export', 'warning');
        return;
      }
      
      this.modules.analyticsManager.exportData('json');
      this.showNotification('Analytics data exported successfully', 'success');
      
    } catch (error) {
      console.error("❌ Failed to export data:", error);
      this.showNotification('Failed to export analytics data', 'error');
    }
  }

  /**
   * Setup auto-refresh
   */
  async setupAutoRefresh() {
    try {
      const preferences = await this.modules.analyticsManager.getPreferences();
      const autoRefreshEnabled = preferences.global?.auto_refresh_enabled === 'true';
      const refreshInterval = parseInt(preferences.global?.analytics_refresh_interval) || 30;
      
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
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    body.dataset.theme = newTheme;
    
    // Update theme icon
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
      themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }
    
    // Save preference
    this.modules.analyticsManager.updatePreference('theme', newTheme);
    
    console.log(`🎨 Theme switched to: ${newTheme}`);
  }

  /**
   * Show loading state
   */
  showLoading(show = true) {
    const loadingElement = document.getElementById('analytics-loading');
    const dashboardElement = document.getElementById('analytics-dashboard');
    const errorElement = document.getElementById('analytics-error');
    
    if (show) {
      if (loadingElement) loadingElement.style.display = 'flex';
      if (dashboardElement) dashboardElement.style.display = 'none';
      if (errorElement) errorElement.style.display = 'none';
    } else {
      if (loadingElement) loadingElement.style.display = 'none';
      if (dashboardElement) dashboardElement.style.display = 'block';
    }
  }

  /**
   * Show error state
   */
  showError(message) {
    const errorElement = document.getElementById('analytics-error');
    const loadingElement = document.getElementById('analytics-loading');
    const dashboardElement = document.getElementById('analytics-dashboard');
    
    if (errorElement) {
      errorElement.style.display = 'flex';
      const errorText = errorElement.querySelector('p');
      if (errorText) {
        errorText.textContent = message;
      }
    }
    
    if (loadingElement) loadingElement.style.display = 'none';
    if (dashboardElement) dashboardElement.style.display = 'none';
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    // Use existing notification system if available
    if (typeof showNotification === 'function') {
      showNotification(message, type);
    } else {
      console.log(`📢 ${type.toUpperCase()}: ${message}`);
    }
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
  // Implementation for toggling between different project view formats
};

window.loadMoreActivity = () => {
  console.log("⬇️ Loading more activity...");
  // Implementation for loading more activity items
};

window.exportWorkspaceData = () => {
  if (window.analyticsApp) {
    window.analyticsApp.exportData();
  }
};

window.initializeAnalytics = () => {
  if (window.analyticsApp) {
    window.analyticsApp.init();
  }
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  console.log("🚀 DOM loaded, initializing Analytics App...");
  
  try {
    window.analyticsApp = new AnalyticsApp();
    await window.analyticsApp.init();
  } catch (error) {
    console.error("❌ Failed to initialize Analytics App:", error);
  }
});

console.log("✅ Analytics Application script loaded successfully");
