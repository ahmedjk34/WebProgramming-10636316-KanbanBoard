/**
 * Project Manager Module
 * Handles project management, statistics, and project-related functionality
 */

class ProjectManager {
  constructor() {
    this.projects = [];
  }

  // ===== PROJECT DATA MANAGEMENT =====

  /**
   * Set projects data
   * @param {Array} projects - Array of project objects
   */
  setProjects(projects) {
    this.projects = projects;
  }

  /**
   * Get all projects
   * @returns {Array} Array of project objects
   */
  getProjects() {
    return this.projects;
  }

  /**
   * Find project by ID
   * @param {number} projectId - Project ID
   * @returns {Object|null} Project object or null if not found
   */
  findProjectById(projectId) {
    return this.projects.find((project) => project.id == projectId) || null;
  }

  // ===== PROJECT LOADING =====

  /**
   * Load projects from API
   */
  async loadProjects() {
    console.log(
      "📊 Loading projects for workspace:",
      window.apiManager?.getCurrentWorkspaceId()
    );

    try {
      if (window.apiManager) {
        const result = await window.apiManager.loadProjects();

        if (result.success) {
          this.setProjects(result.data.projects);
          this.populateProjectDropdown();
          console.log("✅ Projects loaded:", this.projects.length);
        } else {
          throw new Error(result.message);
        }
      }
    } catch (error) {
      console.error("❌ Error loading projects:", error);
      showErrorMessage("Failed to load projects");
    }
  }

  /**
   * Populate project dropdown in task form
   */
  populateProjectDropdown() {
    const projectSelect = document.getElementById("task-project");
    if (!projectSelect) return;

    // Clear existing options except the first one
    projectSelect.innerHTML = '<option value="">Select a project...</option>';

    // Add project options
    this.projects.forEach((project) => {
      const option = document.createElement("option");
      option.value = project.id;
      option.textContent = project.name;
      option.style.color = project.color;
      projectSelect.appendChild(option);
    });
  }

  // ===== PROJECT GRID MANAGEMENT =====

  /**
   * Load and display projects grid in management dialog
   */
  loadProjectsGrid() {
    console.log("📊 Loading projects grid...");

    const container = document.getElementById("projects-grid");
    if (!container) return;

    // Clear existing content
    container.innerHTML = "";

    // Add "Create New Project" card
    const newProjectCard = this.createNewProjectCard();
    container.appendChild(newProjectCard);

    // Add existing projects
    this.projects.forEach((project) => {
      const projectCard = this.createProjectCard(project);
      container.appendChild(projectCard);
    });
  }

  /**
   * Create new project card
   * @returns {HTMLElement} New project card element
   */
  createNewProjectCard() {
    const card = document.createElement("div");
    card.className = "project-card project-card-new";
    card.innerHTML = `
      <div style="text-align: center; padding: 40px 20px;">
        <div style="font-size: 3rem; margin-bottom: 16px;">➕</div>
        <h4>Create New Project</h4>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">Start organizing your tasks</p>
        <button class="btn btn-primary" onclick="openAddProjectDialog()">
          <span class="btn-icon">🚀</span>
          Get Started
        </button>
      </div>
    `;

    return card;
  }

  /**
   * Create project card
   * @param {Object} project - Project object
   * @returns {HTMLElement} Project card element
   */
  createProjectCard(project) {
    const card = document.createElement("div");
    card.className = "project-card";
    card.style.borderLeft = `4px solid ${project.color}`;

    const statusIcon = getProjectStatusIcon(project.status);
    const totalTasks = project.task_count || 0;
    const completedTasks = project.done_count || 0;
    const progressPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    card.innerHTML = `
      <div class="project-header">
        <h4 style="color: ${project.color};">${project.name}</h4>
        <div class="project-status">
          <span class="status-icon">${statusIcon}</span>
          <span class="status-text">${project.status.replace("_", " ")}</span>
        </div>
      </div>
      
      <div class="project-description">
        ${project.description || "No description provided"}
      </div>
      
      <div class="project-stats">
        <div class="stat-item">
          <span class="stat-label">Total Tasks</span>
          <span class="stat-value">${totalTasks}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Completed</span>
          <span class="stat-value">${completedTasks}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Progress</span>
          <span class="stat-value">${progressPercentage}%</span>
        </div>
      </div>
      
      <div class="project-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progressPercentage}%; background: ${
      project.color
    };"></div>
        </div>
      </div>
      
      <div class="project-actions">
        <button class="btn btn-secondary btn-small" onclick="projectManager.editProject(${
          project.id
        })" title="Edit Project">
          <span class="btn-icon">✏️</span>
          Edit
        </button>
        <button class="btn btn-danger btn-small" onclick="projectManager.deleteProject(${
          project.id
        })" title="Delete Project">
          <span class="btn-icon">🗑️</span>
          Delete
        </button>
      </div>
    `;

    return card;
  }

