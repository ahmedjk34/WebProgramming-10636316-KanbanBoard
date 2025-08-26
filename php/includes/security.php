<?php
/**
 * Security Functions for Kanban Board
 * Web Programming 10636316 Project
 * 
 * This file contains security-related functions to prevent common vulnerabilities
 */

// Note: sanitizeAndValidate function is now in utils/php-utils.php to avoid duplication

// Note: validateTaskData and validateProjectData functions are now in utils/php-utils.php to avoid duplication

// Note: detectSQLInjection function is now in utils/php-utils.php to avoid duplication

/**
 * Rate limiting check (simple implementation)
 * @param string $identifier Unique identifier (IP, user ID, etc.)
 * @param int $limit Maximum requests allowed
 * @param int $window Time window in seconds
 * @return bool True if within rate limit
 */
function checkRateLimit($identifier, $limit = 60, $window = 60) {
    $key = 'rate_limit_' . md5($identifier);
    
    if (!isset($_SESSION[$key])) {
        $_SESSION[$key] = [
            'count' => 1,
            'start_time' => time()
        ];
        return true;
    }
    
    $data = $_SESSION[$key];
    $elapsed = time() - $data['start_time'];
    
    if ($elapsed > $window) {
        // Reset counter
        $_SESSION[$key] = [
            'count' => 1,
            'start_time' => time()
        ];
        return true;
    }
    
    if ($data['count'] >= $limit) {
        return false; // Rate limit exceeded
    }
    
    $_SESSION[$key]['count']++;
    return true;
}

// Note: logSecurityEvent function is now in utils/php-utils.php to avoid duplication
?>
