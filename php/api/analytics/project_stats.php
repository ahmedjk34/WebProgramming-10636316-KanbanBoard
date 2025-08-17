<?php
/**
 * Project Statistics API
 * Returns detailed analytics for specific projects
 */

error_reporting(E_ERROR | E_PARSE);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../../utils/php-utils.php';

header('Content-Type: application/json');

try {
    $pdo = getDBConnection();
    
    // Get parameters
    $projectId = isset($_GET['project_id']) ? sanitizeAndValidate($_GET['project_id'], 'int') : null;
    $workspaceId = isset($_GET['workspace_id']) ? sanitizeAndValidate($_GET['workspace_id'], 'int') : null;
    $days = isset($_GET['days']) ? sanitizeAndValidate($_GET['days'], 'int') : 30;
    $days = min(max($days, 1), 365);
    
    $response = [
        'success' => true,
        'message' => 'Project statistics retrieved successfully',
        'data' => [],
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    // Build filters
    $filters = [];
    $params = [];

    if ($projectId) {
        $filters[] = 'p.id = :project_id';
        $params[':project_id'] = $projectId;
    }

    if ($workspaceId) {
        $filters[] = 'p.workspace_id = :workspace_id';
        $params[':workspace_id'] = $workspaceId;
    }

    $whereClause = !empty($filters) ? 'WHERE ' . implode(' AND ', $filters) : 'WHERE 1=1';
    
    // 1. Project Overview
    $overviewSQL = "
        SELECT 
            p.id,
            p.name,
            p.description,
            p.color,
            p.status as project_status,
            p.created_at as project_created,
            w.name as workspace_name,
            w.icon as workspace_icon,
            w.color as workspace_color,
            COUNT(t.id) as total_tasks,
            SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) as todo_tasks,
            SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
            SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as completed_tasks,
            SUM(CASE WHEN t.due_date < CURDATE() AND t.status != 'done' THEN 1 ELSE 0 END) as overdue_tasks,
            SUM(CASE WHEN t.priority = 'high' THEN 1 ELSE 0 END) as high_priority_tasks,
            SUM(CASE WHEN t.priority = 'medium' THEN 1 ELSE 0 END) as medium_priority_tasks,
            SUM(CASE WHEN t.priority = 'low' THEN 1 ELSE 0 END) as low_priority_tasks,
            AVG(CASE WHEN t.status = 'done' AND t.due_date IS NOT NULL 
                THEN DATEDIFF(t.updated_at, t.created_at) 
                ELSE NULL END) as avg_completion_days
        FROM projects p
        LEFT JOIN tasks t ON p.id = t.project_id
        LEFT JOIN workspaces w ON p.workspace_id = w.id
        $whereClause
        GROUP BY p.id, p.name, p.description, p.color, p.status, p.created_at, 
                 w.name, w.icon, w.color
        ORDER BY p.name
    ";
    
    $stmt = $pdo->prepare($overviewSQL);
    $stmt->execute($params);
    $projects = $stmt->fetchAll();
    
    $projectStats = [];
    foreach ($projects as $project) {
        $completionRate = $project['total_tasks'] > 0 ? 
            round(($project['completed_tasks'] / $project['total_tasks']) * 100, 2) : 0;
        
        $projectStats[] = [
            'id' => (int)$project['id'],
            'name' => $project['name'],
            'description' => $project['description'],
            'color' => $project['color'],
            'project_status' => $project['project_status'],
            'project_created' => $project['project_created'],
            'workspace' => [
                'name' => $project['workspace_name'],
                'icon' => $project['workspace_icon'],
                'color' => $project['workspace_color']
            ],
            'task_counts' => [
                'total' => (int)$project['total_tasks'],
                'todo' => (int)$project['todo_tasks'],
                'in_progress' => (int)$project['in_progress_tasks'],
                'completed' => (int)$project['completed_tasks'],
                'overdue' => (int)$project['overdue_tasks']
            ],
            'priority_distribution' => [
                'high' => (int)$project['high_priority_tasks'],
                'medium' => (int)$project['medium_priority_tasks'],
                'low' => (int)$project['low_priority_tasks']
            ],
            'metrics' => [
                'completion_rate' => $completionRate,
                'avg_completion_days' => $project['avg_completion_days'] ? 
                    round((float)$project['avg_completion_days'], 1) : null
            ]
        ];
    }
    
    $response['data']['projects'] = $projectStats;
    
    // 2. Task Timeline (for specific project)
    if ($projectId) {
        $timelineSQL = "
            SELECT 
                DATE(t.created_at) as date,
                COUNT(*) as tasks_created,
                SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as tasks_completed,
                SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as tasks_in_progress
            FROM tasks t
            WHERE t.project_id = :project_id 
            AND t.created_at >= DATE_SUB(CURDATE(), INTERVAL :days DAY)
            GROUP BY DATE(t.created_at)
            ORDER BY date ASC
        ";
        
        $stmt = $pdo->prepare($timelineSQL);
        $stmt->execute([':project_id' => $projectId, ':days' => $days]);
        $timeline = $stmt->fetchAll();
        
        $response['data']['timeline'] = $timeline;
        
        // 3. Task Details for specific project
        $tasksSQL = "
            SELECT 
                t.id,
                t.title,
                t.description,
                t.status,
                t.priority,
                t.due_date,
                t.created_at,
                t.updated_at,
                CASE 
                    WHEN t.due_date < CURDATE() AND t.status != 'done' THEN true
                    ELSE false
                END as is_overdue,
                CASE 
                    WHEN t.status = 'done' THEN DATEDIFF(t.updated_at, t.created_at)
                    ELSE NULL
                END as completion_days
            FROM tasks t
            WHERE t.project_id = :project_id
            ORDER BY 
                CASE t.status 
                    WHEN 'in_progress' THEN 1 
                    WHEN 'todo' THEN 2 
                    WHEN 'done' THEN 3 
                END,
                CASE t.priority 
                    WHEN 'high' THEN 1 
                    WHEN 'medium' THEN 2 
                    WHEN 'low' THEN 3 
                END,
                t.due_date ASC
        ";
        
        $stmt = $pdo->prepare($tasksSQL);
        $stmt->execute([':project_id' => $projectId]);
        $tasks = $stmt->fetchAll();
        
        $response['data']['tasks'] = array_map(function($task) {
            return [
                'id' => (int)$task['id'],
                'title' => $task['title'],
                'description' => $task['description'],
                'status' => $task['status'],
                'priority' => $task['priority'],
                'due_date' => $task['due_date'],
                'created_at' => $task['created_at'],
                'updated_at' => $task['updated_at'],
                'is_overdue' => (bool)$task['is_overdue'],
                'completion_days' => $task['completion_days'] ? (int)$task['completion_days'] : null
            ];
        }, $tasks);
        
        // 4. Activity Log for specific project
        $activitySQL = "
            SELECT 
                tal.action_type,
                tal.old_value,
                tal.new_value,
                tal.field_changed,
                tal.created_at,
                t.title as task_title
            FROM task_activity_log tal
            LEFT JOIN tasks t ON tal.task_id = t.id
            WHERE t.project_id = :project_id
            AND tal.created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
            ORDER BY tal.created_at DESC
            LIMIT 20
        ";
        
        $stmt = $pdo->prepare($activitySQL);
        $stmt->execute([':project_id' => $projectId, ':days' => $days]);
        $activities = $stmt->fetchAll();
        
        $response['data']['activity_log'] = $activities;
    }
    
    // 5. Comparison Data (if multiple projects)
    if (!$projectId && count($projectStats) > 1) {
        $comparisonData = [
            'completion_rates' => [],
            'task_counts' => [],
            'priority_distributions' => []
        ];
        
        foreach ($projectStats as $project) {
            $comparisonData['completion_rates'][] = [
                'project_name' => $project['name'],
                'completion_rate' => $project['metrics']['completion_rate']
            ];
            
            $comparisonData['task_counts'][] = [
                'project_name' => $project['name'],
                'total_tasks' => $project['task_counts']['total'],
                'completed_tasks' => $project['task_counts']['completed']
            ];
            
            $comparisonData['priority_distributions'][] = [
                'project_name' => $project['name'],
                'high' => $project['priority_distribution']['high'],
                'medium' => $project['priority_distribution']['medium'],
                'low' => $project['priority_distribution']['low']
            ];
        }
        
        $response['data']['comparison'] = $comparisonData;
    }
    
    echo json_encode($response);
    
} catch (Exception $e) {
    echo jsonResponse(false, 'Error retrieving project statistics: ' . $e->getMessage(), [], 500);
}
?>
