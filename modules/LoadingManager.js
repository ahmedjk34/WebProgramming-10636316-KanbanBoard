/**
 * LoadingManager - Comprehensive loading state management
 * Handles full-page loading screens, section loading states, and progress tracking
 */

class LoadingManager {
  constructor() {
    this.isInitialized = false;
    this.loadingSteps = [];
    this.currentStep = 0;
    this.progress = 0;
    this.loadingScreen = null;
    this.sectionLoaders = new Map();
    this.init();
  }

  init() {
    this.createLoadingScreen();
    this.setupEventListeners();
    this.isInitialized = true;
    console.log("🔄 LoadingManager initialized");
  }

  createLoadingScreen() {
    // Create the main loading screen element
    this.loadingScreen = document.createElement("div");
    this.loadingScreen.className = "app-loading-screen";
    this.loadingScreen.innerHTML = `
      <div class="loading-brand">
        <div class="loading-logo">📋</div>
        <h1 class="loading-app-title">Kanban Task Board</h1>
        <p class="loading-subtitle">Web Programming 10636316 Project</p>
      </div>
      
      <div class="loading-spinner"></div>
      
      <div class="loading-progress">
        <div class="loading-progress-bar">
          <div class="loading-progress-fill" style="width: 0%"></div>
        </div>
      </div>
      
      <div class="loading-status">Initializing application...</div>
      
      <div class="loading-steps">
        <div class="loading-step" data-step="auth">
          <div class="loading-step-icon">1</div>
          <div class="loading-step-text">Checking authentication</div>
        </div>
        <div class="loading-step" data-step="modules">
          <div class="loading-step-icon">2</div>
          <div class="loading-step-text">Loading modules</div>
        </div>
        <div class="loading-step" data-step="data">
          <div class="loading-step-icon">3</div>
          <div class="loading-step-text">Loading data</div>
        </div>
        <div class="loading-step" data-step="ui">
          <div class="loading-step-icon">4</div>
          <div class="loading-step-text">Initializing interface</div>
        </div>
        <div class="loading-step" data-step="ready">
          <div class="loading-step-icon">5</div>
          <div class="loading-step-text">Ready to use</div>
        </div>
      </div>
    `;

    // Insert at the beginning of body
    document.body.insertBefore(this.loadingScreen, document.body.firstChild);
  }

