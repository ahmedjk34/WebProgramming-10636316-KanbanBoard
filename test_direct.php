<?php
/**
 * Direct API Test
 * Test the APIs directly to see if they work
 */

echo "<h1>Direct API Testing</h1>";

echo "<h2>Testing Projects API</h2>";
try {
    // Test projects API directly
    ob_start();
    include 'php/api/projects/get_projects.php';
    $output = ob_get_clean();
    
    echo "<h3>Projects API Output:</h3>";
    echo "<pre>" . htmlspecialchars($output) . "</pre>";
    
    // Try to decode JSON
    $data = json_decode($output, true);
    if ($data) {
        echo "<p style='color: green;'>✅ Valid JSON response</p>";
        echo "<p>Success: " . ($data['success'] ? 'true' : 'false') . "</p>";
        echo "<p>Message: " . $data['message'] . "</p>";
    } else {
        echo "<p style='color: red;'>❌ Invalid JSON response</p>";
        echo "<p>JSON Error: " . json_last_error_msg() . "</p>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}

echo "<hr>";

echo "<h2>Testing Tasks API</h2>";
try {
    // Test tasks API directly
    ob_start();
    include 'php/api/tasks/get_tasks.php';
    $output = ob_get_clean();
    
    echo "<h3>Tasks API Output:</h3>";
    echo "<pre>" . htmlspecialchars($output) . "</pre>";
    
    // Try to decode JSON
    $data = json_decode($output, true);
    if ($data) {
        echo "<p style='color: green;'>✅ Valid JSON response</p>";
        echo "<p>Success: " . ($data['success'] ? 'true' : 'false') . "</p>";
        echo "<p>Message: " . $data['message'] . "</p>";
    } else {
        echo "<p style='color: red;'>❌ Invalid JSON response</p>";
        echo "<p>JSON Error: " . json_last_error_msg() . "</p>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}

echo "<hr>";

echo "<h2>Testing Database Connection</h2>";
try {
    require_once 'php/config/database.php';
    $pdo = getDBConnection();
    echo "<p style='color: green;'>✅ Database connection successful</p>";
    
    // Test projects query
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM projects");
    $projectCount = $stmt->fetch()['count'];
    echo "<p>Projects in database: " . $projectCount . "</p>";
    
    // Test tasks query
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM tasks");
    $taskCount = $stmt->fetch()['count'];
    echo "<p>Tasks in database: " . $taskCount . "</p>";
    
} catch (Exception $e) {
    echo "<p style='color: red;'>❌ Database error: " . $e->getMessage() . "</p>";
}

echo "<hr>";

echo "<h2>PHP Configuration</h2>";
echo "<p>PHP Version: " . phpversion() . "</p>";
echo "<p>Error Reporting: " . error_reporting() . "</p>";
echo "<p>Display Errors: " . ini_get('display_errors') . "</p>";

// Check if required functions exist
echo "<h3>Required Functions Check:</h3>";
$functions = ['json_encode', 'json_decode', 'htmlspecialchars', 'filter_var'];
foreach ($functions as $func) {
    if (function_exists($func)) {
        echo "<p style='color: green;'>✅ $func exists</p>";
    } else {
        echo "<p style='color: red;'>❌ $func missing</p>";
    }
}

// Check if required files exist
echo "<h3>Required Files Check:</h3>";
$files = [
    'php/config/database.php',
    'php/includes/functions.php',
    'php/includes/security.php',
    'config.php'
];

foreach ($files as $file) {
    if (file_exists($file)) {
        echo "<p style='color: green;'>✅ $file exists</p>";
    } else {
        echo "<p style='color: red;'>❌ $file missing</p>";
    }
}
?>
