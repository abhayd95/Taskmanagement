const express = require('express');
const moment = require('moment');
const { pool } = require('../config/database');
const { authenticateToken, authorizeRoles, authorizeSelfOrManager } = require('../middleware/auth');
const { validateAttendanceCheckIn, validateAttendanceCheckOut, validateId, validateReportQuery } = require('../middleware/validation');

const router = express.Router();

// @route   POST /api/attendance/check-in
// @desc    Check in for the day
// @access  Private (Employee)
router.post('/check-in', authenticateToken, validateAttendanceCheckIn, async(req, res) => {
    try {
        const { notes } = req.body;
        const userId = req.user.id;
        const today = moment().format('YYYY-MM-DD');
        const checkInTime = moment().format('YYYY-MM-DD HH:mm:ss');

        // Check if already checked in today
        const [existingRecord] = await pool.execute(
            'SELECT id, check_in_time FROM attendance_records WHERE user_id = ? AND date = ?', [userId, today]
        );

        if (existingRecord.length > 0 && existingRecord[0].check_in_time) {
            return res.status(400).json({
                success: false,
                message: 'Already checked in today'
            });
        }

        // Determine if late (assuming work starts at 9:00 AM)
        const workStartTime = moment().hour(9).minute(0).second(0);
        const isLate = moment().isAfter(workStartTime);
        const status = isLate ? 'late' : 'present';

        if (existingRecord.length > 0) {
            // Update existing record
            await pool.execute(
                'UPDATE attendance_records SET check_in_time = ?, status = ?, notes = ? WHERE id = ?', [checkInTime, status, notes, existingRecord[0].id]
            );
        } else {
            // Create new record
            await pool.execute(
                'INSERT INTO attendance_records (user_id, check_in_time, status, notes, date) VALUES (?, ?, ?, ?, ?)', [userId, checkInTime, status, notes, today]
            );
        }

        res.json({
            success: true,
            message: 'Checked in successfully',
            checkInTime,
            status,
            isLate
        });
    } catch (error) {
        console.error('Check-in error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during check-in'
        });
    }
});

// @route   POST /api/attendance/check-out
// @desc    Check out for the day
// @access  Private (Employee)
router.post('/check-out', authenticateToken, validateAttendanceCheckOut, async(req, res) => {
    try {
        const { notes } = req.body;
        const userId = req.user.id;
        const today = moment().format('YYYY-MM-DD');
        const checkOutTime = moment().format('YYYY-MM-DD HH:mm:ss');

        // Get today's attendance record
        const [attendanceRecord] = await pool.execute(
            'SELECT id, check_in_time, check_out_time FROM attendance_records WHERE user_id = ? AND date = ?', [userId, today]
        );

        if (attendanceRecord.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No check-in record found for today'
            });
        }

        const record = attendanceRecord[0];

        if (!record.check_in_time) {
            return res.status(400).json({
                success: false,
                message: 'Must check in before checking out'
            });
        }

        if (record.check_out_time) {
            return res.status(400).json({
                success: false,
                message: 'Already checked out today'
            });
        }

        // Calculate work hours
        const checkInMoment = moment(record.check_in_time);
        const checkOutMoment = moment(checkOutTime);
        const workHours = checkOutMoment.diff(checkInMoment, 'hours', true);

        // Calculate overtime (assuming 8 hours is standard)
        const standardHours = 8;
        const overtimeHours = Math.max(0, workHours - standardHours);

        // Update attendance record
        await pool.execute(
            `UPDATE attendance_records 
       SET check_out_time = ?, work_hours = ?, overtime_hours = ?, notes = CONCAT(IFNULL(notes, ''), IFNULL(?, ''))
       WHERE id = ?`, [checkOutTime, workHours, overtimeHours, notes ? `\nCheck-out notes: ${notes}` : '', record.id]
        );

        res.json({
            success: true,
            message: 'Checked out successfully',
            checkOutTime,
            workHours: parseFloat(workHours.toFixed(2)),
            overtimeHours: parseFloat(overtimeHours.toFixed(2))
        });
    } catch (error) {
        console.error('Check-out error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during check-out'
        });
    }
});

