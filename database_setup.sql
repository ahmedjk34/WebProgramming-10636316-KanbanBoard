-- Kanban Board Database Setup
-- Web Programming 10636316 Project
-- Run this script to create the database and tables

-- Create database
CREATE DATABASE IF NOT EXISTS kanban_board 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Use the database
USE kanban_board;

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3498db',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB;

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('todo', 'in_progress', 'done') DEFAULT 'todo',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    due_date DATE NULL,
    position INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_due_date (due_date),
    INDEX idx_project_status (project_id, status),
    INDEX idx_position (position)
) ENGINE=InnoDB;

-- Insert default project
INSERT INTO projects (name, description, color) VALUES 
('Default Project', 'Default project for organizing tasks', '#3498db'),
('Personal', 'Personal tasks and reminders', '#e74c3c'),
('Work', 'Work-related tasks and projects', '#2ecc71');

-- Insert sample tasks for demonstration
INSERT INTO tasks (project_id, title, description, status, priority, due_date, position) VALUES 
(1, 'Setup Development Environment', 'Install and configure all necessary tools for the project', 'done', 'high', '2025-01-15', 1),
(1, 'Create Database Schema', 'Design and implement the database structure', 'in_progress', 'high', '2025-01-20', 2),
(1, 'Implement Drag & Drop', 'Add HTML5 drag and drop functionality', 'todo', 'medium', '2025-01-25', 3),
(2, 'Plan Weekend Activities', 'Decide what to do this weekend', 'todo', 'low', '2025-01-18', 1),
(3, 'Prepare Project Presentation', 'Create slides for the project demo', 'todo', 'high', '2025-01-30', 1);

-- Create workspaces table for multi-workspace support
CREATE TABLE IF NOT EXISTS workspaces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(10) DEFAULT '🏢',
    color VARCHAR(7) DEFAULT '#667eea',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB;

-- Add workspace_id to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS workspace_id INT DEFAULT 1;
ALTER TABLE projects ADD FOREIGN KEY IF NOT EXISTS (workspace_id) REFERENCES workspaces(id) ON DELETE SET DEFAULT;

-- Create user preferences table for view settings
CREATE TABLE IF NOT EXISTS user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT 1, -- For future user system
    preference_key VARCHAR(100) NOT NULL,
    preference_value TEXT,
    workspace_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_preference (user_id, preference_key, workspace_id),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Create task activity log for analytics
CREATE TABLE IF NOT EXISTS task_activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL,
    action_type ENUM('created', 'updated', 'status_changed', 'deleted', 'moved') NOT NULL,
    old_value TEXT,
    new_value TEXT,
    field_changed VARCHAR(50),
    user_id INT DEFAULT 1, -- For future user system
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    INDEX idx_task_action (task_id, action_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- Create project analytics table
CREATE TABLE IF NOT EXISTS project_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    date DATE NOT NULL,
    tasks_created INT DEFAULT 0,
    tasks_completed INT DEFAULT 0,
    tasks_in_progress INT DEFAULT 0,
    total_tasks INT DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE KEY unique_project_date (project_id, date),
    INDEX idx_date (date)
) ENGINE=InnoDB;

-- Insert default workspaces
INSERT INTO workspaces (name, description, icon, color, is_default) VALUES
('Personal', 'Personal tasks and reminders', '👤', '#e74c3c', TRUE),
('Work', 'Work-related tasks and projects', '💼', '#2ecc71', FALSE),
('Creative Projects', 'Creative and artistic projects', '🎨', '#9b59b6', FALSE);

-- Update existing projects to use default workspace
UPDATE projects SET workspace_id = 1 WHERE workspace_id IS NULL;

-- Create a view for task statistics
CREATE VIEW task_statistics AS
SELECT
    p.name as project_name,
    p.workspace_id,
    w.name as workspace_name,
    COUNT(t.id) as total_tasks,
    SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) as todo_count,
    SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count,
    SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done_count,
    SUM(CASE WHEN t.due_date < CURDATE() AND t.status != 'done' THEN 1 ELSE 0 END) as overdue_count,
    ROUND(
        (SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) / NULLIF(COUNT(t.id), 0)) * 100, 2
    ) as completion_percentage
FROM projects p
LEFT JOIN tasks t ON p.id = t.project_id
LEFT JOIN workspaces w ON p.workspace_id = w.id
GROUP BY p.id, p.name, p.workspace_id, w.name;

-- Create analytics view for dashboard
CREATE VIEW analytics_overview AS
SELECT
    DATE(t.created_at) as date,
    COUNT(*) as tasks_created,
    SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as tasks_completed,
    SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as tasks_in_progress,
    SUM(CASE WHEN t.due_date < CURDATE() AND t.status != 'done' THEN 1 ELSE 0 END) as overdue_tasks,
    p.workspace_id
FROM tasks t
LEFT JOIN projects p ON t.project_id = p.id
WHERE t.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY DATE(t.created_at), p.workspace_id
ORDER BY date DESC;
