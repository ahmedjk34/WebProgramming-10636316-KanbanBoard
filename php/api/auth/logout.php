<?php
/**
 * Logout API Endpoint
 * Handles user logout and session cleanup
 */

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
    // Start session
    session_start();
    
    $pdo = getDBConnection();
    
    // Get user ID from session
    $userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
    $token = isset($_SESSION['auth_token']) ? $_SESSION['auth_token'] : null;
    
    if ($userId && $token) {
        // Remove auth token from database
        $tokenStmt = $pdo->prepare("
            DELETE FROM user_preferences 
            WHERE user_id = ? AND preference_key = 'auth_token'
        ");
        $tokenStmt->execute([$userId]);
    }
    
    // Clear session data
    $_SESSION = array();
    
    // Destroy session cookie
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    
    // Destroy session
    session_destroy();
    
    echo json_encode([
        'success' => true,
        'message' => 'Logged out successfully'
    ]);
    
} catch (Exception $e) {
    error_log("Logout error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred during logout'
    ]);
}
?>
