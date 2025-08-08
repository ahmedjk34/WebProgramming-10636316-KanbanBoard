<?php
/**
 * Update Project API Endpoint
 * Kanban Board Project - Web Programming 10636316
 * 
 * Updates an existing project in the database
 * Method: PUT
 * Required: id
 * Optional: name, description, color
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
        echo jsonResponse(false, 'Project ID is required');
        exit();
    }
    
    $projectId = sanitizeAndValidate($input['id'], 'int');
    
    if ($projectId === false) {
        http_response_code(400);
        echo jsonResponse(false, 'Invalid project ID');
        exit();
    }
    
    // Check if project exists
    $stmt = $pdo->prepare("SELECT * FROM projects WHERE id = :id");
    $stmt->execute([':id' => $projectId]);
    $existingProject = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$existingProject) {
        http_response_code(404);
        echo jsonResponse(false, 'Project not found');
        exit();
    }
    
    // Prepare update data - only update provided fields
    $updateFields = [];
    $params = [':id' => $projectId];
    
    // Validate and prepare each field if provided
    if (isset($input['name'])) {
        $name = sanitizeAndValidate($input['name'], 'string');
        if (empty($name)) {
            http_response_code(400);
            echo jsonResponse(false, 'Project name cannot be empty');
            exit();
        }
        
        // Check if name already exists (excluding current project)
        $stmt = $pdo->prepare("SELECT id FROM projects WHERE name = :name AND id != :id");
        $stmt->execute([':name' => $name, ':id' => $projectId]);
        
        if ($stmt->fetch()) {
            http_response_code(400);
            echo jsonResponse(false, 'Project name already exists');
            exit();
        }
        
        $updateFields[] = "name = :name";
        $params[':name'] = $name;
    }
    
    if (isset($input['description'])) {
        $updateFields[] = "description = :description";
        $params[':description'] = sanitizeAndValidate($input['description'], 'html');
    }
    
    if (isset($input['color'])) {
        $color = sanitizeAndValidate($input['color'], 'string');
        if (!preg_match('/^#[a-fA-F0-9]{6}$/', $color)) {
            http_response_code(400);
            echo jsonResponse(false, 'Invalid color format. Use #RRGGBB format');
            exit();
        }
        $updateFields[] = "color = :color";
        $params[':color'] = $color;
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
    $sql = "UPDATE projects SET " . implode(', ', $updateFields) . " WHERE id = :id";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    // Fetch the updated project with task counts
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
    
    // Log the update
    debugLog("Project updated", ['project_id' => $projectId, 'fields' => array_keys($params)]);
    
    // Return success response
    echo jsonResponse(true, 'Project updated successfully', ['project' => $formattedProject]);
    
} catch (PDOException $e) {
    // Database error
    error_log("Database error in update_project.php: " . $e->getMessage());
    http_response_code(500);
    echo jsonResponse(false, 'Database error occurred');
    
} catch (Exception $e) {
    // General error
    error_log("Error in update_project.php: " . $e->getMessage());
    http_response_code(500);
    echo jsonResponse(false, 'An error occurred while updating the project');
}
?>
