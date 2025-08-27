// Enhanced Kanban Board Application - Modular Architecture

class ModuleFactory {
  constructor() {
    this.modules = new Map();
    this.dependencies = new Map();
    this.initialized = new Set();
    this.loading = new Set();
  }

  register(name, moduleClass, dependencies = []) {
    this.modules.set(name, moduleClass);
    this.dependencies.set(name, dependencies);
    console.log(
      `📦 Registered module: ${name} with dependencies: [${dependencies.join(
        ", "
      )}]`
    );
  }

  async get(name) {
    if (this.initialized.has(name)) {
      return this.modules.get(name + "_instance");
    }

    if (this.loading.has(name)) {
      return new Promise((resolve) => {
        const checkLoaded = () => {
          if (this.initialized.has(name)) {
            resolve(this.modules.get(name + "_instance"));
          } else {
            setTimeout(checkLoaded, 10);
          }
        };
        checkLoaded();
      });
    }

    return this.initialize(name);
  }

  async initialize(name) {
    if (this.initialized.has(name)) {
      return this.modules.get(name + "_instance");
    }

    if (!this.modules.has(name)) {
      throw new Error(`Module ${name} not registered`);
    }

    this.loading.add(name);
    console.log(`🔧 Initializing module: ${name}`);

    try {
      const dependencies = this.dependencies.get(name) || [];
      const dependencyInstances = {};

      for (const dep of dependencies) {
        dependencyInstances[dep] = await this.initialize(dep);
      }

      const ModuleClass = this.modules.get(name);
      const instance = new ModuleClass(dependencyInstances);

      this.modules.set(name + "_instance", instance);
      this.initialized.add(name);
      this.loading.delete(name);

      console.log(`✅ Module ${name} initialized successfully`);
      return instance;
    } catch (error) {
      this.loading.delete(name);
      console.error(`❌ Failed to initialize module ${name}:`, error);

      // Fallback: try to create instance without dependencies
      try {
        const ModuleClass = this.modules.get(name);
        const instance = new ModuleClass();
        this.modules.set(name + "_instance", instance);
        this.initialized.add(name);
        this.loading.delete(name);
        console.log(`✅ Module ${name} initialized with fallback`);
        return instance;
      } catch (fallbackError) {
        console.error(
          `❌ Fallback initialization failed for ${name}:`,
          fallbackError
        );
        throw error;
      }
    }
  }

  async initializeAll() {
    const moduleNames = Array.from(this.modules.keys()).filter(
      (name) => !name.endsWith("_instance")
    );
    const instances = {};

    for (const name of moduleNames) {
      instances[name] = await this.get(name);
    }

    return instances;
  }

  areModulesAvailable(requiredModules) {
    return requiredModules.every((name) => typeof window[name] !== "undefined");
  }
}

const moduleFactory = new ModuleFactory();

let currentTheme = localStorage.getItem("theme") || "light";
let currentEditingTaskId = null;

// Workspace Type Management
let currentWorkspaceType = localStorage.getItem("workspaceType") || "personal";
let currentWorkspaceId = localStorage.getItem("currentWorkspaceId") || null;

let apiManager;
let taskManager;
let projectManager;
let workspaceManager;
let teamManager;
let dragDropManager;
let uiManager;
let aiChatManager;

document.addEventListener("DOMContentLoaded", function () {
  console.log("🎨 Enhanced Kanban Board Application Loaded");

  setTimeout(() => {
    console.log("🔍 Checking module availability...");
    registerModules();
    initializeApp();
  }, 100);
});

