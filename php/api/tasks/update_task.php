<?php
/**
 * Update Task API Endpoint
 * Kanban Board Project - Web Programming 10636316
 *
 * Updates an existing task in the database
 * Method: POST
 * Required: id, title, project_id
 * Optional: description, priority, status, due_date
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
    if (empty($input['id']) || empty($input['title']) || empty($input['project_id'])) {
        echo jsonResponse(false, 'ID, title, and project_id are required', [], 400);
        exit();
    }

    // Sanitize and validate input
    $taskId = (int)$input['id'];
    $title = sanitizeInput($input['title']);
    $description = sanitizeInput($input['description'] ?? '');
    $projectId = (int)$input['project_id'];
    $priority = sanitizeInput($input['priority'] ?? 'medium');
    $status = sanitizeInput($input['status'] ?? 'todo');
    $dueDate = !empty($input['due_date']) ? $input['due_date'] : null;

    // Validate title length
    if (strlen($title) > 255) {
        echo jsonResponse(false, 'Title must be less than 255 characters', [], 400);
        exit();
    }

    // Check if task exists
    $taskCheck = $pdo->prepare("SELECT id FROM tasks WHERE id = :task_id");
    $taskCheck->execute([':task_id' => $taskId]);

    if (!$taskCheck->fetch()) {
        echo jsonResponse(false, 'Task not found', [], 404);
        exit();
    }

    // Validate project exists
    $projectCheck = $pdo->prepare("SELECT id FROM projects WHERE id = :project_id");
    $projectCheck->execute([':project_id' => $projectId]);

    if (!$projectCheck->fetch()) {
        echo jsonResponse(false, 'Invalid project ID', [], 400);
        exit();
    }

    // Validate priority
    $validPriorities = ['low', 'medium', 'high'];
    if (!in_array($priority, $validPriorities)) {
        $priority = 'medium';
    }

    // Validate status
    $validStatuses = ['todo', 'in_progress', 'done'];
    if (!in_array($status, $validStatuses)) {
        $status = 'todo';
    }

    // Validate due date format if provided
    if ($dueDate && !validateDate($dueDate)) {
        echo jsonResponse(false, 'Invalid due date format. Use YYYY-MM-DD', [], 400);
        exit();
    }

    // Update task
    $sql = "UPDATE tasks
            SET title = :title,
                description = :description,
                project_id = :project_id,
                priority = :priority,
                status = :status,
                due_date = :due_date,
                updated_at = NOW()
            WHERE id = :task_id";

    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([
        ':title' => $title,
        ':description' => $description,
        ':project_id' => $projectId,
        ':priority' => $priority,
        ':status' => $status,
        ':due_date' => $dueDate,
        ':task_id' => $taskId
    ]);

    if ($result) {
        echo jsonResponse(true, 'Task updated successfully', [
            'task_id' => (int)$taskId
        ], 200);

    } else {
        echo jsonResponse(false, 'Failed to update task', [], 500);
    }

} catch (PDOException $e) {
    error_log("Database error in update_task.php: " . $e->getMessage());
    echo jsonResponse(false, 'Database error occurred', [], 500);

} catch (Exception $e) {
    error_log("Error in update_task.php: " . $e->getMessage());
    echo jsonResponse(false, 'An error occurred while updating the task', [], 500);
}
?>
