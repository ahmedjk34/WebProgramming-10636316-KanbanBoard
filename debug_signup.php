<?php
/**
 * Debug Signup Process
 * This script will help identify the specific issue with user registration
 */

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>🔍 Signup Debug Process</h1>\n";
echo "<style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .debug { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
    .success { background-color: #d4edda; border-color: #c3e6cb; }
    .error { background-color: #f8d7da; border-color: #f5c6cb; }
    .info { background-color: #d1ecf1; border-color: #bee5eb; }
    pre { background: #f8f9fa; padding: 10px; border-radius: 3px; overflow-x: auto; }
</style>\n";

// Test 1: Check database connection and tables
echo "<div class='debug info'>\n";
echo "<h3>🗄️ Database Connection and Tables Check</h3>\n";

try {
    require_once 'php/config/database.php';
    $pdo = getDBConnection();
    echo "✅ Database connection successful<br>\n";
    
    // Check if required tables exist
    $tables = ['users', 'workspaces', 'projects', 'user_preferences'];
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($stmt->rowCount() > 0) {
            echo "✅ Table '$table' exists<br>\n";
        } else {
            echo "❌ Table '$table' missing<br>\n";
        }
    }
    
    // Check users table structure
    echo "<h4>Users Table Structure:</h4>\n";
    $stmt = $pdo->query("DESCRIBE users");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "<pre>";
    foreach ($columns as $column) {
        echo "{$column['Field']} - {$column['Type']} - {$column['Null']} - {$column['Key']} - {$column['Default']}\n";
    }
    echo "</pre>";
    
} catch (Exception $e) {
    echo "❌ Database error: " . $e->getMessage() . "<br>\n";
}
echo "</div>\n";

// Test 2: Check if required functions exist
echo "<div class='debug info'>\n";
echo "<h3>🔧 Function Availability Check</h3>\n";

// Load required files first
try {
    require_once 'utils/php-utils.php';
    require_once 'php/includes/security.php';
    echo "✅ Required files loaded successfully<br>\n";
} catch (Exception $e) {
    echo "❌ Error loading files: " . $e->getMessage() . "<br>\n";
}

$requiredFunctions = [
    'sanitizeAndValidate',
    'generateSecureToken',
    'getDBConnection'
];

foreach ($requiredFunctions as $function) {
    if (function_exists($function)) {
        echo "✅ Function '$function' exists<br>\n";
    } else {
        echo "❌ Function '$function' missing<br>\n";
    }
}
echo "</div>\n";

// Test 3: Test signup with detailed error reporting
echo "<div class='debug info'>\n";
echo "<h3>📝 Signup Process Test</h3>\n";

// Simulate signup data
$_POST = [
    'first_name' => 'Test',
    'last_name' => 'User',
    'email' => 'testuser' . time() . '@example.com',
    'username' => 'testuser' . time(),
    'password' => 'TestPassword123!',
    'confirm_password' => 'TestPassword123!',
    'terms' => 'on'
];

// Set request method to POST
$_SERVER['REQUEST_METHOD'] = 'POST';

echo "<h4>Test Data:</h4>\n";
echo "<pre>" . print_r($_POST, true) . "</pre>\n";

// Capture all output and errors
ob_start();

try {
    // Include the signup file
    include 'php/api/auth/signup.php';
    $output = ob_get_clean();
    
    echo "<h4>Signup Response:</h4>\n";
    echo "<pre>" . htmlspecialchars($output) . "</pre>\n";
    
    // Try to decode JSON
    $response = json_decode($output, true);
    if ($response) {
        if ($response['success']) {
            echo "✅ Signup successful!<br>\n";
            echo "User ID: " . $response['data']['user']['id'] . "<br>\n";
            echo "Username: " . $response['data']['user']['username'] . "<br>\n";
        } else {
            echo "❌ Signup failed: " . $response['message'] . "<br>\n";
            if (isset($response['errors'])) {
                echo "<h4>Validation Errors:</h4>\n";
                echo "<pre>" . print_r($response['errors'], true) . "</pre>\n";
            }
        }
    } else {
        echo "❌ Invalid JSON response<br>\n";
    }
    
} catch (Exception $e) {
    ob_end_clean();
    echo "❌ Signup error: " . $e->getMessage() . "<br>\n";
    echo "Stack trace: <pre>" . $e->getTraceAsString() . "</pre>\n";
}
echo "</div>\n";

// Test 4: Check PHP error log
echo "<div class='debug info'>\n";
echo "<h3>📋 PHP Error Log Check</h3>\n";

$errorLog = ini_get('error_log');
if ($errorLog && file_exists($errorLog)) {
    echo "✅ Error log file exists: $errorLog<br>\n";
    $recentErrors = file_get_contents($errorLog);
    if ($recentErrors) {
        echo "<h4>Recent Errors:</h4>\n";
        echo "<pre>" . htmlspecialchars(substr($recentErrors, -1000)) . "</pre>\n";
    } else {
        echo "No recent errors found<br>\n";
    }
} else {
    echo "❌ Error log not found or not configured<br>\n";
}
echo "</div>\n";

// Test 5: Check file permissions
echo "<div class='debug info'>\n";
echo "<h3>🔐 File Permissions Check</h3>\n";

$files = [
    'php/api/auth/signup.php',
    'php/config/database.php',
    'utils/php-utils.php',
    'php/includes/security.php'
];

foreach ($files as $file) {
    if (file_exists($file)) {
        $perms = fileperms($file);
        $perms = substr(sprintf('%o', $perms), -4);
        echo "✅ $file - Permissions: $perms<br>\n";
    } else {
        echo "❌ $file - File not found<br>\n";
    }
}
echo "</div>\n";

echo "<h2>🎯 Debug Summary</h2>\n";
echo "<p>Check the results above to identify the specific signup issue.</p>\n";
?>
