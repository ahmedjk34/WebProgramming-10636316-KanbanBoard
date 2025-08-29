/**
 * Team Analytics Manager Module
 * Handles team analytics, performance metrics, and data visualization
 * for comprehensive team collaboration insights
 */

console.log("📦 Loading TeamAnalyticsManager module...");

class TeamAnalyticsManager {
  constructor(dependencies = {}) {
    this.currentTeamId = null;
    this.analyticsData = {
      teamStats: null,
      memberPerformance: null,
      projectMetrics: null,
      activityTimeline: null,
      productivityHeatmap: null,
    };

    // Store dependencies
    this.dependencies = dependencies;
    this.apiManager = dependencies.apiManager;
    this.teamManager = dependencies.teamManager;
    this.uiManager = dependencies.uiManager;

    // Chart instances
    this.charts = new Map();

    console.log(
      "🔧 TeamAnalyticsManager initialized with dependencies:",
      Object.keys(dependencies)
    );
  }

  // ===== INITIALIZATION =====

  /**
   * Initialize the team analytics manager
   */
  async init() {
    console.log("🚀 Initializing TeamAnalyticsManager...");

    try {
      // Setup event listeners
      this.setupEventListeners();

      // Initialize charts
      this.initializeCharts();

      console.log("✅ TeamAnalyticsManager initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize TeamAnalyticsManager:", error);
    }
  }

  // ===== TEAM ANALYTICS =====

  /**
   * Load comprehensive team analytics
   * @param {number} teamId - Team ID
   * @param {Object} options - Analytics options
   */
  async loadTeamAnalytics(teamId, options = {}) {
    console.log("📊 Loading team analytics for team:", teamId);

    this.currentTeamId = teamId;
    const {
      days = 30,
      includeMembers = true,
      includeProjects = true,
    } = options;

    try {
      // Load all analytics data in parallel
      const [
        teamStats,
        memberPerformance,
        projectMetrics,
        activityTimeline,
        productivityHeatmap,
      ] = await Promise.all([
        this.getTeamStats(teamId, days),
        includeMembers ? this.getMemberPerformance(teamId, days) : null,
        includeProjects ? this.getProjectMetrics(teamId, days) : null,
        this.getActivityTimeline(teamId, days),
        this.getProductivityHeatmap(teamId, days),
      ]);

      // Store analytics data
      this.analyticsData = {
        teamStats,
        memberPerformance,
        projectMetrics,
        activityTimeline,
        productivityHeatmap,
      };

      // Update UI with analytics data
      this.updateAnalyticsUI();

      console.log("✅ Team analytics loaded successfully");
      return this.analyticsData;
    } catch (error) {
      console.error("❌ Error loading team analytics:", error);
      throw error;
    }
  }

  /**
   * Get team statistics
   * @param {number} teamId - Team ID
   * @param {number} days - Number of days to analyze
   * @returns {Object} Team statistics
   */
  async getTeamStats(teamId, days = 30) {
    if (!this.apiManager) {
      // Return mock data for now
      return this.getMockTeamStats();
    }

    try {
      const response = await this.apiManager.getTeamStats(teamId, days);
      return response.success ? response.data : this.getMockTeamStats();
    } catch (error) {
      console.error("❌ Error getting team stats:", error);
      return this.getMockTeamStats();
    }
  }

  /**
   * Get member performance metrics
   * @param {number} teamId - Team ID
   * @param {number} days - Number of days to analyze
   * @returns {Object} Member performance data
   */
  async getMemberPerformance(teamId, days = 30) {
    if (!this.apiManager) {
      // Return mock data for now
      return this.getMockMemberPerformance();
    }

    try {
      const response = await this.apiManager.getMemberPerformance(teamId, days);
      return response.success ? response.data : this.getMockMemberPerformance();
    } catch (error) {
      console.error("❌ Error getting member performance:", error);
      return this.getMockMemberPerformance();
    }
  }

  /**
   * Get project metrics
   * @param {number} teamId - Team ID
   * @param {number} days - Number of days to analyze
   * @returns {Object} Project metrics data
   */
  async getProjectMetrics(teamId, days = 30) {
    if (!this.apiManager) {
      // Return mock data for now
      return this.getMockProjectMetrics();
    }

    try {
      const response = await this.apiManager.getProjectMetrics(teamId, days);
      return response.success ? response.data : this.getMockProjectMetrics();
    } catch (error) {
      console.error("❌ Error getting project metrics:", error);
      return this.getMockProjectMetrics();
    }
  }

