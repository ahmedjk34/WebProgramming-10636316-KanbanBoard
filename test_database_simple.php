<?php
/**
 * Simple Database Test
 * Tests basic database operations
 */

echo "=== Simple Database Test ===\n\n";

try {
    // Load database connection
    require_once 'php/config/database.php';
    $pdo = getDBConnection();
    echo "✅ Database connection successful\n\n";
    
    // Check if users table exists and has data
    echo "Checking users table...\n";
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "✅ Users table exists with " . $result['count'] . " records\n\n";
    
    // Check table structure
    echo "Checking users table structure...\n";
    $stmt = $pdo->query("DESCRIBE users");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Users table columns:\n";
    foreach ($columns as $column) {
        echo "  - {$column['Field']} ({$column['Type']})\n";
    }
    echo "\n";
    
    // Test a simple insert (we'll delete it after)
    echo "Testing simple insert...\n";
    $testEmail = 'test' . time() . '@example.com';
    $testUsername = 'testuser' . time();
    
    $insertStmt = $pdo->prepare("
        INSERT INTO users (username, email, password_hash, first_name, last_name) 
        VALUES (?, ?, ?, ?, ?)
    ");
    
    $result = $insertStmt->execute([
        $testUsername,
        $testEmail,
        password_hash('test123', PASSWORD_DEFAULT),
        'Test',
        'User'
    ]);
    
    if ($result) {
        $userId = $pdo->lastInsertId();
        echo "✅ Test user inserted successfully with ID: $userId\n";
        
        // Clean up - delete the test user
        $deleteStmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $deleteStmt->execute([$userId]);
        echo "✅ Test user deleted successfully\n\n";
    } else {
        echo "❌ Failed to insert test user\n\n";
    }
    
    echo "🎉 Database test completed successfully!\n";
    
} catch (Exception $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
?>

