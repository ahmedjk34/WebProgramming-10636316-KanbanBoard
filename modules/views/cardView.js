console.log("🃏 Loading CardView module...");

class CardView extends BaseView {
  constructor(options = {}) {
    super(options);

    this.viewMode = 'grid'; // grid, masonry, compact
    this.sortBy = 'priority';
    this.sortOrder = 'desc';
    this.groupBy = 'status'; // status, priority, project, none

    console.log("🃏 CardView initialized");
  }

  /**
   * Create the view element
   */
  createViewElement() {
    this.viewElement = this.container;
    console.log(`📦 Using container for Card view`);
  }

  /**
   * Render the Card view
   */
  async render() {
    if (!this.viewElement) {
      throw new Error("View element not created");
    }

    const filteredTasks = this.getFilteredTasks();
    const groupedTasks = this.groupTasks(filteredTasks);

    console.log("🃏 Generating Card view HTML");

    let cardHTML = `
      <div class="card-view">
        <div class="card-header">
          <div class="card-title">
            <h2>🃏 Card View</h2>
            <p>Visual task cards with detailed information</p>
          </div>
          
          <div class="card-controls">
            <div class="view-mode-selector">
              <button class="btn btn-small ${this.viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}" 
                      data-mode="grid" title="Grid View">
                ⊞ Grid
              </button>
              <button class="btn btn-small ${this.viewMode === 'masonry' ? 'btn-primary' : 'btn-secondary'}" 
                      data-mode="masonry" title="Masonry View">
                ⊟ Masonry
              </button>
              <button class="btn btn-small ${this.viewMode === 'compact' ? 'btn-primary' : 'btn-secondary'}" 
                      data-mode="compact" title="Compact View">
                ≡ Compact
              </button>
            </div>
            
            <div class="card-filters">
              <select id="card-group" class="form-select">
                <option value="none">No Grouping</option>
                <option value="status" ${this.groupBy === 'status' ? 'selected' : ''}>Group by Status</option>
                <option value="priority" ${this.groupBy === 'priority' ? 'selected' : ''}>Group by Priority</option>
                <option value="project" ${this.groupBy === 'project' ? 'selected' : ''}>Group by Project</option>
              </select>
              
              <select id="card-sort" class="form-select">
                <option value="priority" ${this.sortBy === 'priority' ? 'selected' : ''}>Sort by Priority</option>
                <option value="due_date" ${this.sortBy === 'due_date' ? 'selected' : ''}>Sort by Due Date</option>
                <option value="created_at" ${this.sortBy === 'created_at' ? 'selected' : ''}>Sort by Created</option>
                <option value="title" ${this.sortBy === 'title' ? 'selected' : ''}>Sort by Title</option>
              </select>
            </div>
          </div>
        </div>

        <div class="card-content ${this.viewMode}-view">
          ${this.renderCardGroups(groupedTasks)}
        </div>
      </div>
    `;

    this.viewElement.innerHTML = cardHTML;
    this.setupEventListeners();

    console.log(`🃏 Generated Card view with ${filteredTasks.length} cards`);
  }

