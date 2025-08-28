<?php
/**
 * Create Task API Endpoint
 * Kanban Board Project - Web Programming 10636316
 *
 * Creates a new task in the database
 * Method: POST
 * Required: title, project_id
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
    if (empty($input['title']) || empty($input['project_id'])) {
        echo jsonResponse(false, 'Title and project_id are required', [], 400);
        exit();
    }

    // Sanitize and validate input
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

    // Get current user ID from session
    session_start();
    $userId = $_SESSION['user_id'] ?? 1; // Default to user ID 1 if not set
    
    // Get next position for the status column
    $positionStmt = $pdo->prepare("SELECT COALESCE(MAX(position), 0) + 1 as next_position FROM tasks WHERE status = :status");
    $positionStmt->execute([':status' => $status]);
    $nextPosition = $positionStmt->fetch(PDO::FETCH_ASSOC)['next_position'];

    // Insert new task
    $sql = "INSERT INTO tasks (title, description, project_id, priority, status, due_date, position, created_by, created_at, updated_at)
            VALUES (:title, :description, :project_id, :priority, :status, :due_date, :position, :created_by, NOW(), NOW())";

    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([
        ':title' => $title,
        ':description' => $description,
        ':project_id' => $projectId,
        ':priority' => $priority,
        ':status' => $status,
        ':due_date' => $dueDate,
        ':position' => $nextPosition,
        ':created_by' => $userId
    ]);

    if ($result) {
        $taskId = $pdo->lastInsertId();

        echo jsonResponse(true, 'Task created successfully', [
            'task_id' => (int)$taskId
        ], 201);

    } else {
        echo jsonResponse(false, 'Failed to create task', [], 500);
    }

} catch (PDOException $e) {
    error_log("Database error in create_task.php: " . $e->getMessage());
    echo jsonResponse(false, 'Database error occurred', [], 500);

} catch (Exception $e) {
    error_log("Error in create_task.php: " . $e->getMessage());
    echo jsonResponse(false, 'An error occurred while creating the task', [], 500);
}
?>
