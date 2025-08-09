// Kanban Board JavaScript - Phase 2
// This file contains all the client-side functionality

// Global variables
let allTasks = [];
let allProjects = [];
let allWorkspaces = [];
let currentWorkspaceId =
  parseInt(localStorage.getItem("currentWorkspaceId")) || 1;
let currentEditingTaskId = null;
let currentTheme = localStorage.getItem("theme") || "light";

document.addEventListener("DOMContentLoaded", function () {
  console.log("🎨 Enhanced Kanban Board Application Loaded");

  // Initialize theme
  initializeTheme();

  // Initialize the application
  initializeApp();
});

async function initializeApp() {
  console.log("Initializing Kanban Board...");

  try {
    // Show loading indicator
    showLoading(true);

    // Initialize workspace system first
    await loadWorkspaces();

    // Load data from backend
    await Promise.all([loadProjects(), loadTasks()]);

    // Hide loading indicator
    showLoading(false);

    // Set up event listeners
    setupEventListeners();

    // Initialize drag and drop
    initializeDragAndDrop();

    // Setup task form handling
    setupTaskFormHandling();

    // Debug: Check if dialogs exist
    const taskDialog = document.getElementById("task-dialog");
    const deleteDialog = document.getElementById("delete-dialog");
    console.log("🔍 Task dialog found:", !!taskDialog);
    console.log("🔍 Delete dialog found:", !!deleteDialog);

    console.log("🎉 Kanban Board initialized successfully");

    // Add welcome animation
    addWelcomeAnimation();
  } catch (error) {
    console.error("❌ Failed to initialize Kanban Board:", error);
    showError("Failed to load data. Please refresh the page.");
    showLoading(false);
  }
}

// Load tasks from backend
async function loadTasks() {
  console.log("📊 Loading tasks for workspace:", currentWorkspaceId);
  try {
    const response = await fetch(
      `php/api/tasks/get_tasks.php?workspace_id=${currentWorkspaceId}`
    );
    const result = await response.json();

    if (result.success) {
      allTasks = result.data.tasks;
      displayTasks(result.data.tasks_by_status);
      updateTaskCounts(result.data.counts);

      // Show empty state if no tasks
      if (result.data.total_count === 0) {
        showEmptyState(true);
      } else {
        showEmptyState(false);
      }
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("Error loading tasks:", error);
    throw error;
  }
}

// Load projects from backend
async function loadProjects() {
  console.log("📊 Loading projects for workspace:", currentWorkspaceId);
  try {
    const response = await fetch(
      `php/api/projects/get_projects.php?workspace_id=${currentWorkspaceId}`
    );
    const result = await response.json();

    if (result.success) {
      allProjects = result.data.projects;
      populateProjectFilter(result.data.projects);
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("Error loading projects:", error);
    throw error;
  }
}

// Display tasks in their respective columns
function displayTasks(tasksByStatus) {
  // Use enhanced display with animations
  displayTasksEnhanced(tasksByStatus);
}

// Create HTML element for a task
function createTaskElement(task) {
  const taskDiv = document.createElement("div");
  taskDiv.className = "task-card";
  taskDiv.setAttribute("data-task-id", task.id);
  taskDiv.setAttribute("draggable", "true");

  // Priority indicator
  const priorityIcon = {
    high: "🔴",
    medium: "🟡",
    low: "🟢",
  };

  // Due date formatting
  let dueDateHtml = "";
  if (task.due_date) {
    const dueDate = new Date(task.due_date);
    const isOverdue = task.is_overdue;

    dueDateHtml = `
            <div class="task-due-date ${isOverdue ? "overdue" : ""}">
                📅 ${dueDate.toLocaleDateString()}
                ${isOverdue ? " (Overdue)" : ""}
            </div>
        `;
  }

  taskDiv.innerHTML = `
        <div class="task-header">
            <div class="task-priority">${priorityIcon[task.priority]}</div>
            <div class="task-project" style="background-color: ${
              task.project_color
            }">
                ${task.project_name}
            </div>
        </div>
        <div class="task-title">${task.title}</div>
        <div class="task-description">${task.description || ""}</div>
        ${dueDateHtml}
        <div class="task-actions">
            <button class="task-edit-btn" onclick="editTask(${
              task.id
            })">✏️</button>
            <button class="task-delete-btn" onclick="deleteTask(${
              task.id
            })">🗑️</button>
        </div>
    `;

  return taskDiv;
}

// Utility functions
function showLoading(show) {
  const loadingIndicator = document.getElementById("loading-indicator");
  if (loadingIndicator) {
    loadingIndicator.style.display = show ? "flex" : "none";
  }
}

function showEmptyState(show) {
  const emptyState = document.getElementById("empty-state");
  const kanbanBoard = document.getElementById("kanban-board");

  if (emptyState && kanbanBoard) {
    emptyState.style.display = show ? "flex" : "none";
    kanbanBoard.style.display = show ? "none" : "flex";
  }
}

function showError(message) {
  // Simple error display - can be enhanced later
  alert("Error: " + message);
}

function updateTaskCounts(counts) {
  document.getElementById("todo-count").textContent = counts.todo;
  document.getElementById("in_progress-count").textContent = counts.in_progress;
  document.getElementById("done-count").textContent = counts.done;
}

function populateProjectFilter(projects) {
  const projectDropdown = document.getElementById("project-dropdown");
  if (projectDropdown) {
    const dropdownMenu = projectDropdown.querySelector(".dropdown-menu");

    // Clear existing items except "All Projects"
    dropdownMenu.innerHTML =
      '<div class="dropdown-item active" data-value="">All Projects</div>';

    // Add project options
    projects.forEach((project) => {
      const item = document.createElement("div");
      item.className = "dropdown-item";
      item.setAttribute("data-value", project.id);
      item.textContent = project.name;
      dropdownMenu.appendChild(item);
    });
  }
}

function setupEventListeners() {
  // Refresh button
  const refreshBtn = document.getElementById("refresh-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      // Add loading animation
      refreshBtn.style.transform = "rotate(360deg)";
      setTimeout(() => {
        location.reload();
      }, 300);
    });
  }

  // Theme toggle
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }

  // Setup custom dropdowns
  setupCustomDropdowns();

  // Add task button animations
  const addTaskBtn = document.getElementById("add-task-btn");
  if (addTaskBtn) {
    addTaskBtn.addEventListener("mouseenter", () => {
      addTaskBtn.style.transform = "translateY(-2px) scale(1.05)";
    });
    addTaskBtn.addEventListener("mouseleave", () => {
      addTaskBtn.style.transform = "translateY(0) scale(1)";
    });
  }
}

