<?php
/**
 * Get Teams API Endpoint
 * Returns all teams for the authenticated user
 */

// Include necessary files
require_once '../../config/database.php';
require_once '../../config/session.php';
require_once '../../includes/auth_middleware.php';

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Check if user is authenticated
if (!isAuthenticated()) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Authentication required'
    ]);
    exit;
}

try {
    // Get user ID from session
    $userId = $_SESSION['user_id'];
    
    // Get database connection
    $pdo = getDatabaseConnection();
    
    // Query to get teams where user is a member
    $query = "
        SELECT 
            t.id,
            t.name,
            t.description,
            t.color,
            t.visibility,
            t.created_at,
            tm.role as user_role,
            COUNT(DISTINCT tm2.user_id) as member_count,
            COUNT(DISTINCT p.id) as project_count
        FROM teams t
        INNER JOIN team_members tm ON t.id = tm.team_id
        LEFT JOIN team_members tm2 ON t.id = tm2.team_id
        LEFT JOIN projects p ON t.id = p.team_id
        WHERE tm.user_id = :user_id
        GROUP BY t.id, t.name, t.description, t.color, t.visibility, t.created_at, tm.role
        ORDER BY t.created_at DESC
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute(['user_id' => $userId]);
    $teams = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format the response
    $formattedTeams = [];
    foreach ($teams as $team) {
        $formattedTeams[] = [
            'id' => (int)$team['id'],
            'name' => $team['name'],
            'description' => $team['description'],
            'color' => $team['color'],
            'visibility' => $team['visibility'],
            'created_at' => $team['created_at'],
            'user_role' => $team['user_role'],
            'member_count' => (int)$team['member_count'],
            'project_count' => (int)$team['project_count']
        ];
    }
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Teams retrieved successfully',
        'data' => $formattedTeams,
        'count' => count($formattedTeams)
    ]);
    
} catch (PDOException $e) {
    // Database error
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    // General error
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
