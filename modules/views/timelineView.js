console.log("📅 Loading TimelineView module...");

class TimelineView extends BaseView {
  constructor(options = {}) {
    super(options);

    this.timelineData = [];
    this.currentFilter = 'all';
    this.sortBy = 'date';
    this.sortOrder = 'desc';

    console.log("📅 TimelineView initialized");
  }

  /**
   * Create the view element
   */
  createViewElement() {
    this.viewElement = this.container;
    console.log(`📦 Using container for Timeline view`);
  }

  /**
   * Render the Timeline view
   */
  async render() {
    if (!this.viewElement) {
      throw new Error("View element not created");
    }

    const filteredTasks = this.getFilteredTasks();
    const timelineData = this.prepareTimelineData(filteredTasks);

    console.log("📅 Generating Timeline view HTML");

    let timelineHTML = `
      <div class="timeline-view">
        <div class="timeline-header">
          <div class="timeline-title">
            <h2>📅 Project Timeline</h2>
            <p>Track task progress and deadlines chronologically</p>
          </div>
          
          <div class="timeline-controls">
            <div class="timeline-filters">
              <select id="timeline-filter" class="form-select">
                <option value="all">All Tasks</option>
                <option value="upcoming">Upcoming</option>
                <option value="overdue">Overdue</option>
                <option value="completed">Completed</option>
              </select>
              
              <select id="timeline-sort" class="form-select">
                <option value="date">Sort by Date</option>
                <option value="priority">Sort by Priority</option>
                <option value="status">Sort by Status</option>
              </select>
            </div>
          </div>
        </div>

        <div class="timeline-content">
          ${this.renderTimelineItems(timelineData)}
        </div>
      </div>
    `;

    this.viewElement.innerHTML = timelineHTML;
    this.setupEventListeners();

    console.log(`📅 Generated Timeline view with ${timelineData.length} items`);
  }

  /**
   * Prepare timeline data from tasks
   */
  prepareTimelineData(tasks) {
    const timelineItems = [];

    tasks.forEach(task => {
      // Add task creation event
      timelineItems.push({
        id: `task-created-${task.id}`,
        taskId: task.id,
        type: 'task-created',
        title: `Task Created: ${task.title}`,
        description: task.description,
        date: task.created_at || new Date().toISOString(),
        status: task.status,
        priority: task.priority,
        project: task.project_name || 'No Project',
        task: task
      });

      // Add due date event if exists
      if (task.due_date) {
        const isOverdue = new Date(task.due_date) < new Date() && task.status !== 'done';
        timelineItems.push({
          id: `task-due-${task.id}`,
          taskId: task.id,
          type: isOverdue ? 'task-overdue' : 'task-due',
          title: `${isOverdue ? 'Overdue' : 'Due'}: ${task.title}`,
          description: task.description,
          date: task.due_date,
          status: task.status,
          priority: task.priority,
          project: task.project_name || 'No Project',
          task: task,
          isOverdue: isOverdue
        });
      }

      // Add completion event if completed
      if (task.status === 'done') {
        timelineItems.push({
          id: `task-completed-${task.id}`,
          taskId: task.id,
          type: 'task-completed',
          title: `Completed: ${task.title}`,
          description: task.description,
          date: task.updated_at || task.created_at || new Date().toISOString(),
          status: task.status,
          priority: task.priority,
          project: task.project_name || 'No Project',
          task: task
        });
      }
    });

    // Sort by date (newest first by default)
    return timelineItems.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return this.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }

  /**
   * Render timeline items
   */
  renderTimelineItems(timelineData) {
    if (timelineData.length === 0) {
      return `
        <div class="timeline-empty">
          <div class="empty-state">
            <div class="empty-icon">📅</div>
            <h3>No Timeline Events</h3>
            <p>Create some tasks to see timeline events here.</p>
          </div>
        </div>
      `;
    }

    let currentDate = '';
    let timelineHTML = '<div class="timeline-container">';

    timelineData.forEach((item, index) => {
      const itemDate = this.formatDate(item.date, 'date-only');
      
      // Add date separator if date changed
      if (itemDate !== currentDate) {
        currentDate = itemDate;
        timelineHTML += `
          <div class="timeline-date-separator">
            <div class="date-line"></div>
            <div class="date-label">${this.formatDate(item.date, 'full-date')}</div>
            <div class="date-line"></div>
          </div>
        `;
      }

      timelineHTML += this.renderTimelineItem(item, index);
    });

    timelineHTML += '</div>';
    return timelineHTML;
  }