function registerModules() {
  console.log("📋 Registering modules with factory...");

  const requiredModules = [
    "APIManager",
    "TaskManager",
    "ProjectManager",
    "WorkspaceManager",
    "DragDropManager",
    "UIManager",
    "TeamManager",
    "AIChatManager",
    "TeamCollaborationManager",
    "TeamAnalyticsManager",
  ];

  const missingModules = requiredModules.filter(
    (moduleName) => typeof window[moduleName] === "undefined"
  );

  if (missingModules.length > 0) {
    console.error("❌ Missing modules:", missingModules);
    throw new Error(
      `Required modules not loaded: ${missingModules.join(", ")}`
    );
  }

  moduleFactory.register("apiManager", window.APIManager, []);
  moduleFactory.register("taskManager", window.TaskManager, ["apiManager"]);
  moduleFactory.register("projectManager", window.ProjectManager, [
    "apiManager",
  ]);
  moduleFactory.register("workspaceManager", window.WorkspaceManager, [
    "apiManager",
  ]);
  moduleFactory.register("teamManager", window.TeamManager, [
    "apiManager",
    "workspaceManager",
  ]);
  moduleFactory.register("dragDropManager", window.DragDropManager, [
    "taskManager",
  ]);
  moduleFactory.register("uiManager", window.UIManager, [
    "taskManager",
    "projectManager",
    "workspaceManager",
    "teamManager",
  ]);
  moduleFactory.register("aiChatManager", window.AIChatManager, [
    "taskManager",
    "uiManager",
  ]);
  moduleFactory.register(
    "teamCollaborationManager",
    window.TeamCollaborationManager,
    ["apiManager", "taskManager", "teamManager", "uiManager"]
  );
  moduleFactory.register("teamAnalyticsManager", window.TeamAnalyticsManager, [
    "apiManager",
    "teamManager",
    "uiManager",
  ]);

  console.log("✅ All modules registered successfully");
}

async function initializeApp() {
  console.log("🚀 Initializing Modular Kanban Board...");

  try {
    // Show loading state if function exists
    if (typeof showLoading === "function") {
      showLoading(true);
    }

    const modules = await moduleFactory.initializeAll();

    // Assign modules to global variables for teams app
    window.apiManager = modules.apiManager;
    window.taskManager = modules.taskManager;
    window.projectManager = modules.projectManager;
    window.workspaceManager = modules.workspaceManager;
    window.teamManager = modules.teamManager;
    window.dragDropManager = modules.dragDropManager;
    window.uiManager = modules.uiManager;
    window.aiChatManager = modules.aiChatManager;
    window.teamCollaborationManager = modules.teamCollaborationManager;
    window.teamAnalyticsManager = modules.teamAnalyticsManager;

    // Verify that modules are properly instantiated
    console.log("🔍 Verifying module instances:", {
      apiManager: typeof window.apiManager?.getTeams === "function",
      taskManager: typeof window.taskManager?.refreshTasks === "function",
      workspaceManager:
        typeof window.workspaceManager?.loadWorkspaces === "function",
      uiManager: typeof window.uiManager?.setupEventListeners === "function",
      teamManager: typeof window.teamManager?.loadTeams === "function",
      teamCollaborationManager:
        typeof window.teamCollaborationManager?.init === "function",
      teamAnalyticsManager:
        typeof window.teamAnalyticsManager?.init === "function",
    });

    console.log("✅ Global module variables assigned:", {
      apiManager: !!window.apiManager,
      taskManager: !!window.taskManager,
      workspaceManager: !!window.workspaceManager,
      uiManager: !!window.uiManager,
      teamManager: !!window.teamManager,
      teamCollaborationManager: !!window.teamCollaborationManager,
      teamAnalyticsManager: !!window.teamAnalyticsManager,
    });

    // Also assign to local variables for backward compatibility
    apiManager = modules.apiManager;
    taskManager = modules.taskManager;
    projectManager = modules.projectManager;
    workspaceManager = modules.workspaceManager;
    teamManager = modules.teamManager;
    dragDropManager = modules.dragDropManager;
    uiManager = modules.uiManager;
    aiChatManager = modules.aiChatManager;
    teamCollaborationManager = modules.teamCollaborationManager;
    teamAnalyticsManager = modules.teamAnalyticsManager;

    // Initialize workspace type system
    initializeWorkspaceTypeSystem();

    await workspaceManager.loadWorkspaces();

    await Promise.all([
      projectManager.loadProjects(),
      taskManager.refreshTasks(),
    ]);

    uiManager.setupEventListeners();
    dragDropManager.initializeDragAndDrop();
    taskManager.setupTaskFormHandling();

    // Hide loading state if function exists
    if (typeof showLoading === "function") {
      showLoading(false);
    }

    console.log("🎉 Modular Kanban Board initialized successfully");

    if (typeof addWelcomeAnimation === "function") {
      addWelcomeAnimation();
    }
  } catch (error) {
    console.error("❌ Failed to initialize Kanban Board:", error);
    if (typeof showError === "function") {
      showError("Failed to load data. Please refresh the page.");
    }
    if (typeof showLoading === "function") {
      showLoading(false);
    }

    console.log("🔄 Attempting fallback initialization...");
    initializeFallbackMode();

    // Also try to create basic module instances directly
    try {
      console.log("🔄 Creating basic module instances...");
      if (window.APIManager && !window.apiManager) {
        window.apiManager = new window.APIManager();
        console.log("✅ Created basic APIManager instance");
      }
      if (window.TaskManager && !window.taskManager) {
        window.taskManager = new window.TaskManager();
        console.log("✅ Created basic TaskManager instance");
      }
      if (window.WorkspaceManager && !window.workspaceManager) {
        window.workspaceManager = new window.WorkspaceManager();
        console.log("✅ Created basic WorkspaceManager instance");
      }
      if (window.UIManager && !window.uiManager) {
        window.uiManager = new window.UIManager();
        console.log("✅ Created basic UIManager instance");
      }
      if (window.TeamManager && !window.teamManager) {
        window.teamManager = new window.TeamManager();
        console.log("✅ Created basic TeamManager instance");
      }
      if (window.TeamCollaborationManager && !window.teamCollaborationManager) {
        window.teamCollaborationManager = new window.TeamCollaborationManager();
        console.log("✅ Created basic TeamCollaborationManager instance");
      }
      if (window.TeamAnalyticsManager && !window.teamAnalyticsManager) {
        window.teamAnalyticsManager = new window.TeamAnalyticsManager();
        console.log("✅ Created basic TeamAnalyticsManager instance");
      }
    } catch (fallbackError) {
      console.error("❌ Fallback module creation failed:", fallbackError);
    }
  }
}

