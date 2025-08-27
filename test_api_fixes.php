<?php
/**
 * Quick test script to verify API fixes
 */

// Start session
session_start();

// Simulate a logged-in user (guest user)
$_SESSION['user_id'] = 2;

echo "<h1>Testing API Fixes</h1>";

// Test 1: Get Projects
echo "<h2>Test 1: Get Projects (workspace 4)</h2>";
$url = 'http://localhost/php/api/projects/get_projects.php?workspace_id=4';
$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => 'Content-Type: application/json'
    ]
]);

$response = file_get_contents($url, false, $context);
echo "<pre>Response: " . htmlspecialchars($response) . "</pre>";

// Test 2: Get Tasks
echo "<h2>Test 2: Get Tasks (workspace 4)</h2>";
$url = 'http://localhost/php/api/tasks/get_tasks.php?workspace_id=4';
$response = file_get_contents($url, false, $context);
echo "<pre>Response: " . htmlspecialchars($response) . "</pre>";

// Test 3: Get Workspaces
echo "<h2>Test 3: Get Workspaces</h2>";
$url = 'http://localhost/php/api/workspaces/get_workspaces.php';
$response = file_get_contents($url, false, $context);
echo "<pre>Response: " . htmlspecialchars($response) . "</pre>";

echo "<h2>Test Complete!</h2>";
?>
