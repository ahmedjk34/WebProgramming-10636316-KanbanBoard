<?php
/**
 * Detailed Database Test
 * Tests database connection and query execution in detail
 */

echo "=== Detailed Database Test ===\n\n";

try {
    // Load database connection
    echo "Loading database connection...\n";
    require_once 'php/config/database.php';
    $pdo = getDBConnection();
    echo "✅ Database connection successful\n\n";
    
    // Test basic query
    echo "Testing basic query...\n";
    $stmt = $pdo->query("SELECT 1 as test");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "✅ Basic query successful: " . $result['test'] . "\n\n";
    
    // Test users table query
    echo "Testing users table query...\n";
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "✅ Users table query successful: " . $result['count'] . " users\n\n";
    
    // Test prepared statement
    echo "Testing prepared statement...\n";
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM users WHERE email = ?");
    $stmt->execute(['nonexistent@example.com']);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "✅ Prepared statement successful: " . $result['count'] . " matches\n\n";
    
    // Test insert with error handling
    echo "Testing insert with error handling...\n";
    $email = 'testuser' . time() . '@example.com';
    $username = 'testuser' . time();
    
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
        echo "✅ Insert successful: User ID $userId\n";
        
        // Clean up
        $deleteStmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $deleteResult = $deleteStmt->execute([$userId]);
        if ($deleteResult) {
            echo "✅ Delete successful\n";
        } else {
            echo "❌ Delete failed\n";
        }
    } else {
        echo "❌ Insert failed\n";
        $errorInfo = $insertStmt->errorInfo();
        echo "Error info: " . print_r($errorInfo, true) . "\n";
    }
    
    echo "\n🎉 All database tests completed successfully!\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
?>