function initializeModules() {
  console.log("🔧 Initializing modules...");

  const requiredModules = [
    "APIManager",
    "TaskManager",
    "ProjectManager",
    "WorkspaceManager",
    "DragDropManager",
    "UIManager",
  ];

  const missingModules = requiredModules.filter(
    (moduleName) => typeof window[moduleName] === "undefined"
  );

  if (missingModules.length > 0) {
    console.error("❌ Missing modules:", missingModules);
    console.log(
      "🔍 Available window properties:",
      Object.keys(window).filter((key) => key.includes("Manager"))
    );

    console.log("⏳ Retrying module initialization in 500ms...");
    setTimeout(() => {
      try {
        initializeModules();
      } catch (retryError) {
        console.error("❌ Retry failed, falling back to basic functionality");
        initializeFallbackMode();
      }
    }, 500);
    return;
  }

  try {
    console.log("📦 Creating APIManager...");
    apiManager = new window.APIManager();

    console.log("📦 Creating TaskManager...");
    taskManager = new window.TaskManager();

    console.log("📦 Creating ProjectManager...");
    projectManager = new window.ProjectManager();

    console.log("📦 Creating WorkspaceManager...");
    workspaceManager = new window.WorkspaceManager();

    console.log("📦 Creating DragDropManager...");
    dragDropManager = new window.DragDropManager();

    console.log("📦 Creating UIManager...");
    uiManager = new window.UIManager();

    window.apiManager = apiManager;
    window.taskManager = taskManager;
    window.projectManager = projectManager;
    window.workspaceManager = workspaceManager;
    window.dragDropManager = dragDropManager;
    window.uiManager = uiManager;

    console.log("✅ All modules initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing modules:", error);
    console.log("🔄 Falling back to basic functionality...");
    initializeFallbackMode();
  }
}

