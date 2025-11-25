import dotenv from 'dotenv';
dotenv.config();
import app from './app.js';
import './src/config/db.js';  // Initialize database connection

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`Server listening at port: ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please use a different port.`);
    } else {
        console.error('Server startup error:', err);
    }
    process.exit(1);
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
    console.log('\n SIGTERM received. Closing HTTP server...');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n SIGINT received (Ctrl+C). Closing HTTP server...');
    server.close(() => {
        console.log(' HTTP server closed');
        process.exit(0);
    });
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(' Unhandled Rejection at:', promise, 'reason:', reason);
    server.close(() => {
        process.exit(1);
    });
});