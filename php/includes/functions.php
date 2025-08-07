<?php
/**
 * Common Functions for Kanban Board
 * Web Programming 10636316 Project
 */

/**
 * Sanitize input data to prevent XSS attacks
 * @param string $data Input data to sanitize
 * @return string Sanitized data
 */
function sanitizeInput($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    return $data;
}

/**
 * Validate email format
 * @param string $email Email to validate
 * @return bool True if valid email, false otherwise
 */
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Generate JSON response
 * @param bool $success Success status
 * @param string $message Response message
 * @param array $data Optional data to include
 * @return string JSON response
 */
function jsonResponse($success, $message, $data = []) {
    $response = [
        'success' => $success,
        'message' => $message,
        'data' => $data,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    header('Content-Type: application/json');
    return json_encode($response);
}

/**
 * Validate task priority
 * @param string $priority Priority to validate
 * @return bool True if valid priority, false otherwise
 */
function validatePriority($priority) {
    $validPriorities = ['low', 'medium', 'high'];
    return in_array($priority, $validPriorities);
}

/**
 * Validate task status
 * @param string $status Status to validate
 * @return bool True if valid status, false otherwise
 */
function validateStatus($status) {
    $validStatuses = ['todo', 'in_progress', 'done'];
    return in_array($status, $validStatuses);
}

/**
 * Validate date format (YYYY-MM-DD)
 * @param string $date Date to validate
 * @return bool True if valid date, false otherwise
 */
function validateDate($date) {
    $d = DateTime::createFromFormat('Y-m-d', $date);
    return $d && $d->format('Y-m-d') === $date;
}
?>
