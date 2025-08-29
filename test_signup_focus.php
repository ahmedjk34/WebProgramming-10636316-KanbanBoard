<?php
/**
 * Focused Signup Test
 * Tests the signup process step by step to identify the exact issue
 */

echo "=== Focused Signup Test ===\n\n";

try {
    // Load required files
    require_once 'php/config/database.php';
    require_once 'utils/php-utils.php';
    require_once 'php/includes/security.php';
    echo "✅ Files loaded successfully\n\n";
    
    // Get database connection
    $pdo = getDBConnection();
    echo "✅ Database connection successful\n\n";
    
    // Test data
    $firstName = 'Test';
    $lastName = 'User';
    $email = 'testuser' . time() . '@example.com';
    $username = 'testuser' . time();
    $password = 'TestPassword123!';
    
    echo "Test data:\n";
    echo "  First Name: $firstName\n";
    echo "  Last Name: $lastName\n";
    echo "  Email: $email\n";
    echo "  Username: $username\n\n";
    
    // Check for existing email/username
    echo "Checking for existing email/username...\n";
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
    
    // Insert new user
    echo "Inserting new user...\n";
    $insertStmt = $pdo->prepare("
        INSERT INTO users (username, email, password_hash, first_name, last_name, verification_token) 
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    
    $verificationToken = bin2hex(random_bytes(32));
    $result = $insertStmt->execute([
        $username,
        $email,
        password_hash($password, PASSWORD_DEFAULT),
        $firstName,
        $lastName,
        $verificationToken
    ]);
    
    if (!$result) {
        throw new Exception("Failed to create user account");
    }
    
    $userId = $pdo->lastInsertId();
    echo "✅ User created successfully with ID: $userId\n\n";
    
    // Create default workspace
    echo "Creating default workspace...\n";
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
    
    // Create default project
    echo "Creating default project...\n";
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
    
    // Set default user preferences
    echo "Setting default user preferences...\n";
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
    
    // Verify email
    echo "Verifying email...\n";
    $verifyStmt = $pdo->prepare("
        UPDATE users 
        SET email_verified = TRUE, verification_token = NULL 
        WHERE id = ?
    ");
    $verifyStmt->execute([$userId]);
    echo "✅ Email verified successfully\n\n";
    
    // Generate and store session token
    echo "Generating and storing session token...\n";
    $token = generateSecureToken();
    $tokenStmt = $pdo->prepare("
        INSERT INTO user_preferences (user_id, preference_key, preference_value) 
        VALUES (?, 'auth_token', ?) 
        ON DUPLICATE KEY UPDATE preference_value = ?
    ");
    $tokenStmt->execute([$userId, $token, $token]);
    echo "✅ Session token stored successfully\n\n";
    
    echo "🎉 Signup process completed successfully!\n";
    echo "User ID: $userId\n";
    echo "Workspace ID: $workspaceId\n";
    echo "Project ID: $projectId\n";
    echo "Token: " . substr($token, 0, 20) . "...\n";
    
    // Clean up - delete the test user and related data
    echo "\nCleaning up test data...\n";
    $pdo->prepare("DELETE FROM user_preferences WHERE user_id = ?")->execute([$userId]);
    $pdo->prepare("DELETE FROM projects WHERE workspace_id = ?")->execute([$workspaceId]);
    $pdo->prepare("DELETE FROM workspaces WHERE id = ?")->execute([$workspaceId]);
    $pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$userId]);
    echo "✅ Test data cleaned up successfully\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
?>

