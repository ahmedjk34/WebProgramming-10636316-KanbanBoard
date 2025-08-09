<?php
/**
 * Delete Task API Endpoint
 * Kanban Board Project - Web Programming <?php
/**
 * Delete Task API Endpoint
 * Kanban Board Project - Web Programming 10636316
 *
 * Deletes a task from the database
 * Method: POST
 * Required: task_id
 */

// Start output buffering to prevent any unwanted output
ob_start();

// Suppress PHP errors for clean JSON output
error_reporting(0);
ini_set('display_errors', 0);

// Set headers for JSON response and CORS
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
checkRequestMethod('POST');

// Include required files
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../../utils/php-utils.php';

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
        // Simple success response without complex position reordering
        // Position reordering can be handled by the frontend or in a separate process

        // Clean any output buffer before sending JSON
        ob_clean();

        echo json_encode([
            'success' => true,
            'message' => 'Task deleted successfully',
            'data' => [
                'deleted_task_id' => (int)$taskId
            ]
        ]);

    } else {
        ob_clean();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to delete task']);
    }

} catch (PDOException $e) {
    ob_clean();
    error_log("Database error in delete_task.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error occurred']);

} catch (Exception $e) {
    ob_clean();
    error_log("Error in delete_task.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An error occurred while deleting the task']);
}

// End output buffering
ob_end_flush();
?>0636316
 * 
 * Deletes a task from the database
 * Method: DELETE
 * Required: id (in URL parameter or JSON body)
 */

// Set headers for JSON response and CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow DELETE requests
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo jsonResponse(false, 'Method not allowed. Use DELETE.');
    exit();
}

// Include required files
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/security.php';

try {
    // Get database connection
    $pdo = getDBConnection();
    
    // Get task ID from URL parameter or JSON body
    $taskId = null;
    
    // Try URL parameter first
    if (isset($_GET['id'])) {
        $taskId = sanitizeAndValidate($_GET['id'], 'int');
    } else {
        // Try JSON body
        $input = json_decode(file_get_contents('php://input'), true);
        if (isset($input['id'])) {
            $taskId = sanitizeAndValidate($input['id'], 'int');
        }
    }
    
    // Validate task ID
    if ($taskId === null || $taskId === false) {
        http_response_code(400);
        echo jsonResponse(false, 'Valid task ID is required');
        exit();
    }
    
    // Check if task exists and get its details before deletion
    $stmt = $pdo->prepare("
        SELECT 
            t.id,
            t.title,
            t.status,
            t.position,
            p.name as project_name
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.id = :id
    ");
    
    $stmt->execute([':id' => $taskId]);
    $task = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$task) {
        http_response_code(404);
        echo jsonResponse(false, 'Task not found');
        exit();
    }
    
    // Store task info for logging
    $taskInfo = [
        'id' => $task['id'],
        'title' => $task['title'],
        'project' => $task['project_name'],
        'status' => $task['status']
    ];
    
    // Begin transaction for position reordering
    $pdo->beginTransaction();
    
    try {
        // Delete the task
        $stmt = $pdo->prepare("DELETE FROM tasks WHERE id = :id");
        $stmt->execute([':id' => $taskId]);
        
        // Check if task was actually deleted
        if ($stmt->rowCount() === 0) {
            $pdo->rollBack();
            http_response_code(404);
            echo jsonResponse(false, 'Task not found or already deleted');
            exit();
        }
        
        // Reorder positions in the same status column
        $stmt = $pdo->prepare("
            UPDATE tasks 
            SET position = position - 1 
            WHERE status = :status 
            AND position > :deleted_position
        ");
        
        $stmt->execute([
            ':status' => $task['status'],
            ':deleted_position' => $task['position']
        ]);
        
        // Commit transaction
        $pdo->commit();
        
        // Log the deletion
        debugLog("Task deleted", $taskInfo);
        
        // Return success response
        echo jsonResponse(true, 'Task deleted successfully', [
            'deleted_task' => $taskInfo
        ]);
        
    } catch (Exception $e) {
        // Rollback transaction on error
        $pdo->rollBack();
        throw $e;
    }
    
} catch (PDOException $e) {
    // Database error
    error_log("Database error in delete_task.php: " . $e->getMessage());
    http_response_code(500);
    echo jsonResponse(false, 'Database error occurred');
    
} catch (Exception $e) {
    // General error
    error_log("Error in delete_task.php: " . $e->getMessage());
    http_response_code(500);
    echo jsonResponse(false, 'An error occurred while deleting the task');
}
?>
