<?php
/**
 * Get Workspaces API Endpoint
 * Returns all workspaces for the current user
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Include required files
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/security.php';

try {
    // Get database connection
    $pdo = getDBConnection();

    // Get all workspaces
    $sql = "SELECT
                id,
                name,
                description,
                color,
                icon,
                is_default,
                created_at,
                updated_at
            FROM workspaces
            ORDER BY is_default DESC, created_at ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $workspaces = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format workspaces for frontend
    $formattedWorkspaces = [];
    foreach ($workspaces as $workspace) {
        $formattedWorkspaces[] = [
            'id' => (int)$workspace['id'],
            'name' => $workspace['name'],
            'description' => $workspace['description'],
            'color' => $workspace['color'],
            'icon' => $workspace['icon'],
            'is_default' => (bool)$workspace['is_default'],
            'created_at' => $workspace['created_at'],
            'updated_at' => $workspace['updated_at']
        ];
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'workspaces' => $formattedWorkspaces,
            'total_count' => count($formattedWorkspaces)
        ],
        'message' => 'Workspaces loaded successfully'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error loading workspaces: ' . $e->getMessage(),
        'data' => null
    ]);
}
?>
