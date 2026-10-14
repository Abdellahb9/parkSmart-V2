require('dotenv').config();

// Before anything else: a broken configuration should stop the boot with a
// readable message, not surface later as a 500.
try {
  require('./config/env').validate();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const http = require('http');
const mongoose = require('mongoose');

const logger = require('./utils/logger');

const connectDB = require('./config/db');
const { allowedOrigins } = require('./config/origins');
const app = require('./app');
const realtime = require('./realtime');
const availabilityJob = require('./jobs/availabilityJob');

const PORT = process.env.PORT || 5000;

let server = null;

const startServer = async () => {
  await connectDB();

  // An explicit http server so socket.io can share the port with Express.
  server = http.createServer(app);
  realtime.init(server, { origins: allowedOrigins });

  // Frees spots whose bookings ended, flags overstays. DISABLE_AVAILABILITY_JOB=1
  // turns it off, e.g. on all but one instance of a scaled deployment.
  if (process.env.DISABLE_AVAILABILITY_JOB !== '1') {
    availabilityJob.start({ logger: logger.child({ module: 'availability' }) });
  }

  server.listen(PORT, () => {
    logger.info({ port: Number(PORT), health: '/api/health', realtime: '/rt' }, `AutoPark API listening on port ${PORT}`);
  });
};

startServer().catch((error) => {
  logger.fatal({ err: error }, 'server failed to start');
  process.exit(1);
});

// Docker sends SIGTERM on stop: finish cleanly instead of being killed.
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.once(signal, () => {
    logger.info({ signal }, 'shutting down');
    // Stop accepting requests, let in-flight ones finish, then close the pool.
    const done = () => mongoose.disconnect().finally(() => process.exit(0));
    if (server) server.close(done);
    else done();
    setTimeout(() => process.exit(0), 10 * 1000).unref();
  });
}
