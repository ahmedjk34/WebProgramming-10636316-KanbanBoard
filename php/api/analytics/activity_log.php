<?php
/**
 * Activity Log API
 * Returns task activity history for analytics
 */

error_reporting(E_ERROR | E_PARSE);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../../utils/php-utils.php';

header('Content-Type: application/json');

try {
    $pdo = getDBConnection();
    
    // Get parameters
    $taskId = isset($_GET['task_id']) ? sanitizeAndValidate($_GET['task_id'], 'int') : null;
    $projectId = isset($_GET['project_id']) ? sanitizeAndValidate($_GET['project_id'], 'int') : null;
    $workspaceId = isset($_GET['workspace_id']) ? sanitizeAndValidate($_GET['workspace_id'], 'int') : null;
    $actionType = isset($_GET['action_type']) ? sanitizeAndValidate($_GET['action_type'], 'string') : null;
    $days = isset($_GET['days']) ? sanitizeAndValidate($_GET['days'], 'int') : 7;
    $limit = isset($_GET['limit']) ? sanitizeAndValidate($_GET['limit'], 'int') : 50;
    
    // Validate and limit parameters
    $days = min(max($days, 1), 365);
    $limit = min(max($limit, 1), 1000);
    
    $validActionTypes = ['created', 'updated', 'status_changed', 'deleted', 'moved', 'priority_changed'];
    if ($actionType && !in_array($actionType, $validActionTypes)) {
        $actionType = null;
    }
    
    $response = [
        'success' => true,
        'message' => 'Activity log retrieved successfully',
        'data' => [],
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    // Build filters
    $filters = ['tal.created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)'];
    $params = [':days' => $days];
    
    if ($taskId) {
        $filters[] = 'tal.task_id = :task_id';
        $params[':task_id'] = $taskId;
    }
    
    if ($projectId) {
        $filters[] = 't.project_id = :project_id';
        $params[':project_id'] = $projectId;
    }
    
    if ($workspaceId) {
        $filters[] = 'p.workspace_id = :workspace_id';
        $params[':workspace_id'] = $workspaceId;
    }
    
    if ($actionType) {
        $filters[] = 'tal.action_type = :action_type';
        $params[':action_type'] = $actionType;
    }
    
    $whereClause = 'WHERE ' . implode(' AND ', $filters);
    
    // 1. Activity Log with Details
    $activitySQL = "
        SELECT 
            tal.id,
            tal.task_id,
            tal.action_type,
            tal.old_value,
            tal.new_value,
            tal.field_changed,
            tal.created_at,
            t.title as task_title,
            t.status as current_status,
            t.priority as current_priority,
            p.id as project_id,
            p.name as project_name,
            p.color as project_color,
            w.id as workspace_id,
            w.name as workspace_name,
            w.icon as workspace_icon
        FROM task_activity_log tal
        LEFT JOIN tasks t ON tal.task_id = t.id
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN workspaces w ON p.workspace_id = w.id
        $whereClause
        ORDER BY tal.created_at DESC
        LIMIT " . (int)$limit;
    
    $stmt = $pdo->prepare($activitySQL);
    $stmt->execute($params);
    $activities = $stmt->fetchAll();
    
    $formattedActivities = [];
    foreach ($activities as $activity) {
        $formattedActivities[] = [
            'id' => (int)$activity['id'],
            'task_id' => (int)$activity['task_id'],
            'action_type' => $activity['action_type'],
            'old_value' => $activity['old_value'],
            'new_value' => $activity['new_value'],
            'field_changed' => $activity['field_changed'],
            'created_at' => $activity['created_at'],
            'task' => [
                'title' => $activity['task_title'],
                'current_status' => $activity['current_status'],
                'current_priority' => $activity['current_priority']
            ],
            'project' => [
                'id' => (int)$activity['project_id'],
                'name' => $activity['project_name'],
                'color' => $activity['project_color']
            ],
            'workspace' => [
                'id' => (int)$activity['workspace_id'],
                'name' => $activity['workspace_name'],
                'icon' => $activity['workspace_icon']
            ]
        ];
    }
    
    $response['data']['activities'] = $formattedActivities;
    
    // 2. Activity Summary
    $summarySQL = "
        SELECT 
            tal.action_type,
            COUNT(*) as count,
            DATE(tal.created_at) as date
        FROM task_activity_log tal
        LEFT JOIN tasks t ON tal.task_id = t.id
        LEFT JOIN projects p ON t.project_id = p.id
        $whereClause
        GROUP BY tal.action_type, DATE(tal.created_at)
        ORDER BY date DESC, tal.action_type
    ";
    
    $stmt = $pdo->prepare($summarySQL);
    $stmt->execute($params);
    $summary = $stmt->fetchAll();
    
    $response['data']['summary'] = $summary;
    
    // 3. Hourly Activity Pattern (for productivity analysis)
    $hourlySQL = "
        SELECT 
            HOUR(tal.created_at) as hour,
            COUNT(*) as activity_count,
            tal.action_type
        FROM task_activity_log tal
        LEFT JOIN tasks t ON tal.task_id = t.id
        LEFT JOIN projects p ON t.project_id = p.id
        $whereClause
        GROUP BY HOUR(tal.created_at), tal.action_type
        ORDER BY hour, tal.action_type
    ";
    
    $stmt = $pdo->prepare($hourlySQL);
    $stmt->execute($params);
    $hourlyPattern = $stmt->fetchAll();
    
    $response['data']['hourly_pattern'] = $hourlyPattern;
    
    // 4. Most Active Tasks
    $activeTasksSQL = "
        SELECT 
            t.id,
            t.title,
            t.status,
            t.priority,
            p.name as project_name,
            p.color as project_color,
            COUNT(tal.id) as activity_count,
            MAX(tal.created_at) as last_activity
        FROM task_activity_log tal
        LEFT JOIN tasks t ON tal.task_id = t.id
        LEFT JOIN projects p ON t.project_id = p.id
        $whereClause
        GROUP BY t.id, t.title, t.status, t.priority, p.name, p.color
        ORDER BY activity_count DESC, last_activity DESC
        LIMIT 10
    ";
    
    $stmt = $pdo->prepare($activeTasksSQL);
    $stmt->execute($params);
    $activeTasks = $stmt->fetchAll();
    
    $response['data']['most_active_tasks'] = array_map(function($task) {
        return [
            'id' => (int)$task['id'],
            'title' => $task['title'],
            'status' => $task['status'],
            'priority' => $task['priority'],
            'project_name' => $task['project_name'],
            'project_color' => $task['project_color'],
            'activity_count' => (int)$task['activity_count'],
            'last_activity' => $task['last_activity']
        ];
    }, $activeTasks);
    
    // 5. Activity Statistics
    $statsSQL = "
        SELECT 
            COUNT(*) as total_activities,
            COUNT(DISTINCT tal.task_id) as unique_tasks,
            COUNT(DISTINCT DATE(tal.created_at)) as active_days,
            SUM(CASE WHEN tal.action_type = 'created' THEN 1 ELSE 0 END) as tasks_created,
            SUM(CASE WHEN tal.action_type = 'status_changed' THEN 1 ELSE 0 END) as status_changes,
            SUM(CASE WHEN tal.action_type = 'updated' THEN 1 ELSE 0 END) as task_updates,
            SUM(CASE WHEN tal.action_type = 'deleted' THEN 1 ELSE 0 END) as tasks_deleted
        FROM task_activity_log tal
        LEFT JOIN tasks t ON tal.task_id = t.id
        LEFT JOIN projects p ON t.project_id = p.id
        $whereClause
    ";
    
    $stmt = $pdo->prepare($statsSQL);
    $stmt->execute($params);
    $stats = $stmt->fetch();
    
    $response['data']['statistics'] = [
        'total_activities' => (int)$stats['total_activities'],
        'unique_tasks' => (int)$stats['unique_tasks'],
        'active_days' => (int)$stats['active_days'],
        'breakdown' => [
            'tasks_created' => (int)$stats['tasks_created'],
            'status_changes' => (int)$stats['status_changes'],
            'task_updates' => (int)$stats['task_updates'],
            'tasks_deleted' => (int)$stats['tasks_deleted']
        ]
    ];
    
    // 6. Productivity Insights
    if (!$taskId) { // Only for general activity, not task-specific
        $productivitySQL = "
            SELECT 
                DATE(tal.created_at) as date,
                COUNT(CASE WHEN tal.action_type = 'created' THEN 1 END) as created,
                COUNT(CASE WHEN tal.action_type = 'status_changed' AND tal.new_value = 'done' THEN 1 END) as completed,
                COUNT(CASE WHEN tal.action_type = 'status_changed' AND tal.new_value = 'in_progress' THEN 1 END) as started
            FROM task_activity_log tal
            LEFT JOIN tasks t ON tal.task_id = t.id
            LEFT JOIN projects p ON t.project_id = p.id
            $whereClause
            GROUP BY DATE(tal.created_at)
            ORDER BY date DESC
            LIMIT 30
        ";
        
        $stmt = $pdo->prepare($productivitySQL);
        $stmt->execute($params);
        $productivity = $stmt->fetchAll();
        
        $response['data']['productivity_trend'] = $productivity;
    }
    
    echo json_encode($response);
    
} catch (Exception $e) {
    echo jsonResponse(false, 'Error retrieving activity log: ' . $e->getMessage(), [], 500);
}
?>
