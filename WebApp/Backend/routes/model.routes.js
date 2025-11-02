const express = require('express');
const router = express.Router();
const { verifyToken, restrictTo } = require('../middleware/auth.middleware');
const Model = require('../models/Model');
const { ROLE } = require('../config/config');


router.post('/bulk-upsert', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN), async (req, res) => {
    try {
        const user = req.user;
        const { rows, startTime: rawStartTime, endTime: rawEndTime } = req.body;

        // Chuẩn hóa thời gian (BẮT BUỘC)
        const startTime = rawStartTime ? new Date(rawStartTime) : new Date();
        const endTime = rawEndTime ? new Date(rawEndTime) : new Date(Date.now() + 315360000000); // 10 năm sau nếu không có endTime

        if (startTime.getTime() >= endTime.getTime()) {
            return res.status(400).send({ status: 'error', message: 'Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc.' });
        }

        const ops = []; // chứa các thao tác bulkWrite

        // Duyệt từng vật liệu (material)
        for (const row of rows) {
            const materialId = row.id;

            // Lấy toàn bộ model hiện có của material để so sánh
            const existingModels = await Model.find({ material: materialId });
            const mapExisting = new Map(existingModels.map(m => [m.deviceModel.toString(), m]));

            // Duyệt từng field của dòng (deviceModel)
            for (const [field, rawValue] of Object.entries(row)) {
                if (['id', 'material', 'acceptedProduct', 'density', 'dryDensity'].includes(field)) continue;

                const deviceModelId = field;
                // Giá trị mới sẽ là null nếu rỗng hoặc không hợp lệ
                const newValue = rawValue === '' || rawValue === null || rawValue === undefined ? null : Number(rawValue);

                const existing = mapExisting.get(deviceModelId);

                if (existing) {
                    const existingHistoryIndex = existing.valueHistory.findIndex((h) =>
                        new Date(h.startTime).toISOString() === startTime.toISOString() &&
                        new Date(h.endTime).toISOString() === endTime.toISOString()
                    );

                    let isValueChanged = false;

                    if (existingHistoryIndex !== -1) {
                        // Trường hợp 1: Đã có lịch sử cho khoảng thời gian này -> Cập nhật giá trị lịch sử
                        const existingHistoryValue = existing.valueHistory[existingHistoryIndex].value;
                        if (existingHistoryValue !== newValue) {
                            isValueChanged = true;
                            // Thao tác cập nhật một phần tử trong mảng
                            const updatePath = `valueHistory.${existingHistoryIndex}.value`;
                            ops.push({
                                updateOne: {
                                    filter: { _id: existing._id },
                                    update: {
                                        $set: { [updatePath]: newValue },
                                        // KHÔNG CẬP NHẬT TRƯỜNG 'value' CHÍNH CỦA TÀI LIỆU
                                    },
                                },
                            });
                        }
                    } else {

                        isValueChanged = true;
                        ops.push({
                            updateOne: {
                                filter: { _id: existing._id },
                                update: {
                                    $push: {
                                        valueHistory: {
                                            value: newValue ? newValue : null,
                                            startTime: startTime,
                                            endTime: endTime,
                                        },
                                    },
                                },
                            },
                        });
                    }
                } else {

                    if (newValue !== null) {
                        ops.push({
                            insertOne: {
                                document: {
                                    material: materialId,
                                    deviceModel: deviceModelId,
                                    value: newValue, // Giá trị chính
                                    valueHistory: [{
                                        value: newValue,
                                        startTime: startTime,
                                        endTime: endTime,
                                    }],
                                },
                            },
                        });
                    }
                }
            }
        }

        // Nếu có thao tác -> thực hiện bulkWrite
        if (ops.length > 0) {
            const result = await Model.bulkWrite(ops);
        }

        req.logger.info(`🔥 ${user?.username} thực hiện bulk upsert ${ops.length} thay đổi`);
        res.status(200).send({
            status: 'success',
            message: `Cập nhật mô hình thành công (${ops.length} thay đổi)`,
        });

    } catch (err) {
        req.logger.error("❌ Lỗi khi bulk upsert", err);
        res.status(500).send({
            status: 'error',
            message: err.message,
            stack: err.stack,
        });
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

module.exports = router; 