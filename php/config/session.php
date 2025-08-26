<?php
/**
 * Session Configuration
 * Ensures proper session handling across the application
 */

// No session configuration changes to avoid header issues
// Using default PHP session handling

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
