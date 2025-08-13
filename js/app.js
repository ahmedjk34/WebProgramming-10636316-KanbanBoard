/**
 * Enhanced Kanban Board Application - Modular Architecture
 * Web Programming 10636316 - An-Najah National University
 *
 * A modern, feature-rich Kanban board with modular architecture,
 * drag & drop functionality, project management, workspace organization, and beautiful UI/UX
 */

// ===== MODULE FACTORY PATTERN =====

/**
 * Module Factory - Manages module dependencies and initialization
 */
class ModuleFactory {
  constructor() {
    this.modules = new Map();
    this.dependencies = new Map();
    this.initialized = new Set();
    this.loading = new Set();
  }

  /**
   * Register a module with its dependencies
   * @param {string} name - Module name
   * @param {Function} moduleClass - Module constructor
   * @param {Array} dependencies - Array of dependency module names
   */
  register(name, moduleClass, dependencies = []) {
    this.modules.set(name, moduleClass);
    this.dependencies.set(name, dependencies);
    console.log(
      `📦 Registered module: ${name} with dependencies: [${dependencies.join(
        ", "
      )}]`
    );
  }

  /**
   * Get or create a module instance
   * @param {string} name - Module name
   * @returns {Promise<Object>} Module instance
   */
  async get(name) {
    if (this.initialized.has(name)) {
      return this.modules.get(name + "_instance");
    }

    if (this.loading.has(name)) {
      // Wait for module to finish loading
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

  /**
   * Initialize a module and its dependencies
   * @param {string} name - Module name
   * @returns {Promise<Object>} Module instance
   */
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
      // Initialize dependencies first
      const dependencies = this.dependencies.get(name) || [];
      const dependencyInstances = {};

      for (const dep of dependencies) {
        dependencyInstances[dep] = await this.initialize(dep);
      }

      // Create module instance
      const ModuleClass = this.modules.get(name);
      const instance = new ModuleClass(dependencyInstances);

      // Store instance
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

  /**
   * Initialize all registered modules
   * @returns {Promise<Object>} Object containing all module instances
   */
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

  /**
   * Check if all required modules are available
   * @param {Array} requiredModules - Array of required module names
   * @returns {boolean} True if all modules are available
   */
  areModulesAvailable(requiredModules) {
    return requiredModules.every((name) => typeof window[name] !== "undefined");
  }
}

// Global module factory instance
const moduleFactory = new ModuleFactory();

// Global variables
let currentTheme = localStorage.getItem("theme") || "light";
let currentEditingTaskId = null; // For backward compatibility

// Module instances (will be populated by factory)
let apiManager;
let taskManager;
let projectManager;
let workspaceManager;
let dragDropManager;
let uiManager;

document.addEventListener("DOMContentLoaded", function () {
  console.log(
    "🎨 Enhanced Kanban Board Application Loaded - Modular Architecture"
  );

  // Initialize theme
  initializeTheme(currentTheme);

  // Wait a moment for all modules to load, then initialize
  setTimeout(() => {
    console.log("🔍 Checking module availability...");

    // Register modules with their dependencies
    registerModules();

    // Initialize the application
    initializeApp();
  }, 100);
});

/**
 * Register all modules with the factory
 */
function registerModules() {
  console.log("📋 Registering modules with factory...");

  // Check if modules are available
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

  // Register modules with their dependencies
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

// Main initialization function - Modular Architecture
async function initializeApp() {
  console.log("🚀 Initializing Modular Kanban Board...");

  try {
    // Show loading indicator
    showLoading(true);

    // Initialize all modules using factory
    const modules = await moduleFactory.initializeAll();

    // Assign module instances to global variables for backward compatibility
    apiManager = modules.apiManager;
    taskManager = modules.taskManager;
    projectManager = modules.projectManager;
    workspaceManager = modules.workspaceManager;
    dragDropManager = modules.dragDropManager;
    uiManager = modules.uiManager;

    // Make modules globally accessible for backward compatibility
    window.apiManager = apiManager;
    window.taskManager = taskManager;
    window.projectManager = projectManager;
    window.workspaceManager = workspaceManager;
    window.dragDropManager = dragDropManager;
    window.uiManager = uiManager;

    // Initialize workspace system first
    await workspaceManager.loadWorkspaces();

    // Load data from backend
    await Promise.all([
      projectManager.loadProjects(),
      taskManager.refreshTasks(),
    ]);

    // Setup UI and interactions
    uiManager.setupEventListeners();
    dragDropManager.initializeDragAndDrop();
    taskManager.setupTaskFormHandling();

    // Hide loading indicator
    showLoading(false);

    console.log("🎉 Modular Kanban Board initialized successfully");

    // Add welcome animation
    addWelcomeAnimation();
  } catch (error) {
    console.error("❌ Failed to initialize Kanban Board:", error);
    showError("Failed to load data. Please refresh the page.");
    showLoading(false);

    // Fallback to old initialization method
    console.log("🔄 Attempting fallback initialization...");
    initializeFallbackMode();
  }
}

// Initialize all module instances
function initializeModules() {
  console.log("🔧 Initializing modules...");

  // Check if all module classes are available
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

    // Try to wait a bit more and retry
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
    // Create module instances with error handling
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

    // Make modules globally accessible
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

// Fallback mode for when modules fail to load
function initializeFallbackMode() {
  console.log("🔄 Initializing fallback mode...");

  // Create basic functionality without modules
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

// Theme toggle wrapper for backward compatibility
function toggleThemeWrapper() {
  console.log("🎨 Toggling theme from:", currentTheme);
  currentTheme = toggleTheme(currentTheme);
  console.log("🎨 Theme toggled to:", currentTheme);
}

// ===== BACKWARD COMPATIBILITY FUNCTIONS =====
// These functions maintain compatibility with existing HTML onclick handlers

// Sidebar functions (delegated to WorkspaceManager)
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

// Task functions (delegated to TaskManager and UIManager)
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

// Project functions (delegated to ProjectManager and UIManager)
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

// Filter functions (delegated to TaskManager)
function filterTasks() {
  const projectFilter = document.getElementById("project-filter");
  const priorityFilter = document.getElementById("priority-filter");

  const projectId = projectFilter ? projectFilter.value : "";
  const priority = priorityFilter ? priorityFilter.value : "";

  if (window.taskManager) {
    window.taskManager.filterTasks(projectId, priority);
  }
}

// ===== LEGACY SUPPORT =====
// Keep some essential functions for any remaining direct calls

// Console welcome message
console.log("🗂️ Kanban Board Application");
console.log("📚 Course: Web Programming 10636316");
console.log("🏫 University: An-Najah National University");
console.log("🔧 Tech Stack: HTML5, CSS3, JavaScript, PHP, MySQL");
console.log("📅 Version: 1.0.0 - Modular Architecture");

// Test functions for debugging
window.testModal = function () {
  console.log("🧪 Testing modal system...");
  if (window.uiManager) {
    window.uiManager.openTaskModal();
  }
};

window.testDialog = window.testModal;

// Legacy aliases for backward compatibility
window.openTaskDialog = openTaskModal;
window.closeTaskModal = closeTaskDialog;
window.openDeleteModal = deleteTask;
window.closeDeleteModal = closeDeleteDialog;

// Additional compatibility functions for buttons
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

// Make sure these are globally available
window.switchWorkspace = switchWorkspace;
window.confirmDeleteTask = confirmDeleteTask;
