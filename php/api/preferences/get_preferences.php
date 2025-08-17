<?php
/**
 * Get User Preferences API
 * Returns user preferences for views and settings
 */

error_reporting(E_ERROR | E_PARSE);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../../utils/php-utils.php';

header('Content-Type: application/json');

try {
    $pdo = getDBConnection();
    
    // Get parameters
    $userId = isset($_GET['user_id']) ? sanitizeAndValidate($_GET['user_id'], 'int') : 1;
    $workspaceId = isset($_GET['workspace_id']) ? sanitizeAndValidate($_GET['workspace_id'], 'int') : null;
    $preferenceKey = isset($_GET['preference_key']) ? sanitizeAndValidate($_GET['preference_key'], 'string') : null;
    
    $response = [
        'success' => true,
        'message' => 'Preferences retrieved successfully',
        'data' => [],
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    // Build filters
    $filters = ['user_id = :user_id'];
    $params = [':user_id' => $userId];
    
    if ($workspaceId) {
        $filters[] = '(workspace_id = :workspace_id OR workspace_id IS NULL)';
        $params[':workspace_id'] = $workspaceId;
    }
    
    if ($preferenceKey) {
        $filters[] = 'preference_key = :preference_key';
        $params[':preference_key'] = $preferenceKey;
    }
    
    $whereClause = 'WHERE ' . implode(' AND ', $filters);
    
    // Get preferences
    $preferencesSQL = "
        SELECT 
            id,
            preference_key,
            preference_value,
            workspace_id,
            created_at,
            updated_at
        FROM user_preferences
        $whereClause
        ORDER BY 
            CASE WHEN workspace_id IS NULL THEN 0 ELSE 1 END,
            workspace_id,
            preference_key
    ";
    
    $stmt = $pdo->prepare($preferencesSQL);
    $stmt->execute($params);
    $preferences = $stmt->fetchAll();
    
    // Format preferences
    $formattedPreferences = [];
    $globalPreferences = [];
    $workspacePreferences = [];
    
    foreach ($preferences as $pref) {
        $preference = [
            'id' => (int)$pref['id'],
            'key' => $pref['preference_key'],
            'value' => $pref['preference_value'],
            'workspace_id' => $pref['workspace_id'] ? (int)$pref['workspace_id'] : null,
            'created_at' => $pref['created_at'],
            'updated_at' => $pref['updated_at']
        ];
        
        $formattedPreferences[] = $preference;
        
        if ($pref['workspace_id']) {
            if (!isset($workspacePreferences[$pref['workspace_id']])) {
                $workspacePreferences[$pref['workspace_id']] = [];
            }
            $workspacePreferences[$pref['workspace_id']][$pref['preference_key']] = $pref['preference_value'];
        } else {
            $globalPreferences[$pref['preference_key']] = $pref['preference_value'];
        }
    }
    
    $response['data']['preferences'] = $formattedPreferences;
    $response['data']['global'] = $globalPreferences;
    $response['data']['workspace_specific'] = $workspacePreferences;
    
    // Get default preferences if none exist
    if (empty($preferences)) {
        $defaultPreferences = [
            'default_view' => 'kanban',
            'theme' => 'light',
            'analytics_refresh_interval' => '30',
            'show_completed_tasks' => 'true',
            'calendar_view_type' => 'month',
            'task_sort_order' => 'priority',
            'show_task_descriptions' => 'true',
            'auto_refresh_enabled' => 'false',
            'notifications_enabled' => 'true',
            'compact_view' => 'false'
        ];
        
        $response['data']['defaults'] = $defaultPreferences;
        $response['message'] = 'No preferences found, returning defaults';
    }
    
    // Get workspace information if workspace_id is provided
    if ($workspaceId) {
        $workspaceSQL = "
            SELECT id, name, icon, color
            FROM workspaces
            WHERE id = :workspace_id
        ";
        
        $stmt = $pdo->prepare($workspaceSQL);
        $stmt->execute([':workspace_id' => $workspaceId]);
        $workspace = $stmt->fetch();
        
        if ($workspace) {
            $response['data']['workspace'] = [
                'id' => (int)$workspace['id'],
                'name' => $workspace['name'],
                'icon' => $workspace['icon'],
                'color' => $workspace['color']
            ];
        }
    }
    
    // Get all available preference keys with descriptions
    $availablePreferences = [
        'default_view' => [
            'description' => 'Default board view type',
            'type' => 'select',
            'options' => ['kanban', 'calendar', 'timeline', 'list', 'card'],
            'default' => 'kanban'
        ],
        'theme' => [
            'description' => 'Application theme',
            'type' => 'select',
            'options' => ['light', 'dark', 'auto'],
            'default' => 'light'
        ],
        'analytics_refresh_interval' => [
            'description' => 'Analytics refresh interval in seconds',
            'type' => 'number',
            'min' => 10,
            'max' => 300,
            'default' => 30
        ],
        'show_completed_tasks' => [
            'description' => 'Show completed tasks in views',
            'type' => 'boolean',
            'default' => true
        ],
        'calendar_view_type' => [
            'description' => 'Calendar view type',
            'type' => 'select',
            'options' => ['month', 'week', 'day'],
            'default' => 'month'
        ],
        'task_sort_order' => [
            'description' => 'Default task sorting order',
            'type' => 'select',
            'options' => ['priority', 'due_date', 'created_date', 'alphabetical'],
            'default' => 'priority'
        ],
        'show_task_descriptions' => [
            'description' => 'Show task descriptions in card view',
            'type' => 'boolean',
            'default' => true
        ],
        'auto_refresh_enabled' => [
            'description' => 'Enable automatic data refresh',
            'type' => 'boolean',
            'default' => false
        ],
        'notifications_enabled' => [
            'description' => 'Enable notifications',
            'type' => 'boolean',
            'default' => true
        ],
        'compact_view' => [
            'description' => 'Use compact view for tasks',
            'type' => 'boolean',
            'default' => false
        ]
    ];
    
    $response['data']['available_preferences'] = $availablePreferences;
    
    // Get preference statistics
    $statsSQL = "
        SELECT 
            COUNT(*) as total_preferences,
            COUNT(DISTINCT preference_key) as unique_keys,
            COUNT(DISTINCT workspace_id) as workspaces_with_preferences
        FROM user_preferences
        WHERE user_id = :user_id
    ";
    
    $stmt = $pdo->prepare($statsSQL);
    $stmt->execute([':user_id' => $userId]);
    $stats = $stmt->fetch();
    
    $response['data']['statistics'] = [
        'total_preferences' => (int)$stats['total_preferences'],
        'unique_keys' => (int)$stats['unique_keys'],
        'workspaces_with_preferences' => (int)$stats['workspaces_with_preferences']
    ];
    
    echo json_encode($response);
    
} catch (Exception $e) {
    echo jsonResponse(false, 'Error retrieving preferences: ' . $e->getMessage(), [], 500);
}
?>
