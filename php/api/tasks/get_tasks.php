<?php
error_reporting(E_ERROR | E_PARSE);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../../utils/php-utils.php';

// Start session to get user ID
safeSessionStart();

try {
    $pdo = getDBConnection();

    // Get current user ID from session
    $userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
    
    if (!$userId) {
        echo jsonResponse(false, 'User not authenticated', [], 401);
        exit;
    }

    $workspaceId = isset($_GET['workspace_id']) ? sanitizeAndValidate($_GET['workspace_id'], 'int') : 1;
    $projectId = isset($_GET['project_id']) ? sanitizeAndValidate($_GET['project_id'], 'int') : null;

    $priority = isset($_GET['priority']) ? sanitizeAndValidate($_GET['priority'], 'string') : null;
    $sql = "SELECT
                t.id,
                t.project_id,
                t.title,
                t.description,
                t.status,
                t.priority,
                t.due_date,
                t.position,
                t.created_by,
                t.assigned_to,
                t.team_id,
                t.task_type,
                t.created_at,
                t.updated_at,
                p.name as project_name,
                p.color as project_color,
                p.workspace_id,
                p.team_id as project_team_id,
                tm.name as team_name,
                tm.color as team_color,
                u_creator.username as creator_username,
                u_creator.first_name as creator_first_name,
                u_creator.last_name as creator_last_name,
                u_assigned.username as assigned_username,
                u_assigned.first_name as assigned_first_name,
                u_assigned.last_name as assigned_last_name
            FROM tasks t
            INNER JOIN projects p ON t.project_id = p.id
            INNER JOIN workspaces w ON p.workspace_id = w.id
            LEFT JOIN workspace_members wm ON w.id = wm.workspace_id AND wm.user_id = :user_id_1
            LEFT JOIN teams tm ON t.team_id = tm.id
            LEFT JOIN users u_creator ON t.created_by = u_creator.id
            LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
            WHERE p.workspace_id = :workspace_id 
              AND (w.owner_id = :user_id_2 OR wm.user_id = :user_id_3 
                   OR (w.team_id IS NOT NULL AND EXISTS (
                       SELECT 1 FROM team_members tm_members 
                       WHERE tm_members.team_id = w.team_id 
                       AND tm_members.user_id = :user_id_4 
                       AND tm_members.status = 'active'
                   )))";

    $params = [
        ':workspace_id' => $workspaceId, 
        ':user_id_1' => $userId, 
        ':user_id_2' => $userId, 
        ':user_id_3' => $userId, 
        ':user_id_4' => $userId
    ];

    // Add filters if provided
    if ($projectId !== null && $projectId !== false) {
        $sql .= " AND t.project_id = :project_id";
        $params[':project_id'] = $projectId;
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
            'created_by' => (int)$task['created_by'],
            'assigned_to' => $task['assigned_to'] ? (int)$task['assigned_to'] : null,
            'team_id' => $task['team_id'] ? (int)$task['team_id'] : null,
            'task_type' => $task['task_type'],
            'created_at' => $task['created_at'],
            'updated_at' => $task['updated_at'],
            'project_name' => $task['project_name'],
            'project_color' => $task['project_color'],
            'project_team_id' => $task['project_team_id'] ? (int)$task['project_team_id'] : null,
            'team_name' => $task['team_name'],
            'team_color' => $task['team_color'],
            'creator' => [
                'username' => $task['creator_username'],
                'first_name' => $task['creator_first_name'],
                'last_name' => $task['creator_last_name']
            ],
            'assigned_to_user' => $task['assigned_to'] ? [
                'username' => $task['assigned_username'],
                'first_name' => $task['assigned_first_name'],
                'last_name' => $task['assigned_last_name']
            ] : null,
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
