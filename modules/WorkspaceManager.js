/**
 * Workspace Manager Module
 * Handles workspace switching, creation, and management
 */

console.log("📦 Loading WorkspaceManager module...");

class WorkspaceManager {
  constructor(dependencies = {}) {
    this.workspaces = [];
    this.currentWorkspaceId =
      parseInt(localStorage.getItem("currentWorkspaceId")) || 1;
    this.currentWorkspaceType =
      localStorage.getItem("workspaceType") || "personal";
    this.teams = [];

    // Store dependencies
    this.dependencies = dependencies;
    this.apiManager = dependencies.apiManager;

    console.log(
      "🔧 WorkspaceManager initialized with dependencies:",
      Object.keys(dependencies)
    );
  }

  // ===== WORKSPACE DATA MANAGEMENT =====

  /**
   * Set workspaces data
   * @param {Array} workspaces - Array of workspace objects
   */
  setWorkspaces(workspaces) {
    this.workspaces = workspaces;
  }

  /**
   * Get all workspaces
   * @returns {Array} Array of workspace objects
   */
  getWorkspaces() {
    return this.workspaces;
  }

  /**
   * Get current workspace
   * @returns {Object|null} Current workspace object
   */
  getCurrentWorkspace() {
    return (
      this.workspaces.find((w) => w.id === this.currentWorkspaceId) || null
    );
  }

  /**
   * Set current workspace ID
   * @param {number} workspaceId - Workspace ID
   */
  setCurrentWorkspaceId(workspaceId) {
    this.currentWorkspaceId = workspaceId;
    localStorage.setItem("currentWorkspaceId", workspaceId.toString());

    // Update API manager
    if (this.apiManager) {
      this.apiManager.setCurrentWorkspaceId(workspaceId);
    }
  }

  // ===== WORKSPACE LOADING =====

  /**
   * Load workspaces from API
   */
  async loadWorkspaces() {
    console.log("📊 Loading workspaces...");

    try {
      if (this.apiManager) {
        const result = await this.apiManager.loadWorkspaces();

        this.setWorkspaces(result.data.workspaces);
        this.displayWorkspaces();

        // Auto-select first available workspace if current workspace is not accessible
        if (this.workspaces.length > 0) {
          const currentWorkspace = this.getCurrentWorkspace();
          if (!currentWorkspace) {
            // Current workspace is not accessible, switch to first available
            const firstWorkspace = this.workspaces[0];
            console.log(
              "🔄 Auto-switching to first available workspace:",
              firstWorkspace.name
            );
            this.setCurrentWorkspaceId(firstWorkspace.id);

            // Trigger project and task loading for the new workspace
            setTimeout(async () => {
              if (window.projectManager) {
                await window.projectManager.loadProjects();
              }
              if (window.taskManager) {
                await window.taskManager.refreshTasks();
              }
            }, 100);
          }
        }

        this.updateCurrentWorkspaceDisplay();
        console.log("✅ Workspaces loaded:", this.workspaces.length);
      }
    } catch (error) {
      console.error("❌ Error loading workspaces:", error);
      showErrorMessage("Failed to load workspaces");
    }
  }

  // ===== WORKSPACE DISPLAY =====

  /**
   * Display workspaces in sidebar
   */
  displayWorkspaces() {
    const container = document.getElementById("workspaces-container");
    if (!container) return;

    container.innerHTML = "";

    this.workspaces.forEach((workspace) => {
      const workspaceElement = this.createWorkspaceElement(workspace);
      container.appendChild(workspaceElement);
    });
  }

  /**
   * Create workspace element for sidebar
   * @param {Object} workspace - Workspace object
   * @returns {HTMLElement} Workspace element
   */
  createWorkspaceElement(workspace) {
    const element = document.createElement("div");
    element.className = `workspace-item ${
      workspace.id === this.currentWorkspaceId ? "active" : ""
    }`;
    element.onclick = () => this.switchWorkspace(workspace.id);

    element.innerHTML = `
      <div class="workspace-icon" style="color: ${workspace.color}">${workspace.icon}</div>
      <div class="workspace-details">
        <div class="workspace-name">${workspace.name}</div>
        <div class="workspace-description">${workspace.description}</div>
      </div>
    `;

    return element;
  }

  /**
   * Update current workspace display in header and sidebar
   */
  updateCurrentWorkspaceDisplay() {
    const currentWorkspace = this.getCurrentWorkspace();
    if (!currentWorkspace) return;

    // Update sidebar display
    const sidebarIcon = document.getElementById("current-workspace-icon");
    const sidebarName = document.getElementById("current-workspace-name");
    const sidebarDesc = document.getElementById(
      "current-workspace-description"
    );

    if (sidebarIcon) sidebarIcon.textContent = currentWorkspace.icon;
    if (sidebarName) sidebarName.textContent = currentWorkspace.name;
    if (sidebarDesc) sidebarDesc.textContent = currentWorkspace.description;

    // Update header display
    const headerIcon = document.getElementById("header-workspace-icon");
    const headerName = document.getElementById("header-workspace-name");

    if (headerIcon) headerIcon.textContent = currentWorkspace.icon;
    if (headerName) headerName.textContent = currentWorkspace.name;
  }

