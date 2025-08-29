console.log("📊 Loading AnalyticsDataManager module...");

class AnalyticsDataManager {
  constructor(dependencies = {}) {
    this.dependencies = dependencies;
    this.apiManager = dependencies.apiManager;
    this.currentData = null;
    this.refreshInterval = null;
    this.filters = {
      workspaceId: null,
      days: 30,
    };

    console.log("📊 AnalyticsDataManager initialized");
  }

  /**
   * Load comprehensive analytics overview
   */
  async loadOverview(workspaceId = null, days = 30) {
    try {
      console.log(
        `📊 Loading analytics overview (workspace: ${workspaceId}, days: ${days})`
      );

      let url = `php/api/analytics/overview.php?days=${days}`;
      if (workspaceId) {
        url += `&workspace_id=${workspaceId}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        this.currentData = result.data;
        this.filters = { workspaceId, days };
        console.log("✅ Analytics overview loaded successfully");
        return result.data;
      } else {
        throw new Error(result.message || "Failed to load analytics");
      }
    } catch (error) {
      console.error("❌ Error loading analytics overview:", error);
      throw error;
    }
  }

  /**
   * Load project statistics
   */
  async loadProjectStats(projectId = null, workspaceId = null, days = 30) {
    try {
      let url = `php/api/analytics/project_stats.php?days=${days}`;

      if (projectId) url += `&project_id=${projectId}`;
      if (workspaceId) url += `&workspace_id=${workspaceId}`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        console.log("✅ Project statistics loaded successfully");
        return result.data;
      } else {
        throw new Error(result.message || "Failed to load project statistics");
      }
    } catch (error) {
      console.error("❌ Error loading project statistics:", error);
      throw error;
    }
  }

  /**
   * Load activity log
   */
  async loadActivityLog(options = {}) {
    try {
      const {
        taskId = null,
        projectId = null,
        workspaceId = null,
        actionType = null,
        days = 7,
        limit = 50,
      } = options;

      let url = `php/api/analytics/activity_log.php?days=${days}&limit=${limit}`;

      if (taskId) url += `&task_id=${taskId}`;
      if (projectId) url += `&project_id=${projectId}`;
      if (workspaceId) url += `&workspace_id=${workspaceId}`;
      if (actionType) url += `&action_type=${actionType}`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        console.log("✅ Activity log loaded successfully");
        return result.data;
      } else {
        throw new Error(result.message || "Failed to load activity log");
      }
    } catch (error) {
      console.error("❌ Error loading activity log:", error);
      throw error;
    }
  }

  /**
   * Get user preferences
   */
  async getPreferences(workspaceId = null) {
    try {
      let url = "php/api/preferences/get_preferences.php";
      if (workspaceId) {
        url += `?workspace_id=${workspaceId}`;
      }

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        console.log("✅ Preferences loaded successfully");
        return result.data;
      } else {
        throw new Error(result.message || "Failed to load preferences");
      }
    } catch (error) {
      console.error("❌ Error loading preferences:", error);
      throw error;
    }
  }

  /**
   * Update user preference
   */
  async updatePreference(key, value, workspaceId = null) {
    try {
      const requestData = {
        preference_key: key,
        preference_value: value,
      };

      if (workspaceId) {
        requestData.workspace_id = workspaceId;
      }

      const response = await fetch(
        "php/api/preferences/update_preferences.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      const result = await response.json();

      if (result.success) {
        console.log(`✅ Preference ${key} updated successfully`);
        return result.data;
      } else {
        throw new Error(result.message || "Failed to update preference");
      }
    } catch (error) {
      console.error("❌ Error updating preference:", error);
      throw error;
    }
  }

  /**
   * Generate overview statistics cards
   */
  generateOverviewStats(data) {
    const overall = data.overall || {};

    return [
      {
        title: "Total Tasks",
        value: overall.total_tasks || 0,
        icon: "📝",
        color: "#3498db",
        trend: this.calculateTrend("total_tasks", overall.total_tasks),
      },
      {
        title: "Completed Tasks",
        value: overall.completed_tasks || 0,
        icon: "✅",
        color: "#27ae60",
        trend: this.calculateTrend("completed_tasks", overall.completed_tasks),
      },
      {
        title: "Completion Rate",
        value: `${(overall.completion_rate || 0).toFixed(0)}%`,
        icon: "📊",
        color: "#9b59b6",
        trend: this.calculateTrend("completion_rate", overall.completion_rate),
      },
      {
        title: "In Progress",
        value: overall.in_progress_tasks || 0,
        icon: "⚡",
        color: "#f39c12",
        trend: this.calculateTrend(
          "in_progress_tasks",
          overall.in_progress_tasks
        ),
      },
      {
        title: "Overdue Tasks",
        value: overall.overdue_tasks || 0,
        icon: "🚨",
        color: "#e74c3c",
        trend: this.calculateTrend("overdue_tasks", overall.overdue_tasks),
      },
      {
        title: "Active Projects",
        value: overall.total_projects || 0,
        icon: "🗂️",
        color: "#1abc9c",
        trend: this.calculateTrend("total_projects", overall.total_projects),
      },
    ];
  }

  /**
   * Calculate trend for metrics (placeholder for now)
   */
  calculateTrend(metric, currentValue) {
    // This would compare with previous period data
    // For now, return neutral trend
    return {
      direction: "neutral",
      percentage: 0,
      isPositive: true,
    };
  }

  /**
   * Format activity data for display
   */
  formatActivityData(activities) {
    return activities.map((activity) => {
      const timeAgo = this.getTimeAgo(activity.created_at);
      const actionText = this.getActionText(activity.action_type, activity);

      return {
        ...activity,
        timeAgo,
        actionText,
        icon: this.getActionIcon(activity.action_type),
      };
    });
  }

  /**
   * Get human-readable action text
   */
  getActionText(actionType, activity) {
    const taskTitle = activity.task?.title || "Unknown Task";
    const projectName = activity.project?.name || "Unknown Project";

    switch (actionType) {
      case "created":
        return `Created task "${taskTitle}" in ${projectName}`;
      case "status_changed":
        return `Changed "${taskTitle}" status to ${activity.new_value}`;
      case "priority_changed":
        return `Changed "${taskTitle}" priority to ${activity.new_value}`;
      case "updated":
        return `Updated task "${taskTitle}"`;
      case "deleted":
        return `Deleted task "${taskTitle}"`;
      case "moved":
        return `Moved task "${taskTitle}"`;
      default:
        return `${actionType} on "${taskTitle}"`;
    }
  }

  /**
   * Get icon for action type
   */
  getActionIcon(actionType) {
    const icons = {
      created: "➕",
      status_changed: "🔄",
      priority_changed: "⚡",
      updated: "✏️",
      deleted: "🗑️",
      moved: "↔️",
    };
    return icons[actionType] || "📝";
  }

  /**
   * Get time ago string
   */
  getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString();
  }

  /**
   * Export analytics data
   * @param {string} format - Export format ('json', 'csv', 'pdf')
   */
  async exportData(format = "json") {
    try {
      console.log(`📊 Exporting analytics data in ${format} format...`);

      if (!this.currentData) {
        throw new Error("No data available for export");
      }

      const exportData = {
        exportDate: new Date().toISOString(),
        filters: this.filters,
        data: this.currentData,
      };

      switch (format.toLowerCase()) {
        case "json":
          return this.exportAsJSON(exportData);
        case "csv":
          return this.exportAsCSV(exportData);
        case "pdf":
          return this.exportAsPDF(exportData);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error("❌ Error exporting data:", error);
      throw error;
    }
  }

  /**
   * Export data as JSON
   */
  exportAsJSON(data) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `analytics-export-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log("✅ JSON export completed");
  }

  /**
   * Export data as CSV
   */
  exportAsCSV(data) {
    const csvContent = this.convertToCSV(data);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `analytics-export-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log("✅ CSV export completed");
  }

  /**
   * Export data as PDF
   */
  async exportAsPDF(data) {
    try {
      // For now, we'll create a simple HTML report and use browser print
      const reportHTML = this.generatePDFReport(data);
      const printWindow = window.open("", "_blank");
      printWindow.document.write(reportHTML);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();

      console.log("✅ PDF export completed");
    } catch (error) {
      console.error("❌ Error generating PDF:", error);
      throw error;
    }
  }

  /**
   * Convert data to CSV format
   */
  convertToCSV(data) {
    const lines = [];

    // Add header
    lines.push("Metric,Value,Change");

    // Add overview metrics
    if (data.data.overview) {
      const overview = data.data.overview;
      lines.push(`Total Tasks,${overview.total_tasks || 0},`);
      lines.push(`Completed Tasks,${overview.completed_tasks || 0},`);
      lines.push(`Active Tasks,${overview.active_tasks || 0},`);
      lines.push(`Total Projects,${overview.total_projects || 0},`);
      lines.push(`Completed Projects,${overview.completed_projects || 0},`);
      lines.push(`Active Projects,${overview.active_projects || 0},`);
    }

    // Add project breakdown
    if (data.data.projects) {
      lines.push("");
      lines.push("Project,Total Tasks,Completed Tasks,Progress %");
      data.data.projects.forEach((project) => {
        const progress =
          project.task_count > 0
            ? Math.round((project.done_count / project.task_count) * 100)
            : 0;
        lines.push(
          `${project.name},${project.task_count || 0},${
            project.done_count || 0
          },${progress}%`
        );
      });
    }

    return lines.join("\n");
  }

  /**
   * Generate PDF report HTML
   */
  generatePDFReport(data) {
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Analytics Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .section { margin-bottom: 25px; }
          .metric { display: flex; justify-content: space-between; margin: 5px 0; }
          .project-row { display: flex; justify-content: space-between; margin: 5px 0; padding: 5px; background: #f5f5f5; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Analytics Report</h1>
          <p>Generated on ${date} at ${time}</p>
        </div>
        
        <div class="section">
          <h2>Overview</h2>
          ${
            data.data.overview
              ? `
            <div class="metric"><strong>Total Tasks:</strong> ${
              data.data.overview.total_tasks || 0
            }</div>
            <div class="metric"><strong>Completed Tasks:</strong> ${
              data.data.overview.completed_tasks || 0
            }</div>
            <div class="metric"><strong>Active Tasks:</strong> ${
              data.data.overview.active_tasks || 0
            }</div>
            <div class="metric"><strong>Total Projects:</strong> ${
              data.data.overview.total_projects || 0
            }</div>
            <div class="metric"><strong>Completed Projects:</strong> ${
              data.data.overview.completed_projects || 0
            }</div>
            <div class="metric"><strong>Active Projects:</strong> ${
              data.data.overview.active_projects || 0
            }</div>
          `
              : "<p>No overview data available</p>"
          }
        </div>
        
        ${
          data.data.projects && data.data.projects.length > 0
            ? `
        <div class="section">
          <h2>Project Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Total Tasks</th>
                <th>Completed Tasks</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              ${data.data.projects
                .map((project) => {
                  const progress =
                    project.task_count > 0
                      ? Math.round(
                          (project.done_count / project.task_count) * 100
                        )
                      : 0;
                  return `
                  <tr>
                    <td>${project.name}</td>
                    <td>${project.task_count || 0}</td>
                    <td>${project.done_count || 0}</td>
                    <td>${progress}%</td>
                  </tr>
                `;
                })
                .join("")}
            </tbody>
          </table>
        </div>
        `
            : ""
        }
      </body>
      </html>
    `;
  }
}

// Make AnalyticsDataManager available globally
window.AnalyticsDataManager = AnalyticsDataManager;

console.log("✅ AnalyticsDataManager module loaded successfully");
