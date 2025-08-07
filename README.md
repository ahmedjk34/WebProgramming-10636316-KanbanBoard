# 🗂️ Kanban Board – Web Programming 10636316 Project

A simple, responsive **Kanban-style task management board** built using core web technologies: **HTML5, CSS3, JavaScript, PHP, MySQL**. Developed as a course project for **Web Programming (10636316)** at **An-Najah National University**.

## 📚 Course Details

- **Course**: Web Programming (10636316)
- **Instructor**: Dr. Sufyan Samara
- **University**: An-Najah National University
- **Semester**: Spring 2025

---

## ✅ Features

- Visual **Kanban Board** with `To Do`, `In Progress`, and `Done` columns
- **Drag-and-drop** tasks between columns
- Create, update, and delete tasks via **AJAX**
- **Projects**, **priorities**, and **due dates**
- **Task filtering** and sorting
- (Optional) **AI Assistant** to break down tasks or suggest prioritization
- (Optional) **User authentication** with sessions

---

## 🔧 Tech Stack (Taught in Course)

### 🌐 Frontend

- HTML5, CSS3
- JavaScript (Vanilla)
- Bootstrap (optional for layout)
- HTML5 Drag-and-Drop API

### 💻 Backend

- PHP (pure, procedural or OOP)
- MySQL database
- AJAX (with `XMLHttpRequest` or `fetch`)
- (Optional) OpenAI API or PHP logic for AI features

---

## 🗃️ Database Schema (Simplified)

```sql
CREATE TABLE projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT,
  title VARCHAR(255),
  description TEXT,
  status ENUM('todo', 'in_progress', 'done') DEFAULT 'todo',
  priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

---

## 🚀 Phase 1 Setup Instructions

### Prerequisites
- **XAMPP/WAMP/MAMP** or local web server with PHP 7.4+ and MySQL 5.7+
- Web browser (Chrome, Firefox, Safari, Edge)
- Text editor or IDE

### Quick Setup
1. **Clone/Download** this project to your web server directory
2. **Configure Database**: Edit `php/config/database.php` with your MySQL credentials
3. **Install Database**:
   - Option A: Run `php php/setup/install.php` from command line
   - Option B: Import `database_setup.sql` into MySQL
4. **Test Setup**: Open `test_connection.php` in your browser
5. **Launch App**: Open `index.html` in your browser

### Project Structure (Phase 1 Complete)
```

WebProgramming-10636316-KanbanBoard/
├── index.html # Main application page
├── config.php # Application configuration
├── test_connection.php # Setup verification script
├── database_setup.sql # Database schema
├── css/
│ └── styles.css # Application styles (basic)
├── js/
│ └── app.js # Application JavaScript (basic)
├── php/
│ ├── config/
│ │ └── database.php # Database connection
│ ├── includes/
│ │ ├── functions.php # Utility functions
│ │ └── security.php # Security functions
│ ├── setup/
│ │ └── install.php # Database installer
│ └── api/ # API endpoints (Phase 2)
└── assets/
└── images/ # Application assets

```

### ✅ Phase 1 Completed Features
- ✅ Complete project directory structure
- ✅ Database schema with projects and tasks tables
- ✅ Security functions (input sanitization, validation)
- ✅ Configuration management
- ✅ Database connection with PDO
- ✅ Basic HTML structure for Kanban board
- ✅ Installation and testing scripts

### 🔄 Next: Phase 2 - Backend API Development
Ready to proceed with creating PHP API endpoints for CRUD operations.
```
