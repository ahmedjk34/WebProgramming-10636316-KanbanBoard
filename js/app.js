/**
 * Enhanced Kanban Board Application - Modular Architecture
 * Web Programming 10636316 - An-Najah National University
 *
 * A modern, feature-rich Kanban board with modular architecture,
 * drag & drop functionality, project management, workspace organization, and beautiful UI/UX
 */

// Global variables
let currentTheme = localStorage.getItem("theme") || "light";
let currentEditingTaskId = null; // For backward compatibility

// Module instances
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
    console.log("APIManager available:", typeof window.APIManager);
    console.log("TaskManager available:", typeof window.TaskManager);
    console.log("ProjectManager available:", typeof window.ProjectManager);
    console.log("WorkspaceManager available:", typeof window.WorkspaceManager);
    console.log("DragDropManager available:", typeof window.DragDropManager);
    console.log("UIManager available:", typeof window.UIManager);

    initializeApp();
  }, 100);
});

// Main initialization function - Modular Architecture
async function initializeApp() {
  console.log("🚀 Initializing Modular Kanban Board...");

  try {
    // Show loading indicator
    showLoading(true);

    // Initialize all modules
    initializeModules();

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

    // Test module functionality
    console.log("🧪 Testing module methods...");
    console.log(
      "- APIManager methods:",
      Object.getOwnPropertyNames(Object.getPrototypeOf(apiManager))
    );
    console.log(
      "- TaskManager methods:",
      Object.getOwnPropertyNames(Object.getPrototypeOf(taskManager))
    );
    console.log(
      "- UIManager methods:",
      Object.getOwnPropertyNames(Object.getPrototypeOf(uiManager))
    );
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
  if (window.workspaceManager) {
    window.workspaceManager.closeCreateWorkspaceDialog();
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
