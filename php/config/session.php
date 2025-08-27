<?php
/**
 * Session Configuration
 * Ensures proper session handling across the application
 */

// Configure session for proper cookie handling
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 0); // Set to 1 if using HTTPS
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_lifetime', 86400); // 24 hours
ini_set('session.cookie_path', '/');
ini_set('session.cookie_domain', '');
ini_set('session.gc_maxlifetime', 86400); // 24 hours

// Function to safely start session
function safeSessionStart() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

// Function to safely destroy session
function safeSessionDestroy() {
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_destroy();
    }
}

// Function to regenerate session ID for security
function regenerateSessionId() {
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_regenerate_id(true);
    }
}
?>
