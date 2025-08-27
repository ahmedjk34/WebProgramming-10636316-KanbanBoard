console.log("📦 Loading APIManager module...");

class APIManager {
  constructor(dependencies = {}) {
    this.baseUrl = "";
    this.currentWorkspaceId =
      parseInt(localStorage.getItem("currentWorkspaceId")) || 1;

    this.dependencies = dependencies;

    console.log(
      "🔧 APIManager initialized with dependencies:",
      Object.keys(dependencies)
    );
  }

  async safeJsonParse(response) {
    try {
      const text = await response.text();

      if (
        text.trim().startsWith("<") ||
        text.includes("<html>") ||
        text.includes("<!DOCTYPE")
      ) {
        console.error(
          "❌ PHP returned HTML instead of JSON:",
          text.substring(0, 200) + "..."
        );
        return {
          success: false,
          message:
            "Server returned an error page instead of JSON. Check server logs.",
          error_type: "html_response",
        };
      }
      return JSON.parse(text);
    } catch (error) {
      console.error("❌ Failed to parse response as JSON:", error);
      return {
        success: false,
        message: "Invalid JSON response from server",
        error_type: "json_parse_error",
      };
    }
  }

  /**
   * Centralized API request method to eliminate code duplication
   * @param {string} endpoint - API endpoint URL
   * @param {Object} options - Fetch options (method, headers, body, etc.)
   * @param {string} operationName - Name of the operation for error logging
   * @returns {Promise<Object>} API response
   */
  async makeAPIRequest(endpoint, options = {}, operationName = "API request") {
    try {
      const response = await fetch(endpoint, options);
      const result = await this.safeJsonParse(response);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error(`❌ Error in ${operationName}:`, error);
      throw error;
    }
  }

  // ===== WORKSPACE API CALLS =====

  async loadWorkspaces() {
    return this.makeAPIRequest(
      "php/api/workspaces/get_workspaces.php",
      {},
      "loading workspaces"
    );
  }