function filterTasks() {
  const projectDropdown = document.getElementById("project-dropdown");
  const priorityDropdown = document.getElementById("priority-dropdown");

  const projectId =
    projectDropdown
      ?.querySelector(".dropdown-item.active")
      ?.getAttribute("data-value") || "";
  const priority =
    priorityDropdown
      ?.querySelector(".dropdown-item.active")
      ?.getAttribute("data-value") || "";

  // Add subtle loading effect
  const kanbanBoard = document.querySelector(".kanban-board");
  if (kanbanBoard) {
    kanbanBoard.style.opacity = "0.7";
    kanbanBoard.style.transform = "scale(0.98)";
  }

  let filteredTasks = allTasks;

  if (projectId) {
    filteredTasks = filteredTasks.filter(
      (task) => task.project_id == projectId
    );
  }

  if (priority) {
    filteredTasks = filteredTasks.filter((task) => task.priority === priority);
  }

  // Group filtered tasks by status
  const tasksByStatus = {
    todo: filteredTasks.filter((task) => task.status === "todo"),
    in_progress: filteredTasks.filter((task) => task.status === "in_progress"),
    done: filteredTasks.filter((task) => task.status === "done"),
  };

  // Smooth transition back
  setTimeout(() => {
    displayTasks(tasksByStatus);

    // Update counts
    updateTaskCounts({
      todo: tasksByStatus.todo.length,
      in_progress: tasksByStatus.in_progress.length,
      done: tasksByStatus.done.length,
    });

    // Restore appearance
    if (kanbanBoard) {
      kanbanBoard.style.opacity = "1";
      kanbanBoard.style.transform = "scale(1)";
    }
  }, 150);
}

// Custom Dropdown Functionality
function setupCustomDropdowns() {
  const dropdowns = document.querySelectorAll(".custom-dropdown");

  dropdowns.forEach((dropdown) => {
    const trigger = dropdown.querySelector(".dropdown-trigger");
    const items = dropdown.querySelectorAll(".dropdown-item");
    const text = dropdown.querySelector(".dropdown-text");

    // Toggle dropdown
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();

      // Close other dropdowns
      dropdowns.forEach((otherDropdown) => {
        if (otherDropdown !== dropdown) {
          otherDropdown.classList.remove("open");
        }
      });

      // Toggle current dropdown
      dropdown.classList.toggle("open");
    });

    // Handle item selection
    items.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();

        // Remove active class from all items
        items.forEach((i) => i.classList.remove("active"));

        // Add active class to clicked item
        item.classList.add("active");

        // Update trigger text
        text.textContent = item.textContent;

        // Close dropdown
        dropdown.classList.remove("open");

        // Trigger filter update
        filterTasks();
      });
    });
  });

  // Close dropdowns when clicking outside
  document.addEventListener("click", () => {
    dropdowns.forEach((dropdown) => {
      dropdown.classList.remove("open");
    });
  });

  // Close dropdowns on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      dropdowns.forEach((dropdown) => {
        dropdown.classList.remove("open");
      });
    }
  });
}

// Task Management Functions - Phase 5

// Dialog Management - Modern HTML Dialog API
function openTaskDialog(taskId = null) {
  console.log("🎯 Opening task dialog, taskId:", taskId);

  const dialog = document.getElementById("task-dialog");
  const dialogTitle = document.getElementById("task-dialog-title");
  const submitText = document.getElementById("task-submit-text");
  const form = document.getElementById("task-form");

  if (!dialog) {
    console.error("❌ Task dialog not found!");
    return;
  }

  currentEditingTaskId = taskId;

  if (taskId) {
    // Edit mode
    console.log("📝 Edit mode for task:", taskId);
    dialogTitle.textContent = "Edit Task";
    submitText.textContent = "Update Task";
    loadTaskForEditing(taskId);
  } else {
    // Create mode
    console.log("➕ Create mode");
    dialogTitle.textContent = "Add New Task";
    submitText.textContent = "Create Task";
    form.reset();
    clearFormErrors();
  }

  // Populate project dropdown
  populateTaskProjectDropdown();

  // Lock scrolling
  lockScroll();

  // Show dialog using the native API
  console.log("🎭 Opening dialog with showModal()");
  dialog.showModal();

  // Focus on title field after dialog opens
  setTimeout(() => {
    const titleField = document.getElementById("task-title");
    if (titleField) {
      titleField.focus();
    }
  }, 100);

  // Handle Escape key and click outside to close dialog
  dialog.addEventListener("keydown", handleDialogKeydown);
  dialog.addEventListener("click", handleDialogClickOutside);
}

function closeTaskDialog() {
  const dialog = document.getElementById("task-dialog");
  if (dialog) {
    dialog.close();
    currentEditingTaskId = null;
    clearFormErrors();
    unlockScroll();
  }
}

function openDeleteDialog(taskId) {
  const dialog = document.getElementById("delete-dialog");
  const taskTitleElement = document.getElementById("delete-task-title");

  if (!dialog) {
    console.error("❌ Delete dialog not found!");
    return;
  }

  // Find task title
  const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
  const taskTitle =
    taskElement?.querySelector(".task-title")?.textContent || "Unknown Task";

  taskTitleElement.textContent = taskTitle;

  // Set up delete confirmation
  const confirmBtn = document.getElementById("confirm-delete-btn");
  confirmBtn.onclick = () => confirmDeleteTask(taskId);

  // Lock scrolling
  lockScroll();

  // Show dialog
  dialog.showModal();

  // Handle Escape key and click outside to close dialog
  dialog.addEventListener("keydown", handleDialogKeydown);
  dialog.addEventListener("click", handleDialogClickOutside);
}

function closeDeleteDialog() {
  const dialog = document.getElementById("delete-dialog");
  if (dialog) {
    dialog.close();
    unlockScroll();
  }
}

// Handle keyboard events for dialogs
function handleDialogKeydown(event) {
  if (event.key === "Escape") {
    event.preventDefault();
    event.target.close();
  }
}

