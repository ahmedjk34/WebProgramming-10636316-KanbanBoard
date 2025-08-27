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
   * Load teams from the API
   */
  async loadTeams() {
    console.log("📋 Loading teams...");

    try {
      if (!this.apiManager) {
        throw new Error("APIManager not available");
      }

      const result = await this.apiManager.getTeams();

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
          <p>Create your first team to start collaborating with others and boost productivity.</p>
          <div class="empty-actions">
            <button class="btn btn-primary" onclick="openCreateTeamDialog()">
              <span class="btn-icon">➕</span>
              Create Team
            </button>
            <button class="btn btn-secondary" onclick="showTeamTemplates()">
              <span class="btn-icon">📋</span>
              View Templates
            </button>
          </div>
        </div>
      `;
      return;
    }

    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();

    this.teams.forEach((team) => {
      const teamCard = this.createTeamCardElement(team);
      fragment.appendChild(teamCard);
    });

    teamsGrid.innerHTML = "";
    teamsGrid.appendChild(fragment);
  }

  /**
   * Create team card element for better performance
   * @param {Object} team - Team object
   * @returns {HTMLElement} Team card element
   */
  createTeamCardElement(team) {
    const card = document.createElement("div");
    card.className = "team-card";
    card.dataset.teamId = team.id;

    const memberCount = team.member_count || team.members?.length || 0;
    const projectCount = team.project_count || 0;
    const workspaceCount = team.workspace_count || 0;

    // Calculate team health score
    const healthScore = this.calculateTeamHealth(team);
    const healthClass = this.getHealthClass(healthScore);

    card.innerHTML = `
      <div class="team-card-header">
        <div class="team-card-icon" style="background: ${
          team.color || "#667eea"
        }">
          ${
            team.avatar_url
              ? `<img src="${team.avatar_url}" alt="${team.name}" />`
              : "👥"
          }
        </div>
        <div class="team-card-info">
          <div class="team-card-name">${this.escapeHtml(team.name)}</div>
          <div class="team-card-description">${this.escapeHtml(
            team.description || "No description"
          )}</div>
          <div class="team-card-meta">
            <div class="team-visibility ${team.visibility || "private"}">
              <span>${team.visibility === "public" ? "🌍" : "🔒"}</span>
              <span>${
                team.visibility === "public" ? "Public" : "Private"
              }</span>
            </div>
            <div class="team-health ${healthClass}">
              <span>${this.getHealthIcon(healthScore)}</span>
              <span>${healthScore}%</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="team-card-stats">
        <div class="stat-item">
          <span class="stat-number">${memberCount}</span>
          <span class="stat-label">Members</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">${projectCount}</span>
          <span class="stat-label">Projects</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">${workspaceCount}</span>
          <span class="stat-label">Workspaces</span>
        </div>
      </div>
      
      <div class="team-card-actions">
        <button class="team-action-btn primary" onclick="teamManager.openTeam(${
          team.id
        })" title="Open Team">
          <span>🚀</span>
          <span>Open</span>
        </button>
        <button class="team-action-btn secondary" onclick="teamManager.editTeam(${
          team.id
        })" title="Edit Team">
          <span>✏️</span>
        </button>
        <button class="team-action-btn danger" onclick="teamManager.deleteTeam(${
          team.id
        })" title="Delete Team">
          <span>🗑️</span>
        </button>
      </div>
    `;

    return card;
  }

  /**
   * Calculate team health score
   * @param {Object} team - Team object
   * @returns {number} Health score (0-100)
   */
  calculateTeamHealth(team) {
    // Enhanced calculation based on multiple factors
    let score = 50; // Base score

    // Member count factor (optimal: 3-8 members)
    const memberCount = team.member_count || team.members?.length || 0;
    if (memberCount >= 3 && memberCount <= 8) {
      score += 20;
    } else if (memberCount > 0) {
      score += 10;
    }

    // Project activity factor
    const projectCount = team.project_count || 0;
    if (projectCount > 0) {
      score += Math.min(projectCount * 5, 20);
    }

    // Workspace organization factor
    const workspaceCount = team.workspace_count || 0;
    if (workspaceCount > 0) {
      score += Math.min(workspaceCount * 3, 10);
    }

    return Math.min(score, 100);
  }

  /**
   * Get health class for styling
   * @param {number} score - Health score
   * @returns {string} Health class
   */
  getHealthClass(score) {
    if (score >= 80) return "excellent";
    if (score >= 60) return "good";
    if (score >= 40) return "fair";
    return "poor";
  }

  /**
   * Get health icon
   * @param {number} score - Health score
   * @returns {string} Health icon
   */
  getHealthIcon(score) {
    if (score >= 80) return "🟢";
    if (score >= 60) return "🟡";
    if (score >= 40) return "🟠";
    return "🔴";
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

      // Add default values if not provided
      const teamDataWithDefaults = {
        name: teamData.name,
        description: teamData.description || "",
        visibility: teamData.visibility || "private",
        color: teamData.color || "#667eea",
        ...teamData,
      };

      const result = await this.apiManager.createTeam(teamDataWithDefaults);

      if (result.success) {
        showSuccessMessage("Team created successfully!");

        // Refresh teams list
        await this.loadTeams();

        // Refresh workspace manager if needed
        if (this.workspaceManager) {
          this.workspaceManager.refreshCurrentWorkspace();
        }

        return result;
      } else {
        throw new Error(result.message || "Failed to create team");
      }
    } catch (error) {
      console.error("❌ Error creating team:", error);
      showErrorMessage("Failed to create team");
      throw error;
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
    document.getElementById("edit-team-color").value = team.color || "#667eea";

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

      // Add default values if not provided
      const teamDataWithDefaults = {
        id: teamData.id,
        name: teamData.name,
        description: teamData.description || "",
        visibility: teamData.visibility || "private",
        color: teamData.color || "#667eea",
        ...teamData,
      };

      const result = await this.apiManager.updateTeam(teamDataWithDefaults);

      if (result.success) {
        showSuccessMessage("Team updated successfully!");

        // Refresh teams list
        await this.loadTeams();

        // Refresh workspace manager if needed
        if (this.workspaceManager) {
          this.workspaceManager.refreshCurrentWorkspace();
        }

        return result;
      } else {
        throw new Error(result.message || "Failed to update team");
      }
    } catch (error) {
      console.error("❌ Error updating team:", error);
      showErrorMessage("Failed to update team");
      throw error;
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

  // ===== ENHANCED UTILITY METHODS =====

  /**
   * Open team workspace
   * @param {number} teamId - Team ID
   */
  async openTeam(teamId) {
    try {
      const team = this.getTeamById(teamId);
      if (!team) {
        throw new Error("Team not found");
      }

      this.currentTeam = team;

      // Switch to team workspace if workspace manager is available
      if (
        this.workspaceManager &&
        typeof this.workspaceManager.switchToTeamWorkspace === "function"
      ) {
        await this.workspaceManager.switchToTeamWorkspace(teamId);
      }

      // Emit team changed event
      this.emitTeamChanged(teamId);

      console.log(`✅ Switched to team: ${team.name}`);
      return team;
    } catch (error) {
      console.error("❌ Error opening team:", error);
      throw error;
    }
  }

  /**
   * Emit team changed event
   * @param {number} teamId - Team ID
   */
  emitTeamChanged(teamId) {
    const event = new CustomEvent("teamChanged", {
      detail: { teamId, team: this.getTeamById(teamId) },
    });
    document.dispatchEvent(event);
  }

  /**
   * Refresh team data
   */
  async refreshTeams() {
    try {
      await this.loadTeams();
      console.log("✅ Teams refreshed successfully");
    } catch (error) {
      console.error("❌ Error refreshing teams:", error);
      throw error;
    }
  }

  /**
   * Get team statistics
   * @returns {Object} Team statistics
   */
  getTeamStatistics() {
    const totalTeams = this.teams.length;
    const totalMembers = this.teams.reduce(
      (sum, team) => sum + (team.member_count || 0),
      0
    );
    const totalProjects = this.teams.reduce(
      (sum, team) => sum + (team.project_count || 0),
      0
    );
    const totalWorkspaces = this.teams.reduce(
      (sum, team) => sum + (team.workspace_count || 0),
      0
    );

    return {
      totalTeams,
      totalMembers,
      totalProjects,
      totalWorkspaces,
      averageTeamHealth: this.calculateAverageTeamHealth(),
    };
  }

  /**
   * Calculate average team health
   * @returns {number} Average health score
   */
  calculateAverageTeamHealth() {
    if (this.teams.length === 0) return 0;

    const totalHealth = this.teams.reduce((sum, team) => {
      return sum + this.calculateTeamHealth(team);
    }, 0);

    return Math.round(totalHealth / this.teams.length);
  }

  /**
   * Search teams
   * @param {string} query - Search query
   * @returns {Array} Filtered teams
   */
  searchTeams(query) {
    if (!query || query.trim() === "") {
      return this.teams;
    }

    const searchTerm = query.toLowerCase().trim();

    return this.teams.filter(
      (team) =>
        team.name.toLowerCase().includes(searchTerm) ||
        team.description?.toLowerCase().includes(searchTerm) ||
        team.members?.some(
          (member) =>
            member.name?.toLowerCase().includes(searchTerm) ||
            member.email?.toLowerCase().includes(searchTerm)
        )
    );
  }

  /**
   * Filter teams by criteria
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered teams
   */
  filterTeams(filters = {}) {
    let filtered = [...this.teams];

    // Status filter
    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter((team) => team.status === filters.status);
    }

    // Visibility filter
    if (filters.visibility && filters.visibility !== "all") {
      filtered = filtered.filter(
        (team) => team.visibility === filters.visibility
      );
    }

    // Role filter
    if (filters.role && filters.role !== "all") {
      filtered = filtered.filter((team) => team.user_role === filters.role);
    }

    // Health filter
    if (filters.health) {
      filtered = filtered.filter((team) => {
        const health = this.calculateTeamHealth(team);
        switch (filters.health) {
          case "excellent":
            return health >= 80;
          case "good":
            return health >= 60 && health < 80;
          case "fair":
            return health >= 40 && health < 60;
          case "poor":
            return health < 40;
          default:
            return true;
        }
      });
    }

    return filtered;
  }

  /**
   * Sort teams
   * @param {string} sortBy - Sort field
   * @param {string} sortOrder - Sort order (asc/desc)
   * @returns {Array} Sorted teams
   */
  sortTeams(sortBy = "name", sortOrder = "asc") {
    const sorted = [...this.teams];

    sorted.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "created_at":
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case "member_count":
          aValue = a.member_count || 0;
          bValue = b.member_count || 0;
          break;
        case "project_count":
          aValue = a.project_count || 0;
          bValue = b.project_count || 0;
          break;
        case "health":
          aValue = this.calculateTeamHealth(a);
          bValue = this.calculateTeamHealth(b);
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }

      if (sortOrder === "desc") {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });

    return sorted;
  }

  /**
   * Export teams data
   * @param {string} format - Export format (json, csv)
   * @returns {string} Exported data
   */
  exportTeams(format = "json") {
    const data = {
      exportDate: new Date().toISOString(),
      teams: this.teams.map((team) => ({
        ...team,
        health_score: this.calculateTeamHealth(team),
      })),
      statistics: this.getTeamStatistics(),
    };

    if (format === "csv") {
      return this.convertToCSV(data.teams);
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * Convert teams data to CSV
   * @param {Array} teams - Teams array
   * @returns {string} CSV string
   */
  convertToCSV(teams) {
    const headers = [
      "Name",
      "Description",
      "Visibility",
      "Members",
      "Projects",
      "Health Score",
    ];
    const rows = teams.map((team) => [
      team.name,
      team.description || "",
      team.visibility || "private",
      team.member_count || 0,
      team.project_count || 0,
      this.calculateTeamHealth(team),
    ]);

    return [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
  }
}

// Export for use in other modules
window.TeamManager = TeamManager;

// Also make it globally available immediately
if (typeof TeamManager !== "undefined") {
  console.log("✅ TeamManager loaded successfully");
}
