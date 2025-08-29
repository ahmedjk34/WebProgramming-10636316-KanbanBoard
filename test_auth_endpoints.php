<?php
/**
 * Test Authentication Endpoints
 * This file will help us debug authentication issues systematically
 */

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>🔐 Authentication Endpoints Test</h1>\n";
echo "<style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .test { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
    .success { background-color: #d4edda; border-color: #c3e6cb; }
    .error { background-color: #f8d7da; border-color: #f5c6cb; }
    .info { background-color: #d1ecf1; border-color: #bee5eb; }
    pre { background: #f8f9fa; padding: 10px; border-radius: 3px; overflow-x: auto; }
</style>\n";

// Test 1: Check if required files exist
echo "<div class='test info'>\n";
echo "<h3>📁 File Existence Check</h3>\n";

$requiredFiles = [
    'php/config/database.php',
    'php/includes/security.php',
    'utils/php-utils.php',
    'php/api/auth/login.php',
    'php/api/auth/signup.php',
    'php/api/auth/guest_login.php'
];

foreach ($requiredFiles as $file) {
    if (file_exists($file)) {
        echo "✅ $file exists<br>\n";
    } else {
        echo "❌ $file missing<br>\n";
    }
}
echo "</div>\n";

// Test 2: Check database connection
echo "<div class='test info'>\n";
echo "<h3>🗄️ Database Connection Test</h3>\n";

try {
    require_once 'php/config/database.php';
    $pdo = getDBConnection();
    echo "✅ Database connection successful<br>\n";
    
    // Check if users table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
    if ($stmt->rowCount() > 0) {
        echo "✅ Users table exists<br>\n";
    } else {
        echo "❌ Users table missing<br>\n";
    }
    
} catch (Exception $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "<br>\n";
}
echo "</div>\n";

// Test 3: Test login endpoint with invalid data
echo "<div class='test info'>\n";
echo "<h3>🔑 Login Endpoint Test (Invalid Data)</h3>\n";

// Simulate a POST request to login.php
$_POST = [
    'email' => 'test@example.com',
    'password' => 'wrongpassword'
];

// Capture output
ob_start();
try {
    include 'php/api/auth/login.php';
    $output = ob_get_clean();
    
    echo "<h4>Response:</h4>\n";
    echo "<pre>" . htmlspecialchars($output) . "</pre>\n";
    
    // Try to decode JSON
    $response = json_decode($output, true);
    if ($response) {
        if (isset($response['success']) && !$response['success']) {
            echo "✅ Login endpoint working (correctly rejected invalid credentials)<br>\n";
        } else {
            echo "⚠️ Unexpected response format<br>\n";
        }
    } else {
        echo "❌ Invalid JSON response<br>\n";
    }
    
} catch (Exception $e) {
    ob_end_clean();
    echo "❌ Login endpoint error: " . $e->getMessage() . "<br>\n";
}
echo "</div>\n";

// Test 4: Test signup endpoint with invalid data
echo "<div class='test info'>\n";
echo "<h3>📝 Signup Endpoint Test (Invalid Data)</h3>\n";

// Simulate a POST request to signup.php
$_POST = [
    'first_name' => 'Test',
    'last_name' => 'User',
    'email' => 'invalid-email',
    'username' => 'test',
    'password' => '123'
];

// Capture output
ob_start();
try {
    include 'php/api/auth/signup.php';
    $output = ob_get_clean();
    
    echo "<h4>Response:</h4>\n";
    echo "<pre>" . htmlspecialchars($output) . "</pre>\n";
    
    // Try to decode JSON
    $response = json_decode($output, true);
    if ($response) {
        if (isset($response['success']) && !$response['success']) {
            echo "✅ Signup endpoint working (correctly rejected invalid data)<br>\n";
        } else {
            echo "⚠️ Unexpected response format<br>\n";
        }
    } else {
        echo "❌ Invalid JSON response<br>\n";
    }
    
} catch (Exception $e) {
    ob_end_clean();
    echo "❌ Signup endpoint error: " . $e->getMessage() . "<br>\n";
}
echo "</div>\n";

// Test 5: Test guest login endpoint
echo "<div class='test info'>\n";
echo "<h3>👤 Guest Login Endpoint Test</h3>\n";

// Simulate a POST request to guest_login.php
$_POST = [];

// Capture output
ob_start();
try {
    include 'php/api/auth/guest_login.php';
    $output = ob_get_clean();
    
    echo "<h4>Response:</h4>\n";
    echo "<pre>" . htmlspecialchars($output) . "</pre>\n";
    
    // Try to decode JSON
    $response = json_decode($output, true);
    if ($response) {
        if (isset($response['success'])) {
            if ($response['success']) {
                echo "✅ Guest login endpoint working<br>\n";
            } else {
                echo "⚠️ Guest login failed: " . ($response['message'] ?? 'Unknown error') . "<br>\n";
            }
        } else {
            echo "⚠️ Unexpected response format<br>\n";
        }
    } else {
        echo "❌ Invalid JSON response<br>\n";
    }
    
} catch (Exception $e) {
    ob_end_clean();
    echo "❌ Guest login endpoint error: " . $e->getMessage() . "<br>\n";
}
echo "</div>\n";

// Test 6: Check session configuration
echo "<div class='test info'>\n";
echo "<h3>🔒 Session Configuration Test</h3>\n";

if (file_exists('php/config/session.php')) {
    echo "✅ Session config file exists<br>\n";
    try {
        require_once 'php/config/session.php';
        echo "✅ Session config loaded successfully<br>\n";
    } catch (Exception $e) {
        echo "❌ Session config error: " . $e->getMessage() . "<br>\n";
    }
} else {
    echo "❌ Session config file missing<br>\n";
}
echo "</div>\n";

echo "<h2>🎯 Test Summary</h2>\n";
echo "<p>Check the results above to identify any authentication issues.</p>\n";
?>
