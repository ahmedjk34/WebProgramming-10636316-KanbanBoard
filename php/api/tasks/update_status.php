<?php
/**
 * Update Task Status API Endpoint
 * Kanban Board Project - Web Programming 10636316
 * 
 * Updates task status and position for drag & drop functionality
 * Method: PATCH
 * Required: id, status
 * Optional: position
 */

// Set headers for JSON response and CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow PATCH requests
if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    http_response_code(405);
    echo jsonResponse(false, 'Method not allowed. Use PATCH.');
    exit();
}

// Include required files
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/security.php';

try {
    // Get database connection
    $pdo = getDBConnection();
    
    // Get PATCH data
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (empty($input['id']) || empty($input['status'])) {
        http_response_code(400);
        echo jsonResponse(false, 'Task ID and status are required');
        exit();
    }
    
    $taskId = sanitizeAndValidate($input['id'], 'int');
    $newStatus = sanitizeAndValidate($input['status'], 'string');
    $newPosition = isset($input['position']) ? sanitizeAndValidate($input['position'], 'int') : null;
    
    // Validate inputs
    if ($taskId === false) {
        http_response_code(400);
        echo jsonResponse(false, 'Invalid task ID');
        exit();
    }
    
    if (!validateStatus($newStatus)) {
        http_response_code(400);
        echo jsonResponse(false, 'Invalid task status');
        exit();
    }
    
    // Check if task exists and get current status
    $stmt = $pdo->prepare("SELECT id, status, position FROM tasks WHERE id = :id");
    $stmt->execute([':id' => $taskId]);
    $currentTask = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$currentTask) {
        http_response_code(404);
        echo jsonResponse(false, 'Task not found');
        exit();
    }
    
    $oldStatus = $currentTask['status'];
    $oldPosition = $currentTask['position'];
    
    // Begin transaction for position management
    $pdo->beginTransaction();
    
    try {
        // If status is changing, we need to manage positions in both columns
        if ($oldStatus !== $newStatus) {
            
            // Remove task from old column (shift positions down)
            $stmt = $pdo->prepare("
                UPDATE tasks 
                SET position = position - 1 
                WHERE status = :old_status 
                AND position > :old_position
            ");
            $stmt->execute([
                ':old_status' => $oldStatus,
                ':old_position' => $oldPosition
            ]);
            
            // Determine new position
            if ($newPosition === null || $newPosition === false) {
                // Get next available position in new column
                $stmt = $pdo->prepare("SELECT COALESCE(MAX(position), 0) + 1 as next_position FROM tasks WHERE status = :status");
                $stmt->execute([':status' => $newStatus]);
                $newPosition = $stmt->fetch()['next_position'];
            } else {
                // Make space at the specified position in new column
                $stmt = $pdo->prepare("
                    UPDATE tasks 
                    SET position = position + 1 
                    WHERE status = :new_status 
                    AND position >= :new_position
                ");
                $stmt->execute([
                    ':new_status' => $newStatus,
                    ':new_position' => $newPosition
                ]);
            }
            
        } else if ($newPosition !== null && $newPosition !== false && $newPosition !== $oldPosition) {
            // Same status, different position - reorder within column
            
            if ($newPosition > $oldPosition) {
                // Moving down - shift tasks up
                $stmt = $pdo->prepare("
                    UPDATE tasks 
                    SET position = position - 1 
                    WHERE status = :status 
                    AND position > :old_position 
                    AND position <= :new_position
                ");
                $stmt->execute([
                    ':status' => $newStatus,
                    ':old_position' => $oldPosition,
                    ':new_position' => $newPosition
                ]);
            } else {
                // Moving up - shift tasks down
                $stmt = $pdo->prepare("
                    UPDATE tasks 
                    SET position = position + 1 
                    WHERE status = :status 
                    AND position >= :new_position 
                    AND position < :old_position
                ");
                $stmt->execute([
                    ':status' => $newStatus,
                    ':new_position' => $newPosition,
                    ':old_position' => $oldPosition
                ]);
            }
        } else {
            // No position change needed, use current position
            $newPosition = $oldPosition;
        }
        
        // Update the task with new status and position
        $stmt = $pdo->prepare("
            UPDATE tasks 
            SET status = :status, position = :position, updated_at = NOW() 
            WHERE id = :id
        ");
        
        $stmt->execute([
            ':status' => $newStatus,
            ':position' => $newPosition,
            ':id' => $taskId
        ]);
        
        // Commit transaction
        $pdo->commit();
        
        // Fetch updated task with project info
        $stmt = $pdo->prepare("
            SELECT 
                t.id,
                t.project_id,
                t.title,
                t.description,
                t.status,
                t.priority,
                t.due_date,
                t.position,
                t.created_at,
                t.updated_at,
                p.name as project_name,
                p.color as project_color
            FROM tasks t
            LEFT JOIN projects p ON t.project_id = p.id
            WHERE t.id = :task_id
        ");
        
        $stmt->execute([':task_id' => $taskId]);
        $task = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Format task for response
        $formattedTask = [
            'id' => (int)$task['id'],
            'project_id' => (int)$task['project_id'],
            'title' => $task['title'],
            'description' => $task['description'],
            'status' => $task['status'],
            'priority' => $task['priority'],
            'due_date' => $task['due_date'],
            'position' => (int)$task['position'],
            'created_at' => $task['created_at'],
            'updated_at' => $task['updated_at'],
            'project_name' => $task['project_name'],
            'project_color' => $task['project_color'],
            'is_overdue' => $task['due_date'] && $task['due_date'] < date('Y-m-d') && $task['status'] !== 'done'
        ];
        
        // Log the status change
        debugLog("Task status updated", [
            'task_id' => $taskId,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'old_position' => $oldPosition,
            'new_position' => $newPosition
        ]);
        
        // Return success response
        echo jsonResponse(true, 'Task status updated successfully', [
            'task' => $formattedTask,
            'changes' => [
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'old_position' => $oldPosition,
                'new_position' => $newPosition
            ]
        ]);
        
    } catch (Exception $e) {
        // Rollback transaction on error
        $pdo->rollBack();
        throw $e;
    }
    
} catch (PDOException $e) {
    // Database error
    error_log("Database error in update_status.php: " . $e->getMessage());
    http_response_code(500);
    echo jsonResponse(false, 'Database error occurred');
    
} catch (Exception $e) {
    // General error
    error_log("Error in update_status.php: " . $e->getMessage());
    http_response_code(500);
    echo jsonResponse(false, 'An error occurred while updating task status');
}
?>
