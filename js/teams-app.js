/**
 * Teams Application Manager
 * Main JavaScript controller for the teams page with enhanced features,
 * performance optimizations, and modern UI interactions
 */

console.log("🚀 Initializing Teams Application...");

class TeamsApp {
  constructor() {
    this.currentTeam = null;
    this.teams = [];
    this.members = [];
    this.workspaces = [];
    this.analytics = null;
    this.collaboration = null;

    // Performance tracking
    this.lastUpdate = Date.now();
    this.updateThrottle = 1000; // 1 second throttle

    // UI state
    this.isLoading = false;
    this.currentView = "overview";
    this.filters = {
      search: "",
      status: "all",
      role: "all",
    };

    // Event listeners
    this.eventListeners = new Map();

    // Initialize managers
    this.initializeManagers();
  }

  // ===== INITIALIZATION =====

  /**
   * Initialize all team managers
   */
  async initializeManagers() {
    try {
      console.log("🔧 Initializing team managers...");

      // Initialize core managers
      this.teamManager = new TeamManager({
        apiManager: window.apiManager,
        workspaceManager: window.workspaceManager,
      });

      this.collaboration = new TeamCollaborationManager({
        apiManager: window.apiManager,
        taskManager: window.taskManager,
        teamManager: this.teamManager,
        uiManager: window.uiManager,
      });

      this.analytics = new TeamAnalyticsManager({
        apiManager: window.apiManager,
        teamManager: this.teamManager,
        uiManager: window.uiManager,
      });

      // Initialize all managers
      await Promise.all([
        this.teamManager.init(),
        this.collaboration.init(),
        this.analytics.init(),
      ]);

      console.log("✅ All team managers initialized successfully");

      // Setup event listeners
      this.setupEventListeners();

      // Load initial data
      await this.loadInitialData();
    } catch (error) {
      console.error("❌ Failed to initialize team managers:", error);
      this.showErrorMessage("Failed to initialize team features");
    }
  }

  /**
   * Load initial team data
   */
  async loadInitialData() {
    try {
      this.setLoading(true);

      // Load teams
      await this.loadTeams();

      // Update statistics
      this.updateStatistics();

      // Setup real-time updates
      this.setupRealTimeUpdates();
    } catch (error) {
      console.error("❌ Error loading initial data:", error);
      this.showErrorMessage("Failed to load team data");
    } finally {
      this.setLoading(false);
    }
  }

  // ===== TEAM MANAGEMENT =====

  /**
   * Load all teams
   */
  async loadTeams() {
    try {
      console.log("🔄 Loading teams...");

      if (!this.teamManager) {
        console.error("❌ TeamManager not initialized!");
        return;
      }

      const result = await this.teamManager.loadTeams();
      console.log("📊 Teams load result:", result);

      this.teams = this.teamManager.getTeams();
      console.log("👥 Teams loaded:", this.teams);

      // Update UI
      this.displayTeams();
      this.updateTeamCount();

      return result;
    } catch (error) {
      console.error("❌ Error loading teams:", error);
      throw error;
    }
  }

  /**
   * Display teams in the grid
   */
  displayTeams() {
    const teamsGrid = document.getElementById("teams-grid");
    if (!teamsGrid) return;

    if (this.teams.length === 0) {
      teamsGrid.innerHTML = this.createEmptyState();
      return;
    }

    // Apply filters
    const filteredTeams = this.filterTeams();

    teamsGrid.innerHTML = filteredTeams
      .map((team) => this.createTeamCard(team))
      .join("");

    // Add click handlers
    this.addTeamCardHandlers();
  }

