<?php
/**
 * Analytics Overview API
 * Returns comprehensive analytics data for dashboard
 */

error_reporting(E_ERROR | E_PARSE);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../../utils/php-utils.php';

header('Content-Type: application/json');

try {
    $pdo = getDBConnection();
    
    // Get parameters
    $workspaceId = isset($_GET['workspace_id']) ? sanitizeAndValidate($_GET['workspace_id'], 'int') : null;
    $days = isset($_GET['days']) ? sanitizeAndValidate($_GET['days'], 'int') : 30;
    $days = min(max($days, 1), 365); // Limit between 1 and 365 days
    
    $response = [
        'success' => true,
        'message' => 'Analytics data retrieved successfully',
        'data' => [],
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    // Build workspace filter
    $workspaceFilter = '';
    $params = [':days' => $days];
    
    if ($workspaceId) {
        $workspaceFilter = ' AND p.workspace_id = :workspace_id';
        $params[':workspace_id'] = $workspaceId;
    }
    
    // 1. Overall Statistics
    $overallSQL = "
        SELECT 
            COUNT(t.id) as total_tasks,
            SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) as todo_tasks,
            SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
            SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as completed_tasks,
            SUM(CASE WHEN t.due_date < CURDATE() AND t.status != 'done' THEN 1 ELSE 0 END) as overdue_tasks,
            COUNT(DISTINCT p.id) as total_projects,
            COUNT(DISTINCT p.workspace_id) as total_workspaces
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.created_at >= DATE_SUB(CURDATE(), INTERVAL :days DAY)
        $workspaceFilter
    ";
    
    $stmt = $pdo->prepare($overallSQL);
    $stmt->execute($params);
    $overall = $stmt->fetch();
    
    // Calculate completion rate
    $completionRate = $overall['total_tasks'] > 0 ? 
        round(($overall['completed_tasks'] / $overall['total_tasks']) * 100, 2) : 0;
    
    $response['data']['overall'] = [
        'total_tasks' => (int)$overall['total_tasks'],
        'todo_tasks' => (int)$overall['todo_tasks'],
        'in_progress_tasks' => (int)$overall['in_progress_tasks'],
        'completed_tasks' => (int)$overall['completed_tasks'],
        'overdue_tasks' => (int)$overall['overdue_tasks'],
        'completion_rate' => $completionRate,
        'total_projects' => (int)$overall['total_projects'],
        'total_workspaces' => (int)$overall['total_workspaces']
    ];
    
    // 2. Daily Activity (for charts)
    $dailySQL = "
        SELECT 
            DATE(t.created_at) as date,
            COUNT(*) as tasks_created,
            SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as tasks_completed
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.created_at >= DATE_SUB(CURDATE(), INTERVAL :days DAY)
        $workspaceFilter
        GROUP BY DATE(t.created_at)
        ORDER BY date ASC
    ";
    
    $stmt = $pdo->prepare($dailySQL);
    $stmt->execute($params);
    $dailyActivity = $stmt->fetchAll();
    
    $response['data']['daily_activity'] = $dailyActivity;
    
    // 3. Project Statistics
    $projectSQL = "
        SELECT 
            p.id,
            p.name,
            p.color,
            w.name as workspace_name,
            w.icon as workspace_icon,
            COUNT(t.id) as total_tasks,
            SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as completed_tasks,
            SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
            SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) as todo_tasks,
            ROUND(
                (SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) / NULLIF(COUNT(t.id), 0)) * 100, 2
            ) as completion_percentage
        FROM projects p
        LEFT JOIN tasks t ON p.id = t.project_id
        LEFT JOIN workspaces w ON p.workspace_id = w.id
        WHERE 1=1 $workspaceFilter
        GROUP BY p.id, p.name, p.color, w.name, w.icon
        HAVING total_tasks > 0
        ORDER BY completion_percentage DESC, total_tasks DESC
    ";
    
    $stmt = $pdo->prepare($projectSQL);
    $stmt->execute($workspaceId ? [':workspace_id' => $workspaceId] : []);
    $projects = $stmt->fetchAll();
    
    $response['data']['projects'] = array_map(function($project) {
        return [
            'id' => (int)$project['id'],
            'name' => $project['name'],
            'color' => $project['color'],
            'workspace_name' => $project['workspace_name'],
            'workspace_icon' => $project['workspace_icon'],
            'total_tasks' => (int)$project['total_tasks'],
            'completed_tasks' => (int)$project['completed_tasks'],
            'in_progress_tasks' => (int)$project['in_progress_tasks'],
            'todo_tasks' => (int)$project['todo_tasks'],
            'completion_percentage' => (float)$project['completion_percentage']
        ];
    }, $projects);
    
    // 4. Priority Distribution
    $prioritySQL = "
        SELECT 
            t.priority,
            COUNT(*) as count,
            SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as completed
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.created_at >= DATE_SUB(CURDATE(), INTERVAL :days DAY)
        $workspaceFilter
        GROUP BY t.priority
        ORDER BY 
            CASE t.priority 
                WHEN 'high' THEN 1 
                WHEN 'medium' THEN 2 
                WHEN 'low' THEN 3 
            END
    ";
    
    $stmt = $pdo->prepare($prioritySQL);
    $stmt->execute($params);
    $priorities = $stmt->fetchAll();
    
    $response['data']['priority_distribution'] = array_map(function($priority) {
        $completionRate = $priority['count'] > 0 ? 
            round(($priority['completed'] / $priority['count']) * 100, 2) : 0;
        return [
            'priority' => $priority['priority'],
            'count' => (int)$priority['count'],
            'completed' => (int)$priority['completed'],
            'completion_rate' => $completionRate
        ];
    }, $priorities);
    
    // 5. Recent Activity (last 10 activities)
    $activitySQL = "
        SELECT 
            tal.action_type,
            tal.created_at,
            t.title as task_title,
            p.name as project_name,
            w.name as workspace_name
        FROM task_activity_log tal
        LEFT JOIN tasks t ON tal.task_id = t.id
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN workspaces w ON p.workspace_id = w.id
        WHERE tal.created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
        $workspaceFilter
        ORDER BY tal.created_at DESC
        LIMIT 10
    ";
    
    $stmt = $pdo->prepare($activitySQL);
    $stmt->execute($params);
    $activities = $stmt->fetchAll();
    
    $response['data']['recent_activity'] = $activities;
    
    // 6. Productivity Metrics
    $productivitySQL = "
        SELECT 
            DAYNAME(t.created_at) as day_name,
            DAYOFWEEK(t.created_at) as day_number,
            COUNT(*) as tasks_created,
            SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as tasks_completed
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.created_at >= DATE_SUB(CURDATE(), INTERVAL :days DAY)
        $workspaceFilter
        GROUP BY DAYOFWEEK(t.created_at), DAYNAME(t.created_at)
        ORDER BY day_number
    ";
    
    $stmt = $pdo->prepare($productivitySQL);
    $stmt->execute($params);
    $productivity = $stmt->fetchAll();
    
    $response['data']['productivity_by_day'] = $productivity;
    
    // 7. Workspace Statistics (if not filtered by workspace)
    if (!$workspaceId) {
        $workspaceSQL = "
            SELECT 
                w.id,
                w.name,
                w.icon,
                w.color,
                COUNT(t.id) as total_tasks,
                SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as completed_tasks,
                COUNT(DISTINCT p.id) as total_projects
            FROM workspaces w
            LEFT JOIN projects p ON w.id = p.workspace_id
            LEFT JOIN tasks t ON p.id = t.project_id
            GROUP BY w.id, w.name, w.icon, w.color
            ORDER BY total_tasks DESC
        ";
        
        $stmt = $pdo->prepare($workspaceSQL);
        $stmt->execute();
        $workspaces = $stmt->fetchAll();
        
        $response['data']['workspaces'] = array_map(function($workspace) {
            $completionRate = $workspace['total_tasks'] > 0 ? 
                round(($workspace['completed_tasks'] / $workspace['total_tasks']) * 100, 2) : 0;
            return [
                'id' => (int)$workspace['id'],
                'name' => $workspace['name'],
                'icon' => $workspace['icon'],
                'color' => $workspace['color'],
                'total_tasks' => (int)$workspace['total_tasks'],
                'completed_tasks' => (int)$workspace['completed_tasks'],
                'total_projects' => (int)$workspace['total_projects'],
                'completion_rate' => $completionRate
            ];
        }, $workspaces);
    }
    
    echo json_encode($response);
    
} catch (Exception $e) {
    echo jsonResponse(false, 'Error retrieving analytics data: ' . $e->getMessage(), [], 500);
}
?>
