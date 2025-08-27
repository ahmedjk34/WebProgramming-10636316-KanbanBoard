/**
 * Team Collaboration Manager Module
 * Handles real-time collaboration features including WebSocket connections,
 * team updates, live notifications, and collaborative task management
 */

console.log("📦 Loading TeamCollaborationManager module...");

class TeamCollaborationManager {
  constructor(dependencies = {}) {
    this.socket = null;
    this.teamId = null;
    this.userId = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000; // 2 seconds

    // Store dependencies
    this.dependencies = dependencies;
    this.apiManager = dependencies.apiManager;
    this.taskManager = dependencies.taskManager;
    this.teamManager = dependencies.teamManager;
    this.uiManager = dependencies.uiManager;

    // Event listeners
    this.eventListeners = new Map();

    console.log(
      "🔧 TeamCollaborationManager initialized with dependencies:",
      Object.keys(dependencies)
    );
  }

  // ===== INITIALIZATION =====

  /**
   * Initialize the team collaboration manager
   */
  async init() {
    console.log("🚀 Initializing TeamCollaborationManager...");

    try {
      // Setup WebSocket connection if available
      if (typeof WebSocket !== "undefined") {
        this.setupWebSocketConnection();
      } else {
        console.warn("⚠️ WebSocket not available, falling back to polling");
        this.setupPollingConnection();
      }

      // Setup event listeners
      this.setupEventListeners();

      console.log("✅ TeamCollaborationManager initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize TeamCollaborationManager:", error);
    }
  }

  // ===== WEBSOCKET CONNECTION =====

  /**
   * Setup WebSocket connection for real-time updates
   */
  setupWebSocketConnection() {
    try {
      // For now, we'll simulate WebSocket with polling
      // In production, you'd connect to a real WebSocket server
      console.log("🔌 Setting up simulated WebSocket connection");

      // Simulate connection
      this.isConnected = true;
      this.startSimulatedUpdates();
    } catch (error) {
      console.error("❌ WebSocket connection failed:", error);
      this.setupPollingConnection();
    }
  }

  /**
   * Setup polling connection as fallback
   */
  setupPollingConnection() {
    console.log("🔄 Setting up polling connection");
    this.isConnected = true;
    this.startPollingUpdates();
  }

  /**
   * Start simulated real-time updates
   */
  startSimulatedUpdates() {
    // Simulate team activity updates every 10 seconds
    this.updateInterval = setInterval(() => {
      this.simulateTeamActivity();
    }, 10000);

    // Simulate task updates every 5 seconds
    this.taskUpdateInterval = setInterval(() => {
      this.simulateTaskUpdates();
    }, 5000);
  }

  /**
   * Start polling for updates
   */
  startPollingUpdates() {
    // Poll for team activity every 30 seconds
    this.pollingInterval = setInterval(async () => {
      await this.pollForUpdates();
    }, 30000);
  }

  /**
   * Simulate team activity updates
   */
  simulateTeamActivity() {
    if (!this.teamId) return;

    const activities = [
      {
        type: "task_completed",
        data: {
          task_id: Math.floor(Math.random() * 100) + 1,
          user_name: "John Doe",
          task_title: "Design System Implementation",
          timestamp: new Date().toISOString(),
        },
      },
      {
        type: "task_assigned",
        data: {
          task_id: Math.floor(Math.random() * 100) + 1,
          assignee_name: "Jane Smith",
          task_title: "API Documentation",
          timestamp: new Date().toISOString(),
        },
      },
      {
        type: "member_joined",
        data: {
          user_name: "Mike Johnson",
          role: "Developer",
          timestamp: new Date().toISOString(),
        },
      },
    ];

    const randomActivity =
      activities[Math.floor(Math.random() * activities.length)];
    this.handleTeamUpdate(randomActivity);
  }

