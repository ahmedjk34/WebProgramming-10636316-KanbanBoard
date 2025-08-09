<?php
/**
 * Delete Task API Endpoint
 * Kanban Board Project - Web Programming 10636316
 *
 * Deletes a task from the database
 * Method: POST
 * Required: task_id
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
    // Get database connection
    $pdo = getDBConnection();

    // Get JSON input
    $input = getJsonInput();

    // Validate required fields
    if (empty($input['task_id'])) {
        echo jsonResponse(false, 'task_id is required', [], 400);
        exit();
    }

    $taskId = sanitizeAndValidate($input['task_id'], 'int');

    // Check if task exists
    $taskCheck = $pdo->prepare("SELECT id, status FROM tasks WHERE id = :task_id");
    $taskCheck->execute([':task_id' => $taskId]);
    $task = $taskCheck->fetch(PDO::FETCH_ASSOC);

    if (!$task) {
        echo jsonResponse(false, 'Task not found', [], 404);
        exit();
    }

    // Delete the task
    $deleteStmt = $pdo->prepare("DELETE FROM tasks WHERE id = :task_id");
    $result = $deleteStmt->execute([':task_id' => $taskId]);

    if ($result) {
        echo jsonResponse(true, 'Task deleted successfully', [
            'deleted_task_id' => (int)$taskId
        ], 200);

    } else {
        echo jsonResponse(false, 'Failed to delete task', [], 500);
    }

} catch (PDOException $e) {
    error_log("Database error in delete_task.php: " . $e->getMessage());
    echo jsonResponse(false, 'Database error occurred', [], 500);

} catch (Exception $e) {
    error_log("Error in delete_task.php: " . $e->getMessage());
    echo jsonResponse(false, 'An error occurred while deleting the task', [], 500);
}
?>
