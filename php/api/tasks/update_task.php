<?php
/**
 * Update Task API Endpoint
 * Kanban Board Project - Web Programming 10636316
 * 
 * Updates an existing task in the database
 * Method: PUT
 * Required: id
 * Optional: title, description, status, priority, due_date, project_id
 */

// Set headers for JSON response and CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow PUT requests
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo jsonResponse(false, 'Method not allowed. Use PUT.');
    exit();
}

// Include required files
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/security.php';

try {
    // Get database connection
    $pdo = getDBConnection();
    
    // Get PUT data
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (empty($input['id'])) {
        http_response_code(400);
        echo jsonResponse(false, 'Task ID is required');
        exit();
    }
    
    $taskId = sanitizeAndValidate($input['id'], 'int');
    
    if ($taskId === false) {
        http_response_code(400);
        echo jsonResponse(false, 'Invalid task ID');
        exit();
    }
    
    // Check if task exists
    $stmt = $pdo->prepare("SELECT * FROM tasks WHERE id = :id");
    $stmt->execute([':id' => $taskId]);
    $existingTask = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$existingTask) {
        http_response_code(404);
        echo jsonResponse(false, 'Task not found');
        exit();
    }
    
    // Prepare update data - only update provided fields
    $updateFields = [];
    $params = [':id' => $taskId];
    
    // Validate and prepare each field if provided
    if (isset($input['title'])) {
        $title = sanitizeAndValidate($input['title'], 'string');
        if (empty($title)) {
            http_response_code(400);
            echo jsonResponse(false, 'Task title cannot be empty');
            exit();
        }
        $updateFields[] = "title = :title";
        $params[':title'] = $title;
    }
    
    if (isset($input['description'])) {
        $updateFields[] = "description = :description";
        $params[':description'] = sanitizeAndValidate($input['description'], 'html');
    }
    
    if (isset($input['status'])) {
        if (!validateStatus($input['status'])) {
            http_response_code(400);
            echo jsonResponse(false, 'Invalid task status');
            exit();
        }
        $updateFields[] = "status = :status";
        $params[':status'] = $input['status'];
    }
    
    if (isset($input['priority'])) {
        if (!validatePriority($input['priority'])) {
            http_response_code(400);
            echo jsonResponse(false, 'Invalid task priority');
            exit();
        }
        $updateFields[] = "priority = :priority";
        $params[':priority'] = $input['priority'];
    }
    
    if (isset($input['due_date'])) {
        if ($input['due_date'] && !validateDate($input['due_date'])) {
            http_response_code(400);
            echo jsonResponse(false, 'Invalid due date format. Use YYYY-MM-DD');
            exit();
        }
        $updateFields[] = "due_date = :due_date";
        $params[':due_date'] = $input['due_date'] ?: null;
    }
    
    if (isset($input['project_id'])) {
        $projectId = sanitizeAndValidate($input['project_id'], 'int');
        if ($projectId === false) {
            http_response_code(400);
            echo jsonResponse(false, 'Invalid project ID');
            exit();
        }
        
        // Check if project exists
        $stmt = $pdo->prepare("SELECT id FROM projects WHERE id = :project_id");
        $stmt->execute([':project_id' => $projectId]);
        
        if (!$stmt->fetch()) {
            http_response_code(400);
            echo jsonResponse(false, 'Project not found');
            exit();
        }
        
        $updateFields[] = "project_id = :project_id";
        $params[':project_id'] = $projectId;
    }
    
    if (isset($input['position'])) {
        $position = sanitizeAndValidate($input['position'], 'int');
        if ($position !== false) {
            $updateFields[] = "position = :position";
            $params[':position'] = $position;
        }
    }
    
    // If no fields to update
    if (empty($updateFields)) {
        http_response_code(400);
        echo jsonResponse(false, 'No valid fields provided for update');
        exit();
    }
    
    // Add updated_at timestamp
    $updateFields[] = "updated_at = NOW()";
    
    // Build and execute update query
    $sql = "UPDATE tasks SET " . implode(', ', $updateFields) . " WHERE id = :id";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    // Fetch the updated task with project info
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
    
    // Log the update
    debugLog("Task updated", ['task_id' => $taskId, 'fields' => array_keys($params)]);
    
    // Return success response
    echo jsonResponse(true, 'Task updated successfully', ['task' => $formattedTask]);
    
} catch (PDOException $e) {
    // Database error
    error_log("Database error in update_task.php: " . $e->getMessage());
    http_response_code(500);
    echo jsonResponse(false, 'Database error occurred');
    
} catch (Exception $e) {
    // General error
    error_log("Error in update_task.php: " . $e->getMessage());
    http_response_code(500);
    echo jsonResponse(false, 'An error occurred while updating the task');
}
?>
