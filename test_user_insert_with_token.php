<?php
/**
 * User Insert Test with Verification Token
 * Tests user insertion with verification token
 */

echo "=== User Insert Test with Verification Token ===\n\n";

try {
    // Load database connection
    require_once 'php/config/database.php';
    $pdo = getDBConnection();
    echo "✅ Database connection successful\n\n";
    
    // Test data
    $email = 'testuser' . time() . '@example.com';
    $username = 'testuser' . time();
    
    echo "Test data:\n";
    echo "  Email: $email\n";
    echo "  Username: $username\n\n";
    
    // Generate verification token
    echo "Generating verification token...\n";
    $verificationToken = bin2hex(random_bytes(32));
    echo "✅ Verification token generated: " . substr($verificationToken, 0, 20) . "...\n\n";
    
    // Insert user with verification token
    echo "Inserting user with verification token...\n";
    $insertStmt = $pdo->prepare("
        INSERT INTO users (username, email, password_hash, first_name, last_name, verification_token) 
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    
    $result = $insertStmt->execute([
        $username,
        $email,
        password_hash('test123', PASSWORD_DEFAULT),
        'Test',
        'User',
        $verificationToken
    ]);
    
    if ($result) {
        $userId = $pdo->lastInsertId();
        echo "✅ User inserted successfully with ID: $userId\n";
        
        // Verify the token was stored correctly
        $checkStmt = $pdo->prepare("SELECT verification_token FROM users WHERE id = ?");
        $checkStmt->execute([$userId]);
        $storedToken = $checkStmt->fetchColumn();
        
        if ($storedToken === $verificationToken) {
            echo "✅ Verification token stored correctly\n";
        } else {
            echo "❌ Verification token mismatch\n";
        }
        
        // Clean up
        $deleteStmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $deleteStmt->execute([$userId]);
        echo "✅ Test user deleted successfully\n";
    } else {
        echo "❌ Failed to insert user\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
?>

