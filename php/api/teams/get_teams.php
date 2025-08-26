<?php
/**
 * Get Teams API Endpoint
 * Retrieves all teams that the authenticated user is a member of
 */

// Prevent direct access
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
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
    
    // Get teams with member information
    $stmt = $pdo->prepare("
        SELECT 
            t.id,
            t.name,
            t.description,
            t.color,
            t.avatar_url,
            t.created_by,
            t.created_at,
            t.updated_at,
            tm.role as user_role,
            tm.joined_at,
            tm.status as membership_status,
            COUNT(DISTINCT tm2.user_id) as member_count,
            COUNT(DISTINCT w.id) as workspace_count,
            COUNT(DISTINCT p.id) as project_count
        FROM teams t
        INNER JOIN team_members tm ON t.id = tm.team_id
        LEFT JOIN team_members tm2 ON t.id = tm2.team_id AND tm2.status = 'active'
        LEFT JOIN team_workspaces tw ON t.id = tw.team_id
        LEFT JOIN workspaces w ON tw.workspace_id = w.id
        LEFT JOIN team_projects tp ON t.id = tp.team_id
        LEFT JOIN projects p ON tp.project_id = p.id
        WHERE tm.user_id = ? AND t.is_active = TRUE
        GROUP BY t.id, t.name, t.description, t.color, t.avatar_url, t.created_by, t.created_at, t.updated_at, tm.role, tm.joined_at, tm.status
        ORDER BY t.name ASC
    ");
    
    $stmt->execute([$userId]);
    $teams = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get team members for each team
    foreach ($teams as &$team) {
        $stmt = $pdo->prepare("
            SELECT 
                u.id,
                u.username,
                u.first_name,
                u.last_name,
                u.avatar_url,
                tm.role,
                tm.joined_at,
                tm.status
            FROM team_members tm
            INNER JOIN users u ON tm.user_id = u.id
            WHERE tm.team_id = ? AND tm.status = 'active'
            ORDER BY 
                CASE tm.role 
                    WHEN 'owner' THEN 1 
                    WHEN 'admin' THEN 2 
                    WHEN 'member' THEN 3 
                    WHEN 'viewer' THEN 4 
                END,
                u.first_name, u.last_name
        ");
        $stmt->execute([$team['id']]);
        $team['members'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get team workspaces
        $stmt = $pdo->prepare("
            SELECT 
                w.id,
                w.name,
                w.description,
                w.color,
                w.icon,
                w.workspace_type
            FROM team_workspaces tw
            INNER JOIN workspaces w ON tw.workspace_id = w.id
            WHERE tw.team_id = ?
            ORDER BY w.name ASC
        ");
        $stmt->execute([$team['id']]);
        $team['workspaces'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Return success response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'teams' => $teams,
        'count' => count($teams)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal server error',
        'message' => $e->getMessage()
    ]);
}
?>
