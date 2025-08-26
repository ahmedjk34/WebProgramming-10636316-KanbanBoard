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
 * Clean database completely - DROP ALL TABLES AND DATA
 */
function cleanDatabase() {
    try {
        echo "🧹 Starting complete database cleanup...\n";
        
        // Connect to the database
        $pdo = getDBConnection();
        
        // Disable foreign key checks temporarily
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
        
        // Get all table names
        $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
        
        if (!empty($tables)) {
            echo "🗑️ Dropping " . count($tables) . " existing tables...\n";
            
            // Drop all tables
            foreach ($tables as $table) {
                $pdo->exec("DROP TABLE IF EXISTS `$table`");
                echo "   - Dropped table: $table\n";
            }
            
            echo "✅ All existing tables dropped successfully.\n";
        } else {
            echo "ℹ️ No existing tables found to drop.\n";
        }
        
        // Re-enable foreign key checks
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
        
        echo "🧹 Database cleanup completed successfully.\n\n";
        
    } catch (Exception $e) {
        echo "❌ Error during database cleanup: " . $e->getMessage() . "\n";
        throw $e;
    }
}

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
        
        // Clean the database completely before fresh installation
        cleanDatabase();
        
        // Now connect to the specific database
        $pdo = getDBConnection();

        // Create users table for authentication
        $usersSQL = "
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            avatar_url VARCHAR(255) DEFAULT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            email_verified BOOLEAN DEFAULT FALSE,
            verification_token VARCHAR(255) DEFAULT NULL,
            reset_token VARCHAR(255) DEFAULT NULL,
            reset_token_expires TIMESTAMP NULL,
            last_login TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_username (username),
            INDEX idx_email (email),
            INDEX idx_active (is_active),
            INDEX idx_verification (verification_token),
            INDEX idx_reset_token (reset_token)
        ) ENGINE=InnoDB";

        $pdo->exec($usersSQL);
        echo "✅ Users table created successfully.\n";

        // Create workspaces table with user ownership
        $workspacesSQL = "
        CREATE TABLE IF NOT EXISTS workspaces (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            color VARCHAR(7) DEFAULT '#667eea',
            icon VARCHAR(50) DEFAULT '🏢',
            owner_id INT NOT NULL,
            is_default BOOLEAN DEFAULT FALSE,
            is_shared BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_workspace_name (name),
            INDEX idx_workspace_owner (owner_id),
            INDEX idx_workspace_shared (is_shared)
        ) ENGINE=InnoDB";

        $pdo->exec($workspacesSQL);
        echo "✅ Workspaces table created successfully.\n";

        // Create projects table with workspace and user support
        $projectsSQL = "
        CREATE TABLE projects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            workspace_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            color VARCHAR(7) DEFAULT '#3498db',
            status ENUM('active', 'on_hold', 'completed', 'archived') DEFAULT 'active',
            created_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_project_workspace (workspace_id),
            INDEX idx_project_creator (created_by),
            INDEX idx_project_name (name)
        ) ENGINE=InnoDB";

        $pdo->exec($projectsSQL);
        echo "✅ Projects table created successfully.\n";

        // Create tasks table with user support
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
            created_by INT NOT NULL,
            assigned_to INT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
            INDEX idx_status (status),
            INDEX idx_priority (priority),
            INDEX idx_due_date (due_date),
            INDEX idx_project_status (project_id, status),
            INDEX idx_position (position),
            INDEX idx_task_creator (created_by),
            INDEX idx_task_assigned (assigned_to)
        ) ENGINE=InnoDB";

        $pdo->exec($tasksSQL);
        echo "✅ Tasks table created successfully.\n";

        // Create user preferences table for view settings
        $userPreferencesSQL = "
        CREATE TABLE IF NOT EXISTS user_preferences (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            preference_key VARCHAR(100) NOT NULL,
            preference_value TEXT,
            workspace_id INT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_preference (user_id, preference_key, workspace_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
            INDEX idx_user_preference (user_id, preference_key)
        ) ENGINE=InnoDB";

        $pdo->exec($userPreferencesSQL);
        echo "✅ User preferences table created successfully.\n";

        // Create workspace members table for collaboration
        $workspaceMembersSQL = "
        CREATE TABLE IF NOT EXISTS workspace_members (
            id INT AUTO_INCREMENT PRIMARY KEY,
            workspace_id INT NOT NULL,
            user_id INT NOT NULL,
            role ENUM('owner', 'admin', 'member', 'viewer') DEFAULT 'member',
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_workspace_member (workspace_id, user_id),
            INDEX idx_workspace_members (workspace_id),
            INDEX idx_user_workspaces (user_id),
            INDEX idx_member_role (role)
        ) ENGINE=InnoDB";

        $pdo->exec($workspaceMembersSQL);
        echo "✅ Workspace members table created successfully.\n";

        // Create task activity log for analytics (after tasks table)
        $taskActivitySQL = "
        CREATE TABLE IF NOT EXISTS task_activity_log (
            id INT AUTO_INCREMENT PRIMARY KEY,
            task_id INT NOT NULL,
            action_type ENUM('created', 'updated', 'status_changed', 'deleted', 'moved', 'priority_changed') NOT NULL,
            old_value TEXT,
            new_value TEXT,
            field_changed VARCHAR(50),
            user_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_task_action (task_id, action_type),
            INDEX idx_created_at (created_at),
            INDEX idx_user_activity (user_id, created_at)
        ) ENGINE=InnoDB";

        $pdo->exec($taskActivitySQL);
        echo "✅ Task activity log table created successfully.\n";

        // Create project analytics table (after projects table)
        $projectAnalyticsSQL = "
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
            INDEX idx_date (date),
            INDEX idx_project_date (project_id, date)
        ) ENGINE=InnoDB";

        $pdo->exec($projectAnalyticsSQL);
        echo "✅ Project analytics table created successfully.\n";

        // Insert default user (for demo purposes)
        $insertDefaultUser = "
        INSERT IGNORE INTO users (id, username, email, password_hash, first_name, last_name, is_active, email_verified) VALUES
        (1, 'demo_user', 'demo@kanban.com', '" . password_hash('demo123', PASSWORD_DEFAULT) . "', 'Demo', 'User', TRUE, TRUE)";

        $pdo->exec($insertDefaultUser);
        echo "✅ Default user created successfully.\n";

        // Insert default user preferences
        $insertPreferences = "
        INSERT IGNORE INTO user_preferences (user_id, preference_key, preference_value) VALUES
        (1, 'default_view', 'kanban'),
        (1, 'theme', 'light'),
        (1, 'analytics_refresh_interval', '30'),
        (1, 'show_completed_tasks', 'true'),
        (1, 'calendar_view_type', 'month')";

        $pdo->exec($insertPreferences);
        echo "✅ Default user preferences inserted successfully.\n";

        // Insert workspace members for default user
        $insertWorkspaceMembers = "
        INSERT IGNORE INTO workspace_members (workspace_id, user_id, role) VALUES
        (1, 1, 'owner'),
        (2, 1, 'owner'),
        (3, 1, 'owner')";

        $pdo->exec($insertWorkspaceMembers);
        echo "✅ Workspace members inserted successfully.\n";

        // Insert default workspaces (after user creation)
        $insertWorkspaces = "
        INSERT IGNORE INTO workspaces (id, name, description, color, icon, owner_id, is_default) VALUES
        (1, 'Personal Workspace', 'Your personal tasks and projects', '#667eea', '👤', 1, TRUE),
        (2, 'Work Workspace', 'Professional work and business projects', '#2ecc71', '💼', 1, FALSE),
        (3, 'Creative Projects', 'Creative and artistic endeavors', '#f093fb', '🎨', 1, FALSE)";

        $pdo->exec($insertWorkspaces);
        echo "✅ Default workspaces inserted successfully.\n";

        // Insert default projects with user associations
        $insertProjects = "
        INSERT IGNORE INTO projects (id, workspace_id, name, description, color, status, created_by) VALUES
        (1, 1, 'Personal Tasks', 'Daily personal tasks and reminders', '#3498db', 'active', 1),
        (2, 1, 'Home Projects', 'Home improvement and maintenance', '#e74c3c', 'active', 1),
        (3, 2, 'Work Projects', 'Professional work assignments', '#2ecc71', 'active', 1),
        (4, 2, 'Team Collaboration', 'Team-based projects and meetings', '#f39c12', 'active', 1),
        (5, 3, 'Art & Design', 'Creative design projects', '#9b59b6', 'active', 1)";

        $pdo->exec($insertProjects);
        echo "✅ Default projects inserted successfully.\n";
        
        // Insert sample tasks with user associations
        $insertTasks = "
        INSERT IGNORE INTO tasks (project_id, title, description, status, priority, due_date, position, created_by) VALUES 
        (1, 'Setup Development Environment', 'Install and configure all necessary tools for the project', 'done', 'high', '2025-01-15', 1, 1),
        (1, 'Create Database Schema', 'Design and implement the database structure', 'in_progress', 'high', '2025-01-20', 2, 1),
        (1, 'Implement Drag & Drop', 'Add HTML5 drag and drop functionality', 'todo', 'medium', '2025-01-25', 3, 1),
        (2, 'Plan Weekend Activities', 'Decide what to do this weekend', 'todo', 'low', '2025-01-18', 1, 1),
        (3, 'Prepare Project Presentation', 'Create slides for the project demo', 'todo', 'high', '2025-01-30', 1, 1)";
        
        $pdo->exec($insertTasks);
        echo "✅ Sample tasks inserted successfully.\n";

        // Create analytics views (after all tables and data exist)
        $createViews = "
        CREATE OR REPLACE VIEW task_statistics AS
        SELECT
            p.id as project_id,
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

        CREATE OR REPLACE VIEW analytics_overview AS
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
        ORDER BY date DESC";

        $pdo->exec($createViews);
        echo "✅ Analytics views created successfully.\n";

        echo "\n🎉 Database installation completed successfully!\n";
        echo "📊 Analytics tables and views created.\n";
        echo "🔧 User preferences system ready.\n";
        echo "You can now use your enhanced Kanban board application.\n";

        return true;
        
    } catch(PDOException $e) {
        echo "❌ Database installation failed: " . $e->getMessage() . "\n";
        return false;
    }
}

// Run installation if accessed directly
if (basename(__FILE__) == basename($_SERVER['SCRIPT_NAME'])) {
    echo "🚀 Starting FRESH Kanban Board Database Installation...\n";
    echo "⚠️  WARNING: This will DELETE ALL EXISTING DATA and create a fresh installation!\n\n";
    
    // Ask for confirmation (optional - you can remove this if you want automatic execution)
    echo "Proceeding with complete database cleanup and fresh installation...\n\n";
    
    if (installDatabase()) {
        echo "\n✅ FRESH Installation completed successfully!\n";
        echo "🎉 All old data has been removed and new database structure created.\n";
        echo "📊 Ready for fresh start with clean database.\n";
    } else {
        echo "\n❌ Installation failed. Please check your database configuration.\n";
    }
}
?>
