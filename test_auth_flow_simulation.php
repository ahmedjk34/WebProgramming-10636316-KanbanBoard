<?php
/**
 * Test Authentication Flow Simulation
 * Simulates the complete guest login and authentication check process
 */

require_once 'php/config/database.php';
require_once 'php/config/session.php';

echo "=== AUTHENTICATION FLOW SIMULATION ===\n\n";

try {
    $pdo = getDBConnection();
    
    // 1. Simulate Guest Login Process
    echo "1. SIMULATING GUEST LOGIN:\n";
    
    // Find Guest user
    $stmt = $pdo->prepare("SELECT id, username, email FROM users WHERE username = 'guest'");
    $stmt->execute();
    $guestUser = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$guestUser) {
        echo "   ❌ Guest user not found\n";
        exit;
    }
    
    echo "   ✅ Found Guest user (ID: " . $guestUser['id'] . ")\n";
    
    // Generate new token (like guest_login.php does)
    $token = bin2hex(random_bytes(32));
    echo "   ✅ Generated new token: " . substr($token, 0, 20) . "...\n";
    
    // Delete existing tokens and insert new one (like fixed guest_login.php)
    $deleteStmt = $pdo->prepare("
        DELETE FROM user_preferences 
        WHERE user_id = ? AND preference_key = 'auth_token'
    ");
    $deleteStmt->execute([$guestUser['id']]);
    echo "   ✅ Deleted existing tokens\n";
    
    $insertStmt = $pdo->prepare("
        INSERT INTO user_preferences (user_id, preference_key, preference_value) 
        VALUES (?, 'auth_token', ?)
    ");
    $insertStmt->execute([$guestUser['id'], $token]);
    echo "   ✅ Inserted new token\n";
    
    // 2. Simulate Session Setup
    echo "\n2. SIMULATING SESSION SETUP:\n";
    
    // Start session
    safeSessionStart();
    
    // Set session variables (like guest_login.php does)
    $_SESSION['user_id'] = $guestUser['id'];
    $_SESSION['username'] = $guestUser['username'];
    $_SESSION['auth_token'] = $token;
    $_SESSION['is_guest'] = true;
    
    echo "   ✅ Session variables set:\n";
    echo "     user_id: " . $_SESSION['user_id'] . "\n";
    echo "     username: " . $_SESSION['username'] . "\n";
    echo "     auth_token: " . substr($_SESSION['auth_token'], 0, 20) . "...\n";
    echo "     is_guest: " . ($_SESSION['is_guest'] ? 'true' : 'false') . "\n";
    
    // 3. Simulate Authentication Check (like check_auth.php)
    echo "\n3. SIMULATING AUTHENTICATION CHECK:\n";
    
    $userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
    $sessionToken = isset($_SESSION['auth_token']) ? $_SESSION['auth_token'] : null;
    
    if (!$userId || !$sessionToken) {
        echo "   ❌ Session variables missing\n";
        echo "     user_id: " . ($userId ?: 'null') . "\n";
        echo "     token: " . ($sessionToken ? 'present' : 'null') . "\n";
    } else {
        echo "   ✅ Session variables present\n";
        
        // Verify token in database
        $tokenStmt = $pdo->prepare("
            SELECT preference_value 
            FROM user_preferences 
            WHERE user_id = ? AND preference_key = 'auth_token'
        ");
        $tokenStmt->execute([$userId]);
        $storedToken = $tokenStmt->fetchColumn();
        
        if (!$storedToken) {
            echo "   ❌ No stored token found in database\n";
        } elseif ($storedToken !== $sessionToken) {
            echo "   ❌ Token mismatch\n";
            echo "     Session token: " . substr($sessionToken, 0, 20) . "...\n";
            echo "     DB token: " . substr($storedToken, 0, 20) . "...\n";
        } else {
            echo "   ✅ Token matches database\n";
            
            // Get user data
            $userStmt = $pdo->prepare("
                SELECT id, username, email, first_name, last_name, is_active, email_verified
                FROM users 
                WHERE id = ? AND is_active = TRUE
            ");
            $userStmt->execute([$userId]);
            $user = $userStmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                echo "   ❌ User not found or inactive\n";
            } else {
                echo "   ✅ User found and active\n";
                echo "     Username: " . $user['username'] . "\n";
                echo "     Email: " . $user['email'] . "\n";
                echo "     Active: " . ($user['is_active'] ? 'Yes' : 'No') . "\n";
                echo "     Email Verified: " . ($user['email_verified'] ? 'Yes' : 'No') . "\n";
                
                // Get user preferences
                $preferencesStmt = $pdo->prepare("
                    SELECT preference_key, preference_value
                    FROM user_preferences 
                    WHERE user_id = ?
                ");
                $preferencesStmt->execute([$userId]);
                $preferences = $preferencesStmt->fetchAll(PDO::FETCH_ASSOC);
                
                $formattedPreferences = [];
                foreach ($preferences as $pref) {
                    $formattedPreferences[$pref['preference_key']] = $pref['preference_value'];
                }
                
                echo "   ✅ User preferences loaded\n";
                echo "     is_guest: " . ($formattedPreferences['is_guest'] ?? 'not set') . "\n";
                echo "     default_view: " . ($formattedPreferences['default_view'] ?? 'not set') . "\n";
                echo "     theme: " . ($formattedPreferences['theme'] ?? 'not set') . "\n";
                
                echo "\n   🎉 AUTHENTICATION SUCCESSFUL!\n";
                echo "   User is properly authenticated and ready to use the application.\n";
            }
        }
    }
    
    // 4. Verify token count
    echo "\n4. VERIFYING TOKEN COUNT:\n";
    $countStmt = $pdo->prepare("
        SELECT COUNT(*) 
        FROM user_preferences 
        WHERE user_id = ? AND preference_key = 'auth_token'
    ");
    $countStmt->execute([$guestUser['id']]);
    $tokenCount = $countStmt->fetchColumn();
    
    if ($tokenCount === 1) {
        echo "   ✅ Guest user has exactly 1 auth token\n";
    } else {
        echo "   ❌ Guest user has " . $tokenCount . " auth tokens (should be 1)\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

echo "\n=== SIMULATION COMPLETE ===\n";
?>