  async createWorkspace(workspaceData) {
    return this.makeAPIRequest(
      "php/api/workspaces/create_workspace.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workspaceData),
      },
      "creating workspace"
    );
  }

  // ===== PROJECT API CALLS =====

  async loadProjects() {
    return this.makeAPIRequest(
      `php/api/projects/get_projects.php?workspace_id=${this.currentWorkspaceId}`,
      {},
      "loading projects"
    );
  }

  async createProject(projectData) {
    projectData.workspace_id = this.currentWorkspaceId;

    return this.makeAPIRequest(
      "php/api/projects/create_project.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      },
      "creating project"
    );
  }

  async updateProject(projectId, projectData) {
    return this.makeAPIRequest(
      "php/api/projects/update_project.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: projectId,
          ...projectData,
        }),
      },
      "updating project"
    );
  }

  /**
   * Delete project
   * @param {number} projectId - Project ID
   * @returns {Promise<Object>} API response
   */
  async deleteProject(projectId) {
    return this.makeAPIRequest(
      "php/api/projects/delete_project.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: projectId }),
      },
      "deleting project"
    );
  }

  // ===== TASK API CALLS =====

  /**
   * Load tasks for current workspace
   * @returns {Promise<Object>} API response
   */
  async loadTasks() {
    return this.makeAPIRequest(
      `php/api/tasks/get_tasks.php?workspace_id=${this.currentWorkspaceId}`,
      {},
      "loading tasks"
    );
  }

  /**
   * Create new task
   * @param {Object} taskData - Task data
   * @returns {Promise<Object>} API response
   */
  async createTask(taskData) {
    return this.makeAPIRequest(
      "php/api/tasks/create_task.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      },
      "creating task"
    );
  }

  /**
   * Update task
   * @param {number} taskId - Task ID
   * @param {Object} taskData - Task data
   * @returns {Promise<Object>} API response
   */
  async updateTask(taskId, taskData) {
    return this.makeAPIRequest(
      "php/api/tasks/update_task.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: taskId,
          ...taskData,
        }),
      },
      "updating task"
    );
  }

  /**
   * Update task status (for drag & drop)
   * @param {number} taskId - Task ID
   * @param {string} newStatus - New status
   * @returns {Promise<Object>} API response
   */
  async updateTaskStatus(taskId, newStatus) {
    return this.makeAPIRequest(
      "php/api/tasks/update_status_simple.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task_id: parseInt(taskId),
          status: newStatus,
        }),
      },
      "updating task status"
    );
  }

  /**
   * Delete task
   * @param {number} taskId - Task ID
   * @returns {Promise<Object>} API response
   */
  async deleteTask(taskId) {
    return this.makeAPIRequest(
      "php/api/tasks/delete_task.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ task_id: taskId }),
      },
      "deleting task"
    );
  }

  // ===== TEAM API METHODS =====

  /**
   * Load teams
   * @returns {Promise<Object>} API response
   */
  async loadTeams() {
    return this.makeAPIRequest(
      "php/api/teams/get_teams.php",
      {},
      "loading teams"
    );
  }

  /**
   * Create team
   * @param {Object} teamData - Team data
   * @returns {Promise<Object>} API response
   */
  async createTeam(teamData) {
    return this.makeAPIRequest(
      "php/api/teams/create_team.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(teamData),
      },
      "creating team"
    );
  }

  /**
   * Update team
   * @param {Object} teamData - Team data
   * @returns {Promise<Object>} API response
   */
  async updateTeam(teamData) {
    return this.makeAPIRequest(
      "php/api/teams/update_team.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(teamData),
      },
      "updating team"
    );
  }

  /**
   * Delete team
   * @param {number} teamId - Team ID
   * @returns {Promise<Object>} API response
   */
  async deleteTeam(teamId) {
    return this.makeAPIRequest(
      "php/api/teams/delete_team.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: teamId }),
      },
      "deleting team"
    );
  }

  /**
   * Create team workspace
   * @param {Object} workspaceData - Workspace data with team_id
   * @returns {Promise<Object>} API response
   */
  async createTeamWorkspace(workspaceData) {
    return this.makeAPIRequest(
      "php/api/teams/create_team_workspace.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workspaceData),
      },
      "creating team workspace"
    );
  }

  // ===== TEAM COLLABORATION APIs =====

  /**
   * Get team updates for real-time collaboration
   * @param {number} teamId - Team ID
   * @returns {Promise<Object>} API response
   */
  async getTeamUpdates(teamId) {
    return this.makeAPIRequest(
      `php/api/teams/get_team_updates.php?team_id=${teamId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
      "getting team updates"
    );
  }

  /**
   * Get team activity feed
   * @param {number} teamId - Team ID
   * @param {number} limit - Number of activities to fetch
   * @returns {Promise<Object>} API response
   */
  async getTeamActivity(teamId, limit = 50) {
    return this.makeAPIRequest(
      `php/api/teams/get_team_activity.php?team_id=${teamId}&limit=${limit}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
      "getting team activity"
    );
  }

  // ===== TEAM ANALYTICS APIs =====

  /**
   * Get team statistics
   * @param {number} teamId - Team ID
   * @param {number} days - Number of days to analyze
   * @returns {Promise<Object>} API response
   */
  async getTeamStats(teamId, days = 30) {
    return this.makeAPIRequest(
      `php/api/teams/get_team_stats.php?team_id=${teamId}&days=${days}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
      "getting team stats"
    );
  }

  /**
   * Get member performance metrics
   * @param {number} teamId - Team ID
   * @param {number} days - Number of days to analyze
   * @returns {Promise<Object>} API response
   */
  async getMemberPerformance(teamId, days = 30) {
    return this.makeAPIRequest(
      `php/api/teams/get_member_performance.php?team_id=${teamId}&days=${days}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
      "getting member performance"
    );
  }

  /**
   * Get project metrics
   * @param {number} teamId - Team ID
   * @param {number} days - Number of days to analyze
   * @returns {Promise<Object>} API response
   */
  async getProjectMetrics(teamId, days = 30) {
    return this.makeAPIRequest(
      `php/api/teams/get_project_metrics.php?team_id=${teamId}&days=${days}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
      "getting project metrics"
    );
  }

  /**
   * Get activity timeline
   * @param {number} teamId - Team ID
   * @param {number} days - Number of days to analyze
   * @returns {Promise<Object>} API response
   */
  async getActivityTimeline(teamId, days = 30) {
    return this.makeAPIRequest(
      `php/api/teams/get_activity_timeline.php?team_id=${teamId}&days=${days}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
      "getting activity timeline"
    );
  }

  /**
   * Get all teams for the current user
   * @returns {Promise<Object>} API response
   */
  async getTeams() {
    return this.makeAPIRequest(
      "php/api/teams/get_teams.php",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
      "getting teams"
    );
  }

  /**
   * Get productivity heatmap
   * @param {number} teamId - Team ID
   * @param {number} days - Number of days to analyze
   * @returns {Promise<Object>} API response
   */
  async getProductivityHeatmap(teamId, days = 30) {
    return this.makeAPIRequest(
      `php/api/teams/get_productivity_heatmap.php?team_id=${teamId}&days=${days}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
      "getting productivity heatmap"
    );
  }

  // ===== UTILITY METHODS =====

  /**
   * Set current workspace ID
   * @param {number} workspaceId - Workspace ID
   */
  setCurrentWorkspaceId(workspaceId) {
    this.currentWorkspaceId = workspaceId;
    localStorage.setItem("currentWorkspaceId", workspaceId.toString());
  }

  /**
   * Get current workspace ID
   * @returns {number} Current workspace ID
   */
  getCurrentWorkspaceId() {
    return this.currentWorkspaceId;
  }

  /**
   * Handle API errors consistently
   * @param {Error} error - Error object
   * @param {string} operation - Operation description
   */
  handleApiError(error, operation) {
    console.error(`❌ Error in ${operation}:`, error);
    showErrorMessage(`Failed to ${operation.toLowerCase()}`);
  }
}

// Export for use in other modules
window.APIManager = APIManager;

// Also make it globally available immediately
if (typeof APIManager !== "undefined") {
  console.log("✅ APIManager loaded successfully");
}
