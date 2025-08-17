<?php
/**
 * Database Extensions Test Script
 * Phase 1: Analytics Dashboard & Multiple Board Views
 * 
 * Tests the new database schema extensions for analytics and view preferences
 */

require_once 'config.php';

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Database Extensions Test - Phase 1</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1000px;
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
        .warning { color: #f39c12; }
        .test-section {
            margin: 20px 0;
            padding: 15px;
            border-left: 4px solid #ddd;
            background: #f8f9fa;
        }
        .test-section.success { border-left-color: #27ae60; }
        .test-section.error { border-left-color: #e74c3c; }
        .test-section.info { border-left-color: #3498db; }
        .test-section.warning { border-left-color: #f39c12; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
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
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 15px 0;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #3498db;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Database Extensions Test - Phase 1</h1>
        <p>Testing new database schema for Analytics Dashboard & Multiple Board Views</p>
        
        <?php
        try {
            $pdo = getDBConnection();
            
            // Test 1: Check if new tables exist
            echo "<div class='test-section info'>";
            echo "<h3>🗄️ Table Structure Test</h3>";
            
            $newTables = [
                'workspaces' => 'Workspace management',
                'user_preferences' => 'User view preferences',
                'task_activity_log' => 'Analytics activity tracking',
                'project_analytics' => 'Project analytics data'
            ];
            
            $existingTables = [];
            foreach ($newTables as $table => $description) {
                try {
                    $stmt = $pdo->query("DESCRIBE `$table`");
                    if ($stmt) {
                        $existingTables[$table] = true;
                        echo "<p class='success'>✅ $table - $description</p>";
                    }
                } catch (PDOException $e) {
                    $existingTables[$table] = false;
                    echo "<p class='error'>❌ $table - Missing</p>";
                }
            }
            echo "</div>";
            
            // Test 2: Check workspace data
            if ($existingTables['workspaces']) {
                echo "<div class='test-section success'>";
                echo "<h3>🏢 Workspaces Test</h3>";
                
                $stmt = $pdo->query("SELECT * FROM workspaces ORDER BY id");
                $workspaces = $stmt->fetchAll();
                
                if (count($workspaces) > 0) {
                    echo "<p class='success'>✅ Found " . count($workspaces) . " workspaces</p>";
                    echo "<table>";
                    echo "<tr><th>ID</th><th>Name</th><th>Icon</th><th>Color</th><th>Default</th></tr>";
                    foreach ($workspaces as $workspace) {
                        $isDefault = $workspace['is_default'] ? 'Yes' : 'No';
                        echo "<tr>";
                        echo "<td>{$workspace['id']}</td>";
                        echo "<td>{$workspace['name']}</td>";
                        echo "<td>{$workspace['icon']}</td>";
                        echo "<td><span style='color: {$workspace['color']}'>{$workspace['color']}</span></td>";
                        echo "<td>$isDefault</td>";
                        echo "</tr>";
                    }
                    echo "</table>";
                } else {
                    echo "<p class='warning'>⚠️ No workspaces found. Run installation script.</p>";
                }
                echo "</div>";
            }
            
            // Test 3: Check projects with workspace association
            echo "<div class='test-section info'>";
            echo "<h3>📁 Projects with Workspaces Test</h3>";
            
            try {
                $stmt = $pdo->query("
                    SELECT p.*, w.name as workspace_name, w.icon as workspace_icon 
                    FROM projects p 
                    LEFT JOIN workspaces w ON p.workspace_id = w.id 
                    ORDER BY p.workspace_id, p.id
                ");
                $projects = $stmt->fetchAll();
                
                if (count($projects) > 0) {
                    echo "<p class='success'>✅ Found " . count($projects) . " projects with workspace associations</p>";
                    echo "<table>";
                    echo "<tr><th>Project</th><th>Workspace</th><th>Status</th><th>Color</th></tr>";
                    foreach ($projects as $project) {
                        echo "<tr>";
                        echo "<td>{$project['name']}</td>";
                        echo "<td>{$project['workspace_icon']} {$project['workspace_name']}</td>";
                        echo "<td>{$project['status']}</td>";
                        echo "<td><span style='color: {$project['color']}'>{$project['color']}</span></td>";
                        echo "</tr>";
                    }
                    echo "</table>";
                } else {
                    echo "<p class='warning'>⚠️ No projects found.</p>";
                }
            } catch (PDOException $e) {
                echo "<p class='error'>❌ Error checking projects: " . $e->getMessage() . "</p>";
            }
            echo "</div>";
            
            // Test 4: Check analytics views
            echo "<div class='test-section info'>";
            echo "<h3>📈 Analytics Views Test</h3>";
            
            $views = ['task_statistics', 'analytics_overview'];
            foreach ($views as $view) {
                try {
                    $stmt = $pdo->query("SELECT * FROM $view LIMIT 5");
                    $data = $stmt->fetchAll();
                    echo "<p class='success'>✅ View '$view' working - " . count($data) . " records</p>";
                } catch (PDOException $e) {
                    echo "<p class='error'>❌ View '$view' error: " . $e->getMessage() . "</p>";
                }
            }
            echo "</div>";
            
            // Test 5: Sample analytics data
            if ($existingTables['task_activity_log']) {
                echo "<div class='test-section info'>";
                echo "<h3>📊 Sample Analytics Data</h3>";
                
                // Get basic statistics
                $stats = [];
                
                // Total tasks by status
                $stmt = $pdo->query("
                    SELECT status, COUNT(*) as count 
                    FROM tasks 
                    GROUP BY status
                ");
                $taskStats = $stmt->fetchAll();
                
                // Tasks created in last 7 days
                $stmt = $pdo->query("
                    SELECT COUNT(*) as count 
                    FROM tasks 
                    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                ");
                $recentTasks = $stmt->fetch()['count'];
                
                // Completion rate
                $stmt = $pdo->query("
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed
                    FROM tasks
                ");
                $completion = $stmt->fetch();
                $completionRate = $completion['total'] > 0 ? 
                    round(($completion['completed'] / $completion['total']) * 100, 1) : 0;
                
                echo "<div class='stats-grid'>";
                echo "<div class='stat-card'>";
                echo "<div class='stat-number'>{$completion['total']}</div>";
                echo "<div>Total Tasks</div>";
                echo "</div>";
                
                echo "<div class='stat-card'>";
                echo "<div class='stat-number'>{$completion['completed']}</div>";
                echo "<div>Completed Tasks</div>";
                echo "</div>";
                
                echo "<div class='stat-card'>";
                echo "<div class='stat-number'>{$completionRate}%</div>";
                echo "<div>Completion Rate</div>";
                echo "</div>";
                
                echo "<div class='stat-card'>";
                echo "<div class='stat-number'>$recentTasks</div>";
                echo "<div>Tasks This Week</div>";
                echo "</div>";
                echo "</div>";
                
                if (count($taskStats) > 0) {
                    echo "<h4>Tasks by Status:</h4>";
                    echo "<table>";
                    echo "<tr><th>Status</th><th>Count</th></tr>";
                    foreach ($taskStats as $stat) {
                        echo "<tr><td>{$stat['status']}</td><td>{$stat['count']}</td></tr>";
                    }
                    echo "</table>";
                }
                
                echo "</div>";
            }
            
            // Test 6: User preferences
            if ($existingTables['user_preferences']) {
                echo "<div class='test-section info'>";
                echo "<h3>⚙️ User Preferences Test</h3>";
                
                $stmt = $pdo->query("SELECT * FROM user_preferences ORDER BY preference_key");
                $preferences = $stmt->fetchAll();
                
                if (count($preferences) > 0) {
                    echo "<p class='success'>✅ Found " . count($preferences) . " user preferences</p>";
                    echo "<table>";
                    echo "<tr><th>Key</th><th>Value</th><th>Workspace</th></tr>";
                    foreach ($preferences as $pref) {
                        $workspace = $pref['workspace_id'] ? "Workspace {$pref['workspace_id']}" : "Global";
                        echo "<tr>";
                        echo "<td>{$pref['preference_key']}</td>";
                        echo "<td>{$pref['preference_value']}</td>";
                        echo "<td>$workspace</td>";
                        echo "</tr>";
                    }
                    echo "</table>";
                } else {
                    echo "<p class='warning'>⚠️ No user preferences found. Run installation script.</p>";
                }
                echo "</div>";
            }
            
        } catch (Exception $e) {
            echo "<div class='test-section error'>";
            echo "<h3>❌ Database Connection Error</h3>";
            echo "<p>Error: " . $e->getMessage() . "</p>";
            echo "</div>";
        }
        ?>
        
        <div class="test-section info">
            <h3>🚀 Next Steps</h3>
            <p>If all tests pass, you're ready for Phase 2: Analytics Backend APIs</p>
            <a href="php/setup/install.php" class="button">Run Installation Script</a>
            <a href="test_connection.php" class="button">Test Basic Connection</a>
            <a href="index.html" class="button">View Application</a>
        </div>
    </div>
</body>
</html>