  /**
   * Simulate task updates
   */
  simulateTaskUpdates() {
    if (!this.teamId) return;

    const updates = [
      {
        type: "task_updated",
        data: {
          task_id: Math.floor(Math.random() * 100) + 1,
          field: "status",
          old_value: "in_progress",
          new_value: "done",
          user_name: "John Doe",
          timestamp: new Date().toISOString(),
        },
      },
      {
        type: "task_priority_changed",
        data: {
          task_id: Math.floor(Math.random() * 100) + 1,
          old_priority: "medium",
          new_priority: "high",
          user_name: "Jane Smith",
          timestamp: new Date().toISOString(),
        },
      },
    ];

    const randomUpdate = updates[Math.floor(Math.random() * updates.length)];
    this.handleTeamUpdate(randomUpdate);
  }

  /**
   * Poll for updates from server
   */
  async pollForUpdates() {
    if (!this.teamId || !this.apiManager) return;

    try {
      const response = await this.apiManager.getTeamUpdates(this.teamId);
      if (response.success && response.data.updates) {
        response.data.updates.forEach((update) => {
          this.handleTeamUpdate(update);
        });
      }
    } catch (error) {
      console.error("❌ Error polling for updates:", error);
    }
  }

  // ===== TEAM UPDATE HANDLING =====

  /**
   * Handle team updates from WebSocket/polling
   * @param {Object} update - Update data
   */
  handleTeamUpdate(update) {
    console.log("📡 Received team update:", update);

    switch (update.type) {
      case "task_completed":
        this.handleTaskCompleted(update.data);
        break;
      case "task_assigned":
        this.handleTaskAssigned(update.data);
        break;
      case "task_updated":
        this.handleTaskUpdated(update.data);
        break;
      case "task_priority_changed":
        this.handleTaskPriorityChanged(update.data);
        break;
      case "member_joined":
        this.handleMemberJoined(update.data);
        break;
      case "member_left":
        this.handleMemberLeft(update.data);
        break;
      case "project_created":
        this.handleProjectCreated(update.data);
        break;
      case "workspace_created":
        this.handleWorkspaceCreated(update.data);
        break;
      default:
        console.warn("⚠️ Unknown update type:", update.type);
    }

    // Emit event for other modules
    this.emit("teamUpdate", update);
  }

  /**
   * Handle task completed update
   * @param {Object} data - Task completion data
   */
  handleTaskCompleted(data) {
    // Update task in UI
    if (this.taskManager) {
      this.taskManager.updateTaskStatus(data.task_id, "done");
    }

    // Show notification
    this.showNotification(
      "🎉 Task Completed",
      `${data.user_name} completed "${data.task_title}"`,
      "success"
    );

    // Update activity feed
    this.addActivityToFeed({
      type: "task_completed",
      icon: "✅",
      text: `${data.user_name} completed "${data.task_title}"`,
      timestamp: data.timestamp,
      user_name: data.user_name,
    });
  }

  /**
   * Handle task assigned update
   * @param {Object} data - Task assignment data
   */
  handleTaskAssigned(data) {
    // Update task in UI
    if (this.taskManager) {
      this.taskManager.updateTaskAssignee(data.task_id, data.assignee_name);
    }

    // Show notification
    this.showNotification(
      "📋 Task Assigned",
      `"${data.task_title}" assigned to ${data.assignee_name}`,
      "info"
    );

    // Update activity feed
    this.addActivityToFeed({
      type: "task_assigned",
      icon: "👤",
      text: `"${data.task_title}" assigned to ${data.assignee_name}`,
      timestamp: data.timestamp,
      user_name: data.assignee_name,
    });
  }

  /**
   * Handle task updated update
   * @param {Object} data - Task update data
   */
  handleTaskUpdated(data) {
    // Update task in UI
    if (this.taskManager) {
      this.taskManager.refreshTask(data.task_id);
    }

    // Show notification
    this.showNotification(
      "✏️ Task Updated",
      `${data.user_name} updated "${data.field}" of a task`,
      "info"
    );

    // Update activity feed
    this.addActivityToFeed({
      type: "task_updated",
      icon: "✏️",
      text: `${data.user_name} updated task ${data.field}`,
      timestamp: data.timestamp,
      user_name: data.user_name,
    });
  }