// Handle click outside dialog to close
function handleDialogClickOutside(event) {
  const dialog = event.target;
  const rect = dialog.getBoundingClientRect();

  // Check if click is outside the dialog content
  if (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  ) {
    dialog.close();
  }
}

// Scroll lock functions
function lockScroll() {
  const scrollY = window.scrollY;
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = "100%";
  document.body.classList.add("modal-open");
}

function unlockScroll() {
  const scrollY = document.body.style.top;
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.width = "";
  document.body.classList.remove("modal-open");
  window.scrollTo(0, parseInt(scrollY || "0") * -1);
}

// Legacy function names for backward compatibility
const openTaskModal = openTaskDialog;
const closeTaskModal = closeTaskDialog;
const openDeleteModal = openDeleteDialog;
const closeDeleteModal = closeDeleteDialog;

// Project Management Functions - Phase 6
function openProjectManagementDialog() {
  console.log("🗂️ Opening project management dialog");

  const dialog = document.getElementById("project-management-dialog");
  if (!dialog) {
    console.error("❌ Project management dialog not found!");
    return;
  }

  // Load projects and statistics
  loadProjectsData();

  // Lock scrolling
  lockScroll();

  // Show dialog
  dialog.showModal();

  // Setup tab switching
  setupProjectTabs();

  // Setup color picker
  setupColorPicker();

  // Setup project form
  setupProjectForm();

  // Handle click outside to close dialog
  dialog.addEventListener("click", handleDialogClickOutside);
}

function closeProjectManagementDialog() {
  const dialog = document.getElementById("project-management-dialog");
  if (dialog) {
    dialog.close();
    unlockScroll();
  }
}

function setupProjectTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetTab = button.getAttribute("data-tab");

      // Remove active class from all tabs and contents
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      // Add active class to clicked tab and corresponding content
      button.classList.add("active");
      document.getElementById(`${targetTab}-tab`).classList.add("active");

      // Load data for specific tabs
      if (targetTab === "projects") {
        loadProjectsGrid();
      } else if (targetTab === "statistics") {
        loadProjectStatistics();
      }
    });
  });
}

function setupColorPicker() {
  const colorInput = document.getElementById("project-color");
  const colorPresets = document.querySelectorAll(".color-preset");

  colorPresets.forEach((preset) => {
    preset.addEventListener("click", () => {
      const color = preset.getAttribute("data-color");
      colorInput.value = color;
    });
  });
}

function setupProjectForm() {
  const form = document.getElementById("project-form");
  if (form) {
    form.addEventListener("submit", handleProjectFormSubmit);
  }
}

async function handleProjectFormSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const projectData = {
    name: formData.get("name"),
    description: formData.get("description"),
    color: formData.get("color"),
    status: formData.get("status"),
  };

  console.log("📝 Creating project:", projectData);

  try {
    // Here you would call your project creation API
    // const result = await createProjectAPI(projectData);

    // For now, show success message
    showSuccessMessage("Project created successfully!");

    // Reset form
    resetProjectForm();

    // Refresh projects grid
    loadProjectsGrid();
  } catch (error) {
    console.error("❌ Error creating project:", error);
    showErrorMessage("Failed to create project");
  }
}

function resetProjectForm() {
  const form = document.getElementById("project-form");
  if (form) {
    form.reset();
    document.getElementById("project-color").value = "#667eea";
  }
}

async function loadProjectsData() {
  console.log("📊 Loading projects data...");

  try {
    // Load projects grid
    loadProjectsGrid();

    // Load statistics
    loadProjectStatistics();
  } catch (error) {
    console.error("❌ Error loading projects data:", error);
  }
}

function loadProjectsGrid() {
  const projectsGrid = document.getElementById("projects-grid");
  if (!projectsGrid) return;

  // Clear existing content
  projectsGrid.innerHTML = "";

  // Create project cards for existing projects
  allProjects.forEach((project) => {
    const projectCard = createProjectCard(project);
    projectsGrid.appendChild(projectCard);
  });

  // Add "Create New Project" card
  const createCard = createNewProjectCard();
  projectsGrid.appendChild(createCard);
}

function createProjectCard(project) {
  const card = document.createElement("div");
  card.className = "project-card";
  card.style.setProperty("--project-color", project.color || "#667eea");

  // Count tasks for this project
  const projectTasks = allTasks.filter((task) => task.project_id == project.id);
  const completedTasks = projectTasks.filter((task) => task.status === "done");

  card.innerHTML = `
    <div class="project-header">
      <h4 class="project-title">${project.name}</h4>
      <span class="project-status">${getProjectStatusIcon(project.status)} ${
    project.status
  }</span>
    </div>
    <p class="project-description">${
      project.description || "No description"
    }</p>
    <div class="project-stats">
      <div class="project-stat">
        <div class="project-stat-number">${projectTasks.length}</div>
        <div class="project-stat-label">Total Tasks</div>
      </div>
      <div class="project-stat">
        <div class="project-stat-number">${completedTasks.length}</div>
        <div class="project-stat-label">Completed</div>
      </div>
      <div class="project-stat">
        <div class="project-stat-number">${Math.round(
          (completedTasks.length / Math.max(projectTasks.length, 1)) * 100
        )}%</div>
        <div class="project-stat-label">Progress</div>
      </div>
    </div>
    <div class="project-actions">
      <button class="project-action-btn" onclick="editProject(${
        project.id
      })">✏️ Edit</button>
      <button class="project-action-btn" onclick="viewProjectTasks(${
        project.id
      })">👁️ View</button>
      <button class="project-action-btn" onclick="deleteProject(${
        project.id
      })">🗑️ Delete</button>
    </div>
  `;

  return card;
}

