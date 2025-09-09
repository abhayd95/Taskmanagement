const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const { authenticateToken, authorizeRoles, authorizeSelfOrManager } = require('../middleware/auth');
const { validateUser, validateUserUpdate, validateId } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Admin/Manager only)
// @access  Private (Admin/Manager)
router.get('/', authenticateToken, authorizeRoles('admin', 'manager'), async(req, res) => {
    try {
        const { page = 1, limit = 10, search = '', department = '', role = '' } = req.query;
        const offset = (page - 1) * limit;

        let query = `
      SELECT id, employee_id, first_name, last_name, email, role, department, position, phone, 
             hire_date, is_active, created_at, updated_at
      FROM users 
      WHERE 1=1
    `;
        let params = [];

        // Add search filter
        if (search) {
            query += ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR employee_id LIKE ?)`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        // Add department filter
        if (department) {
            query += ` AND department = ?`;
            params.push(department);
        }

        // Add role filter
        if (role) {
            query += ` AND role = ?`;
            params.push(role);
        }

        // Add pagination
        query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [users] = await pool.execute(query, params);

        // Get total count for pagination
        let countQuery = `
      SELECT COUNT(*) as total 
      FROM users 
      WHERE 1=1
    `;
        let countParams = [];

        if (search) {
            countQuery += ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR employee_id LIKE ?)`;
            const searchTerm = `%${search}%`;
            countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (department) {
            countQuery += ` AND department = ?`;
            countParams.push(department);
        }

        if (role) {
            countQuery += ` AND role = ?`;
            countParams.push(role);
        }

        const [countResult] = await pool.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            success: true,
            users,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalUsers: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching users'
        });
    }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Self or Admin/Manager)
router.get('/:id', authenticateToken, validateId, authorizeSelfOrManager, async(req, res) => {
    try {
        const { id } = req.params;

        const [users] = await pool.execute(
            `SELECT id, employee_id, first_name, last_name, email, role, department, position, 
              phone, address, hire_date, is_active, created_at, updated_at
       FROM users WHERE id = ?`, [id]
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
            message: 'Server error while fetching user'
        });
    }
});

// @route   POST /api/users
// @desc    Create new user (Admin only)
// @access  Private (Admin)
router.post('/', authenticateToken, authorizeRoles('admin'), validateUser, async(req, res) => {
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
            message: 'User created successfully',
            user: newUser[0]
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating user'
        });
    }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Self or Admin/Manager)
router.put('/:id', authenticateToken, validateId, authorizeSelfOrManager, validateUserUpdate, async(req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Check if user exists
        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE id = ?', [id]
        );

        if (existingUsers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if email is being changed and if it already exists
        if (updateData.email) {
            const [emailCheck] = await pool.execute(
                'SELECT id FROM users WHERE email = ? AND id != ?', [updateData.email, id]
            );

            if (emailCheck.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
        }

        // Build update query dynamically
        const allowedFields = ['first_name', 'last_name', 'email', 'role', 'department', 'position', 'phone', 'address'];
        const updateFields = [];
        const updateValues = [];

        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                updateFields.push(`${field} = ?`);
                updateValues.push(updateData[field]);
            }
        });

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        updateValues.push(id);

        const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
        await pool.execute(query, updateValues);

        // Get updated user
        const [updatedUser] = await pool.execute(
            'SELECT id, employee_id, first_name, last_name, email, role, department, position, phone, address, hire_date, is_active, created_at, updated_at FROM users WHERE id = ?', [id]
        );

        res.json({
            success: true,
            message: 'User updated successfully',
            user: updatedUser[0]
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating user'
        });
    }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private (Admin)
router.delete('/:id', authenticateToken, authorizeRoles('admin'), validateId, async(req, res) => {
    try {
        const { id } = req.params;

        // Check if user exists
        const [existingUsers] = await pool.execute(
            'SELECT id, employee_id FROM users WHERE id = ?', [id]
        );

        if (existingUsers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent admin from deleting themselves
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        // Soft delete (set is_active to false)
        await pool.execute(
            'UPDATE users SET is_active = false WHERE id = ?', [id]
        );

        res.json({
            success: true,
            message: 'User deactivated successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting user'
        });
    }
});

// @route   PUT /api/users/:id/activate
// @desc    Activate user (Admin only)
// @access  Private (Admin)
router.put('/:id/activate', authenticateToken, authorizeRoles('admin'), validateId, async(req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.execute(
            'UPDATE users SET is_active = true WHERE id = ?', [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User activated successfully'
        });
    } catch (error) {
        console.error('Activate user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while activating user'
        });
    }
});

// @route   GET /api/users/departments
// @desc    Get all departments
// @access  Private (Admin/Manager)
router.get('/departments', authenticateToken, authorizeRoles('admin', 'manager'), async(req, res) => {
    try {
        const [departments] = await pool.execute(
            'SELECT DISTINCT department FROM users WHERE department IS NOT NULL AND department != "" ORDER BY department'
        );

        res.json({
            success: true,
            departments: departments.map(d => d.department)
        });
    } catch (error) {
        console.error('Get departments error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching departments'
        });
    }
});

module.exports = router;