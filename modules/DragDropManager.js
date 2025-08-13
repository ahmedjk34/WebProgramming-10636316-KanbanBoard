/**
 * Drag & Drop Manager Module
 * Handles all drag and drop functionality for tasks
 */

console.log("📦 Loading DragDropManager module...");

class DragDropManager {
  constructor(dependencies = {}) {
    this.draggedTask = null;
    this.draggedElement = null;
    this.dropIndicator = null;
    this.isInitialized = false;

    // Store dependencies
    this.dependencies = dependencies;
    this.taskManager = dependencies.taskManager;

    console.log(
      "🔧 DragDropManager initialized with dependencies:",
      Object.keys(dependencies)
    );
  }

  // ===== INITIALIZATION =====

  /**
   * Initialize drag and drop functionality
   */
  initializeDragAndDrop() {
    if (this.isInitialized) return;

    console.log("🎯 Initializing Drag & Drop functionality...");

    // Create drop indicator
    this.createDropIndicator();

    // Add drag and drop event listeners to existing tasks
    this.setupDragAndDropForTasks();

    // Add drop zone listeners to columns
    this.setupDropZones();

    this.isInitialized = true;
    console.log("✅ Drag & Drop initialized successfully");
  }

  /**
   * Create drop indicator element
   */
  createDropIndicator() {
    this.dropIndicator = document.createElement("div");
    this.dropIndicator.className = "drop-indicator";
    this.dropIndicator.innerHTML = `
      <div class="drop-indicator-line"></div>
      <div class="drop-indicator-text">Drop here</div>
    `;
  }

  // ===== TASK DRAG SETUP =====

  /**
   * Setup drag and drop for all task cards
   */
  setupDragAndDropForTasks() {
    const taskCards = document.querySelectorAll(".task-card");
    taskCards.forEach((taskCard) =>
      this.setupDragAndDropForSingleTask(taskCard)
    );
  }

  /**
   * Setup drag and drop for a single task card
   * @param {HTMLElement} taskCard - Task card element
   */
  setupDragAndDropForSingleTask(taskCard) {
    // Store bound methods to avoid creating new functions each time
    if (!this.boundHandleDragStart) {
      this.boundHandleDragStart = this.handleDragStart.bind(this);
      this.boundHandleDragEnd = this.handleDragEnd.bind(this);
    }

    // Remove existing listeners to prevent duplicates
    taskCard.removeEventListener("dragstart", this.boundHandleDragStart);
    taskCard.removeEventListener("dragend", this.boundHandleDragEnd);

    // Add drag event listeners
    taskCard.addEventListener("dragstart", this.boundHandleDragStart);
    taskCard.addEventListener("dragend", this.boundHandleDragEnd);

    // Add visual feedback for draggable items
    taskCard.addEventListener("mouseenter", () => {
      if (!this.draggedTask) {
        taskCard.style.cursor = "grab";
      }
    });

    taskCard.addEventListener("mouseleave", () => {
      taskCard.style.cursor = "default";
    });
  }

  // ===== DROP ZONE SETUP =====

  /**
   * Setup drop zones for columns
   */
  setupDropZones() {
    // Store bound methods
    if (!this.boundHandleDragOver) {
      this.boundHandleDragOver = this.handleDragOver.bind(this);
      this.boundHandleDrop = this.handleDrop.bind(this);
      this.boundHandleDragEnter = this.handleDragEnter.bind(this);
      this.boundHandleDragLeave = this.handleDragLeave.bind(this);
      this.boundHandleColumnDragEnter = this.handleColumnDragEnter.bind(this);
      this.boundHandleColumnDragLeave = this.handleColumnDragLeave.bind(this);
    }

    const taskLists = document.querySelectorAll(".task-list");
    const columns = document.querySelectorAll(".kanban-column");

    taskLists.forEach((taskList) => {
      taskList.addEventListener("dragover", this.boundHandleDragOver);
      taskList.addEventListener("drop", this.boundHandleDrop);
      taskList.addEventListener("dragenter", this.boundHandleDragEnter);
      taskList.addEventListener("dragleave", this.boundHandleDragLeave);
    });

    columns.forEach((column) => {
      column.addEventListener("dragenter", this.boundHandleColumnDragEnter);
      column.addEventListener("dragleave", this.boundHandleColumnDragLeave);
    });
  }

  // ===== DRAG EVENT HANDLERS =====

  /**
   * Handle drag start event
   * @param {Event} e - Drag start event
   */
  handleDragStart(e) {
    const taskElement = e.target.closest(".task-card");
    if (!taskElement) return;

    this.draggedTask = {
      id: taskElement.getAttribute("data-task-id"),
      element: taskElement,
      originalParent: taskElement.parentNode,
      originalStatus: taskElement.parentNode.id.replace("-tasks", ""),
    };

    this.draggedElement = taskElement;

    // Add dragging class for visual feedback
    taskElement.classList.add("dragging");
    document.body.classList.add("dragging-active");

    // Set drag effect
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", taskElement.outerHTML);

    // Add subtle opacity to original element
    setTimeout(() => {
      if (this.draggedElement) {
        this.draggedElement.style.opacity = "0.5";
      }
    }, 0);

    console.log(
      `🎯 Started dragging task ${this.draggedTask.id} from ${this.draggedTask.originalStatus}`
    );
  }

