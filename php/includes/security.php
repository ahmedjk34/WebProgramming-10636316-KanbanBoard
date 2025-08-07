<?php
/**
 * Security Functions for Kanban Board
 * Web Programming 10636316 Project
 * 
 * This file contains security-related functions to prevent common vulnerabilities
 */

/**
 * Sanitize and validate input data
 * @param mixed $data Input data to sanitize
 * @param string $type Type of validation (string, email, int, float, url)
 * @return mixed Sanitized data or false if validation fails
 */
function sanitizeAndValidate($data, $type = 'string') {
    // First, basic sanitization
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

/**
 * Validate task data
 * @param array $taskData Task data to validate
 * @return array Validation result with errors
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
    
    // Validate status (optional, with default)
    if (!empty($taskData['status'])) {
        if (!validateStatus($taskData['status'])) {
            $errors['status'] = 'Invalid task status';
        } else {
            $cleanData['status'] = $taskData['status'];
        }
    }
    
    // Validate priority (optional, with default)
    if (!empty($taskData['priority'])) {
        if (!validatePriority($taskData['priority'])) {
            $errors['priority'] = 'Invalid task priority';
        } else {
            $cleanData['priority'] = $taskData['priority'];
        }
    }
    
    // Validate due_date (optional)
    if (!empty($taskData['due_date'])) {
        if (!validateDate($taskData['due_date'])) {
            $errors['due_date'] = 'Invalid date format. Use YYYY-MM-DD';
        } else {
            $cleanData['due_date'] = $taskData['due_date'];
        }
    }
    
    // Validate position (optional)
    if (!empty($taskData['position'])) {
        $position = sanitizeAndValidate($taskData['position'], 'int');
        if ($position === false) {
            $errors['position'] = 'Invalid position value';
        } else {
            $cleanData['position'] = $position;
        }
    }
    
    return [
        'valid' => empty($errors),
        'errors' => $errors,
        'data' => $cleanData
    ];
}

/**
 * Validate project data
 * @param array $projectData Project data to validate
 * @return array Validation result with errors
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
        if (!preg_match('/^#[a-fA-F0-9]{6}$/', $color)) {
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
?>
