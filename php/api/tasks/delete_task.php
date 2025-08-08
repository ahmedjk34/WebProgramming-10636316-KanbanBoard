<?php
/**
 * Delete Task API Endpoint
 * Kanban Board Project - Web Programming 10636316
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
