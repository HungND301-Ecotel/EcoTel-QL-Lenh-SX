const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

const connectWithRetry = async (retries = 5, delay = 5000) => {
    for (let i = 0; i < retries; i++) {
        try {
            await mongoose.connect(process.env.MONGODB_URI);
            logger.info('✅ MongoDB connected successfully');
            return;
        } catch (err) {
            logger.error(`❌ MongoDB connection failed (attempt ${i + 1}/${retries}): ${err.message}`);
            await new Promise((r) => setTimeout(r, delay));
        }
    }
    process.exit(1);
};

module.exports = { connectDB: connectWithRetry };