function initializeFallbackMode() {
  console.log("🔄 Initializing fallback mode...");

  window.apiManager = {
    loadWorkspaces: async () => ({
      success: false,
      message: "Module not loaded",
    }),
    loadProjects: async () => ({
      success: false,
      message: "Module not loaded",
    }),
    loadTasks: async () => ({ success: false, message: "Module not loaded" }),
  };

  window.taskManager = {
    refreshTasks: async () => console.log("TaskManager not available"),
    setupTaskFormHandling: () => console.log("TaskManager not available"),
  };

  window.projectManager = {
    loadProjects: async () => console.log("ProjectManager not available"),
  };

  window.workspaceManager = {
    loadWorkspaces: async () => console.log("WorkspaceManager not available"),
    openSidebar: () => console.log("WorkspaceManager not available"),
    closeSidebar: () => console.log("WorkspaceManager not available"),
  };

  window.dragDropManager = {
    initializeDragAndDrop: () => console.log("DragDropManager not available"),
  };

  window.uiManager = {
    setupEventListeners: () => console.log("UIManager not available"),
    openTaskModal: () => console.log("UIManager not available"),
    openDeleteModal: () => console.log("UIManager not available"),
  };

  window.aiChatManager = {
    open: () => console.log("AIChatManager not available"),
    close: () => console.log("AIChatManager not available"),
  };

  console.log("⚠️ Running in fallback mode - some features may not work");
}

function toggleThemeWrapper() {
  console.log("🎨 Toggling theme from:", currentTheme);
  currentTheme = toggleTheme(currentTheme);
  console.log("🎨 Theme toggled to:", currentTheme);
}

// Backward compatibility functions

function openSidebar() {
  if (window.workspaceManager) {
    window.workspaceManager.openSidebar();
  }
}

function closeSidebar() {
  if (window.workspaceManager) {
    window.workspaceManager.closeSidebar();
  }
}

function openCreateWorkspaceDialog() {
  if (window.workspaceManager) {
    window.workspaceManager.openCreateWorkspaceDialog();
  }
}

function closeCreateWorkspaceDialog() {
  if (window.workspaceManager) {
    window.workspaceManager.closeCreateWorkspaceDialog();
  }
}

function editTask(taskId) {
  if (window.uiManager) {
    window.uiManager.openTaskModal(taskId);
  }
}

function deleteTask(taskId) {
  if (window.uiManager) {
    window.uiManager.openDeleteModal(taskId);
  }
}

function openTaskModal(taskId = null) {
  if (window.uiManager) {
    window.uiManager.openTaskModal(taskId);
  }
}

function closeTaskDialog() {
  if (window.uiManager) {
    window.uiManager.closeTaskDialog();
  }
}

function closeDeleteDialog() {
  if (window.uiManager) {
    window.uiManager.closeDeleteDialog();
  }
}

function openProjectManagementDialog() {
  if (window.uiManager) {
    window.uiManager.openProjectManagementDialog();
  }
}

function closeProjectManagementDialog() {
  if (window.uiManager) {
    window.uiManager.closeProjectManagementDialog();
  }
}

function openAddProjectDialog() {
  if (window.projectManager) {
    window.projectManager.openAddProjectDialog();
  }
}

function closeAddProjectDialog() {
  if (window.projectManager) {
    window.projectManager.closeAddProjectDialog();
  }
}

function filterTasks() {
  const projectFilter = document.getElementById("project-filter");
  const priorityFilter = document.getElementById("priority-filter");

  const projectId = projectFilter ? projectFilter.value : "";
  const priority = priorityFilter ? priorityFilter.value : "";

  if (window.taskManager) {
    window.taskManager.filterTasks(projectId, priority);
  }
}

console.log("🗂️ Kanban Board Application");
console.log("📚 Course: Web Programming 10636316");
console.log("🏫 University: An-Najah National University");
console.log("🔧 Tech Stack: HTML5, CSS3, JavaScript, PHP, MySQL");
console.log("📅 Version: 1.0.0 - Modular Architecture");

window.testModal = function () {
  console.log("🧪 Testing modal system...");
  if (window.uiManager) {
    window.uiManager.openTaskModal();
  }
};

window.testDialog = window.testModal;

window.openTaskDialog = openTaskModal;
window.closeTaskModal = closeTaskDialog;
window.openDeleteModal = deleteTask;
window.closeDeleteModal = closeDeleteDialog;

function switchWorkspace(workspaceId) {
  if (window.workspaceManager) {
    window.workspaceManager.switchWorkspace(workspaceId);
  }
}

