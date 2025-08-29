<?php
/**
 * PHP Utility Functions
 * Kanban Board Project - Web Programming 10636316
 * 
 * This file contains reusable utility functions used across PHP files
 */

// ===== RESPONSE UTILITIES =====

/**
 * Generate standardized JSON response
 * @param bool $success Success status
 * @param string $message Response message
 * @param array $data Optional data to include
 * @param int $httpCode HTTP status code (optional)
 * @return string JSON response
 */
function jsonResponse($success, $message, $data = [], $httpCode = null) {
    $response = [
        'success' => $success,
        'message' => $message,
        'data' => $data,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    // Set HTTP status code if provided
    if ($httpCode !== null) {
        http_response_code($httpCode);
    }
    
    header('Content-Type: application/json');
    return json_encode($response);
}

/**
 * Send success response and exit
 * @param string $message Success message
 * @param array $data Optional data to include
 * @param int $httpCode HTTP status code (default: 200)
 */
function sendSuccessResponse($message, $data = [], $httpCode = 200) {
    echo jsonResponse(true, $message, $data, $httpCode);
    exit();
}

/**
 * Send error response and exit
 * @param string $message Error message
 * @param array $data Optional data to include
 * @param int $httpCode HTTP status code (default: 400)
 */
function sendErrorResponse($message, $data = [], $httpCode = 400) {
    echo jsonResponse(false, $message, $data, $httpCode);
    exit();
}

// ===== INPUT SANITIZATION UTILITIES =====

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
 * Sanitize and validate input data with type checking
 * @param mixed $data Input data to sanitize
 * @param string $type Type of validation (string, email, int, float, url, html)
 * @return mixed Sanitized data or false if validation fails
 */
function sanitizeAndValidate($data, $type = 'string') {
    // First, basic sanitization for strings
    if (is_string($data)) {
        $data = trim($data);
        $data = stripslashes($data);
    }
    
    switch ($type) {
        case 'string':
            return htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
            
        case 'email':
            $email = filter_var($data, FILTER_SANITIZE_EMAIL);
            return filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : false;
            
        case 'int':
            return filter_var($data, FILTER_VALIDATE_INT);
            
        case 'float':
            return filter_var($data, FILTER_VALIDATE_FLOAT);
            
        case 'url':
            $url = filter_var($data, FILTER_SANITIZE_URL);
            return filter_var($url, FILTER_VALIDATE_URL) ? $url : false;
            
        case 'html':
            // For rich text content, allow specific HTML tags
            $allowed_tags = '<p><br><strong><em><ul><ol><li><a>';
            return strip_tags($data, $allowed_tags);
            
        default:
            return htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    }
}

// ===== VALIDATION UTILITIES =====

/**
 * Validate email format
 * @param string $email Email to validate
 * @return bool True if valid email, false otherwise
 */
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
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
 * Validate project status
 * @param string $status Status to validate
 * @return bool True if valid status, false otherwise
 */
function validateProjectStatus($status) {
    $validStatuses = ['planning', 'active', 'on_hold', 'completed', 'archived'];
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

/**
 * Validate color format (#RRGGBB)
 * @param string $color Color to validate
 * @return bool True if valid color, false otherwise
 */
function validateColor($color) {
    return preg_match('/^#[a-fA-F0-9]{6}$/', $color);
}

// ===== DATA VALIDATION UTILITIES =====

/**
 * Validate task data comprehensively
 * @param array $taskData Task data to validate
 * @return array Validation result with errors and clean data
 */
function validateTaskData($taskData) {
    $errors = [];
    $cleanData = [];
    
    // Validate title (required)
    if (empty($taskData['title'])) {
        $errors['title'] = 'Task title is required';
    } else {
        $title = sanitizeAndValidate($taskData['title'], 'string');
        if (strlen($title) > 255) {
            $errors['title'] = 'Task title must be less than 255 characters';
        } else {
            $cleanData['title'] = $title;
        }
    }
    
    // Validate description (optional)
    if (!empty($taskData['description'])) {
        $cleanData['description'] = sanitizeAndValidate($taskData['description'], 'html');
    }
    
    // Validate project_id (required)
    if (empty($taskData['project_id'])) {
        $errors['project_id'] = 'Project ID is required';
    } else {
        $projectId = sanitizeAndValidate($taskData['project_id'], 'int');
        if ($projectId === false || $projectId <= 0) {
            $errors['project_id'] = 'Invalid project ID';
        } else {
            $cleanData['project_id'] = $projectId;
        }
    }
    
    // Validate priority (optional, default to 'medium')
    if (!empty($taskData['priority'])) {
        $priority = sanitizeAndValidate($taskData['priority'], 'string');
        if (!validatePriority($priority)) {
            $errors['priority'] = 'Invalid priority. Must be low, medium, or high';
        } else {
            $cleanData['priority'] = $priority;
        }
    } else {
        $cleanData['priority'] = 'medium';
    }
    
    // Validate status (optional, default to 'todo')
    if (!empty($taskData['status'])) {
        $status = sanitizeAndValidate($taskData['status'], 'string');
        if (!validateStatus($status)) {
            $errors['status'] = 'Invalid status. Must be todo, in_progress, or done';
        } else {
            $cleanData['status'] = $status;
        }
    } else {
        $cleanData['status'] = 'todo';
    }
    
    // Validate due_date (optional)
    if (!empty($taskData['due_date'])) {
        $dueDate = sanitizeAndValidate($taskData['due_date'], 'string');
        if (!validateDate($dueDate)) {
            $errors['due_date'] = 'Invalid date format. Use YYYY-MM-DD';
        } else {
            $cleanData['due_date'] = $dueDate;
        }
    }
    
    return [
        'valid' => empty($errors),
        'errors' => $errors,
        'data' => $cleanData
    ];
}

/**
 * Validate project data comprehensively
 * @param array $projectData Project data to validate
 * @return array Validation result with errors and clean data
 */
function validateProjectData($projectData) {
    $errors = [];
    $cleanData = [];
    
    // Validate name (required)
    if (empty($projectData['name'])) {
        $errors['name'] = 'Project name is required';
    } else {
        $name = sanitizeAndValidate($projectData['name'], 'string');
        if (strlen($name) > 255) {
            $errors['name'] = 'Project name must be less than 255 characters';
        } else {
            $cleanData['name'] = $name;
        }
    }
    
    // Validate description (optional)
    if (!empty($projectData['description'])) {
        $cleanData['description'] = sanitizeAndValidate($projectData['description'], 'html');
    }
    
    // Validate color (optional)
    if (!empty($projectData['color'])) {
        $color = sanitizeAndValidate($projectData['color'], 'string');
        if (!validateColor($color)) {
            $errors['color'] = 'Invalid color format. Use #RRGGBB format';
        } else {
            $cleanData['color'] = $color;
        }
    }
    
    // Validate status (optional)
    if (!empty($projectData['status'])) {
        $status = sanitizeAndValidate($projectData['status'], 'string');
        if (!validateProjectStatus($status)) {
            $errors['status'] = 'Invalid status. Must be active, on_hold, completed, or archived';
        } else {
            $cleanData['status'] = $status;
        }
    }
    
    // Validate workspace_id (required)
    if (empty($projectData['workspace_id'])) {
        $errors['workspace_id'] = 'Workspace ID is required';
    } else {
        $workspaceId = sanitizeAndValidate($projectData['workspace_id'], 'int');
        if ($workspaceId === false || $workspaceId <= 0) {
            $errors['workspace_id'] = 'Invalid workspace ID';
        } else {
            $cleanData['workspace_id'] = $workspaceId;
        }
    }
    
    return [
        'valid' => empty($errors),
        'errors' => $errors,
        'data' => $cleanData
    ];
}

/**
 * Validate workspace data comprehensively
 * @param array $workspaceData Workspace data to validate
 * @return array Validation result with errors and clean data
 */
function validateWorkspaceData($workspaceData) {
    $errors = [];
    $cleanData = [];
    
    // Validate name (required)
    if (empty($workspaceData['name'])) {
        $errors['name'] = 'Workspace name is required';
    } else {
        $name = sanitizeAndValidate($workspaceData['name'], 'string');
        if (strlen($name) > 100) {
            $errors['name'] = 'Workspace name must be less than 100 characters';
        } else {
            $cleanData['name'] = $name;
        }
    }
    
    // Validate description (optional)
    if (!empty($workspaceData['description'])) {
        $cleanData['description'] = sanitizeAndValidate($workspaceData['description'], 'string');
    }
    
    // Validate icon (optional)
    if (!empty($workspaceData['icon'])) {
        $icon = sanitizeAndValidate($workspaceData['icon'], 'string');
        if (strlen($icon) > 50) {
            $errors['icon'] = 'Icon must be less than 50 characters';
        } else {
            $cleanData['icon'] = $icon;
        }
    }
    
    // Validate color (optional)
    if (!empty($workspaceData['color'])) {
        $color = sanitizeAndValidate($workspaceData['color'], 'string');
        if (!validateColor($color)) {
            $errors['color'] = 'Invalid color format. Use #RRGGBB format';
        } else {
            $cleanData['color'] = $color;
        }
    }
    
    return [
        'valid' => empty($errors),
        'errors' => $errors,
        'data' => $cleanData
    ];
}

// ===== SECURITY UTILITIES =====

/**
 * Check for SQL injection patterns (additional security layer)
 * @param string $input Input to check
 * @return bool True if suspicious patterns found
 */
function detectSQLInjection($input) {
    $patterns = [
        '/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i',
        '/(\b(OR|AND)\s+\d+\s*=\s*\d+)/i',
        '/(\'|\"|;|--|\*|\/\*|\*\/)/i'
    ];
    
    foreach ($patterns as $pattern) {
        if (preg_match($pattern, $input)) {
            return true;
        }
    }
    
    return false;
}

/**
 * Log security events
 * @param string $event Event description
 * @param array $context Additional context
 */
function logSecurityEvent($event, $context = []) {
    $logData = [
        'timestamp' => date('Y-m-d H:i:s'),
        'event' => $event,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        'context' => $context
    ];
    
    error_log("[SECURITY] " . json_encode($logData));
}

// ===== UTILITY FUNCTIONS =====

/**
 * Get JSON input from request body
 * @return array|null Decoded JSON data or null if invalid
 */
function getJsonInput() {
    $input = file_get_contents('php://input');
    return json_decode($input, true);
}

/**
 * Check if request method matches expected method and exit if not
 * @param string $expectedMethod Expected HTTP method
 */
function checkRequestMethod($expectedMethod) {
    if ($_SERVER['REQUEST_METHOD'] !== strtoupper($expectedMethod)) {
        echo jsonResponse(false, "Method not allowed. Use {$expectedMethod}.", [], 405);
        exit();
    }
}

/**
 * Set CORS headers for API responses
 */
function setCorsHeaders() {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
}

// Set default headers for all API responses
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// ===== AUTHENTICATION UTILITIES =====

/**
 * Generate a secure random token
 * @param int $length Token length in characters
 * @return string Secure random token
 */

 
function generateSecureToken($length = 64) {
    return bin2hex(random_bytes($length / 2));
}
?>
