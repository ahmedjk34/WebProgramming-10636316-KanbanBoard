<?php
/**
 * Get Projects API Endpoint
 * Kanban Board Project - Web Programming 10636316
 * 
 * Retrieves all projects from the database
 * Method: GET
 */

// Set headers for JSON response and CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Include required files
require_once '../../config/database.php';
require_once '../../includes/functions.php';
require_once '../../includes/security.php';

try {
    // Get database connection
    $pdo = getDBConnection();
    
    // Get all projects with task counts
    $sql = "SELECT 
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
            GROUP BY p.id, p.name, p.description, p.color, p.created_at, p.updated_at
            ORDER BY p.created_at ASC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format projects for frontend
    $formattedProjects = [];
    foreach ($projects as $project) {
        $formattedProjects[] = [
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
    }
    
    // Return success response
    echo jsonResponse(true, 'Projects retrieved successfully', [
        'projects' => $formattedProjects,
        'total_count' => count($formattedProjects)
    ]);
    
} catch (PDOException $e) {
    // Database error
    error_log("Database error in get_projects.php: " . $e->getMessage());
    http_response_code(500);
    echo jsonResponse(false, 'Database error occurred');
    
} catch (Exception $e) {
    // General error
    error_log("Error in get_projects.php: " . $e->getMessage());
    http_response_code(500);
    echo jsonResponse(false, 'An error occurred while retrieving projects');
}
?>