  /**
   * Get activity timeline
   * @param {number} teamId - Team ID
   * @param {number} days - Number of days to analyze
   * @returns {Object} Activity timeline data
   */
  async getActivityTimeline(teamId, days = 30) {
    if (!this.apiManager) {
      // Return mock data for now
      return this.getMockActivityTimeline();
    }

    try {
      const response = await this.apiManager.getActivityTimeline(teamId, days);
      return response.success ? response.data : this.getMockActivityTimeline();
    } catch (error) {
      console.error("❌ Error getting activity timeline:", error);
      return this.getMockActivityTimeline();
    }
  }

  /**
   * Get productivity heatmap
   * @param {number} teamId - Team ID
   * @param {number} days - Number of days to analyze
   * @returns {Object} Productivity heatmap data
   */
  async getProductivityHeatmap(teamId, days = 30) {
    if (!this.apiManager) {
      // Return mock data for now
      return this.getMockProductivityHeatmap();
    }

    try {
      const response = await this.apiManager.getProductivityHeatmap(
        teamId,
        days
      );
      return response.success
        ? response.data
        : this.getMockProductivityHeatmap();
    } catch (error) {
      console.error("❌ Error getting productivity heatmap:", error);
      return this.getMockProductivityHeatmap();
    }
  }

  // ===== MOCK DATA GENERATION =====

  /**
   * Get mock team statistics
   * @returns {Object} Mock team stats
   */
  getMockTeamStats() {
    return {
      total_tasks: 156,
      completed_tasks: 134,
      completion_rate: 85.9,
      overdue_tasks: 8,
      total_projects: 12,
      active_members: 8,
      total_workspaces: 4,
      average_task_completion_time: 2.3, // days
      productivity_score: 87.5,
      team_velocity: 15.2, // tasks per week
      burndown_rate: 0.78,
      sprint_completion_rate: 92.3,
      code_review_time: 1.2, // hours
      meeting_efficiency: 85.0,
      collaboration_score: 91.2,
    };
  }

  /**
   * Get mock member performance data
   * @returns {Object} Mock member performance
   */
  getMockMemberPerformance() {
    return {
      members: [
        {
          id: 1,
          name: "John Doe",
          role: "Team Lead",
          avatar: "JD",
          tasks_completed: 45,
          tasks_assigned: 52,
          completion_rate: 86.5,
          average_completion_time: 1.8,
          productivity_score: 92.3,
          collaboration_score: 88.7,
          code_reviews: 23,
          meetings_attended: 15,
          last_active: "2025-01-14T10:30:00Z",
        },
        {
          id: 2,
          name: "Jane Smith",
          role: "Developer",
          avatar: "JS",
          tasks_completed: 38,
          tasks_assigned: 42,
          completion_rate: 90.5,
          average_completion_time: 2.1,
          productivity_score: 89.1,
          collaboration_score: 85.4,
          code_reviews: 18,
          meetings_attended: 12,
          last_active: "2025-01-14T09:15:00Z",
        },
        {
          id: 3,
          name: "Mike Johnson",
          role: "Designer",
          avatar: "MJ",
          tasks_completed: 32,
          tasks_assigned: 35,
          completion_rate: 91.4,
          average_completion_time: 2.5,
          productivity_score: 87.6,
          collaboration_score: 92.1,
          code_reviews: 5,
          meetings_attended: 14,
          last_active: "2025-01-14T11:45:00Z",
        },
        {
          id: 4,
          name: "Sarah Wilson",
          role: "QA Engineer",
          avatar: "SW",
          tasks_completed: 28,
          tasks_assigned: 30,
          completion_rate: 93.3,
          average_completion_time: 1.9,
          productivity_score: 94.2,
          collaboration_score: 89.8,
          code_reviews: 12,
          meetings_attended: 13,
          last_active: "2025-01-14T08:30:00Z",
        },
      ],
      summary: {
        total_members: 4,
        average_completion_rate: 90.4,
        average_productivity: 90.8,
        average_collaboration: 89.0,
        most_productive_member: "Sarah Wilson",
        most_collaborative_member: "Mike Johnson",
      },
    };
  }

