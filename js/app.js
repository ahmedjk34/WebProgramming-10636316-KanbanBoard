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

// Initialize theme on page load
if (typeof initializeTheme === "function") {
  initializeTheme(currentTheme);
}

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

  // Initialize theme immediately
  if (typeof initializeTheme === "function") {
    initializeTheme(currentTheme);
  } else {
    // Fallback theme initialization
    document.documentElement.setAttribute("data-theme", currentTheme);
    const themeIcon = document.getElementById("theme-icon");
    if (themeIcon) {
      themeIcon.textContent = currentTheme === "light" ? "🌙" : "☀️";
    }
  }

  // Setup basic event listeners immediately (fallback)
  setupBasicEventListeners();

  // Update user info
  updateUserInfo();

  setTimeout(() => {
    console.log("🔍 Checking module availability...");
    try {
      registerModules();
      initializeApp();
    } catch (error) {
      console.error(
        "❌ Module initialization failed, using fallback mode:",
        error
      );
      initializeFallbackMode();
    }
  }, 100);
});

function setupBasicEventListeners() {
  console.log("🎧 Setting up basic event listeners...");

  // Theme toggle
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      console.log("🎨 Theme toggle clicked!");
      if (window.toggleThemeWrapper) {
        window.toggleThemeWrapper();
      } else {
        // Fallback theme toggle
        const currentTheme = localStorage.getItem("theme") || "light";
        const newTheme = currentTheme === "light" ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);

        const themeIcon = document.getElementById("theme-icon");
        if (themeIcon) {
          themeIcon.textContent = newTheme === "light" ? "🌙" : "☀️";
        }
        console.log("🎨 Theme toggled to:", newTheme);
      }
    });
    console.log("✅ Theme toggle event listener attached");
  } else {
    console.error("❌ Theme toggle button not found!");
  }

  // Add task button
  const addTaskBtn = document.getElementById("add-task-btn");
  if (addTaskBtn) {
    addTaskBtn.addEventListener("click", function () {
      console.log("📝 Add task button clicked!");
      if (window.openTaskDialog) {
        window.openTaskDialog();
      } else if (window.uiManager && window.uiManager.openTaskModal) {
        window.uiManager.openTaskModal();
      } else {
        console.log("📝 Task dialog not available");
      }
    });
    console.log("✅ Add task button event listener attached");
  }

  // Analytics button
  const analyticsBtn = document.getElementById("analytics-btn");
  if (analyticsBtn) {
    analyticsBtn.addEventListener("click", function () {
      console.log("📊 Analytics button clicked!");
      if (window.openAnalyticsDashboard) {
        window.openAnalyticsDashboard();
      } else {
        window.open("dashboard.html", "_blank");
      }
    });
    console.log("✅ Analytics button event listener attached");
  }

  // AI Chat button
  const aiChatBtn = document.getElementById("ai-chat-btn");
  if (aiChatBtn) {
    // Close user menu when clicking outside
    document.addEventListener("click", function (event) {
      const userMenu = document.querySelector(".user-menu");
      const userMenuBtn = document.getElementById("user-menu-btn");

      if (userMenu && !userMenu.contains(event.target)) {
        userMenuBtn?.classList.remove("active");
        document.getElementById("user-menu-dropdown")?.classList.remove("show");
      }
    });
    aiChatBtn.addEventListener("click", function () {
      console.log("🤖 AI Chat button clicked!");
      if (window.openAIChat) {
        window.openAIChat();
      } else if (window.aiChatManager && window.aiChatManager.open) {
        window.aiChatManager.open();
      } else {
        console.log("🤖 AI Chat not available");
      }
    });
    console.log("✅ AI Chat button event listener attached");
  }

  console.log("✅ Basic event listeners setup complete");
}

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

  // Create basic working managers
  window.apiManager = {
    loadWorkspaces: async () => ({ success: true, data: [] }),
    loadProjects: async () => ({ success: true, data: [] }),
    loadTasks: async () => ({ success: true, data: [] }),
    getTeams: async () => ({ success: true, data: [] }),
  };

  window.taskManager = {
    refreshTasks: async () => {
      console.log("📝 Refreshing tasks (fallback mode)");
      // Hide loading indicator
      const loadingIndicator = document.getElementById("loading-indicator");
      if (loadingIndicator) {
        loadingIndicator.style.display = "none";
      }
    },
    setupTaskFormHandling: () => {
      console.log("📝 Setting up task form handling (fallback mode)");
      // Basic task form handling
      const taskForm = document.getElementById("task-form");
      if (taskForm) {
        taskForm.addEventListener("submit", function (e) {
          e.preventDefault();
          console.log("📝 Task form submitted (fallback mode)");
          alert(
            "Task creation is not available in fallback mode. Please refresh the page."
          );
        });
      }
    },
    filterTasks: () => console.log("🔍 Filtering tasks (fallback mode)"),
    findTaskById: () => null,
    getTasks: () => [], // Add this method for ViewManager
  };

  window.projectManager = {
    loadProjects: async () => {
      console.log("🗂️ Loading projects (fallback mode)");
      return { success: true, data: [] };
    },
    loadProjectsGrid: () =>
      console.log("🗂️ Loading projects grid (fallback mode)"),
    loadProjectStatistics: () =>
      console.log("📊 Loading project statistics (fallback mode)"),
    openAddProjectDialog: () => {
      const dialog = document.getElementById("add-project-dialog");
      if (dialog) dialog.showModal();
    },
    closeAddProjectDialog: () => {
      const dialog = document.getElementById("add-project-dialog");
      if (dialog) dialog.close();
    },
    getProjects: () => [], // Add this method for ViewManager
  };

  window.workspaceManager = {
    loadWorkspaces: async () => {
      console.log("🏢 Loading workspaces (fallback mode)");
      return { success: true, data: [] };
    },
    openSidebar: () => {
      const sidebar = document.getElementById("workspace-sidebar");
      const overlay = document.getElementById("sidebar-overlay");
      if (sidebar) sidebar.classList.add("open");
      if (overlay) overlay.style.display = "block";
    },
    closeSidebar: () => {
      const sidebar = document.getElementById("workspace-sidebar");
      const overlay = document.getElementById("sidebar-overlay");
      if (sidebar) sidebar.classList.remove("open");
      if (overlay) overlay.style.display = "none";
    },
    openCreateWorkspaceDialog: () => {
      const dialog = document.getElementById("create-workspace-dialog");
      if (dialog) dialog.showModal();
    },
    closeCreateWorkspaceDialog: () => {
      const dialog = document.getElementById("create-workspace-dialog");
      if (dialog) dialog.close();
    },
    loadWorkspacesForType: () =>
      console.log("🏢 Loading workspaces for type (fallback mode)"),
    refreshCurrentWorkspace: () =>
      console.log("🔄 Refreshing current workspace (fallback mode)"),
  };

  window.dragDropManager = {
    initializeDragAndDrop: () =>
      console.log("🖱️ Initializing drag and drop (fallback mode)"),
  };

  window.uiManager = {
    setupEventListeners: () => {
      console.log("🎧 Setting up UI event listeners (fallback mode)");
      // Basic event listeners are already set up in setupBasicEventListeners()
    },
    openTaskModal: (taskId = null) => {
      console.log("📝 Opening task modal (fallback mode)");
      const dialog = document.getElementById("task-dialog");
      if (dialog) {
        // Update dialog title
        const title = dialog.querySelector(".dialog-header h3");
        if (title) {
          title.textContent = taskId ? "✏️ Edit Task" : "➕ Add New Task";
        }
        dialog.showModal();
      }
    },
    openDeleteModal: (taskId) => {
      console.log("🗑️ Opening delete modal (fallback mode)");
      const dialog = document.getElementById("delete-dialog");
      if (dialog) {
        const title = dialog.querySelector("#delete-task-title");
        if (title) {
          title.textContent = `Task ${taskId}`;
        }
        dialog.showModal();
      }
    },
    closeTaskDialog: () => {
      const dialog = document.getElementById("task-dialog");
      if (dialog) dialog.close();
    },
    closeDeleteDialog: () => {
      const dialog = document.getElementById("delete-dialog");
      if (dialog) dialog.close();
    },
    openProjectManagementDialog: () => {
      const dialog = document.getElementById("project-management-dialog");
      if (dialog) dialog.showModal();
    },
    closeProjectManagementDialog: () => {
      const dialog = document.getElementById("project-management-dialog");
      if (dialog) dialog.close();
    },
    confirmDeleteTask: (taskId) => {
      console.log("🗑️ Confirming delete task (fallback mode)");
      alert(
        "Task deletion is not available in fallback mode. Please refresh the page."
      );
    },
  };

  window.aiChatManager = {
    open: () => {
      console.log("🤖 Opening AI Chat (fallback mode)");
      const aiChatPanel = document.getElementById("ai-chat-panel");
      if (aiChatPanel) {
        aiChatPanel.classList.add("active");
      }
    },
    close: () => {
      console.log("🤖 Closing AI Chat (fallback mode)");
      const aiChatPanel = document.getElementById("ai-chat-panel");
      if (aiChatPanel) {
        aiChatPanel.classList.remove("active");
      }
    },
  };

  // Hide loading indicator
  const loadingIndicator = document.getElementById("loading-indicator");
  if (loadingIndicator) {
    loadingIndicator.style.display = "none";
  }

  console.log("✅ Fallback mode initialized successfully");
}

