<?php
/**
 * AI Task Planner
 * Kanban Board Project - Web Programming 10636316
 * 
 * Processes AI-generated task plans and integrates them with the database
 */

require_once __DIR__ . '/groq-api.php';
require_once __DIR__ . '/../php/config/database.php';
require_once __DIR__ . '/php-utils.php';

class TaskPlanner {
    private $groq;
    private $pdo;

    public function __construct() {
        $this->groq = new GroqAPI();
        $this->pdo = getDBConnection();
    }

    /**
     * Process user plan and create project with tasks
     * @param string $userPlan User's daily plan description
     * @param int $workspaceId Optional workspace ID override
     * @return array Result with project and task IDs
     */
    public function processUserPlan($userPlan, $workspaceId = null) {
        try {
            // Step 1: Generate AI plan
            $aiPlan = $this->groq->generateTaskPlan($userPlan);
            
            // Step 2: Validate AI response
            $this->validateAIPlan($aiPlan);
            
            // Step 3: Determine workspace
            $finalWorkspaceId = $workspaceId ?? $this->determineWorkspace($aiPlan['project']['workspace_id']);
            
            // Step 4: Create project in database
            $projectId = $this->createProject($aiPlan['project'], $finalWorkspaceId);
            
            // Step 5: Create tasks in database
            $taskIds = $this->createTasks($aiPlan['tasks'], $projectId);
            
            return [
                'success' => true,
                'message' => 'Task plan created successfully',
                'data' => [
                    'project_id' => $projectId,
                    'task_ids' => $taskIds,
                    'project_name' => $aiPlan['project']['name'],
                    'tasks_count' => count($taskIds),
                    'workspace_id' => $finalWorkspaceId,
                    'ai_plan' => $aiPlan
                ]
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to process task plan',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Validate AI-generated plan structure
     * @param array $aiPlan AI response data
     * @throws Exception If validation fails
     */
    private function validateAIPlan($aiPlan) {
        if (!is_array($aiPlan)) {
            throw new Exception('AI response is not a valid array');
        }

        if (!isset($aiPlan['project']) || !isset($aiPlan['tasks'])) {
            throw new Exception('AI response missing required project or tasks data');
        }

        $project = $aiPlan['project'];
        if (!isset($project['name']) || !isset($project['workspace_id'])) {
            throw new Exception('Project data missing required fields (name, workspace_id)');
        }

        if (!is_array($aiPlan['tasks'])) {
            throw new Exception('Tasks data is not a valid array');
        }

        foreach ($aiPlan['tasks'] as $index => $task) {
            if (!isset($task['title']) || !isset($task['priority']) || !isset($task['status'])) {
                throw new Exception("Task {$index} missing required fields (title, priority, status)");
            }

            if (!in_array($task['priority'], ['low', 'medium', 'high'])) {
                throw new Exception("Task {$index} has invalid priority: {$task['priority']}");
            }

            if (!in_array($task['status'], ['todo', 'in_progress', 'done'])) {
                throw new Exception("Task {$index} has invalid status: {$task['status']}");
            }
        }
    }

    /**
     * Determine appropriate workspace based on AI suggestion
     * @param int $suggestedWorkspaceId AI-suggested workspace ID
     * @return int Final workspace ID
     */
    private function determineWorkspace($suggestedWorkspaceId) {
        // Get current user ID from session
        $userId = $_SESSION['user_id'] ?? 1;
        
        // Map AI suggestions to workspace types
        $workspaceTypes = [
            1 => 'Personal Workspace',
            2 => 'Work Workspace', 
            3 => 'Creative Projects'
        ];
        
        $targetType = $workspaceTypes[$suggestedWorkspaceId] ?? 'Personal Workspace';
        
        // Find the user's workspace of this type
        $stmt = $this->pdo->prepare("
            SELECT id FROM workspaces 
            WHERE owner_id = ? AND name = ?
        ");
        $stmt->execute([$userId, $targetType]);
        $workspace = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($workspace) {
            return $workspace['id'];
        }
        
        // Fallback: get the user's first workspace
        $stmt = $this->pdo->prepare("
            SELECT id FROM workspaces 
            WHERE owner_id = ? 
            ORDER BY is_default DESC, id ASC 
            LIMIT 1
        ");
        $stmt->execute([$userId]);
        $fallbackWorkspace = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($fallbackWorkspace) {
            return $fallbackWorkspace['id'];
        }
        
        // Last resort: return the original suggestion
        return $suggestedWorkspaceId;
    }

    /**
     * Create project in database
     * @param array $projectData Project information from AI
     * @param int $workspaceId Workspace ID
     * @return int Created project ID
     */
    private function createProject($projectData, $workspaceId) {
        // Get current user ID from session
        $userId = $_SESSION['user_id'] ?? 1; // Default to user ID 1 if not set
        
        $sql = "INSERT INTO projects (workspace_id, name, description, color, status, created_by, created_at) 
                VALUES (?, ?, ?, ?, 'active', ?, NOW())";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([
            $workspaceId,
            sanitizeAndValidate($projectData['name'], 'string'),
            sanitizeAndValidate($projectData['description'] ?? '', 'string'),
            sanitizeAndValidate($projectData['color'] ?? '#4facfe', 'string'),
            $userId
        ]);
        
        return $this->pdo->lastInsertId();
    }

    /**
     * Create tasks in database
     * @param array $tasksData Tasks information from AI
     * @param int $projectId Project ID
     * @return array Array of created task IDs
     */
    private function createTasks($tasksData, $projectId) {
        $taskIds = [];
        $position = 1;
        
        // Get current user ID from session
        $userId = $_SESSION['user_id'] ?? 1; // Default to user ID 1 if not set
        
        $sql = "INSERT INTO tasks (project_id, title, description, status, priority, due_date, position, created_by, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())";
        
        $stmt = $this->pdo->prepare($sql);
        
        foreach ($tasksData as $taskData) {
            // Process due date
            $dueDate = null;
            if (isset($taskData['due_date']) && $taskData['due_date'] && $taskData['due_date'] !== 'null') {
                $dueDate = $this->validateDate($taskData['due_date']);
            }
            
            $stmt->execute([
                $projectId,
                sanitizeAndValidate($taskData['title'], 'string'),
                sanitizeAndValidate($taskData['description'] ?? '', 'string'),
                sanitizeAndValidate($taskData['status'], 'string'),
                sanitizeAndValidate($taskData['priority'], 'string'),
                $dueDate,
                $position++,
                $userId
            ]);
            
            $taskIds[] = $this->pdo->lastInsertId();
        }
        
        return $taskIds;
    }

    /**
     * Validate and format date
     * @param string $date Date string
     * @return string|null Formatted date or null
     */
    private function validateDate($date) {
        if (empty($date) || $date === 'null') {
            return null;
        }
        
        $timestamp = strtotime($date);
        if ($timestamp === false) {
            return null;
        }
        
        return date('Y-m-d', $timestamp);
    }

    /**
     * Get available workspaces for task planning
     * @return array Available workspaces
     */
    public function getAvailableWorkspaces() {
        $sql = "SELECT id, name, description, icon, color FROM workspaces WHERE is_default = TRUE ORDER BY id";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get recent task plans (projects created today)
     * @return array Recent projects
     */
    public function getRecentTaskPlans() {
        $sql = "SELECT p.id, p.name, p.description, p.color, p.created_at, w.name as workspace_name,
                       COUNT(t.id) as task_count
                FROM projects p
                LEFT JOIN workspaces w ON p.workspace_id = w.id
                LEFT JOIN tasks t ON p.id = t.project_id
                WHERE DATE(p.created_at) = CURDATE() AND p.name LIKE 'Today''s Tasks%'
                GROUP BY p.id
                ORDER BY p.created_at DESC";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>
