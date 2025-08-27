<?php
/**
 * Remove Team Member API Endpoint
 * Removes a user from a team (only team owners and admins can remove members)
 */

// Prevent direct access
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
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
    
    // Get team ID and member ID from URL or POST data
    $teamId = null;
    $memberId = null;
    
    if (isset($_GET['team_id']) && isset($_GET['member_id'])) {
        $teamId = (int)$_GET['team_id'];
        $memberId = (int)$_GET['member_id'];
    } elseif (isset($_POST['team_id']) && isset($_POST['member_id'])) {
        $teamId = (int)$_POST['team_id'];
        $memberId = (int)$_POST['member_id'];
    } else {
        // Try to get from JSON input
        $input = json_decode(file_get_contents('php://input'), true);
        if (isset($input['team_id']) && isset($input['member_id'])) {
            $teamId = (int)$input['team_id'];
            $memberId = (int)$input['member_id'];
        }
    }
    
    if (!$teamId || !$memberId) {
        http_response_code(400);
        echo json_encode(['error' => 'Team ID and Member ID are required']);
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
        echo json_encode(['error' => 'Only team owners and admins can remove members']);
        exit;
    }
    
    // Check if target member exists and get their role
    $stmt = $pdo->prepare("
        SELECT tm.role, tm.status, u.username, u.first_name, u.last_name
        FROM team_members tm
        INNER JOIN users u ON tm.user_id = u.id
        WHERE tm.team_id = ? AND tm.user_id = ?
    ");
    $stmt->execute([$teamId, $memberId]);
    $targetMembership = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$targetMembership) {
        http_response_code(404);
        echo json_encode(['error' => 'Member not found in this team']);
        exit;
    }
    
    // Prevent removing team owner
    if ($targetMembership['role'] === 'owner') {
        http_response_code(403);
        echo json_encode(['error' => 'Cannot remove team owner']);
        exit;
    }
    
    // Prevent admins from removing other admins (only owners can)
    if ($targetMembership['role'] === 'admin' && $membership['role'] !== 'owner') {
        http_response_code(403);
        echo json_encode(['error' => 'Only team owners can remove admins']);
        exit;
    }
    
    // Prevent removing yourself
    if ($memberId === $userId) {
        http_response_code(400);
        echo json_encode(['error' => 'Cannot remove yourself from the team']);
        exit;
    }
    
    // Begin transaction
    $pdo->beginTransaction();
    
    try {
        // Remove the member (soft delete by setting status to suspended)
        $stmt = $pdo->prepare("
            UPDATE team_members 
            SET status = 'suspended' 
            WHERE team_id = ? AND user_id = ?
        ");
        $stmt->execute([$teamId, $memberId]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Member not found']);
            exit;
        }
        
        // Commit transaction
        $pdo->commit();
        
        // Return success response
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Team member removed successfully',
            'removed_member' => [
                'user_id' => $memberId,
                'username' => $targetMembership['username'],
                'first_name' => $targetMembership['first_name'],
                'last_name' => $targetMembership['last_name'],
                'role' => $targetMembership['role']
            ]
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
