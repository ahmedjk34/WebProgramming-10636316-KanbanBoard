<?php
/**
 * Get Workspaces API Endpoint
 * Returns all workspaces for the current user
 */

// Headers are set in php-utils.php

// Include required files
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../../utils/php-utils.php';

try {
    // Get database connection
    $pdo = getDBConnection();

    // Get all workspaces
    $sql = "SELECT
                id,
                name,
                description,
                color,
                icon,
                is_default,
                created_at,
                updated_at
            FROM workspaces
            ORDER BY is_default DESC, created_at ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
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