  /**
   * Group tasks based on groupBy setting
   */
  groupTasks(tasks) {
    if (this.groupBy === 'none') {
      return { 'All Tasks': this.sortTasks(tasks) };
    }

    const groups = {};

    tasks.forEach(task => {
      let groupKey;
      
      switch (this.groupBy) {
        case 'status':
          groupKey = this.formatStatus(task.status);
          break;
        case 'priority':
          groupKey = task.priority || 'No Priority';
          break;
        case 'project':
          groupKey = task.project_name || 'No Project';
          break;
        default:
          groupKey = 'All Tasks';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(task);
    });

    // Sort tasks within each group
    Object.keys(groups).forEach(groupKey => {
      groups[groupKey] = this.sortTasks(groups[groupKey]);
    });

    return groups;
  }

  /**
   * Sort tasks based on sortBy setting
   */
  sortTasks(tasks) {
    return tasks.sort((a, b) => {
      let valueA, valueB;

      switch (this.sortBy) {
        case 'priority':
          const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
          valueA = priorityOrder[a.priority] || 0;
          valueB = priorityOrder[b.priority] || 0;
          break;
        case 'due_date':
          valueA = a.due_date ? new Date(a.due_date) : new Date('9999-12-31');
          valueB = b.due_date ? new Date(b.due_date) : new Date('9999-12-31');
          break;
        case 'created_at':
          valueA = new Date(a.created_at || 0);
          valueB = new Date(b.created_at || 0);
          break;
        case 'title':
          valueA = a.title.toLowerCase();
          valueB = b.title.toLowerCase();
          break;
        default:
          return 0;
      }

      if (this.sortOrder === 'desc') {
        return valueB > valueA ? 1 : valueB < valueA ? -1 : 0;
      } else {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      }
    });
  }

  /**
   * Render card groups
   */
  renderCardGroups(groupedTasks) {
    let groupsHTML = '';

    Object.entries(groupedTasks).forEach(([groupName, tasks]) => {
      if (this.groupBy !== 'none') {
        groupsHTML += `
          <div class="card-group">
            <div class="card-group-header">
              <h3 class="card-group-title">${groupName}</h3>
              <span class="card-group-count">${tasks.length} tasks</span>
            </div>
            <div class="card-group-content">
              ${this.renderCards(tasks)}
            </div>
          </div>
        `;
      } else {
        groupsHTML += this.renderCards(tasks);
      }
    });

    return groupsHTML;
  }

  /**
   * Render task cards
   */
  renderCards(tasks) {
    if (tasks.length === 0) {
      return `
        <div class="cards-empty">
          <div class="empty-state">
            <div class="empty-icon">🃏</div>
            <h3>No Tasks</h3>
            <p>No tasks match the current filters.</p>
          </div>
        </div>
      `;
    }

    return tasks.map(task => this.renderCard(task)).join('');
  }

  /**
   * Render a single task card
   */
  renderCard(task) {
    const priorityClass = task.priority ? `priority-${task.priority.toLowerCase()}` : '';
    const statusClass = `status-${task.status}`;
    const dueDateText = task.due_date ? this.formatDate(task.due_date) : '';
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';
    const overdueClass = isOverdue ? 'overdue' : '';

    return `
      <div class="task-card-item ${priorityClass} ${statusClass} ${overdueClass}" 
           data-task-id="${task.id}">
        
        <div class="task-card-header">
          <div class="task-card-status">
            <span class="status-indicator ${statusClass}"></span>
            <span class="status-text">${this.formatStatus(task.status)}</span>
          </div>
          
          ${task.priority ? `
            <div class="task-card-priority ${priorityClass}">
              <span class="priority-indicator"></span>
              <span class="priority-text">${task.priority}</span>
            </div>
          ` : ''}
        </div>

        <div class="task-card-body">
          <h4 class="task-card-title">${task.title}</h4>
          ${task.description ? `
            <p class="task-card-description">${this.truncateText(task.description, 120)}</p>
          ` : ''}
          
          <div class="task-card-meta">
            ${task.project_name ? `
              <div class="task-card-project">
                <span class="meta-icon">📁</span>
                <span class="meta-text">${task.project_name}</span>
              </div>
            ` : ''}
            
            ${task.assignee ? `
              <div class="task-card-assignee">
                <span class="meta-icon">👤</span>
                <span class="meta-text">${task.assignee}</span>
              </div>
            ` : ''}
            
            ${dueDateText ? `
              <div class="task-card-due-date ${overdueClass}">
                <span class="meta-icon">${isOverdue ? '⚠️' : '📅'}</span>
                <span class="meta-text">${dueDateText}</span>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="task-card-footer">
          <div class="task-card-actions">
            <button class="btn btn-small btn-secondary view-task-btn" 
                    data-task-id="${task.id}" title="View Task">
              👁️
            </button>
            <button class="btn btn-small btn-primary edit-task-btn" 
                    data-task-id="${task.id}" title="Edit Task">
              ✏️
            </button>
            <button class="btn btn-small btn-danger delete-task-btn" 
                    data-task-id="${task.id}" title="Delete Task">
              🗑️
            </button>
          </div>
          
          <div class="task-card-created">
            <span class="created-text">Created ${this.formatDate(task.created_at, 'relative')}</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    super.setupEventListeners();

    // Card-specific event listeners
    this.viewElement.addEventListener('click', (e) => {
      if (e.target.closest('.view-task-btn')) {
        const taskId = e.target.closest('.view-task-btn').dataset.taskId;
        this.viewTask(taskId);
      }

      if (e.target.closest('.edit-task-btn')) {
        const taskId = e.target.closest('.edit-task-btn').dataset.taskId;
        this.editTask(taskId);
      }

      if (e.target.closest('.delete-task-btn')) {
        const taskId = e.target.closest('.delete-task-btn').dataset.taskId;
        this.deleteTask(taskId);
      }

      // View mode selector
      if (e.target.closest('[data-mode]')) {
        const mode = e.target.closest('[data-mode]').dataset.mode;
        this.changeViewMode(mode);
      }

      // Card click to view task
      if (e.target.closest('.task-card-item') && !e.target.closest('button')) {
        const taskId = e.target.closest('.task-card-item').dataset.taskId;
        this.viewTask(taskId);
      }
    });

    // Filter and sort controls
    const groupSelect = this.viewElement.querySelector('#card-group');
    const sortSelect = this.viewElement.querySelector('#card-sort');

    if (groupSelect) {
      groupSelect.addEventListener('change', (e) => {
        this.groupBy = e.target.value;
        this.render();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.render();
      });
    }

    console.log("🎧 Card view event listeners setup");
  }

  /**
   * Change view mode
   */
  changeViewMode(mode) {
    this.viewMode = mode;
    this.render();
    console.log(`🃏 Changed card view mode to: ${mode}`);
  }

  /**
   * View task details
   */
  viewTask(taskId) {
    console.log(`👁️ Viewing task ${taskId} from card view`);
    if (window.app && window.app.uiManager) {
      window.app.uiManager.openTaskModal(taskId, 'view');
    }
  }

  /**
   * Edit task
   */
  editTask(taskId) {
    console.log(`✏️ Editing task ${taskId} from card view`);
    if (window.app && window.app.uiManager) {
      window.app.uiManager.openTaskModal(taskId, 'edit');
    }
  }

  /**
   * Delete task
   */
  deleteTask(taskId) {
    console.log(`🗑️ Deleting task ${taskId} from card view`);
    if (window.app && window.app.uiManager) {
      window.app.uiManager.openDeleteModal(taskId);
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
   * Truncate text to specified length
   */
  truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  /**
   * Format date for different contexts
   */
  formatDate(dateString, format = 'short') {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    
    switch (format) {
      case 'relative':
        const diffTime = now - date;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'today';
        if (diffDays === 1) return 'yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
      
      case 'short':
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
      
      default:
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
    }
  }
}

// Export for use in other modules
window.CardView = CardView;

console.log("✅ CardView module loaded successfully");
