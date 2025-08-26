<?php
/**
 * Authentication Middleware
 * Include this file in API endpoints that require authentication
 */

function requireAuth() {
    // Start session if not already started
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    // Check if user is logged in
    $userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
    $token = isset($_SESSION['auth_token']) ? $_SESSION['auth_token'] : null;
    
    if (!$userId || !$token) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Authentication required',
            'error' => 'UNAUTHORIZED'
        ]);
        exit;
    }
    
    // Verify token in database
    try {
        $pdo = getDBConnection();
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
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid session',
                'error' => 'INVALID_SESSION'
            ]);
            exit;
        }
        
        // Verify user is active
        $userStmt = $pdo->prepare("
            SELECT id, username, email, first_name, last_name, is_active 
            FROM users 
            WHERE id = ? AND is_active = TRUE
        ");
        $userStmt->execute([$userId]);
        $user = $userStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'User not found or inactive',
                'error' => 'USER_INACTIVE'
            ]);
            exit;
        }
        
        // Store user data in global variable for use in API
        global $currentUser;
        $currentUser = $user;
        
        return $user;
        
    } catch (Exception $e) {
        error_log("Auth middleware error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Authentication check failed',
            'error' => 'AUTH_ERROR'
        ]);
        exit;
    }
}

/**
 * Get current authenticated user
 */
function getCurrentUser() {
    global $currentUser;
    return $currentUser;
}

/**
 * Get current user ID
 */
function getCurrentUserId() {
    global $currentUser;
    return $currentUser ? $currentUser['id'] : null;
}

/**
 * Check if user is authenticated (without throwing error)
 */
function isAuthenticated() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    $userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
    $token = isset($_SESSION['auth_token']) ? $_SESSION['auth_token'] : null;
    
    if (!$userId || !$token) {
        return false;
    }
    
    try {
        $pdo = getDBConnection();
        $tokenStmt = $pdo->prepare("
            SELECT preference_value 
            FROM user_preferences 
            WHERE user_id = ? AND preference_key = 'auth_token'
        ");
        $tokenStmt->execute([$userId]);
        $storedToken = $tokenStmt->fetchColumn();
        
        return $storedToken && $storedToken === $token;
        
    } catch (Exception $e) {
        return false;
    }
}
?>
