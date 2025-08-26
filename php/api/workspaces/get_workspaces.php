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

    // Get workspaces for the current user (personal and team)
    $sql = "SELECT DISTINCT
                w.id,
                w.name,
                w.description,
                w.color,
                w.icon,
                w.owner_id,
                w.team_id,
                w.is_default,
                w.is_shared,
                w.workspace_type,
                w.created_at,
                w.updated_at,
                wm.role as user_role,
                t.name as team_name,
                t.color as team_color
            FROM workspaces w
            LEFT JOIN workspace_members wm ON w.id = wm.workspace_id AND wm.user_id = ?
            LEFT JOIN teams t ON w.team_id = t.id
            WHERE (w.owner_id = ? OR wm.user_id = ?) 
               OR (w.team_id IS NOT NULL AND EXISTS (
                   SELECT 1 FROM team_members tm 
                   WHERE tm.team_id = w.team_id 
                   AND tm.user_id = ? 
                   AND tm.status = 'active'
               ))
            ORDER BY w.workspace_type DESC, w.is_default DESC, w.created_at ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$userId, $userId, $userId, $userId]);
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
            'owner_id' => (int)$workspace['owner_id'],
            'team_id' => $workspace['team_id'] ? (int)$workspace['team_id'] : null,
            'is_default' => (bool)$workspace['is_default'],
            'is_shared' => (bool)$workspace['is_shared'],
            'workspace_type' => $workspace['workspace_type'],
            'user_role' => $workspace['user_role'],
            'team_name' => $workspace['team_name'],
            'team_color' => $workspace['team_color'],
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
