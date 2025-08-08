// Kanban Board JavaScript - Phase 2
// This file contains all the client-side functionality

// Global variables
let allTasks = [];
let allProjects = [];

document.addEventListener("DOMContentLoaded", function () {
  console.log("Kanban Board Application Loaded");

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

      console.log("Kanban Board initialized successfully");
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
  // Clear existing tasks
  document.getElementById("todo-tasks").innerHTML = "";
  document.getElementById("in_progress-tasks").innerHTML = "";
  document.getElementById("done-tasks").innerHTML = "";

  // Display tasks in each column
  Object.keys(tasksByStatus).forEach((status) => {
    const container = document.getElementById(
      `${status.replace("_", "_")}-tasks`
    );
    tasksByStatus[status].forEach((task) => {
      const taskElement = createTaskElement(task);
      container.appendChild(taskElement);
    });
  });
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
    const today = new Date();
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
  const projectFilter = document.getElementById("project-filter");
  if (projectFilter) {
    // Clear existing options except "All Projects"
    projectFilter.innerHTML = '<option value="">All Projects</option>';

    // Add project options
    projects.forEach((project) => {
      const option = document.createElement("option");
      option.value = project.id;
      option.textContent = project.name;
      projectFilter.appendChild(option);
    });
  }
}

function setupEventListeners() {
  // Refresh button
  const refreshBtn = document.getElementById("refresh-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      location.reload();
    });
  }

  // Project filter
  const projectFilter = document.getElementById("project-filter");
  if (projectFilter) {
    projectFilter.addEventListener("change", filterTasks);
  }

  // Priority filter
  const priorityFilter = document.getElementById("priority-filter");
  if (priorityFilter) {
    priorityFilter.addEventListener("change", filterTasks);
  }
}

function filterTasks() {
  const projectId = document.getElementById("project-filter").value;
  const priority = document.getElementById("priority-filter").value;

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

  displayTasks(tasksByStatus);

  // Update counts
  updateTaskCounts({
    todo: tasksByStatus.todo.length,
    in_progress: tasksByStatus.in_progress.length,
    done: tasksByStatus.done.length,
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