  /**
   * Handle drag end event
   * @param {Event} e - Drag end event
   */
  handleDragEnd(e) {
    const taskElement = e.target.closest(".task-card");
    if (!taskElement) return;

    // Remove dragging classes
    taskElement.classList.remove("dragging");
    document.body.classList.remove("dragging-active");

    // Restore opacity
    taskElement.style.opacity = "1";

    // Remove drag-over classes from all elements
    document.querySelectorAll(".drag-over").forEach((element) => {
      element.classList.remove("drag-over");
    });

    // Hide drop indicator
    this.hideDropIndicator();

    // Reset dragged task
    this.draggedTask = null;
    this.draggedElement = null;

    console.log("🎯 Drag operation ended");
  }

  // ===== DROP EVENT HANDLERS =====

  /**
   * Handle drag over event
   * @param {Event} e - Drag over event
   */
  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    // Show drop indicator
    this.showDropIndicator(e.currentTarget);
  }

  /**
   * Handle drag enter event
   * @param {Event} e - Drag enter event
   */
  handleDragEnter(e) {
    e.preventDefault();
    if (this.draggedTask) {
      e.currentTarget.classList.add("drag-over");
    }
  }

  /**
   * Handle drag leave event
   * @param {Event} e - Drag leave event
   */
  handleDragLeave(e) {
    // Only remove drag-over if we're actually leaving the element
    if (!e.currentTarget.contains(e.relatedTarget)) {
      e.currentTarget.classList.remove("drag-over");
    }
  }

  /**
   * Handle column drag enter event
   * @param {Event} e - Drag enter event
   */
  handleColumnDragEnter(e) {
    if (this.draggedTask) {
      e.currentTarget.classList.add("column-drag-over");
    }
  }

  /**
   * Handle column drag leave event
   * @param {Event} e - Drag leave event
   */
  handleColumnDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      e.currentTarget.classList.remove("column-drag-over");
    }
  }

  /**
   * Handle drop event
   * @param {Event} e - Drop event
   */
  handleDrop(e) {
    e.preventDefault();

    if (!this.draggedTask) return;

    const newStatus = e.currentTarget.id.replace("-tasks", "");

    // Remove drag-over classes
    document.querySelectorAll(".drag-over").forEach((element) => {
      element.classList.remove("drag-over");
    });

    document.querySelectorAll(".column-drag-over").forEach((element) => {
      element.classList.remove("column-drag-over");
    });

    // Hide drop indicator
    this.hideDropIndicator();

    // If dropped in the same column, just reorder
    if (this.draggedTask.originalStatus === newStatus) {
      console.log("🎯 Reordering task in same column");
      // Handle reordering logic here if needed
      return;
    }

    // Move task to new column
    console.log(
      `🎯 Moving task ${this.draggedTask.id} from ${this.draggedTask.originalStatus} to ${newStatus}`
    );

    // Update task status via TaskManager
    if (this.taskManager) {
      this.taskManager.updateTaskStatus(
        this.draggedTask.id,
        newStatus,
        this.draggedTask.originalStatus
      );
    }
  }

  // ===== DROP INDICATOR MANAGEMENT =====

  /**
   * Show drop indicator
   * @param {HTMLElement} container - Container element
   */
  showDropIndicator(container) {
    if (!this.dropIndicator || !container) return;

    // Remove indicator from previous position
    this.hideDropIndicator();

    // Add indicator to current container
    container.appendChild(this.dropIndicator);
    this.dropIndicator.style.display = "block";
  }

  /**
   * Hide drop indicator
   */
  hideDropIndicator() {
    if (this.dropIndicator && this.dropIndicator.parentNode) {
      this.dropIndicator.parentNode.removeChild(this.dropIndicator);
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Refresh drag and drop setup (call after tasks are updated)
   */
  refreshDragAndDrop() {
    this.setupDragAndDropForTasks();
  }

  /**
   * Enable/disable drag and drop
   * @param {boolean} enabled - Whether to enable drag and drop
   */
  setDragDropEnabled(enabled) {
    const taskCards = document.querySelectorAll(".task-card");
    taskCards.forEach((taskCard) => {
      taskCard.draggable = enabled;
      if (enabled) {
        taskCard.style.cursor = "grab";
      } else {
        taskCard.style.cursor = "default";
      }
    });
  }

  /**
   * Get current dragged task
   * @returns {Object|null} Dragged task object
   */
  getDraggedTask() {
    return this.draggedTask;
  }

  /**
   * Check if drag operation is in progress
   * @returns {boolean} Whether drag is in progress
   */
  isDragging() {
    return this.draggedTask !== null;
  }
}

// Export for use in other modules
window.DragDropManager = DragDropManager;

// Also make it globally available immediately
if (typeof DragDropManager !== "undefined") {
  console.log("✅ DragDropManager loaded successfully");
}
