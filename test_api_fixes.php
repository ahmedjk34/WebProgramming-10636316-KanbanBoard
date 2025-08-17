<?php
/**
 * Quick API Fixes Test
 * Tests the fixed analytics APIs
 */

header('Content-Type: text/html; charset=UTF-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>API Fixes Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .test { margin: 10px 0; padding: 10px; border-left: 4px solid #ddd; }
        .success { border-left-color: #27ae60; background: #d4edda; }
        .error { border-left-color: #e74c3c; background: #f8d7da; }
        .info { border-left-color: #3498db; background: #d1ecf1; }
    </style>
</head>
<body>
    <h1>🔧 API Fixes Test</h1>
    
    <?php
    // Test 1: Project Stats API
    echo "<div class='test info'>";
    echo "<h3>📊 Testing Project Stats API</h3>";
    
    $url1 = 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']) . '/php/api/analytics/project_stats.php?days=30';
    $response1 = @file_get_contents($url1);
    
    if ($response1) {
        $data1 = json_decode($response1, true);
        if ($data1 && $data1['success']) {
            echo "<div class='success'>✅ Project Stats API working correctly</div>";
            echo "<p>Found " . count($data1['data']['projects']) . " projects</p>";
        } else {
            echo "<div class='error'>❌ Project Stats API error: " . ($data1['message'] ?? 'Unknown error') . "</div>";
        }
    } else {
        echo "<div class='error'>❌ Could not connect to Project Stats API</div>";
    }
    echo "</div>";
    
    // Test 2: Activity Log API
    echo "<div class='test info'>";
    echo "<h3>📋 Testing Activity Log API</h3>";
    
    $url2 = 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']) . '/php/api/analytics/activity_log.php?days=7&limit=10';
    $response2 = @file_get_contents($url2);
    
    if ($response2) {
        $data2 = json_decode($response2, true);
        if ($data2 && $data2['success']) {
            echo "<div class='success'>✅ Activity Log API working correctly</div>";
            echo "<p>Found " . count($data2['data']['activities']) . " activities</p>";
        } else {
            echo "<div class='error'>❌ Activity Log API error: " . ($data2['message'] ?? 'Unknown error') . "</div>";
        }
    } else {
        echo "<div class='error'>❌ Could not connect to Activity Log API</div>";
    }
    echo "</div>";
    
    // Test 3: Preferences API
    echo "<div class='test info'>";
    echo "<h3>⚙️ Testing Preferences API</h3>";
    
    // Test update preference
    $postData = json_encode([
        'preference_key' => 'test_preference',
        'preference_value' => 'test_value_' . time()
    ]);
    
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/json',
            'content' => $postData
        ]
    ]);
    
    $url3 = 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']) . '/php/api/preferences/update_preferences.php';
    $response3 = @file_get_contents($url3, false, $context);
    
    if ($response3) {
        $data3 = json_decode($response3, true);
        if ($data3 && $data3['success']) {
            echo "<div class='success'>✅ Preferences API working correctly</div>";
            echo "<p>Action: " . $data3['data']['action'] . "</p>";
        } else {
            echo "<div class='error'>❌ Preferences API error: " . ($data3['message'] ?? 'Unknown error') . "</div>";
        }
    } else {
        echo "<div class='error'>❌ Could not connect to Preferences API</div>";
    }
    echo "</div>";
    
    echo "<div class='test success'>";
    echo "<h3>🎉 API Fixes Summary</h3>";
    echo "<p>Fixed issues:</p>";
    echo "<ul>";
    echo "<li>✅ Project Stats API - Fixed SQL parameter binding</li>";
    echo "<li>✅ Activity Log API - Fixed variable name in summary query</li>";
    echo "<li>✅ Preferences API - Fixed NULL handling in WHERE clauses</li>";
    echo "</ul>";
    echo "<p><strong>All Phase 2 APIs should now be working correctly!</strong></p>";
    echo "</div>";
    ?>
    
    <div style="text-align: center; margin: 20px 0;">
        <a href="test_analytics_apis.html" style="display: inline-block; padding: 10px 20px; background: #3498db; color: white; text-decoration: none; border-radius: 5px;">
            🧪 Test All APIs Again
        </a>
        <a href="dashboard.html" style="display: inline-block; padding: 10px 20px; background: #27ae60; color: white; text-decoration: none; border-radius: 5px; margin-left: 10px;">
            📊 Open Analytics Dashboard
        </a>
    </div>
</body>
</html>
