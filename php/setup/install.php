<?php
/**
 * Database Installation Script
 * Kanban Board Project - Web Programming 10636316
 * 
 * This script creates the database and tables automatically
 * Run this once to set up your database
 */

// Include database configuration
require_once __DIR__ . '/../config/database.php';

/**
 * Create database and tables
 */
function installDatabase() {
    try {
        // First, connect without specifying database to create it
        $dsn = "mysql:host=" . DB_HOST . ";charset=utf8mb4";
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
        
        // Create database
        $pdo->exec("CREATE DATABASE IF NOT EXISTS " . DB_NAME . " CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        echo "✅ Database '" . DB_NAME . "' created successfully.\n";
        
        // Now connect to the specific database
        $pdo = getDBConnection();
        
        // Create projects table
        $projectsSQL = "
        CREATE TABLE IF NOT EXISTS projects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            color VARCHAR(7) DEFAULT '#3498db',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_name (name)
        ) ENGINE=InnoDB";
        
        $pdo->exec($projectsSQL);
        echo "✅ Projects table created successfully.\n";
        
        // Create tasks table
        $tasksSQL = "
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
        ) ENGINE=InnoDB";
        
        $pdo->exec($tasksSQL);
        echo "✅ Tasks table created successfully.\n";
        
        // Insert default projects
        $insertProjects = "
        INSERT IGNORE INTO projects (id, name, description, color) VALUES 
        (1, 'Default Project', 'Default project for organizing tasks', '#3498db'),
        (2, 'Personal', 'Personal tasks and reminders', '#e74c3c'),
        (3, 'Work', 'Work-related tasks and projects', '#2ecc71')";
        
        $pdo->exec($insertProjects);
        echo "✅ Default projects inserted successfully.\n";
        
        // Insert sample tasks
        $insertTasks = "
        INSERT IGNORE INTO tasks (project_id, title, description, status, priority, due_date, position) VALUES 
        (1, 'Setup Development Environment', 'Install and configure all necessary tools for the project', 'done', 'high', '2025-01-15', 1),
        (1, 'Create Database Schema', 'Design and implement the database structure', 'in_progress', 'high', '2025-01-20', 2),
        (1, 'Implement Drag & Drop', 'Add HTML5 drag and drop functionality', 'todo', 'medium', '2025-01-25', 3),
        (2, 'Plan Weekend Activities', 'Decide what to do this weekend', 'todo', 'low', '2025-01-18', 1),
        (3, 'Prepare Project Presentation', 'Create slides for the project demo', 'todo', 'high', '2025-01-30', 1)";
        
        $pdo->exec($insertTasks);
        echo "✅ Sample tasks inserted successfully.\n";
        
        echo "\n🎉 Database installation completed successfully!\n";
        echo "You can now use your Kanban board application.\n";
        
        return true;
        
    } catch(PDOException $e) {
        echo "❌ Database installation failed: " . $e->getMessage() . "\n";
        return false;
    }
}

// Run installation if accessed directly
if (basename(__FILE__) == basename($_SERVER['SCRIPT_NAME'])) {
    echo "🚀 Starting Kanban Board Database Installation...\n\n";
    
    if (installDatabase()) {
        echo "\n✅ Installation completed successfully!\n";
    } else {
        echo "\n❌ Installation failed. Please check your database configuration.\n";
    }
}
?>
