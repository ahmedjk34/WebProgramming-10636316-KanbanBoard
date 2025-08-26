<?php
/**
 * Signup API Endpoint
 * Handles user registration
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
    // Check if request method is POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Invalid request method');
    }

    $pdo = getDBConnection();
    
    // Get and validate input
    $firstName = isset($_POST['first_name']) ? sanitizeAndValidate($_POST['first_name'], 'string') : '';
    $lastName = isset($_POST['last_name']) ? sanitizeAndValidate($_POST['last_name'], 'string') : '';
    $email = isset($_POST['email']) ? sanitizeAndValidate($_POST['email'], 'email') : '';
    $username = isset($_POST['username']) ? sanitizeAndValidate($_POST['username'], 'string') : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    $newsletter = isset($_POST['newsletter']) ? true : false;
    
    $errors = [];
    
    // Validate first name
    if (empty($firstName)) {
        $errors['first_name'] = 'First name is required';
    } elseif (strlen($firstName) < 2) {
        $errors['first_name'] = 'First name must be at least 2 characters';
    } elseif (strlen($firstName) > 100) {
        $errors['first_name'] = 'First name must be less than 100 characters';
    }
    
    // Validate last name
    if (empty($lastName)) {
        $errors['last_name'] = 'Last name is required';
    } elseif (strlen($lastName) < 2) {
        $errors['last_name'] = 'Last name must be at least 2 characters';
    } elseif (strlen($lastName) > 100) {
        $errors['last_name'] = 'Last name must be less than 100 characters';
    }
    
    // Validate email
    if (empty($email)) {
        $errors['email'] = 'Email is required';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Please enter a valid email address';
    } elseif (strlen($email) > 255) {
        $errors['email'] = 'Email must be less than 255 characters';
    }
    
    // Validate username
    if (empty($username)) {
        $errors['username'] = 'Username is required';
    } elseif (strlen($username) < 3) {
        $errors['username'] = 'Username must be at least 3 characters';
    } elseif (strlen($username) > 50) {
        $errors['username'] = 'Username must be less than 50 characters';
    } elseif (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
        $errors['username'] = 'Username can only contain letters, numbers, and underscores';
    }
    
    // Validate password
    if (empty($password)) {
        $errors['password'] = 'Password is required';
    } elseif (strlen($password) < 8) {
        $errors['password'] = 'Password must be at least 8 characters';
    } elseif (strlen($password) > 255) {
        $errors['password'] = 'Password must be less than 255 characters';
    }
    
    // If validation errors, return them
    if (!empty($errors)) {
        echo json_encode([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $errors
        ]);
        exit;
    }
    
    // Check if email already exists
    $emailStmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $emailStmt->execute([$email]);
    if ($emailStmt->fetch()) {
        echo json_encode([
            'success' => false,
            'message' => 'An account with this email already exists'
        ]);
        exit;
    }
    
    // Check if username already exists
    $usernameStmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $usernameStmt->execute([$username]);
    if ($usernameStmt->fetch()) {
        echo json_encode([
            'success' => false,
            'message' => 'This username is already taken'
        ]);
        exit;
    }
    
    // Hash password
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    
    // Generate verification token
    $verificationToken = bin2hex(random_bytes(32));
    
    // Insert new user
    $insertStmt = $pdo->prepare("
        INSERT INTO users (username, email, password_hash, first_name, last_name, verification_token) 
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    
    $result = $insertStmt->execute([
        $username,
        $email,
        $passwordHash,
        $firstName,
        $lastName,
        $verificationToken
    ]);
    
    if (!$result) {
        throw new Exception('Failed to create user account');
    }
    
    $userId = $pdo->lastInsertId();
    
    // Create default workspace for the user
    $workspaceStmt = $pdo->prepare("
        INSERT INTO workspaces (name, description, color, icon, is_default) 
        VALUES (?, ?, ?, ?, TRUE)
    ");
    $workspaceStmt->execute([
        $firstName . "'s Workspace",
        'Your personal workspace for tasks and projects',
        '#667eea',
        '👤'
    ]);
    
    $workspaceId = $pdo->lastInsertId();
    
    // Create default project
    $projectStmt = $pdo->prepare("
        INSERT INTO projects (workspace_id, name, description, color, status) 
        VALUES (?, ?, ?, ?, 'active')
    ");
    $projectStmt->execute([
        $workspaceId,
        'Personal Tasks',
        'Your personal tasks and reminders',
        '#3498db'
    ]);
    
    // Set default user preferences
    $preferencesStmt = $pdo->prepare("
        INSERT INTO user_preferences (user_id, preference_key, preference_value, workspace_id) 
        VALUES 
        (?, 'default_view', 'kanban', ?),
        (?, 'theme', 'light', ?),
        (?, 'analytics_refresh_interval', '30', ?),
        (?, 'show_completed_tasks', 'true', ?),
        (?, 'calendar_view_type', 'month', ?)
    ");
    $preferencesStmt->execute([
        $userId, $workspaceId,
        $userId, $workspaceId,
        $userId, $workspaceId,
        $userId, $workspaceId,
        $userId, $workspaceId
    ]);
    
    // TODO: Send verification email
    // For now, we'll auto-verify the email
    $verifyStmt = $pdo->prepare("
        UPDATE users 
        SET email_verified = TRUE, verification_token = NULL 
        WHERE id = ?
    ");
    $verifyStmt->execute([$userId]);
    
    // Auto-login the user after successful signup
    // Generate session token
    $token = generateSecureToken();
    $tokenExpiry = date('Y-m-d H:i:s', strtotime('+24 hours'));
    
    // Store token in database
    $tokenStmt = $pdo->prepare("
        INSERT INTO user_preferences (user_id, preference_key, preference_value) 
        VALUES (?, 'auth_token', ?) 
        ON DUPLICATE KEY UPDATE preference_value = ?
    ");
    $tokenStmt->execute([$userId, $token, $token]);
    
    // Start session
    session_start();
    $_SESSION['user_id'] = $userId;
    $_SESSION['username'] = $username;
    $_SESSION['auth_token'] = $token;
    
    // Get user data for response
    $userData = [
        'id' => $userId,
        'username' => $username,
        'email' => $email,
        'first_name' => $firstName,
        'last_name' => $lastName,
        'avatar_url' => null,
        'last_login' => date('Y-m-d H:i:s')
    ];
    
    echo json_encode([
        'success' => true,
        'message' => 'Account created and logged in successfully!',
        'data' => [
            'user' => $userData,
            'token' => $token,
            'token_expires' => $tokenExpiry,
            'auto_login' => true
        ]
    ]);
    
} catch (Exception $e) {
    error_log("Signup error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred during registration. Please try again.'
    ]);
}

/**
 * Generate a secure random token
 */
function generateSecureToken($length = 64) {
    return bin2hex(random_bytes($length / 2));
}
?>
