<?php
/**
 * Simple Signup Test
 * Tests the signup process without header conflicts
 */

// Disable output buffering to avoid header issues
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

echo "Testing signup with data:\n";
print_r($_POST);
echo "\n\n";

// Include the signup file
try {
    include 'php/api/auth/signup.php';
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
?>

