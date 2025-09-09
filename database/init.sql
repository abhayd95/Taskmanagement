-- OrbAi Attendance & Task Management System Database Schema
-- This file contains the complete database schema and initial seed data

-- Create database (run this separately if needed)
-- CREATE DATABASE IF NOT EXISTS orbai_attendance_system;
-- USE orbai_attendance_system;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager', 'employee') DEFAULT 'employee',
  department VARCHAR(100),
  position VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  hire_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_employee_id (employee_id),
  INDEX idx_email (email),
  INDEX idx_department (department),
  INDEX idx_role (role),
  INDEX idx_is_active (is_active)
);

-- Attendance records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  check_in_time TIMESTAMP NULL,
  check_out_time TIMESTAMP NULL,
  work_hours DECIMAL(4,2) DEFAULT 0,
  break_duration DECIMAL(4,2) DEFAULT 0,
  overtime_hours DECIMAL(4,2) DEFAULT 0,
  status ENUM('present', 'absent', 'late', 'half_day') DEFAULT 'present',
  notes TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_date (user_id, date),
  INDEX idx_user_id (user_id),
  INDEX idx_date (date),
  INDEX idx_status (status)
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to INT NOT NULL,
  assigned_by INT NOT NULL,
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  due_date DATE,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_assigned_to (assigned_to),
  INDEX idx_assigned_by (assigned_by),
  INDEX idx_status (status),
  INDEX idx_priority (priority),
  INDEX idx_due_date (due_date)
);

-- Leave requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  leave_type ENUM('sick', 'vacation', 'personal', 'maternity', 'paternity', 'other') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_requested INT NOT NULL,
  reason TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_by INT NULL,
  approved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_leave_type (leave_type)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info', 'warning', 'success', 'error') DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at)
);

-- Insert default admin user
-- Password: admin123 (hashed with bcrypt)
INSERT INTO users (employee_id, first_name, last_name, email, password, role, department, position, hire_date) VALUES
('ADMIN001', 'System', 'Administrator', 'admin@orbai.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4QZ8K2C', 'admin', 'IT', 'System Administrator', '2024-01-01'),
('MGR001', 'John', 'Manager', 'manager@orbai.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4QZ8K2C', 'manager', 'Operations', 'Operations Manager', '2024-01-15'),
('EMP001', 'Alice', 'Johnson', 'alice.johnson@orbai.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4QZ8K2C', 'employee', 'Development', 'Software Developer', '2024-02-01'),
('EMP002', 'Bob', 'Smith', 'bob.smith@orbai.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4QZ8K2C', 'employee', 'Development', 'Frontend Developer', '2024-02-15'),
('EMP003', 'Carol', 'Davis', 'carol.davis@orbai.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4QZ8K2C', 'employee', 'Marketing', 'Marketing Specialist', '2024-03-01'),
('EMP004', 'David', 'Wilson', 'david.wilson@orbai.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4QZ8K2C', 'employee', 'Sales', 'Sales Representative', '2024-03-15'),
('EMP005', 'Eva', 'Brown', 'eva.brown@orbai.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4QZ8K2C', 'employee', 'HR', 'HR Coordinator', '2024-04-01');

-- Insert sample attendance records (last 30 days)
INSERT INTO attendance_records (user_id, check_in_time, check_out_time, work_hours, overtime_hours, status, date) VALUES
-- Alice Johnson (EMP001) - Development
(3, '2024-12-01 09:00:00', '2024-12-01 17:30:00', 8.50, 0.50, 'present', '2024-12-01'),
(3, '2024-12-02 09:15:00', '2024-12-02 18:00:00', 8.75, 0.75, 'late', '2024-12-02'),
(3, '2024-12-03 08:45:00', '2024-12-03 17:15:00', 8.50, 0.50, 'present', '2024-12-03'),
(3, '2024-12-04 09:00:00', '2024-12-04 17:30:00', 8.50, 0.50, 'present', '2024-12-04'),
(3, '2024-12-05 09:00:00', '2024-12-05 17:00:00', 8.00, 0.00, 'present', '2024-12-05'),

-- Bob Smith (EMP002) - Development
(4, '2024-12-01 08:45:00', '2024-12-01 17:15:00', 8.50, 0.50, 'present', '2024-12-01'),
(4, '2024-12-02 09:00:00', '2024-12-02 17:30:00', 8.50, 0.50, 'present', '2024-12-02'),
(4, '2024-12-03 09:20:00', '2024-12-03 18:00:00', 8.67, 0.67, 'late', '2024-12-03'),
(4, '2024-12-04 08:50:00', '2024-12-04 17:20:00', 8.50, 0.50, 'present', '2024-12-04'),
(4, '2024-12-05 09:00:00', '2024-12-05 17:00:00', 8.00, 0.00, 'present', '2024-12-05'),

