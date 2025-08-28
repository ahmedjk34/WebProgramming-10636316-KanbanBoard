<?php
/**
 * AI Task Plan Generation API Endpoint
 * Kanban Board Project - Web Programming 10636316
 * 
 * Processes user daily plans and creates structured projects and tasks using GROQ AI
 */

error_reporting(E_ERROR | E_PARSE);

// Include required files
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../../utils/php-utils.php';
require_once __DIR__ . '/../../../utils/task-planner.php';

// Start session to get user information
safeSessionStart();

// Set JSON response headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use POST.',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    exit();
}

try {
    // Get request data
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON in request body');
    }

    // Validate required fields
    if (!isset($data['user_plan']) || empty(trim($data['user_plan']))) {
        throw new Exception('user_plan is required and cannot be empty');
    }

    $userPlan = sanitizeAndValidate($data['user_plan'], 'string');
    $workspaceId = isset($data['workspace_id']) ? sanitizeAndValidate($data['workspace_id'], 'int') : null;

    // Validate workspace_id if provided
    if ($workspaceId !== null && !in_array($workspaceId, [1, 2, 3])) {
        throw new Exception('Invalid workspace_id. Must be 1, 2, or 3');
    }

    // Validate plan length
    if (strlen($userPlan) < 10) {
        throw new Exception('User plan is too short. Please provide more details.');
    }

    if (strlen($userPlan) > 2000) {
        throw new Exception('User plan is too long. Please keep it under 2000 characters.');
    }

    // Initialize task planner
    $taskPlanner = new TaskPlanner();

    // Process the user plan
    $result = $taskPlanner->processUserPlan($userPlan, $workspaceId);

    if (!$result['success']) {
        throw new Exception($result['error']);
    }

    // Return success response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => $result['message'],
        'data' => $result['data'],
        'timestamp' => date('Y-m-d H:i:s')
    ]);

} catch (Exception $e) {
    // Log error for debugging
    error_log("AI Task Plan Generation Error: " . $e->getMessage());

    // Return error response
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'data' => null,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