  /**
   * Create team card HTML with enhanced features
   */
  createTeamCard(team) {
    const memberCount = team.member_count || team.members?.length || 0;
    const projectCount = team.project_count || 0;
    const workspaceCount = team.workspace_count || 0;

    // Calculate team health score
    const healthScore = this.calculateTeamHealth(team);
    const healthClass = this.getHealthClass(healthScore);

    return `
      <div class="team-card" data-team-id="${team.id}">
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
          <button class="team-action-btn primary" onclick="teamsApp.openTeam(${
            team.id
          })" title="Open Team">
            <span>🚀</span>
            <span>Open</span>
          </button>
          <button class="team-action-btn secondary" onclick="teamsApp.editTeam(${
            team.id
          })" title="Edit Team">
            <span>✏️</span>
          </button>
          <button class="team-action-btn danger" onclick="teamsApp.deleteTeam(${
            team.id
          })" title="Delete Team">
            <span>🗑️</span>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Calculate team health score
   */
  calculateTeamHealth(team) {
    // Mock calculation - in real app, this would use actual metrics
    const baseScore = 75;
    const memberBonus = Math.min((team.member_count || 0) * 2, 10);
    const projectBonus = Math.min((team.project_count || 0) * 3, 15);

    return Math.min(baseScore + memberBonus + projectBonus, 100);
  }

  /**
   * Get health class for styling
   */
  getHealthClass(score) {
    if (score >= 80) return "excellent";
    if (score >= 60) return "good";
    if (score >= 40) return "fair";
    return "poor";
  }

  /**
   * Get health icon
   */
  getHealthIcon(score) {
    if (score >= 80) return "🟢";
    if (score >= 60) return "🟡";
    if (score >= 40) return "🟠";
    return "🔴";
  }

  /**
   * Create empty state HTML
   */
  createEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-icon">👥</div>
        <h3>No Teams Yet</h3>
        <p>Create your first team to start collaborating with others and boost productivity.</p>
        <div class="empty-actions">
          <button class="btn btn-primary" onclick="teamsApp.openCreateTeamDialog()">
            <span class="btn-icon">➕</span>
            Create Team
          </button>
          <button class="btn btn-secondary" onclick="teamsApp.showTeamTemplates()">
            <span class="btn-icon">📋</span>
            View Templates
          </button>
        </div>
      </div>
    `;
  }

  // ===== TEAM ACTIONS =====

  /**
   * Open team workspace
   */
  async openTeam(teamId) {
    try {
      this.setLoading(true);

      const team = this.teams.find((t) => t.id === teamId);
      if (!team) {
        throw new Error("Team not found");
      }

      // Set current team
      this.currentTeam = team;

      // Switch to team workspace
      if (window.workspaceManager) {
        await window.workspaceManager.switchToTeamWorkspace(teamId);
      }

      // Load team analytics
      await this.analytics.loadTeamAnalytics(teamId);

      // Update UI
      this.updateTeamView();

      // Show success message
      this.showSuccessMessage(`Switched to ${team.name}`);
    } catch (error) {
      console.error("❌ Error opening team:", error);
      this.showErrorMessage("Failed to open team");
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Edit team
   */
  async editTeam(teamId) {
    try {
      const team = this.teams.find((t) => t.id === teamId);
      if (!team) {
        throw new Error("Team not found");
      }

      // Populate edit form
      this.populateEditForm(team);

      // Show edit dialog
      this.showEditDialog();
    } catch (error) {
      console.error("❌ Error editing team:", error);
      this.showErrorMessage("Failed to edit team");
    }
  }

  /**
   * Delete team
   */
  async deleteTeam(teamId) {
    try {
      const team = this.teams.find((t) => t.id === teamId);
      if (!team) {
        throw new Error("Team not found");
      }

      // Show confirmation dialog
      if (
        !confirm(
          `Are you sure you want to delete "${team.name}"? This action cannot be undone.`
        )
      ) {
        return;
      }

      this.setLoading(true);

      // Delete team
      await this.teamManager.deleteTeam(teamId);

      // Refresh teams list
      await this.loadTeams();

      this.showSuccessMessage("Team deleted successfully");
    } catch (error) {
      console.error("❌ Error deleting team:", error);
      this.showErrorMessage("Failed to delete team");
    } finally {
      this.setLoading(false);
    }
  }

  // ===== DIALOG MANAGEMENT =====

  /**
   * Open create team dialog
   */
  openCreateTeamDialog() {
    const dialog = document.getElementById("create-team-dialog");
    if (dialog) {
      this.lockScroll();
      dialog.showModal();
    }
  }

  /**
   * Close create team dialog
   */
  closeCreateTeamDialog() {
    const dialog = document.getElementById("create-team-dialog");
    if (dialog) {
      dialog.close();
      this.unlockScroll();
    }
  }

  /**
   * Show edit dialog
   */
  showEditDialog() {
    const dialog = document.getElementById("edit-team-dialog");
    if (dialog) {
      this.lockScroll();
      dialog.showModal();
    }
  }

  /**
   * Close edit dialog
   */
  closeEditDialog() {
    const dialog = document.getElementById("edit-team-dialog");
    if (dialog) {
      dialog.close();
      this.unlockScroll();
    }
  }

  /**
   * Populate edit form
   */
  populateEditForm(team) {
    document.getElementById("edit-team-id").value = team.id;
    document.getElementById("edit-team-name").value = team.name;
    document.getElementById("edit-team-description").value =
      team.description || "";
    document.getElementById("edit-team-visibility").value =
      team.visibility || "private";
  }

  // ===== FILTERING & SEARCH =====

  /**
   * Filter teams based on current filters
   */
  filterTeams() {
    let filtered = [...this.teams];

    // Search filter
    if (this.filters.search) {
      const searchTerm = this.filters.search.toLowerCase();
      filtered = filtered.filter(
        (team) =>
          team.name.toLowerCase().includes(searchTerm) ||
          team.description?.toLowerCase().includes(searchTerm)
      );
    }

    // Status filter
    if (this.filters.status !== "all") {
      filtered = filtered.filter((team) => team.status === this.filters.status);
    }

    // Role filter
    if (this.filters.role !== "all") {
      filtered = filtered.filter(
        (team) => team.user_role === this.filters.role
      );
    }

    return filtered;
  }

  /**
   * Update search filter
   */
  updateSearchFilter(searchTerm) {
    this.filters.search = searchTerm;
    this.displayTeams();
  }

  /**
   * Update status filter
   */
  updateStatusFilter(status) {
    this.filters.status = status;
    this.displayTeams();
  }

  /**
   * Update role filter
   */
  updateRoleFilter(role) {
    this.filters.role = role;
    this.displayTeams();
  }

  // ===== STATISTICS & ANALYTICS =====

  /**
   * Update team statistics
   */
  updateStatistics() {
    const totalTeams = this.teams.length;
    const totalMembers = this.teams.reduce(
      (sum, team) => sum + (team.member_count || 0),
      0
    );
    const activeProjects = this.teams.reduce(
      (sum, team) => sum + (team.project_count || 0),
      0
    );

    // Update stat elements
    this.updateStatElement("total-teams", totalTeams);
    this.updateStatElement("total-members", totalMembers);
    this.updateStatElement("active-projects", activeProjects);
  }

  /**
   * Update a single stat element
   */
  updateStatElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = value;
    }
  }