  /**
   * Get mock project metrics data
   * @returns {Object} Mock project metrics
   */
  getMockProjectMetrics() {
    return {
      projects: [
        {
          id: 1,
          name: "Frontend Redesign",
          status: "in_progress",
          progress: 75.0,
          tasks_total: 45,
          tasks_completed: 34,
          tasks_in_progress: 8,
          tasks_overdue: 3,
          team_members: 6,
          start_date: "2025-01-01",
          estimated_completion: "2025-01-25",
          actual_completion: null,
          velocity: 12.5,
          burndown_rate: 0.82,
        },
        {
          id: 2,
          name: "API Integration",
          status: "completed",
          progress: 100.0,
          tasks_total: 28,
          tasks_completed: 28,
          tasks_in_progress: 0,
          tasks_overdue: 0,
          team_members: 4,
          start_date: "2024-12-15",
          estimated_completion: "2025-01-10",
          actual_completion: "2025-01-08",
          velocity: 15.2,
          burndown_rate: 1.0,
        },
        {
          id: 3,
          name: "Database Optimization",
          status: "planning",
          progress: 15.0,
          tasks_total: 32,
          tasks_completed: 5,
          tasks_in_progress: 3,
          tasks_overdue: 0,
          team_members: 3,
          start_date: "2025-01-10",
          estimated_completion: "2025-02-15",
          actual_completion: null,
          velocity: 8.3,
          burndown_rate: 0.45,
        },
      ],
      summary: {
        total_projects: 3,
        completed_projects: 1,
        in_progress_projects: 1,
        planning_projects: 1,
        average_progress: 63.3,
        average_velocity: 12.0,
        on_schedule_projects: 2,
        delayed_projects: 1,
      },
    };
  }

  /**
   * Get mock activity timeline data
   * @returns {Object} Mock activity timeline
   */
  getMockActivityTimeline() {
    const days = 30;
    const timeline = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      timeline.push({
        date: date.toISOString().split("T")[0],
        tasks_created: Math.floor(Math.random() * 8) + 2,
        tasks_completed: Math.floor(Math.random() * 10) + 3,
        tasks_updated: Math.floor(Math.random() * 15) + 5,
        members_active: Math.floor(Math.random() * 4) + 4,
        meetings_held: Math.floor(Math.random() * 2) + 0,
        code_reviews: Math.floor(Math.random() * 5) + 1,
      });
    }

