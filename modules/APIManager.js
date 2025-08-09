/**
 * API Manager Module
 * Handles all API calls and data management
 */

console.log("📦 Loading APIManager module...");

class APIManager {
  constructor() {
    this.baseUrl = "";
    this.currentWorkspaceId =
      parseInt(localStorage.getItem("currentWorkspaceId")) || 1;
  }

  /**
   * Safely parse JSON response, handling HTML error responses
   * @param {Response} response - Fetch response object
   * @returns {Object} Parsed JSON or error object
   */
  async safeJsonParse(response) {
    try {
      const text = await response.text();

      // Check if response is HTML (PHP error page)
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

      // Try to parse as JSON
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

  // ===== WORKSPACE API CALLS =====

  /**
   * Load all workspaces
   * @returns {Promise<Object>} API response
   */
  async loadWorkspaces() {
    try {
      const response = await fetch("php/api/workspaces/get_workspaces.php");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error("❌ Error loading workspaces:", error);
      throw error;
    }
  }

  /**
   * Create new workspace
   * @param {Object} workspaceData - Workspace data
   * @returns {Promise<Object>} API response
   */
  async createWorkspace(workspaceData) {
    try {
      const response = await fetch("php/api/workspaces/create_workspace.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workspaceData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error("❌ Error creating workspace:", error);
      throw error;
    }
  }

  // ===== PROJECT API CALLS =====

  /**
   * Load projects for current workspace
   * @returns {Promise<Object>} API response
   */
  async loadProjects() {
    try {
      const response = await fetch(
        `php/api/projects/get_projects.php?workspace_id=${this.currentWorkspaceId}`
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error("❌ Error loading projects:", error);
      throw error;
    }
  }

  /**
   * Create new project
   * @param {Object} projectData - Project data
   * @returns {Promise<Object>} API response
   */
  async createProject(projectData) {
    try {
      // Add current workspace ID to project data
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

  /**
   * Update project
   * @param {number} projectId - Project ID
   * @param {Object} projectData - Project data
   * @returns {Promise<Object>} API response
   */
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

      const result = await response.json();

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

      const result = await response.json();

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
      const result = await response.json();

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

      const result = await response.json();

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

      const result = await response.json();

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
        body: JSON.stringify({ id: taskId }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (error) {
      console.error("❌ Error deleting task:", error);
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
