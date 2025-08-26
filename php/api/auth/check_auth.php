<?php
/**
 * Authentication Check API Endpoint
 * Verifies if user is logged in and returns user data
 */

// Load session configuration FIRST (before any output)
require_once __DIR__ . '/../../config/session.php';

// Disable error display to prevent HTML output
error_reporting(0);
ini_set('display_errors', 0);

// Set JSON content type
header('Content-Type: application/json');

try {
    require_once __DIR__ . '/../../config/database.php';
    require_once __DIR__ . '/../../../utils/php-utils.php';
    require_once __DIR__ . '/../../includes/security.php';
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'System configuration error. Please contact support.'
    ]);
    exit;
}

try {
    // Start session safely
    safeSessionStart();
    
    $pdo = getDBConnection();
    
    // Check if user is logged in via session
    $userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
    $token = isset($_SESSION['auth_token']) ? $_SESSION['auth_token'] : null;
    
    if (!$userId || !$token) {
        echo json_encode([
            'success' => false,
            'message' => 'Not authenticated',
            'authenticated' => false
        ]);
        exit;
    }
    
    // Verify token in database
    $tokenStmt = $pdo->prepare("
        SELECT preference_value 
        FROM user_preferences 
        WHERE user_id = ? AND preference_key = 'auth_token'
    ");
    $tokenStmt->execute([$userId]);
    $storedToken = $tokenStmt->fetchColumn();
    
    if (!$storedToken || $storedToken !== $token) {
        // Token mismatch, clear session
        session_destroy();
        echo json_encode([
            'success' => false,
            'message' => 'Invalid session',
            'authenticated' => false
        ]);
        exit;
    }
    
    // Get user data
    $userStmt = $pdo->prepare("
        SELECT id, username, email, first_name, last_name, avatar_url, 
               is_active, email_verified, last_login, created_at
        FROM users 
        WHERE id = ? AND is_active = TRUE
    ");
    $userStmt->execute([$userId]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo json_encode([
            'success' => false,
            'message' => 'User not found or inactive',
            'authenticated' => false
        ]);
        exit;
    }
    
    // Get user preferences
    $preferencesStmt = $pdo->prepare("
        SELECT preference_key, preference_value, workspace_id
        FROM user_preferences 
        WHERE user_id = ?
    ");
    $preferencesStmt->execute([$userId]);
    $preferences = $preferencesStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format preferences
    $formattedPreferences = [];
    foreach ($preferences as $pref) {
        $formattedPreferences[$pref['preference_key']] = $pref['preference_value'];
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Authenticated',
        'authenticated' => true,
        'data' => [
            'user' => $user,
            'preferences' => $formattedPreferences
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Auth check error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Authentication check failed',
        'authenticated' => false
    ]);
}
?>
