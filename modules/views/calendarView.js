console.log("📅 Loading CalendarView module...");

class CalendarView extends BaseView {
  constructor(options = {}) {
    super(options);

    this.currentDate = new Date();
    this.viewMode = "month"; // month, week, day
    this.calendarData = {};

    console.log("📅 CalendarView initialized");
  }

  /**
   * Create the view element - DYNAMIC INJECTION
   */
  createViewElement() {
    // Use container directly for dynamic injection
    this.viewElement = this.container;
    console.log(`📦 Using container for dynamic Calendar injection`);
  }

  /**
   * Render the Calendar view - COMPLETE DYNAMIC HTML INJECTION
   */
  async render() {
    if (!this.viewElement) {
      throw new Error("View element not created");
    }

    const filteredTasks = this.getFilteredTasks();

    // Group tasks by date
    this.calendarData = this.groupTasksByDate(filteredTasks);

    // Generate COMPLETE Calendar HTML
    let calendarHTML = this.renderCalendarControls();
    calendarHTML += this.renderCalendarGrid();

    // INJECT THE COMPLETE HTML INTO CONTAINER
    this.viewElement.innerHTML = calendarHTML;

    console.log(
      `🎨 DYNAMICALLY RENDERED Calendar view with ${filteredTasks.length} tasks`
    );
  }

  /**
   * Render calendar controls
   */
  renderCalendarControls() {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const currentMonth = monthNames[this.currentDate.getMonth()];
    const currentYear = this.currentDate.getFullYear();

    return `
      <div class="calendar-controls">
        <div class="calendar-navigation">
          <button class="btn btn-secondary" id="prev-month">
            <span class="btn-icon">◀</span>
            Previous
          </button>
          
          <div class="current-period">
            <h2>${currentMonth} ${currentYear}</h2>
          </div>
          
          <button class="btn btn-secondary" id="next-month">
            Next
            <span class="btn-icon">▶</span>
          </button>
        </div>
        
        <div class="calendar-view-modes">
          <button class="btn btn-small ${
            this.viewMode === "month" ? "btn-primary" : "btn-secondary"
          }" 
                  data-mode="month">Month</button>
          <button class="btn btn-small ${
            this.viewMode === "week" ? "btn-primary" : "btn-secondary"
          }" 
                  data-mode="week">Week</button>
          <button class="btn btn-small ${
            this.viewMode === "day" ? "btn-primary" : "btn-secondary"
          }" 
                  data-mode="day">Day</button>
        </div>
        
        <div class="calendar-actions">
          <button class="btn btn-secondary" id="today-btn">Today</button>
          <button class="btn btn-primary" id="add-task-calendar">
            <span class="btn-icon">➕</span>
            Add Task
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render calendar grid
   */
  renderCalendarGrid() {
    switch (this.viewMode) {
      case "month":
        return this.renderMonthView();
      case "week":
        return this.renderWeekView();
      case "day":
        return this.renderDayView();
      default:
        return this.renderMonthView();
    }
  }

  /**
   * Render month view
   */
  renderMonthView() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Days of week headers
    const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    let calendarHTML = '<div class="calendar-grid month-view">';

    // Header row
    calendarHTML += '<div class="calendar-header">';
    dayHeaders.forEach((day) => {
      calendarHTML += `<div class="day-header">${day}</div>`;
    });
    calendarHTML += "</div>";

    // Calendar body
    calendarHTML += '<div class="calendar-body">';

    let dayCount = 1;
    const totalCells = Math.ceil((daysInMonth + startingDayOfWeek) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      const isCurrentMonth = i >= startingDayOfWeek && dayCount <= daysInMonth;
      const dayNumber = isCurrentMonth ? dayCount : "";
      const dateKey = isCurrentMonth
        ? this.formatDateKey(year, month, dayCount)
        : "";
      const dayTasks = dateKey ? this.calendarData[dateKey] || [] : [];

      const isToday = isCurrentMonth && this.isToday(year, month, dayCount);
      const dayClass = `calendar-day ${
        isCurrentMonth ? "current-month" : "other-month"
      } ${isToday ? "today" : ""}`;

      calendarHTML += `
        <div class="${dayClass}" data-date="${dateKey}">
          <div class="day-number">${dayNumber}</div>
          <div class="day-tasks">
            ${this.renderDayTasks(dayTasks, true)}
          </div>
        </div>
      `;

      if (isCurrentMonth) dayCount++;
    }

    calendarHTML += "</div></div>";

    return calendarHTML;
  }

  /**
   * Render week view
   */
  renderWeekView() {
    const weekStart = this.getWeekStart(this.currentDate);
    const dayHeaders = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    let calendarHTML = '<div class="calendar-grid week-view">';

    // Header row
    calendarHTML += '<div class="calendar-header">';
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dayName = dayHeaders[i];
      const dayNumber = date.getDate();
      const isToday = this.isToday(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );

      calendarHTML += `
        <div class="day-header ${isToday ? "today" : ""}">
          <div class="day-name">${dayName}</div>
          <div class="day-number">${dayNumber}</div>
        </div>
      `;
    }
    calendarHTML += "</div>";

    // Calendar body
    calendarHTML += '<div class="calendar-body">';
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateKey = this.formatDateKey(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const dayTasks = this.calendarData[dateKey] || [];
      const isToday = this.isToday(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );

      calendarHTML += `
        <div class="calendar-day week-day ${
          isToday ? "today" : ""
        }" data-date="${dateKey}">
          <div class="day-tasks">
            ${this.renderDayTasks(dayTasks, false)}
          </div>
        </div>
      `;
    }
    calendarHTML += "</div></div>";

    return calendarHTML;
  }

  /**
   * Render day view
   */
  renderDayView() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const day = this.currentDate.getDate();
    const dateKey = this.formatDateKey(year, month, day);
    const dayTasks = this.calendarData[dateKey] || [];

    const dayName = this.currentDate.toLocaleDateString("en-US", {
      weekday: "long",
    });
    const dayNumber = this.currentDate.getDate();
    const monthName = this.currentDate.toLocaleDateString("en-US", {
      month: "long",
    });

    return `
      <div class="calendar-grid day-view">
        <div class="day-header-large">
          <h2>${dayName}, ${monthName} ${dayNumber}</h2>
        </div>
        
