<?php
/**
 * Get Available Workspaces for AI Task Planning
 * Kanban Board Project - Web Programming 10636316
 */

error_reporting(E_ERROR | E_PARSE);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../../utils/php-utils.php';
require_once __DIR__ . '/../../../utils/task-planner.php';

// Set JSON response headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $taskPlanner = new TaskPlanner();
    $workspaces = $taskPlanner->getAvailableWorkspaces();
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Workspaces retrieved successfully',
        'data' => [
            'workspaces' => $workspaces,
            'total_count' => count($workspaces)
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ]);

} catch (Exception $e) {
    error_log("Get Workspaces Error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to retrieve workspaces',
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
