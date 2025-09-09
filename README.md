# OrbAi - Attendance & Task Management System

A comprehensive full-stack web application that combines employee attendance tracking and task management functionality. Built with React, Node.js, Express, and MySQL.

## 🚀 Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Manager, Employee)
- Secure password hashing with bcrypt
- Session management

### Attendance Management
- Employee check-in/check-out functionality
- Real-time attendance tracking
- Overtime calculation
- Attendance reports and analytics
- Export to Excel functionality
- Late arrival detection

### Task Management
- Create, assign, and track tasks
- Priority levels (Low, Medium, High, Urgent)
- Status tracking (Pending, In Progress, Completed, Cancelled)
- Due date management
- Task filtering and search
- Progress monitoring

### Dashboard & Reports
- Role-based dashboards
- Real-time statistics
- Department-wise analytics
- Export capabilities
- Visual charts and graphs

### User Management
- Complete CRUD operations for users
- Department management
- User activation/deactivation
- Profile management

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Express Validator** - Input validation
- **Helmet** - Security middleware
- **Rate Limiting** - API protection

### Frontend
- **React 18** - UI library
- **React Router** - Navigation
- **React Query** - Data fetching
- **React Hook Form** - Form management
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Date-fns** - Date utilities

### Database
- **MySQL 8.0** - Primary database
- **Proper indexing** - Performance optimization
- **Foreign key constraints** - Data integrity

## 📋 Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- npm or yarn
- Git

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd OrbAi
```

### 2. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Environment Setup

```bash
# Copy environment file
cp env.example .env

# Edit environment variables
nano .env
```

Update the following variables in `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=orbai_attendance_system
JWT_SECRET=your_super_secret_jwt_key
```

### 4. Database Setup

```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE orbai_attendance_system;

# Initialize database with sample data
node scripts/init-db.js
```

### 5. Start Development Servers

```bash
# Start backend server
npm run dev

# Start frontend server (in another terminal)
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🔐 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@orbai.com | admin123 |
| Manager | manager@orbai.com | admin123 |
| Employee | alice.johnson@orbai.com | admin123 |

**⚠️ Important:** Change these passwords immediately after first login!

## 📁 Project Structure

```
OrbAi/
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   ├── auth.js             # Authentication middleware
│   └── validation.js       # Input validation
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── users.js            # User management routes
│   ├── attendance.js       # Attendance routes
│   ├── tasks.js            # Task management routes
│   └── reports.js          # Reports routes
├── database/
│   └── init.sql            # Database schema and seed data
├── scripts/
│   └── init-db.js          # Database initialization script
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   └── App.js          # Main App component
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml      # Docker configuration
├── Dockerfile.backend      # Backend Dockerfile
├── server.js              # Main server file
└── package.json
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (Admin only)
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users` - Get all users (Admin/Manager)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (Admin)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin)

### Attendance
- `POST /api/attendance/check-in` - Check in
- `POST /api/attendance/check-out` - Check out
- `GET /api/attendance/my-records` - Get user's attendance
- `GET /api/attendance/records` - Get all records (Admin/Manager)
- `GET /api/attendance/today-status` - Get today's status

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create task (Manager/Admin)
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task (Manager/Admin)

### Reports
- `GET /api/reports/attendance` - Attendance report
- `GET /api/reports/tasks` - Task report
- `GET /api/reports/dashboard` - Dashboard statistics

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Individual Services

```bash
# Backend only
docker build -f Dockerfile.backend -t orbai-backend .
docker run -p 5000:5000 orbai-backend

# Frontend only
cd frontend
docker build -t orbai-frontend .
docker run -p 3000:80 orbai-frontend
```

## 🚀 Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed production deployment instructions including:

- Coolify deployment on Contabo VPS
- Nginx configuration
- SSL certificate setup
- Database backup strategies
- Monitoring and maintenance

## 🧪 Testing

```bash
# Run backend tests
npm test

# Run frontend tests
cd frontend
npm test
```

## 📊 Database Schema

### Users Table
- User information and authentication
- Role-based access control
- Department and position tracking

### Attendance Records Table
- Check-in/check-out timestamps
- Work hours calculation
- Overtime tracking
- Status management

### Tasks Table
- Task details and assignments
- Priority and status tracking
- Due date management
- Progress monitoring

### Additional Tables
- Leave requests
- Notifications
- Audit logs

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- CORS protection
- Security headers
- SQL injection prevention

## 📈 Performance Optimizations

- Database indexing
- Query optimization
- Caching strategies
- Lazy loading
- Image optimization
- Bundle splitting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Contact the development team

## 🔄 Changelog

### Version 1.0.0
- Initial release
- Complete attendance management
- Task management system
- User management
- Role-based dashboards
- Report generation
- Docker support

## 🙏 Acknowledgments

- React team for the amazing framework
- Express.js for the robust backend
- MySQL for reliable data storage
- All open-source contributors

---

**Built with ❤️ by the OrbAi Team**