function confirmDeleteTask(taskId) {
  if (window.uiManager) {
    window.uiManager.confirmDeleteTask(taskId);
  }
}

window.switchWorkspace = switchWorkspace;
window.confirmDeleteTask = confirmDeleteTask;

// Workspace Type Switching Functions
function switchWorkspaceType(type) {
  console.log(`🔄 Switching to ${type} workspace type`);

  // Update current workspace type
  currentWorkspaceType = type;
  localStorage.setItem("workspaceType", type);

  // Update UI tabs
  updateWorkspaceTypeTabs(type);

  // Update sidebar
  updateSidebarForWorkspaceType(type);

  // Load appropriate workspaces
  loadWorkspacesForType(type);

  // Update header controls
  updateHeaderControlsForType(type);

  // Refresh current view
  if (window.workspaceManager) {
    window.workspaceManager.refreshCurrentWorkspace();
  }
}

function updateWorkspaceTypeTabs(type) {
  // Update main header tabs
  const personalTab = document.getElementById("personal-tab");
  const teamsTab = document.getElementById("teams-tab");
  const sidebarPersonalTab = document.getElementById("sidebar-personal-tab");
  const sidebarTeamsTab = document.getElementById("sidebar-teams-tab");

  if (personalTab && teamsTab) {
    personalTab.classList.toggle("active", type === "personal");
    teamsTab.classList.toggle("active", type === "teams");
  }

  if (sidebarPersonalTab && sidebarTeamsTab) {
    sidebarPersonalTab.classList.toggle("active", type === "personal");
    sidebarTeamsTab.classList.toggle("active", type === "teams");
  }
}

function updateSidebarForWorkspaceType(type) {
  const teamSections = document.getElementById("team-sections");
  const createWorkspaceBtn = document.getElementById("create-workspace-btn");
  const sidebarTitle = document.getElementById("sidebar-title");
  const workspacesSectionTitle = document.getElementById(
    "workspaces-section-title"
  );

  if (teamSections) {
    teamSections.style.display = type === "teams" ? "block" : "none";
  }

  if (createWorkspaceBtn) {
    const btnText = createWorkspaceBtn.querySelector(".btn-text");
    if (btnText) {
      btnText.textContent =
        type === "teams" ? "New Team Workspace" : "New Workspace";
    }
  }

  if (sidebarTitle) {
    sidebarTitle.textContent =
      type === "teams" ? "👥 Teams & Workspaces" : "🏢 Workspaces";
  }

  if (workspacesSectionTitle) {
    workspacesSectionTitle.textContent =
      type === "teams" ? "Team Workspaces" : "Switch Workspace";
  }
}

function updateHeaderControlsForType(type) {
  const teamControls = document.getElementById("team-controls");

  if (teamControls) {
    teamControls.style.display = type === "teams" ? "flex" : "none";
  }
}

function loadWorkspacesForType(type) {
  if (window.workspaceManager) {
    window.workspaceManager.loadWorkspacesForType(type);
  }
}

// Team Management Functions
function openCreateTeamDialog() {
  if (window.uiManager) {
    window.uiManager.openCreateTeamDialog();
  }
}

function openTeamManagementDialog() {
  if (window.uiManager) {
    window.uiManager.openTeamManagementDialog();
  }
}

function closeCreateTeamDialog() {
  if (window.uiManager) {
    window.uiManager.closeCreateTeamDialog();
  }
}

function closeTeamManagementDialog() {
  if (window.uiManager) {
    window.uiManager.closeTeamManagementDialog();
  }
}

function closeEditTeamDialog() {
  if (window.uiManager) {
    window.uiManager.closeEditTeamDialog();
  }
}

function closeInviteMemberDialog() {
  if (window.uiManager) {
    window.uiManager.closeInviteMemberDialog();
  }
}

function closeCreateTeamWorkspaceDialog() {
  if (window.uiManager) {
    window.uiManager.closeCreateTeamWorkspaceDialog();
  }
}

function editTeam(teamId) {
  if (window.teamManager) {
    window.teamManager.editTeam(teamId);
  }
}

function deleteTeam(teamId) {
  if (window.teamManager) {
    window.teamManager.deleteTeam(teamId);
  }
}

