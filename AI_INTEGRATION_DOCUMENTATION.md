# 🤖 AI Task Planning Integration - GROQ API

## Overview
This document describes the GROQ API integration for AI-powered task planning in the Kanban Board application. The system converts natural language daily plans into structured projects and tasks.

## 🚀 Features Implemented

### 1. Environment Configuration
- **File**: `.env` - Stores GROQ API credentials
- **Loader**: `utils/env-loader.php` - Loads environment variables
- **Variables**:
  - `GROQ_API_KEY` - Your GROQ API key
  - `GROQ_API_URL` - API endpoint (default: https://api.groq.com/openai/v1/chat/completions)
  - `GROQ_MODEL` - AI model (default: llama3-8b-8192)

### 2. GROQ API Client
- **File**: `utils/groq-api.php`
- **Class**: `GroqAPI`
- **Methods**:
  - `chatCompletion()` - Send chat completion requests
  - `prompt()` - Simple prompt interface
  - `generateTaskPlan()` - Convert user plans to structured data
  - `testConnection()` - Test API connectivity

### 3. Task Planning System
- **File**: `utils/task-planner.php`
- **Class**: `TaskPlanner`
- **Methods**:
  - `processUserPlan()` - Complete plan processing pipeline
  - `validateAIPlan()` - Validate AI response structure
  - `createProject()` - Create project in database
  - `createTasks()` - Create tasks in database

### 4. API Endpoints
- **Generate Plan**: `php/api/ai/generate_task_plan.php`
- **Get Workspaces**: `php/api/ai/get_workspaces.php`

### 5. Test Interfaces
- **Backend Test**: `test_groq_api.php` - PHP-based testing
- **Frontend Test**: `test_ai_integration.html` - JavaScript-based testing

## 📋 How It Works

### User Input Processing Flow
1. **User Input**: Natural language daily plan
2. **AI Processing**: GROQ API converts to structured data
3. **Validation**: Validate AI response format
4. **Workspace Selection**: Auto-assign or user-specified workspace
5. **Database Storage**: Create project and tasks
6. **Response**: Return created IDs and data

### AI Prompt Engineering
The system uses carefully crafted prompts to ensure consistent JSON output:

```
System Message:
- Instructions for JSON format
- Workspace selection rules
- Priority assignment guidelines
- Due date calculation logic

User Prompt:
- Current date context
- User's daily plan
- Request for structured output
```

### Workspace Assignment Rules
- **Personal Workspace (ID: 1)**: Study, workout, personal tasks
- **Work Workspace (ID: 2)**: Homework, assignments, professional tasks
- **Creative Projects (ID: 3)**: Art, design, creative work

## 🔧 Setup Instructions

### 1. Configure Environment
```bash
# Copy and edit .env file
cp .env.example .env

# Add your GROQ API key
GROQ_API_KEY=your_actual_groq_api_key_here
```

### 2. Test API Connection
```bash
# Open in browser
http://localhost/your-project/test_groq_api.php
```

### 3. Test Full Integration
```bash
# Open in browser
http://localhost/your-project/test_ai_integration.html
```

## 📊 Expected JSON Output Format

### AI Response Structure
```json
{
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
    },
    {
      "title": "Workout Session",
      "description": "Complete 1-hour workout routine focusing on cardio and strength",
      "priority": "high",
      "status": "todo",
      "due_date": "2025-01-14"
    }
  ]
}
```

### API Response Structure
```json
{
  "success": true,
  "message": "Task plan created successfully",
  "data": {
    "project_id": 15,
    "task_ids": [45, 46, 47],
    "project_name": "Today's Tasks - January 14, 2025",
    "tasks_count": 3,
    "workspace_id": 1,
    "ai_plan": { /* Original AI response */ }
  },
  "timestamp": "2025-01-14 10:30:00"
}
```

## 🧪 Testing Examples

### Sample User Plans
1. **Study Plan**: "I need to study for my machine learning exam tomorrow. I want to review 3 chapters, practice coding exercises, and create summary notes. This is very urgent."

2. **Work & Personal Mix**: "Today I want to finish my web programming assignment which is due in 2 days, go to the gym for an hour workout, and call my family. The assignment is high priority."

3. **Creative Project**: "I want to work on my portfolio website design, create 3 new mockups, and write content for the about page. I also need to research color schemes."

### Expected Outcomes
- **Project Creation**: New project with today's date
- **Task Breakdown**: Individual actionable tasks
- **Priority Assignment**: Based on urgency keywords
- **Due Date Setting**: Based on mentioned timeframes
- **Workspace Selection**: Based on task type analysis

## 🔒 Security & Error Handling

### Input Validation
- Plan length: 10-2000 characters
- Workspace ID: Must be 1, 2, or 3
- JSON structure validation
- SQL injection prevention

### Error Handling
- API connection failures
- Invalid JSON responses
- Database errors
- Validation failures
- Rate limiting protection

### Logging
- Error logging for debugging
- API response logging
- Database operation logging

## 🚀 Usage in Frontend

### JavaScript Integration
```javascript
// Generate AI task plan
const response = await fetch('php/api/ai/generate_task_plan.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_plan: "Your daily plan here",
    workspace_id: 1 // Optional
  })
});

const result = await response.json();
if (result.success) {
  console.log('Created project:', result.data.project_id);
  console.log('Created tasks:', result.data.task_ids);
}
```

### Integration with Existing Kanban Board
The generated tasks automatically appear in the Kanban board interface since they're stored in the same database tables used by the existing system.

## 📈 Performance Considerations

- **API Timeout**: 30 seconds for GROQ requests
- **Response Caching**: Consider caching for repeated similar requests
- **Rate Limiting**: Respect GROQ API rate limits
- **Database Optimization**: Proper indexing for task queries

## 🔮 Future Enhancements

1. **Task Refinement**: Allow users to edit AI-generated tasks before saving
2. **Learning System**: Improve AI prompts based on user feedback
3. **Batch Processing**: Handle multiple days of planning
4. **Integration with Calendar**: Sync with external calendar systems
5. **Smart Scheduling**: AI-powered time slot suggestions

## 🐛 Troubleshooting

### Common Issues
1. **API Key Error**: Ensure GROQ_API_KEY is set correctly in .env
2. **JSON Parse Error**: Check AI response format and prompt engineering
3. **Database Error**: Verify database connection and table structure
4. **Workspace Error**: Ensure default workspaces exist in database

### Debug Steps
1. Test API connection with `test_groq_api.php`
2. Check error logs in `php_errors.log`
3. Verify database structure with `test_connection.php`
4. Test individual components separately

## 📞 Support

For issues with this integration:
1. Check the test files for debugging information
2. Review error logs for specific error messages
3. Verify GROQ API key and permissions
4. Ensure database tables are properly set up