function createNewProjectCard() {
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

function openAddProjectDialog() {
  console.log("➕ Opening add project dialog");

  const dialog = document.getElementById("add-project-dialog");
  if (!dialog) {
    console.error("❌ Add project dialog not found!");
    return;
  }

  // Reset form
  resetAddProjectForm();

  // Setup color picker for add project dialog
  setupAddProjectColorPicker();

  // Setup form submission
  setupAddProjectForm();

  // Lock scrolling
  lockScroll();

  // Show dialog
  dialog.showModal();

  // Focus on name field
  setTimeout(() => {
    const nameField = document.getElementById("add-project-name");
    if (nameField) {
      nameField.focus();
    }
  }, 100);

  // Handle click outside to close dialog
  dialog.addEventListener("click", handleDialogClickOutside);
}

function closeAddProjectDialog() {
  const dialog = document.getElementById("add-project-dialog");
  if (dialog) {
    dialog.close();
    unlockScroll();
  }
}

function setupAddProjectColorPicker() {
  const colorInput = document.getElementById("add-project-color");
  const colorPresets = document.querySelectorAll(
    "#add-project-dialog .color-preset"
  );

  colorPresets.forEach((preset) => {
    preset.addEventListener("click", () => {
      const color = preset.getAttribute("data-color");
      colorInput.value = color;
    });
  });
}

function setupAddProjectForm() {
  const form = document.getElementById("add-project-form");
  if (form) {
    form.removeEventListener("submit", handleAddProjectFormSubmit); // Remove existing listener
    form.addEventListener("submit", handleAddProjectFormSubmit);
  }
}

async function handleAddProjectFormSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const projectData = {
    name: formData.get("name"),
    description: formData.get("description"),
    color: formData.get("color"),
    status: formData.get("status"),
  };

  console.log("📝 Creating project:", projectData);

  try {
    // Here you would call your project creation API
    // const result = await createProjectAPI(projectData);

    // For now, show success message
    showSuccessMessage("Project created successfully!");

    // Close add project dialog
    closeAddProjectDialog();

    // Refresh projects grid in management dialog
    loadProjectsGrid();

    // Refresh project dropdown in main interface
    await loadProjects();
  } catch (error) {
    console.error("❌ Error creating project:", error);
    showErrorMessage("Failed to create project");
  }
}

function resetAddProjectForm() {
  const form = document.getElementById("add-project-form");
  if (form) {
    form.reset();
    document.getElementById("add-project-color").value = "#667eea";
  }
}

function getProjectStatusIcon(status) {
  const icons = {
    active: "🟢",
    on_hold: "🟡",
    completed: "✅",
    archived: "📦",
  };
  return icons[status] || "🟢";
}

function loadProjectStatistics() {
  // Update statistics
  document.getElementById("total-projects").textContent = allProjects.length;
  document.getElementById("completed-projects").textContent =
    allProjects.filter((p) => p.status === "completed").length;
  document.getElementById("active-projects").textContent = allProjects.filter(
    (p) => p.status === "active"
  ).length;
  document.getElementById("total-tasks-stat").textContent = allTasks.length;
}

// Project action functions
function editProject(projectId) {
  console.log("✏️ Edit project:", projectId);
  // Switch to create tab and populate with project data
  switchToCreateTab();
  // TODO: Load project data into form
}

function viewProjectTasks(projectId) {
  console.log("👁️ View project tasks:", projectId);
  // Close dialog and filter by project
  closeProjectManagementDialog();
  // TODO: Set project filter
}

function deleteProject(projectId) {
  console.log("🗑️ Delete project:", projectId);
  // TODO: Show confirmation and delete project
}

// Task CRUD Operations
function editTask(taskId) {
  console.log("🖊️ Opening edit modal for task:", taskId);
  openTaskModal(taskId);
}

function deleteTask(taskId) {
  console.log("🗑️ Opening delete confirmation for task:", taskId);
  openDeleteModal(taskId);
}

async function loadTaskForEditing(taskId) {
  try {
    // Find task in current data
    const task = allTasks.find((t) => t.id == taskId);

    if (task) {
      document.getElementById("task-title").value = task.title;
      document.getElementById("task-description").value =
        task.description || "";
      document.getElementById("task-project").value = task.project_id;
      document.getElementById("task-priority").value = task.priority;
      document.getElementById("task-status").value = task.status;

      if (task.due_date) {
        document.getElementById("task-due-date").value = task.due_date;
      }
    }
  } catch (error) {
    console.error("❌ Error loading task for editing:", error);
    showErrorMessage("Failed to load task data");
  }
}

function populateTaskProjectDropdown() {
  const projectSelect = document.getElementById("task-project");

  // Clear existing options except the first one
  projectSelect.innerHTML = '<option value="">Select a project...</option>';

  // Add project options
  allProjects.forEach((project) => {
    const option = document.createElement("option");
    option.value = project.id;
    option.textContent = project.name;
    projectSelect.appendChild(option);
  });
}

// Form Handling
function setupTaskFormHandling() {
  const form = document.getElementById("task-form");

  if (form) {
    form.addEventListener("submit", handleTaskFormSubmit);
  }
}

async function handleTaskFormSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  // Clear previous errors
  clearFormErrors();

  // Validate form
  if (!validateTaskForm(formData)) {
    return;
  }

  // Show loading state
  setFormLoading(true);

  try {
    const taskData = {
      title: formData.get("title"),
      description: formData.get("description"),
      project_id: parseInt(formData.get("project_id")),
      priority: formData.get("priority"),
      status: formData.get("status"),
      due_date: formData.get("due_date") || null,
    };

    let result;

    if (currentEditingTaskId) {
      // Update existing task
      taskData.id = currentEditingTaskId;
      result = await updateTaskAPI(taskData);
    } else {
      // Create new task
      result = await createTaskAPI(taskData);
    }

    if (result.success) {
      // Show success message
      showSuccessMessage(
        currentEditingTaskId
          ? "Task updated successfully!"
          : "Task created successfully!"
      );

      // Close dialog
      closeTaskDialog();

      // Refresh tasks
      await refreshTasks();
    } else {
      showErrorMessage(result.message || "Failed to save task");
    }
  } catch (error) {
    console.error("❌ Error saving task:", error);
    showErrorMessage("Network error. Please try again.");
  } finally {
    setFormLoading(false);
  }
}

function validateTaskForm(formData) {
  let isValid = true;

  // Validate title
  const title = formData.get("title");
  if (!title || title.trim().length === 0) {
    showFieldError("title-error", "Task title is required");
    isValid = false;
  } else if (title.length > 255) {
    showFieldError("title-error", "Title must be less than 255 characters");
    isValid = false;
  }

  // Validate project
  const projectId = formData.get("project_id");
  if (!projectId) {
    showFieldError("project-error", "Please select a project");
    isValid = false;
  }

  return isValid;
}

function showFieldError(errorId, message) {
  const errorElement = document.getElementById(errorId);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.add("show");
  }
}

