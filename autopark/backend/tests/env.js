// Loaded by Jest before any test module (see "jest.setupFiles" in package.json).
// The suite runs against its own database so it can wipe it freely.
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/autopark_test';
process.env.JWT_SECRET = process.env.JWT_SECRET_TEST || 'test-only-secret-not-for-production-use-0123456789';
process.env.JWT_EXPIRES_IN = '1h';
// Tests log in far more often than a person; the limiter has its own test.
process.env.AUTH_RATE_LIMIT_MAX = '1000';
process.env.PAYMENT_PROVIDER = 'mock';
// Refresh is exercised heavily below; its limiter has the same purpose as login's.
process.env.REFRESH_RATE_LIMIT_MAX = '1000';
