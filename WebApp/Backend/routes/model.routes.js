const express = require('express');
const router = express.Router();
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');
const Model = require('../models/Model');
const { ROLE } = require('../config/config');
const {
    runProductionUpdateBackground
} = require('../utils/cron')


router.post('/bulk-upsert', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN), async (req, res) => {
    try {
        const user = req.user;
        const { rows, startTime: rawStartTime, endTime: rawEndTime, initSlot } = req.body;

        const startTime = rawStartTime ? new Date(rawStartTime) : new Date();
        const endTime = rawEndTime ? new Date(rawEndTime) : new Date(Date.now() + 315360000000); // 10 năm

        if (startTime.getTime() >= endTime.getTime()) {
            return res.status(400).send({ status: 'error', message: 'Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc.' });
        }

        const oldStartTime = initSlot?.startTime ? new Date(initSlot.startTime) : null;
        const oldEndTime = initSlot?.endTime ? new Date(initSlot.endTime) : null;

        const ops = [];

        for (const row of rows) {
            const materialId = row.id;
            const existingModels = await Model.find({ material: materialId });
            const mapExisting = new Map(existingModels.map(m => [m.deviceModel.toString(), m]));

            for (const [field, rawValue] of Object.entries(row)) {
                if (['id', 'material', 'acceptedProduct', 'density', 'dryDensity'].includes(field)) continue;

                const deviceModelId = field;
                const newValue = rawValue === '' || rawValue === null || rawValue === undefined ? null : Number(rawValue);
                const existing = mapExisting.get(deviceModelId);

                if (!existing && newValue !== null) {
                    ops.push({
                        insertOne: {
                            document: {
                                material: materialId,
                                deviceModel: deviceModelId,
                                value: newValue,
                                valueHistory: [{
                                    value: newValue,
                                    startTime,
                                    endTime,
                                }],
                            },
                        },
                    });
                    continue;
                }

                if (existing) {
                    let targetIndex = existing.valueHistory.findIndex(
                        (h) => new Date(h.startTime).toISOString() === startTime.toISOString() &&
                            new Date(h.endTime).toISOString() === endTime.toISOString()
                    );

                    // ✅ Nếu có initSlot → sửa time range cũ
                    if (targetIndex === -1 && oldStartTime && oldEndTime) {
                        targetIndex = existing.valueHistory.findIndex(
                            (h) => new Date(h.startTime).toISOString() === oldStartTime.toISOString() &&
                                new Date(h.endTime).toISOString() === oldEndTime.toISOString()
                        );
                    }

                    if (targetIndex !== -1) {
                        const updatePath = `valueHistory.${targetIndex}`;
                        ops.push({
                            updateOne: {
                                filter: { _id: existing._id },
                                update: {
                                    $set: {
                                        [`${updatePath}.value`]: newValue,
                                        [`${updatePath}.startTime`]: startTime,
                                        [`${updatePath}.endTime`]: endTime,
                                    },
                                },
                            },
                        });
                    } else {
                        ops.push({
                            updateOne: {
                                filter: { _id: existing._id },
                                update: {
                                    $push: {
                                        valueHistory: { value: newValue, startTime, endTime },
                                    },
                                },
                            },
                        });
                    }
                }
            }
        }

        if (ops.length > 0) await Model.bulkWrite(ops);

        const selected = new Date();
        // Các logic về ngày tháng giữ nguyên
        const selectedDate = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate(), 23, 59, 59, 999);
        const startOfMonth = new Date(selected.getFullYear(), selected.getMonth(), 1, 0, 0, 0, 0);
        let query = { workingDate: { $gte: startOfMonth, $lte: selectedDate } };

        runProductionUpdateBackground(req, query)

        req.logger.info(`🔥 ${user?.username} bulk upsert ${ops.length} thay đổi`);
        res.status(200).send({ status: 'success', message: `Cập nhật mô hình thành công (${ops.length} thay đổi)` });
    } catch (err) {
        req.logger.error("❌ Lỗi bulk upsert", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});


router.get('/', verifyToken, async (req, res) => {
    try {
        const { startTime, endTime } = req.query;

        let models;

        if (startTime && endTime) {
            // Chuẩn hóa thời gian (BẮT BUỘC)
            const filterStartTime = new Date(startTime);
            const filterEndTime = new Date(endTime);

            models = await Model.aggregate([
                {
                    // Bước 1: Lọc ra phần tử trong valueHistory khớp với startTime và endTime
                    $addFields: {
                        filteredHistory: {
                            $filter: {
                                input: '$valueHistory',
                                as: 'history',
                                cond: {
                                    $and: [
                                        // Sử dụng $eq để so sánh chính xác trường Date
                                        { $eq: ['$$history.startTime', filterStartTime] },
                                        { $eq: ['$$history.endTime', filterEndTime] }
                                    ]
                                }
                            }
                        }
                    }
                },
                {
                    // Bước 2: Trích xuất giá trị (value) từ lịch sử đã lọc và ghi đè trường 'value'
                    $project: {
                        material: 1,
                        deviceModel: 1,
                        valueHistory: 1,
                        createdAt: 1,
                        updatedAt: 1,

                        // GHI ĐÈ TRƯỜNG 'value' BẰNG GIÁ TRỊ LỊCH SỬ
                        value: {
                            $cond: {
                                // Kiểm tra nếu filteredHistory có ít nhất 1 phần tử
                                if: { $gt: [{ $size: '$filteredHistory' }, 0] },
                                // Lấy ra trường 'value' của phần tử đầu tiên
                                then: { $arrayElemAt: ['$filteredHistory.value', 0] },
                                // Nếu không tìm thấy, trả về giá trị null
                                else: null
                            }
                        }
                    }
                }
            ]);

        } else {
            models = await Model.find();
        }

        req.logger.info(`🔥 Load models thành công. Filter: ${startTime && endTime ? 'YES' : 'NO'}`);
        res.status(200).send({ status: 'success', data: models });

    } catch (err) {
        req.logger.error("❌ Lỗi", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});
// DELETE /models
router.delete('/', verifyToken, async (req, res) => {
    try {
        const user = req.user
        const { slots } = req.body; // [{ startTime, endTime }, ...]

        if (!Array.isArray(slots) || slots.length === 0) {
            req.logger.error(`🔥 Không có bản ghi cần xóa}`);
            return res.status(400).json({ status: 'error', message: "Không có bản ghi cần xóa" });
        }

        const pullConditions = slots.map(s => ({
            startTime: new Date(s.startTime),
            endTime: new Date(s.endTime),
        }));

        const result = await Model.updateMany(
            {},
            {
                $pull: {
                    valueHistory: { $or: pullConditions },
                },
            }
        );
        req.logger.info(`🔥 ${user?.username} Xóa mô hình thành công`);

        res.status(200).json({
            status: 'success',
            message: `Đã xóa ${slots.length} bản ghi`,
        });
    } catch (error) {
        req.logger.error(`🔥${user?.username} Xóa mô hình thất bại`, error);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack });
    }
});

module.exports = router; 