  // ===== WORKSPACE SWITCHING =====

  /**
   * Switch to different workspace
   * @param {number} workspaceId - Workspace ID to switch to
   */
  async switchWorkspace(workspaceId) {
    console.log("🔄 Switching to workspace:", workspaceId);

    this.setCurrentWorkspaceId(workspaceId);

    // Update displays
    this.updateCurrentWorkspaceDisplay();
    this.displayWorkspaces();

    // Close sidebar
    this.closeSidebar();

    // Reload projects and tasks for new workspace
    if (window.projectManager) {
      await window.projectManager.loadProjects();
    }
    if (window.taskManager) {
      await window.taskManager.refreshTasks();
    }

    const workspaceName = this.workspaces.find(
      (w) => w.id === workspaceId
    )?.name;
    showSuccessMessage(`Switched to ${workspaceName}`);
  }

  // ===== SIDEBAR MANAGEMENT =====

  /**
   * Open workspace sidebar
   */
  openSidebar() {
    console.log("🏢 Opening workspace sidebar");

    const sidebar = document.getElementById("workspace-sidebar");
    const overlay = document.getElementById("sidebar-overlay");

    if (sidebar && overlay) {
      sidebar.classList.add("open");
      overlay.classList.add("show");
      lockScroll();

      // Load workspaces
      this.loadWorkspaces();
    }
  }

  /**
   * Close workspace sidebar
   */
  closeSidebar() {
    console.log("🏢 Closing workspace sidebar");

    const sidebar = document.getElementById("workspace-sidebar");
    const overlay = document.getElementById("sidebar-overlay");

    if (sidebar && overlay) {
      sidebar.classList.remove("open");
      overlay.classList.remove("show");
      unlockScroll();
    }
  }

  // ===== WORKSPACE CREATION =====

  /**
   * Open create workspace dialog
   */
  openCreateWorkspaceDialog() {
    console.log("➕ Opening create workspace dialog");

    const dialog = document.getElementById("create-workspace-dialog");
    if (!dialog) {
      console.error("❌ Create workspace dialog not found!");
      return;
    }

    // Reset form
    this.resetCreateWorkspaceForm();

    // Setup form handlers
    this.setupCreateWorkspaceForm();
    this.setupWorkspaceIconPicker();
    this.setupWorkspaceColorPicker();

    // Lock scrolling and show dialog
    lockScroll();
    dialog.showModal();

    // Focus on name field
    setTimeout(() => {
      const nameField = document.getElementById("workspace-name");
      if (nameField) nameField.focus();
    }, 100);

    // Handle click outside to close
    dialog.addEventListener("click", handleDialogClickOutside);
  }

  /**
   * Close create workspace dialog
   */
  closeCreateWorkspaceDialog() {
    const dialog = document.getElementById("create-workspace-dialog");
    if (dialog) {
      dialog.close();
      unlockScroll();
    }
  }

  /**
   * Setup create workspace form
   */
  setupCreateWorkspaceForm() {
    const form = document.getElementById("create-workspace-form");
    if (form) {
      form.removeEventListener(
        "submit",
        this.handleCreateWorkspaceSubmit.bind(this)
      );
      form.addEventListener(
        "submit",
        this.handleCreateWorkspaceSubmit.bind(this)
      );
    }
  }

  /**
   * Setup workspace icon picker
   */
  setupWorkspaceIconPicker() {
    const iconInput = document.getElementById("workspace-icon");
    const iconPresets = document.querySelectorAll(
      "#create-workspace-dialog .icon-preset"
    );

    iconPresets.forEach((preset) => {
      preset.addEventListener("click", () => {
        const icon = preset.getAttribute("data-icon");
        iconInput.value = icon;
      });
    });
  }

  /**
   * Setup workspace color picker
   */
  setupWorkspaceColorPicker() {
    const colorInput = document.getElementById("workspace-color");
    const colorPresets = document.querySelectorAll(
      "#create-workspace-dialog .color-preset"
    );

    colorPresets.forEach((preset) => {
      preset.addEventListener("click", () => {
        const color = preset.getAttribute("data-color");
        colorInput.value = color;
      });
    });
  }

  /**
   * Handle create workspace form submission
   * @param {Event} e - Form submit event
   */
  async handleCreateWorkspaceSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const workspaceData = {
      name: formData.get("name"),
      description: formData.get("description"),
      icon: formData.get("icon"),
      color: formData.get("color"),
    };

    console.log("📝 Creating workspace:", workspaceData);

