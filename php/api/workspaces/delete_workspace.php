<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../../config/database.php';
require_once '../../includes/functions.php';

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    // Validate required fields
    $workspaceId = $input['id'] ?? null;
    
    if (!$workspaceId) {
        throw new Exception('Workspace ID is required');
    }
    
    // Connect to database
    $pdo = getConnection();
    
    // Check if workspace exists
    $stmt = $pdo->prepare("SELECT id, name FROM workspaces WHERE id = ?");
    $stmt->execute([$workspaceId]);
    $workspace = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$workspace) {
        throw new Exception('Workspace not found');
    }
    
    // Start transaction
    $pdo->beginTransaction();
    
    try {
        // Delete related records first (foreign key constraints)
        // Delete workspace members
        $stmt = $pdo->prepare("DELETE FROM workspace_members WHERE workspace_id = ?");
        $stmt->execute([$workspaceId]);
        
        // Delete team workspaces
        $stmt = $pdo->prepare("DELETE FROM team_workspaces WHERE workspace_id = ?");
        $stmt->execute([$workspaceId]);
        
        // Delete team projects
        $stmt = $pdo->prepare("DELETE FROM team_projects WHERE workspace_id = ?");
        $stmt->execute([$workspaceId]);
        
        // Delete projects in this workspace
        $stmt = $pdo->prepare("DELETE FROM projects WHERE workspace_id = ?");
        $stmt->execute([$workspaceId]);
        
        // Finally delete the workspace
        $stmt = $pdo->prepare("DELETE FROM workspaces WHERE id = ?");
        $result = $stmt->execute([$workspaceId]);
        
        if (!$result) {
            throw new Exception('Failed to delete workspace');
        }
        
        // Commit transaction
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Workspace deleted successfully',
            'data' => [
                'deleted_workspace' => $workspace
            ]
        ]);
        
    } catch (Exception $e) {
        // Rollback transaction on error
        $pdo->rollBack();
        throw $e;
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>