// @route   GET /api/attendance/my-records
// @desc    Get current user's attendance records
// @access  Private (Employee)
router.get('/my-records', authenticateToken, async(req, res) => {
    try {
        const { page = 1, limit = 30, start_date, end_date } = req.query;
        const offset = (page - 1) * limit;
        const userId = req.user.id;

        let query = `
      SELECT id, check_in_time, check_out_time, work_hours, break_duration, overtime_hours, 
             status, notes, date, created_at, updated_at
      FROM attendance_records 
      WHERE user_id = ?
    `;
        let params = [userId];

        // Add date filters
        if (start_date) {
            query += ` AND date >= ?`;
            params.push(start_date);
        }
        if (end_date) {
            query += ` AND date <= ?`;
            params.push(end_date);
        }

        query += ` ORDER BY date DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [records] = await pool.execute(query, params);

        // Get total count
        let countQuery = `SELECT COUNT(*) as total FROM attendance_records WHERE user_id = ?`;
        let countParams = [userId];

        if (start_date) {
            countQuery += ` AND date >= ?`;
            countParams.push(start_date);
        }
        if (end_date) {
            countQuery += ` AND date <= ?`;
            countParams.push(end_date);
        }

        const [countResult] = await pool.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            success: true,
            records,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Get attendance records error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching attendance records'
        });
    }
});

// @route   GET /api/attendance/records
// @desc    Get all attendance records (Admin/Manager only)
// @access  Private (Admin/Manager)
router.get('/records', authenticateToken, authorizeRoles('admin', 'manager'), validateReportQuery, async(req, res) => {
    try {
        const {
            page = 1,
                limit = 30,
                start_date,
                end_date,
                user_id,
                department,
                status
        } = req.query;
        const offset = (page - 1) * limit;

        let query = `
      SELECT ar.id, ar.check_in_time, ar.check_out_time, ar.work_hours, ar.break_duration, 
             ar.overtime_hours, ar.status, ar.notes, ar.date, ar.created_at, ar.updated_at,
             u.employee_id, u.first_name, u.last_name, u.department, u.position
      FROM attendance_records ar
      JOIN users u ON ar.user_id = u.id
      WHERE 1=1
    `;
        let params = [];

        // Add filters
        if (start_date) {
            query += ` AND ar.date >= ?`;
            params.push(start_date);
        }
        if (end_date) {
            query += ` AND ar.date <= ?`;
            params.push(end_date);
        }
        if (user_id) {
            query += ` AND ar.user_id = ?`;
            params.push(user_id);
        }
        if (department) {
            query += ` AND u.department = ?`;
            params.push(department);
        }
        if (status) {
            query += ` AND ar.status = ?`;
            params.push(status);
        }

        query += ` ORDER BY ar.date DESC, u.first_name, u.last_name LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [records] = await pool.execute(query, params);

        // Get total count
        let countQuery = `
      SELECT COUNT(*) as total
      FROM attendance_records ar
      JOIN users u ON ar.user_id = u.id
      WHERE 1=1
    `;
        let countParams = [];

        if (start_date) {
            countQuery += ` AND ar.date >= ?`;
            countParams.push(start_date);
        }
        if (end_date) {
            countQuery += ` AND ar.date <= ?`;
            countParams.push(end_date);
        }
        if (user_id) {
            countQuery += ` AND ar.user_id = ?`;
            countParams.push(user_id);
        }
        if (department) {
            countQuery += ` AND u.department = ?`;
            countParams.push(department);
        }
        if (status) {
            countQuery += ` AND ar.status = ?`;
            countParams.push(status);
        }

        const [countResult] = await pool.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            success: true,
            records,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Get all attendance records error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching attendance records'
        });
    }
});

