/**
 * Team Manager Module
 * Handles all team-related operations including team management, member management, and team workspaces
 */

console.log("📦 Loading TeamManager module...");

class TeamManager {
  constructor(dependencies = {}) {
    this.teams = [];
    this.currentTeam = null;
    this.members = [];
    this.teamWorkspaces = [];

    // Store dependencies
    this.dependencies = dependencies;
    this.apiManager = dependencies.apiManager;
    this.workspaceManager = dependencies.workspaceManager;

    console.log(
      "🔧 TeamManager initialized with dependencies:",
      Object.keys(dependencies)
    );
  }

  // ===== INITIALIZATION =====

  /**
   * Initialize the team manager
   */
  async init() {
    console.log("🚀 Initializing TeamManager...");

    try {
      // Load teams
      await this.loadTeams();

      console.log("✅ TeamManager initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize TeamManager:", error);
    }
  }

  // ===== TEAM MANAGEMENT =====

  /**
   * Load all teams for the current user
   */
  async loadTeams() {
    console.log("📋 Loading teams...");

    try {
      if (!this.apiManager) {
        throw new Error("APIManager not available");
      }

      const result = await this.apiManager.loadTeams();

      if (result.success) {
        this.teams = result.data || [];
        console.log(`✅ Loaded ${this.teams.length} teams`);
        this.displayTeams();
      } else {
        throw new Error(result.message || "Failed to load teams");
      }
    } catch (error) {
      console.error("❌ Error loading teams:", error);
      showErrorMessage("Failed to load teams");
    }
  }

