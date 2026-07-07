require("dotenv").config();

const Redis = require("ioredis");
const { logger } = require("./logger");

const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT;
const redisPassword = process.env.REDIS_PASSWORD;

let redisClient;

try {
  const config = {
    host: redisHost,
    port: redisPort,
    retryStrategy(times) {
      // Thử kết nối lại với độ trễ tăng dần
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
  };
  if (redisPassword) {
    config.password = redisPassword;
  }
  redisClient = new Redis(config);
  redisClient.on("connect", () => {
    logger.info("✅ Redis connected successfully");
  });
  redisClient.on("error", (err) => {
    logger.error(`❌ Redis connection error: ${err.message}`);
  });
} catch (error) {
  logger.error("❌ Failed to initialize Redis client:", error);
}

module.exports = redisClient;