// @route   GET /api/attendance/records/:id
// @desc    Get specific attendance record
// @access  Private (Self or Admin/Manager)
router.get('/records/:id', authenticateToken, validateId, authorizeSelfOrManager, async(req, res) => {
    try {
        const { id } = req.params;

        const [records] = await pool.execute(
            `SELECT ar.id, ar.check_in_time, ar.check_out_time, ar.work_hours, ar.break_duration, 
              ar.overtime_hours, ar.status, ar.notes, ar.date, ar.created_at, ar.updated_at,
              u.employee_id, u.first_name, u.last_name, u.department, u.position
       FROM attendance_records ar
       JOIN users u ON ar.user_id = u.id
       WHERE ar.id = ?`, [id]
        );

        if (records.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }

        res.json({
            success: true,
            record: records[0]
        });
    } catch (error) {
        console.error('Get attendance record error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching attendance record'
        });
    }
});

// @route   PUT /api/attendance/records/:id
// @desc    Update attendance record (Admin only)
// @access  Private (Admin)
router.put('/records/:id', authenticateToken, authorizeRoles('admin'), validateId, async(req, res) => {
    try {
        const { id } = req.params;
        const { check_in_time, check_out_time, work_hours, break_duration, overtime_hours, status, notes } = req.body;

        // Check if record exists
        const [existingRecord] = await pool.execute(
            'SELECT id FROM attendance_records WHERE id = ?', [id]
        );

        if (existingRecord.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }

        // Build update query
        const updateFields = [];
        const updateValues = [];

        if (check_in_time !== undefined) {
            updateFields.push('check_in_time = ?');
            updateValues.push(check_in_time);
        }
        if (check_out_time !== undefined) {
            updateFields.push('check_out_time = ?');
            updateValues.push(check_out_time);
        }
        if (work_hours !== undefined) {
            updateFields.push('work_hours = ?');
            updateValues.push(work_hours);
        }
        if (break_duration !== undefined) {
            updateFields.push('break_duration = ?');
            updateValues.push(break_duration);
        }
        if (overtime_hours !== undefined) {
            updateFields.push('overtime_hours = ?');
            updateValues.push(overtime_hours);
        }
        if (status !== undefined) {
            updateFields.push('status = ?');
            updateValues.push(status);
        }
        if (notes !== undefined) {
            updateFields.push('notes = ?');
            updateValues.push(notes);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        updateValues.push(id);

        const query = `UPDATE attendance_records SET ${updateFields.join(', ')} WHERE id = ?`;
        await pool.execute(query, updateValues);

        res.json({
            success: true,
            message: 'Attendance record updated successfully'
        });
    } catch (error) {
        console.error('Update attendance record error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating attendance record'
        });
    }
});

// @route   GET /api/attendance/today-status
// @desc    Get today's attendance status for current user
// @access  Private (Employee)
router.get('/today-status', authenticateToken, async(req, res) => {
    try {
        const userId = req.user.id;
        const today = moment().format('YYYY-MM-DD');

        const [records] = await pool.execute(
            'SELECT * FROM attendance_records WHERE user_id = ? AND date = ?', [userId, today]
        );

        if (records.length === 0) {
            return res.json({
                success: true,
                status: 'not_checked_in',
                message: 'Not checked in today'
            });
        }

        const record = records[0];
        let status = 'checked_in';
        let message = 'Checked in';

        if (record.check_out_time) {
            status = 'checked_out';
            message = 'Checked out';
        }

        res.json({
            success: true,
            status,
            message,
            record: {
                checkInTime: record.check_in_time,
                checkOutTime: record.check_out_time,
                workHours: record.work_hours,
                overtimeHours: record.overtime_hours,
                status: record.status
            }
        });
    } catch (error) {
        console.error('Get today status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching today status'
        });
    }
});

module.exports = router;