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

-- Create a view for task statistics
CREATE VIEW task_statistics AS
SELECT 
    p.name as project_name,
    COUNT(t.id) as total_tasks,
    SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) as todo_count,
    SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count,
    SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done_count,
    SUM(CASE WHEN t.due_date < CURDATE() AND t.status != 'done' THEN 1 ELSE 0 END) as overdue_count
FROM projects p
LEFT JOIN tasks t ON p.id = t.project_id
GROUP BY p.id, p.name;
