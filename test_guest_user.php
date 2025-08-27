<?php
/**
 * Test Guest User Database Check
 * This script checks if the Guest user exists and verifies all credentials match
 */

require_once 'php/config/database.php';

try {
    $pdo = getDBConnection();
    
    echo "=== GUEST USER DATABASE CHECK ===\n\n";
    
    // Check if Guest user exists
    $stmt = $pdo->prepare("
        SELECT id, username, email, first_name, last_name, is_active, email_verified, created_at 
        FROM users 
        WHERE username = 'guest' OR email = 'guest@example.com'
    ");
    $stmt->execute();
    $guestUser = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($guestUser) {
        echo "✅ Guest user found:\n";
        echo "   ID: " . $guestUser['id'] . "\n";
        echo "   Username: " . $guestUser['username'] . "\n";
        echo "   Email: " . $guestUser['email'] . "\n";
        echo "   First Name: " . $guestUser['first_name'] . "\n";
        echo "   Last Name: " . $guestUser['last_name'] . "\n";
        echo "   Is Active: " . ($guestUser['is_active'] ? 'Yes' : 'No') . "\n";
        echo "   Email Verified: " . ($guestUser['email_verified'] ? 'Yes' : 'No') . "\n";
        echo "   Created: " . $guestUser['created_at'] . "\n\n";
        
        // Check if password hash exists and is valid
        $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
        $stmt->execute([$guestUser['id']]);
        $passwordHash = $stmt->fetchColumn();
        
        if ($passwordHash) {
            echo "✅ Password hash exists\n";
            
            // Test if the password 'guest123' matches the hash
            if (password_verify('guest123', $passwordHash)) {
                echo "✅ Password 'guest123' matches the hash\n";
            } else {
                echo "❌ Password 'guest123' does NOT match the hash\n";
            }
        } else {
            echo "❌ No password hash found\n";
        }
        
        // Check for auth token
        $stmt = $pdo->prepare("
            SELECT preference_value 
            FROM user_preferences 
            WHERE user_id = ? AND preference_key = 'auth_token'
        ");
        $stmt->execute([$guestUser['id']]);
        $authToken = $stmt->fetchColumn();
        
        if ($authToken) {
            echo "✅ Auth token exists\n";
        } else {
            echo "❌ No auth token found\n";
        }
        
        // Check for guest preference
        $stmt = $pdo->prepare("
            SELECT preference_value 
            FROM user_preferences 
            WHERE user_id = ? AND preference_key = 'is_guest'
        ");
        $stmt->execute([$guestUser['id']]);
        $isGuest = $stmt->fetchColumn();
        
        if ($isGuest === 'true') {
            echo "✅ Guest preference set to 'true'\n";
        } else {
            echo "❌ Guest preference not set correctly (found: " . ($isGuest ?: 'null') . ")\n";
        }
        
        // Check workspaces
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM workspaces 
            WHERE owner_id = ?
        ");
        $stmt->execute([$guestUser['id']]);
        $workspaceCount = $stmt->fetchColumn();
        echo "   Workspaces owned: " . $workspaceCount . "\n";
        
        // Check workspace memberships
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM workspace_members 
            WHERE user_id = ?
        ");
        $stmt->execute([$guestUser['id']]);
        $membershipCount = $stmt->fetchColumn();
        echo "   Workspace memberships: " . $membershipCount . "\n";
        
        // Check projects
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM projects 
            WHERE created_by = ?
        ");
        $stmt->execute([$guestUser['id']]);
        $projectCount = $stmt->fetchColumn();
        echo "   Projects created: " . $projectCount . "\n";
        
        // Check tasks
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM tasks 
            WHERE created_by = ?
        ");
        $stmt->execute([$guestUser['id']]);
        $taskCount = $stmt->fetchColumn();
        echo "   Tasks created: " . $taskCount . "\n";
        
        // Check team memberships
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM team_members 
            WHERE user_id = ?
        ");
        $stmt->execute([$guestUser['id']]);
        $teamCount = $stmt->fetchColumn();
        echo "   Team memberships: " . $teamCount . "\n";
        
    } else {
        echo "❌ Guest user NOT found in database\n";
        echo "   This means the Guest user was never created or was deleted\n\n";
        
        // Check what users exist
        $stmt = $pdo->query("SELECT id, username, email, first_name, last_name FROM users LIMIT 10");
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo "Current users in database:\n";
        foreach ($users as $user) {
            echo "   ID: " . $user['id'] . " | Username: " . $user['username'] . " | Email: " . $user['email'] . " | Name: " . $user['first_name'] . " " . $user['last_name'] . "\n";
        }
    }
    
    echo "\n=== EXPECTED GUEST USER CREDENTIALS ===\n";
    echo "Username: guest\n";
    echo "Email: guest@example.com\n";
    echo "First Name: Guest\n";
    echo "Last Name: User\n";
    echo "Password: guest123\n";
    echo "Is Active: Yes\n";
    echo "Email Verified: Yes\n";
    echo "Guest Preference: true\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
