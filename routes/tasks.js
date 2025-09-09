const express = require('express');
const moment = require('moment');
const { pool } = require('../config/database');
const { authenticateToken, authorizeRoles, authorizeSelfOrManager } = require('../middleware/auth');
const { validateTask, validateTaskUpdate, validateId } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/tasks
// @desc    Get all tasks
// @access  Private
router.get('/', authenticateToken, async(req, res) => {
    try {
        const {
            page = 1,
                limit = 20,
                status,
                priority,
                assigned_to,
                assigned_by,
                search,
                due_date_from,
                due_date_to
        } = req.query;
        const offset = (page - 1) * limit;
        const userId = req.user.id;
        const userRole = req.user.role;

        let query = `
      SELECT t.id, t.title, t.description, t.priority, t.status, t.due_date, t.completed_at, 
             t.created_at, t.updated_at,
             assigned_to_user.employee_id as assigned_to_employee_id,
             assigned_to_user.first_name as assigned_to_first_name,
             assigned_to_user.last_name as assigned_to_last_name,
             assigned_to_user.department as assigned_to_department,
             assigned_by_user.employee_id as assigned_by_employee_id,
             assigned_by_user.first_name as assigned_by_first_name,
             assigned_by_user.last_name as assigned_by_last_name
      FROM tasks t
      JOIN users assigned_to_user ON t.assigned_to = assigned_to_user.id
      JOIN users assigned_by_user ON t.assigned_by = assigned_by_user.id
      WHERE 1=1
    `;
        let params = [];

        // Role-based filtering
        if (userRole === 'employee') {
            query += ` AND t.assigned_to = ?`;
            params.push(userId);
        } else if (userRole === 'manager') {
            // Manager can see tasks assigned to their team members
            // For now, we'll show all tasks, but this can be refined based on team structure
        }

        // Add filters
        if (status) {
            query += ` AND t.status = ?`;
            params.push(status);
        }
        if (priority) {
            query += ` AND t.priority = ?`;
            params.push(priority);
        }
        if (assigned_to) {
            query += ` AND t.assigned_to = ?`;
            params.push(assigned_to);
        }
        if (assigned_by) {
            query += ` AND t.assigned_by = ?`;
            params.push(assigned_by);
        }
        if (search) {
            query += ` AND (t.title LIKE ? OR t.description LIKE ?)`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }
        if (due_date_from) {
            query += ` AND t.due_date >= ?`;
            params.push(due_date_from);
        }
        if (due_date_to) {
            query += ` AND t.due_date <= ?`;
            params.push(due_date_to);
        }

        query += ` ORDER BY t.created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [tasks] = await pool.execute(query, params);

        // Get total count
        let countQuery = `
      SELECT COUNT(*) as total
      FROM tasks t
      WHERE 1=1
    `;
        let countParams = [];

        if (userRole === 'employee') {
            countQuery += ` AND t.assigned_to = ?`;
            countParams.push(userId);
        }

        if (status) {
            countQuery += ` AND t.status = ?`;
            countParams.push(status);
        }
        if (priority) {
            countQuery += ` AND t.priority = ?`;
            countParams.push(priority);
        }
        if (assigned_to) {
            countQuery += ` AND t.assigned_to = ?`;
            countParams.push(assigned_to);
        }
        if (assigned_by) {
            countQuery += ` AND t.assigned_by = ?`;
            countParams.push(assigned_by);
        }
        if (search) {
            countQuery += ` AND (t.title LIKE ? OR t.description LIKE ?)`;
            const searchTerm = `%${search}%`;
            countParams.push(searchTerm, searchTerm);
        }
        if (due_date_from) {
            countQuery += ` AND t.due_date >= ?`;
            countParams.push(due_date_from);
        }
        if (due_date_to) {
            countQuery += ` AND t.due_date <= ?`;
            countParams.push(due_date_to);
        }

        const [countResult] = await pool.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            success: true,
            tasks,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalTasks: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching tasks'
        });
    }
});

// @route   GET /api/tasks/:id
// @desc    Get task by ID
// @access  Private
router.get('/:id', authenticateToken, validateId, async(req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const [tasks] = await pool.execute(
            `SELECT t.id, t.title, t.description, t.priority, t.status, t.due_date, t.completed_at, 
              t.created_at, t.updated_at,
              assigned_to_user.employee_id as assigned_to_employee_id,
              assigned_to_user.first_name as assigned_to_first_name,
              assigned_to_user.last_name as assigned_to_last_name,
              assigned_to_user.department as assigned_to_department,
              assigned_by_user.employee_id as assigned_by_employee_id,
              assigned_by_user.first_name as assigned_by_first_name,
              assigned_by_user.last_name as assigned_by_last_name
       FROM tasks t
       JOIN users assigned_to_user ON t.assigned_to = assigned_to_user.id
       JOIN users assigned_by_user ON t.assigned_by = assigned_by_user.id
       WHERE t.id = ?`, [id]
        );

        if (tasks.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        const task = tasks[0];

        // Check if user has permission to view this task
        if (userRole === 'employee' && task.assigned_to !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied - insufficient permissions'
            });
        }

        res.json({
            success: true,
            task
        });
    } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching task'
        });
    }
});

// @route   POST /api/tasks
// @desc    Create new task
// @access  Private (Manager/Admin)
router.post('/', authenticateToken, authorizeRoles('admin', 'manager'), validateTask, async(req, res) => {
    try {
        const {
            title,
            description,
            assigned_to,
            priority = 'medium',
            due_date
        } = req.body;

        // Check if assigned user exists and is active
        const [assignedUser] = await pool.execute(
            'SELECT id, first_name, last_name FROM users WHERE id = ? AND is_active = true', [assigned_to]
        );

        if (assignedUser.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Assigned user not found or inactive'
            });
        }

        // Insert task
        const [result] = await pool.execute(
            `INSERT INTO tasks (title, description, assigned_to, assigned_by, priority, due_date) 
       VALUES (?, ?, ?, ?, ?, ?)`, [title, description, assigned_to, req.user.id, priority, due_date]
        );

        // Get created task with user details
        const [newTask] = await pool.execute(
            `SELECT t.id, t.title, t.description, t.priority, t.status, t.due_date, t.created_at,
              assigned_to_user.employee_id as assigned_to_employee_id,
              assigned_to_user.first_name as assigned_to_first_name,
              assigned_to_user.last_name as assigned_to_last_name,
              assigned_by_user.employee_id as assigned_by_employee_id,
              assigned_by_user.first_name as assigned_by_first_name,
              assigned_by_user.last_name as assigned_by_last_name
       FROM tasks t
       JOIN users assigned_to_user ON t.assigned_to = assigned_to_user.id
       JOIN users assigned_by_user ON t.assigned_by = assigned_by_user.id
       WHERE t.id = ?`, [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            task: newTask[0]
        });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating task'
        });
    }
});

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', authenticateToken, validateId, validateTaskUpdate, async(req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Check if task exists and get current data
        const [existingTasks] = await pool.execute(
            'SELECT * FROM tasks WHERE id = ?', [id]
        );

        if (existingTasks.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        const existingTask = existingTasks[0];

        // Check permissions
        if (userRole === 'employee') {
            if (existingTask.assigned_to !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied - insufficient permissions'
                });
            }
            // Employees can only update status and description
            const allowedFields = ['status', 'description'];
            const filteredData = {};
            allowedFields.forEach(field => {
                if (updateData[field] !== undefined) {
                    filteredData[field] = updateData[field];
                }
            });
            updateData = filteredData;
        }

        // Build update query
        const allowedFields = ['title', 'description', 'priority', 'status', 'due_date', 'assigned_to'];
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

        // If status is being changed to completed, set completed_at
        if (updateData.status === 'completed' && existingTask.status !== 'completed') {
            updateFields.push('completed_at = ?');
            updateValues.push(moment().format('YYYY-MM-DD HH:mm:ss'));
        } else if (updateData.status !== 'completed' && existingTask.status === 'completed') {
            updateFields.push('completed_at = NULL');
        }

        updateValues.push(id);

        const query = `UPDATE tasks SET ${updateFields.join(', ')} WHERE id = ?`;
        await pool.execute(query, updateValues);

        // Get updated task
        const [updatedTask] = await pool.execute(
            `SELECT t.id, t.title, t.description, t.priority, t.status, t.due_date, t.completed_at, 
              t.created_at, t.updated_at,
              assigned_to_user.employee_id as assigned_to_employee_id,
              assigned_to_user.first_name as assigned_to_first_name,
              assigned_to_user.last_name as assigned_to_last_name,
              assigned_by_user.employee_id as assigned_by_employee_id,
              assigned_by_user.first_name as assigned_by_first_name,
              assigned_by_user.last_name as assigned_by_last_name
       FROM tasks t
       JOIN users assigned_to_user ON t.assigned_to = assigned_to_user.id
       JOIN users assigned_by_user ON t.assigned_by = assigned_by_user.id
       WHERE t.id = ?`, [id]
        );

        res.json({
            success: true,
            message: 'Task updated successfully',
            task: updatedTask[0]
        });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating task'
        });
    }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private (Admin/Manager)
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'manager'), validateId, async(req, res) => {
    try {
        const { id } = req.params;

        // Check if task exists
        const [existingTasks] = await pool.execute(
            'SELECT id FROM tasks WHERE id = ?', [id]
        );

        if (existingTasks.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // Delete task
        await pool.execute('DELETE FROM tasks WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Task deleted successfully'
        });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting task'
        });
    }
});

// @route   GET /api/tasks/stats/overview
// @desc    Get task statistics overview
// @access  Private
router.get('/stats/overview', authenticateToken, async(req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        let whereClause = '';
        let params = [];

        if (userRole === 'employee') {
            whereClause = 'WHERE assigned_to = ?';
            params = [userId];
        }

        // Get task counts by status
        const [statusStats] = await pool.execute(
            `SELECT status, COUNT(*) as count 
       FROM tasks ${whereClause}
       GROUP BY status`,
            params
        );

        // Get task counts by priority
        const [priorityStats] = await pool.execute(
            `SELECT priority, COUNT(*) as count 
       FROM tasks ${whereClause}
       GROUP BY priority`,
            params
        );

        // Get overdue tasks
        const [overdueTasks] = await pool.execute(
            `SELECT COUNT(*) as count 
       FROM tasks 
       ${whereClause} ${whereClause ? 'AND' : 'WHERE'} 
       due_date < CURDATE() AND status NOT IN ('completed', 'cancelled')`,
            params
        );

        // Get tasks due today
        const [todayTasks] = await pool.execute(
            `SELECT COUNT(*) as count 
       FROM tasks 
       ${whereClause} ${whereClause ? 'AND' : 'WHERE'} 
       due_date = CURDATE() AND status NOT IN ('completed', 'cancelled')`,
            params
        );

        res.json({
            success: true,
            stats: {
                byStatus: statusStats,
                byPriority: priorityStats,
                overdue: overdueTasks[0].count,
                dueToday: todayTasks[0].count
            }
        });
    } catch (error) {
        console.error('Get task stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching task statistics'
        });
    }
});

// @route   GET /api/tasks/my-tasks
// @desc    Get current user's tasks
// @access  Private (Employee)
router.get('/my-tasks', authenticateToken, async(req, res) => {
    try {
        const { status, priority } = req.query;
        const userId = req.user.id;

        let query = `
      SELECT t.id, t.title, t.description, t.priority, t.status, t.due_date, t.completed_at, 
             t.created_at, t.updated_at,
             assigned_by_user.employee_id as assigned_by_employee_id,
             assigned_by_user.first_name as assigned_by_first_name,
             assigned_by_user.last_name as assigned_by_last_name
      FROM tasks t
      JOIN users assigned_by_user ON t.assigned_by = assigned_by_user.id
      WHERE t.assigned_to = ?
    `;
        let params = [userId];

        if (status) {
            query += ` AND t.status = ?`;
            params.push(status);
        }
        if (priority) {
            query += ` AND t.priority = ?`;
            params.push(priority);
        }

        query += ` ORDER BY t.created_at DESC`;

        const [tasks] = await pool.execute(query, params);

        res.json({
            success: true,
            tasks
        });
    } catch (error) {
        console.error('Get my tasks error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching your tasks'
        });
    }
});

module.exports = router;