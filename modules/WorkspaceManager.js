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

    // Prevent click on action buttons from triggering workspace switch
    element.onclick = (e) => {
      // Don't switch workspace if clicking on action buttons or their children
      if (
        e.target.closest(".workspace-action-btn") ||
        e.target.closest(".action-icon")
      ) {
        e.stopPropagation();
        return;
      }
      this.switchWorkspace(workspace.id);
    };

    element.innerHTML = `
      <div class="workspace-icon" style="color: ${workspace.color}">${workspace.icon}</div>
      <div class="workspace-details">
        <div class="workspace-name">${workspace.name}</div>
        <div class="workspace-description">${workspace.description}</div>
      </div>
      <div class="workspace-actions">
        <button class="workspace-action-btn edit" onclick="event.stopPropagation(); console.log('Edit button clicked for workspace', ${workspace.id}); editWorkspace(${workspace.id})" title="Edit Workspace">
          <span class="action-icon">✏️</span>
        </button>
        <button class="workspace-action-btn delete" onclick="event.stopPropagation(); console.log('Delete button clicked for workspace', ${workspace.id}); deleteWorkspace(${workspace.id})" title="Delete Workspace">
          <span class="action-icon">🗑️</span>
        </button>
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

      // Reset form state
      const form = dialog.querySelector("#create-workspace-form");
      if (form) {
        form.reset();
        form.dataset.isEditing = "false";
        form.dataset.workspaceId = "";
      }

      // Reset dialog title and button
      const title = dialog.querySelector(".dialog-header h3");
      const submitBtn = dialog.querySelector("#create-workspace-submit-btn");

      if (title) title.textContent = "🏢 Create New Workspace";
      if (submitBtn) {
        // Clear the button content first
        submitBtn.innerHTML = "";

        // Create the icon span
        const iconSpan = document.createElement("span");
        iconSpan.className = "btn-icon";
        iconSpan.textContent = "🚀";

        // Create the text span
        const textSpan = document.createElement("span");
        textSpan.textContent = "Create Workspace";

        // Add both to the button
        submitBtn.appendChild(iconSpan);
        submitBtn.appendChild(textSpan);
      }
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
   * Handle create/edit workspace form submission
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

    const isEditing = e.target.dataset.isEditing === "true";
    const workspaceId = e.target.dataset.workspaceId;

    if (isEditing) {
      console.log("✏️ Updating workspace:", workspaceId, workspaceData);

      try {
        if (this.apiManager) {
          // Try to update via API
          const result = await this.apiManager.updateWorkspace(
            workspaceId,
            workspaceData
          );

          if (result.success) {
            showSuccessMessage("Workspace updated successfully!");
            this.closeCreateWorkspaceDialog();

            // Refresh workspace display
            await this.loadWorkspaces();
          }
        } else {
          // Fallback: update local array
          const workspaceIndex = this.workspaces.findIndex(
            (w) => w.id === parseInt(workspaceId)
          );
          if (workspaceIndex !== -1) {
            this.workspaces[workspaceIndex] = {
              ...this.workspaces[workspaceIndex],
              ...workspaceData,
            };

            showSuccessMessage("Workspace updated successfully!");
            this.closeCreateWorkspaceDialog();

            // Refresh workspace display
            this.displayWorkspaces();
          }
        }
      } catch (error) {
        console.error("❌ Error updating workspace:", error);
        showErrorMessage("Failed to update workspace");
      }
    } else {
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

  /**
   * Edit an existing workspace
   * @param {number} workspaceId - Workspace ID to edit
   */
  async editWorkspace(workspaceId) {
    try {
      console.log("✏️ Editing workspace:", workspaceId);
      console.log("Available workspaces:", this.workspaces);

      const workspace = this.workspaces.find((w) => w.id === workspaceId);
      if (!workspace) {
        console.error("Workspace not found:", workspaceId);
        showErrorMessage("Workspace not found");
        return;
      }

      console.log("Found workspace:", workspace);
      // Open edit dialog with current workspace data
      this.openEditWorkspaceDialog(workspace);
    } catch (error) {
      console.error("❌ Error editing workspace:", error);
      showErrorMessage("Failed to edit workspace");
    }
  }

  /**
   * Delete a workspace
   * @param {number} workspaceId - Workspace ID to delete
   */
  async deleteWorkspace(workspaceId) {
    try {
      console.log("🗑️ Deleting workspace:", workspaceId);

      const workspace = this.workspaces.find((w) => w.id === workspaceId);
      if (!workspace) {
        showErrorMessage("Workspace not found");
        return;
      }

      // Show confirmation dialog
      const confirmed = await this.showDeleteConfirmation(workspace);
      if (!confirmed) return;

      const result = await this.apiManager.deleteWorkspace(workspaceId);

      if (result.success) {
        // Remove from local array
        this.workspaces = this.workspaces.filter((w) => w.id !== workspaceId);

        // If this was the current workspace, switch to first available
        if (workspaceId === this.currentWorkspaceId) {
          const firstWorkspace = this.workspaces[0];
          if (firstWorkspace) {
            await this.switchWorkspace(firstWorkspace.id);
          } else {
            // No workspaces left, create a default one
            await this.createDefaultWorkspace();
          }
        }

        showSuccessMessage("Workspace deleted successfully!");
        this.displayWorkspaces();
      }
    } catch (error) {
      console.error("❌ Error deleting workspace:", error);
      showErrorMessage("Failed to delete workspace");
    }
  }

  /**
   * Show delete confirmation dialog
   * @param {Object} workspace - Workspace to delete
   * @returns {Promise<boolean>} - Whether user confirmed deletion
   */
  async showDeleteConfirmation(workspace) {
    return new Promise((resolve) => {
      // Create dialog element following the same structure as task delete dialog
      const dialog = document.createElement("dialog");
      dialog.className = "delete-workspace-dialog";
      dialog.innerHTML = `
        <div class="dialog-content dialog-small">
          <div class="dialog-header">
            <h3>🗑️ Delete Workspace</h3>
            <button
              type="button"
              class="dialog-close"
              onclick="this.closest('.delete-workspace-dialog').remove(); resolve(false);"
            >
              <span aria-hidden="true">&times;</span>
              <span class="sr-only">Close</span>
            </button>
          </div>
          <div class="dialog-body">
            <div class="delete-warning">
              <div class="warning-icon">⚠️</div>
              <p>Are you sure you want to delete the workspace <strong>"${workspace.name}"</strong>?</p>
              <p class="workspace-title-preview">${workspace.name}</p>
              <p class="warning-text">⚠️ This action cannot be undone. All projects and tasks in this workspace will be permanently deleted.</p>
            </div>

            <div class="form-actions">
              <button
                type="button"
                class="btn btn-secondary"
                onclick="this.closest('.delete-workspace-dialog').remove(); resolve(false);"
              >
                <span class="btn-icon">❌</span>
                Cancel
              </button>
              <button
                type="button"
                class="btn btn-danger"
                onclick="this.closest('.delete-workspace-dialog').remove(); resolve(true);"
              >
                <span class="btn-icon">🗑️</span>
                Delete Workspace
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(dialog);
      dialog.showModal();

      // Auto-close on overlay click
      dialog.addEventListener("click", (e) => {
        if (e.target === dialog) {
          dialog.remove();
          resolve(false);
        }
      });
    });
  }

  /**
   * Open edit workspace dialog
   * @param {Object} workspace - Workspace to edit
   */
  openEditWorkspaceDialog(workspace) {
    console.log("🔧 Opening edit workspace dialog for:", workspace);
    // Reuse the create workspace dialog but populate with existing data
    const dialog = document.getElementById("create-workspace-dialog");
    if (!dialog) {
      console.error("❌ Edit dialog not found!");
      showErrorMessage("Edit dialog not found");
      return;
    }

    // Update dialog title and button
    const title = dialog.querySelector(".dialog-header h3");
    const submitBtn = dialog.querySelector("#create-workspace-submit-btn");
    const form = dialog.querySelector("#create-workspace-form");

    if (title) title.textContent = "✏️ Edit Workspace";
    if (submitBtn) {
      // Clear the button content first
      submitBtn.innerHTML = "";

      // Create the icon span
      const iconSpan = document.createElement("span");
      iconSpan.className = "btn-icon";
      iconSpan.textContent = "💾";

      // Create the text span
      const textSpan = document.createElement("span");
      textSpan.textContent = "Update Workspace";

      // Add both to the button
      submitBtn.appendChild(iconSpan);
      submitBtn.appendChild(textSpan);
    }

    // Populate form with existing data
    const nameInput = dialog.querySelector("#workspace-name");
    const descInput = dialog.querySelector("#workspace-description");
    const iconInput = dialog.querySelector("#workspace-icon");
    const colorInput = dialog.querySelector("#workspace-color");

    if (nameInput) nameInput.value = workspace.name;
    if (descInput) descInput.value = workspace.description;
    if (iconInput) iconInput.value = workspace.icon;
    if (colorInput) colorInput.value = workspace.color;

    // Add workspace ID to form for update
    form.dataset.workspaceId = workspace.id;
    form.dataset.isEditing = "true";

    // Show dialog
    dialog.showModal();
  }

  /**
   * Create a default workspace when none exist
   */
  async createDefaultWorkspace() {
    const defaultWorkspace = {
      name: "My Workspace",
      description: "Default workspace",
      icon: "🏢",
      color: "#667eea",
    };

    await this.createWorkspace(defaultWorkspace);
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
