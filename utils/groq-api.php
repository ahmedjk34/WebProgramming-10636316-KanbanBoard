<?php
/**
 * GROQ API Client
 * Kanban Board Project - Web Programming 10636316
 * 
 * Handles communication with GROQ API for AI-powered task planning
 */

require_once __DIR__ . '/env-loader.php';

class GroqAPI {
    private $apiKey;
    private $apiUrl;
    private $model;
    private $timeout;

    public function __construct() {
        $this->apiKey = env('GROQ_API_KEY');
        $this->apiUrl = env('GROQ_API_URL', 'https://api.groq.com/openai/v1/chat/completions');
        $this->model = env('GROQ_MODEL', 'llama3-8b-8192');
        $this->timeout = 30; // 30 seconds timeout

        if (!$this->apiKey || $this->apiKey === 'your_groq_api_key_here') {
            throw new Exception('GROQ API key not configured. Please set GROQ_API_KEY in .env file.');
        }
    }

    /**
     * Send a chat completion request to GROQ API
     * @param array $messages Array of message objects
     * @param array $options Additional options
     * @return array API response
     */
    public function chatCompletion($messages, $options = []) {
        $data = [
            'model' => $options['model'] ?? $this->model,
            'messages' => $messages,
            'temperature' => $options['temperature'] ?? 0.7,
            'max_tokens' => $options['max_tokens'] ?? 2048,
            'top_p' => $options['top_p'] ?? 1,
            'stream' => false
        ];

        return $this->makeRequest($data);
    }

    /**
     * Send a simple prompt to GROQ API
     * @param string $prompt The prompt text
     * @param string $systemMessage Optional system message
     * @param array $options Additional options
     * @return string AI response content
     */
    public function prompt($prompt, $systemMessage = null, $options = []) {
        $messages = [];
        
        if ($systemMessage) {
            $messages[] = [
                'role' => 'system',
                'content' => $systemMessage
            ];
        }

        $messages[] = [
            'role' => 'user',
            'content' => $prompt
        ];

        $response = $this->chatCompletion($messages, $options);
        
        if (isset($response['choices'][0]['message']['content'])) {
            return $response['choices'][0]['message']['content'];
        }

        throw new Exception('Invalid response from GROQ API');
    }

    /**
     * Generate task planning from user input
     * @param string $userPlan User's daily plan description
     * @return array Structured project and tasks data
     */
    public function generateTaskPlan($userPlan) {
        $currentDate = date('Y-m-d');
        $currentDateFormatted = date('F j, Y');
        
        $systemMessage = "You are an AI assistant that helps users organize their daily plans into structured project and task data for a Kanban board system.

IMPORTANT INSTRUCTIONS:
1. Create a project with name format: \"Today's Tasks - [Date]\" (e.g., \"Today's Tasks - January 14, 2025\")
2. Break down the user's plan into individual, actionable tasks
3. Assign appropriate priority levels: 'high', 'medium', or 'low'
4. Set status to 'todo' unless explicitly stated otherwise
5. Calculate due dates based on urgency mentioned (within 2 days = tomorrow, very important = today, etc.)
6. Provide clear, actionable task titles and detailed descriptions
7. Return ONLY valid JSON in the exact format specified below

WORKSPACE SELECTION RULES:
- Personal activities (study, workout, personal tasks) → workspace_id: 1 (Personal Workspace)
- Work/professional tasks (homework, assignments, presentations) → workspace_id: 2 (Work Workspace)  
- Creative projects (art, design, writing) → workspace_id: 3 (Creative Projects)

RESPONSE FORMAT (JSON only, no other text):
{
  \"project\": {
    \"name\": \"Today's Tasks - [Date]\",
    \"description\": \"Daily tasks and activities planned for [date]\",
    \"workspace_id\": [1, 2, or 3 based on primary task type],
    \"color\": \"#4facfe\"
  },
  \"tasks\": [
    {
      \"title\": \"Task title\",
      \"description\": \"Detailed description of what needs to be done\",
      \"priority\": \"high|medium|low\",
      \"status\": \"todo\",
      \"due_date\": \"YYYY-MM-DD or null\"
    }
  ]
}";

        $userPrompt = "Today is {$currentDateFormatted} ({$currentDate}). Please organize this daily plan into a structured project with tasks:

\"{$userPlan}\"

Convert this into a project and individual tasks following the JSON format specified in the system message.";

        try {
            $response = $this->prompt($userPrompt, $systemMessage, [
                'temperature' => 0.3, // Lower temperature for more consistent JSON output
                'max_tokens' => 1500
            ]);

            // Clean the response to extract JSON
            $jsonStart = strpos($response, '{');
            $jsonEnd = strrpos($response, '}');
            
            if ($jsonStart !== false && $jsonEnd !== false) {
                $jsonString = substr($response, $jsonStart, $jsonEnd - $jsonStart + 1);
                $data = json_decode($jsonString, true);
                
                if (json_last_error() === JSON_ERROR_NONE) {
                    return $data;
                }
            }

            throw new Exception('Failed to parse AI response as JSON: ' . $response);
            
        } catch (Exception $e) {
            throw new Exception('Failed to generate task plan: ' . $e->getMessage());
        }
    }

    /**
     * Make HTTP request to GROQ API
     * @param array $data Request data
     * @return array Response data
     */
    private function makeRequest($data) {
        $headers = [
            'Authorization: Bearer ' . $this->apiKey,
            'Content-Type: application/json'
        ];

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $this->apiUrl,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_FOLLOWLOCATION => true
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception('CURL error: ' . $error);
        }

        if ($httpCode !== 200) {
            $errorData = json_decode($response, true);
            $errorMessage = isset($errorData['error']['message']) 
                ? $errorData['error']['message'] 
                : 'HTTP ' . $httpCode . ': ' . $response;
            throw new Exception('GROQ API error: ' . $errorMessage);
        }

        $decodedResponse = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON response from GROQ API');
        }

        return $decodedResponse;
    }

    /**
     * Test the API connection
     * @return array Test result
     */
    public function testConnection() {
        try {
            $response = $this->prompt('Hello! Please respond with "GROQ API connection successful"');
            return [
                'success' => true,
                'message' => 'GROQ API connection successful',
                'response' => $response
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'GROQ API connection failed',
                'error' => $e->getMessage()
            ];
        }
    }
}
?>