  /**
   * Display teams in the teams grid
   */
  displayTeams() {
    const teamsGrid = document.getElementById("teams-grid");
    if (!teamsGrid) {
      console.warn("⚠️ Teams grid not found");
      return;
    }

    if (this.teams.length === 0) {
      teamsGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">👥</div>
          <h3>No Teams Yet</h3>
          <p>Create your first team to start collaborating with others.</p>
          <button class="btn btn-primary" onclick="openCreateTeamDialog()">
            <span class="btn-icon">➕</span>
            Create Team
          </button>
        </div>
      `;
      return;
    }

    teamsGrid.innerHTML = this.teams
      .map((team) => this.createTeamCard(team))
      .join("");
  }

  /**
   * Create HTML for a team card
   * @param {Object} team - Team object
   * @returns {string} HTML string
   */
  createTeamCard(team) {
    const visibilityIcon = team.visibility === "public" ? "🌍" : "🔒";
    const visibilityText = team.visibility === "public" ? "Public" : "Private";

    return `
      <div class="team-card" data-team-id="${team.id}">
        <div class="team-card-header">
          <div class="team-card-icon">👥</div>
          <div class="team-card-info">
            <div class="team-card-name">${this.escapeHtml(team.name)}</div>
            <div class="team-card-description">${this.escapeHtml(
              team.description || "No description"
            )}</div>
            <div class="team-card-meta">
              <div class="team-visibility ${team.visibility}">
                <span>${visibilityIcon}</span>
                <span>${visibilityText}</span>
              </div>
              <div class="team-member-count">
                <span>👤</span>
                <span>${team.member_count || 0} members</span>
              </div>
            </div>
          </div>
        </div>
        <div class="team-card-actions">
          <button class="team-action-btn edit" onclick="editTeam(${
            team.id
          })" title="Edit Team">
            ✏️
          </button>
          <button class="team-action-btn delete" onclick="deleteTeam(${
            team.id
          })" title="Delete Team">
            🗑️
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Create a new team
   * @param {Object} teamData - Team data
   */
  async createTeam(teamData) {
    console.log("🚀 Creating team:", teamData);

    try {
      if (!this.apiManager) {
        throw new Error("APIManager not available");
      }

      const result = await this.apiManager.createTeam(teamData);

      if (result.success) {
        showSuccessMessage("Team created successfully!");
        closeCreateTeamDialog();

        // Refresh teams list
        await this.loadTeams();

        // Refresh workspace manager if needed
        if (this.workspaceManager) {
          this.workspaceManager.refreshCurrentWorkspace();
        }
      } else {
        throw new Error(result.message || "Failed to create team");
      }
    } catch (error) {
      console.error("❌ Error creating team:", error);
      showErrorMessage("Failed to create team");
    }
  }

  /**
   * Edit an existing team
   * @param {number} teamId - Team ID
   */
  async editTeam(teamId) {
    console.log("✏️ Editing team:", teamId);

    const team = this.teams.find((t) => t.id === teamId);
    if (!team) {
      console.error("❌ Team not found:", teamId);
      return;
    }

    // Populate edit form
    document.getElementById("edit-team-id").value = team.id;
    document.getElementById("edit-team-name").value = team.name;
    document.getElementById("edit-team-description").value =
      team.description || "";
    document.getElementById("edit-team-visibility").value = team.visibility;

    // Show edit dialog
    const dialog = document.getElementById("edit-team-dialog");
    if (dialog) {
      lockScroll();
      dialog.showModal();
    }
  }

  /**
   * Update an existing team
   * @param {Object} teamData - Updated team data
   */
  async updateTeam(teamData) {
    console.log("💾 Updating team:", teamData);

    try {
      if (!this.apiManager) {
        throw new Error("APIManager not available");
      }

      const result = await this.apiManager.updateTeam(teamData);

      if (result.success) {
        showSuccessMessage("Team updated successfully!");
        closeEditTeamDialog();

        // Refresh teams list
        await this.loadTeams();

        // Refresh workspace manager if needed
        if (this.workspaceManager) {
          this.workspaceManager.refreshCurrentWorkspace();
        }
      } else {
        throw new Error(result.message || "Failed to update team");
      }
    } catch (error) {
      console.error("❌ Error updating team:", error);
      showErrorMessage("Failed to update team");
    }
  }

  /**
   * Delete a team
   * @param {number} teamId - Team ID
   */
  async deleteTeam(teamId) {
    console.log("🗑️ Deleting team:", teamId);

    const team = this.teams.find((t) => t.id === teamId);
    if (!team) {
      console.error("❌ Team not found:", teamId);
      return;
    }

    // Show confirmation dialog
    if (
      !confirm(
        `Are you sure you want to delete the team "${team.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      if (!this.apiManager) {
        throw new Error("APIManager not available");
      }

      const result = await this.apiManager.deleteTeam(teamId);

      if (result.success) {
        showSuccessMessage("Team deleted successfully!");

        // Refresh teams list
        await this.loadTeams();

        // Refresh workspace manager if needed
        if (this.workspaceManager) {
          this.workspaceManager.refreshCurrentWorkspace();
        }
      } else {
        throw new Error(result.message || "Failed to delete team");
      }
    } catch (error) {
      console.error("❌ Error deleting team:", error);
      showErrorMessage("Failed to delete team");
    }
  }

  // ===== MEMBER MANAGEMENT =====

  /**
   * Load team members
   * @param {number} teamId - Team ID
   */
  async loadTeamMembers(teamId) {
    console.log("👤 Loading team members for team:", teamId);

    try {
      if (!this.apiManager) {
        throw new Error("APIManager not available");
      }

      // This would need a new API endpoint
      // const result = await this.apiManager.loadTeamMembers(teamId);

      // For now, we'll use mock data
      this.members = [
        {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          role: "admin",
          avatar: "JD",
        },
        {
          id: 2,
          name: "Jane Smith",
          email: "jane@example.com",
          role: "member",
          avatar: "JS",
        },
      ];

      this.displayMembers();
    } catch (error) {
      console.error("❌ Error loading team members:", error);
      showErrorMessage("Failed to load team members");
    }
  }

  /**
   * Display team members
   */
  displayMembers() {
    const membersList = document.getElementById("members-list");
    if (!membersList) {
      console.warn("⚠️ Members list not found");
      return;
    }

    if (this.members.length === 0) {
      membersList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">👤</div>
          <h3>No Members Yet</h3>
          <p>Invite team members to start collaborating.</p>
          <button class="btn btn-primary" onclick="openInviteMemberDialog()">
            <span class="btn-icon">📧</span>
            Invite Member
          </button>
        </div>
      `;
      return;
    }

    membersList.innerHTML = this.members
      .map((member) => this.createMemberItem(member))
      .join("");
  }

  /**
   * Create HTML for a member item
   * @param {Object} member - Member object
   * @returns {string} HTML string
   */
  createMemberItem(member) {
    const roleIcon = member.role === "admin" ? "👑" : "👤";

    return `
      <div class="member-item" data-member-id="${member.id}">
        <div class="member-info">
          <div class="member-avatar">${member.avatar}</div>
          <div class="member-details">
            <div class="member-name">${this.escapeHtml(member.name)}</div>
            <div class="member-email">${this.escapeHtml(member.email)}</div>
          </div>
        </div>
        <div class="member-actions">
          <div class="member-role ${member.role}">
            <span>${roleIcon}</span>
            <span>${member.role}</span>
          </div>
          <button class="member-action-btn remove" onclick="removeMember(${
            member.id
          })" title="Remove Member">
            Remove
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Invite a new member to the team
   * @param {Object} inviteData - Invitation data
   */
  async inviteMember(inviteData) {
    console.log("📧 Inviting member:", inviteData);

    try {
      if (!this.apiManager) {
        throw new Error("APIManager not available");
      }

      // This would need a new API endpoint
      // const result = await this.apiManager.inviteMember(inviteData);

      // For now, show success message
      showSuccessMessage("Invitation sent successfully!");
      closeInviteMemberDialog();

      // Refresh members list
      await this.loadTeamMembers(this.currentTeam?.id);
    } catch (error) {
      console.error("❌ Error inviting member:", error);
      showErrorMessage("Failed to send invitation");
    }
  }

  /**
   * Remove a member from the team
   * @param {number} memberId - Member ID
   */
  async removeMember(memberId) {
    console.log("👤 Removing member:", memberId);

    const member = this.members.find((m) => m.id === memberId);
    if (!member) {
      console.error("❌ Member not found:", memberId);
      return;
    }

    // Show confirmation dialog
    if (
      !confirm(`Are you sure you want to remove ${member.name} from the team?`)
    ) {
      return;
    }

    try {
      if (!this.apiManager) {
        throw new Error("APIManager not available");
      }

      // This would need a new API endpoint
      // const result = await this.apiManager.removeMember(memberId);

      // For now, show success message
      showSuccessMessage("Member removed successfully!");

      // Refresh members list
      await this.loadTeamMembers(this.currentTeam?.id);
    } catch (error) {
      console.error("❌ Error removing member:", error);
      showErrorMessage("Failed to remove member");
    }
  }

  // ===== TEAM WORKSPACES =====

  /**
   * Load team workspaces
   * @param {number} teamId - Team ID
   */
  async loadTeamWorkspaces(teamId) {
    console.log("🗂️ Loading team workspaces for team:", teamId);

    try {
      if (!this.apiManager) {
        throw new Error("APIManager not available");
      }

      // This would need a new API endpoint
      // const result = await this.apiManager.loadTeamWorkspaces(teamId);

      // For now, we'll use mock data
      this.teamWorkspaces = [
        {
          id: 1,
          name: "Development Workspace",
          description: "Main workspace for development tasks",
          visibility: "team",
          project_count: 5,
          task_count: 23,
        },
        {
          id: 2,
          name: "Design Workspace",
          description: "Workspace for design and UI tasks",
          visibility: "team",
          project_count: 3,
          task_count: 12,
        },
      ];

      this.displayTeamWorkspaces();
    } catch (error) {
      console.error("❌ Error loading team workspaces:", error);
      showErrorMessage("Failed to load team workspaces");
    }
  }

  /**
   * Display team workspaces
   */
  displayTeamWorkspaces() {
    const workspacesList = document.getElementById("team-workspaces-list");
    if (!workspacesList) {
      console.warn("⚠️ Team workspaces list not found");
      return;
    }

    if (this.teamWorkspaces.length === 0) {
      workspacesList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🗂️</div>
          <h3>No Workspaces Yet</h3>
          <p>Create a workspace for your team to organize projects and tasks.</p>
          <button class="btn btn-primary" onclick="openCreateTeamWorkspaceDialog()">
            <span class="btn-icon">➕</span>
            Create Workspace
          </button>
        </div>
      `;
      return;
    }

    workspacesList.innerHTML = this.teamWorkspaces
      .map((workspace) => this.createWorkspaceItem(workspace))
      .join("");
  }

  /**
   * Create HTML for a workspace item
   * @param {Object} workspace - Workspace object
   * @returns {string} HTML string
   */
  createWorkspaceItem(workspace) {
    return `
      <div class="team-workspace-item" data-workspace-id="${workspace.id}">
        <div class="workspace-item-info">
          <div class="workspace-item-icon">🗂️</div>
          <div class="workspace-item-details">
            <div class="workspace-item-name">${this.escapeHtml(
              workspace.name
            )}</div>
            <div class="workspace-item-description">${this.escapeHtml(
              workspace.description
            )}</div>
          </div>
        </div>
        <div class="workspace-item-actions">
          <button class="workspace-action-btn open" onclick="openTeamWorkspace(${
            workspace.id
          })" title="Open Workspace">
            Open
          </button>
          <button class="workspace-action-btn delete" onclick="deleteTeamWorkspace(${
            workspace.id
          })" title="Delete Workspace">
            Delete
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Create a new team workspace
   * @param {Object} workspaceData - Workspace data
   */
  async createTeamWorkspace(workspaceData) {
    console.log("🗂️ Creating team workspace:", workspaceData);

    try {
      if (!this.apiManager) {
        throw new Error("APIManager not available");
      }

      const result = await this.apiManager.createTeamWorkspace(workspaceData);

      if (result.success) {
        showSuccessMessage("Team workspace created successfully!");
        closeCreateTeamWorkspaceDialog();

        // Refresh team workspaces list
        await this.loadTeamWorkspaces(this.currentTeam?.id);

        // Refresh workspace manager if needed
        if (this.workspaceManager) {
          this.workspaceManager.refreshCurrentWorkspace();
        }
      } else {
        throw new Error(result.message || "Failed to create team workspace");
      }
    } catch (error) {
      console.error("❌ Error creating team workspace:", error);
      showErrorMessage("Failed to create team workspace");
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Get team by ID
   * @param {number} teamId - Team ID
   * @returns {Object|null} Team object or null
   */
  getTeamById(teamId) {
    return this.teams.find((team) => team.id === teamId) || null;
  }

  /**
   * Get all teams
   * @returns {Array} Array of teams
   */
  getTeams() {
    return this.teams;
  }

  /**
   * Set current team
   * @param {number} teamId - Team ID
   */
  setCurrentTeam(teamId) {
    this.currentTeam = this.getTeamById(teamId);
  }

  /**
   * Get current team
   * @returns {Object|null} Current team object or null
   */
  getCurrentTeam() {
    return this.currentTeam;
  }
}

// Export for use in other modules
window.TeamManager = TeamManager;

// Also make it globally available immediately
if (typeof TeamManager !== "undefined") {
  console.log("✅ TeamManager loaded successfully");
}