function clearFormErrors() {
  const errorElements = document.querySelectorAll(".form-error");
  errorElements.forEach((element) => {
    element.classList.remove("show");
    element.textContent = "";
  });
}

// Debug function - can be called from console
window.testDialog = function () {
  console.log("🧪 Testing dialog...");
  const dialog = document.getElementById("task-dialog");
  if (dialog) {
    dialog.showModal();
    console.log("✅ Dialog should be visible now");
  } else {
    console.error("❌ Dialog not found");
  }
};

// Legacy test function
window.testModal = window.testDialog;

// ===== WORKSPACE MANAGEMENT FUNCTIONS =====

// Sidebar Functions
function openSidebar() {
  console.log("🏢 Opening workspace sidebar");

  const sidebar = document.getElementById("workspace-sidebar");
  const overlay = document.getElementById("sidebar-overlay");

  if (sidebar && overlay) {
    sidebar.classList.add("open");
    overlay.classList.add("show");
    lockScroll();

    // Load workspaces
    loadWorkspaces();
  }
}

function closeSidebar() {
  console.log("🏢 Closing workspace sidebar");

  const sidebar = document.getElementById("workspace-sidebar");
  const overlay = document.getElementById("sidebar-overlay");

  if (sidebar && overlay) {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
    unlockScroll();
  }
}

// Workspace Management
async function loadWorkspaces() {
  console.log("📊 Loading workspaces...");

  try {
    const response = await fetch("php/api/workspaces/get_workspaces.php");
    const result = await response.json();

    if (result.success) {
      allWorkspaces = result.data.workspaces;
      displayWorkspaces();
      updateCurrentWorkspaceDisplay();
      console.log("✅ Workspaces loaded:", allWorkspaces.length);
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("❌ Error loading workspaces:", error);
    showErrorMessage("Failed to load workspaces");
  }
}

function displayWorkspaces() {
  const container = document.getElementById("workspaces-container");
  if (!container) return;

  container.innerHTML = "";

  allWorkspaces.forEach((workspace) => {
    const workspaceElement = createWorkspaceElement(workspace);
    container.appendChild(workspaceElement);
  });
}

function createWorkspaceElement(workspace) {
  const element = document.createElement("div");
  element.className = `workspace-item ${
    workspace.id === currentWorkspaceId ? "active" : ""
  }`;
  element.onclick = () => switchWorkspace(workspace.id);

  element.innerHTML = `
    <div class="workspace-icon" style="color: ${workspace.color}">${workspace.icon}</div>
    <div class="workspace-details">
      <div class="workspace-name">${workspace.name}</div>
      <div class="workspace-description">${workspace.description}</div>
    </div>
  `;

  return element;
}

function updateCurrentWorkspaceDisplay() {
  const currentWorkspace = allWorkspaces.find(
    (w) => w.id === currentWorkspaceId
  );
  if (!currentWorkspace) return;

  // Update sidebar display
  const sidebarIcon = document.getElementById("current-workspace-icon");
  const sidebarName = document.getElementById("current-workspace-name");
  const sidebarDesc = document.getElementById("current-workspace-description");

  if (sidebarIcon) sidebarIcon.textContent = currentWorkspace.icon;
  if (sidebarName) sidebarName.textContent = currentWorkspace.name;
  if (sidebarDesc) sidebarDesc.textContent = currentWorkspace.description;

  // Update header display
  const headerIcon = document.getElementById("header-workspace-icon");
  const headerName = document.getElementById("header-workspace-name");

  if (headerIcon) headerIcon.textContent = currentWorkspace.icon;
  if (headerName) headerName.textContent = currentWorkspace.name;
}

async function switchWorkspace(workspaceId) {
  console.log("🔄 Switching to workspace:", workspaceId);

  currentWorkspaceId = workspaceId;
  localStorage.setItem("currentWorkspaceId", workspaceId.toString());

  // Update displays
  updateCurrentWorkspaceDisplay();
  displayWorkspaces();

  // Close sidebar
  closeSidebar();

  // Reload projects and tasks for new workspace
  await loadProjects();
  await loadTasks();

  showSuccessMessage(
    `Switched to ${allWorkspaces.find((w) => w.id === workspaceId)?.name}`
  );
}

// Create Workspace Dialog Functions
function openCreateWorkspaceDialog() {
  console.log("➕ Opening create workspace dialog");

  const dialog = document.getElementById("create-workspace-dialog");
  if (!dialog) {
    console.error("❌ Create workspace dialog not found!");
    return;
  }

  // Reset form
  resetCreateWorkspaceForm();

  // Setup form handlers
  setupCreateWorkspaceForm();
  setupWorkspaceIconPicker();
  setupWorkspaceColorPicker();

  // Lock scrolling and show dialog
  lockScroll();
  dialog.showModal();

  // Focus on name field
  setTimeout(() => {
    const nameField = document.getElementById("workspace-name");
    if (nameField) nameField.focus();
  }, 100);

  // Handle click outside to close
  dialog.addEventListener("click", handleDialogClickOutside);
}

function closeCreateWorkspaceDialog() {
  const dialog = document.getElementById("create-workspace-dialog");
  if (dialog) {
    dialog.close();
    unlockScroll();
  }
}

function setupCreateWorkspaceForm() {
  const form = document.getElementById("create-workspace-form");
  if (form) {
    form.removeEventListener("submit", handleCreateWorkspaceSubmit);
    form.addEventListener("submit", handleCreateWorkspaceSubmit);
  }
}

function setupWorkspaceIconPicker() {
  const iconInput = document.getElementById("workspace-icon");
  const iconPresets = document.querySelectorAll(
    "#create-workspace-dialog .icon-preset"
  );

  iconPresets.forEach((preset) => {
    preset.addEventListener("click", () => {
      const icon = preset.getAttribute("data-icon");
      iconInput.value = icon;
    });
  });
}

function setupWorkspaceColorPicker() {
  const colorInput = document.getElementById("workspace-color");
  const colorPresets = document.querySelectorAll(
    "#create-workspace-dialog .color-preset"
  );

  colorPresets.forEach((preset) => {
    preset.addEventListener("click", () => {
      const color = preset.getAttribute("data-color");
      colorInput.value = color;
    });
  });
}

async function handleCreateWorkspaceSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const workspaceData = {
    name: formData.get("name"),
    description: formData.get("description"),
    icon: formData.get("icon"),
    color: formData.get("color"),
  };

  console.log("📝 Creating workspace:", workspaceData);

  try {
    // For now, add to local array (will be replaced with API call)
    const newWorkspace = {
      id: allWorkspaces.length + 1,
      ...workspaceData,
      is_default: false,
    };

    allWorkspaces.push(newWorkspace);

    showSuccessMessage("Workspace created successfully!");
    closeCreateWorkspaceDialog();

    // Refresh workspace display
    displayWorkspaces();
  } catch (error) {
    console.error("❌ Error creating workspace:", error);
    showErrorMessage("Failed to create workspace");
  }
}

