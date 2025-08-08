<?php
/**
 * Create Task API Endpoint
 * Kanban Board Project - Web Programming 10636316
 * 
 * Creates a new task in the database
 * Method: POST
 * Required: title, project_id
 * Optional: description, status, priority, due_date
 */

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
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo jsonResponse(false, 'Method not allowed. Use POST.');
    exit();
}

// Include required files
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/security.php';

try {
    // Get database connection
    $pdo = getDBConnection();
    
    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);
    
    // If JSON decode failed, try form data
    if ($input === null) {
        $input = $_POST;
    }
    
    // Validate required fields
    if (empty($input['title'])) {
        http_response_code(400);
        echo jsonResponse(false, 'Task title is required');
        exit();
    }
    
    if (empty($input['project_id'])) {
        http_response_code(400);
        echo jsonResponse(false, 'Project ID is required');
        exit();
    }
    
    // Validate task data
    $validation = validateTaskData($input);
    
    if (!$validation['valid']) {
        http_response_code(400);
        echo jsonResponse(false, 'Validation failed', ['errors' => $validation['errors']]);
        exit();
    }
    
    $taskData = $validation['data'];
    
    // Check if project exists
    $stmt = $pdo->prepare("SELECT id FROM projects WHERE id = :project_id");
    $stmt->execute([':project_id' => $taskData['project_id']]);
    
    if (!$stmt->fetch()) {
        http_response_code(400);
        echo jsonResponse(false, 'Project not found');
        exit();
    }
    
    // Get next position for the status column
    $status = $taskData['status'] ?? 'todo';
    $stmt = $pdo->prepare("SELECT COALESCE(MAX(position), 0) + 1 as next_position FROM tasks WHERE status = :status");
    $stmt->execute([':status' => $status]);
    $nextPosition = $stmt->fetch()['next_position'];
    
    // Prepare SQL for task insertion
    $sql = "INSERT INTO tasks (
                project_id, 
                title, 
                description, 
                status, 
                priority, 
                due_date, 
                position,
                created_at,
                updated_at
            ) VALUES (
                :project_id, 
                :title, 
                :description, 
                :status, 
                :priority, 
                :due_date, 
                :position,
                NOW(),
                NOW()
            )";
    
    $params = [
        ':project_id' => $taskData['project_id'],
        ':title' => $taskData['title'],
        ':description' => $taskData['description'] ?? '',
        ':status' => $status,
        ':priority' => $taskData['priority'] ?? 'medium',
        ':due_date' => $taskData['due_date'] ?? null,
        ':position' => $nextPosition
    ];
    
    // Execute insertion
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    // Get the created task ID
    $taskId = $pdo->lastInsertId();
    
    // Fetch the complete created task with project info
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
    
    // Log the creation
    debugLog("Task created", ['task_id' => $taskId, 'title' => $task['title']]);
    
    // Return success response
    http_response_code(201);
    echo jsonResponse(true, 'Task created successfully', ['task' => $formattedTask]);
    
} catch (PDOException $e) {
    // Database error
    error_log("Database error in create_task.php: " . $e->getMessage());
    http_response_code(500);
    echo jsonResponse(false, 'Database error occurred');
    
} catch (Exception $e) {
    // General error
    error_log("Error in create_task.php: " . $e->getMessage());
    http_response_code(500);
    echo jsonResponse(false, 'An error occurred while creating the task');
}
?>
