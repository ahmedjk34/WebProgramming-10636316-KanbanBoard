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

        // Create teams table for team collaboration (BEFORE workspaces)
        $teamsSQL = "
        CREATE TABLE IF NOT EXISTS teams (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            avatar_url VARCHAR(500),
            color VARCHAR(7) DEFAULT '#667eea',
            created_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_team_name (name),
            INDEX idx_team_creator (created_by),
            INDEX idx_team_active (is_active)
        ) ENGINE=InnoDB";

        $pdo->exec($teamsSQL);
        echo "✅ Teams table created successfully.\n";

        // Create workspaces table with user ownership and team support
        $workspacesSQL = "
        CREATE TABLE IF NOT EXISTS workspaces (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            color VARCHAR(7) DEFAULT '#667eea',
            icon VARCHAR(50) DEFAULT '🏢',
            owner_id INT NOT NULL,
            team_id INT DEFAULT NULL,
            is_default BOOLEAN DEFAULT FALSE,
            is_shared BOOLEAN DEFAULT FALSE,
            workspace_type ENUM('personal', 'team') DEFAULT 'personal',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
            INDEX idx_workspace_name (name),
            INDEX idx_workspace_owner (owner_id),
            INDEX idx_workspace_team (team_id),
            INDEX idx_workspace_type (workspace_type),
            INDEX idx_workspace_shared (is_shared)
        ) ENGINE=InnoDB";

        $pdo->exec($workspacesSQL);
        echo "✅ Workspaces table created successfully.\n";

        // Create projects table with workspace, user, and team support
        $projectsSQL = "
        CREATE TABLE projects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            workspace_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            color VARCHAR(7) DEFAULT '#3498db',
            status ENUM('active', 'on_hold', 'completed', 'archived') DEFAULT 'active',
            created_by INT NOT NULL,
            team_id INT DEFAULT NULL,
            project_type ENUM('personal', 'team') DEFAULT 'personal',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
            INDEX idx_project_workspace (workspace_id),
            INDEX idx_project_creator (created_by),
            INDEX idx_project_team (team_id),
            INDEX idx_project_type (project_type),
            INDEX idx_project_name (name)
        ) ENGINE=InnoDB";

        $pdo->exec($projectsSQL);
        echo "✅ Projects table created successfully.\n";

        // Create tasks table with user and team support
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
            team_id INT DEFAULT NULL,
            task_type ENUM('personal', 'team') DEFAULT 'personal',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
            INDEX idx_status (status),
            INDEX idx_priority (priority),
            INDEX idx_due_date (due_date),
            INDEX idx_project_status (project_id, status),
            INDEX idx_position (position),
            INDEX idx_task_creator (created_by),
            INDEX idx_task_assigned (assigned_to),
            INDEX idx_task_team (team_id),
            INDEX idx_task_type (task_type)
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

        // Create team members table
        $teamMembersSQL = "
        CREATE TABLE IF NOT EXISTS team_members (
            id INT AUTO_INCREMENT PRIMARY KEY,
            team_id INT NOT NULL,
            user_id INT NOT NULL,
            role ENUM('owner', 'admin', 'member', 'viewer') DEFAULT 'member',
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            invited_by INT,
            status ENUM('active', 'pending', 'suspended') DEFAULT 'active',
            FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL,
            UNIQUE KEY unique_team_member (team_id, user_id),
            INDEX idx_team_members (team_id),
            INDEX idx_user_teams (user_id),
            INDEX idx_member_role (role),
            INDEX idx_member_status (status)
        ) ENGINE=InnoDB";

        $pdo->exec($teamMembersSQL);
        echo "✅ Team members table created successfully.\n";

        // Create team workspaces table
        $teamWorkspacesSQL = "
        CREATE TABLE IF NOT EXISTS team_workspaces (
            id INT AUTO_INCREMENT PRIMARY KEY,
            team_id INT NOT NULL,
            workspace_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
            FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
            UNIQUE KEY unique_team_workspace (team_id, workspace_id),
            INDEX idx_team_workspaces (team_id),
            INDEX idx_workspace_teams (workspace_id)
        ) ENGINE=InnoDB";

        $pdo->exec($teamWorkspacesSQL);
        echo "✅ Team workspaces table created successfully.\n";

        // Create team projects table
        $teamProjectsSQL = "
        CREATE TABLE IF NOT EXISTS team_projects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            team_id INT NOT NULL,
            project_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            UNIQUE KEY unique_team_project (team_id, project_id),
            INDEX idx_team_projects (team_id),
            INDEX idx_project_teams (project_id)
        ) ENGINE=InnoDB";

        $pdo->exec($teamProjectsSQL);
        echo "✅ Team projects table created successfully.\n";

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

        // Insert sample teams for demonstration
        $insertTeams = "
        INSERT IGNORE INTO teams (id, name, description, color, created_by) VALUES
        (1, 'Development Team', 'Software development and engineering team', '#2ecc71', 1),
        (2, 'Design Team', 'UI/UX and graphic design team', '#f093fb', 1),
        (3, 'Marketing Team', 'Digital marketing and content creation team', '#3498db', 1)";

        $pdo->exec($insertTeams);
        echo "✅ Sample teams inserted successfully.\n";

        // Insert team members (demo user as owner of all teams)
        $insertTeamMembers = "
        INSERT IGNORE INTO team_members (team_id, user_id, role, status) VALUES
        (1, 1, 'owner', 'active'),
        (2, 1, 'owner', 'active'),
        (3, 1, 'owner', 'active')";

        $pdo->exec($insertTeamMembers);
        echo "✅ Team members inserted successfully.\n";

        // Insert sample team workspaces
        $insertTeamWorkspaces = "
        INSERT IGNORE INTO workspaces (id, name, description, color, icon, owner_id, team_id, workspace_type) VALUES
        (4, 'Sprint Planning', 'Agile sprint planning and backlog management', '#e74c3c', '📋', 1, 1, 'team'),
        (5, 'Development', 'Active development tasks and code reviews', '#2ecc71', '💻', 1, 1, 'team'),
        (6, 'Testing', 'QA testing and bug tracking', '#f39c12', '🧪', 1, 1, 'team'),
        (7, 'Design System', 'UI/UX design system and components', '#9b59b6', '🎨', 1, 2, 'team'),
        (8, 'Brand Assets', 'Brand guidelines and asset management', '#34495e', '🏷️', 1, 2, 'team'),
        (9, 'Campaign Planning', 'Marketing campaign strategy and planning', '#1abc9c', '📢', 1, 3, 'team'),
        (10, 'Content Creation', 'Content writing and social media', '#e67e22', '✍️', 1, 3, 'team')";

        $pdo->exec($insertTeamWorkspaces);
        echo "✅ Team workspaces inserted successfully.\n";

        // Insert team workspace associations
        $insertTeamWorkspaceAssociations = "
        INSERT IGNORE INTO team_workspaces (team_id, workspace_id) VALUES
        (1, 4), (1, 5), (1, 6),
        (2, 7), (2, 8),
        (3, 9), (3, 10)";

        $pdo->exec($insertTeamWorkspaceAssociations);
        echo "✅ Team workspace associations inserted successfully.\n";

        // Insert sample team projects
        $insertTeamProjects = "
        INSERT IGNORE INTO projects (id, workspace_id, name, description, color, status, created_by, team_id, project_type) VALUES
        (6, 4, 'Sprint Backlog', 'Current sprint tasks and user stories', '#e74c3c', 'active', 1, 1, 'team'),
        (7, 5, 'Frontend Development', 'React and UI component development', '#2ecc71', 'active', 1, 1, 'team'),
        (8, 5, 'Backend API', 'REST API and database development', '#3498db', 'active', 1, 1, 'team'),
        (9, 6, 'QA Testing', 'Quality assurance and testing procedures', '#f39c12', 'active', 1, 1, 'team'),
        (10, 7, 'Design System', 'Component library and design tokens', '#9b59b6', 'active', 1, 2, 'team'),
        (11, 8, 'Brand Guidelines', 'Brand identity and style guide', '#34495e', 'active', 1, 2, 'team'),
        (12, 9, 'Q1 Campaign', 'First quarter marketing campaign', '#1abc9c', 'active', 1, 3, 'team'),
        (13, 10, 'Social Media', 'Social media content and scheduling', '#e67e22', 'active', 1, 3, 'team')";

        $pdo->exec($insertTeamProjects);
        echo "✅ Team projects inserted successfully.\n";

        // Insert team project associations
        $insertTeamProjectAssociations = "
        INSERT IGNORE INTO team_projects (team_id, project_id) VALUES
        (1, 6), (1, 7), (1, 8), (1, 9),
        (2, 10), (2, 11),
        (3, 12), (3, 13)";

        $pdo->exec($insertTeamProjectAssociations);
        echo "✅ Team project associations inserted successfully.\n";

        // Insert sample team tasks
        $insertTeamTasks = "
        INSERT IGNORE INTO tasks (project_id, title, description, status, priority, due_date, position, created_by, team_id, task_type) VALUES 
        (6, 'Review Sprint Backlog', 'Review and prioritize sprint backlog items', 'todo', 'high', '2025-01-20', 1, 1, 1, 'team'),
        (6, 'Estimate Story Points', 'Estimate story points for new features', 'in_progress', 'medium', '2025-01-22', 2, 1, 1, 'team'),
        (7, 'Implement User Authentication', 'Create login and registration components', 'todo', 'high', '2025-01-25', 1, 1, 1, 'team'),
        (7, 'Design Dashboard Layout', 'Create responsive dashboard layout', 'done', 'medium', '2025-01-18', 2, 1, 1, 'team'),
        (8, 'Setup Database Schema', 'Design and implement database structure', 'in_progress', 'high', '2025-01-30', 1, 1, 1, 'team'),
        (9, 'Write Unit Tests', 'Create comprehensive unit test suite', 'todo', 'medium', '2025-02-05', 1, 1, 1, 'team'),
        (10, 'Create Component Library', 'Build reusable UI components', 'in_progress', 'high', '2025-01-28', 1, 1, 2, 'team'),
        (11, 'Update Brand Colors', 'Refresh brand color palette', 'todo', 'medium', '2025-02-01', 1, 1, 2, 'team'),
        (12, 'Plan Social Media Strategy', 'Develop Q1 social media content plan', 'todo', 'high', '2025-01-25', 1, 1, 3, 'team'),
        (13, 'Create Content Calendar', 'Plan and schedule content for February', 'in_progress', 'medium', '2025-01-23', 1, 1, 3, 'team')";

        $pdo->exec($insertTeamTasks);
        echo "✅ Team tasks inserted successfully.\n";

        // Create analytics views (after all tables and data exist)
        $createViews = "
        CREATE OR REPLACE VIEW task_statistics AS
        SELECT
            p.id as project_id,
            p.name as project_name,
            p.workspace_id,
            w.name as workspace_name,
            p.team_id,
            tm.name as team_name,
            p.project_type,
            w.workspace_type,
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
        LEFT JOIN teams tm ON p.team_id = tm.id
        GROUP BY p.id, p.name, p.workspace_id, w.name, p.team_id, tm.name, p.project_type, w.workspace_type;

        CREATE OR REPLACE VIEW analytics_overview AS
        SELECT
            DATE(t.created_at) as date,
            COUNT(*) as tasks_created,
            SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as tasks_completed,
            SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as tasks_in_progress,
            SUM(CASE WHEN t.due_date < CURDATE() AND t.status != 'done' THEN 1 ELSE 0 END) as overdue_tasks,
            p.workspace_id,
            p.team_id,
            t.task_type
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(t.created_at), p.workspace_id, p.team_id, t.task_type
        ORDER BY date DESC;

        CREATE OR REPLACE VIEW team_statistics AS
        SELECT
            tm.id as team_id,
            tm.name as team_name,
            tm.color as team_color,
            COUNT(DISTINCT tm_m.user_id) as member_count,
            COUNT(DISTINCT w.id) as workspace_count,
            COUNT(DISTINCT p.id) as project_count,
            COUNT(DISTINCT t.id) as total_tasks,
            SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as completed_tasks,
            SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
            SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) as pending_tasks,
            ROUND(
                (SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) / NULLIF(COUNT(t.id), 0)) * 100, 2
            ) as completion_percentage
        FROM teams tm
        LEFT JOIN team_members tm_m ON tm.id = tm_m.team_id AND tm_m.status = 'active'
        LEFT JOIN team_workspaces tw ON tm.id = tw.team_id
        LEFT JOIN workspaces w ON tw.workspace_id = w.id
        LEFT JOIN team_projects tp ON tm.id = tp.team_id
        LEFT JOIN projects p ON tp.project_id = p.id
        LEFT JOIN tasks t ON p.id = t.project_id
        GROUP BY tm.id, tm.name, tm.color;

        CREATE OR REPLACE VIEW user_team_overview AS
        SELECT
            u.id as user_id,
            u.username,
            u.first_name,
            u.last_name,
            tm.id as team_id,
            tm.name as team_name,
            tm_m.role as team_role,
            tm_m.joined_at,
            COUNT(DISTINCT t.id) as assigned_tasks,
            SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as completed_tasks,
            SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks
        FROM users u
        LEFT JOIN team_members tm_m ON u.id = tm_m.user_id AND tm_m.status = 'active'
        LEFT JOIN teams tm ON tm_m.team_id = tm.id
        LEFT JOIN tasks t ON u.id = t.assigned_to AND t.team_id = tm.id
        GROUP BY u.id, u.username, u.first_name, u.last_name, tm.id, tm.name, tm_m.role, tm_m.joined_at";

        $pdo->exec($createViews);
        echo "✅ Analytics views created successfully.\n";

        echo "\n🎉 Database installation completed successfully!\n";
        echo "📊 Analytics tables and views created.\n";
        echo "🔧 User preferences system ready.\n";
        echo "👥 Team collaboration system ready.\n";
        echo "📋 Personal and team workspaces configured.\n";
        echo "You can now use your enhanced Kanban board application with team support!\n";

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
