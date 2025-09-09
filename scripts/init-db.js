const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const initDatabase = async() => {
    let connection;

    try {
        // Connect to MySQL server (without specifying database)
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: process.env.DB_PORT || 3306
        });

        console.log('Connected to MySQL server');

        // Create database if it doesn't exist
        const dbName = process.env.DB_NAME || 'orbai_attendance_system';
        await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        console.log(`Database '${dbName}' created or already exists`);

        // Use the database
        await connection.execute(`USE \`${dbName}\``);

        // Read and execute the SQL initialization file
        const sqlFile = path.join(__dirname, '..', 'database', 'init.sql');
        const sqlContent = fs.readFileSync(sqlFile, 'utf8');

        // Split SQL content by semicolon and execute each statement
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await connection.execute(statement);
                    console.log('✓ Executed SQL statement');
                } catch (error) {
                    console.error('✗ Error executing statement:', error.message);
                    console.error('Statement:', statement.substring(0, 100) + '...');
                }
            }
        }

        console.log('\n🎉 Database initialization completed successfully!');
        console.log('\nDefault login credentials:');
        console.log('Admin: admin@orbai.com / admin123');
        console.log('Manager: manager@orbai.com / admin123');
        console.log('Employee: alice.johnson@orbai.com / admin123');

    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\nDatabase connection closed');
        }
    }
};

// Run initialization if this script is executed directly
if (require.main === module) {
    initDatabase();
}

module.exports = initDatabase;