const express = require('express');
const moment = require('moment');
const XLSX = require('xlsx');
const { pool } = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateReportQuery, validateId } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/reports/attendance
// @desc    Get attendance report
// @access  Private (Admin/Manager)
router.get('/attendance', authenticateToken, authorizeRoles('admin', 'manager'), validateReportQuery, async(req, res) => {
    try {
        const {
            start_date,
            end_date,
            user_id,
            department,
            format = 'json'
        } = req.query;

        // Set default date range if not provided
        const startDate = start_date || moment().subtract(30, 'days').format('YYYY-MM-DD');
        const endDate = end_date || moment().format('YYYY-MM-DD');

        let query = `
      SELECT 
        u.employee_id,
        u.first_name,
        u.last_name,
        u.department,
        u.position,
        ar.date,
        ar.check_in_time,
        ar.check_out_time,
        ar.work_hours,
        ar.overtime_hours,
        ar.status,
        ar.notes
      FROM attendance_records ar
      JOIN users u ON ar.user_id = u.id
      WHERE ar.date BETWEEN ? AND ?
    `;
        let params = [startDate, endDate];

        // Add filters
        if (user_id) {
            query += ` AND ar.user_id = ?`;
            params.push(user_id);
        }
        if (department) {
            query += ` AND u.department = ?`;
            params.push(department);
        }

        query += ` ORDER BY u.department, u.first_name, u.last_name, ar.date`;

        const [records] = await pool.execute(query, params);

        // Calculate summary statistics
        const summary = {
            totalRecords: records.length,
            totalWorkHours: records.reduce((sum, record) => sum + (record.work_hours || 0), 0),
            totalOvertimeHours: records.reduce((sum, record) => sum + (record.overtime_hours || 0), 0),
            averageWorkHours: records.length > 0 ?
                records.reduce((sum, record) => sum + (record.work_hours || 0), 0) / records.length : 0,
            statusCounts: {
                present: records.filter(r => r.status === 'present').length,
                late: records.filter(r => r.status === 'late').length,
                absent: records.filter(r => r.status === 'absent').length,
                half_day: records.filter(r => r.status === 'half_day').length
            }
        };

        if (format === 'excel') {
            // Generate Excel file
            const workbook = XLSX.utils.book_new();

            // Add summary sheet
            const summaryData = [
                ['Attendance Report Summary'],
                [''],
                ['Report Period', `${startDate} to ${endDate}`],
                ['Total Records', summary.totalRecords],
                ['Total Work Hours', summary.totalWorkHours.toFixed(2)],
                ['Total Overtime Hours', summary.totalOvertimeHours.toFixed(2)],
                ['Average Work Hours per Day', summary.averageWorkHours.toFixed(2)],
                [''],
                ['Status Breakdown'],
                ['Present', summary.statusCounts.present],
                ['Late', summary.statusCounts.late],
                ['Absent', summary.statusCounts.absent],
                ['Half Day', summary.statusCounts.half_day]
            ];

            const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

            // Add detailed records sheet
            const recordsData = [
                ['Employee ID', 'Name', 'Department', 'Position', 'Date', 'Check In', 'Check Out', 'Work Hours', 'Overtime', 'Status', 'Notes']
            ];

            records.forEach(record => {
                recordsData.push([
                    record.employee_id,
                    `${record.first_name} ${record.last_name}`,
                    record.department || '',
                    record.position || '',
                    record.date,
                    record.check_in_time ? moment(record.check_in_time).format('HH:mm:ss') : '',
                    record.check_out_time ? moment(record.check_out_time).format('HH:mm:ss') : '',
                    record.work_hours || 0,
                    record.overtime_hours || 0,
                    record.status,
                    record.notes || ''
                ]);
            });

            const recordsSheet = XLSX.utils.aoa_to_sheet(recordsData);
            XLSX.utils.book_append_sheet(workbook, recordsSheet, 'Attendance Records');

            // Generate buffer
            const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${startDate}_to_${endDate}.xlsx`);
            res.send(buffer);
        } else {
            res.json({
                success: true,
                summary,
                records,
                filters: {
                    start_date: startDate,
                    end_date: endDate,
                    user_id,
                    department
                }
            });
        }
    } catch (error) {
        console.error('Get attendance report error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while generating attendance report'
        });
    }
});

// @route   GET /api/reports/tasks
// @desc    Get task report
// @access  Private (Admin/Manager)
router.get('/tasks', authenticateToken, authorizeRoles('admin', 'manager'), validateReportQuery, async(req, res) => {
    try {
        const {
            start_date,
            end_date,
            assigned_to,
            assigned_by,
            status,
            priority,
            format = 'json'
        } = req.query;

        let query = `
      SELECT 
        t.id,
        t.title,
        t.description,
        t.priority,
        t.status,
        t.due_date,
        t.completed_at,
        t.created_at,
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

        // Add date filters
        if (start_date) {
            query += ` AND t.created_at >= ?`;
            params.push(start_date);
        }
        if (end_date) {
            query += ` AND t.created_at <= ?`;
            params.push(end_date);
        }

        // Add other filters
        if (assigned_to) {
            query += ` AND t.assigned_to = ?`;
            params.push(assigned_to);
        }
        if (assigned_by) {
            query += ` AND t.assigned_by = ?`;
            params.push(assigned_by);
        }
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

        // Calculate summary statistics
        const summary = {
            totalTasks: tasks.length,
            completedTasks: tasks.filter(t => t.status === 'completed').length,
            pendingTasks: tasks.filter(t => t.status === 'pending').length,
            inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
            cancelledTasks: tasks.filter(t => t.status === 'cancelled').length,
            overdueTasks: tasks.filter(t =>
                t.due_date &&
                moment(t.due_date).isBefore(moment(), 'day') &&
                !['completed', 'cancelled'].includes(t.status)
            ).length,
            priorityBreakdown: {
                low: tasks.filter(t => t.priority === 'low').length,
                medium: tasks.filter(t => t.priority === 'medium').length,
                high: tasks.filter(t => t.priority === 'high').length,
                urgent: tasks.filter(t => t.priority === 'urgent').length
            }
        };

        if (format === 'excel') {
            // Generate Excel file
            const workbook = XLSX.utils.book_new();

            // Add summary sheet
            const summaryData = [
                ['Task Report Summary'],
                [''],
                ['Total Tasks', summary.totalTasks],
                ['Completed Tasks', summary.completedTasks],
                ['Pending Tasks', summary.pendingTasks],
                ['In Progress Tasks', summary.inProgressTasks],
                ['Cancelled Tasks', summary.cancelledTasks],
                ['Overdue Tasks', summary.overdueTasks],
                [''],
                ['Priority Breakdown'],
                ['Low', summary.priorityBreakdown.low],
                ['Medium', summary.priorityBreakdown.medium],
                ['High', summary.priorityBreakdown.high],
                ['Urgent', summary.priorityBreakdown.urgent]
            ];

            const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

            // Add detailed tasks sheet
            const tasksData = [
                ['ID', 'Title', 'Description', 'Priority', 'Status', 'Due Date', 'Completed Date', 'Assigned To', 'Assigned By', 'Created Date']
            ];

            tasks.forEach(task => {
                tasksData.push([
                    task.id,
                    task.title,
                    task.description || '',
                    task.priority,
                    task.status,
                    task.due_date || '',
                    task.completed_at ? moment(task.completed_at).format('YYYY-MM-DD HH:mm:ss') : '',
                    `${task.assigned_to_first_name} ${task.assigned_to_last_name} (${task.assigned_to_employee_id})`,
                    `${task.assigned_by_first_name} ${task.assigned_by_last_name} (${task.assigned_by_employee_id})`,
                    moment(task.created_at).format('YYYY-MM-DD HH:mm:ss')
                ]);
            });

            const tasksSheet = XLSX.utils.aoa_to_sheet(tasksData);
            XLSX.utils.book_append_sheet(workbook, tasksSheet, 'Tasks');

            // Generate buffer
            const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=task_report_${moment().format('YYYY-MM-DD')}.xlsx`);
            res.send(buffer);
        } else {
            res.json({
                success: true,
                summary,
                tasks,
                filters: {
                    start_date,
                    end_date,
                    assigned_to,
                    assigned_by,
                    status,
                    priority
                }
            });
        }
    } catch (error) {
        console.error('Get task report error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while generating task report'
        });
    }
});

// @route   GET /api/reports/dashboard
// @desc    Get dashboard statistics
// @access  Private
router.get('/dashboard', authenticateToken, async(req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        // Get user statistics
        const [userStats] = await pool.execute(
            'SELECT COUNT(*) as total_users FROM users WHERE is_active = true'
        );

        // Get attendance statistics for today
        const today = moment().format('YYYY-MM-DD');
        const [todayAttendance] = await pool.execute(
            'SELECT COUNT(*) as checked_in_today FROM attendance_records WHERE date = ? AND check_in_time IS NOT NULL', [today]
        );

        // Get task statistics
        let taskQuery = 'SELECT COUNT(*) as total_tasks FROM tasks';
        let taskParams = [];

        if (userRole === 'employee') {
            taskQuery = 'SELECT COUNT(*) as total_tasks FROM tasks WHERE assigned_to = ?';
            taskParams = [userId];
        }

        const [taskStats] = await pool.execute(taskQuery, taskParams);

        // Get recent activities
        const [recentActivities] = await pool.execute(`
      SELECT 'attendance' as type, ar.created_at, u.first_name, u.last_name, 
             CONCAT('Checked in at ', TIME(ar.check_in_time)) as description
      FROM attendance_records ar
      JOIN users u ON ar.user_id = u.id
      WHERE ar.date = ?
      UNION ALL
      SELECT 'task' as type, t.created_at, u.first_name, u.last_name,
             CONCAT('Created task: ', t.title) as description
      FROM tasks t
      JOIN users u ON t.assigned_by = u.id
      WHERE DATE(t.created_at) = ?
      ORDER BY created_at DESC
      LIMIT 10
    `, [today, today]);

        // Get department-wise attendance for managers/admins
        let departmentStats = [];
        if (userRole === 'admin' || userRole === 'manager') {
            const [deptStats] = await pool.execute(`
        SELECT u.department, COUNT(*) as total_employees,
               SUM(CASE WHEN ar.check_in_time IS NOT NULL THEN 1 ELSE 0 END) as present_today
        FROM users u
        LEFT JOIN attendance_records ar ON u.id = ar.user_id AND ar.date = ?
        WHERE u.is_active = true AND u.department IS NOT NULL
        GROUP BY u.department
        ORDER BY u.department
      `, [today]);

            departmentStats = deptStats;
        }

        res.json({
            success: true,
            stats: {
                totalUsers: userStats[0].total_users,
                checkedInToday: todayAttendance[0].checked_in_today,
                totalTasks: taskStats[0].total_tasks,
                recentActivities,
                departmentStats
            }
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching dashboard statistics'
        });
    }
});

// @route   GET /api/reports/employee/:id
// @desc    Get employee performance report
// @access  Private (Admin/Manager)
router.get('/employee/:id', authenticateToken, authorizeRoles('admin', 'manager'), validateId, async(req, res) => {
    try {
        const { id } = req.params;
        const { start_date, end_date } = req.query;

        const startDate = start_date || moment().subtract(30, 'days').format('YYYY-MM-DD');
        const endDate = end_date || moment().format('YYYY-MM-DD');

        // Get employee details
        const [employee] = await pool.execute(
            'SELECT id, employee_id, first_name, last_name, department, position, hire_date FROM users WHERE id = ?', [id]
        );

        if (employee.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Get attendance summary
        const [attendanceSummary] = await pool.execute(`
      SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN check_in_time IS NOT NULL THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
        AVG(work_hours) as avg_work_hours,
        SUM(work_hours) as total_work_hours,
        SUM(overtime_hours) as total_overtime_hours
      FROM attendance_records 
      WHERE user_id = ? AND date BETWEEN ? AND ?
    `, [id, startDate, endDate]);

        // Get task summary
        const [taskSummary] = await pool.execute(`
      SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
        SUM(CASE WHEN due_date < CURDATE() AND status NOT IN ('completed', 'cancelled') THEN 1 ELSE 0 END) as overdue_tasks
      FROM tasks 
      WHERE assigned_to = ? AND created_at BETWEEN ? AND ?
    `, [id, startDate, endDate]);

        // Get recent attendance records
        const [recentAttendance] = await pool.execute(`
      SELECT date, check_in_time, check_out_time, work_hours, status, notes
      FROM attendance_records 
      WHERE user_id = ? AND date BETWEEN ? AND ?
      ORDER BY date DESC
      LIMIT 10
    `, [id, startDate, endDate]);

        // Get recent tasks
        const [recentTasks] = await pool.execute(`
      SELECT id, title, priority, status, due_date, completed_at, created_at
      FROM tasks 
      WHERE assigned_to = ? AND created_at BETWEEN ? AND ?
      ORDER BY created_at DESC
      LIMIT 10
    `, [id, startDate, endDate]);

        res.json({
            success: true,
            employee: employee[0],
            period: { start_date: startDate, end_date: endDate },
            attendance: attendanceSummary[0],
            tasks: taskSummary[0],
            recentAttendance,
            recentTasks
        });
    } catch (error) {
        console.error('Get employee report error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while generating employee report'
        });
    }
});

module.exports = router;