  /**
   * Render a single timeline item
   */
  renderTimelineItem(item, index) {
    const typeConfig = this.getTimelineTypeConfig(item.type);
    const timeString = this.formatDate(item.date, 'time-only');
    const priorityClass = item.priority ? `priority-${item.priority.toLowerCase()}` : '';
    const statusClass = `status-${item.status}`;

    return `
      <div class="timeline-item ${item.type} ${priorityClass} ${statusClass}" 
           data-task-id="${item.taskId}" 
           data-item-id="${item.id}">
        
        <div class="timeline-marker">
          <div class="timeline-icon ${typeConfig.class}">
            ${typeConfig.icon}
          </div>
          <div class="timeline-line"></div>
        </div>

        <div class="timeline-content-card">
          <div class="timeline-card-header">
            <div class="timeline-time">${timeString}</div>
            <div class="timeline-type">${typeConfig.label}</div>
          </div>

          <div class="timeline-card-body">
            <h4 class="timeline-title">${item.title}</h4>
            ${item.description ? `<p class="timeline-description">${item.description}</p>` : ''}
            
            <div class="timeline-meta">
              <span class="timeline-project">📁 ${item.project}</span>
              <span class="timeline-status status-badge ${statusClass}">${this.formatStatus(item.status)}</span>
              ${item.priority ? `<span class="timeline-priority priority-badge ${priorityClass}">${item.priority}</span>` : ''}
              ${item.isOverdue ? '<span class="timeline-overdue">⚠️ Overdue</span>' : ''}
            </div>
          </div>

          <div class="timeline-card-actions">
            <button class="btn btn-small btn-secondary view-task-btn" data-task-id="${item.taskId}">
              👁️ View Task
            </button>
            <button class="btn btn-small btn-primary edit-task-btn" data-task-id="${item.taskId}">
              ✏️ Edit
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Get timeline type configuration
   */
  getTimelineTypeConfig(type) {
    const configs = {
      'task-created': {
        icon: '➕',
        label: 'Created',
        class: 'type-created'
      },
      'task-due': {
        icon: '📅',
        label: 'Due Date',
        class: 'type-due'
      },
      'task-overdue': {
        icon: '⚠️',
        label: 'Overdue',
        class: 'type-overdue'
      },
      'task-completed': {
        icon: '✅',
        label: 'Completed',
        class: 'type-completed'
      }
    };

    return configs[type] || {
      icon: '📝',
      label: 'Event',
      class: 'type-default'
    };
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    super.setupEventListeners();

    // Timeline-specific event listeners
    this.viewElement.addEventListener('click', (e) => {
      if (e.target.closest('.view-task-btn')) {
        const taskId = e.target.closest('.view-task-btn').dataset.taskId;
        this.viewTask(taskId);
      }

      if (e.target.closest('.edit-task-btn')) {
        const taskId = e.target.closest('.edit-task-btn').dataset.taskId;
        this.editTask(taskId);
      }
    });

    // Filter and sort controls
    const filterSelect = this.viewElement.querySelector('#timeline-filter');
    const sortSelect = this.viewElement.querySelector('#timeline-sort');

    if (filterSelect) {
      filterSelect.addEventListener('change', (e) => {
        this.currentFilter = e.target.value;
        this.render();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.render();
      });
    }

    console.log("🎧 Timeline view event listeners setup");
  }

  /**
   * View task details
   */
  viewTask(taskId) {
    console.log(`👁️ Viewing task ${taskId} from timeline`);
    // Implement task viewing logic
    if (window.app && window.app.uiManager) {
      window.app.uiManager.openTaskModal(taskId, 'view');
    }
  }

  /**
   * Edit task
   */
  editTask(taskId) {
    console.log(`✏️ Editing task ${taskId} from timeline`);
    // Implement task editing logic
    if (window.app && window.app.uiManager) {
      window.app.uiManager.openTaskModal(taskId, 'edit');
    }
  }

  /**
   * Format status for display
   */
  formatStatus(status) {
    const statusMap = {
      'todo': 'To Do',
      'in_progress': 'In Progress',
      'done': 'Done'
    };
    return statusMap[status] || status;
  }

  /**
   * Format date for different contexts
   */
  formatDate(dateString, format = 'full') {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    switch (format) {
      case 'date-only':
        return date.toISOString().split('T')[0];
      
      case 'time-only':
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
      
      case 'full-date':
        if (itemDate.getTime() === today.getTime()) {
          return 'Today';
        } else if (itemDate.getTime() === today.getTime() - 86400000) {
          return 'Yesterday';
        } else if (itemDate.getTime() === today.getTime() + 86400000) {
          return 'Tomorrow';
        } else {
          return date.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }
      
      default:
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
    }
  }
}

// Export for use in other modules
window.TimelineView = TimelineView;

console.log("✅ TimelineView module loaded successfully");
