const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
    let connection;
    try {
        // First try to connect without database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || null,
            port: process.env.DB_PORT || 3306
        });

        console.log('Connected to MySQL server');

        // Create database
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'orbai_attendance_system'}`);
        console.log('Database created successfully');

        // Switch to the database
        await connection.execute(`USE ${process.env.DB_NAME || 'orbai_attendance_system'}`);

        // Create tables
        await connection.execute(`
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
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        await connection.execute(`
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
                UNIQUE KEY unique_user_date (user_id, date)
            )
        `);

        await connection.execute(`
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
                FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Insert demo users
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('admin123', 10);

        await connection.execute(`
            INSERT IGNORE INTO users (employee_id, first_name, last_name, email, password, role, department, position, is_active) VALUES
            ('ADM001', 'Admin', 'User', 'admin@orbai.com', ?, 'admin', 'IT', 'System Administrator', true),
            ('MGR001', 'Manager', 'User', 'manager@orbai.com', ?, 'manager', 'HR', 'HR Manager', true),
            ('EMP001', 'Alice', 'Johnson', 'alice.johnson@orbai.com', ?, 'employee', 'IT', 'Software Developer', true)
        `, [hashedPassword, hashedPassword, hashedPassword]);

        console.log('Demo users created successfully');
        console.log('Database setup completed successfully!');

    } catch (error) {
        console.error('Database setup failed:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

setupDatabase().catch(console.error);