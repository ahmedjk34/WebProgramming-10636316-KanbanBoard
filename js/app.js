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
      throw error;
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

let apiManager;
let taskManager;
let projectManager;
let workspaceManager;
let dragDropManager;
let uiManager;

document.addEventListener("DOMContentLoaded", function () {
  console.log("🎨 Enhanced Kanban Board Application Loaded");

  initializeTheme(currentTheme);

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
  moduleFactory.register("dragDropManager", window.DragDropManager, [
    "taskManager",
  ]);
  moduleFactory.register("uiManager", window.UIManager, [
    "taskManager",
    "projectManager",
    "workspaceManager",
  ]);

  console.log("✅ All modules registered successfully");
}

async function initializeApp() {
  console.log("🚀 Initializing Modular Kanban Board...");

  try {
    showLoading(true);

    const modules = await moduleFactory.initializeAll();

    apiManager = modules.apiManager;
    taskManager = modules.taskManager;
    projectManager = modules.projectManager;
    workspaceManager = modules.workspaceManager;
    dragDropManager = modules.dragDropManager;
    uiManager = modules.uiManager;

    window.apiManager = apiManager;
    window.taskManager = taskManager;
    window.projectManager = projectManager;
    window.workspaceManager = workspaceManager;
    window.dragDropManager = dragDropManager;
    window.uiManager = uiManager;

    await workspaceManager.loadWorkspaces();

    await Promise.all([
      projectManager.loadProjects(),
      taskManager.refreshTasks(),
    ]);

    uiManager.setupEventListeners();
    dragDropManager.initializeDragAndDrop();
    taskManager.setupTaskFormHandling();

    showLoading(false);

    console.log("🎉 Modular Kanban Board initialized successfully");

    addWelcomeAnimation();
  } catch (error) {
    console.error("❌ Failed to initialize Kanban Board:", error);
    showError("Failed to load data. Please refresh the page.");
    showLoading(false);

    console.log("🔄 Attempting fallback initialization...");
    initializeFallbackMode();
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
