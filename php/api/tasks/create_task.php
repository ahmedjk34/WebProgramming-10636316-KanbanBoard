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
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid project ID']);
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
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid due date format. Use YYYY-MM-DD']);
        exit();
    }

    // Get next position for the status column
    $positionStmt = $pdo->prepare("SELECT COALESCE(MAX(position), 0) + 1 as next_position FROM tasks WHERE status = :status");
    $positionStmt->execute([':status' => $status]);
    $nextPosition = $positionStmt->fetch(PDO::FETCH_ASSOC)['next_position'];

    // Insert new task
    $sql = "INSERT INTO tasks (title, description, project_id, priority, status, due_date, position, created_at, updated_at)
            VALUES (:title, :description, :project_id, :priority, :status, :due_date, :position, NOW(), NOW())";

    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([
        ':title' => $title,
        ':description' => $description,
        ':project_id' => $projectId,
        ':priority' => $priority,
        ':status' => $status,
        ':due_date' => $dueDate,
        ':position' => $nextPosition
    ]);

    if ($result) {
        $taskId = $pdo->lastInsertId();

        // Clean any output buffer before sending JSON
        ob_clean();

        echo json_encode([
            'success' => true,
            'message' => 'Task created successfully',
            'data' => [
                'task_id' => (int)$taskId
            ]
        ]);

    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create task']);
    }

} catch (PDOException $e) {
    error_log("Database error in create_task.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error occurred']);

} catch (Exception $e) {
    error_log("Error in create_task.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'An error occurred while creating the task']);
}

// Helper function to validate date format
function validateDate($date, $format = 'Y-m-d') {
    $d = DateTime::createFromFormat($format, $date);
    return $d && $d->format($format) === $date;
}
?>0636316
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