function resetCreateWorkspaceForm() {
  const form = document.getElementById("create-workspace-form");
  if (form) {
    form.reset();
    document.getElementById("workspace-icon").value = "🏢";
    document.getElementById("workspace-color").value = "#667eea";
  }
}

function setFormLoading(loading) {
  const form = document.getElementById("task-form");
  const submitBtn = document.getElementById("task-submit-btn");

  if (loading) {
    form.classList.add("form-loading");
    submitBtn.disabled = true;
  } else {
    form.classList.remove("form-loading");
    submitBtn.disabled = false;
  }
}

// API Functions
async function createTaskAPI(taskData) {
  const response = await fetch("php/api/tasks/create_task.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(taskData),
  });

  return await response.json();
}

async function updateTaskAPI(taskData) {
  const response = await fetch("php/api/tasks/update_task.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(taskData),
  });

  return await response.json();
}

async function deleteTaskAPI(taskId) {
  const response = await fetch("php/api/tasks/delete_task.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ task_id: taskId }),
  });

  return await response.json();
}

async function confirmDeleteTask(taskId) {
  try {
    // Show loading state
    const confirmBtn = document.getElementById("confirm-delete-btn");
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span class="btn-icon">⏳</span> Deleting...';

    const result = await deleteTaskAPI(taskId);

    if (result.success) {
      showSuccessMessage("Task deleted successfully!");
      closeDeleteDialog();

      // Remove task from UI with animation
      removeTaskFromUI(taskId);

      // Refresh tasks
      await refreshTasks();
    } else {
      showErrorMessage(result.message || "Failed to delete task");
    }
  } catch (error) {
    console.error("❌ Error deleting task:", error);
    showErrorMessage("Network error. Please try again.");
  } finally {
    // Restore button
    const confirmBtn = document.getElementById("confirm-delete-btn");
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = '<span class="btn-icon">🗑️</span> Delete Task';
  }
}

function removeTaskFromUI(taskId) {
  const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
  if (taskElement) {
    taskElement.style.transition = "all 0.3s ease";
    taskElement.style.transform = "scale(0.8)";
    taskElement.style.opacity = "0";

    setTimeout(() => {
      taskElement.remove();
    }, 300);
  }
}

async function refreshTasks() {
  try {
    const response = await fetch("php/api/tasks/get_tasks.php");
    const result = await response.json();

    if (result.success) {
      allTasks = result.data.tasks;
      displayTasks(result.data.tasks_by_status);
      updateTaskCounts(result.data.counts);
    }
  } catch (error) {
    console.error("❌ Error refreshing tasks:", error);
  }
}

// Theme Management Functions
function initializeTheme() {
  document.documentElement.setAttribute("data-theme", currentTheme);
  updateThemeIcon();
}

function toggleTheme() {
  currentTheme = currentTheme === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", currentTheme);
  localStorage.setItem("theme", currentTheme);
  updateThemeIcon();

  // Add smooth transition effect
  document.body.style.transition = "all 0.3s ease";
  setTimeout(() => {
    document.body.style.transition = "";
  }, 300);
}

function updateThemeIcon() {
  const themeIcon = document.getElementById("theme-icon");
  if (themeIcon) {
    themeIcon.textContent = currentTheme === "light" ? "🌙" : "☀️";
  }
}

// Enhanced Task Card Creation with Animations
function createTaskElementEnhanced(task) {
  const taskDiv = document.createElement("div");
  taskDiv.className = "task-card";
  taskDiv.setAttribute("data-task-id", task.id);
  taskDiv.setAttribute("draggable", "true");

  // Priority indicator with enhanced styling
  const priorityIcon = {
    high: "🔴",
    medium: "🟡",
    low: "🟢",
  };

  // Due date formatting with enhanced styling
  let dueDateHtml = "";
  if (task.due_date) {
    const dueDate = new Date(task.due_date);
    const isOverdue = task.is_overdue;

    dueDateHtml = `
      <div class="task-due-date ${isOverdue ? "overdue" : ""}">
        📅 ${dueDate.toLocaleDateString()}
        ${isOverdue ? " (Overdue)" : ""}
      </div>
    `;
  }

  taskDiv.innerHTML = `
    <div class="task-header">
      <div class="task-priority">${priorityIcon[task.priority]}</div>
      <div class="task-project" style="background: ${task.project_color}">
        ${task.project_name}
      </div>
    </div>
    <div class="task-title">${task.title}</div>
    <div class="task-description">${task.description || ""}</div>
    ${dueDateHtml}
    <div class="task-actions">
      <button class="task-edit-btn" onclick="editTask(${
        task.id
      })" title="Edit Task">✏️</button>
      <button class="task-delete-btn" onclick="deleteTask(${
        task.id
      })" title="Delete Task">🗑️</button>
    </div>
  `;

  // Add entrance animation
  taskDiv.style.opacity = "0";
  taskDiv.style.transform = "translateY(20px)";

  setTimeout(() => {
    taskDiv.style.transition = "all 0.3s ease";
    taskDiv.style.opacity = "1";
    taskDiv.style.transform = "translateY(0)";

    // Setup drag and drop for this new task
    setupDragAndDropForSingleTask(taskDiv);
  }, 100);

  return taskDiv;
}