  // ===== PROJECT STATISTICS =====

  /**
   * Load and display project statistics
   */
  loadProjectStatistics() {
    console.log("📊 Loading project statistics...");

    const container = document.getElementById("statistics-content");
    if (!container) return;

    // Calculate statistics
    const stats = this.calculateProjectStatistics();

    // Display statistics
    container.innerHTML = `
      <div class="statistics-grid">
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-info">
            <div class="stat-number">${stats.totalProjects}</div>
            <div class="stat-label">Total Projects</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-info">
            <div class="stat-number">${stats.completedProjects}</div>
            <div class="stat-label">Completed</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">🚀</div>
          <div class="stat-info">
            <div class="stat-number">${stats.activeProjects}</div>
            <div class="stat-label">Active</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">📋</div>
          <div class="stat-info">
            <div class="stat-number">${stats.totalTasks}</div>
            <div class="stat-label">Total Tasks</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">✔️</div>
          <div class="stat-info">
            <div class="stat-number">${stats.completedTasks}</div>
            <div class="stat-label">Completed Tasks</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-info">
            <div class="stat-number">${stats.completionRate}%</div>
            <div class="stat-label">Completion Rate</div>
          </div>
        </div>
      </div>
      
      <div class="project-breakdown">
        <h4>Project Breakdown</h4>
        <div class="breakdown-list">
          ${this.projects
            .map(
              (project) => `
            <div class="breakdown-item">
              <div class="breakdown-info">
                <div class="breakdown-name" style="color: ${project.color};">${
                project.name
              }</div>
                <div class="breakdown-stats">
                  ${project.task_count || 0} tasks • ${
                project.done_count || 0
              } completed
                </div>
              </div>
              <div class="breakdown-progress">
                <div class="progress-bar small">
                  <div class="progress-fill" style="width: ${
                    project.task_count > 0
                      ? Math.round(
                          (project.done_count / project.task_count) * 100
                        )
                      : 0
                  }%; background: ${project.color};"></div>
                </div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  /**
   * Calculate project statistics
   * @returns {Object} Statistics object
   */
  calculateProjectStatistics() {
    const totalProjects = this.projects.length;
    const completedProjects = this.projects.filter(
      (p) => p.status === "completed"
    ).length;
    const activeProjects = this.projects.filter(
      (p) => p.status === "active"
    ).length;
    const totalTasks = this.projects.reduce(
      (sum, p) => sum + (p.task_count || 0),
      0
    );
    const completedTasks = this.projects.reduce(
      (sum, p) => sum + (p.done_count || 0),
      0
    );
    const completionRate =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalProjects,
      completedProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      completionRate,
    };
  }

  // ===== PROJECT ACTIONS =====

  /**
   * Open add project dialog
   */
  openAddProjectDialog() {
    console.log("➕ Opening add project dialog");

    const dialog = document.getElementById("add-project-dialog");
    if (!dialog) {
      console.error("❌ Add project dialog not found!");
      return;
    }

    // Reset form
    this.resetAddProjectForm();

    // Setup form handlers
    this.setupAddProjectForm();
    this.setupProjectColorPicker();

    // Lock scrolling and show dialog
    lockScroll();
    dialog.showModal();

    console.log("✅ Project dialog opened and form handlers setup");

    // Focus on name field
    setTimeout(() => {
      const nameField = document.getElementById("project-name");
      if (nameField) nameField.focus();
    }, 100);

    // Handle dialog events
    dialog.addEventListener("click", handleDialogClickOutside);
  }

  /**
   * Edit project
   * @param {number} projectId - Project ID
   */
  editProject(projectId) {
    console.log("✏️ Editing project:", projectId);
    // Implementation for editing project
    showSuccessMessage("Project editing feature coming soon!");
  }

  /**
   * Delete project
   * @param {number} projectId - Project ID
   */
  async deleteProject(projectId) {
    console.log("🗑️ Deleting project:", projectId);

    const project = this.findProjectById(projectId);
    if (!project) {
      showErrorMessage("Project not found");
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to delete "${project.name}"? This will also delete all associated tasks.`
    );
    if (!confirmed) return;

    try {
      if (window.apiManager) {
        const result = await window.apiManager.deleteProject(projectId);

        if (result.success) {
          showSuccessMessage("Project deleted successfully!");

          // Refresh projects
          await this.loadProjects();
          this.loadProjectsGrid();

          // Refresh tasks
          if (window.taskManager) {
            await window.taskManager.refreshTasks();
          }
        } else {
          throw new Error(result.message);
        }
      }
    } catch (error) {
      console.error("❌ Error deleting project:", error);
      showErrorMessage("Failed to delete project");
    }
  }

  /**
   * Refresh projects from API
   */
  async refreshProjects() {
    await this.loadProjects();
    this.loadProjectsGrid();
  }

  /**
   * Reset add project form
   */
  resetAddProjectForm() {
    const form = document.getElementById("add-project-form");
    if (form) {
      form.reset();
      const colorField = document.getElementById("add-project-color");
      if (colorField) colorField.value = "#667eea";
    }
  }

  /**
   * Setup add project form
   */
  setupAddProjectForm() {
    const form = document.getElementById("add-project-form");
    if (form) {
      // Create bound handler if not exists
      if (!this.boundAddProjectHandler) {
        this.boundAddProjectHandler = this.handleAddProjectSubmit.bind(this);
      }

      // Remove existing listener to prevent duplicates
      form.removeEventListener("submit", this.boundAddProjectHandler);

      // Add the event listener
      form.addEventListener("submit", this.boundAddProjectHandler);
      console.log("✅ Project form handler setup complete");
    }
  }

  /**
   * Setup project color picker
   */
  setupProjectColorPicker() {
    const colorInput = document.getElementById("add-project-color");
    const colorPresets = document.querySelectorAll(
      "#add-project-dialog .color-preset"
    );

    colorPresets.forEach((preset) => {
      preset.addEventListener("click", () => {
        const color = preset.getAttribute("data-color");
        if (colorInput) colorInput.value = color;
      });
    });
  }

  /**
   * Handle add project form submission
   * @param {Event} e - Form submit event
   */
  async handleAddProjectSubmit(e) {
    e.preventDefault();
    console.log("📝 Project form submitted!", e.target);

    const formData = new FormData(e.target);
    console.log("📝 Form data:", Object.fromEntries(formData));

    const projectData = {
      name: formData.get("name"),
      description: formData.get("description"),
      color: formData.get("color"),
      status: formData.get("status") || "active",
    };

    console.log("📝 Creating project:", projectData);

    try {
      if (window.apiManager) {
        const result = await window.apiManager.createProject(projectData);

        if (result.success) {
          showSuccessMessage(
            "Project created successfully!",
            "Project Created"
          );
          this.closeAddProjectDialog();

          // Refresh projects
          await this.refreshProjects();
        }
      }
    } catch (error) {
      console.error("❌ Error creating project:", error);
      showErrorMessage(
        "Failed to create project. Please try again.",
        "Creation Failed"
      );
    }
  }

  /**
   * Close add project dialog
   */
  closeAddProjectDialog() {
    const dialog = document.getElementById("add-project-dialog");
    if (dialog) {
      dialog.close();
      unlockScroll();
    }
  }
}

// Export for use in other modules
window.ProjectManager = ProjectManager;

// Also make it globally available immediately
if (typeof ProjectManager !== "undefined") {
  console.log("✅ ProjectManager loaded successfully");
}
