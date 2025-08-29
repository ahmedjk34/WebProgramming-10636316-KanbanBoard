THE # 🗂️ Kanban Board Project Documentation

## Web Programming 10636316 - An-Najah National University

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Course Information](#course-information)
3. [Technical Architecture](#technical-architecture)
4. [Features & Functionality](#features--functionality)
5. [Database Schema](#database-schema)
6. [API Documentation](#api-documentation)
7. [Installation Guide](#installation-guide)
8. [User Guide](#user-guide)
9. [Development Phases](#development-phases)
10. [AI Integration](#ai-integration)
11. [Authentication System](#authentication-system)
12. [Testing & Debugging](#testing--debugging)
13. [Project Structure](#project-structure)

---

## 🎯 Project Overview

The Kanban Board is a comprehensive task management application built using core web technologies. It provides a visual, drag-and-drop interface for managing tasks across different stages of completion, with advanced features including AI assistance, user authentication, analytics, and multi-board support.

### Key Highlights

- **Visual Kanban Interface**: Intuitive drag-and-drop task management
- **Multi-Project Support**: Organize tasks across different projects
- **AI Integration**: Intelligent task breakdown and prioritization
- **Real-time Analytics**: Comprehensive project insights and metrics
- **User Authentication**: Secure login and registration system
- **Responsive Design**: Works seamlessly across all devices

---

## 📚 Course Information

- **Course Code**: Web Programming (10636316)
- **Instructor**: Dr. Sufyan Samara
- **University**: An-Najah National University
- **Semester**: Spring 2025
- **Project Type**: Course Project

---

## 🏗️ Technical Architecture

### Frontend Technologies

- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with responsive design
- **JavaScript (Vanilla)**: Interactive functionality and AJAX
- **Bootstrap**: Optional framework for enhanced UI
- **HTML5 Drag-and-Drop API**: Native drag-and-drop functionality

### Backend Technologies

- **PHP**: Server-side logic and API endpoints
- **MySQL**: Relational database management
- **AJAX**: Asynchronous data communication
- **PDO**: Secure database connections
- **JSON**: Data exchange format

### Development Tools

- **XAMPP/WAMP/MAMP**: Local development environment
- **Git**: Version control
- **Text Editor/IDE**: Code development

---

## ✨ Features & Functionality

### Core Features

1. **Task Management**

   - Create, edit, and delete tasks
   - Drag-and-drop between columns
   - Priority levels (Low, Medium, High)
   - Due date assignment
   - Task descriptions and details

2. **Project Organization**

   - Multiple project support
   - Project-specific task filtering
   - Color-coded project identification
   - Project statistics and metrics

3. **Visual Interface**
   - Three-column Kanban layout (To Do, In Progress, Done)
   - Real-time updates
   - Responsive design for all devices
   - Modern, intuitive UI

### Advanced Features

1. **AI Integration**

   - Task breakdown suggestions
   - Priority recommendations
   - Intelligent task categorization
   - Natural language processing

2. **Analytics Dashboard**

   - Project progress tracking
   - Task completion statistics
   - Performance metrics
   - Visual charts and graphs

3. **User Authentication**

   - Secure registration and login
   - Session management
   - User-specific data isolation
   - Guest user support

4. **Multi-Board Views**
   - Multiple board instances
   - Board-specific configurations
   - Cross-board task management

---

## 🗃️ Database Schema

### Core Tables

#### Projects Table

```sql
CREATE TABLE projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3498db',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Tasks Table

```sql
CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('todo', 'in_progress', 'done') DEFAULT 'todo',
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  due_date DATE,
  position INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);
```

#### Users Table

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL
);
```

#### Analytics Table

```sql
CREATE TABLE analytics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT,
  metric_name VARCHAR(100) NOT NULL,
  metric_value TEXT,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
```

---

## 🔌 API Documentation

### Base URL

`http://localhost:8000/php/api/`

### Tasks API Endpoints

#### GET /tasks/get_tasks.php

Retrieve all tasks with optional filtering.

**Parameters:**

- `project_id` (int) - Filter by project ID
- `priority` (string) - Filter by priority level

**Response:**

```json
{
  "success": true,
  "message": "Tasks retrieved successfully",
  "data": {
    "tasks": [...],
    "tasks_by_status": {
      "todo": [...],
      "in_progress": [...],
      "done": [...]
    },
    "total_count": 10,
    "counts": {
      "todo": 3,
      "in_progress": 2,
      "done": 5
    }
  }
}
```

#### POST /tasks/create_task.php

Create a new task.

**Required Fields:**

- `title` (string) - Task title
- `project_id` (int) - Project ID

**Optional Fields:**

- `description` (string) - Task description
- `status` (string) - Initial status
- `priority` (string) - Priority level
- `due_date` (string) - Due date (YYYY-MM-DD)

#### PUT /tasks/update_task.php

Update an existing task.

#### PATCH /tasks/update_status.php

Update task status for drag-and-drop operations.

#### DELETE /tasks/delete_task.php

Delete a task.

### Projects API Endpoints

#### GET /projects/get_projects.php

Retrieve all projects with task counts.

#### POST /projects/create_project.php

Create a new project.

#### PUT /projects/update_project.php

Update an existing project.

#### DELETE /projects/delete_project.php

Delete a project.

### Authentication API Endpoints

#### POST /auth/register.php

Register a new user.

#### POST /auth/login.php

Authenticate user login.

#### POST /auth/logout.php

Logout user.

---

## 🚀 Installation Guide

### Prerequisites

- **XAMPP/WAMP/MAMP** or local web server
- **PHP 7.4+** with MySQL support
- **MySQL 5.7+** database server
- **Web browser** (Chrome, Firefox, Safari, Edge)
- **Text editor or IDE**

### Step-by-Step Installation

1. **Download Project**

   ```bash
   git clone [repository-url]
   cd WebProgramming-10636316-KanbanBoard
   ```

2. **Configure Database**

   - Edit `php/config/database.php`
   - Update MySQL credentials:

   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'kanban_board');
   define('DB_USER', 'your_username');
   define('DB_PASS', 'your_password');
   ```

3. **Install Database**

   - **Option A**: Run installer script
     ```bash
     php php/setup/install.php
     ```
   - **Option B**: Import SQL file
     ```bash
     mysql -u username -p database_name < database_setup.sql
     ```

4. **Test Setup**

   - Open `test_connection.php` in browser
   - Verify database connection and table creation

5. **Launch Application**
   - Open `index.html` in web browser
   - Application should load with default project

### Configuration Options

Edit `config.php` for application settings:

```php
// Debug mode
define('DEBUG_MODE', true);

// AI API settings
define('AI_API_KEY', 'your_api_key');
define('AI_API_URL', 'https://api.openai.com/v1/');

// Security settings
define('SESSION_TIMEOUT', 3600);
define('MAX_LOGIN_ATTEMPTS', 5);
```

---

## 👥 User Guide

### Getting Started

1. **Access the Application**

   - Open `index.html` in your web browser
   - The application loads with a default project

2. **Creating Tasks**

   - Click "Add Task" button in any column
   - Fill in task details (title, description, priority, due date)
   - Click "Create Task" to save

3. **Managing Tasks**

   - **Drag and Drop**: Move tasks between columns
   - **Edit**: Click task title to modify details
   - **Delete**: Click delete icon to remove task
   - **Priority**: Use priority indicators for organization

4. **Project Management**
   - Create new projects from the project selector
   - Assign colors to projects for visual organization
   - Filter tasks by project using the dropdown

### Advanced Features

1. **AI Assistant**

   - Use AI to break down complex tasks
   - Get priority recommendations
   - Receive task categorization suggestions

2. **Analytics Dashboard**

   - View project progress statistics
   - Monitor task completion rates
   - Analyze productivity metrics

3. **User Authentication**
   - Register for a personal account
   - Login to save your data
   - Access your tasks across sessions

---

## 📈 Development Phases

### Phase 1: Database Extensions ✅

- Extended database schema
- Added user authentication tables
- Implemented analytics tracking
- Enhanced security features

### Phase 2: Analytics Backend APIs ✅

- Created comprehensive analytics endpoints
- Implemented data aggregation functions
- Added performance metrics tracking
- Built reporting infrastructure

### Phase 3: Analytics Dashboard Frontend ✅

- Developed interactive dashboard interface
- Created visual charts and graphs
- Implemented real-time data updates
- Added filtering and export capabilities

### Phase 4: Multiple Board Views Infrastructure ✅

- Built multi-board support system
- Implemented board-specific configurations
- Added cross-board task management
- Enhanced user experience with board switching

---

## 🤖 AI Integration

### Features

- **Task Breakdown**: AI suggests subtasks for complex tasks
- **Priority Recommendations**: Intelligent priority assignment
- **Natural Language Processing**: Understand task descriptions
- **Smart Categorization**: Automatic task organization

### Implementation

- **API Integration**: OpenAI/GROQ API integration
- **Response Processing**: Structured AI responses
- **Error Handling**: Graceful fallback for API failures
- **Rate Limiting**: Efficient API usage management

### Usage Examples

```javascript
// AI task breakdown
const aiResponse = await fetch("php/api/ai/breakdown_task.php", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ task: "Complete project documentation" }),
});
```

---

## 🔐 Authentication System

### Security Features

- **Password Hashing**: Secure password storage with bcrypt
- **Session Management**: Secure session handling
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection Prevention**: PDO prepared statements
- **XSS Protection**: Output encoding and sanitization

### User Management

- **Registration**: Secure user account creation
- **Login**: Multi-factor authentication support
- **Password Reset**: Secure password recovery
- **Account Management**: User profile and settings

### Guest User Support

- **Anonymous Access**: Use without registration
- **Data Persistence**: Local storage for guest data
- **Upgrade Path**: Convert guest data to registered account

---

## 🧪 Testing & Debugging

### Testing Tools

- **API Testing**: `test_apis.html` - Interactive API testing
- **Database Testing**: `test_connection.php` - Database verification
- **Authentication Testing**: `test_auth_flow.html` - Auth flow testing
- **AI Integration Testing**: `test_ai_refresh.html` - AI feature testing

### Debug Features

- **Error Logging**: Comprehensive error tracking
- **Debug Mode**: Detailed error messages
- **Performance Monitoring**: Response time tracking
- **Data Validation**: Input/output verification

### Common Issues & Solutions

1. **Database Connection Issues**

   - Verify MySQL service is running
   - Check database credentials in config
   - Ensure database exists and is accessible

2. **API Endpoint Errors**

   - Check file permissions
   - Verify PHP configuration
   - Review error logs for details

3. **AI Integration Problems**
   - Verify API key configuration
   - Check network connectivity
   - Review rate limiting settings

---

## 📁 Project Structure

```
WebProgramming-10636316-KanbanBoard/
├── index.html                 # Main application interface
├── dashboard.html             # Analytics dashboard
├── login.html                 # User authentication
├── signup.html                # User registration
├── teams.html                 # Team management interface
├── config.php                 # Application configuration
├── database_setup.sql         # Database schema
├── README.md                  # Project overview
├── API_DOCUMENTATION.md       # API reference
├── css/                       # Stylesheets
│   ├── styles.css
│   └── dashboard.css
├── js/                        # JavaScript files
│   ├── app.js                 # Main application logic
│   ├── dragdrop.js            # Drag-and-drop functionality
│   ├── api.js                 # API communication
│   └── analytics.js           # Analytics features
├── php/                       # Backend PHP files
│   ├── config/
│   │   └── database.php       # Database configuration
│   ├── api/                   # API endpoints
│   │   ├── tasks/             # Task management APIs
│   │   ├── projects/          # Project management APIs
│   │   ├── auth/              # Authentication APIs
│   │   └── analytics/         # Analytics APIs
│   ├── includes/              # Shared PHP functions
│   │   ├── functions.php      # Utility functions
│   │   └── security.php       # Security functions
│   └── setup/                 # Installation scripts
│       └── install.php        # Database installer
├── assets/                    # Static assets
│   └── images/                # Application images
├── modules/                   # Modular components
└── utils/                     # Utility scripts
```

---

## 📊 Performance & Optimization

### Database Optimization

- **Indexed Queries**: Optimized database indexes
- **Prepared Statements**: Efficient query execution
- **Connection Pooling**: Resource management
- **Query Optimization**: Minimal data transfer

### Frontend Performance

- **Lazy Loading**: On-demand content loading
- **Caching**: Browser and application caching
- **Minification**: Compressed assets
- **CDN Integration**: Fast content delivery

### Security Measures

- **Input Sanitization**: XSS prevention
- **SQL Injection Protection**: Parameterized queries
- **CSRF Protection**: Cross-site request forgery prevention
- **Rate Limiting**: API abuse prevention

---

## 🔮 Future Enhancements

### Planned Features

1. **Real-time Collaboration**: Multi-user editing
2. **Mobile Application**: Native mobile app
3. **Advanced Analytics**: Machine learning insights
4. **Integration APIs**: Third-party service integration
5. **Advanced Permissions**: Role-based access control

### Technical Improvements

1. **Microservices Architecture**: Scalable backend
2. **GraphQL API**: Flexible data querying
3. **Progressive Web App**: Offline functionality
4. **Containerization**: Docker deployment
5. **CI/CD Pipeline**: Automated testing and deployment

---

## 📞 Support & Contact

### Documentation

- **API Documentation**: `API_DOCUMENTATION.md`
- **Installation Guide**: This document
- **User Guide**: Application help system

### Development Resources

- **GitHub Repository**: Project source code
- **Issue Tracking**: Bug reports and feature requests
- **Wiki**: Detailed technical documentation

### Contact Information

- **Course Instructor**: Dr. Sufyan Samara
- **University**: An-Najah National University
- **Course**: Web Programming (10636316)

---

## 📄 License & Acknowledgments

### License

This project is developed as part of the Web Programming course at An-Najah National University. All rights reserved.

### Acknowledgments

- **Course Instructor**: Dr. Sufyan Samara
- **University**: An-Najah National University
- **Technologies**: HTML5, CSS3, JavaScript, PHP, MySQL
- **Frameworks**: Bootstrap, PDO, AJAX

---

_Document generated on: January 2025_
_Project Version: 1.0_
_Last Updated: January 2025_
