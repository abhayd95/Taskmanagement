const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

// User validation rules
const validateUser = [
    body('employee_id')
    .notEmpty()
    .withMessage('Employee ID is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Employee ID must be between 3 and 50 characters'),
    body('first_name')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be between 2 and 100 characters'),
    body('last_name')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be between 2 and 100 characters'),
    body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
    body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
    body('role')
    .optional()
    .isIn(['admin', 'manager', 'employee'])
    .withMessage('Role must be admin, manager, or employee'),
    body('department')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Department must be less than 100 characters'),
    body('position')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Position must be less than 100 characters'),
    body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
    handleValidationErrors
];

const validateUserUpdate = [
    body('first_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be between 2 and 100 characters'),
    body('last_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be between 2 and 100 characters'),
    body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
    body('role')
    .optional()
    .isIn(['admin', 'manager', 'employee'])
    .withMessage('Role must be admin, manager, or employee'),
    body('department')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Department must be less than 100 characters'),
    body('position')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Position must be less than 100 characters'),
    body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
    handleValidationErrors
];

// Auth validation rules
const validateLogin = [
    body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
    body('password')
    .notEmpty()
    .withMessage('Password is required'),
    handleValidationErrors
];

const validatePasswordChange = [
    body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
    body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
    handleValidationErrors
];

// Task validation rules
const validateTask = [
    body('title')
    .notEmpty()
    .withMessage('Task title is required')
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),
    body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
    body('assigned_to')
    .isInt({ min: 1 })
    .withMessage('Valid assigned user ID is required'),
    body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
    body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
    handleValidationErrors
];

const validateTaskUpdate = [
    body('title')
    .optional()
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),
    body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
    body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
    body('status')
    .optional()
    .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Status must be pending, in_progress, completed, or cancelled'),
    body('due_date')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
    handleValidationErrors
];

// Attendance validation rules
const validateAttendanceCheckIn = [
    body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
    handleValidationErrors
];

const validateAttendanceCheckOut = [
    body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
    handleValidationErrors
];

// Report validation rules
const validateReportQuery = [
    query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
    query('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
    query('user_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('User ID must be a valid integer'),
    query('department')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Department must be less than 100 characters'),
    handleValidationErrors
];

// ID parameter validation
const validateId = [
    param('id')
    .isInt({ min: 1 })
    .withMessage('Valid ID is required'),
    handleValidationErrors
];

module.exports = {
    validateUser,
    validateUserUpdate,
    validateLogin,
    validatePasswordChange,
    validateTask,
    validateTaskUpdate,
    validateAttendanceCheckIn,
    validateAttendanceCheckOut,
    validateReportQuery,
    validateId,
    handleValidationErrors
};