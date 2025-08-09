<?php
/**
 * Get Tasks API Endpoint
 * Kanban Board Project - Web Programming 10636316
 *
 * Retrieves tasks from the database with optional filtering
 * Method: GET
 * Parameters: project_id (optional), status (optional), priority (optional)
 */

// Suppress any PHP notices/warnings for clean JSON output
error_reporting(E_ERROR | E_PARSE);

// Headers are set in php-utils.php

// Include required files
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../../utils/php-utils.php';

try {
    // Get database connection
    $pdo = getDBConnection();

    // Get query parameters
    $workspaceId = isset($_GET['workspace_id']) ? sanitizeAndValidate($_GET['workspace_id'], 'int') : 1;
    $projectId = isset($_GET['project_id']) ? sanitizeAndValidate($_GET['project_id'], 'int') : null;
    $status = isset($_GET['status']) ? sanitizeAndValidate($_GET['status'], 'string') : null;
    $priority = isset($_GET['priority']) ? sanitizeAndValidate($_GET['priority'], 'string') : null;

    // Build SQL query with optional filters
    $sql = "SELECT
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
                p.color as project_color,
                p.workspace_id
            FROM tasks t
            LEFT JOIN projects p ON t.project_id = p.id
            WHERE p.workspace_id = :workspace_id";

    $params = [':workspace_id' => $workspaceId];

    // Add filters if provided
    if ($projectId !== null && $projectId !== false) {
        $sql .= " AND t.project_id = :project_id";
        $params[':project_id'] = $projectId;
    }

    if ($status && validateStatus($status)) {
        $sql .= " AND t.status = :status";
        $params[':status'] = $status;
    }

    if ($priority && validatePriority($priority)) {
        $sql .= " AND t.priority = :priority";
        $params[':priority'] = $priority;
    }

    // Order by position and creation date
    $sql .= " ORDER BY t.status, t.position ASC, t.created_at DESC";

    // Execute query
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format tasks for frontend
    $formattedTasks = [];
    foreach ($tasks as $task) {
        $formattedTasks[] = [
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
    }

    // Group tasks by status for easier frontend handling
    $tasksByStatus = [
        'todo' => [],
        'in_progress' => [],
        'done' => []
    ];

    foreach ($formattedTasks as $task) {
        $tasksByStatus[$task['status']][] = $task;
    }

    // Return success response
    echo jsonResponse(true, 'Tasks loaded successfully', [
        'tasks' => $formattedTasks,
        'tasks_by_status' => $tasksByStatus,
        'total_count' => count($formattedTasks),
        'counts' => [
            'todo' => count($tasksByStatus['todo']),
            'in_progress' => count($tasksByStatus['in_progress']),
            'done' => count($tasksByStatus['done'])
        ]
    ]);

} catch (Exception $e) {
    echo jsonResponse(false, 'Error loading tasks: ' . $e->getMessage(), [], 500);
}
?>
