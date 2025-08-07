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
