// Kanban Board JavaScript - Phase 2
// This file contains all the client-side functionality

// Global variables
let allTasks = [];
let allProjects = [];
let currentTheme = localStorage.getItem("theme") || "light";

document.addEventListener("DOMContentLoaded", function () {
  console.log("🎨 Enhanced Kanban Board Application Loaded");

  // Initialize theme
  initializeTheme();

  // Initialize the application
  initializeApp();
});

function initializeApp() {
  console.log("Initializing Kanban Board...");

  // Show loading indicator
  showLoading(true);

  // Load data from backend
  Promise.all([loadProjects(), loadTasks()])
    .then(() => {
      // Hide loading indicator
      showLoading(false);

      // Set up event listeners
      setupEventListeners();

      console.log("🎉 Kanban Board initialized successfully");

      // Add welcome animation
      addWelcomeAnimation();
    })
    .catch((error) => {
      console.error("Failed to initialize Kanban Board:", error);
      showError("Failed to load data. Please refresh the page.");
      showLoading(false);
    });
}

// Load tasks from backend
async function loadTasks() {
  try {
    const response = await fetch("php/api/tasks/get_tasks.php");
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
  try {
    const response = await fetch("php/api/projects/get_projects.php");
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

// Placeholder functions for Phase 5
function editTask(taskId) {
  console.log("Edit task:", taskId);
  alert("Task editing will be implemented in Phase 5");
}

function deleteTask(taskId) {
  console.log("Delete task:", taskId);
  alert("Task deletion will be implemented in Phase 5");
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