    return {
      timeline,
      summary: {
        total_tasks_created: timeline.reduce(
          (sum, day) => sum + day.tasks_created,
          0
        ),
        total_tasks_completed: timeline.reduce(
          (sum, day) => sum + day.tasks_completed,
          0
        ),
        average_daily_activity:
          timeline.reduce((sum, day) => sum + day.tasks_updated, 0) / days,
        most_active_day: timeline.reduce((max, day) =>
          day.tasks_completed > max.tasks_completed ? day : max
        ),
        least_active_day: timeline.reduce((min, day) =>
          day.tasks_completed < min.tasks_completed ? day : min
        ),
      },
    };
  }

  /**
   * Get mock productivity heatmap data
   * @returns {Object} Mock productivity heatmap
   */
  getMockProductivityHeatmap() {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const hours = ["6AM", "9AM", "12PM", "3PM", "6PM", "9PM"];
    const heatmap = [];

    for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
      const dayData = [];
      for (let hourIndex = 0; hourIndex < hours.length; hourIndex++) {
        // Generate realistic productivity data
        let value = 0;
        if (dayIndex < 5) {
          // Weekdays
          if (hourIndex >= 1 && hourIndex <= 3) {
            // 9AM - 3PM
            value = Math.floor(Math.random() * 40) + 60; // High productivity
          } else if (hourIndex === 0 || hourIndex === 4) {
            // 6AM, 6PM
            value = Math.floor(Math.random() * 30) + 20; // Medium productivity
          } else {
            // 9PM
            value = Math.floor(Math.random() * 20) + 5; // Low productivity
          }
        } else {
          // Weekends
          value = Math.floor(Math.random() * 30) + 10; // Lower productivity
        }

        dayData.push({
          day: days[dayIndex],
          hour: hours[hourIndex],
          value: value,
          intensity: this.getIntensityClass(value),
        });
      }
      heatmap.push(dayData);
    }

    return {
      heatmap,
      summary: {
        most_productive_day: "Wednesday",
        most_productive_hour: "12PM",
        average_productivity:
          heatmap.flat().reduce((sum, cell) => sum + cell.value, 0) /
          heatmap.flat().length,
        peak_hours: ["9AM", "12PM", "3PM"],
        low_hours: ["6AM", "9PM"],
      },
    };
  }

  /**
   * Get intensity class for heatmap
   * @param {number} value - Productivity value
   * @returns {string} Intensity class
   */
  getIntensityClass(value) {
    if (value >= 80) return "very-high";
    if (value >= 60) return "high";
    if (value >= 40) return "medium";
    if (value >= 20) return "low";
    return "very-low";
  }

  // ===== UI UPDATES =====

  /**
   * Update analytics UI with loaded data
   */
  updateAnalyticsUI() {
    this.updateTeamStatsCards();
    this.updateMemberPerformanceChart();
    this.updateProjectMetricsChart();
    this.updateActivityTimelineChart();
    this.updateProductivityHeatmap();
  }

  /**
   * Update team statistics cards
   */
  updateTeamStatsCards() {
    const stats = this.analyticsData.teamStats;
    if (!stats) return;

    // Update statistics cards
    this.updateStatCard("total-tasks", stats.total_tasks, "Total Tasks");
    this.updateStatCard(
      "completed-tasks",
      stats.completed_tasks,
      "Completed Tasks"
    );
    this.updateStatCard(
      "completion-rate",
      `${(stats.completion_rate || 0).toFixed(0)}%`,
      "Completion Rate"
    );
    this.updateStatCard(
      "productivity-score",
      `${(stats.productivity_score || 0).toFixed(0)}%`,
      "Productivity Score"
    );
    this.updateStatCard("team-velocity", stats.team_velocity, "Team Velocity");
    this.updateStatCard(
      "collaboration-score",
      `${(stats.collaboration_score || 0).toFixed(0)}%`,
      "Collaboration Score"
    );
  }

  /**
   * Update a single statistics card
   * @param {string} cardId - Card element ID
   * @param {string|number} value - Card value
   * @param {string} label - Card label
   */
  updateStatCard(cardId, value, label) {
    const card = document.getElementById(cardId);
    if (!card) return;

    const valueElement = card.querySelector(".stat-value");
    const labelElement = card.querySelector(".stat-label");

    if (valueElement) {
      valueElement.textContent = value;
    }
    if (labelElement) {
      labelElement.textContent = label;
    }
  }

  /**
   * Update member performance chart
   */
  updateMemberPerformanceChart() {
    const performance = this.analyticsData.memberPerformance;
    if (!performance || !performance.members) return;

    const chartContainer = document.getElementById("member-performance-chart");
    if (!chartContainer) return;

    // Create chart data
    const chartData = {
      labels: performance.members.map((member) => member.name),
      datasets: [
        {
          label: "Completion Rate (%)",
          data: performance.members.map((member) => member.completion_rate),
          backgroundColor: "rgba(102, 126, 234, 0.8)",
          borderColor: "rgba(102, 126, 234, 1)",
          borderWidth: 2,
        },
        {
          label: "Productivity Score (%)",
          data: performance.members.map((member) => member.productivity_score),
          backgroundColor: "rgba(118, 75, 162, 0.8)",
          borderColor: "rgba(118, 75, 162, 1)",
          borderWidth: 2,
        },
      ],
    };

    // Create or update chart
    this.createOrUpdateChart(
      "member-performance",
      chartContainer,
      "bar",
      chartData
    );
  }

  /**
   * Update project metrics chart
   */
  updateProjectMetricsChart() {
    const metrics = this.analyticsData.projectMetrics;
    if (!metrics || !metrics.projects) return;

    const chartContainer = document.getElementById("project-metrics-chart");
    if (!chartContainer) return;

    // Create chart data
    const chartData = {
      labels: metrics.projects.map((project) => project.name),
      datasets: [
        {
          label: "Progress (%)",
          data: metrics.projects.map((project) => project.progress),
          backgroundColor: "rgba(46, 204, 113, 0.8)",
          borderColor: "rgba(46, 204, 113, 1)",
          borderWidth: 2,
        },
        {
          label: "Velocity",
          data: metrics.projects.map((project) => project.velocity),
          backgroundColor: "rgba(241, 196, 15, 0.8)",
          borderColor: "rgba(241, 196, 15, 1)",
          borderWidth: 2,
        },
      ],
    };

    // Create or update chart
    this.createOrUpdateChart(
      "project-metrics",
      chartContainer,
      "bar",
      chartData
    );
  }

  /**
   * Update activity timeline chart
   */
  updateActivityTimelineChart() {
    const timeline = this.analyticsData.activityTimeline;
    if (!timeline || !timeline.timeline) return;

    const chartContainer = document.getElementById("activity-timeline-chart");
    if (!chartContainer) return;

    // Create chart data
    const chartData = {
      labels: timeline.timeline.map((day) => day.date),
      datasets: [
        {
          label: "Tasks Created",
          data: timeline.timeline.map((day) => day.tasks_created),
          backgroundColor: "rgba(52, 152, 219, 0.2)",
          borderColor: "rgba(52, 152, 219, 1)",
          borderWidth: 2,
          fill: false,
        },
        {
          label: "Tasks Completed",
          data: timeline.timeline.map((day) => day.tasks_completed),
          backgroundColor: "rgba(46, 204, 113, 0.2)",
          borderColor: "rgba(46, 204, 113, 1)",
          borderWidth: 2,
          fill: false,
        },
      ],
    };

    // Create or update chart
    this.createOrUpdateChart(
      "activity-timeline",
      chartContainer,
      "line",
      chartData
    );
  }

  /**
   * Update productivity heatmap
   */
  updateProductivityHeatmap() {
    const heatmap = this.analyticsData.productivityHeatmap;
    if (!heatmap || !heatmap.heatmap) return;

    const heatmapContainer = document.getElementById("productivity-heatmap");
    if (!heatmapContainer) return;

    // Create heatmap HTML
    const heatmapHTML = this.createHeatmapHTML(heatmap.heatmap);
    heatmapContainer.innerHTML = heatmapHTML;
  }

  /**
   * Create heatmap HTML
   * @param {Array} heatmapData - Heatmap data
   * @returns {string} Heatmap HTML
   */
  createHeatmapHTML(heatmapData) {
    let html = '<div class="heatmap-container">';

    // Header row with hours
    html += '<div class="heatmap-header">';
    html += '<div class="heatmap-cell header"></div>';
    heatmapData[0].forEach((cell) => {
      html += `<div class="heatmap-cell header">${cell.hour}</div>`;
    });
    html += "</div>";

    // Data rows
    heatmapData.forEach((dayRow) => {
      html += '<div class="heatmap-row">';
      html += `<div class="heatmap-cell day-label">${dayRow[0].day}</div>`;
      dayRow.forEach((cell) => {
        html += `<div class="heatmap-cell intensity-${cell.intensity}" title="${cell.day} ${cell.hour}: ${cell.value}% productivity">${cell.value}</div>`;
      });
      html += "</div>";
    });

    html += "</div>";
    return html;
  }

  // ===== CHART MANAGEMENT =====

  /**
   * Initialize charts
   */
  initializeCharts() {
    // Initialize Chart.js if available
    if (typeof Chart !== "undefined") {
      console.log("📊 Chart.js available, initializing charts");
    } else {
      console.warn("⚠️ Chart.js not available, using fallback charts");
    }
  }

  /**
   * Create or update chart
   * @param {string} chartId - Chart ID
   * @param {HTMLElement} container - Chart container
   * @param {string} type - Chart type
   * @param {Object} data - Chart data
   */
  createOrUpdateChart(chartId, container, type, data) {
    if (typeof Chart === "undefined") {
      // Fallback: create simple HTML chart
      this.createFallbackChart(container, type, data);
      return;
    }

    // Destroy existing chart if it exists
    if (this.charts.has(chartId)) {
      this.charts.get(chartId).destroy();
    }

    // Create new chart
    const ctx =
      container.querySelector("canvas") || document.createElement("canvas");
    if (!container.querySelector("canvas")) {
      container.appendChild(ctx);
    }

    const chart = new Chart(ctx, {
      type: type,
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
          },
          title: {
            display: true,
            text: this.getChartTitle(chartId),
          },
        },
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    });

    this.charts.set(chartId, chart);
  }

  /**
   * Create fallback chart (HTML/CSS)
   * @param {HTMLElement} container - Chart container
   * @param {string} type - Chart type
   * @param {Object} data - Chart data
   */
  createFallbackChart(container, type, data) {
    let html = '<div class="fallback-chart">';

    if (type === "bar") {
      html += this.createFallbackBarChart(data);
    } else if (type === "line") {
      html += this.createFallbackLineChart(data);
    }

    html += "</div>";
    container.innerHTML = html;
  }

  /**
   * Create fallback bar chart
   * @param {Object} data - Chart data
   * @returns {string} Bar chart HTML
   */
  createFallbackBarChart(data) {
    let html = '<div class="fallback-bar-chart">';

    data.labels.forEach((label, index) => {
      const value1 = data.datasets[0].data[index];
      const value2 = data.datasets[1] ? data.datasets[1].data[index] : 0;

      html += `
        <div class="bar-group">
          <div class="bar-label">${label}</div>
          <div class="bar-container">
            <div class="bar bar-1" style="height: ${value1}%; background-color: ${
        data.datasets[0].backgroundColor
      }"></div>
            ${
              data.datasets[1]
                ? `<div class="bar bar-2" style="height: ${value2}%; background-color: ${data.datasets[1].backgroundColor}"></div>`
                : ""
            }
          </div>
          <div class="bar-values">
            <span>${value1}%</span>
            ${data.datasets[1] ? `<span>${value2}%</span>` : ""}
          </div>
        </div>
      `;
    });

    html += "</div>";
    return html;
  }

  /**
   * Create fallback line chart
   * @param {Object} data - Chart data
   * @returns {string} Line chart HTML
   */
  createFallbackLineChart(data) {
    let html = '<div class="fallback-line-chart">';

    // Create simple line representation
    data.labels.forEach((label, index) => {
      const value1 = data.datasets[0].data[index];
      const value2 = data.datasets[1].data[index];

      html += `
        <div class="line-point">
          <div class="point-label">${label}</div>
          <div class="point-value">${value1} / ${value2}</div>
        </div>
      `;
    });

    html += "</div>";
    return html;
  }

  /**
   * Get chart title
   * @param {string} chartId - Chart ID
   * @returns {string} Chart title
   */
  getChartTitle(chartId) {
    const titles = {
      "member-performance": "Team Member Performance",
      "project-metrics": "Project Progress & Velocity",
      "activity-timeline": "Team Activity Timeline",
    };
    return titles[chartId] || "Chart";
  }

  // ===== EVENT HANDLERS =====

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for team changes
    document.addEventListener("teamChanged", (event) => {
      this.loadTeamAnalytics(event.detail.teamId);
    });

    // Listen for analytics refresh requests
    document.addEventListener("refreshAnalytics", () => {
      if (this.currentTeamId) {
        this.loadTeamAnalytics(this.currentTeamId);
      }
    });
  }

  // ===== UTILITY METHODS =====

  /**
   * Export analytics data
   * @param {string} format - Export format (json, csv, pdf)
   */
  exportAnalytics(format = "json") {
    const data = {
      teamId: this.currentTeamId,
      timestamp: new Date().toISOString(),
      analytics: this.analyticsData,
    };

    switch (format) {
      case "json":
        this.downloadJSON(data, `team-analytics-${this.currentTeamId}.json`);
        break;
      case "csv":
        this.downloadCSV(data, `team-analytics-${this.currentTeamId}.csv`);
        break;
      case "pdf":
        this.downloadPDF(data, `team-analytics-${this.currentTeamId}.pdf`);
        break;
      default:
        console.warn("⚠️ Unsupported export format:", format);
    }
  }

  /**
   * Download JSON file
   * @param {Object} data - Data to export
   * @param {string} filename - Filename
   */
  downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Download CSV file
   * @param {Object} data - Data to export
   * @param {string} filename - Filename
   */
  downloadCSV(data, filename) {
    // Simple CSV export for member performance
    if (data.analytics.memberPerformance) {
      const members = data.analytics.memberPerformance.members;
      let csv =
        "Name,Role,Tasks Completed,Completion Rate,Productivity Score\n";

      members.forEach((member) => {
        csv += `${member.name},${member.role},${member.tasks_completed},${member.completion_rate}%,${member.productivity_score}%\n`;
      });

      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Download PDF file
   * @param {Object} data - Data to export
   * @param {string} filename - Filename
   */
  downloadPDF(data, filename) {
    // For now, just show a message
    console.log("📄 PDF export not implemented yet");
    alert("PDF export feature coming soon!");
  }

  // ===== CLEANUP =====

  /**
   * Cleanup resources
   */
  destroy() {
    // Destroy all charts
    this.charts.forEach((chart) => {
      if (chart && typeof chart.destroy === "function") {
        chart.destroy();
      }
    });
    this.charts.clear();

    // Clear analytics data
    this.analyticsData = {
      teamStats: null,
      memberPerformance: null,
      projectMetrics: null,
      activityTimeline: null,
      productivityHeatmap: null,
    };

    console.log("🧹 TeamAnalyticsManager destroyed");
  }
}

// Export for use in other modules
window.TeamAnalyticsManager = TeamAnalyticsManager;

// Also make it globally available immediately
if (typeof TeamAnalyticsManager !== "undefined") {
  console.log("✅ TeamAnalyticsManager loaded successfully");
}
