/**
 * Project Manager Module
 * Handles project management, statistics, and project-related functionality
 */

console.log("📦 Loading ProjectManager module...");

class ProjectManager {
  constructor(dependencies = {}) {
    this.projects = [];

    // Store dependencies
    this.dependencies = dependencies;
    this.apiManager = dependencies.apiManager;

    console.log(
      "🔧 ProjectManager initialized with dependencies:",
      Object.keys(dependencies)
    );
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
      this.apiManager?.getCurrentWorkspaceId()
    );

    try {
      if (this.apiManager) {
        const result = await this.apiManager.loadProjects();

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
    card.style.cursor = "pointer";
    card.onclick = () => openAddProjectDialog();
    card.innerHTML = `
      <div style="text-align: center; padding: 40px 20px;">
        <div style="font-size: 3rem; margin-bottom: 16px;">➕</div>
        <h4>Create New Project</h4>
        <p style="color: var(--text-secondary);">Click to start organizing your tasks</p>
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

    // Enhanced color scheme with gradients and better visual appeal
    const projectColors = this.getProjectColors(project);

    card.style.borderLeft = `4px solid ${projectColors.primary}`;
    card.style.background = `linear-gradient(135deg, ${projectColors.background}, ${projectColors.backgroundLight})`;

    const statusIcon = getProjectStatusIcon(project.status);
    const totalTasks = project.task_count || 0;
    const completedTasks = project.done_count || 0;
    const progressPercentage =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    card.innerHTML = `
      <div class="project-header">
        <h4 style="color: ${
          projectColors.primary
        }; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">${project.name}</h4>
        <div class="project-status">
          <span class="status-icon" style="color: ${
            projectColors.accent
          };">${statusIcon}</span>
          <span class="status-text" style="color: ${projectColors.text};">${
      project.status ? project.status.replace("_", " ") : "Active"
    }</span>
        </div>
      </div>
      
