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
    $name = $input['name'] ?? '';
    $description = $input['description'] ?? '';
    $icon = $input['icon'] ?? '🏢';
    $color = $input['color'] ?? '#667eea';
    
    if (!$workspaceId) {
        throw new Exception('Workspace ID is required');
    }
    
    if (empty($name)) {
        throw new Exception('Workspace name is required');
    }
    
    // Sanitize inputs
    $name = sanitizeAndValidate($name, 'text', 100);
    $description = sanitizeAndValidate($description, 'text', 500);
    $icon = sanitizeAndValidate($icon, 'text', 10);
    $color = sanitizeAndValidate($color, 'text', 7);
    
    // Connect to database
    $pdo = getConnection();
    
    // Check if workspace exists
    $stmt = $pdo->prepare("SELECT id FROM workspaces WHERE id = ?");
    $stmt->execute([$workspaceId]);
    
    if (!$stmt->fetch()) {
        throw new Exception('Workspace not found');
    }
    
    // Update workspace
    $stmt = $pdo->prepare("
        UPDATE workspaces 
        SET name = ?, description = ?, icon = ?, color = ?, updated_at = NOW()
        WHERE id = ?
    ");
    
    $result = $stmt->execute([$name, $description, $icon, $color, $workspaceId]);
    
    if (!$result) {
        throw new Exception('Failed to update workspace');
    }
    
    // Get updated workspace data
    $stmt = $pdo->prepare("
        SELECT id, name, description, icon, color, workspace_type, created_at, updated_at
        FROM workspaces 
        WHERE id = ?
    ");
    $stmt->execute([$workspaceId]);
    $workspace = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'message' => 'Workspace updated successfully',
        'data' => [
            'workspace' => $workspace
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>