  /**
   * Handle task priority changed update
   * @param {Object} data - Priority change data
   */
  handleTaskPriorityChanged(data) {
    // Update task in UI
    if (this.taskManager) {
      this.taskManager.updateTaskPriority(data.task_id, data.new_priority);
    }

    // Show notification
    this.showNotification(
      "🎯 Priority Changed",
      `${data.user_name} changed task priority to ${data.new_priority}`,
      "warning"
    );

    // Update activity feed
    this.addActivityToFeed({
      type: "priority_changed",
      icon: "🎯",
      text: `${data.user_name} changed priority to ${data.new_priority}`,
      timestamp: data.timestamp,
      user_name: data.user_name,
    });
  }

  /**
   * Handle member joined update
   * @param {Object} data - Member join data
   */
  handleMemberJoined(data) {
    // Update team members in UI
    if (this.teamManager) {
      this.teamManager.refreshTeamMembers();
    }

    // Show notification
    this.showNotification(
      "👋 New Member",
      `${data.user_name} joined the team as ${data.role}`,
      "success"
    );

    // Update activity feed
    this.addActivityToFeed({
      type: "member_joined",
      icon: "👋",
      text: `${data.user_name} joined as ${data.role}`,
      timestamp: data.timestamp,
      user_name: data.user_name,
    });
  }

  /**
   * Handle member left update
   * @param {Object} data - Member leave data
   */
  handleMemberLeft(data) {
    // Update team members in UI
    if (this.teamManager) {
      this.teamManager.refreshTeamMembers();
    }

    // Show notification
    this.showNotification(
      "👋 Member Left",
      `${data.user_name} left the team`,
      "info"
    );

    // Update activity feed
    this.addActivityToFeed({
      type: "member_left",
      icon: "👋",
      text: `${data.user_name} left the team`,
      timestamp: data.timestamp,
      user_name: data.user_name,
    });
  }

  /**
   * Handle project created update
   * @param {Object} data - Project creation data
   */
  handleProjectCreated(data) {
    // Update projects in UI
    if (this.teamManager) {
      this.teamManager.refreshTeamProjects();
    }

    // Show notification
    this.showNotification(
      "📁 New Project",
      `${data.user_name} created project "${data.project_name}"`,
      "success"
    );

    // Update activity feed
    this.addActivityToFeed({
      type: "project_created",
      icon: "📁",
      text: `${data.user_name} created project "${data.project_name}"`,
      timestamp: data.timestamp,
      user_name: data.user_name,
    });
  }

  /**
   * Handle workspace created update
   * @param {Object} data - Workspace creation data
   */
  handleWorkspaceCreated(data) {
    // Update workspaces in UI
    if (this.teamManager) {
      this.teamManager.refreshTeamWorkspaces();
    }

    // Show notification
    this.showNotification(
      "🗂️ New Workspace",
      `${data.user_name} created workspace "${data.workspace_name}"`,
      "success"
    );

    // Update activity feed
    this.addActivityToFeed({
      type: "workspace_created",
      icon: "🗂️",
      text: `${data.user_name} created workspace "${data.workspace_name}"`,
      timestamp: data.timestamp,
      user_name: data.user_name,
    });
  }

  // ===== NOTIFICATION SYSTEM =====

  /**
   * Show notification
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, warning, info)
   */
  showNotification(title, message, type = "info") {
    // Use existing notification system if available
    if (typeof showNotification === "function") {
      showNotification(title, message, type);
    } else {
      // Fallback notification
      console.log(`📢 ${title}: ${message}`);

      // Create simple notification
      const notification = document.createElement("div");
      notification.className = `notification notification-${type}`;
      notification.innerHTML = `
        <div class="notification-title">${title}</div>
        <div class="notification-message">${message}</div>
      `;

      document.body.appendChild(notification);

      // Remove after 5 seconds
      setTimeout(() => {
        notification.remove();
      }, 5000);
    }
  }

