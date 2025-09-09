const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/database-sqlite');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateLogin, validatePasswordChange } = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateLogin, async(req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE email = ? AND is_active = true', [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = users[0];

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = jwt.sign({
                userId: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// @route   POST /api/auth/register
// @desc    Register new user (Admin only)
// @access  Private (Admin)
router.post('/register', authenticateToken, authorizeRoles('admin'), async(req, res) => {
    try {
        const {
            employee_id,
            first_name,
            last_name,
            email,
            password,
            role = 'employee',
            department,
            position,
            phone,
            address,
            hire_date
        } = req.body;

        // Check if user already exists
        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE email = ? OR employee_id = ?', [email, employee_id]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'User with this email or employee ID already exists'
            });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert user
        const [result] = await pool.execute(
            `INSERT INTO users (employee_id, first_name, last_name, email, password, role, department, position, phone, address, hire_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [employee_id, first_name, last_name, email, hashedPassword, role, department, position, phone, address, hire_date]
        );

        // Get created user (without password)
        const [newUser] = await pool.execute(
            'SELECT id, employee_id, first_name, last_name, email, role, department, position, phone, address, hire_date, created_at FROM users WHERE id = ?', [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: newUser[0]
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, async(req, res) => {
    try {
        const [users] = await pool.execute(
            'SELECT id, employee_id, first_name, last_name, email, role, department, position, phone, address, hire_date, created_at FROM users WHERE id = ?', [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: users[0]
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', authenticateToken, validatePasswordChange, async(req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Get current user with password
        const [users] = await pool.execute(
            'SELECT password FROM users WHERE id = ?', [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, users[0].password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await pool.execute(
            'UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, req.user.id]
        );

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during password change'
        });
    }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: 'Logout successful'
    });
});

// @route   POST /api/auth/verify-token
// @desc    Verify JWT token
// @access  Private
router.post('/verify-token', authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: 'Token is valid',
        user: req.user
    });
});

module.exports = router;