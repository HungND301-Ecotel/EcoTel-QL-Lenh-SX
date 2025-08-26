const express = require('express');
const router = express.Router();
const ReportHistory = require('../models/ReportHistory');
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');



router.get('/:id', verifyToken, async (req, res) => {
    try {

        const histories = await ReportHistory.find({ reportId: req.params.id })
            .populate('changedBy', 'username');
        req.logger.info(`✅ Load lịch sử thay đổi báo cáo thành công`);
        res.status(200).send({ status: 'success', data: histories });
    } catch (err) {
        req.logger.error("❌ Lỗi khi load lịc sử thay đổi báo cáo", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});

module.exports = router; 