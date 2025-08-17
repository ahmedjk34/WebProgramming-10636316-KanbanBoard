<?php
/**
 * Update User Preferences API
 * Updates or creates user preferences
 */

error_reporting(E_ERROR | E_PARSE);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../../utils/php-utils.php';

header('Content-Type: application/json');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo jsonResponse(false, 'Only POST requests are allowed', [], 405);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        echo jsonResponse(false, 'Invalid JSON input', [], 400);
        exit;
    }
    
    // Validate required fields
    if (!isset($input['preference_key']) || !isset($input['preference_value'])) {
        echo jsonResponse(false, 'preference_key and preference_value are required', [], 400);
        exit;
    }
    
    $userId = isset($input['user_id']) ? sanitizeAndValidate($input['user_id'], 'int') : 1;
    $preferenceKey = sanitizeAndValidate($input['preference_key'], 'string');
    $preferenceValue = sanitizeAndValidate($input['preference_value'], 'string');
    $workspaceId = isset($input['workspace_id']) ? sanitizeAndValidate($input['workspace_id'], 'int') : null;
    
    // Validate preference key
    $validPreferenceKeys = [
        'default_view', 'theme', 'analytics_refresh_interval', 'show_completed_tasks',
        'calendar_view_type', 'task_sort_order', 'show_task_descriptions',
        'auto_refresh_enabled', 'notifications_enabled', 'compact_view'
    ];
    
    if (!in_array($preferenceKey, $validPreferenceKeys)) {
        echo jsonResponse(false, 'Invalid preference key', ['valid_keys' => $validPreferenceKeys], 400);
        exit;
    }
    
    // Validate preference values based on key
    $validationResult = validatePreferenceValue($preferenceKey, $preferenceValue);
    if (!$validationResult['valid']) {
        echo jsonResponse(false, $validationResult['message'], [], 400);
        exit;
    }
    
    $response = [
        'success' => true,
        'message' => 'Preference updated successfully',
        'data' => [],
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    // Check if preference already exists
    if ($workspaceId) {
        $checkSQL = "
            SELECT id FROM user_preferences
            WHERE user_id = :user_id
            AND preference_key = :preference_key
            AND workspace_id = :workspace_id
        ";
        $checkParams = [
            ':user_id' => $userId,
            ':preference_key' => $preferenceKey,
            ':workspace_id' => $workspaceId
        ];
    } else {
        $checkSQL = "
            SELECT id FROM user_preferences
            WHERE user_id = :user_id
            AND preference_key = :preference_key
            AND workspace_id IS NULL
        ";
        $checkParams = [
            ':user_id' => $userId,
            ':preference_key' => $preferenceKey
        ];
    }

    $stmt = $pdo->prepare($checkSQL);
    $stmt->execute($checkParams);
    $existing = $stmt->fetch();
    
    if ($existing) {
        // Update existing preference
        $updateSQL = "
            UPDATE user_preferences 
            SET preference_value = :preference_value,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = :id
        ";
        
        $stmt = $pdo->prepare($updateSQL);
        $stmt->execute([
            ':preference_value' => $preferenceValue,
            ':id' => $existing['id']
        ]);
        
        $response['message'] = 'Preference updated successfully';
        $response['data']['action'] = 'updated';
        $response['data']['preference_id'] = (int)$existing['id'];
        
    } else {
        // Create new preference
        $insertSQL = "
            INSERT INTO user_preferences (user_id, preference_key, preference_value, workspace_id)
            VALUES (:user_id, :preference_key, :preference_value, :workspace_id)
        ";
        
        $stmt = $pdo->prepare($insertSQL);
        $stmt->execute([
            ':user_id' => $userId,
            ':preference_key' => $preferenceKey,
            ':preference_value' => $preferenceValue,
            ':workspace_id' => $workspaceId
        ]);
        
        $preferenceId = $pdo->lastInsertId();
        
        $response['message'] = 'Preference created successfully';
        $response['data']['action'] = 'created';
        $response['data']['preference_id'] = (int)$preferenceId;
    }
    
    // Return the updated preference
    if ($workspaceId) {
        $getUpdatedSQL = "
            SELECT
                id,
                preference_key,
                preference_value,
                workspace_id,
                created_at,
                updated_at
            FROM user_preferences
            WHERE user_id = :user_id
            AND preference_key = :preference_key
            AND workspace_id = :workspace_id
        ";
        $getParams = [
            ':user_id' => $userId,
            ':preference_key' => $preferenceKey,
            ':workspace_id' => $workspaceId
        ];
    } else {
        $getUpdatedSQL = "
            SELECT
                id,
                preference_key,
                preference_value,
                workspace_id,
                created_at,
                updated_at
            FROM user_preferences
            WHERE user_id = :user_id
            AND preference_key = :preference_key
            AND workspace_id IS NULL
        ";
        $getParams = [
            ':user_id' => $userId,
            ':preference_key' => $preferenceKey
        ];
    }

    $stmt = $pdo->prepare($getUpdatedSQL);
    $stmt->execute($getParams);
    $updatedPreference = $stmt->fetch();
    
    $response['data']['preference'] = [
        'id' => (int)$updatedPreference['id'],
        'key' => $updatedPreference['preference_key'],
        'value' => $updatedPreference['preference_value'],
        'workspace_id' => $updatedPreference['workspace_id'] ? (int)$updatedPreference['workspace_id'] : null,
        'created_at' => $updatedPreference['created_at'],
        'updated_at' => $updatedPreference['updated_at']
    ];
    
    echo json_encode($response);
    
} catch (Exception $e) {
    echo jsonResponse(false, 'Error updating preference: ' . $e->getMessage(), [], 500);
}