// Enhanced Display Tasks with Staggered Animation
function displayTasksEnhanced(tasksByStatus) {
  // Clear existing tasks
  document.getElementById("todo-tasks").innerHTML = "";
  document.getElementById("in_progress-tasks").innerHTML = "";
  document.getElementById("done-tasks").innerHTML = "";

  // Display tasks in each column with staggered animation
  Object.keys(tasksByStatus).forEach((status, columnIndex) => {
    const container = document.getElementById(
      `${status.replace("_", "_")}-tasks`
    );
    tasksByStatus[status].forEach((task, taskIndex) => {
      const taskElement = createTaskElementEnhanced(task);

      // Staggered animation delay
      taskElement.style.animationDelay = `${
        columnIndex * 100 + taskIndex * 50
      }ms`;

      container.appendChild(taskElement);
    });
  });

  // Setup drag and drop for all newly created tasks
  setTimeout(() => {
    setupDragAndDropForTasks();
  }, 500);
}

// Drag and Drop Implementation
let draggedTask = null;
let draggedElement = null;
let dropIndicator = null;

function initializeDragAndDrop() {
  console.log("🎯 Initializing Drag & Drop functionality...");

  // Create drop indicator
  dropIndicator = document.createElement("div");
  dropIndicator.className = "drop-indicator";

  // Add drag and drop event listeners to existing tasks
  setupDragAndDropForTasks();

  // Add drop zone listeners to columns
  setupDropZones();
}

function setupDragAndDropForTasks() {
  const taskCards = document.querySelectorAll(".task-card");
  taskCards.forEach((taskCard) => setupDragAndDropForSingleTask(taskCard));
}

function setupDragAndDropForSingleTask(taskCard) {
  // Make task draggable
  taskCard.setAttribute("draggable", "true");

  // Add drag event listeners
  taskCard.addEventListener("dragstart", handleDragStart);
  taskCard.addEventListener("dragend", handleDragEnd);

  // Add touch support for mobile
  taskCard.addEventListener("touchstart", handleTouchStart, {
    passive: false,
  });
  taskCard.addEventListener("touchmove", handleTouchMove, { passive: false });
  taskCard.addEventListener("touchend", handleTouchEnd);
}

function setupDropZones() {
  const taskLists = document.querySelectorAll(".task-list");
  const columns = document.querySelectorAll(".kanban-column");

  taskLists.forEach((taskList) => {
    taskList.addEventListener("dragover", handleDragOver);
    taskList.addEventListener("drop", handleDrop);
    taskList.addEventListener("dragenter", handleDragEnter);
    taskList.addEventListener("dragleave", handleDragLeave);
  });

  columns.forEach((column) => {
    column.addEventListener("dragenter", handleColumnDragEnter);
    column.addEventListener("dragleave", handleColumnDragLeave);
  });
}

function handleDragStart(e) {
  draggedTask = {
    id: this.getAttribute("data-task-id"),
    element: this,
    originalParent: this.parentNode,
    originalStatus: this.parentNode.id.replace("-tasks", ""),
  };

  draggedElement = this;

  // Add dragging class for visual feedback
  this.classList.add("dragging");

  // Set drag data
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/html", this.outerHTML);

  // Create custom drag image
  const dragImage = this.cloneNode(true);
  dragImage.classList.add("drag-ghost");
  dragImage.style.position = "absolute";
  dragImage.style.top = "-1000px";
  document.body.appendChild(dragImage);
  e.dataTransfer.setDragImage(dragImage, e.offsetX, e.offsetY);

  // Remove drag image after a short delay
  setTimeout(() => {
    document.body.removeChild(dragImage);
  }, 0);

  console.log("🎯 Drag started for task:", draggedTask.id);
}

function handleDragEnd() {
  // Remove dragging class
  this.classList.remove("dragging");

  // Clean up drop indicators and hover states
  document.querySelectorAll(".drop-indicator").forEach((indicator) => {
    indicator.remove();
  });

  document.querySelectorAll(".drag-over").forEach((element) => {
    element.classList.remove("drag-over");
  });

  console.log("🎯 Drag ended");
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";

  // Show drop indicator at appropriate position
  showDropIndicator(e, this);
}

function handleDragEnter(e) {
  e.preventDefault();
  this.classList.add("drag-over");
}

function handleDragLeave(e) {
  // Only remove drag-over if we're actually leaving the element
  if (!this.contains(e.relatedTarget)) {
    this.classList.remove("drag-over");
    hideDropIndicator();
  }
}

function handleColumnDragEnter() {
  if (draggedTask) {
    this.classList.add("drag-over");
  }
}

function handleColumnDragLeave(e) {
  if (!this.contains(e.relatedTarget)) {
    this.classList.remove("drag-over");
  }
}

function handleDrop(e) {
  e.preventDefault();

  if (!draggedTask) return;

  const newStatus = this.id.replace("-tasks", "");

  // Remove drag-over classes
  document.querySelectorAll(".drag-over").forEach((element) => {
    element.classList.remove("drag-over");
  });

  // Hide drop indicator
  hideDropIndicator();

  // If dropped in the same column, just reorder
  if (draggedTask.originalStatus === newStatus) {
    console.log("🎯 Reordering task in same column");
    // Handle reordering logic here if needed
    return;
  }

  // Move task to new column
  console.log(
    `🎯 Moving task ${draggedTask.id} from ${draggedTask.originalStatus} to ${newStatus}`
  );

  // Update task status via API
  updateTaskStatus(draggedTask.id, newStatus, draggedTask.originalStatus);
}

// Drop Indicator Helper Functions
function showDropIndicator(e, container) {
  hideDropIndicator();

  const afterElement = getDragAfterElement(container, e.clientY);

  if (afterElement == null) {
    container.appendChild(dropIndicator);
  } else {
    container.insertBefore(dropIndicator, afterElement);
  }

  dropIndicator.classList.add("show");
}

function hideDropIndicator() {
  dropIndicator.classList.remove("show");
  if (dropIndicator.parentNode) {
    dropIndicator.parentNode.removeChild(dropIndicator);
  }
}

