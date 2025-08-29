<?php
/**
 * Create Workspace API Endpoint
 * Creates a new workspace in the database
 */

// Headers are set in php-utils.php

// Include required files
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../../utils/php-utils.php';
require_once __DIR__ . '/../includes/auth_middleware.php';

// Only allow POST requests
checkRequestMethod('POST');

// Require authentication
$currentUser = requireAuth();

try {
    // Get JSON input
    $input = getJsonInput();
    
    // Validate required fields
    if (empty($input['name'])) {
        echo jsonResponse(false, 'Workspace name is required', [], 400);
        exit;
    }
    
    // Sanitize and validate input
    $workspaceData = [
        'name' => sanitizeInput($input['name']),
        'description' => sanitizeInput($input['description'] ?? ''),
        'icon' => sanitizeInput($input['icon'] ?? '🏢'),
        'color' => sanitizeInput($input['color'] ?? '#667eea'),
        'is_default' => false
    ];
    
    // Validate workspace data
    $validation = validateWorkspaceData($workspaceData);
    if (!$validation['valid']) {
        echo jsonResponse(false, $validation['message'], [], 400);
        exit;
    }
    
    // Connect to database
    $pdo = getDBConnection();
    
    // Check if workspace name already exists
    $checkStmt = $pdo->prepare("SELECT id FROM workspaces WHERE name = ?");
    $checkStmt->execute([$workspaceData['name']]);
    
    if ($checkStmt->fetch()) {
        echo jsonResponse(false, 'Workspace name already exists', [], 409);
        exit;
    }
    
    // Insert new workspace
    $stmt = $pdo->prepare("
        INSERT INTO workspaces (name, description, icon, color, is_default, owner_id, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");
    
    $success = $stmt->execute([
        $workspaceData['name'],
        $workspaceData['description'],
        $workspaceData['icon'],
        $workspaceData['color'],
        $workspaceData['is_default'],
        $currentUser['id']
    ]);
    
    if ($success) {
        $workspaceId = $pdo->lastInsertId();
        
        // Get the created workspace
        $getStmt = $pdo->prepare("SELECT * FROM workspaces WHERE id = ?");
        $getStmt->execute([$workspaceId]);
        $workspace = $getStmt->fetch(PDO::FETCH_ASSOC);
        
        // Format the workspace data
        $formattedWorkspace = [
            'id' => (int)$workspace['id'],
            'name' => $workspace['name'],
            'description' => $workspace['description'],
            'icon' => $workspace['icon'],
            'color' => $workspace['color'],
            'is_default' => (bool)$workspace['is_default'],
            'created_at' => $workspace['created_at'],
            'updated_at' => $workspace['updated_at']
        ];
        
        echo jsonResponse(true, 'Workspace created successfully', [
            'workspace' => $formattedWorkspace
        ], 201);
        
    } else {
        throw new Exception('Failed to create workspace');
    }
    
} catch (Exception $e) {
    echo jsonResponse(false, 'Error creating workspace: ' . $e->getMessage(), [], 500);
}
?>
