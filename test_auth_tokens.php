<?php
/**
 * Test Auth Tokens
 * Check for multiple auth tokens and potential conflicts
 */

require_once 'php/config/database.php';

try {
    $pdo = getDBConnection();
    
    echo "=== AUTH TOKEN CHECK ===\n\n";
    
    // Check all auth tokens in the database
    $stmt = $pdo->prepare("
        SELECT up.user_id, up.preference_value as auth_token, u.username, u.email
        FROM user_preferences up
        JOIN users u ON up.user_id = u.id
        WHERE up.preference_key = 'auth_token'
        ORDER BY up.user_id
    ");
    $stmt->execute();
    $tokens = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Found " . count($tokens) . " auth tokens:\n\n";
    
    foreach ($tokens as $token) {
        echo "User ID: " . $token['user_id'] . "\n";
        echo "Username: " . $token['username'] . "\n";
        echo "Email: " . $token['email'] . "\n";
        echo "Auth Token: " . substr($token['auth_token'], 0, 20) . "...\n";
        echo "---\n";
    }
    
    // Check specifically for Guest user
    echo "\n=== GUEST USER AUTH TOKENS ===\n";
    $stmt = $pdo->prepare("
        SELECT up.preference_value as auth_token, up.user_id
        FROM user_preferences up
        JOIN users u ON up.user_id = u.id
        WHERE up.preference_key = 'auth_token' AND u.username = 'guest'
    ");
    $stmt->execute();
    $guestTokens = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Guest user has " . count($guestTokens) . " auth token(s):\n";
    foreach ($guestTokens as $token) {
        echo "User ID: " . $token['user_id'] . "\n";
        echo "Token: " . substr($token['auth_token'], 0, 20) . "...\n";
    }
    
    // Check for duplicate tokens
    echo "\n=== DUPLICATE TOKEN CHECK ===\n";
    $stmt = $pdo->prepare("
        SELECT preference_value as auth_token, COUNT(*) as count
        FROM user_preferences
        WHERE preference_key = 'auth_token'
        GROUP BY preference_value
        HAVING COUNT(*) > 1
    ");
    $stmt->execute();
    $duplicates = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($duplicates)) {
        echo "✅ No duplicate auth tokens found\n";
    } else {
        echo "❌ Found duplicate auth tokens:\n";
        foreach ($duplicates as $dup) {
            echo "Token: " . substr($dup['auth_token'], 0, 20) . "... (used " . $dup['count'] . " times)\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
