<?php
/**
 * Update Team API Endpoint
 * Updates team information (only team owners and admins can update)
 */

// Prevent direct access
if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
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
    
    // Get team ID from URL or POST data
    $teamId = null;
    if (isset($_GET['id'])) {
        $teamId = (int)$_GET['id'];
    } elseif (isset($_POST['id'])) {
        $teamId = (int)$_POST['id'];
    } else {
        // Try to get from JSON input
        $input = json_decode(file_get_contents('php://input'), true);
        if (isset($input['id'])) {
            $teamId = (int)$input['id'];
        }
    }
    
    if (!$teamId) {
        http_response_code(400);
        echo json_encode(['error' => 'Team ID is required']);
        exit;
    }
    
    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        $input = $_POST;
    }
    
    // Connect to database
    $pdo = getDBConnection();
    
    // Check if user is team owner or admin
    $stmt = $pdo->prepare("
        SELECT tm.role, t.name 
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
        echo json_encode(['error' => 'Only team owners and admins can update team information']);
        exit;
    }
    
    // Prepare update fields
    $updateFields = [];
    $updateValues = [];
    
    // Check for name update
    if (isset($input['name']) && !empty(trim($input['name']))) {
        $name = trim($input['name']);
        if (strlen($name) > 255) {
            http_response_code(400);
            echo json_encode(['error' => 'Team name must be 255 characters or less']);
            exit;
        }
        
        // Check if name already exists (excluding current team)
        $stmt = $pdo->prepare("
            SELECT COUNT(*) FROM teams 
            WHERE name = ? AND id != ? AND created_by = ? AND is_active = TRUE
        ");
        $stmt->execute([$name, $teamId, $userId]);
        
        if ($stmt->fetchColumn() > 0) {
            http_response_code(409);
            echo json_encode(['error' => 'A team with this name already exists']);
            exit;
        }
        
        $updateFields[] = "name = ?";
        $updateValues[] = $name;
    }
    
    // Check for description update
    if (isset($input['description'])) {
        $description = trim($input['description']);
        $updateFields[] = "description = ?";
        $updateValues[] = $description;
    }
    
    // Check for color update
    if (isset($input['color']) && !empty(trim($input['color']))) {
        $color = trim($input['color']);
        if (!preg_match('/^#[0-9A-Fa-f]{6}$/', $color)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid color format. Use hex format (e.g., #667eea)']);
            exit;
        }
        $updateFields[] = "color = ?";
        $updateValues[] = $color;
    }
    
    // Check for avatar_url update
    if (isset($input['avatar_url'])) {
        $avatarUrl = trim($input['avatar_url']);
        $updateFields[] = "avatar_url = ?";
        $updateValues[] = $avatarUrl;
    }
    
    // If no fields to update
    if (empty($updateFields)) {
        http_response_code(400);
        echo json_encode(['error' => 'No valid fields to update']);
        exit;
    }
    
    // Add team ID to update values
    $updateValues[] = $teamId;
    
    // Update the team
    $sql = "UPDATE teams SET " . implode(', ', $updateFields) . ", updated_at = CURRENT_TIMESTAMP WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($updateValues);
    
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Team not found']);
        exit;
    }
    
    // Get updated team data
    $stmt = $pdo->prepare("
        SELECT id, name, description, color, avatar_url, created_by, created_at, updated_at
        FROM teams 
        WHERE id = ?
    ");
    $stmt->execute([$teamId]);
    $team = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Return success response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Team updated successfully',
        'team' => $team
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal server error',
        'message' => $e->getMessage()
    ]);
}
?>
