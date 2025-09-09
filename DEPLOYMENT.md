# OrbAi Attendance & Task Management System - Deployment Guide

This guide will help you deploy the OrbAi system on a Contabo VPS using Coolify for containerized deployment.

## Prerequisites

- Contabo VPS with Ubuntu 20.04+ or similar
- Docker and Docker Compose installed
- Coolify installed and configured
- Domain name pointing to your VPS (optional but recommended)

## Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd OrbAi

# Copy environment files
cp env.example .env
cp env.production .env.production

# Edit the production environment file
nano .env.production
```

### 2. Configure Environment Variables

Update `.env.production` with your production values:

```bash
# Database Configuration
DB_HOST=mysql
DB_USER=orbai_user
DB_PASSWORD=your_secure_mysql_password_here
DB_NAME=orbai_attendance_system
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_very_long_and_random
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=production

# Frontend URL (for CORS)
FRONTEND_URL=https://yourdomain.com

# React App Configuration
REACT_APP_API_URL=https://yourdomain.com/api
```

### 3. Deploy with Coolify

#### Option A: Using Coolify Web Interface

1. **Create New Project in Coolify:**
   - Go to your Coolify dashboard
   - Click "New Project"
   - Choose "Docker Compose" as the source type
   - Connect your Git repository or upload the project files

2. **Configure Services:**
   - **Backend Service:**
     - Name: `orbai-backend`
     - Dockerfile: `Dockerfile.backend`
     - Port: `5000`
     - Environment: Use `.env.production` values
   
   - **Frontend Service:**
     - Name: `orbai-frontend`
     - Dockerfile: `frontend/Dockerfile`
     - Port: `80`
     - Environment: `REACT_APP_API_URL=https://yourdomain.com/api`

   - **Database Service:**
     - Name: `orbai-mysql`
     - Image: `mysql:8.0`
     - Port: `3306`
     - Environment: Database credentials from `.env.production`

3. **Deploy:**
   - Click "Deploy" for each service
   - Wait for all services to be healthy

#### Option B: Using Docker Compose Directly

```bash
# Build and start all services
docker-compose -f docker-compose.yml --env-file .env.production up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Initialize Database

```bash
# Run database initialization
docker-compose exec backend node scripts/init-db.js

# Or manually connect to MySQL and run the init.sql file
docker-compose exec mysql mysql -u root -p orbai_attendance_system < database/init.sql
```

### 5. Configure Reverse Proxy (Nginx)

If not using Coolify's built-in reverse proxy, set up Nginx:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Manual Installation (Without Coolify)

### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js (for development)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Setup Application

```bash
# Clone repository
git clone <your-repo-url>
cd OrbAi

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Copy and configure environment
cp env.example .env
nano .env
```

### 3. Development Setup

```bash
# Start MySQL (if not using Docker)
sudo systemctl start mysql
sudo systemctl enable mysql

# Initialize database
mysql -u root -p < database/init.sql

# Start backend
npm run dev

# Start frontend (in another terminal)
cd frontend
npm start
```

## Production Deployment

### 1. Using PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start backend with PM2
pm2 start server.js --name "orbai-backend"

# Start frontend build process
cd frontend
npm run build
pm2 serve build 3000 --name "orbai-frontend"

# Save PM2 configuration
pm2 save
pm2 startup
```

### 2. Using Systemd Services

Create service files:

**Backend Service (`/etc/systemd/system/orbai-backend.service`):**
```ini
[Unit]
Description=OrbAi Backend API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/OrbAi
ExecStart=/usr/bin/node server.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

**Frontend Service (`/etc/systemd/system/orbai-frontend.service`):**
```ini
[Unit]
Description=OrbAi Frontend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/OrbAi/frontend
ExecStart=/usr/bin/npx serve -s build -l 3000
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable services:
```bash
sudo systemctl enable orbai-backend
sudo systemctl enable orbai-frontend
sudo systemctl start orbai-backend
sudo systemctl start orbai-frontend
```

## SSL Certificate Setup

### Using Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring and Maintenance

### 1. Health Checks

```bash
# Check API health
curl http://localhost:5000/api/health

# Check database connection
docker-compose exec mysql mysql -u root -p -e "SELECT 1"

# Check service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

### 2. Backup Database

```bash
# Create backup
docker-compose exec mysql mysqldump -u root -p orbai_attendance_system > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose exec -T mysql mysql -u root -p orbai_attendance_system < backup_file.sql
```

### 3. Update Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart services
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Or using Coolify, just redeploy from the dashboard
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed:**
   - Check MySQL service status
   - Verify database credentials
   - Ensure database exists

2. **CORS Errors:**
   - Update FRONTEND_URL in environment variables
   - Check nginx proxy configuration

3. **JWT Token Issues:**
   - Verify JWT_SECRET is set correctly
   - Check token expiration settings

4. **File Upload Issues:**
   - Ensure uploads directory has proper permissions
   - Check MAX_FILE_SIZE setting

### Logs and Debugging

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mysql

# Follow logs in real-time
docker-compose logs -f backend
```

## Security Considerations

1. **Change Default Passwords:**
   - Update MySQL root password
   - Change JWT secret
   - Use strong passwords for all accounts

2. **Firewall Configuration:**
   ```bash
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS
   sudo ufw enable
   ```

3. **Regular Updates:**
   - Keep system packages updated
   - Update Docker images regularly
   - Monitor security advisories

## Default Login Credentials

After initial setup, you can login with:

- **Admin:** admin@orbai.com / admin123
- **Manager:** manager@orbai.com / admin123
- **Employee:** alice.johnson@orbai.com / admin123

**⚠️ Important:** Change these default passwords immediately after first login!

## Support

For issues and questions:
- Check the logs first
- Review this deployment guide
- Create an issue in the repository
- Contact system administrator

## License

This project is licensed under the MIT License - see the LICENSE file for details.
