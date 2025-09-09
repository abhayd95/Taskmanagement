const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'database', 'orbai.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
    }
});

// Initialize database tables
const initializeDatabase = () => {
    return new Promise((resolve, reject) => {
        db.serialize(async() => {
            try {
                // Create users table
                db.run(`
                    CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        employee_id TEXT UNIQUE NOT NULL,
                        first_name TEXT NOT NULL,
                        last_name TEXT NOT NULL,
                        email TEXT UNIQUE NOT NULL,
                        password TEXT NOT NULL,
                        role TEXT CHECK(role IN ('admin', 'manager', 'employee')) DEFAULT 'employee',
                        department TEXT,
                        position TEXT,
                        phone TEXT,
                        address TEXT,
                        hire_date DATE,
                        is_active BOOLEAN DEFAULT 1,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                // Create attendance_records table
                db.run(`
                    CREATE TABLE IF NOT EXISTS attendance_records (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        check_in_time DATETIME,
                        check_out_time DATETIME,
                        work_hours REAL DEFAULT 0,
                        break_duration REAL DEFAULT 0,
                        overtime_hours REAL DEFAULT 0,
                        status TEXT CHECK(status IN ('present', 'absent', 'late', 'half_day')) DEFAULT 'present',
                        notes TEXT,
                        date DATE NOT NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                        UNIQUE(user_id, date)
                    )
                `);

                // Create tasks table
                db.run(`
                    CREATE TABLE IF NOT EXISTS tasks (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        title TEXT NOT NULL,
                        description TEXT,
                        assigned_to INTEGER NOT NULL,
                        assigned_by INTEGER NOT NULL,
                        priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
                        status TEXT CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
                        due_date DATE,
                        completed_at DATETIME,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE,
                        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE
                    )
                `);

                // Create leave_requests table
                db.run(`
                    CREATE TABLE IF NOT EXISTS leave_requests (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        leave_type TEXT CHECK(leave_type IN ('sick', 'vacation', 'personal', 'maternity', 'paternity', 'other')) NOT NULL,
                        start_date DATE NOT NULL,
                        end_date DATE NOT NULL,
                        days_requested INTEGER NOT NULL,
                        reason TEXT,
                        status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
                        approved_by INTEGER,
                        approved_at DATETIME,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
                    )
                `);

                // Create notifications table
                db.run(`
                    CREATE TABLE IF NOT EXISTS notifications (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        title TEXT NOT NULL,
                        message TEXT NOT NULL,
                        type TEXT CHECK(type IN ('info', 'warning', 'success', 'error')) DEFAULT 'info',
                        is_read BOOLEAN DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                    )
                `);

                // Insert demo users
                const hashedPassword = await bcrypt.hash('admin123', 10);

                db.run(`
                    INSERT OR IGNORE INTO users (employee_id, first_name, last_name, email, password, role, department, position, is_active) VALUES
                    ('ADM001', 'Admin', 'User', 'admin@orbai.com', ?, 'admin', 'IT', 'System Administrator', 1),
                    ('MGR001', 'Manager', 'User', 'manager@orbai.com', ?, 'manager', 'HR', 'HR Manager', 1),
                    ('EMP001', 'Alice', 'Johnson', 'alice.johnson@orbai.com', ?, 'employee', 'IT', 'Software Developer', 1)
                `, [hashedPassword, hashedPassword, hashedPassword], function(err) {
                    if (err) {
                        console.error('Error inserting demo users:', err.message);
                    } else {
                        console.log('Demo users created successfully');
                    }
                });

                console.log('Database tables initialized successfully');
                resolve();
            } catch (error) {
                console.error('Error initializing database:', error.message);
                reject(error);
            }
        });
    });
};

// Test connection
const testConnection = () => {
    return new Promise((resolve, reject) => {
        db.get("SELECT 1", (err, row) => {
            if (err) {
                console.error('Database connection failed:', err.message);
                reject(err);
            } else {
                console.log('Database connected successfully');
                resolve();
            }
        });
    });
};

module.exports = {
    db,
    testConnection,
    initializeDatabase
};