function toggleThemeWrapper() {
  console.log("🎨 Toggling theme from:", currentTheme);
  currentTheme = toggleTheme(currentTheme);
  console.log("🎨 Theme toggled to:", currentTheme);
}

// Make theme functions globally available
window.toggleThemeWrapper = toggleThemeWrapper;

// User Menu Functions
function toggleUserMenu() {
  const userMenuBtn = document.getElementById("user-menu-btn");
  const userMenuDropdown = document.getElementById("user-menu-dropdown");

  if (userMenuBtn && userMenuDropdown) {
    const isActive = userMenuBtn.classList.contains("active");

    if (isActive) {
      userMenuBtn.classList.remove("active");
      userMenuDropdown.classList.remove("show");
    } else {
      userMenuBtn.classList.add("active");
      userMenuDropdown.classList.add("show");
    }
  }
}

function logout() {
  // Show confirmation dialog
  if (confirm("Are you sure you want to logout?")) {
    // Call logout API
    fetch("php/api/auth/logout.php", {
      method: "POST",
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Redirect to login page
          window.location.href = "login.html";
        } else {
          console.error("Logout failed:", data.message);
          // Still redirect to login page
          window.location.href = "login.html";
        }
      })
      .catch((error) => {
        console.error("Logout error:", error);
        // Still redirect to login page
        window.location.href = "login.html";
      });
  }
}

