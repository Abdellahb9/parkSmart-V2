const mongoose = require('mongoose');

const logger = require('../utils/logger');

// Retries for a while before giving up: in Docker Compose, or after a host
// reboot, the API can start a few seconds before MongoDB accepts connections.
const connectDB = async ({ attempts = Number(process.env.DB_CONNECT_ATTEMPTS || 10), delayMs = 3000 } = {}) => {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI);
      logger.info({ host: conn.connection.host, db: conn.connection.name }, 'MongoDB connected');
      return conn;
    } catch (error) {
      if (attempt === attempts) {
        logger.fatal({ err: error }, 'MongoDB connection failed, giving up');
        process.exit(1);
      }
      logger.warn({ attempt, attempts, reason: error.message }, 'MongoDB not reachable yet, retrying');
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return null;
};

module.exports = connectDB;
