<?php
/**
 * Delete Project API Endpoint
 * Kanban Board Project - Web Programming 10636316
 * 
 * Deletes a project and all its tasks from the database
 * Method: DELETE
 * Required: id (in URL parameter or JSON body)
 */

// Set headers for JSON response and CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow DELETE requests
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo jsonResponse(false, 'Method not allowed. Use DELETE.');
    exit();
}

// Include required files
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/security.php';

try {
    // Get database connection
    $pdo = getDBConnection();
    
    // Get project ID from URL parameter or JSON body
    $projectId = null;
    
    // Try URL parameter first
    if (isset($_GET['id'])) {
        $projectId = sanitizeAndValidate($_GET['id'], 'int');
    } else {
        // Try JSON body
        $input = json_decode(file_get_contents('php://input'), true);
        if (isset($input['id'])) {
            $projectId = sanitizeAndValidate($input['id'], 'int');
        }
    }
    
    // Validate project ID
    if ($projectId === null || $projectId === false) {
        http_response_code(400);
        echo jsonResponse(false, 'Valid project ID is required');
        exit();
    }
    
    // Check if project exists and get its details before deletion
    $stmt = $pdo->prepare("
        SELECT 
            p.id,
            p.name,
            p.description,
            COUNT(t.id) as task_count
        FROM projects p
        LEFT JOIN tasks t ON p.id = t.project_id
        WHERE p.id = :id
        GROUP BY p.id, p.name, p.description
    ");
    
    $stmt->execute([':id' => $projectId]);
    $project = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$project) {
        http_response_code(404);
        echo jsonResponse(false, 'Project not found');
        exit();
    }
    
    // Check if this is the default project (prevent deletion)
    if ($project['name'] === 'Default Project' || $projectId == 1) {
        http_response_code(400);
        echo jsonResponse(false, 'Cannot delete the default project');
        exit();
    }
    
    // Store project info for logging
    $projectInfo = [
        'id' => $project['id'],
        'name' => $project['name'],
        'task_count' => $project['task_count']
    ];
    
    // Begin transaction for cascading deletion
    $pdo->beginTransaction();
    
    try {
        // If project has tasks, we need to handle them
        if ($project['task_count'] > 0) {
            // Option 1: Move tasks to default project (safer)
            // Get default project ID
            $stmt = $pdo->prepare("SELECT id FROM projects WHERE name = 'Default Project' OR id = 1 LIMIT 1");
            $stmt->execute();
            $defaultProject = $stmt->fetch();
            
            if ($defaultProject) {
                // Move all tasks to default project
                $stmt = $pdo->prepare("UPDATE tasks SET project_id = :default_id WHERE project_id = :project_id");
                $stmt->execute([
                    ':default_id' => $defaultProject['id'],
                    ':project_id' => $projectId
                ]);
                
                $movedTasks = $stmt->rowCount();
                $projectInfo['moved_tasks'] = $movedTasks;
                $projectInfo['moved_to_project'] = $defaultProject['id'];
            } else {
                // Option 2: Delete all tasks (if no default project exists)
                $stmt = $pdo->prepare("DELETE FROM tasks WHERE project_id = :project_id");
                $stmt->execute([':project_id' => $projectId]);
                
                $deletedTasks = $stmt->rowCount();
                $projectInfo['deleted_tasks'] = $deletedTasks;
            }
        }
        
        // Delete the project
        $stmt = $pdo->prepare("DELETE FROM projects WHERE id = :id");
        $stmt->execute([':id' => $projectId]);
        
        // Check if project was actually deleted
        if ($stmt->rowCount() === 0) {
            $pdo->rollBack();
            http_response_code(404);
            echo jsonResponse(false, 'Project not found or already deleted');
            exit();
        }
        
        // Commit transaction
        $pdo->commit();
        
        // Log the deletion
        debugLog("Project deleted", $projectInfo);
        
        // Return success response
        echo jsonResponse(true, 'Project deleted successfully', [
            'deleted_project' => $projectInfo
        ]);
        
    } catch (Exception $e) {
        // Rollback transaction on error
        $pdo->rollBack();
        throw $e;
    }
    
} catch (PDOException $e) {
    // Database error
    error_log("Database error in delete_project.php: " . $e->getMessage());
    http_response_code(500);
    echo jsonResponse(false, 'Database error occurred');
    
} catch (Exception $e) {
    // General error
    error_log("Error in delete_project.php: " . $e->getMessage());
    http_response_code(500);
    echo jsonResponse(false, 'An error occurred while deleting the project');
}
?>