-- Carol Davis (EMP003) - Marketing
(5, '2024-12-01 09:00:00', '2024-12-01 17:30:00', 8.50, 0.50, 'present', '2024-12-01'),
(5, '2024-12-02 09:00:00', '2024-12-02 17:00:00', 8.00, 0.00, 'present', '2024-12-02'),
(5, '2024-12-03 09:00:00', '2024-12-03 17:30:00', 8.50, 0.50, 'present', '2024-12-03'),
(5, '2024-12-04 09:00:00', '2024-12-04 17:00:00', 8.00, 0.00, 'present', '2024-12-04'),
(5, '2024-12-05 09:00:00', '2024-12-05 17:30:00', 8.50, 0.50, 'present', '2024-12-05'),

-- David Wilson (EMP004) - Sales
(6, '2024-12-01 08:45:00', '2024-12-01 17:15:00', 8.50, 0.50, 'present', '2024-12-01'),
(6, '2024-12-02 09:00:00', '2024-12-02 17:30:00', 8.50, 0.50, 'present', '2024-12-02'),
(6, '2024-12-03 09:00:00', '2024-12-03 17:00:00', 8.00, 0.00, 'present', '2024-12-03'),
(6, '2024-12-04 09:00:00', '2024-12-04 17:30:00', 8.50, 0.50, 'present', '2024-12-04'),
(6, '2024-12-05 09:00:00', '2024-12-05 17:00:00', 8.00, 0.00, 'present', '2024-12-05'),

-- Eva Brown (EMP005) - HR
(7, '2024-12-01 09:00:00', '2024-12-01 17:30:00', 8.50, 0.50, 'present', '2024-12-01'),
(7, '2024-12-02 09:00:00', '2024-12-02 17:00:00', 8.00, 0.00, 'present', '2024-12-02'),
(7, '2024-12-03 09:00:00', '2024-12-03 17:30:00', 8.50, 0.50, 'present', '2024-12-03'),
(7, '2024-12-04 09:00:00', '2024-12-04 17:00:00', 8.00, 0.00, 'present', '2024-12-04'),
(7, '2024-12-05 09:00:00', '2024-12-05 17:30:00', 8.50, 0.50, 'present', '2024-12-05');

-- Insert sample tasks
INSERT INTO tasks (title, description, assigned_to, assigned_by, priority, status, due_date) VALUES
('Implement user authentication', 'Create login and registration system with JWT tokens', 3, 2, 'high', 'completed', '2024-12-10'),
('Design dashboard UI', 'Create responsive dashboard for different user roles', 4, 2, 'medium', 'in_progress', '2024-12-15'),
('Database optimization', 'Optimize database queries and add proper indexing', 3, 1, 'high', 'pending', '2024-12-20'),
('Marketing campaign setup', 'Prepare Q1 marketing campaign materials', 5, 2, 'medium', 'pending', '2024-12-25'),
('Client meeting preparation', 'Prepare presentation for upcoming client meeting', 6, 2, 'urgent', 'in_progress', '2024-12-08'),
('Employee onboarding process', 'Review and update employee onboarding documentation', 7, 1, 'low', 'pending', '2024-12-30'),
('API documentation', 'Create comprehensive API documentation for developers', 3, 1, 'medium', 'completed', '2024-12-05'),
('Sales target analysis', 'Analyze Q4 sales performance and set Q1 targets', 6, 2, 'high', 'pending', '2024-12-12'),
('Frontend testing', 'Implement unit and integration tests for frontend components', 4, 2, 'medium', 'in_progress', '2024-12-18'),
('HR policy update', 'Update company policies and procedures', 7, 1, 'low', 'pending', '2024-12-28');

-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, type) VALUES
(3, 'Task Completed', 'Great job completing the user authentication implementation!', 'success'),
(4, 'New Task Assigned', 'You have been assigned a new task: Design dashboard UI', 'info'),
(5, 'Deadline Reminder', 'Marketing campaign setup is due in 3 days', 'warning'),
(6, 'Urgent Task', 'Client meeting preparation is due tomorrow', 'error'),
(7, 'Policy Update', 'Please review the updated HR policies', 'info'),
(2, 'System Update', 'Database maintenance scheduled for this weekend', 'info'),
(1, 'New User Registration', 'A new employee has been registered in the system', 'info');

-- Insert sample leave requests
INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, days_requested, reason, status, approved_by) VALUES
(3, 'vacation', '2024-12-20', '2024-12-27', 5, 'Family vacation', 'approved', 2),
(4, 'sick', '2024-12-10', '2024-12-10', 1, 'Doctor appointment', 'approved', 2),
(5, 'personal', '2024-12-15', '2024-12-15', 1, 'Personal matter', 'pending', NULL),
(6, 'vacation', '2024-12-30', '2025-01-03', 3, 'New Year holiday', 'pending', NULL),
(7, 'maternity', '2025-01-15', '2025-04-15', 90, 'Maternity leave', 'approved', 1);