  /**
   * Update team count
   */
  updateTeamCount() {
    const count = this.teams.length;
    const countElement = document.querySelector(".teams-count");
    if (countElement) {
      countElement.textContent = `${count} team${count !== 1 ? "s" : ""}`;
    }
  }

  // ===== REAL-TIME UPDATES =====

  /**
   * Setup real-time updates
   */
  setupRealTimeUpdates() {
    // Listen for team updates
    this.collaboration.on("teamUpdate", (update) => {
      this.handleTeamUpdate(update);
    });

    // Setup periodic refresh
    setInterval(() => {
      this.refreshTeamData();
    }, 30000); // Refresh every 30 seconds
  }

  /**
   * Handle team updates
   */
  handleTeamUpdate(update) {
    console.log("📡 Received team update:", update);

    // Update relevant data
    switch (update.type) {
      case "team_created":
      case "team_updated":
      case "team_deleted":
        this.loadTeams();
        break;
      case "member_joined":
      case "member_left":
        this.updateStatistics();
        break;
      default:
        // Handle other updates
        break;
    }
  }

  /**
   * Refresh team data
   */
  async refreshTeamData() {
    try {
      await this.loadTeams();
      this.updateStatistics();
    } catch (error) {
      console.error("❌ Error refreshing team data:", error);
    }
  }

  // ===== UI HELPERS =====

  /**
   * Set loading state
   */
  setLoading(loading) {
    this.isLoading = loading;
    const loader = document.getElementById("teams-loader");
    if (loader) {
      loader.style.display = loading ? "block" : "none";
    }
  }

  /**
   * Update team view
   */
  updateTeamView() {
    // Update current team display
    if (this.currentTeam) {
      const currentTeamElement = document.getElementById("current-team");
      if (currentTeamElement) {
        currentTeamElement.innerHTML = `
          <div class="current-team-info">
            <div class="current-team-icon" style="background: ${
              this.currentTeam.color || "#667eea"
            }">
              ${
                this.currentTeam.avatar_url
                  ? `<img src="${this.currentTeam.avatar_url}" alt="${this.currentTeam.name}" />`
                  : "👥"
              }
            </div>
            <div class="current-team-details">
              <div class="current-team-name">${this.currentTeam.name}</div>
              <div class="current-team-description">${
                this.currentTeam.description || ""
              }</div>
            </div>
          </div>
        `;
      }
    }
  }

