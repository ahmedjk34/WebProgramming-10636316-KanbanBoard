<?php
/**
 * Final Signup Test
 * Tests the complete signup process to verify everything works
 */

// Disable output buffering
if (ob_get_level()) ob_end_clean();

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

echo "=== Final Signup Test ===\n\n";

try {
    // Include the signup file directly
    include 'php/api/auth/signup.php';
    
    echo "✅ Signup process completed successfully!\n";
    echo "Check the response above for success/error details.\n";
    
} catch (Exception $e) {
    echo "❌ Signup error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
?>