  // ===== ACTIVITY FEED =====

  /**
   * Add activity to the team activity feed
   * @param {Object} activity - Activity data
   */
  addActivityToFeed(activity) {
    const activityFeed = document.getElementById("team-activity-feed");
    if (!activityFeed) return;

    const activityItem = this.createActivityItem(activity);
    activityFeed.insertBefore(activityItem, activityFeed.firstChild);

    // Limit feed to 50 items
    const items = activityFeed.querySelectorAll(".activity-item");
    if (items.length > 50) {
      items[items.length - 1].remove();
    }
  }

  /**
   * Create activity item HTML
   * @param {Object} activity - Activity data
   * @returns {HTMLElement} Activity item element
   */
  createActivityItem(activity) {
    const activityItem = document.createElement("div");
    activityItem.className = "activity-item";
    activityItem.innerHTML = `
      <div class="activity-icon">${activity.icon}</div>
      <div class="activity-content">
        <div class="activity-text">${activity.text}</div>
        <div class="activity-time">${this.getTimeAgo(activity.timestamp)}</div>
      </div>
    `;
    return activityItem;
  }

  /**
   * Get time ago string
   * @param {string} timestamp - ISO timestamp
   * @returns {string} Time ago string
   */
  getTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    }
  }

  // ===== EVENT SYSTEM =====

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for team changes
    document.addEventListener("teamChanged", (event) => {
      this.switchTeam(event.detail.teamId);
    });

    // Listen for user changes
    document.addEventListener("userChanged", (event) => {
      this.setUserId(event.detail.userId);
    });
  }

  /**
   * Switch to a different team
   * @param {number} teamId - Team ID
   */
  switchTeam(teamId) {
    console.log("🔄 Switching to team:", teamId);
    this.teamId = teamId;

    // Clear existing activity feed
    this.clearActivityFeed();

    // Load team activity
    this.loadTeamActivity(teamId);
  }

  /**
   * Set user ID
   * @param {number} userId - User ID
   */
  setUserId(userId) {
    this.userId = userId;
  }

  /**
   * Load team activity
   * @param {number} teamId - Team ID
   */
  async loadTeamActivity(teamId) {
    if (!this.apiManager) return;

    try {
      const response = await this.apiManager.getTeamActivity(teamId);
      if (response.success) {
        this.displayTeamActivity(response.data.activities);
      }
    } catch (error) {
      console.error("❌ Error loading team activity:", error);
    }
  }

  /**
   * Display team activity
   * @param {Array} activities - Activity array
   */
  displayTeamActivity(activities) {
    const activityFeed = document.getElementById("team-activity-feed");
    if (!activityFeed) return;

    activityFeed.innerHTML = "";

    activities.forEach((activity) => {
      const activityItem = this.createActivityItem(activity);
      activityFeed.appendChild(activityItem);
    });
  }

  /**
   * Clear activity feed
   */
  clearActivityFeed() {
    const activityFeed = document.getElementById("team-activity-feed");
    if (activityFeed) {
      activityFeed.innerHTML = "";
    }
  }

  // ===== EVENT EMITTER =====

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error("❌ Error in event listener:", error);
        }
      });
    }
  }

  // ===== CLEANUP =====

  /**
   * Cleanup resources
   */
  destroy() {
    // Clear intervals
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    if (this.taskUpdateInterval) {
      clearInterval(this.taskUpdateInterval);
    }
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    // Close WebSocket connection
    if (this.socket) {
      this.socket.close();
    }

    // Clear event listeners
    this.eventListeners.clear();

    console.log("🧹 TeamCollaborationManager destroyed");
  }
}

// Export for use in other modules
window.TeamCollaborationManager = TeamCollaborationManager;

// Also make it globally available immediately
if (typeof TeamCollaborationManager !== "undefined") {
  console.log("✅ TeamCollaborationManager loaded successfully");
}