/**
 * Validate preference value based on preference key
 */
function validatePreferenceValue($key, $value) {
    switch ($key) {
        case 'default_view':
            $validViews = ['kanban', 'calendar', 'timeline', 'list', 'card'];
            if (!in_array($value, $validViews)) {
                return ['valid' => false, 'message' => 'Invalid view type. Must be one of: ' . implode(', ', $validViews)];
            }
            break;
            
        case 'theme':
            $validThemes = ['light', 'dark', 'auto'];
            if (!in_array($value, $validThemes)) {
                return ['valid' => false, 'message' => 'Invalid theme. Must be one of: ' . implode(', ', $validThemes)];
            }
            break;
            
        case 'analytics_refresh_interval':
            $interval = (int)$value;
            if ($interval < 10 || $interval > 300) {
                return ['valid' => false, 'message' => 'Refresh interval must be between 10 and 300 seconds'];
            }
            break;
            
        case 'show_completed_tasks':
        case 'show_task_descriptions':
        case 'auto_refresh_enabled':
        case 'notifications_enabled':
        case 'compact_view':
            $validBooleans = ['true', 'false', '1', '0'];
            if (!in_array(strtolower($value), $validBooleans)) {
                return ['valid' => false, 'message' => 'Boolean preference must be true/false or 1/0'];
            }
            break;
            
        case 'calendar_view_type':
            $validCalendarViews = ['month', 'week', 'day'];
            if (!in_array($value, $validCalendarViews)) {
                return ['valid' => false, 'message' => 'Invalid calendar view. Must be one of: ' . implode(', ', $validCalendarViews)];
            }
            break;
            
        case 'task_sort_order':
            $validSortOrders = ['priority', 'due_date', 'created_date', 'alphabetical'];
            if (!in_array($value, $validSortOrders)) {
                return ['valid' => false, 'message' => 'Invalid sort order. Must be one of: ' . implode(', ', $validSortOrders)];
            }
            break;
            
        default:
            // For unknown keys, just check length
            if (strlen($value) > 1000) {
                return ['valid' => false, 'message' => 'Preference value too long (max 1000 characters)'];
            }
            break;
    }
    
    return ['valid' => true, 'message' => 'Valid'];
}
?>