    try {
      if (this.apiManager) {
        // Try to create via API
        const result = await this.apiManager.createWorkspace(workspaceData);

        if (result.success) {
          showSuccessMessage("Workspace created successfully!");
          this.closeCreateWorkspaceDialog();

          // Refresh workspace display
          await this.loadWorkspaces();
        }
      } else {
        // Fallback: add to local array
        const newWorkspace = {
          id: this.workspaces.length + 1,
          ...workspaceData,
          is_default: false,
        };

        this.workspaces.push(newWorkspace);

        showSuccessMessage("Workspace created successfully!");
        this.closeCreateWorkspaceDialog();

        // Refresh workspace display
        this.displayWorkspaces();
      }
    } catch (error) {
      console.error("❌ Error creating workspace:", error);
      showErrorMessage("Failed to create workspace");
    }
  }

  /**
   * Reset create workspace form
   */
  resetCreateWorkspaceForm() {
    const form = document.getElementById("create-workspace-form");
    if (form) {
      form.reset();
      document.getElementById("workspace-icon").value = "🏢";
      document.getElementById("workspace-color").value = "#667eea";
    }
  }

  // ===== WORKSPACE TYPE MANAGEMENT =====

  /**
   * Load workspaces for specific type (personal or teams)
   * @param {string} type - 'personal' or 'teams'
   */
  async loadWorkspacesForType(type) {
    console.log(`📊 Loading workspaces for type: ${type}`);

    this.currentWorkspaceType = type;

    try {
      if (this.apiManager) {
        const result = await this.apiManager.loadWorkspaces();

        // Filter workspaces by type
        const filteredWorkspaces = result.data.workspaces.filter(
          (workspace) => {
            if (type === "personal") {
              return workspace.workspace_type === "personal";
            } else {
              return workspace.workspace_type === "team";
            }
          }
        );

        this.setWorkspaces(filteredWorkspaces);
        this.displayWorkspaces();

        // Load teams if in teams mode
        if (type === "teams") {
          await this.loadTeams();
        }

        // Auto-select first available workspace
        if (this.workspaces.length > 0) {
          const currentWorkspace = this.getCurrentWorkspace();
          if (!currentWorkspace) {
            const firstWorkspace = this.workspaces[0];
            this.setCurrentWorkspaceId(firstWorkspace.id);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error loading workspaces for type ${type}:`, error);
    }
  }

  /**
   * Load teams from API
   */
  async loadTeams() {
    console.log("📊 Loading teams...");

    try {
      if (this.apiManager) {
        const result = await this.apiManager.loadTeams();
        this.teams = result.data.teams || [];
        this.displayTeams();
      }
    } catch (error) {
      console.error("❌ Error loading teams:", error);
    }
  }

  /**
   * Display teams in the sidebar
   */
  displayTeams() {
    const teamsContainer = document.getElementById("teams-container");
    if (!teamsContainer) return;

    teamsContainer.innerHTML = "";

    if (this.teams.length === 0) {
      teamsContainer.innerHTML = `
        <div class="no-teams-message">
          <p>No teams found. Create your first team to get started!</p>
        </div>
      `;
      return;
    }

    this.teams.forEach((team) => {
      const teamElement = document.createElement("div");
      teamElement.className = "team-item";
      teamElement.setAttribute("data-team-id", team.id);
      teamElement.innerHTML = `
        <div class="team-icon" style="background-color: ${
          team.color || "#667eea"
        }">
          🏢
        </div>
        <div class="team-details">
          <div class="team-name">${team.name}</div>
          <div class="team-description">${
            team.description || "No description"
          }</div>
        </div>
      `;

      teamElement.addEventListener("click", () => {
        this.selectTeam(team.id);
      });

      teamsContainer.appendChild(teamElement);
    });
  }

  /**
   * Select a team
   * @param {number} teamId - Team ID
   */
  selectTeam(teamId) {
    console.log(`🎯 Selecting team: ${teamId}`);

    // Update active team in UI
    const teamItems = document.querySelectorAll(".team-item");
    teamItems.forEach((item) => {
      item.classList.remove("active");
    });

    const selectedTeamItem = document.querySelector(
      `[data-team-id="${teamId}"]`
    );
    if (selectedTeamItem) {
      selectedTeamItem.classList.add("active");
    }

    // Load team workspaces
    this.loadTeamWorkspaces(teamId);
  }

  /**
   * Load workspaces for a specific team
   * @param {number} teamId - Team ID
   */
  async loadTeamWorkspaces(teamId) {
    console.log(`📊 Loading workspaces for team: ${teamId}`);

    try {
      if (this.apiManager) {
        const result = await this.apiManager.loadWorkspaces();

        // Filter workspaces by team
        const teamWorkspaces = result.data.workspaces.filter(
          (workspace) => workspace.team_id === teamId
        );

        this.setWorkspaces(teamWorkspaces);
        this.displayWorkspaces();

        // Auto-select first team workspace
        if (this.workspaces.length > 0) {
          const firstWorkspace = this.workspaces[0];
          this.setCurrentWorkspaceId(firstWorkspace.id);
        }
      }
    } catch (error) {
      console.error(`❌ Error loading team workspaces:`, error);
    }
  }

  /**
   * Refresh current workspace
   */
  async refreshCurrentWorkspace() {
    console.log("🔄 Refreshing current workspace");

    if (this.currentWorkspaceType === "teams") {
      await this.loadTeams();
    }

    await this.loadWorkspacesForType(this.currentWorkspaceType);
  }
}

// Export for use in other modules
window.WorkspaceManager = WorkspaceManager;

// Also make it globally available immediately
if (typeof WorkspaceManager !== "undefined") {
  console.log("✅ WorkspaceManager loaded successfully");
}
