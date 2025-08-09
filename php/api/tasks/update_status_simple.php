<?php
/**
 * Update Task Status API Endpoint (Simple)
 * For drag & drop functionality
 */

// Include required files
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../../utils/php-utils.php';

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
checkRequestMethod('POST');

try {
    // Get JSON input
    $input = getJsonInput();

    if (empty($input['task_id']) || empty($input['status'])) {
        echo jsonResponse(false, 'task_id and status required', [], 400);
        exit();
    }
    
    // Get database connection
    $pdo = getDBConnection();
    
    $taskId = (int)$input['task_id'];
    $newStatus = $input['status'];
    
    // Validate status
    $validStatuses = ['todo', 'in_progress', 'done'];
    if (!in_array($newStatus, $validStatuses)) {
        echo jsonResponse(false, 'Invalid status', [], 400);
        exit();
    }
    
    // Simple update without position management
    $stmt = $pdo->prepare("UPDATE tasks SET status = :status, updated_at = NOW() WHERE id = :id");
    $result = $stmt->execute([
        ':status' => $newStatus,
        ':id' => $taskId
    ]);
    
    if ($result) {
        echo jsonResponse(true, 'Task status updated successfully', [
            'task_id' => $taskId,
            'new_status' => $newStatus
        ], 200);
    } else {
        echo jsonResponse(false, 'Failed to update task', [], 500);
    }

} catch (Exception $e) {
    echo jsonResponse(false, 'Error: ' . $e->getMessage(), [], 500);
}
?>
