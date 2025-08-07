<?php
/**
 * Main Configuration File
 * Kanban Board Project - Web Programming 10636316
 * 
 * This file contains all application-wide configuration settings
 */

// Start session for user management (if implementing authentication later)
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Include database configuration
require_once 'php/config/database.php';
require_once 'php/includes/functions.php';

// Application Configuration
define('APP_NAME', 'Kanban Task Board');
define('APP_VERSION', '1.0.0');
define('APP_AUTHOR', 'Web Programming 10636316 Student');

// Environment Settings
define('ENVIRONMENT', 'development'); // development, production
define('DEBUG_MODE', true);

// Security Settings
define('CSRF_TOKEN_NAME', 'csrf_token');
define('SESSION_TIMEOUT', 3600); // 1 hour in seconds

// File Upload Settings (for future features)
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_FILE_TYPES', ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx']);

// Pagination Settings
define('TASKS_PER_PAGE', 50);
define('PROJECTS_PER_PAGE', 20);

// Date and Time Settings
define('DEFAULT_TIMEZONE', 'Asia/Jerusalem'); // Adjust for your location
date_default_timezone_set(DEFAULT_TIMEZONE);

// API Settings
define('API_RATE_LIMIT', 100); // requests per minute
define('API_VERSION', 'v1');

// Error Reporting based on environment
if (ENVIRONMENT === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    ini_set('log_errors', 1);
    ini_set('error_log', 'php_errors.log');
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    ini_set('error_log', 'php_errors.log');
}

/**
 * Get application configuration as array
 * @return array Application configuration
 */
function getAppConfig() {
    return [
        'app_name' => APP_NAME,
        'app_version' => APP_VERSION,
        'environment' => ENVIRONMENT,
        'debug_mode' => DEBUG_MODE,
        'timezone' => DEFAULT_TIMEZONE,
        'api_version' => API_VERSION
    ];
}

/**
 * Check if application is in debug mode
 * @return bool True if debug mode is enabled
 */
function isDebugMode() {
    return DEBUG_MODE === true;
}

/**
 * Log debug information (only in debug mode)
 * @param string $message Debug message
 * @param array $context Additional context data
 */
function debugLog($message, $context = []) {
    if (isDebugMode()) {
        $logMessage = date('Y-m-d H:i:s') . " [DEBUG] " . $message;
        if (!empty($context)) {
            $logMessage .= " Context: " . json_encode($context);
        }
        error_log($logMessage);
    }
}

/**
 * Generate CSRF token for forms
 * @return string CSRF token
 */
function generateCSRFToken() {
    if (!isset($_SESSION[CSRF_TOKEN_NAME])) {
        $_SESSION[CSRF_TOKEN_NAME] = bin2hex(random_bytes(32));
    }
    return $_SESSION[CSRF_TOKEN_NAME];
}

/**
 * Verify CSRF token
 * @param string $token Token to verify
 * @return bool True if token is valid
 */
function verifyCSRFToken($token) {
    return isset($_SESSION[CSRF_TOKEN_NAME]) && 
           hash_equals($_SESSION[CSRF_TOKEN_NAME], $token);
}

// Initialize application
debugLog("Application initialized", getAppConfig());
?>
