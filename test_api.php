<?php
/**
 * API Testing Script
 * Kanban Board Project - Web Programming 10636316
 * 
 * Tests all API endpoints to ensure they work correctly
 */

// Include configuration
require_once 'config.php';

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Testing - Kanban Board</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1000px;
            margin: 20px auto;
            padding: 20px;
            background-color: #f5f7fa;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .test-section {
            margin: 20px 0;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 8px;
        }
        .test-section h3 {
            margin-top: 0;
            color: #2c3e50;
        }
        .test-button {
            background: #3498db;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
        }
        .test-button:hover {
            background: #2980b9;
        }
        .result {
            margin: 10px 0;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            white-space: pre-wrap;
        }
        .success {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
        }
        .error {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
        }
        .info {
            background: #d1ecf1;
            border: 1px solid #bee5eb;
            color: #0c5460;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 Kanban Board API Testing</h1>
        <p>Test all API endpoints to ensure they work correctly.</p>
        
        <!-- Projects API Tests -->
        <div class="test-section">
            <h3>📁 Projects API</h3>
            <button class="test-button" onclick="testGetProjects()">
                GET Projects
            </button>
            <button class="test-button" onclick="testCreateProject()">
                CREATE Project
            </button>
            <div id="get-projects-result" class="result"></div>
            <div id="create-project-result" class="result"></div>
        </div>
        
        <!-- Tasks API Tests -->
        <div class="test-section">
            <h3>📝 Tasks API</h3>
            <button class="test-button" onclick="testGetTasks()">
                GET Tasks
            </button>
            <button class="test-button" onclick="testCreateTask()">
                CREATE Task
            </button>
            <button class="test-button" onclick="testUpdateTaskStatus()">
                UPDATE Task Status
            </button>
            <div id="get-tasks-result" class="result"></div>
            <div id="create-task-result" class="result"></div>
            <div id="update-status-result" class="result"></div>
        </div>
        
        <!-- Error Handling Tests -->
        <div class="test-section">
            <h3>⚠️ Error Handling</h3>
            <button class="test-button" onclick="testErrorHandling()">
                Test Invalid Requests
            </button>
            <div id="error-test-result" class="result"></div>
        </div>
        
        <!-- Validation Tests -->
        <div class="test-section">
            <h3>✅ Validation Tests</h3>
            <button class="test-button" onclick="testValidation()">
                Test Data Validation
            </button>
            <div id="validation-test-result" class="result"></div>
        </div>
    </div>

    <script>
        async function testAPI(method, url, data, resultId) {
            const resultDiv = document.getElementById(resultId);
            resultDiv.textContent = 'Testing...';
            resultDiv.className = 'result info';

            try {
                const options = {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };

                if (data) {
                    options.body = JSON.stringify(data);
                }

                const response = await fetch(url, options);
                const result = await response.json();

                resultDiv.textContent = 'Status: ' + response.status + '\nResponse: ' + JSON.stringify(result, null, 2);
                resultDiv.className = response.ok ? 'result success' : 'result error';

            } catch (error) {
                resultDiv.textContent = 'Error: ' + error.message;
                resultDiv.className = 'result error';
            }
        }

        async function testGetProjects() {
            await testAPI('GET', 'php/api/projects/get_projects.php', null, 'get-projects-result');
        }

        async function testGetTasks() {
            await testAPI('GET', 'php/api/tasks/get_tasks.php', null, 'get-tasks-result');
        }

        async function testCreateProject() {
            const projectData = {
                name: 'Test Project ' + Date.now(),
                description: 'A test project created by API testing',
                color: '#e74c3c'
            };

            await testAPI('POST', 'php/api/projects/create_project.php', projectData, 'create-project-result');
        }

        async function testCreateTask() {
            const taskData = {
                title: 'Test Task ' + Date.now(),
                description: 'A test task created by API testing',
                project_id: 1,
                priority: 'high',
                status: 'todo',
                due_date: '2025-02-01'
            };

            await testAPI('POST', 'php/api/tasks/create_task.php', taskData, 'create-task-result');
        }

        async function testUpdateTaskStatus() {
            const statusData = {
                task_id: 1,
                status: 'in_progress',
                position: 1
            };

            await testAPI('POST', 'php/api/tasks/update_status.php', statusData, 'update-status-result');
        }
        
        async function testErrorHandling() {
            const resultDiv = document.getElementById('error-test-result');
            resultDiv.textContent = 'Testing error handling...';
            resultDiv.className = 'result info';
            
            const tests = [
                {
                    name: 'Invalid Task ID',
                    method: 'GET',
                    url: 'php/api/tasks/get_tasks.php?project_id=invalid'
                },
                {
                    name: 'Missing Required Field',
                    method: 'POST',
                    url: 'php/api/tasks/create_task.php',
                    data: { description: 'Missing title' }
                },
                {
                    name: 'Invalid Status',
                    method: 'POST',
                    url: 'php/api/tasks/update_status.php',
                    data: { task_id: 1, status: 'invalid_status' }
                }
            ];
            
            let results = '';
            
            for (const test of tests) {
                try {
                    const options = {
                        method: test.method,
                        headers: { 'Content-Type': 'application/json' }
                    };
                    
                    if (test.data) {
                        options.body = JSON.stringify(test.data);
                    }
                    
                    const response = await fetch(test.url, options);
                    const result = await response.json();
                    
                    results += test.name + ': ' + response.status + ' - ' + result.message + '\n';

                } catch (error) {
                    results += test.name + ': Error - ' + error.message + '\n';
                }
            }
            
            resultDiv.textContent = results;
            resultDiv.className = 'result success';
        }
        
        async function testValidation() {
            const resultDiv = document.getElementById('validation-test-result');
            resultDiv.textContent = 'Testing validation...';
            resultDiv.className = 'result info';
            
            const tests = [
                {
                    name: 'XSS Prevention',
                    method: 'POST',
                    url: 'php/api/tasks/create_task.php',
                    data: {
                        title: '<script>alert("xss")</script>Test',
                        project_id: 1
                    }
                },
                {
                    name: 'SQL Injection Prevention',
                    method: 'GET',
                    url: 'php/api/tasks/get_tasks.php?project_id=1; DROP TABLE tasks;--'
                },
                {
                    name: 'Date Validation',
                    method: 'POST',
                    url: 'php/api/tasks/create_task.php',
                    data: {
                        title: 'Test Task',
                        project_id: 1,
                        due_date: 'invalid-date'
                    }
                }
            ];
            
            let results = '';
            
            for (const test of tests) {
                try {
                    const options = {
                        method: test.method,
                        headers: { 'Content-Type': 'application/json' }
                    };
                    
                    if (test.data) {
                        options.body = JSON.stringify(test.data);
                    }
                    
                    const response = await fetch(test.url, options);
                    const result = await response.json();
                    
                    results += test.name + ': ' + response.status + ' - ' + (result.success ? 'PASS' : 'BLOCKED') + '\n';

                } catch (error) {
                    results += test.name + ': Error - ' + error.message + '\n';
                }
            }
            
            resultDiv.textContent = results;
            resultDiv.className = 'result success';
        }
        
        // Auto-run basic tests on page load
        window.addEventListener('load', function() {
            console.log('🧪 API Testing Page Loaded');
            console.log('Click buttons to test individual endpoints');
        });
    </script>
</body>
</html>
