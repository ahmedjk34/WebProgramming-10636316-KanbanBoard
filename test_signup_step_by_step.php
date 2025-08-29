<?php
/**
 * Step-by-Step Signup Test
 * Tests each part of the signup process to identify the exact failure point
 */

// Disable output buffering
ob_end_clean();

// Set request method
$_SERVER['REQUEST_METHOD'] = 'POST';

// Test data
$_POST = [
    'first_name' => 'Test',
    'last_name' => 'User',
    'email' => 'testuser' . time() . '@example.com',
    'username' => 'testuser' . time(),
    'password' => 'TestPassword123!',
    'confirm_password' => 'TestPassword123!',
    'terms' => 'on'
];

echo "=== Step-by-Step Signup Test ===\n\n";

try {
    // Step 1: Load required files
    echo "Step 1: Loading required files...\n";
    require_once 'php/config/database.php';
    require_once 'utils/php-utils.php';
    require_once 'php/includes/security.php';
    echo "✅ Files loaded successfully\n\n";
    
    // Step 2: Get database connection
    echo "Step 2: Getting database connection...\n";
    $pdo = getDBConnection();
    echo "✅ Database connection successful\n\n";
    
    // Step 3: Validate input
    echo "Step 3: Validating input...\n";
    $firstName = sanitizeAndValidate($_POST['first_name'], 'string');
    $lastName = sanitizeAndValidate($_POST['last_name'], 'string');
    $email = sanitizeAndValidate($_POST['email'], 'email');
    $username = sanitizeAndValidate($_POST['username'], 'string');
    $password = $_POST['password'];
    
    echo "✅ Input validation successful\n";
    echo "   First Name: $firstName\n";
    echo "   Last Name: $lastName\n";
    echo "   Email: $email\n";
    echo "   Username: $username\n\n";
    
    // Step 4: Check for existing email/username
    echo "Step 4: Checking for existing email/username...\n";
    $emailStmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $emailStmt->execute([$email]);
    if ($emailStmt->fetch()) {
        throw new Exception("Email already exists");
    }
    
    $usernameStmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
    $usernameStmt->execute([$username]);
    if ($usernameStmt->fetch()) {
        throw new Exception("Username already exists");
    }
    echo "✅ No existing email/username found\n\n";
    
    // Step 5: Hash password
    echo "Step 5: Hashing password...\n";
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    echo "✅ Password hashed successfully\n\n";
    
    // Step 6: Generate verification token
    echo "Step 6: Generating verification token...\n";
    $verificationToken = bin2hex(random_bytes(32));
    echo "✅ Verification token generated\n\n";
    
    // Step 7: Insert new user
    echo "Step 7: Inserting new user...\n";
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
        throw new Exception("Failed to create user account");
    }
    
    $userId = $pdo->lastInsertId();
    echo "✅ User created successfully with ID: $userId\n\n";
    
    // Step 8: Create default workspace
    echo "Step 8: Creating default workspace...\n";
    $workspaceStmt = $pdo->prepare("
        INSERT INTO workspaces (name, description, color, icon, owner_id, is_default) 
        VALUES (?, ?, ?, ?, ?, TRUE)
    ");
    
    $workspaceResult = $workspaceStmt->execute([
        $firstName . "'s Workspace",
        'Your personal workspace for tasks and projects',
        '#667eea',
        '👤',
        $userId
    ]);
    
    if (!$workspaceResult) {
        throw new Exception("Failed to create workspace");
    }
    
    $workspaceId = $pdo->lastInsertId();
    echo "✅ Workspace created successfully with ID: $workspaceId\n\n";
    
    // Step 9: Create default project
    echo "Step 9: Creating default project...\n";
    $projectStmt = $pdo->prepare("
        INSERT INTO projects (workspace_id, name, description, color, status) 
        VALUES (?, ?, ?, ?, 'active')
    ");
    
    $projectResult = $projectStmt->execute([
        $workspaceId,
        'Personal Tasks',
        'Your personal tasks and reminders',
        '#3498db'
    ]);
    
    if (!$projectResult) {
        throw new Exception("Failed to create project");
    }
    
    $projectId = $pdo->lastInsertId();
    echo "✅ Project created successfully with ID: $projectId\n\n";
    
    // Step 10: Set default user preferences
    echo "Step 10: Setting default user preferences...\n";
    $preferencesStmt = $pdo->prepare("
        INSERT INTO user_preferences (user_id, preference_key, preference_value, workspace_id) 
        VALUES 
        (?, 'default_view', 'kanban', ?),
        (?, 'theme', 'light', ?),
        (?, 'analytics_refresh_interval', '30', ?),
        (?, 'show_completed_tasks', 'true', ?),
        (?, 'calendar_view_type', 'month', ?)
    ");
    
    $preferencesResult = $preferencesStmt->execute([
        $userId, $workspaceId,
        $userId, $workspaceId,
        $userId, $workspaceId,
        $userId, $workspaceId,
        $userId, $workspaceId
    ]);
    
    if (!$preferencesResult) {
        throw new Exception("Failed to create user preferences");
    }
    
    echo "✅ User preferences created successfully\n\n";
    
    // Step 11: Verify email
    echo "Step 11: Verifying email...\n";
    $verifyStmt = $pdo->prepare("
        UPDATE users 
        SET email_verified = TRUE, verification_token = NULL 
        WHERE id = ?
    ");
    $verifyStmt->execute([$userId]);
    echo "✅ Email verified successfully\n\n";
    
    // Step 12: Generate session token
    echo "Step 12: Generating session token...\n";
    $token = generateSecureToken();
    echo "✅ Session token generated\n\n";
    
    // Step 13: Store token
    echo "Step 13: Storing session token...\n";
    $tokenStmt = $pdo->prepare("
        INSERT INTO user_preferences (user_id, preference_key, preference_value) 
        VALUES (?, 'auth_token', ?) 
        ON DUPLICATE KEY UPDATE preference_value = ?
    ");
    $tokenStmt->execute([$userId, $token, $token]);
    echo "✅ Session token stored successfully\n\n";
    
    echo "🎉 All steps completed successfully!\n";
    echo "User ID: $userId\n";
    echo "Workspace ID: $workspaceId\n";
    echo "Project ID: $projectId\n";
    echo "Token: " . substr($token, 0, 20) . "...\n";
    
} catch (Exception $e) {
    echo "❌ Error at step: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
?>

