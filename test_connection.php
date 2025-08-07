<?php
/**
 * Database Connection Test Script
 * Kanban Board Project - Web Programming 10636316
 * 
 * Run this script to test your database connection and setup
 */

// Include configuration
require_once 'config.php';

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Database Connection Test - Kanban Board</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background-color: #f5f7fa;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .success { color: #27ae60; }
        .error { color: #e74c3c; }
        .info { color: #3498db; }
        .test-item {
            margin: 15px 0;
            padding: 10px;
            border-left: 4px solid #ddd;
            background: #f8f9fa;
        }
        .test-item.success { border-left-color: #27ae60; }
        .test-item.error { border-left-color: #e74c3c; }
        .test-item.info { border-left-color: #3498db; }
        pre {
            background: #2c3e50;
            color: #ecf0f1;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            background: #3498db;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 5px;
        }
        .button:hover {
            background: #2980b9;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🗂️ Kanban Board - Database Connection Test</h1>
        
        <?php
        echo "<div class='test-item info'>";
        echo "<h3>📋 Application Configuration</h3>";
        echo "<p><strong>App Name:</strong> " . APP_NAME . "</p>";
        echo "<p><strong>Version:</strong> " . APP_VERSION . "</p>";
        echo "<p><strong>Environment:</strong> " . ENVIRONMENT . "</p>";
        echo "<p><strong>Debug Mode:</strong> " . (DEBUG_MODE ? 'Enabled' : 'Disabled') . "</p>";
        echo "<p><strong>Timezone:</strong> " . DEFAULT_TIMEZONE . "</p>";
        echo "</div>";
        
        // Test database connection
        echo "<div class='test-item'>";
        echo "<h3>🔌 Database Connection Test</h3>";
        
        try {
            $pdo = getDBConnection();
            echo "<p class='success'>✅ Database connection successful!</p>";
            echo "<p><strong>Database:</strong> " . DB_NAME . "</p>";
            echo "<p><strong>Host:</strong> " . DB_HOST . "</p>";
            
            // Test if tables exist
            $tables = ['projects', 'tasks'];
            $existingTables = [];
            
            foreach ($tables as $table) {
                $stmt = $pdo->prepare("SHOW TABLES LIKE ?");
                $stmt->execute([$table]);
                if ($stmt->rowCount() > 0) {
                    $existingTables[] = $table;
                }
            }
            
            if (count($existingTables) === count($tables)) {
                echo "<p class='success'>✅ All required tables exist</p>";
                
                // Count records
                $stmt = $pdo->query("SELECT COUNT(*) as count FROM projects");
                $projectCount = $stmt->fetch()['count'];
                
                $stmt = $pdo->query("SELECT COUNT(*) as count FROM tasks");
                $taskCount = $stmt->fetch()['count'];
                
                echo "<p><strong>Projects:</strong> $projectCount</p>";
                echo "<p><strong>Tasks:</strong> $taskCount</p>";
                
            } else {
                echo "<p class='error'>❌ Missing tables. Please run the installation script.</p>";
                echo "<p>Missing: " . implode(', ', array_diff($tables, $existingTables)) . "</p>";
            }
            
        } catch (Exception $e) {
            echo "<p class='error'>❌ Database connection failed: " . $e->getMessage() . "</p>";
        }
        echo "</div>";
        
        // Test security functions
        echo "<div class='test-item'>";
        echo "<h3>🔒 Security Functions Test</h3>";
        
        // Test input sanitization
        $testInput = "<script>alert('xss')</script>Hello World";
        $sanitized = sanitizeInput($testInput);
        echo "<p><strong>Input Sanitization Test:</strong></p>";
        echo "<p>Original: <code>" . htmlspecialchars($testInput) . "</code></p>";
        echo "<p>Sanitized: <code>$sanitized</code></p>";
        
        if ($sanitized !== $testInput) {
            echo "<p class='success'>✅ Input sanitization working correctly</p>";
        } else {
            echo "<p class='error'>❌ Input sanitization may not be working</p>";
        }
        
        // Test validation functions
        $validPriority = validatePriority('high');
        $invalidPriority = validatePriority('invalid');
        
        echo "<p><strong>Validation Functions:</strong></p>";
        echo "<p>Valid priority 'high': " . ($validPriority ? '✅ Pass' : '❌ Fail') . "</p>";
        echo "<p>Invalid priority 'invalid': " . (!$invalidPriority ? '✅ Pass' : '❌ Fail') . "</p>";
        
        echo "</div>";
        
        // File structure test
        echo "<div class='test-item'>";
        echo "<h3>📁 File Structure Test</h3>";
        
        $requiredFiles = [
            'css/styles.css',
            'js/app.js',
            'php/config/database.php',
            'php/includes/functions.php',
            'php/includes/security.php',
            'config.php'
        ];
        
        $missingFiles = [];
        foreach ($requiredFiles as $file) {
            if (!file_exists($file)) {
                $missingFiles[] = $file;
            }
        }
        
        if (empty($missingFiles)) {
            echo "<p class='success'>✅ All required files exist</p>";
        } else {
            echo "<p class='error'>❌ Missing files:</p>";
            echo "<ul>";
            foreach ($missingFiles as $file) {
                echo "<li>$file</li>";
            }
            echo "</ul>";
        }
        echo "</div>";
        
        // Next steps
        echo "<div class='test-item info'>";
        echo "<h3>🚀 Next Steps</h3>";
        
        if (empty($missingFiles) && isset($pdo)) {
            echo "<p>✅ Your setup is ready! You can now:</p>";
            echo "<ol>";
            echo "<li>Start developing the frontend (Phase 3)</li>";
            echo "<li>Create API endpoints (Phase 2)</li>";
            echo "<li>Test the application</li>";
            echo "</ol>";
            
            echo "<a href='php/setup/install.php' class='button'>Run Database Installation</a>";
            echo "<a href='index.html' class='button'>View Application</a>";
        } else {
            echo "<p>❌ Please fix the issues above before proceeding.</p>";
        }
        echo "</div>";
        ?>
        
        <div class="test-item">
            <h3>📖 Installation Instructions</h3>
            <p>If you haven't set up the database yet, follow these steps:</p>
            <pre>
1. Make sure MySQL is running
2. Update database credentials in php/config/database.php
3. Run: php php/setup/install.php
4. Or import database_setup.sql manually
5. Refresh this page to test again
            </pre>
        </div>
    </div>
</body>
</html>
