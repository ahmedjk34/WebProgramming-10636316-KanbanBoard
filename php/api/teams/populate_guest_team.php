<?php
/**
 * Populate Guest Team with Dummy Data
 * This script creates a team with Guest user as admin and populates it with dummy users and tasks
 */

// Prevent direct access
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Include required files
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../includes/auth_middleware.php';

// Set JSON content type
header('Content-Type: application/json');

try {
    // Start session and check authentication
    safeSessionStart();
    
    if (!isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['error' => 'Authentication required']);
        exit;
    }

    // Get user ID from session
    $userId = $_SESSION['user_id'];
    
    // Connect to database
    $pdo = getDBConnection();
    
    // Check if Guest user exists, if not create it
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = 'guest' OR email = 'guest@example.com' LIMIT 1");
    $stmt->execute();
    $guestUser = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$guestUser) {
        // Create Guest user
        $stmt = $pdo->prepare("
            INSERT INTO users (username, email, first_name, last_name, password_hash, is_active, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            'guest',
            'guest@example.com',
            'Guest',
            'User',
            password_hash('guest123', PASSWORD_DEFAULT),
            1
        ]);
        $guestUserId = $pdo->lastInsertId();
    } else {
        $guestUserId = $guestUser['id'];
    }
    
    // Create dummy users if they don't exist
    $dummyUsers = [
        ['john_doe', 'john@example.com', 'John', 'Doe'],
        ['jane_smith', 'jane@example.com', 'Jane', 'Smith'],
        ['mike_wilson', 'mike@example.com', 'Mike', 'Wilson'],
        ['sarah_jones', 'sarah@example.com', 'Sarah', 'Jones'],
        ['alex_brown', 'alex@example.com', 'Alex', 'Brown']
    ];
    
    $dummyUserIds = [];
    foreach ($dummyUsers as $user) {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1");
        $stmt->execute([$user[0], $user[1]]);
        $existingUser = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$existingUser) {
            $stmt = $pdo->prepare("
                INSERT INTO users (username, email, first_name, last_name, password_hash, is_active, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $user[0],
                $user[1],
                $user[2],
                $user[3],
                password_hash('password123', PASSWORD_DEFAULT),
                1
            ]);
            $dummyUserIds[] = $pdo->lastInsertId();
        } else {
            $dummyUserIds[] = $existingUser['id'];
        }
    }
    
    // Create a team if it doesn't exist
    $stmt = $pdo->prepare("SELECT id FROM teams WHERE name = 'Demo Development Team' LIMIT 1");
    $stmt->execute();
    $existingTeam = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$existingTeam) {
        // Create team
        $stmt = $pdo->prepare("
            INSERT INTO teams (name, description, color, avatar_url, created_by, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        ");
        $stmt->execute([
            'Demo Development Team',
            'A demonstration team with Guest user as admin and various team members with assigned tasks',
            '#667eea',
            null,
            $guestUserId
        ]);
        $teamId = $pdo->lastInsertId();
    } else {
        $teamId = $existingTeam['id'];
    }
    
    // Add Guest user as admin to the team
    $stmt = $pdo->prepare("
        INSERT IGNORE INTO team_members (team_id, user_id, role, status, joined_at) 
        VALUES (?, ?, ?, ?, NOW())
    ");
    $stmt->execute([$teamId, $guestUserId, 'admin', 'active']);
    
    // Add dummy users to the team
    $roles = ['member', 'member', 'member', 'member', 'member'];
    foreach ($dummyUserIds as $index => $userId) {
        $stmt = $pdo->prepare("
            INSERT IGNORE INTO team_members (team_id, user_id, role, status, joined_at) 
            VALUES (?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$teamId, $userId, $roles[$index], 'active']);
    }
    
    // Create a workspace for the team
    $stmt = $pdo->prepare("SELECT id FROM workspaces WHERE name = 'Development Workspace' AND workspace_type = 'team' LIMIT 1");
    $stmt->execute();
    $existingWorkspace = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$existingWorkspace) {
        // Create workspace
        $stmt = $pdo->prepare("
            INSERT INTO workspaces (name, description, color, icon, workspace_type, created_by, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            'Development Workspace',
            'Main workspace for development tasks and projects',
            '#4facfe',
            '💻',
            'team',
            $guestUserId
        ]);
        $workspaceId = $pdo->lastInsertId();
        
        // Link workspace to team
        $stmt = $pdo->prepare("
            INSERT IGNORE INTO team_workspaces (team_id, workspace_id, created_at) 
            VALUES (?, ?, NOW())
        ");
        $stmt->execute([$teamId, $workspaceId]);
    } else {
        $workspaceId = $existingWorkspace['id'];
    }
    
    // Create projects
    $projects = [
        ['Frontend Development', 'Building responsive user interfaces', '#43e97b', '🎨'],
        ['Backend API', 'Developing RESTful APIs and database design', '#fa709a', '⚙️'],
        ['Mobile App', 'Cross-platform mobile application development', '#ffecd2', '📱'],
        ['Testing & QA', 'Quality assurance and testing procedures', '#667eea', '🧪']
    ];
    
    $projectIds = [];
    foreach ($projects as $project) {
        $stmt = $pdo->prepare("
            INSERT INTO projects (name, description, color, icon, status, created_by, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $project[0],
            $project[1],
            $project[2],
            $project[3],
            'active',
            $guestUserId
        ]);
        $projectId = $pdo->lastInsertId();
        $projectIds[] = $projectId;
        
        // Link project to team
        $stmt = $pdo->prepare("
            INSERT IGNORE INTO team_projects (team_id, project_id, created_at) 
            VALUES (?, ?, NOW())
        ");
        $stmt->execute([$teamId, $projectId]);
    }
    
    // Create tasks for each project
    $tasks = [
        // Frontend Development tasks
        [
            'Design User Interface', 
            'Create wireframes and mockups for the main dashboard', 
            'high', 
            'todo', 
            date('Y-m-d', strtotime('+3 days')),
            $projectIds[0],
            $dummyUserIds[0]
        ],
        [
            'Implement Responsive Layout', 
            'Build responsive CSS grid system and components', 
            'medium', 
            'in_progress', 
            date('Y-m-d', strtotime('+5 days')),
            $projectIds[0],
            $dummyUserIds[1]
        ],
        [
            'Add Interactive Features', 
            'Implement JavaScript functionality and user interactions', 
            'medium', 
            'todo', 
            date('Y-m-d', strtotime('+7 days')),
            $projectIds[0],
            $dummyUserIds[2]
        ],
        
        // Backend API tasks
        [
            'Design Database Schema', 
            'Create ERD and database table structures', 
            'high', 
            'done', 
            date('Y-m-d', strtotime('-2 days')),
            $projectIds[1],
            $guestUserId
        ],
        [
            'Implement User Authentication', 
            'Build JWT-based authentication system', 
            'high', 
            'in_progress', 
            date('Y-m-d', strtotime('+2 days')),
            $projectIds[1],
            $dummyUserIds[3]
        ],
        [
            'Create REST API Endpoints', 
            'Develop CRUD operations for all entities', 
            'medium', 
            'todo', 
            date('Y-m-d', strtotime('+4 days')),
            $projectIds[1],
            $dummyUserIds[4]
        ],
        
        // Mobile App tasks
        [
            'Setup React Native Project', 
            'Initialize project structure and dependencies', 
            'medium', 
            'done', 
            date('Y-m-d', strtotime('-1 day')),
            $projectIds[2],
            $dummyUserIds[0]
        ],
        [
            'Implement Navigation', 
            'Create app navigation and routing system', 
            'medium', 
            'in_progress', 
            date('Y-m-d', strtotime('+3 days')),
            $projectIds[2],
            $dummyUserIds[1]
        ],
        [
            'Build Core Components', 
            'Develop reusable UI components for the app', 
            'low', 
            'todo', 
            date('Y-m-d', strtotime('+6 days')),
            $projectIds[2],
            $dummyUserIds[2]
        ],
        
        // Testing & QA tasks
        [
            'Write Unit Tests', 
            'Create comprehensive unit tests for all modules', 
            'high', 
            'todo', 
            date('Y-m-d', strtotime('+2 days')),
            $projectIds[3],
            $dummyUserIds[3]
        ],
        [
            'Perform Integration Testing', 
            'Test API endpoints and database interactions', 
            'medium', 
            'todo', 
            date('Y-m-d', strtotime('+4 days')),
            $projectIds[3],
            $dummyUserIds[4]
        ],
        [
            'User Acceptance Testing', 
            'Conduct UAT with stakeholders and end users', 
            'medium', 
            'todo', 
            date('Y-m-d', strtotime('+8 days')),
            $projectIds[3],
            $guestUserId
        ]
    ];
    
    foreach ($tasks as $task) {
        $stmt = $pdo->prepare("
            INSERT INTO tasks (title, description, priority, status, due_date, project_id, assigned_to, created_by, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $task[0],
            $task[1],
            $task[2],
            $task[3],
            $task[4],
            $task[5],
            $task[6],
            $guestUserId
        ]);
    }
    
    // Return success response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Guest team populated successfully',
        'data' => [
            'team_id' => $teamId,
            'workspace_id' => $workspaceId,
            'project_count' => count($projectIds),
            'task_count' => count($tasks),
            'member_count' => count($dummyUserIds) + 1 // +1 for Guest user
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal server error',
        'message' => $e->getMessage()
    ]);
}
?>