  setupEventListeners() {
    // Listen for page visibility changes
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.pauseAnimations();
      } else {
        this.resumeAnimations();
      }
    });

    // Listen for theme changes
    const themeToggle = document.getElementById("theme-toggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        setTimeout(() => {
          this.updateTheme();
        }, 100);
      });
    }
  }

  updateTheme() {
    const isDark = document.body.getAttribute("data-theme") === "dark";
    if (this.loadingScreen) {
      this.loadingScreen.setAttribute("data-theme", isDark ? "dark" : "light");
    }
  }

  pauseAnimations() {
    if (this.loadingScreen) {
      this.loadingScreen.style.animationPlayState = "paused";
    }
  }

  resumeAnimations() {
    if (this.loadingScreen) {
      this.loadingScreen.style.animationPlayState = "running";
    }
  }

  // Start the loading process
  startLoading() {
    if (!this.loadingScreen) {
      this.createLoadingScreen();
    }

    this.currentStep = 0;
    this.progress = 0;
    this.updateProgress(0, "Starting application...");

    // Show first step
    this.updateStep("auth", "active");

    console.log("🚀 Loading process started");
  }

  // Update loading progress
  updateProgress(percentage, status = "") {
    this.progress = Math.min(100, Math.max(0, percentage));

    const progressFill = this.loadingScreen?.querySelector(
      ".loading-progress-fill"
    );
    const statusElement = this.loadingScreen?.querySelector(".loading-status");

    if (progressFill) {
      progressFill.style.width = `${this.progress}%`;
    }

    if (statusElement && status) {
      statusElement.textContent = status;
    }
  }

  // Update loading step
  updateStep(stepName, state = "active") {
    const stepElement = this.loadingScreen?.querySelector(
      `[data-step="${stepName}"]`
    );
    if (!stepElement) return;

    // Remove all states
    stepElement.classList.remove("active", "completed");

    // Add new state
    if (state === "completed") {
      stepElement.classList.add("completed");
      stepElement.querySelector(".loading-step-icon").textContent = "✓";
    } else if (state === "active") {
      stepElement.classList.add("active");
    }
  }

  // Complete a step and move to next
  completeStep(stepName) {
    this.updateStep(stepName, "completed");

    // Calculate progress based on steps
    const steps = ["auth", "modules", "data", "ui", "ready"];
    const currentIndex = steps.indexOf(stepName);
    const progress = ((currentIndex + 1) / steps.length) * 100;

    this.updateProgress(progress, `${stepName} completed`);

    // Move to next step if available
    const nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      setTimeout(() => {
        this.updateStep(steps[nextIndex], "active");
      }, 500);
    }
  }

  // Hide the loading screen
  hideLoadingScreen() {
    if (!this.loadingScreen) return;

    this.loadingScreen.classList.add("fade-out");

    setTimeout(() => {
      if (this.loadingScreen && this.loadingScreen.parentNode) {
        this.loadingScreen.parentNode.removeChild(this.loadingScreen);
        this.loadingScreen = null;
      }
    }, 500);

    console.log("✅ Loading screen hidden");
  }

  // Show section loading
  showSectionLoading(containerId, message = "Loading...") {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Create section loading element
    const loadingElement = document.createElement("div");
    loadingElement.className = "section-loading";
    loadingElement.innerHTML = `
      <div class="section-loading-spinner"></div>
      <div class="section-loading-text">${message}</div>
    `;

    // Store reference
    this.sectionLoaders.set(containerId, loadingElement);

    // Clear container and add loading
    container.innerHTML = "";
    container.appendChild(loadingElement);
  }

  // Hide section loading
  hideSectionLoading(containerId) {
    const loadingElement = this.sectionLoaders.get(containerId);
    if (loadingElement && loadingElement.parentNode) {
      loadingElement.parentNode.removeChild(loadingElement);
      this.sectionLoaders.delete(containerId);
    }
  }

  // Show skeleton loading
  showSkeletonLoading(containerId, skeletonType = "cards", count = 3) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let skeletonHTML = "";

    switch (skeletonType) {
      case "cards":
        for (let i = 0; i < count; i++) {
          skeletonHTML += `
            <div class="skeleton skeleton-card"></div>
          `;
        }
        break;
      case "list":
        for (let i = 0; i < count; i++) {
          skeletonHTML += `
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text short"></div>
            <div class="skeleton skeleton-text medium"></div>
          `;
        }
        break;
      case "table":
        skeletonHTML = `
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text short"></div>
        `;
        break;
      case "kanban":
        skeletonHTML = `
          <div class="kanban-board">
            <div class="kanban-column">
              <div class="column-header">
                <h2 class="column-title">📝 To Do</h2>
              </div>
              <div class="task-list">
                <div class="skeleton skeleton-card"></div>
                <div class="skeleton skeleton-card"></div>
                <div class="skeleton skeleton-card"></div>
              </div>
            </div>
            <div class="kanban-column">
              <div class="column-header">
                <h2 class="column-title">⚡ In Progress</h2>
              </div>
              <div class="task-list">
                <div class="skeleton skeleton-card"></div>
                <div class="skeleton skeleton-card"></div>
              </div>
            </div>
            <div class="kanban-column">
              <div class="column-header">
                <h2 class="column-title">✅ Done</h2>
              </div>
              <div class="task-list">
                <div class="skeleton skeleton-card"></div>
              </div>
            </div>
          </div>
        `;
        break;
    }

    container.innerHTML = skeletonHTML;
  }

  // Show loading for specific sections
  showSectionLoading(containerId, message = "Loading...", type = "spinner") {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (type === "skeleton") {
      this.showSkeletonLoading(containerId, "cards", 3);
      return;
    }

    // Create section loading element
    const loadingElement = document.createElement("div");
    loadingElement.className = "section-loading";
    loadingElement.innerHTML = `
      <div class="section-loading-spinner"></div>
      <div class="section-loading-text">${message}</div>
    `;

    // Store reference
    this.sectionLoaders.set(containerId, loadingElement);

    // Clear container and add loading
    container.innerHTML = "";
    container.appendChild(loadingElement);
  }

  // Show loading for kanban board
  showKanbanLoading() {
    const viewContainer = document.getElementById("view-container");
    if (viewContainer) {
      this.showSkeletonLoading("view-container", "kanban", 1);
    }
  }

  // Show loading for analytics
  showAnalyticsLoading() {
    const analyticsContainer = document.getElementById("analytics-dashboard");
    if (analyticsContainer) {
      this.showSkeletonLoading("analytics-dashboard", "cards", 6);
    }
  }

  // Show loading for teams
  showTeamsLoading() {
    const teamsContainer = document.getElementById("teams-container");
    if (teamsContainer) {
      this.showSkeletonLoading("teams-container", "cards", 4);
    }
  }

  // Simulate loading steps for demo
  simulateLoading() {
    this.startLoading();

    // Simulate authentication check
    setTimeout(() => {
      this.completeStep("auth");
      this.updateProgress(20, "Authentication verified");
    }, 1000);

    // Simulate module loading
    setTimeout(() => {
      this.completeStep("modules");
      this.updateProgress(40, "Modules loaded");
    }, 2000);

    // Simulate data loading
    setTimeout(() => {
      this.completeStep("data");
      this.updateProgress(60, "Data loaded");
    }, 3000);

    // Simulate UI initialization
    setTimeout(() => {
      this.completeStep("ui");
      this.updateProgress(80, "Interface ready");
    }, 4000);

    // Complete loading
    setTimeout(() => {
      this.completeStep("ready");
      this.updateProgress(100, "Application ready!");

      setTimeout(() => {
        this.hideLoadingScreen();
      }, 1000);
    }, 5000);
  }

  // Get loading state
  isLoading() {
    return this.loadingScreen !== null;
  }

  // Get current progress
  getProgress() {
    return this.progress;
  }

  // Get current step
  getCurrentStep() {
    return this.currentStep;
  }

  // Cleanup
  destroy() {
    this.hideLoadingScreen();
    this.sectionLoaders.clear();
    this.isInitialized = false;
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = LoadingManager;
} else {
  window.LoadingManager = LoadingManager;
}
