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

  async loadWorkspaces() {
    try {
      const response = await fetch("php/api/workspaces/get_workspaces.php");
      const result = await this.safeJsonParse(response);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error("❌ Error loading workspaces:", error);
      throw error;
    }
  }

  async createWorkspace(workspaceData) {
    try {
      const response = await fetch("php/api/workspaces/create_workspace.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workspaceData),
      });

      const result = await this.safeJsonParse(response);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error("❌ Error creating workspace:", error);
      throw error;
    }
  }

  async loadProjects() {
    try {
      const response = await fetch(
        `php/api/projects/get_projects.php?workspace_id=${this.currentWorkspaceId}`
      );
      const result = await this.safeJsonParse(response);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error("❌ Error loading projects:", error);
      throw error;
    }
  }

  async createProject(projectData) {
    try {
      projectData.workspace_id = this.currentWorkspaceId;

      const response = await fetch("php/api/projects/create_project.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      });

      const result = await this.safeJsonParse(response);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error("❌ Error creating project:", error);
      throw error;
    }
  }

  async updateProject(projectId, projectData) {
    try {
      const response = await fetch("php/api/projects/update_project.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: projectId,
          ...projectData,
        }),
      });

      const result = await this.safeJsonParse(response);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error("❌ Error updating project:", error);
      throw error;
    }
  }

  /**
   * Delete project
   * @param {number} projectId - Project ID
   * @returns {Promise<Object>} API response
   */
  async deleteProject(projectId) {
    try {
      const response = await fetch("php/api/projects/delete_project.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: projectId }),
      });

      const result = await this.safeJsonParse(response);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error("❌ Error deleting project:", error);
      throw error;
    }
  }

  // ===== TASK API CALLS =====

  /**
   * Load tasks for current workspace
   * @returns {Promise<Object>} API response
   */
  async loadTasks() {
    try {
      const response = await fetch(
        `php/api/tasks/get_tasks.php?workspace_id=${this.currentWorkspaceId}`
      );
      const result = await this.safeJsonParse(response);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error("❌ Error loading tasks:", error);
      throw error;
    }
  }

  /**
   * Create new task
   * @param {Object} taskData - Task data
   * @returns {Promise<Object>} API response
   */
  async createTask(taskData) {
    try {
      const response = await fetch("php/api/tasks/create_task.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      });

      const result = await this.safeJsonParse(response);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error("❌ Error creating task:", error);
      throw error;
    }
  }

  /**
   * Update task
   * @param {number} taskId - Task ID
   * @param {Object} taskData - Task data
   * @returns {Promise<Object>} API response
   */
  async updateTask(taskId, taskData) {
    try {
      const response = await fetch("php/api/tasks/update_task.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: taskId,
          ...taskData,
        }),
      });

      const result = await this.safeJsonParse(response);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error("❌ Error updating task:", error);
      throw error;
    }
  }

  /**
   * Update task status (for drag & drop)
   * @param {number} taskId - Task ID
   * @param {string} newStatus - New status
   * @returns {Promise<Object>} API response
   */
  async updateTaskStatus(taskId, newStatus) {
    try {
      const response = await fetch("php/api/tasks/update_status_simple.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task_id: parseInt(taskId),
          status: newStatus,
        }),
      });

      const result = await this.safeJsonParse(response);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error("❌ Error updating task status:", error);
      throw error;
    }
  }

  /**
   * Delete task
   * @param {number} taskId - Task ID
   * @returns {Promise<Object>} API response
   */
  async deleteTask(taskId) {
    try {
      const response = await fetch("php/api/tasks/delete_task.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ task_id: taskId }),
      });

      const result = await this.safeJsonParse(response);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error("❌ Error deleting task:", error);
      throw error;
    }
  }

  // ===== TEAM API METHODS =====

  /**
   * Load teams
   * @returns {Promise<Object>} API response
   */
  async loadTeams() {
    try {
      const response = await fetch("php/api/teams/get_teams.php");
      const result = await this.safeJsonParse(response);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error("❌ Error loading teams:", error);
      throw error;
    }
  }

  /**
   * Create team
   * @param {Object} teamData - Team data
   * @returns {Promise<Object>} API response
   */
  async createTeam(teamData) {
    try {
      const response = await fetch("php/api/teams/create_team.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(teamData),
      });

      const result = await this.safeJsonParse(response);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error("❌ Error creating team:", error);
      throw error;
    }
  }

  /**
   * Update team
   * @param {Object} teamData - Team data
   * @returns {Promise<Object>} API response
   */
  async updateTeam(teamData) {
    try {
      const response = await fetch("php/api/teams/update_team.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(teamData),
      });

      const result = await this.safeJsonParse(response);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error("❌ Error updating team:", error);
      throw error;
    }
  }

  /**
   * Delete team
   * @param {number} teamId - Team ID
   * @returns {Promise<Object>} API response
   */
  async deleteTeam(teamId) {
    try {
      const response = await fetch("php/api/teams/delete_team.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: teamId }),
      });

      const result = await this.safeJsonParse(response);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error("❌ Error deleting team:", error);
      throw error;
    }
  }

  /**
   * Create team workspace
   * @param {Object} workspaceData - Workspace data with team_id
   * @returns {Promise<Object>} API response
   */
  async createTeamWorkspace(workspaceData) {
    try {
      const response = await fetch("php/api/teams/create_team_workspace.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workspaceData),
      });

      const result = await this.safeJsonParse(response);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error("❌ Error creating team workspace:", error);
      throw error;
    }
  }

  // ===== TEAM COLLABORATION APIs =====

  /**
   * Get team updates for real-time collaboration
   * @param {number} teamId - Team ID
   * @returns {Promise<Object>} API response
   */
  async getTeamUpdates(teamId) {
    try {
      const response = await fetch(
        `php/api/teams/get_team_updates.php?team_id=${teamId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await this.safeJsonParse(response);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error("❌ Error getting team updates:", error);
      throw error;
    }
  }

  /**
   * Get team activity feed
   * @param {number} teamId - Team ID
   * @param {number} limit - Number of activities to fetch
   * @returns {Promise<Object>} API response
   */
  async getTeamActivity(teamId, limit = 50) {
    try {
      const response = await fetch(
        `php/api/teams/get_team_activity.php?team_id=${teamId}&limit=${limit}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await this.safeJsonParse(response);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error("❌ Error getting team activity:", error);
      throw error;
    }
  }

  // ===== TEAM ANALYTICS APIs =====

  /**
   * Get team statistics
   * @param {number} teamId - Team ID
   * @param {number} days - Number of days to analyze
   * @returns {Promise<Object>} API response
   */
  async getTeamStats(teamId, days = 30) {
    try {
      const response = await fetch(
        `php/api/teams/get_team_stats.php?team_id=${teamId}&days=${days}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await this.safeJsonParse(response);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error("❌ Error getting team stats:", error);
      throw error;
    }
  }

  /**
   * Get member performance metrics
   * @param {number} teamId - Team ID
   * @param {number} days - Number of days to analyze
   * @returns {Promise<Object>} API response
   */
  async getMemberPerformance(teamId, days = 30) {
    try {
      const response = await fetch(
        `php/api/teams/get_member_performance.php?team_id=${teamId}&days=${days}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await this.safeJsonParse(response);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error("❌ Error getting member performance:", error);
      throw error;
    }
  }

  /**
   * Get project metrics
   * @param {number} teamId - Team ID
   * @param {number} days - Number of days to analyze
   * @returns {Promise<Object>} API response
   */
  async getProjectMetrics(teamId, days = 30) {
    try {
      const response = await fetch(
        `php/api/teams/get_project_metrics.php?team_id=${teamId}&days=${days}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await this.safeJsonParse(response);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error("❌ Error getting project metrics:", error);
      throw error;
    }
  }

  /**
   * Get activity timeline
   * @param {number} teamId - Team ID
   * @param {number} days - Number of days to analyze
   * @returns {Promise<Object>} API response
   */
  async getActivityTimeline(teamId, days = 30) {
    try {
      const response = await fetch(
        `php/api/teams/get_activity_timeline.php?team_id=${teamId}&days=${days}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await this.safeJsonParse(response);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error("❌ Error getting activity timeline:", error);
      throw error;
    }
  }

  /**
   * Get all teams for the current user
   * @returns {Promise<Object>} API response
   */
  async getTeams() {
    try {
      const response = await fetch("php/api/teams/get_teams.php", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await this.safeJsonParse(response);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error("❌ Error getting teams:", error);
      throw error;
    }
  }

  /**
   * Get productivity heatmap
   * @param {number} teamId - Team ID
   * @param {number} days - Number of days to analyze
   * @returns {Promise<Object>} API response
   */
  async getProductivityHeatmap(teamId, days = 30) {
    try {
      const response = await fetch(
        `php/api/teams/get_productivity_heatmap.php?team_id=${teamId}&days=${days}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await this.safeJsonParse(response);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error("❌ Error getting productivity heatmap:", error);
      throw error;
    }
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
