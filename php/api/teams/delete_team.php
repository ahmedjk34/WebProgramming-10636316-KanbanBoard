<?php
/**
 * Delete Team API Endpoint
 * Soft deletes a team (only team owners can delete)
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
    
    // Connect to database
    $pdo = getDBConnection();
    
    // Check if user is team owner
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
    
    if ($membership['role'] !== 'owner') {
        http_response_code(403);
        echo json_encode(['error' => 'Only team owners can delete teams']);
        exit;
    }
    
    // Begin transaction
    $pdo->beginTransaction();
    
    try {
        // Soft delete the team
        $stmt = $pdo->prepare("UPDATE teams SET is_active = FALSE WHERE id = ?");
        $stmt->execute([$teamId]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['error' => 'Team not found']);
            exit;
        }
        
        // Deactivate all team memberships
        $stmt = $pdo->prepare("UPDATE team_members SET status = 'suspended' WHERE team_id = ?");
        $stmt->execute([$teamId]);
        
        // Commit transaction
        $pdo->commit();
        
        // Return success response
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Team deleted successfully'
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
