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

        // Create workspaces table (highest level in hierarchy)
        $workspacesSQL = "
        CREATE TABLE IF NOT EXISTS workspaces (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            color VARCHAR(7) DEFAULT '#667eea',
            icon VARCHAR(50) DEFAULT '🏢',
            is_default BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_workspace_name (name)
        ) ENGINE=InnoDB";

        $pdo->exec($workspacesSQL);
        echo "✅ Workspaces table created successfully.\n";

        // Check if projects table exists and if it has workspace_id column
        $checkProjectsTable = "SHOW TABLES LIKE 'projects'";
        $tableExists = $pdo->query($checkProjectsTable)->rowCount() > 0;

        if ($tableExists) {
            // Check if workspace_id column exists
            $checkColumn = "SHOW COLUMNS FROM projects LIKE 'workspace_id'";
            $columnExists = $pdo->query($checkColumn)->rowCount() > 0;

            if (!$columnExists) {
                // Add workspace_id column to existing projects table
                echo "🔄 Updating existing projects table to add workspace_id column...\n";
                $alterSQL = "ALTER TABLE projects
                            ADD COLUMN workspace_id INT NOT NULL DEFAULT 1 AFTER id,
                            ADD COLUMN status ENUM('active', 'on_hold', 'completed', 'archived') DEFAULT 'active' AFTER color,
                            ADD FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
                            ADD INDEX idx_project_workspace (workspace_id)";
                $pdo->exec($alterSQL);
                echo "✅ Projects table updated successfully.\n";
            } else {
                echo "✅ Projects table already has workspace_id column.\n";
            }
        } else {
            // Create new projects table with workspace support
            $projectsSQL = "
            CREATE TABLE projects (
                id INT AUTO_INCREMENT PRIMARY KEY,
                workspace_id INT NOT NULL,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                color VARCHAR(7) DEFAULT '#3498db',
                status ENUM('active', 'on_hold', 'completed', 'archived') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
                INDEX idx_project_workspace (workspace_id),
                INDEX idx_project_name (name)
            ) ENGINE=InnoDB";

            $pdo->exec($projectsSQL);
            echo "✅ Projects table created successfully.\n";
        }
        
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
        
        // Insert default workspaces
        $insertWorkspaces = "
        INSERT IGNORE INTO workspaces (id, name, description, color, icon, is_default) VALUES
        (1, 'Personal Workspace', 'Your personal tasks and projects', '#667eea', '👤', TRUE),
        (2, 'Work Workspace', 'Professional work and business projects', '#2ecc71', '💼', FALSE),
        (3, 'Creative Projects', 'Creative and artistic endeavors', '#f093fb', '🎨', FALSE)";

        $pdo->exec($insertWorkspaces);
        echo "✅ Default workspaces inserted successfully.\n";

        // Insert default projects (now with workspace associations)
        // First, check if we need to update existing projects to have workspace_id
        $checkExistingProjects = "SELECT COUNT(*) as count FROM projects WHERE workspace_id IS NULL OR workspace_id = 0";
        $result = $pdo->query($checkExistingProjects);
        $needsUpdate = $result->fetch()['count'] > 0;

        if ($needsUpdate) {
            // Update existing projects to belong to default workspace
            $updateExisting = "UPDATE projects SET workspace_id = 1 WHERE workspace_id IS NULL OR workspace_id = 0";
            $pdo->exec($updateExisting);
            echo "✅ Updated existing projects to belong to default workspace.\n";
        }

        // Insert default projects if they don't exist
        $insertProjects = "
        INSERT IGNORE INTO projects (id, workspace_id, name, description, color, status) VALUES
        (1, 1, 'Personal Tasks', 'Daily personal tasks and reminders', '#3498db', 'active'),
        (2, 1, 'Home Projects', 'Home improvement and maintenance', '#e74c3c', 'active'),
        (3, 2, 'Work Projects', 'Professional work assignments', '#2ecc71', 'active'),
        (4, 2, 'Team Collaboration', 'Team-based projects and meetings', '#f39c12', 'active'),
        (5, 3, 'Art & Design', 'Creative design projects', '#9b59b6', 'active')";

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
