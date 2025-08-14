<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GROQ API Test - Kanban Board</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: #2d3748;
            border-bottom: 3px solid #4299e1;
            padding-bottom: 10px;
        }
        .test-section {
            margin: 30px 0;
            padding: 20px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            background: #f7fafc;
        }
        .success {
            background: #f0fff4;
            border-color: #68d391;
            color: #22543d;
        }
        .error {
            background: #fed7d7;
            border-color: #fc8181;
            color: #742a2a;
        }
        .warning {
            background: #fefcbf;
            border-color: #f6e05e;
            color: #744210;
        }
        pre {
            background: #2d3748;
            color: #e2e8f0;
            padding: 15px;
            border-radius: 6px;
            overflow-x: auto;
            white-space: pre-wrap;
        }
        .form-section {
            margin: 20px 0;
        }
        textarea {
            width: 100%;
            min-height: 100px;
            padding: 10px;
            border: 1px solid #cbd5e0;
            border-radius: 6px;
            font-family: inherit;
        }
        button {
            background: #4299e1;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background: #3182ce;
        }
        .json-output {
            background: #1a202c;
            color: #e2e8f0;
            padding: 15px;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            white-space: pre-wrap;
            max-height: 400px;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 GROQ API Test - Kanban Board</h1>
        <p>Test the GROQ API integration for AI-powered task planning</p>

        <?php
        require_once 'utils/groq-api.php';
        require_once 'utils/env-loader.php';

        // Test 1: Environment Configuration
        echo '<div class="test-section">';
        echo '<h2>🔧 Environment Configuration Test</h2>';
        
        $apiKey = env('GROQ_API_KEY');
        if ($apiKey && $apiKey !== 'your_groq_api_key_here') {
            echo '<div class="success">✅ GROQ API key is configured</div>';
            echo '<p>API Key: ' . substr($apiKey, 0, 8) . '...' . substr($apiKey, -4) . '</p>';
        } else {
            echo '<div class="error">❌ GROQ API key not configured</div>';
            echo '<p>Please set your GROQ API key in the .env file</p>';
        }
        
        echo '<p>API URL: ' . env('GROQ_API_URL') . '</p>';
        echo '<p>Model: ' . env('GROQ_MODEL') . '</p>';
        echo '</div>';

        // Test 2: API Connection
        echo '<div class="test-section">';
        echo '<h2>🌐 API Connection Test</h2>';
        
        try {
            $groq = new GroqAPI();
            $connectionTest = $groq->testConnection();
            
            if ($connectionTest['success']) {
                echo '<div class="success">✅ ' . $connectionTest['message'] . '</div>';
                echo '<p><strong>AI Response:</strong> ' . htmlspecialchars($connectionTest['response']) . '</p>';
            } else {
                echo '<div class="error">❌ ' . $connectionTest['message'] . '</div>';
                echo '<p><strong>Error:</strong> ' . htmlspecialchars($connectionTest['error']) . '</p>';
            }
        } catch (Exception $e) {
            echo '<div class="error">❌ Connection failed: ' . htmlspecialchars($e->getMessage()) . '</div>';
        }
        echo '</div>';

        // Test 3: Task Planning Test
        if (isset($_POST['test_plan'])) {
            echo '<div class="test-section">';
            echo '<h2>📋 Task Planning Test Results</h2>';
            
            $userPlan = $_POST['user_plan'];
            echo '<p><strong>Input Plan:</strong> ' . htmlspecialchars($userPlan) . '</p>';
            
            try {
                $groq = new GroqAPI();
                $result = $groq->generateTaskPlan($userPlan);
                
                echo '<div class="success">✅ Task plan generated successfully!</div>';
                echo '<h3>Generated Project & Tasks:</h3>';
                echo '<div class="json-output">' . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . '</div>';
                
                // Validate the structure
                if (isset($result['project']) && isset($result['tasks'])) {
                    echo '<div class="success">✅ JSON structure is valid</div>';
                    echo '<p>Project: ' . htmlspecialchars($result['project']['name']) . '</p>';
                    echo '<p>Tasks count: ' . count($result['tasks']) . '</p>';
                    echo '<p>Workspace ID: ' . $result['project']['workspace_id'] . '</p>';
                } else {
                    echo '<div class="error">❌ Invalid JSON structure</div>';
                }
                
            } catch (Exception $e) {
                echo '<div class="error">❌ Task planning failed: ' . htmlspecialchars($e->getMessage()) . '</div>';
            }
            echo '</div>';
        }
        ?>

        <!-- Interactive Test Form -->
        <div class="test-section">
            <h2>🧪 Interactive Task Planning Test</h2>
            <form method="POST">
                <div class="form-section">
                    <label for="user_plan"><strong>Enter your daily plan:</strong></label>
                    <textarea name="user_plan" id="user_plan" placeholder="Example: I want to study 3 chapters of ML, and then workout which is very important to me. Then work on my homework which isn't that urgent, all the deadlines are within 2 days from now"><?php echo isset($_POST['user_plan']) ? htmlspecialchars($_POST['user_plan']) : 'I want to study 3 chapters of ML, and then workout which is very important to me. Then work on my homework which isn\'t that urgent, all the deadlines are within 2 days from now'; ?></textarea>
                </div>
                <button type="submit" name="test_plan">🚀 Generate Task Plan</button>
                <button type="submit" name="test_full_integration">🔗 Test Full Integration (Create in Database)</button>
            </form>
        </div>

        <?php
        // Test 4: Full Integration Test
        if (isset($_POST['test_full_integration'])) {
            echo '<div class="test-section">';
            echo '<h2>🔗 Full Integration Test Results</h2>';

            $userPlan = $_POST['user_plan'];
            echo '<p><strong>Input Plan:</strong> ' . htmlspecialchars($userPlan) . '</p>';

            try {
                require_once 'utils/task-planner.php';
                $taskPlanner = new TaskPlanner();
                $result = $taskPlanner->processUserPlan($userPlan);

                if ($result['success']) {
                    echo '<div class="success">✅ Full integration successful!</div>';
                    echo '<h3>Created in Database:</h3>';
                    echo '<p><strong>Project ID:</strong> ' . $result['data']['project_id'] . '</p>';
                    echo '<p><strong>Project Name:</strong> ' . htmlspecialchars($result['data']['project_name']) . '</p>';
                    echo '<p><strong>Tasks Created:</strong> ' . $result['data']['tasks_count'] . '</p>';
                    echo '<p><strong>Workspace ID:</strong> ' . $result['data']['workspace_id'] . '</p>';
                    echo '<p><strong>Task IDs:</strong> ' . implode(', ', $result['data']['task_ids']) . '</p>';

                    echo '<h3>AI Generated Data:</h3>';
                    echo '<div class="json-output">' . json_encode($result['data']['ai_plan'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . '</div>';
                } else {
                    echo '<div class="error">❌ Integration failed: ' . htmlspecialchars($result['message']) . '</div>';
                }

            } catch (Exception $e) {
                echo '<div class="error">❌ Integration test failed: ' . htmlspecialchars($e->getMessage()) . '</div>';
            }
            echo '</div>';
        }
        ?>

        <!-- Sample Test Cases -->
        <div class="test-section">
            <h2>📝 Sample Test Cases</h2>
            <p>Try these sample plans to test the AI:</p>
            
            <div style="margin: 10px 0;">
                <strong>Study Plan:</strong>
                <pre>I need to study for my machine learning exam tomorrow. I want to review 3 chapters, practice coding exercises, and create summary notes. This is very urgent.</pre>
            </div>
            
            <div style="margin: 10px 0;">
                <strong>Work & Personal Mix:</strong>
                <pre>Today I want to finish my web programming assignment which is due in 2 days, go to the gym for an hour workout, and call my family. The assignment is high priority.</pre>
            </div>
            
            <div style="margin: 10px 0;">
                <strong>Creative Project:</strong>
                <pre>I want to work on my portfolio website design, create 3 new mockups, and write content for the about page. I also need to research color schemes.</pre>
            </div>
        </div>

        <!-- API Documentation -->
        <div class="test-section">
            <h2>📚 API Usage Information</h2>
            <p>The GROQ API integration provides the following functionality:</p>
            <ul>
                <li><strong>Environment Configuration:</strong> Loads API credentials from .env file</li>
                <li><strong>Task Planning:</strong> Converts natural language plans into structured project/task data</li>
                <li><strong>Workspace Selection:</strong> Automatically assigns appropriate workspace based on task type</li>
                <li><strong>Priority Assignment:</strong> Determines task priority based on urgency keywords</li>
                <li><strong>Due Date Calculation:</strong> Sets due dates based on mentioned timeframes</li>
            </ul>
            
            <h3>Expected JSON Output Format:</h3>
            <pre>{
  "project": {
    "name": "Today's Tasks - January 14, 2025",
    "description": "Daily tasks and activities planned for January 14, 2025",
    "workspace_id": 1,
    "color": "#4facfe"
  },
  "tasks": [
    {
      "title": "Study ML Chapter 1",
      "description": "Review and understand machine learning concepts from chapter 1",
      "priority": "high",
      "status": "todo",
      "due_date": "2025-01-14"
    }
  ]
}</pre>
        </div>
    </div>
</body>
</html>
