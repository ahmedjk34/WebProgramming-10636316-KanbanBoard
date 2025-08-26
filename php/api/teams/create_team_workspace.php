<?php
/**
 * Create Team Workspace API Endpoint
 * Creates a new workspace for a team (only team owners and admins can create)
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
    
    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        $input = $_POST;
    }
    
    // Validate required fields
    $requiredFields = ['team_id', 'name'];
    foreach ($requiredFields as $field) {
        if (empty($input[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Missing required field: $field"]);
            exit;
        }
    }
    
    // Sanitize and validate input
    $teamId = (int)$input['team_id'];
    $name = trim($input['name']);
    $description = isset($input['description']) ? trim($input['description']) : '';
    $color = isset($input['color']) ? trim($input['color']) : '#667eea';
    $icon = isset($input['icon']) ? trim($input['icon']) : '🏢';
    
    // Validate name length
    if (strlen($name) > 100) {
        http_response_code(400);
        echo json_encode(['error' => 'Workspace name must be 100 characters or less']);
        exit;
    }
    
    // Validate color format
    if (!preg_match('/^#[0-9A-Fa-f]{6}$/', $color)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid color format. Use hex format (e.g., #667eea)']);
        exit;
    }
    
    // Connect to database
    $pdo = getDBConnection();
    
    // Check if user is team owner or admin
    $stmt = $pdo->prepare("
        SELECT tm.role, t.name as team_name
        FROM team_members tm
        INNER JOIN teams t ON tm.team_id = t.id
        WHERE tm.team_id = ? AND tm.user_id = ? AND tm.status = 'active'
    ");
    $stmt->execute([$teamId, $userId]);
    $membership = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$membership) {
        http_response_code(404);
        echo json_encode(['error' => 'Team not found or you are not a member']);
        exit;
    }
    
    if (!in_array($membership['role'], ['owner', 'admin'])) {
        http_response_code(403);
        echo json_encode(['error' => 'Only team owners and admins can create team workspaces']);
        exit;
    }
    
    // Check if workspace name already exists for this team
    $stmt = $pdo->prepare("
        SELECT COUNT(*) FROM workspaces w
        INNER JOIN team_workspaces tw ON w.id = tw.workspace_id
        WHERE tw.team_id = ? AND w.name = ?
    ");
    $stmt->execute([$teamId, $name]);
    
    if ($stmt->fetchColumn() > 0) {
        http_response_code(409);
        echo json_encode(['error' => 'A workspace with this name already exists in this team']);
        exit;
    }
    
    // Begin transaction
    $pdo->beginTransaction();
    
    try {
        // Create the workspace
        $stmt = $pdo->prepare("
            INSERT INTO workspaces (name, description, color, icon, owner_id, team_id, workspace_type) 
            VALUES (?, ?, ?, ?, ?, ?, 'team')
        ");
        $stmt->execute([$name, $description, $color, $icon, $userId, $teamId]);
        
        $workspaceId = $pdo->lastInsertId();
        
        // Associate workspace with team
        $stmt = $pdo->prepare("
            INSERT INTO team_workspaces (team_id, workspace_id) 
            VALUES (?, ?)
        ");
        $stmt->execute([$teamId, $workspaceId]);
        
        // Add creator as workspace owner
        $stmt = $pdo->prepare("
            INSERT INTO workspace_members (workspace_id, user_id, role) 
            VALUES (?, ?, 'owner')
        ");
        $stmt->execute([$workspaceId, $userId]);
        
        // Commit transaction
        $pdo->commit();
        
        // Get the created workspace data
        $stmt = $pdo->prepare("
            SELECT 
                w.id,
                w.name,
                w.description,
                w.color,
                w.icon,
                w.owner_id,
                w.team_id,
                w.workspace_type,
                w.created_at,
                w.updated_at,
                t.name as team_name
            FROM workspaces w
            INNER JOIN teams t ON w.team_id = t.id
            WHERE w.id = ?
        ");
        $stmt->execute([$workspaceId]);
        $workspace = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Return success response
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Team workspace created successfully',
            'workspace' => $workspace
        ]);
        
    } catch (Exception $e) {
        // Rollback transaction on error
        $pdo->rollBack();
        throw $e;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal server error',
        'message' => $e->getMessage()
    ]);
}
?>