function removeMember(memberId) {
  if (window.teamManager) {
    window.teamManager.removeMember(memberId);
  }
}

function openInviteMemberDialog() {
  if (window.uiManager) {
    window.uiManager.openInviteMemberDialog();
  }
}

function openCreateTeamWorkspaceDialog() {
  if (window.uiManager) {
    window.uiManager.openCreateTeamWorkspaceDialog();
  }
}

function openTeamWorkspace(workspaceId) {
  // This would switch to the team workspace
  console.log("Opening team workspace:", workspaceId);
  // Implementation would depend on workspace switching logic
}

function deleteTeamWorkspace(workspaceId) {
  // This would delete the team workspace
  console.log("Deleting team workspace:", workspaceId);
  // Implementation would depend on workspace deletion logic
}

// Team Collaboration Functions
function refreshTeamActivity() {
  if (window.teamCollaborationManager) {
    window.teamCollaborationManager.loadTeamActivity(
      window.teamCollaborationManager.teamId
    );
  }
}

function openTeamAnalyticsDialog() {
  if (window.uiManager) {
    window.uiManager.openTeamAnalyticsDialog();
  }
}

function closeTeamAnalyticsDialog() {
  if (window.uiManager) {
    window.uiManager.closeTeamAnalyticsDialog();
  }
}

function refreshTeamAnalytics() {
  if (window.teamAnalyticsManager) {
    window.teamAnalyticsManager.loadTeamAnalytics(
      window.teamAnalyticsManager.currentTeamId
    );
  }
}

function exportTeamAnalytics(format) {
  if (window.teamAnalyticsManager) {
    window.teamAnalyticsManager.exportAnalytics(format);
  }
}

// Make functions globally available
window.switchWorkspaceType = switchWorkspaceType;
window.openCreateTeamDialog = openCreateTeamDialog;
window.openTeamManagementDialog = openTeamManagementDialog;
window.closeCreateTeamDialog = closeCreateTeamDialog;
window.closeTeamManagementDialog = closeTeamManagementDialog;
window.closeEditTeamDialog = closeEditTeamDialog;
window.closeInviteMemberDialog = closeInviteMemberDialog;
window.closeCreateTeamWorkspaceDialog = closeCreateTeamWorkspaceDialog;
window.editTeam = editTeam;
window.deleteTeam = deleteTeam;
window.removeMember = removeMember;
window.openInviteMemberDialog = openInviteMemberDialog;
window.openCreateTeamWorkspaceDialog = openCreateTeamWorkspaceDialog;
window.openTeamWorkspace = openTeamWorkspace;
window.deleteTeamWorkspace = deleteTeamWorkspace;
window.refreshTeamActivity = refreshTeamActivity;
window.openTeamAnalyticsDialog = openTeamAnalyticsDialog;
window.closeTeamAnalyticsDialog = closeTeamAnalyticsDialog;
window.refreshTeamAnalytics = refreshTeamAnalytics;
window.exportTeamAnalytics = exportTeamAnalytics;

// Utility functions for loading and error states
function showLoading(show = true) {
  const loadingElement = document.getElementById("loading-overlay");
  if (loadingElement) {
    loadingElement.style.display = show ? "flex" : "none";
  }
}

function showError(message) {
  console.error("❌ Error:", message);
  // You can implement a proper error display here
}

function showErrorMessage(message) {
  console.error("❌ Error:", message);
  // You can implement a proper error display here
}

function addWelcomeAnimation() {
  // Welcome animation implementation
  console.log("🎉 Welcome animation triggered");
}

// Initialize workspace type system
function initializeWorkspaceTypeSystem() {
  console.log("🔧 Initializing workspace type system...");

  // Set initial workspace type
  const savedType = localStorage.getItem("workspaceType") || "personal";
  currentWorkspaceType = savedType;

  // Update UI to reflect current type
  updateWorkspaceTypeTabs(savedType);
  updateSidebarForWorkspaceType(savedType);
  updateHeaderControlsForType(savedType);

  // Load workspaces for current type
  if (window.workspaceManager) {
    window.workspaceManager.loadWorkspacesForType(savedType);
  }

  console.log(`✅ Workspace type system initialized with type: ${savedType}`);
}
