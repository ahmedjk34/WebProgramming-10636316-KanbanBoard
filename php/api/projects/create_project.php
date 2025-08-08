<?php
/**
 * Create Project API Endpoint
 * Kanban Board Project - Web Programming 10636316
 * 
 * Creates a new project in the database
 * Method: POST
 * Required: name
 * Optional: description, color
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
    if (empty($input['name'])) {
        http_response_code(400);
        echo jsonResponse(false, 'Project name is required');
        exit();
    }
    
    // Validate project data
    $validation = validateProjectData($input);
    
    if (!$validation['valid']) {
        http_response_code(400);
        echo jsonResponse(false, 'Validation failed', ['errors' => $validation['errors']]);
        exit();
    }
    
    $projectData = $validation['data'];
    
    // Check if project name already exists
    $stmt = $pdo->prepare("SELECT id FROM projects WHERE name = :name");
    $stmt->execute([':name' => $projectData['name']]);
    
    if ($stmt->fetch()) {
        http_response_code(400);
        echo jsonResponse(false, 'Project name already exists');
        exit();
    }
    
    // Default color if not provided
    $color = $projectData['color'] ?? '#3498db';
    
    // Prepare SQL for project insertion
    $sql = "INSERT INTO projects (
                name, 
                description, 
                color,
                created_at,
                updated_at
            ) VALUES (
                :name, 
                :description, 
                :color,
                NOW(),
                NOW()
            )";
    
    $params = [
        ':name' => $projectData['name'],
        ':description' => $projectData['description'] ?? '',
        ':color' => $color
    ];
    
    // Execute insertion
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    // Get the created project ID
    $projectId = $pdo->lastInsertId();
    
    // Fetch the complete created project
    $stmt = $pdo->prepare("
        SELECT 
            p.id,
            p.name,
            p.description,
            p.color,
            p.created_at,
            p.updated_at,
            COUNT(t.id) as task_count,
            SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) as todo_count,
            SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count,
            SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done_count
        FROM projects p
        LEFT JOIN tasks t ON p.id = t.project_id
        WHERE p.id = :project_id
        GROUP BY p.id, p.name, p.description, p.color, p.created_at, p.updated_at
    ");
    
    $stmt->execute([':project_id' => $projectId]);
    $project = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Format project for response
    $formattedProject = [
        'id' => (int)$project['id'],
        'name' => $project['name'],
        'description' => $project['description'],
        'color' => $project['color'],
        'created_at' => $project['created_at'],
        'updated_at' => $project['updated_at'],
        'task_count' => (int)$project['task_count'],
        'todo_count' => (int)$project['todo_count'],
        'in_progress_count' => (int)$project['in_progress_count'],
        'done_count' => (int)$project['done_count']
    ];
    
    // Log the creation
    debugLog("Project created", ['project_id' => $projectId, 'name' => $project['name']]);
    
    // Return success response
    http_response_code(201);
    echo jsonResponse(true, 'Project created successfully', ['project' => $formattedProject]);
    
} catch (PDOException $e) {
    // Database error
    error_log("Database error in create_project.php: " . $e->getMessage());
    http_response_code(500);
    echo jsonResponse(false, 'Database error occurred');
    
} catch (Exception $e) {
    // General error
    error_log("Error in create_project.php: " . $e->getMessage());
    http_response_code(500);
    echo jsonResponse(false, 'An error occurred while creating the project');
}
?>
