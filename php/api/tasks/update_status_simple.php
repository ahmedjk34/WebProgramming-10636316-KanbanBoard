<?php
// Simple version for debugging
error_reporting(E_ERROR | E_PARSE);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

try {
    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        echo json_encode(['success' => false, 'message' => 'No JSON data received']);
        exit();
    }
    
    if (empty($input['task_id']) || empty($input['status'])) {
        echo json_encode(['success' => false, 'message' => 'task_id and status required']);
        exit();
    }
    
    // Include database config
    require_once '../../config/database.php';
    
    // Get database connection
    $pdo = getDBConnection();
    
    $taskId = (int)$input['task_id'];
    $newStatus = $input['status'];
    
    // Validate status
    $validStatuses = ['todo', 'in_progress', 'done'];
    if (!in_array($newStatus, $validStatuses)) {
        echo json_encode(['success' => false, 'message' => 'Invalid status']);
        exit();
    }
    
    // Simple update without position management
    $stmt = $pdo->prepare("UPDATE tasks SET status = :status, updated_at = NOW() WHERE id = :id");
    $result = $stmt->execute([
        ':status' => $newStatus,
        ':id' => $taskId
    ]);
    
    if ($result) {
        echo json_encode([
            'success' => true, 
            'message' => 'Task status updated successfully',
            'task_id' => $taskId,
            'new_status' => $newStatus
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update task']);
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>