  /**
   * Add team card event handlers
   */
  addTeamCardHandlers() {
    const teamCards = document.querySelectorAll(".team-card");
    teamCards.forEach((card) => {
      // Add hover effects
      card.addEventListener("mouseenter", () => {
        card.classList.add("hover");
      });

      card.addEventListener("mouseleave", () => {
        card.classList.remove("hover");
      });

      // Add click handler for card body
      const cardBody = card.querySelector(".team-card-header");
      if (cardBody) {
        cardBody.addEventListener("click", (e) => {
          if (!e.target.closest(".team-card-actions")) {
            const teamId = parseInt(card.dataset.teamId);
            this.openTeam(teamId);
          }
        });
      }
    });
  }

  // ===== UTILITY METHODS =====

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Lock scroll when dialog is open
   */
  lockScroll() {
    document.body.style.overflow = "hidden";
  }

  /**
   * Unlock scroll when dialog is closed
   */
  unlockScroll() {
    document.body.style.overflow = "";
  }

  /**
   * Show success message
   */
  showSuccessMessage(message) {
    if (typeof showSuccessMessage === "function") {
      showSuccessMessage(message);
    } else {
      console.log(`✅ ${message}`);
    }
  }

  /**
   * Show error message
   */
  showErrorMessage(message) {
    if (typeof showErrorMessage === "function") {
      showErrorMessage(message);
    } else {
      console.error(`❌ ${message}`);
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById("teams-search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.updateSearchFilter(e.target.value);
      });
    }

    // Filter buttons
    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const filterType = e.target.dataset.filter;
        const filterValue = e.target.dataset.value;

        // Update active filter
        filterButtons.forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");