      <div class="project-description" style="color: ${
        projectColors.textSecondary
      };">
        ${project.description || "No description provided"}
      </div>
      
      <div class="project-stats">
        <div class="stat-item">
          <span class="stat-label" style="color: ${
            projectColors.textSecondary
          };">Total Tasks</span>
          <span class="stat-value" style="color: ${
            projectColors.primary
          }; font-weight: 600;">${totalTasks}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label" style="color: ${
            projectColors.textSecondary
          };">Completed</span>
          <span class="stat-value" style="color: ${
            projectColors.success
          }; font-weight: 600;">${completedTasks}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label" style="color: ${
            projectColors.textSecondary
          };">Progress</span>
          <span class="stat-value" style="color: ${
            projectColors.accent
          }; font-weight: 600;">${progressPercentage}%</span>
        </div>
      </div>
      
      <div class="project-progress">
        <div class="progress-bar" style="background: ${
          projectColors.progressBg
        };">
          <div class="progress-fill" style="width: ${progressPercentage}%; background: linear-gradient(90deg, ${
      projectColors.primary
    }, ${projectColors.accent}); box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
        </div>
      </div>
      
      <div class="project-actions">
        <button class="btn btn-secondary btn-small" onclick="openEditProjectDialog(${
          project.id
        })" title="Edit Project" style="background: ${
      projectColors.buttonBg
    }; color: ${projectColors.buttonText}; border-color: ${
      projectColors.buttonBorder
    };">
          <span class="btn-icon">✏️</span>
          Edit
        </button>
        <button class="btn btn-danger btn-small" onclick="openDeleteProjectDialog(${
          project.id
        })" title="Delete Project">
          <span class="btn-icon">🗑️</span>
          Delete
        </button>
      </div>
    `;

    return card;
  }

  /**
   * Get enhanced color scheme for project cards
   * @param {Object} project - Project object
   * @returns {Object} Color scheme object
   */
  getProjectColors(project) {
    // Define beautiful color schemes for different project types/statuses
    const colorSchemes = {
      // Modern Blue Theme
      blue: {
        primary: "#3B82F6",
        accent: "#60A5FA",
        background: "#F8FAFC",
        backgroundLight: "#FFFFFF",
        text: "#1E293B",
        textSecondary: "#64748B",
        success: "#10B981",
        progressBg: "#E2E8F0",
        buttonBg: "#F1F5F9",
        buttonText: "#475569",
        buttonBorder: "#CBD5E1",
      },
      // Vibrant Purple Theme
      purple: {
        primary: "#8B5CF6",
        accent: "#A78BFA",
        background: "#FAF5FF",
        backgroundLight: "#FFFFFF",
        text: "#1E1B4B",
        textSecondary: "#6B7280",
        success: "#10B981",
        progressBg: "#F3E8FF",
        buttonBg: "#F5F3FF",
        buttonText: "#5B21B6",
        buttonBorder: "#DDD6FE",
      },
      // Warm Orange Theme
      orange: {
        primary: "#F59E0B",
        accent: "#FBBF24",
        background: "#FFFBEB",
        backgroundLight: "#FFFFFF",
        text: "#451A03",
        textSecondary: "#92400E",
        success: "#10B981",
        progressBg: "#FEF3C7",
        buttonBg: "#FEF3C7",
        buttonText: "#D97706",
        buttonBorder: "#FDE68A",
      },
      // Fresh Green Theme
      green: {
        primary: "#10B981",
        accent: "#34D399",
        background: "#ECFDF5",
        backgroundLight: "#FFFFFF",
        text: "#064E3B",
        textSecondary: "#065F46",
        success: "#059669",
        progressBg: "#D1FAE5",
        buttonBg: "#D1FAE5",
        buttonText: "#047857",
        buttonBorder: "#A7F3D0",
      },
      // Elegant Pink Theme
      pink: {
        primary: "#EC4899",
        accent: "#F472B6",
        background: "#FDF2F8",
        backgroundLight: "#FFFFFF",
        text: "#831843",
        textSecondary: "#BE185D",
        success: "#10B981",
        progressBg: "#FCE7F3",
        buttonBg: "#FCE7F3",
        buttonText: "#BE185D",
        buttonBorder: "#FBCFE8",
      },
      // Professional Gray Theme
      gray: {
        primary: "#6B7280",
        accent: "#9CA3AF",
        background: "#F9FAFB",
        backgroundLight: "#FFFFFF",
        text: "#374151",
        textSecondary: "#6B7280",
        success: "#10B981",
        progressBg: "#F3F4F6",
        buttonBg: "#F3F4F6",
        buttonText: "#4B5563",
        buttonBorder: "#D1D5DB",
      },
    };

    // Determine color scheme based on project properties
    let schemeKey = "blue"; // default

    if (project.color) {
      // Map existing colors to new schemes
      const colorMap = {
        "#667eea": "blue",
        "#f093fb": "pink",
        "#4facfe": "blue",
        "#43e97b": "green",
        "#fa709a": "pink",
        "#667eea": "purple",
        "#764ba2": "purple",
      };
      schemeKey = colorMap[project.color.toLowerCase()] || "blue";
    } else if (project.status) {
      // Map status to color schemes
      const statusMap = {
        active: "blue",
        completed: "green",
        paused: "orange",
        cancelled: "gray",
      };
      schemeKey = statusMap[project.status] || "blue";
    }

    return colorSchemes[schemeKey];
  }

  // ===== PROJECT STATISTICS =====

  /**
   * Load and display project statistics
   */
  loadProjectStatistics() {
    console.log("📊 Loading project statistics...");

    // Calculate statistics
    const stats = this.calculateProjectStatistics();

    // Update individual stat elements
    const totalProjectsEl = document.getElementById("total-projects");
    const completedProjectsEl = document.getElementById("completed-projects");
    const activeProjectsEl = document.getElementById("active-projects");
    const totalTasksEl = document.getElementById("total-tasks-stat");

    if (totalProjectsEl) totalProjectsEl.textContent = stats.totalProjects;
    if (completedProjectsEl)
      completedProjectsEl.textContent = stats.completedProjects;
    if (activeProjectsEl) activeProjectsEl.textContent = stats.activeProjects;
    if (totalTasksEl) totalTasksEl.textContent = stats.totalTasks;

    // Add additional statistics cards if they don't exist
    const statisticsGrid = document.querySelector(
      "#statistics-tab .statistics-grid"
    );
    if (statisticsGrid) {
      // Check if additional cards already exist
      let completedTasksCard = document.getElementById("completed-tasks-stat");
      let completionRateCard = document.getElementById("completion-rate-stat");

      // Add completed tasks card if it doesn't exist
      if (!completedTasksCard) {
        const completedTasksCardHtml = `
          <div class="stat-card">
            <div class="stat-icon">✔️</div>
            <div class="stat-content">
              <div class="stat-number" id="completed-tasks-stat">${stats.completedTasks}</div>
              <div class="stat-label">Completed Tasks</div>
            </div>
          </div>
        `;
        statisticsGrid.insertAdjacentHTML("beforeend", completedTasksCardHtml);
      } else {
        completedTasksCard.textContent = stats.completedTasks;
      }

      // Add completion rate card if it doesn't exist
      if (!completionRateCard) {
        const completionRateCardHtml = `
          <div class="stat-card">
            <div class="stat-icon">📈</div>
            <div class="stat-content">
              <div class="stat-number" id="completion-rate-stat">${stats.completionRate}%</div>
              <div class="stat-label">Completion Rate</div>
            </div>
          </div>
        `;
        statisticsGrid.insertAdjacentHTML("beforeend", completionRateCardHtml);
      } else {
        completionRateCard.textContent = `${stats.completionRate}%`;
      }
    }

    // Add project breakdown section
    const statisticsTab = document.getElementById("statistics-tab");
    if (statisticsTab) {
      // Remove existing breakdown if it exists
      const existingBreakdown =
        statisticsTab.querySelector(".project-breakdown");
      if (existingBreakdown) {
        existingBreakdown.remove();
      }

      // Add project breakdown
      const breakdownHtml = `
        <div class="project-breakdown">
          <h4>Project Breakdown</h4>
          <div class="breakdown-list">
            ${this.projects
              .map(
                (project) => `
              <div class="breakdown-item">
                <div class="breakdown-info">
                  <div class="breakdown-name" style="color: ${
                    project.color
                  };">${project.name}</div>
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
      statisticsTab.insertAdjacentHTML("beforeend", breakdownHtml);
    }

    console.log("✅ Project statistics updated:", stats);
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
    this.openEditProjectDialog(projectId);
  }

  /**
   * Open edit project dialog
   * @param {number} projectId - Project ID
   */
  openEditProjectDialog(projectId) {
    console.log("✏️ Opening edit project dialog for:", projectId);

    const project = this.findProjectById(projectId);
    if (!project) {
      showErrorMessage("Project not found");
      return;
    }

    // Populate form with project data
    const form = document.getElementById("edit-project-form");
    if (form) {
      document.getElementById("edit-project-id").value = project.id;
      document.getElementById("edit-project-name").value = project.name;
      document.getElementById("edit-project-description").value =
        project.description || "";
      document.getElementById("edit-project-color").value =
        project.color || "#667eea";
      document.getElementById("edit-project-status").value =
        project.status || "active";
    }

    // Setup form handlers
    this.setupEditProjectForm();
    this.setupEditProjectColorPicker();

    // Show dialog
    const dialog = document.getElementById("edit-project-dialog");
    if (dialog) {
      lockScroll();
      dialog.showModal();
      dialog.addEventListener("click", handleDialogClickOutside);

      // Focus on name field
      setTimeout(() => {
        const nameField = document.getElementById("edit-project-name");
        if (nameField) nameField.focus();
      }, 100);
    }

    console.log("✅ Edit project dialog opened");
  }

  /**
   * Close edit project dialog
   */
  closeEditProjectDialog() {
    const dialog = document.getElementById("edit-project-dialog");
    if (dialog) {
      dialog.close();
      unlockScroll();
    }
  }

  /**
   * Setup edit project form
   */
  setupEditProjectForm() {
    const form = document.getElementById("edit-project-form");
    if (form) {
      // Create bound handler if not exists
      if (!this.boundEditProjectHandler) {
        this.boundEditProjectHandler = this.handleEditProjectSubmit.bind(this);
      }

      // Remove existing listener to prevent duplicates
      form.removeEventListener("submit", this.boundEditProjectHandler);

      // Add the event listener
      form.addEventListener("submit", this.boundEditProjectHandler);
      console.log("✅ Edit project form handler setup complete");
    }
  }

  /**
   * Setup edit project color picker
   */
  setupEditProjectColorPicker() {
    const colorInput = document.getElementById("edit-project-color");
    const colorPresets = document.querySelectorAll(
      "#edit-project-dialog .color-preset"
    );

    colorPresets.forEach((preset) => {
      preset.addEventListener("click", () => {
        const color = preset.getAttribute("data-color");
        if (colorInput) colorInput.value = color;
      });
    });
  }

  /**
   * Handle edit project form submission
   * @param {Event} e - Form submit event
   */
  async handleEditProjectSubmit(e) {
    e.preventDefault();
    console.log("📝 Edit project form submitted!");

    const formData = new FormData(e.target);
    const projectData = {
      id: formData.get("id"),
      name: formData.get("name"),
      description: formData.get("description"),
      color: formData.get("color"),
      status: formData.get("status") || "active",
    };

    console.log("📝 Updating project:", projectData);

    try {
      if (this.apiManager) {
        const result = await this.apiManager.updateProject(projectData);

        if (result.success) {
          showSuccessMessage("Project updated successfully!");
          this.closeEditProjectDialog();

          // Refresh projects
          await this.refreshProjects();
        } else {
          throw new Error(result.message);
        }
      }
    } catch (error) {
      console.error("❌ Error updating project:", error);
      showErrorMessage("Failed to update project. Please try again.");
    }
  }

  /**
   * Delete project
   * @param {number} projectId - Project ID
   */
  async deleteProject(projectId) {
    console.log("🗑️ Deleting project:", projectId);
    this.openDeleteProjectDialog(projectId);
  }

  /**
   * Open delete project dialog
   * @param {number} projectId - Project ID
   */
  openDeleteProjectDialog(projectId) {
    console.log("🗑️ Opening delete project dialog for:", projectId);

    const project = this.findProjectById(projectId);
    if (!project) {
      showErrorMessage("Project not found");
      return;
    }

    // Store project ID for confirmation
    this.projectToDelete = projectId;

    // Update dialog content
    const projectNameElement = document.getElementById("delete-project-name");
    if (projectNameElement) {
      projectNameElement.textContent = project.name;
    }

    // Show dialog
    const dialog = document.getElementById("delete-project-dialog");
    if (dialog) {
      lockScroll();
      dialog.showModal();
      dialog.addEventListener("click", handleDialogClickOutside);
    }

    console.log("✅ Delete project dialog opened");
  }

  /**
   * Close delete project dialog
   */
  closeDeleteProjectDialog() {
    const dialog = document.getElementById("delete-project-dialog");
    if (dialog) {
      dialog.close();
      unlockScroll();
    }
    this.projectToDelete = null;
  }

  /**
   * Confirm delete project
   */
  async confirmDeleteProject() {
    if (!this.projectToDelete) {
      showErrorMessage("No project selected for deletion");
      return;
    }

    const projectId = this.projectToDelete;
    console.log("🗑️ Confirming deletion of project:", projectId);

    try {
      if (this.apiManager) {
        const result = await this.apiManager.deleteProject(projectId);

        if (result.success) {
          showSuccessMessage("Project deleted successfully!");
          this.closeDeleteProjectDialog();

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
      if (this.apiManager) {
        const result = await this.apiManager.createProject(projectData);

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
