<?php
/**
 * Create Team API Endpoint
 * Creates a new team and adds the creator as the owner
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
    $requiredFields = ['name'];
    foreach ($requiredFields as $field) {
        if (empty($input[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Missing required field: $field"]);
            exit;
        }
    }
    
    // Sanitize and validate input
    $name = trim($input['name']);
    $description = isset($input['description']) ? trim($input['description']) : '';
    $color = isset($input['color']) ? trim($input['color']) : '#667eea';
    $avatarUrl = isset($input['avatar_url']) ? trim($input['avatar_url']) : null;
    
    // Validate name length
    if (strlen($name) > 255) {
        http_response_code(400);
        echo json_encode(['error' => 'Team name must be 255 characters or less']);
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
    
    // Check if team name already exists for this user
    $stmt = $pdo->prepare("
        SELECT COUNT(*) FROM teams 
        WHERE name = ? AND created_by = ? AND is_active = TRUE
    ");
    $stmt->execute([$name, $userId]);
    
    if ($stmt->fetchColumn() > 0) {
        http_response_code(409);
        echo json_encode(['error' => 'A team with this name already exists']);
        exit;
    }
    
    // Begin transaction
    $pdo->beginTransaction();
    
    try {
        // Create the team
        $stmt = $pdo->prepare("
            INSERT INTO teams (name, description, color, avatar_url, created_by) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$name, $description, $color, $avatarUrl, $userId]);
        
        $teamId = $pdo->lastInsertId();
        
        // Add creator as team owner
        $stmt = $pdo->prepare("
            INSERT INTO team_members (team_id, user_id, role, status) 
            VALUES (?, ?, 'owner', 'active')
        ");
        $stmt->execute([$teamId, $userId]);
        
        // Commit transaction
        $pdo->commit();
        
        // Get the created team data
        $stmt = $pdo->prepare("
            SELECT id, name, description, color, avatar_url, created_by, created_at, updated_at
            FROM teams 
            WHERE id = ?
        ");
        $stmt->execute([$teamId]);
        $team = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Return success response
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Team created successfully',
            'team' => $team
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
