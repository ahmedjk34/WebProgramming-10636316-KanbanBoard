<?php
/**
 * Simple User Insert Test
 * Tests basic user insertion without verification token
 */

echo "=== Simple User Insert Test ===\n\n";

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
    
    // Insert user without verification token
    echo "Inserting user without verification token...\n";
    $insertStmt = $pdo->prepare("
        INSERT INTO users (username, email, password_hash, first_name, last_name) 
        VALUES (?, ?, ?, ?, ?)
    ");
    
    $result = $insertStmt->execute([
        $username,
        $email,
        password_hash('test123', PASSWORD_DEFAULT),
        'Test',
        'User'
    ]);
    
    if ($result) {
        $userId = $pdo->lastInsertId();
        echo "✅ User inserted successfully with ID: $userId\n";
        
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

