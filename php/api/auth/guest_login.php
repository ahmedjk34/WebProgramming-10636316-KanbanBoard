<?php
/**
 * Guest Login API Endpoint
 * Creates a guest session for browsing the app without registration
 */

// Load session configuration FIRST (before any output)
require_once __DIR__ . '/../../config/session.php';

// Disable error display to prevent HTML output
error_reporting(0);
ini_set('display_errors', 0);

// Set JSON content type
header('Content-Type: application/json');

try {
    require_once __DIR__ . '/../../config/database.php';
    require_once __DIR__ . '/../../../utils/php-utils.php';
    require_once __DIR__ . '/../../includes/security.php';
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'System configuration error. Please contact support.'
    ]);
    exit;
}

try {
    // Check if request method is POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Invalid request method');
    }

    $pdo = getDBConnection();
    
    // Check if guest user exists, if not create one
    $guestStmt = $pdo->prepare("
        SELECT id, username, email, first_name, last_name, avatar_url, last_login
        FROM users 
        WHERE username = 'guest_user' AND is_active = TRUE
    ");
    $guestStmt->execute();
    $guestUser = $guestStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$guestUser) {
        // Create guest user
        $guestPasswordHash = password_hash('guest123', PASSWORD_DEFAULT);
        
        $createGuestStmt = $pdo->prepare("
            INSERT INTO users (username, email, password_hash, first_name, last_name, is_active, email_verified) 
            VALUES (?, ?, ?, ?, ?, TRUE, TRUE)
        ");
        
        $createGuestStmt->execute([
            'guest_user',
            'guest@kanban.com',
            $guestPasswordHash,
            'Guest',
            'User'
        ]);
        
        $guestUserId = $pdo->lastInsertId();
        
        // Create guest user preferences
        $guestPreferencesStmt = $pdo->prepare("
            INSERT INTO user_preferences (user_id, preference_key, preference_value) 
            VALUES 
            (?, 'default_view', 'kanban'),
            (?, 'theme', 'light'),
            (?, 'analytics_refresh_interval', '30'),
            (?, 'show_completed_tasks', 'true'),
            (?, 'calendar_view_type', 'month'),
            (?, 'is_guest', 'true')
        ");
        $guestPreferencesStmt->execute([
            $guestUserId, $guestUserId, $guestUserId, 
            $guestUserId, $guestUserId, $guestUserId
        ]);

        // Create default workspaces for guest user
        $guestWorkspaces = [
            ['Personal Workspace', 'Your personal tasks and projects', '#667eea', '👤', true],
            ['Work Workspace', 'Professional work and business projects', '#2ecc71', '💼', false],
            ['Creative Projects', 'Creative and artistic endeavors', '#f093fb', '🎨', false]
        ];

        foreach ($guestWorkspaces as $workspace) {
            $workspaceStmt = $pdo->prepare("
                INSERT INTO workspaces (name, description, color, icon, owner_id, is_default) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $workspaceStmt->execute([
                $workspace[0], $workspace[1], $workspace[2], $workspace[3], 
                $guestUserId, $workspace[4]
            ]);
            
            $workspaceId = $pdo->lastInsertId();
            
            // Add user as workspace member
            $memberStmt = $pdo->prepare("
                INSERT INTO workspace_members (workspace_id, user_id, role) 
                VALUES (?, ?, 'owner')
            ");
            $memberStmt->execute([$workspaceId, $guestUserId]);
            
            // Create sample projects for this workspace
            $sampleProjects = [
                ['Personal Tasks', 'Daily personal tasks and reminders', '#3498db'],
                ['Home Projects', 'Home improvement and maintenance', '#e74c3c']
            ];
            
            if ($workspace[0] === 'Work Workspace') {
                $sampleProjects = [
                    ['Work Projects', 'Professional work assignments', '#2ecc71'],
                    ['Team Collaboration', 'Team-based projects and meetings', '#f39c12']
                ];
            } elseif ($workspace[0] === 'Creative Projects') {
                $sampleProjects = [
                    ['Art & Design', 'Creative design projects', '#9b59b6'],
                    ['Writing Projects', 'Blog posts and articles', '#34495e']
                ];
            }
            
            foreach ($sampleProjects as $project) {
                $projectStmt = $pdo->prepare("
                    INSERT INTO projects (workspace_id, name, description, color, status, created_by) 
                    VALUES (?, ?, ?, ?, 'active', ?)
                ");
                $projectStmt->execute([
                    $workspaceId, $project[0], $project[1], $project[2], $guestUserId
                ]);
                
                $projectId = $pdo->lastInsertId();
                
                // Create sample tasks for this project
                $sampleTasks = [
                    ['Sample Task 1', 'This is a sample task to get you started', 'todo', 'medium', null, 1],
                    ['Sample Task 2', 'Another sample task for demonstration', 'in_progress', 'high', null, 2]
                ];
                
                foreach ($sampleTasks as $task) {
                    $taskStmt = $pdo->prepare("
                        INSERT INTO tasks (project_id, title, description, status, priority, due_date, position, created_by) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ");
                    $taskStmt->execute([
                        $projectId, $task[0], $task[1], $task[2], $task[3], $task[4], $task[5], $guestUserId
                    ]);
                }
            }
        }
        
        // Get the created guest user
        $guestStmt->execute();
        $guestUser = $guestStmt->fetch(PDO::FETCH_ASSOC);
    }
    
    // Update last login time
    $updateStmt = $pdo->prepare("
        UPDATE users 
        SET last_login = CURRENT_TIMESTAMP 
        WHERE id = ?
    ");
    $updateStmt->execute([$guestUser['id']]);
    
    // Generate session token
    $token = generateSecureToken();
    $tokenExpiry = date('Y-m-d H:i:s', strtotime('+24 hours'));
    
    // Store token in database (with NULL workspace_id to match unique constraint)
    $tokenStmt = $pdo->prepare("
        INSERT INTO user_preferences (user_id, preference_key, preference_value, workspace_id) 
        VALUES (?, 'auth_token', ?, NULL) 
        ON DUPLICATE KEY UPDATE preference_value = ?
    ");
    $tokenStmt->execute([$guestUser['id'], $token, $token]);
    
    // Start session safely
    safeSessionStart();
    $_SESSION['user_id'] = $guestUser['id'];
    $_SESSION['username'] = $guestUser['username'];
    $_SESSION['auth_token'] = $token;
    $_SESSION['is_guest'] = true;
    
    // Prepare user data for response
    $userData = [
        'id' => $guestUser['id'],
        'username' => $guestUser['username'],
        'email' => $guestUser['email'],
        'first_name' => $guestUser['first_name'],
        'last_name' => $guestUser['last_name'],
        'avatar_url' => $guestUser['avatar_url'],
        'last_login' => date('Y-m-d H:i:s'),
        'is_guest' => true
    ];
    
    echo json_encode([
        'success' => true,
        'message' => 'Guest session created successfully!',
        'data' => [
            'user' => $userData,
            'token' => $token,
            'token_expires' => $tokenExpiry,
            'is_guest' => true
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Guest login error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred during guest login. Please try again.'
    ]);
}

/**
 * Generate a secure random token
 */
function generateSecureToken($length = 64) {
    return bin2hex(random_bytes($length / 2));
}
?>
