# 📚 Kanban Board API Documentation

## Overview
Complete REST API for the Kanban Board application built with PHP and MySQL.

**Base URL**: `http://localhost:8000/php/api/`

## 📝 Tasks API

### GET /tasks/get_tasks.php
Retrieve all tasks with optional filtering.

**Parameters** (optional):
- `project_id` (int) - Filter by project ID
- `status` (string) - Filter by status: `todo`, `in_progress`, `done`
- `priority` (string) - Filter by priority: `low`, `medium`, `high`

**Response**:
```json
{
  "success": true,
  "message": "Tasks retrieved successfully",
  "data": {
    "tasks": [...],
    "tasks_by_status": {
      "todo": [...],
      "in_progress": [...],
      "done": [...]
    },
    "total_count": 10,
    "counts": {
      "todo": 3,
      "in_progress": 2,
      "done": 5
    }
  }
}
```

### POST /tasks/create_task.php
Create a new task.

**Required**:
- `title` (string) - Task title
- `project_id` (int) - Project ID

**Optional**:
- `description` (string) - Task description
- `status` (string) - Initial status (default: `todo`)
- `priority` (string) - Priority level (default: `medium`)
- `due_date` (string) - Due date in YYYY-MM-DD format

**Request Body**:
```json
{
  "title": "New Task",
  "description": "Task description",
  "project_id": 1,
  "priority": "high",
  "due_date": "2025-02-01"
}
```

### PUT /tasks/update_task.php
Update an existing task.

**Required**:
- `id` (int) - Task ID

**Optional**: Any task field to update

**Request Body**:
```json
{
  "id": 1,
  "title": "Updated Task Title",
  "status": "in_progress",
  "priority": "high"
}
```

### PATCH /tasks/update_status.php
Update task status and position (for drag & drop).

**Required**:
- `id` (int) - Task ID
- `status` (string) - New status

**Optional**:
- `position` (int) - New position in column

**Request Body**:
```json
{
  "id": 1,
  "status": "done",
  "position": 2
}
```

### DELETE /tasks/delete_task.php
Delete a task.

**Required**:
- `id` (int) - Task ID (URL parameter or JSON body)

**URL**: `/tasks/delete_task.php?id=1`
**OR JSON Body**:
```json
{
  "id": 1
}
```

## 📁 Projects API

### GET /projects/get_projects.php
Retrieve all projects with task counts.

**Response**:
```json
{
  "success": true,
  "message": "Projects retrieved successfully",
  "data": {
    "projects": [
      {
        "id": 1,
        "name": "Default Project",
        "description": "Default project description",
        "color": "#3498db",
        "task_count": 5,
        "todo_count": 2,
        "in_progress_count": 1,
        "done_count": 2
      }
    ],
    "total_count": 3
  }
}
```

### POST /projects/create_project.php
Create a new project.

**Required**:
- `name` (string) - Project name

**Optional**:
- `description` (string) - Project description
- `color` (string) - Hex color code (default: `#3498db`)

**Request Body**:
```json
{
  "name": "New Project",
  "description": "Project description",
  "color": "#e74c3c"
}
```

### PUT /projects/update_project.php
Update an existing project.

**Required**:
- `id` (int) - Project ID

**Optional**: Any project field to update

**Request Body**:
```json
{
  "id": 1,
  "name": "Updated Project Name",
  "color": "#2ecc71"
}
```

### DELETE /projects/delete_project.php
Delete a project (moves tasks to default project).

**Required**:
- `id` (int) - Project ID (URL parameter or JSON body)

**Note**: Cannot delete the default project (ID: 1)

## 🔒 Security Features

### Input Sanitization
- All inputs are sanitized using `htmlspecialchars()`
- XSS prevention for user-generated content
- SQL injection prevention with PDO prepared statements

### Validation
- Data type validation (int, string, email, etc.)
- Format validation (dates, colors, etc.)
- Business logic validation (status, priority values)
- Required field validation

### Error Handling
- Proper HTTP status codes
- Consistent JSON error responses
- Detailed error logging
- Rate limiting protection

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "timestamp": "2025-01-08 12:00:00"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "data": {
    "errors": { ... }
  },
  "timestamp": "2025-01-08 12:00:00"
}
```

## 🧪 Testing

### API Testing Script
Access `http://localhost:8000/test_api.php` to test all endpoints interactively.

### Manual Testing Examples

**Get all tasks**:
```bash
curl -X GET "http://localhost:8000/php/api/tasks/get_tasks.php"
```

**Create a task**:
```bash
curl -X POST "http://localhost:8000/php/api/tasks/create_task.php" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task","project_id":1,"priority":"high"}'
```

**Update task status**:
```bash
curl -X PATCH "http://localhost:8000/php/api/tasks/update_status.php" \
  -H "Content-Type: application/json" \
  -d '{"id":1,"status":"done"}'
```

## 🚀 Usage in Frontend

### JavaScript Fetch Examples

```javascript
// Get tasks
const response = await fetch('php/api/tasks/get_tasks.php');
const result = await response.json();

// Create task
const taskData = {
  title: 'New Task',
  project_id: 1,
  priority: 'high'
};

const response = await fetch('php/api/tasks/create_task.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(taskData)
});

// Update task status (drag & drop)
const statusData = {
  id: taskId,
  status: 'in_progress',
  position: 2
};

const response = await fetch('php/api/tasks/update_status.php', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(statusData)
});
```

## 📈 Performance Notes

- Database queries are optimized with proper indexes
- Prepared statements prevent SQL injection
- Minimal data transfer with structured responses
- Position management for drag & drop operations
- Transaction support for data consistency

## 🔧 Configuration

API behavior can be configured in `config.php`:
- Debug mode for detailed error messages
- Rate limiting settings
- Database connection parameters
- Security settings