        <div class="day-content">
          <div class="day-tasks-detailed">
            ${this.renderDayTasks(dayTasks, false, true)}
          </div>
          
          ${
            dayTasks.length === 0
              ? `
            <div class="no-tasks">
              <p>No tasks scheduled for this day</p>
              <button class="btn btn-primary" onclick="this.closest('.view-content').dispatchEvent(new CustomEvent('addTask', {detail: {date: '${dateKey}'}}))">
                <span class="btn-icon">➕</span>
                Add Task
              </button>
            </div>
          `
              : ""
          }
        </div>
      </div>
    `;
  }

  /**
   * Render tasks for a day
   */
  renderDayTasks(tasks, compact = false, detailed = false) {
    if (tasks.length === 0) return "";

    if (compact && tasks.length > 3) {
      // Show first 2 tasks and a "more" indicator
      const visibleTasks = tasks.slice(0, 2);
      const remainingCount = tasks.length - 2;

      return (
        visibleTasks
          .map((task) => this.renderTaskInCalendar(task, true))
          .join("") + `<div class="more-tasks">+${remainingCount} more</div>`
      );
    }

    return tasks
      .map((task) => this.renderTaskInCalendar(task, compact, detailed))
      .join("");
  }

  /**
   * Render a task in calendar
   */
  renderTaskInCalendar(task, compact = false, detailed = false) {
    const project = this.getProjects().find((p) => p.id == task.project_id);
    const projectColor = project ? project.color : "#6c757d";
    const priorityIcon = this.getPriorityIcon(task.priority);

    if (detailed) {
      return `
        <div class="calendar-task detailed" 
             data-task-id="${task.id}" 
             style="border-left-color: ${projectColor}">
          <div class="task-header">
            <span class="task-priority">${priorityIcon}</span>
            <span class="task-title">${this.escapeHtml(task.title)}</span>
            <span class="task-status status-${
              task.status
            }">${task.status.replace("_", " ")}</span>
          </div>
          ${
            task.description
              ? `<div class="task-description">${this.escapeHtml(
                  task.description
                )}</div>`
              : ""
          }
          <div class="task-meta">
            <span class="task-project">${
              project ? this.escapeHtml(project.name) : "Unknown"
            }</span>
            ${
              task.due_date
                ? `<span class="task-time">${this.formatTime(
                    task.due_date
                  )}</span>`
                : ""
            }
          </div>
        </div>
      `;
    }

    if (compact) {
      return `
        <div class="calendar-task compact" 
             data-task-id="${task.id}" 
             style="background-color: ${projectColor}20; border-left-color: ${projectColor}"
             title="${this.escapeHtml(task.title)}">
          <span class="task-title-short">${this.escapeHtml(
            task.title.substring(0, 20)
          )}${task.title.length > 20 ? "..." : ""}</span>
        </div>
      `;
    }

    return `
      <div class="calendar-task" 
           data-task-id="${task.id}" 
           style="border-left-color: ${projectColor}">
        <div class="task-content">
          <span class="task-priority">${priorityIcon}</span>
          <span class="task-title">${this.escapeHtml(task.title)}</span>
          <span class="task-status status-${task.status}">${task.status.replace(
      "_",
      " "
    )}</span>
        </div>
      </div>
    `;
  }

  /**
   * Setup event listeners for Calendar view
   */
  setupEventListeners() {
    super.setupEventListeners();

    if (!this.viewElement) return;

    // Navigation buttons
    const prevBtn = this.viewElement.querySelector("#prev-month");
    const nextBtn = this.viewElement.querySelector("#next-month");
    const todayBtn = this.viewElement.querySelector("#today-btn");

    if (prevBtn) {
      prevBtn.addEventListener("click", () => this.navigatePrevious());
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => this.navigateNext());
    }

    if (todayBtn) {
      todayBtn.addEventListener("click", () => this.goToToday());
    }

    // View mode buttons
    this.viewElement.addEventListener("click", (e) => {
      if (e.target.dataset.mode) {
        this.changeViewMode(e.target.dataset.mode);
      }
    });

    // Add task button
    const addTaskBtn = this.viewElement.querySelector("#add-task-calendar");
    if (addTaskBtn) {
      addTaskBtn.addEventListener("click", () => this.showAddTaskModal());
    }

    // Task click handlers
    this.viewElement.addEventListener("click", (e) => {
      const taskElement = e.target.closest(".calendar-task");
      if (taskElement) {
        const taskId = taskElement.dataset.taskId;
        this.showTaskDetails(taskId);
      }
    });

    // Day click handlers
    this.viewElement.addEventListener("click", (e) => {
      const dayElement = e.target.closest(".calendar-day");
      if (dayElement && dayElement.dataset.date) {
        this.onDayClick(dayElement.dataset.date);
      }
    });

    // Custom events
    this.viewElement.addEventListener("addTask", (e) => {
      this.showAddTaskModal(e.detail.date);
    });

    console.log("🎧 Calendar view event listeners setup");
  }

  /**
   * Group tasks by date
   */
  groupTasksByDate(tasks) {
    const grouped = {};

    tasks.forEach((task) => {
      let dateKey;

      if (task.due_date) {
        const dueDate = new Date(task.due_date);
        dateKey = this.formatDateKey(
          dueDate.getFullYear(),
          dueDate.getMonth(),
          dueDate.getDate()
        );
      } else {
        // Tasks without due date go to today
        const today = new Date();
        dateKey = this.formatDateKey(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );
      }

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(task);
    });

    return grouped;
  }

  /**
   * Navigate to previous period
   */
  navigatePrevious() {
    switch (this.viewMode) {
      case "month":
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        break;
      case "week":
        this.currentDate.setDate(this.currentDate.getDate() - 7);
        break;
      case "day":
        this.currentDate.setDate(this.currentDate.getDate() - 1);
        break;
    }
    this.render();
  }

  /**
   * Navigate to next period
   */
  navigateNext() {
    switch (this.viewMode) {
      case "month":
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        break;
      case "week":
        this.currentDate.setDate(this.currentDate.getDate() + 7);
        break;
      case "day":
        this.currentDate.setDate(this.currentDate.getDate() + 1);
        break;
    }
    this.render();
  }

  /**
   * Go to today
   */
  goToToday() {
    this.currentDate = new Date();
    this.render();
  }

  /**
   * Change view mode
   */
  changeViewMode(mode) {
    this.viewMode = mode;
    this.render();
  }

  /**
   * Handle day click
   */
  onDayClick(dateKey) {
    if (this.viewMode !== "day") {
      // Switch to day view for the clicked date
      const [year, month, day] = dateKey.split("-").map(Number);
      this.currentDate = new Date(year, month, day);
      this.viewMode = "day";
      this.render();
    }
  }

  /**
   * Show task details
   */
  showTaskDetails(taskId) {
    const task = this.getAllTasks().find((t) => t.id == taskId);
    if (task && this.uiManager && this.uiManager.showTaskModal) {
      this.uiManager.showTaskModal("edit", task);
    }
  }

  /**
   * Show add task modal
   */
  showAddTaskModal(dateKey = null) {
    const defaultData = {};

    if (dateKey) {
      const [year, month, day] = dateKey.split("-").map(Number);
      const date = new Date(year, month, day);
      defaultData.due_date = date.toISOString().split("T")[0];
    }

    if (this.uiManager && this.uiManager.showTaskModal) {
      this.uiManager.showTaskModal("create", null, defaultData);
    }
  }

  /**
   * Utility functions
   */
  formatDateKey(year, month, day) {
    return `${year}-${month}-${day}`;
  }

  getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  isToday(year, month, day) {
    const today = new Date();
    return (
      year === today.getFullYear() &&
      month === today.getMonth() &&
      day === today.getDate()
    );
  }

  formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  getPriorityIcon(priority) {
    const icons = {
      high: "🔴",
      medium: "🟡",
      low: "🟢",
    };
    return icons[priority] || "⚪";
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

// Make CalendarView available globally
window.CalendarView = CalendarView;

console.log("✅ CalendarView module loaded successfully");