        // Apply filter
        if (filterType === "status") {
          this.updateStatusFilter(filterValue);
        } else if (filterType === "role") {
          this.updateRoleFilter(filterValue);
        }
      });
    });

    // Form submissions
    const createForm = document.getElementById("create-team-form");
    if (createForm) {
      createForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleCreateTeam();
      });
    }

    const editForm = document.getElementById("edit-team-form");
    if (editForm) {
      editForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleEditTeam();
      });
    }

    // Invite member form
    const inviteForm = document.getElementById("invite-member-form");
    if (inviteForm) {
      inviteForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleInviteMember();
      });
    }
  }

  /**
   * Handle create team form submission
   */
  async handleCreateTeam() {
    try {
      const formData = new FormData(
        document.getElementById("create-team-form")
      );
      const teamData = {
        name: formData.get("name"),
        description: formData.get("description"),
        visibility: formData.get("visibility"),
      };

      await this.teamManager.createTeam(teamData);
      this.closeCreateTeamDialog();
    } catch (error) {
      console.error("❌ Error creating team:", error);
      this.showErrorMessage("Failed to create team");
    }
  }

  /**
   * Handle edit team form submission
   */
  async handleEditTeam() {
    try {
      const formData = new FormData(document.getElementById("edit-team-form"));
      const teamData = {
        id: formData.get("id"),
        name: formData.get("name"),
        description: formData.get("description"),
        visibility: formData.get("visibility"),
        color: formData.get("color"),
      };

      await this.teamManager.updateTeam(teamData);
      this.closeEditDialog();
    } catch (error) {
      console.error("❌ Error updating team:", error);
      this.showErrorMessage("Failed to update team");
    }
  }

  // ===== MEMBER MANAGEMENT =====

  /**
   * Open invite member dialog
   */
  openInviteMemberDialog() {
    const dialog = document.getElementById("invite-member-dialog");
    if (dialog) {
      this.lockScroll();
      dialog.showModal();
    }
  }

  /**
   * Handle invite member form submission
   */
  async handleInviteMember() {
    try {
      const formData = new FormData(
        document.getElementById("invite-member-form")
      );
      const inviteData = {
        email: formData.get("email"),
        role: formData.get("role"),
        message: formData.get("message"),
        teamId: this.currentTeam?.id,
      };

      await this.teamManager.inviteMember(inviteData);
      this.closeInviteMemberDialog();
    } catch (error) {
      console.error("❌ Error inviting member:", error);
      this.showErrorMessage("Failed to invite member");
    }
  }

  /**
   * Close invite member dialog
   */
  closeInviteMemberDialog() {
    const dialog = document.getElementById("invite-member-dialog");
    if (dialog) {
      dialog.close();
      this.unlockScroll();
    }
  }

  // ===== ENHANCED FEATURES =====

  /**
   * Show team templates
   */
  showTeamTemplates() {
    const templates = [
      {
        name: "Development Team",
        description: "Perfect for software development projects",
        icon: "💻",
        color: "#3b82f6",
        features: ["Code review workflow", "Sprint planning", "Bug tracking"],
      },
      {
        name: "Design Team",
        description: "Ideal for creative design projects",
        icon: "🎨",
        color: "#8b5cf6",
        features: ["Design reviews", "Asset management", "Client feedback"],
      },
      {
        name: "Marketing Team",
        description: "Great for marketing campaigns",
        icon: "📢",
        color: "#10b981",
        features: [
          "Campaign planning",
          "Content calendar",
          "Analytics tracking",
        ],
      },
    ];

    // Create templates dialog
    const templatesHTML = templates
      .map(
        (template) => `
      <div class="team-template" data-template="${template.name
        .toLowerCase()
        .replace(" ", "-")}">
        <div class="template-icon" style="background: ${template.color}">${
          template.icon
        }</div>
        <div class="template-info">
          <h4>${template.name}</h4>
          <p>${template.description}</p>
          <div class="template-features">
            ${template.features
              .map((feature) => `<span class="feature-tag">${feature}</span>`)
              .join("")}
          </div>
        </div>
        <button class="btn btn-primary" onclick="teamsApp.useTemplate('${
          template.name
        }')">
          Use Template
        </button>
      </div>
    `
      )
      .join("");

    // Show templates in a modal
    const modal = document.createElement("div");
    modal.className = "templates-modal";
    modal.innerHTML = `
      <div class="templates-content">
        <div class="templates-header">
          <h3>🎯 Team Templates</h3>
          <button onclick="this.closest('.templates-modal').remove()">×</button>
        </div>
        <div class="templates-grid">
          ${templatesHTML}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  /**
   * Use team template
   */
  useTemplate(templateName) {
    const templates = {
      "Development Team": {
        name: "Development Team",
        description: "Software development and engineering projects",
        color: "#3b82f6",
        visibility: "private",
      },
      "Design Team": {
        name: "Design Team",
        description: "Creative design and UX projects",
        color: "#8b5cf6",
        visibility: "private",
      },
      "Marketing Team": {
        name: "Marketing Team",
        description: "Marketing campaigns and content creation",
        color: "#10b981",
        visibility: "private",
      },
    };

    const template = templates[templateName];
    if (template) {
      // Populate create team form with template data
      document.getElementById("team-name").value = template.name;
      document.getElementById("team-description").value = template.description;
      document.getElementById("team-color").value = template.color;
      document.getElementById("team-visibility").value = template.visibility;

      // Close templates modal and open create team dialog
      document.querySelector(".templates-modal")?.remove();
      this.openCreateTeamDialog();
    }
  }

  /**
   * Export team data
   */
  exportTeamData(format = "json") {
    if (!this.currentTeam) {
      this.showErrorMessage("No team selected for export");
      return;
    }

    const data = {
      team: this.currentTeam,
      exportDate: new Date().toISOString(),
      statistics: this.getTeamStatistics(),
    };

    let content, filename, mimeType;

    if (format === "csv") {
      content = this.convertToCSV([this.currentTeam]);
      filename = `${this.currentTeam.name}_data.csv`;
      mimeType = "text/csv";
    } else {
      content = JSON.stringify(data, null, 2);
      filename = `${this.currentTeam.name}_data.json`;
      mimeType = "application/json";
    }

    // Download file
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showSuccessMessage(`Team data exported as ${format.toUpperCase()}`);
  }

  /**
   * Convert team data to CSV
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

  /**
   * Get team statistics
   */
  getTeamStatistics() {
    return {
      totalTeams: this.teams.length,
      totalMembers: this.teams.reduce(
        (sum, team) => sum + (team.member_count || 0),
        0
      ),
      totalProjects: this.teams.reduce(
        (sum, team) => sum + (team.project_count || 0),
        0
      ),
      averageHealth:
        this.teams.length > 0
          ? Math.round(
              this.teams.reduce(
                (sum, team) => sum + this.calculateTeamHealth(team),
                0
              ) / this.teams.length
            )
          : 0,
    };
  }
}

// Initialize Teams App when DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
  try {
    console.log("🚀 Starting Teams Application...");

    // Check authentication first
    console.log("🔐 Checking authentication status...");
    const authResponse = await fetch("php/api/auth/check_auth.php");
    const authResult = await authResponse.json();
    console.log("🔐 Auth result:", authResult);

    if (!authResult.success || !authResult.authenticated) {
      console.error("❌ User not authenticated, redirecting to login");
      window.location.href = "login.html";
      return;
    }

    console.log("✅ User authenticated:", authResult.data?.user);

    // Wait for main app modules to be initialized
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait

    while (attempts < maxAttempts) {
      if (
        window.apiManager &&
        window.workspaceManager &&
        window.taskManager &&
        window.uiManager
      ) {
        console.log("✅ Main app modules are ready");
        break;
      }

      console.log(
        `⏳ Waiting for main app modules... (attempt ${
          attempts + 1
        }/${maxAttempts})`
      );
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    if (attempts >= maxAttempts) {
      console.error("❌ Timeout waiting for main app modules");
      throw new Error("Main app modules not available");
    }

    // Initialize the teams app
    window.teamsApp = new TeamsApp();
    await window.teamsApp.initializeManagers();

    console.log("✅ Teams Application initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Teams Application:", error);
  }
});

// Global functions for HTML onclick handlers
window.openCreateTeamDialog = () => {
  if (window.teamsApp) {
    window.teamsApp.openCreateTeamDialog();
  }
};

window.closeCreateTeamDialog = () => {
  if (window.teamsApp) {
    window.teamsApp.closeCreateTeamDialog();
  }
};

window.openTeamAnalyticsDialog = () => {
  if (window.teamsApp && window.teamsApp.analytics) {
    // Open analytics dialog
    console.log("Opening team analytics dialog");
  }
};

window.refreshTeamActivity = () => {
  if (window.teamsApp) {
    window.teamsApp.refreshTeamData();
  }
};

// ===== GLOBAL DIALOG FUNCTIONS =====

window.closeCreateTeamDialog = () => {
  if (window.teamsApp) {
    window.teamsApp.closeCreateTeamDialog();
  }
};

window.closeEditTeamDialog = () => {
  if (window.teamsApp) {
    window.teamsApp.closeEditDialog();
  }
};

window.closeInviteMemberDialog = () => {
  const dialog = document.getElementById("invite-member-dialog");
  if (dialog) {
    dialog.close();
    document.body.style.overflow = "";
  }
};

window.closeTeamAnalyticsDialog = () => {
  const dialog = document.getElementById("team-analytics-dialog");
  if (dialog) {
    dialog.close();
    document.body.style.overflow = "";
  }
};

window.exportTeamAnalytics = (format) => {
  if (window.teamsApp && window.teamsApp.analytics) {
    window.teamsApp.analytics.exportAnalytics(format);
  }
};

window.showTeamTemplates = () => {
  if (window.teamsApp) {
    window.teamsApp.showTeamTemplates();
  }
};

// Additional global functions for team management
window.openCreateTeamDialog = () => {
  if (window.teamsApp) {
    window.teamsApp.openCreateTeamDialog();
  }
};

window.openEditTeamDialog = (teamId) => {
  if (window.teamsApp) {
    window.teamsApp.editTeam(teamId);
  }
};

window.openInviteMemberDialog = () => {
  if (window.teamsApp) {
    window.teamsApp.openInviteMemberDialog();
  }
};

window.openTeamAnalyticsDialog = () => {
  if (window.teamsApp && window.teamsApp.analytics) {
    // Open analytics dialog
    const dialog = document.getElementById("team-analytics-dialog");
    if (dialog) {
      dialog.showModal();
      document.body.style.overflow = "hidden";
    }
  }
};

window.refreshTeamActivity = () => {
  if (window.teamsApp) {
    window.teamsApp.refreshTeamData();
  }
};

// Make TeamsApp class globally available immediately
window.TeamsApp = TeamsApp;

console.log("✅ Teams Application loaded successfully");