function getDragAfterElement(container, y) {
  const draggableElements = [
    ...container.querySelectorAll(".task-card:not(.dragging)"),
  ];

  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

// Touch Support for Mobile
let touchStartY = 0;
let touchStartX = 0;
let touchDragElement = null;

function handleTouchStart(e) {
  const touch = e.touches[0];
  touchStartY = touch.clientY;
  touchStartX = touch.clientX;
  touchDragElement = this;

  // Prevent default to avoid scrolling
  e.preventDefault();
}

function handleTouchMove(e) {
  if (!touchDragElement) return;

  const touch = e.touches[0];
  const deltaY = Math.abs(touch.clientY - touchStartY);
  const deltaX = Math.abs(touch.clientX - touchStartX);

  // Start drag if moved enough
  if (deltaY > 10 || deltaX > 10) {
    touchDragElement.classList.add("touch-dragging");
    touchDragElement.style.left = touch.clientX - 50 + "px";
    touchDragElement.style.top = touch.clientY - 50 + "px";
  }

  e.preventDefault();
}

function handleTouchEnd(e) {
  if (!touchDragElement) return;

  touchDragElement.classList.remove("touch-dragging");
  touchDragElement.style.left = "";
  touchDragElement.style.top = "";

  // Find drop target
  const touch = e.changedTouches[0];
  const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
  const dropZone = elementBelow?.closest(".task-list");

  if (dropZone && touchDragElement) {
    const newStatus = dropZone.id.replace("-tasks", "");
    const originalStatus = touchDragElement.parentNode.id.replace("-tasks", "");
    const taskId = touchDragElement.getAttribute("data-task-id");

    if (newStatus !== originalStatus) {
      updateTaskStatus(taskId, newStatus, originalStatus);
    }
  }

  touchDragElement = null;
}

// API Function to Update Task Status
async function updateTaskStatus(taskId, newStatus, oldStatus) {
  try {
    console.log(
      `🔄 Updating task ${taskId} status: ${oldStatus} → ${newStatus}`
    );

    // Show loading state
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskElement) {
      taskElement.style.opacity = "0.6";
      taskElement.style.pointerEvents = "none";
    }

    const response = await fetch("php/api/tasks/update_status_simple.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        task_id: parseInt(taskId),
        status: newStatus,
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log("✅ Task status updated successfully");

      // Move task element to new column with animation
      moveTaskElement(taskId, newStatus);

      // Update task counts
      updateTaskCountsAfterMove(oldStatus, newStatus);

      // Show success feedback
      showSuccessMessage(`Task moved to ${newStatus.replace("_", " ")}`);
    } else {
      console.error("❌ Failed to update task status:", result.message);
      showErrorMessage("Failed to move task. Please try again.");

      // Revert the visual change
      revertTaskMove(taskId, oldStatus);
    }
  } catch (error) {
    console.error("❌ Error updating task status:", error);
    showErrorMessage("Network error. Please check your connection.");

    // Revert the visual change
    revertTaskMove(taskId, oldStatus);
  }
}

// Helper Functions for Task Movement
function moveTaskElement(taskId, newStatus) {
  const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
  const newContainer = document.getElementById(`${newStatus}-tasks`);

  if (taskElement && newContainer) {
    // Add animation class
    taskElement.style.transform = "scale(0.8)";
    taskElement.style.opacity = "0.5";

    setTimeout(() => {
      // Move to new container
      newContainer.appendChild(taskElement);

      // Restore appearance with animation
      taskElement.style.transform = "scale(1)";
      taskElement.style.opacity = "1";
      taskElement.style.pointerEvents = "auto";

      // Re-setup drag and drop for the moved element
      setupDragAndDropForTasks();
    }, 200);
  }
}

function updateTaskCountsAfterMove(oldStatus, newStatus) {
  // Update the counts in the UI
  const oldCountElement = document.getElementById(
    `${oldStatus.replace("_", "_")}-count`
  );
  const newCountElement = document.getElementById(
    `${newStatus.replace("_", "_")}-count`
  );

  if (oldCountElement) {
    const oldCount = parseInt(oldCountElement.textContent) - 1;
    oldCountElement.textContent = Math.max(0, oldCount);
  }

  if (newCountElement) {
    const newCount = parseInt(newCountElement.textContent) + 1;
    newCountElement.textContent = newCount;
  }
}

function revertTaskMove(taskId, originalStatus) {
  const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
  const originalContainer = document.getElementById(`${originalStatus}-tasks`);

  if (taskElement && originalContainer) {
    originalContainer.appendChild(taskElement);
    taskElement.style.opacity = "1";
    taskElement.style.pointerEvents = "auto";
  }
}

function showSuccessMessage(message) {
  // Create and show success toast
  const toast = document.createElement("div");
  toast.className = "toast toast-success";
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--success-gradient);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: var(--shadow-medium);
    z-index: 1000;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateX(0)";
  }, 100);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

function showErrorMessage(message) {
  // Create and show error toast
  const toast = document.createElement("div");
  toast.className = "toast toast-error";
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--danger-gradient);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: var(--shadow-medium);
    z-index: 1000;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateX(0)";
  }, 100);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

// Welcome Animation
function addWelcomeAnimation() {
  const kanbanBoard = document.querySelector(".kanban-board");
  const columns = document.querySelectorAll(".kanban-column");

  if (kanbanBoard) {
    kanbanBoard.style.opacity = "0";
    kanbanBoard.style.transform = "translateY(30px)";

    setTimeout(() => {
      kanbanBoard.style.transition = "all 0.6s ease";
      kanbanBoard.style.opacity = "1";
      kanbanBoard.style.transform = "translateY(0)";
    }, 200);
  }

  // Animate columns with stagger
  columns.forEach((column, index) => {
    column.style.opacity = "0";
    column.style.transform = "translateY(50px)";

    setTimeout(() => {
      column.style.transition = "all 0.5s ease";
      column.style.opacity = "1";
      column.style.transform = "translateY(0)";
    }, 300 + index * 150);
  });
}

// Add floating particles effect (optional eye candy)
function createFloatingParticles() {
  const particleCount = 20;
  const body = document.body;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.style.cssText = `
      position: fixed;
      width: 4px;
      height: 4px;
      background: rgba(102, 126, 234, 0.3);
      border-radius: 50%;
      pointer-events: none;
      z-index: -1;
      animation: float-particle ${5 + Math.random() * 10}s linear infinite;
      left: ${Math.random() * 100}vw;
      top: ${Math.random() * 100}vh;
      animation-delay: ${Math.random() * 5}s;
    `;

    body.appendChild(particle);
  }

  // Add CSS animation for particles
  if (!document.querySelector("#particle-styles")) {
    const style = document.createElement("style");
    style.id = "particle-styles";
    style.textContent = `
      @keyframes float-particle {
        0% { transform: translateY(0) rotate(0deg); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
}
