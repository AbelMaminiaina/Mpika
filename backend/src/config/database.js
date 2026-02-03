/**
 * Prisma Database Client Configuration
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});

// Middleware for logging queries in development
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();

  if (process.env.NODE_ENV === 'development') {
    logger.debug(`Query ${params.model}.${params.action} took ${after - before}ms`);
  }

  return result;
});

// Connection test
async function testConnection() {
  try {
    await prisma.$connect();
    logger.info('Database connection established');
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
}

// Graceful disconnect
async function disconnect() {
  await prisma.$disconnect();
  logger.info('Database connection closed');
}

module.exports = {
  prisma,
  testConnection,
  disconnect,
};
