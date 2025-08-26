<?php
/**
 * Get Workspaces API Endpoint
 * Returns all workspaces for the current user
 */

// Headers are set in php-utils.php

// Include required files
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../../utils/php-utils.php';

// Start session to get user ID
safeSessionStart();

try {
    // Get database connection
    $pdo = getDBConnection();

    // Get current user ID from session
    $userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
    
    if (!$userId) {
        echo jsonResponse(false, 'User not authenticated', [], 401);
        exit;
    }

    // Get workspaces for the current user (owned or shared)
    $sql = "SELECT DISTINCT
                w.id,
                w.name,
                w.description,
                w.color,
                w.icon,
                w.is_default,
                w.created_at,
                w.updated_at,
                wm.role as user_role
            FROM workspaces w
            INNER JOIN workspace_members wm ON w.id = wm.workspace_id
            WHERE wm.user_id = ?
            ORDER BY w.is_default DESC, w.created_at ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$userId]);
    $workspaces = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format workspaces for frontend
    $formattedWorkspaces = [];
    foreach ($workspaces as $workspace) {
        $formattedWorkspaces[] = [
            'id' => (int)$workspace['id'],
            'name' => $workspace['name'],
            'description' => $workspace['description'],
            'color' => $workspace['color'],
            'icon' => $workspace['icon'],
            'is_default' => (bool)$workspace['is_default'],
            'user_role' => $workspace['user_role'],
            'created_at' => $workspace['created_at'],
            'updated_at' => $workspace['updated_at']
        ];
    }

    echo jsonResponse(true, 'Workspaces loaded successfully', [
        'workspaces' => $formattedWorkspaces,
        'total_count' => count($formattedWorkspaces)
    ]);

} catch (Exception $e) {
    echo jsonResponse(false, 'Error loading workspaces: ' . $e->getMessage(), [], 500);
}
?>
