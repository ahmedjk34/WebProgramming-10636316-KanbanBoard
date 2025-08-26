<?php
/**
 * Invite Team Member API Endpoint
 * Invites a user to join a team (only team owners and admins can invite)
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
    $requiredFields = ['team_id', 'user_id', 'role'];
    foreach ($requiredFields as $field) {
        if (empty($input[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Missing required field: $field"]);
            exit;
        }
    }
    
    // Sanitize and validate input
    $teamId = (int)$input['team_id'];
    $inviteUserId = (int)$input['user_id'];
    $role = trim($input['role']);
    
    // Validate role
    $validRoles = ['admin', 'member', 'viewer'];
    if (!in_array($role, $validRoles)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid role. Must be one of: ' . implode(', ', $validRoles)]);
        exit;
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
        echo json_encode(['error' => 'Only team owners and admins can invite members']);
        exit;
    }
    
    // Check if target user exists
    $stmt = $pdo->prepare("SELECT id, username, first_name, last_name FROM users WHERE id = ? AND is_active = TRUE");
    $stmt->execute([$inviteUserId]);
    $targetUser = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$targetUser) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        exit;
    }
    
    // Check if user is already a team member
    $stmt = $pdo->prepare("
        SELECT id, role, status 
        FROM team_members 
        WHERE team_id = ? AND user_id = ?
    ");
    $stmt->execute([$teamId, $inviteUserId]);
    $existingMembership = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existingMembership) {
        if ($existingMembership['status'] === 'active') {
            http_response_code(409);
            echo json_encode(['error' => 'User is already a member of this team']);
            exit;
        } elseif ($existingMembership['status'] === 'pending') {
            http_response_code(409);
            echo json_encode(['error' => 'User already has a pending invitation to this team']);
            exit;
        }
    }
    
    // Begin transaction
    $pdo->beginTransaction();
    
    try {
        if ($existingMembership) {
            // Update existing membership
            $stmt = $pdo->prepare("
                UPDATE team_members 
                SET role = ?, status = 'pending', invited_by = ?, joined_at = CURRENT_TIMESTAMP
                WHERE team_id = ? AND user_id = ?
            ");
            $stmt->execute([$role, $userId, $teamId, $inviteUserId]);
        } else {
            // Create new membership
            $stmt = $pdo->prepare("
                INSERT INTO team_members (team_id, user_id, role, status, invited_by) 
                VALUES (?, ?, ?, 'pending', ?)
            ");
            $stmt->execute([$teamId, $inviteUserId, $role, $userId]);
        }
        
        // Commit transaction
        $pdo->commit();
        
        // Get the invitation details
        $stmt = $pdo->prepare("
            SELECT 
                tm.id,
                tm.role,
                tm.status,
                tm.joined_at,
                t.name as team_name,
                u.username,
                u.first_name,
                u.last_name
            FROM team_members tm
            INNER JOIN teams t ON tm.team_id = t.id
            INNER JOIN users u ON tm.user_id = u.id
            WHERE tm.team_id = ? AND tm.user_id = ?
        ");
        $stmt->execute([$teamId, $inviteUserId]);
        $invitation = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Return success response
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Team invitation sent successfully',
            'invitation' => $invitation
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