// Make user menu functions globally available
window.toggleUserMenu = toggleUserMenu;
window.logout = logout;

// Update user info in header
function updateUserInfo() {
  // Check if user is authenticated
  fetch("php/api/auth/check_auth.php")
    .then((response) => response.json())
    .then((data) => {
      if (data.success && data.authenticated && data.data?.user) {
        const user = data.data.user;
        const userNameElement = document.getElementById("user-name");
        const userAvatarElement = document.querySelector(".user-avatar");

        if (userNameElement) {
          userNameElement.textContent =
            user.first_name && user.last_name
              ? `${user.first_name} ${user.last_name}`
              : user.username || "User";
        }

        if (userAvatarElement) {
          // You can set a custom avatar here if available
          userAvatarElement.textContent = user.first_name
            ? user.first_name.charAt(0).toUpperCase()
            : "👤";
        }
      }
    })
    .catch((error) => {
      console.error("Error fetching user info:", error);
    });
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
window.openAnalyticsDashboard = function () {
  window.open("dashboard.html", "_blank");
};
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

// Add missing functions that are referenced in HTML
window.openTaskDialog = openTaskModal;
window.openAIChat = function () {
  console.log("🤖 Opening AI Chat...");
  const aiChatPanel = document.getElementById("ai-chat-panel");
  if (aiChatPanel) {
    aiChatPanel.classList.add("active");
  }
};

window.closeAIChat = function () {
  console.log("🤖 Closing AI Chat...");
  const aiChatPanel = document.getElementById("ai-chat-panel");
  if (aiChatPanel) {
    aiChatPanel.classList.remove("active");
  }
};

window.closePlanPreview = function () {
  console.log("📋 Closing plan preview...");
  const preview = document.getElementById("ai-plan-preview");
  if (preview) {
    preview.style.display = "none";
  }
};

window.editPlan = function () {
  console.log("✏️ Edit plan clicked...");
  // Implementation would go here
};

window.confirmPlan = function () {
  console.log("✅ Confirm plan clicked...");
  // Implementation would go here
};

window.sendMessage = function () {
  console.log("📤 Send message clicked...");
  // Implementation would go here
};

window.insertQuickText = function (type) {
  console.log("📝 Insert quick text:", type);
  const input = document.getElementById("ai-chat-input");
  if (input) {
    const texts = {
      study: "I want to study for 2 hours today",
      workout: "I need to workout for 1 hour",
      work: "I have work tasks to complete",
    };
    input.value = texts[type] || "";
  }
};

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
