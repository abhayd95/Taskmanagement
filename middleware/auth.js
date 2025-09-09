const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const authenticateToken = async(req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user details from database
        const [users] = await pool.execute(
            'SELECT id, employee_id, first_name, last_name, email, role, is_active FROM users WHERE id = ?', [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token - user not found'
            });
        }

        const user = users[0];

        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }

        return res.status(403).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        next();
    };
};

const authorizeSelfOrManager = async(req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    const targetUserId = parseInt(req.params.userId || req.params.id);
    const currentUserId = req.user.id;
    const userRole = req.user.role;

    // Allow if user is accessing their own data
    if (targetUserId === currentUserId) {
        return next();
    }

    // Allow if user is admin or manager
    if (userRole === 'admin' || userRole === 'manager') {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: 'Access denied - insufficient permissions'
    });
};

module.exports = {
    authenticateToken,
    authorizeRoles,
    authorizeSelfOrManager
};