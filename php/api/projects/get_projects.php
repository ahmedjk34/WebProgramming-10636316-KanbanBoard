<?php
/**
 * Get Projects API Endpoint
 * Kanban Board Project - Web Programming 10636316
 *
 * Retrieves all projects from the database
 * Method: GET
 */

// Suppress any PHP notices/warnings for clean JSON output
error_reporting(E_ERROR | E_PARSE);

// Headers are set in php-utils.php

// Include required files
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../../utils/php-utils.php';

// Start session to get user ID
safeSessionStart();

try {
    // Get database connection
    $pdo = getDBConnection();

    // Get current user ID from session
    $userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
    
    if (!$userId) {
        echo jsonResponse(false, 'User not authenticated', [], 401);
        exit;
    }

    // Get workspace_id from query parameter (default to 1)
    $workspaceId = isset($_GET['workspace_id']) ? (int)$_GET['workspace_id'] : 1;

    // Get all projects with task counts for the current workspace (personal and team)
    $sql = "SELECT
                p.id,
                p.workspace_id,
                p.name,
                p.description,
                p.color,
                p.status,
                p.created_by,
                p.team_id,
                p.project_type,
                p.created_at,
                p.updated_at,
                COUNT(t.id) as task_count,
                SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) as todo_count,
                SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count,
                SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done_count,
                tm.name as team_name,
                tm.color as team_color
            FROM projects p
            INNER JOIN workspaces w ON p.workspace_id = w.id
            LEFT JOIN workspace_members wm ON w.id = wm.workspace_id AND wm.user_id = :user_id_1
            LEFT JOIN teams tm ON p.team_id = tm.id
            LEFT JOIN tasks t ON p.id = t.project_id
            WHERE p.workspace_id = :workspace_id 
              AND (w.owner_id = :user_id_2 OR wm.user_id = :user_id_3 
                   OR (w.team_id IS NOT NULL AND EXISTS (
                       SELECT 1 FROM team_members tm 
                       WHERE tm.team_id = w.team_id 
                       AND tm.user_id = :user_id_4 
                       AND tm.status = 'active'
                   )))
            GROUP BY p.id, p.workspace_id, p.name, p.description, p.color, p.status, p.created_by, p.team_id, p.project_type, p.created_at, p.updated_at, tm.name, tm.color
            ORDER BY p.created_at ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':workspace_id' => $workspaceId, 
        ':user_id_1' => $userId, 
        ':user_id_2' => $userId, 
        ':user_id_3' => $userId, 
        ':user_id_4' => $userId
    ]);
    $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format projects for frontend
    $formattedProjects = [];
    foreach ($projects as $project) {
        $formattedProjects[] = [
            'id' => (int)$project['id'],
            'name' => $project['name'],
            'description' => $project['description'],
            'color' => $project['color'],
            'status' => $project['status'],
            'created_by' => (int)$project['created_by'],
            'team_id' => $project['team_id'] ? (int)$project['team_id'] : null,
            'project_type' => $project['project_type'],
            'created_at' => $project['created_at'],
            'updated_at' => $project['updated_at'],
            'task_count' => (int)$project['task_count'],
            'todo_count' => (int)$project['todo_count'],
            'in_progress_count' => (int)$project['in_progress_count'],
            'done_count' => (int)$project['done_count'],
            'team_name' => $project['team_name'],
            'team_color' => $project['team_color']
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
