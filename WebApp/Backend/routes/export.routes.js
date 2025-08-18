const express = require('express');
const router = express.Router();
const axios = require('axios')
const ExcelJS = require('exceljs');
const Order = require('../models/Order');
const Shift = require('../models/Shift');
const Report = require('../models/Report');


const { verifyToken, restrictTo } = require('../middleware/auth.middleware');


// lệnh sx
router.post('/order/bulk', verifyToken, restrictTo('admin', 'dispatcher', 'manager'), async (req, res, next) => {
    try {
        const { ids } = req.body; // mảng entity id

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).send({ status: 'error', message: 'Chọn bản ghi cần tải xuống' });
        }

        const orders = await Order.find({ _id: { $in: ids } })
            .populate({
                path: "assignedTo",
                select: "username fullName department phone salaryCode",
                populate: [
                    { path: "department" }
                ]
            })
            .populate('job', 'name type content')
            .populate('devicesToProduce.deviceType')
            .populate('device', 'code')
            .populate('excavator', 'code')
            .populate('location', 'name')
            .populate('material', 'name')
            .populate('shift')
            .populate({
                path: "shiftReport",
                populate: [
                    {
                        path: "vehicleSummaries.vehicle",
                        select: "code"
                    }
                ]
            })
            .populate('safetyMeasure')
            .populate({
                path: "assistants",
                select: "username fullName",
            })
            .populate({
                path: "createdBy",
                select: "fullName phone salaryCode position",
                populate: {
                    path: "position",
                    select: "name",
                }
            })


        const workbook = new ExcelJS.Workbook();
        for (const order of orders) {
            const reports = await Report.find({ orderId: order._id })
                .populate("device", "code")
                .populate("material", "name")
                .populate("excavator", "code")
                .populate("fromLocation", "name")
                .populate("toLocation", "name")
            const sheetName = `${order.assignedTo?.username}_${formatDate(order.workingDate)}_${order.shift?.name}_${order._id}`.replace(/[\\\/:*?\[\]]/g, '-').substring(0, 31);

            const worksheet = workbook.addWorksheet(sheetName);

            // Tiêu đề bảng
            worksheet.mergeCells('A1:L2');
            const header = worksheet.getCell('A1');
            header.value = `LỆNH SẢN XUẤT`;
            header.font = { bold: true, size: 14 };
            header.alignment = { horizontal: 'center', vertical: 'middle' };




            worksheet.getCell('B3').value = 'Đơn vị';
            worksheet.getCell('B3').font = { bold: true };
            worksheet.getCell('C3').value = order.assignedTo?.department?.code || '';

            worksheet.getCell('F3').value = 'Ngày';
            worksheet.getCell('F3').font = { bold: true };
            // Lấy ngày từ order.workingDate và định dạng
            const workingDate = order.workingDate ? new Date(order.workingDate) : null;
            const ngay = workingDate ? workingDate.toLocaleDateString('vi-VN') : '';
            worksheet.getCell('G3').value = ngay;

            worksheet.getCell('H3').value = order.shiftHour || '';


            worksheet.getCell('I3').value = 'Ca';
            worksheet.getCell('I3').font = { bold: true };

            worksheet.getCell('J3').value = order.shift?.name || '';
            worksheet.getCell('J3').alignment = { horizontal: 'left' }

            // 3. Người ra lệnh
            // Dòng 4
            worksheet.getCell('B4').value = 'Người ra lệnh';
            worksheet.getCell('B4').font = { bold: true };
            worksheet.getCell('C4').value = order.createdBy?.fullName || '';

            worksheet.getCell('F4').value = 'Số thẻ';
            worksheet.getCell('F4').font = { bold: true };
            worksheet.getCell('G4').value = order.createdBy?.salaryCode || '';


            worksheet.getCell('I4').value = 'Chức vụ';
            worksheet.getCell('I4').font = { bold: true };
            worksheet.getCell('J4').value = order.createdBy?.position?.name || '';

            // 4. Người nhận lệnh
            // Dòng 5
            worksheet.getCell('B5').value = 'Người nhận lệnh';
            worksheet.getCell('B5').font = { bold: true };
            worksheet.getCell('C5').value = order.assignedTo?.fullName || '';

            worksheet.getCell('F5').value = 'Số thẻ';
            worksheet.getCell('F5').font = { bold: true };
            worksheet.getCell('G5').value = order.assignedTo?.salaryCode || '';

            worksheet.getCell('I5').value = 'Số xe';
            worksheet.getCell('I5').font = { bold: true };
            worksheet.getCell('J5').value = order.device?.map(e => e.code).join(', ') || '';

            // 5. Nội dung
            // Dòng 6
            worksheet.getCell('B6').value = 'Nội dung';
            worksheet.getCell('B6').font = { bold: true };
            // Gộp ô cho nội dung để hiển thị đầy đủ
            worksheet.getCell('C6').value = order.workContent || '';

            worksheet.getCell('I6').value = 'Máy xúc';
            worksheet.getCell('I6').font = { bold: true };
            worksheet.getCell('J6').value = order.excavator?.map(e => e.code).join(', ') || '';
            // 6. Bàn giao ca và Đổ tải
            // Dòng 7
            worksheet.getCell('B7').value = 'Bàn giao ca';
            worksheet.getCell('B7').font = { bold: true };
            // Gộp ô cho nội dung bàn giao ca
            worksheet.getCell('C7').value = order.shiftReport?.handoverNotes || '';

            worksheet.getCell('I7').value = 'Đổ tải';
            worksheet.getCell('I7').font = { bold: true };
            worksheet.getCell('J7').value = order.location?.name || '';

            // Dòng 8
            worksheet.getCell('B8').value = 'Giờ nhận lệnh';
            worksheet.getCell('B8').font = { bold: true };
            worksheet.getCell('C8').value = order.startTime ? new Date(order.startTime).toLocaleTimeString() : "";

            worksheet.getCell('D8').value = 'Giờ kết thúc';
            worksheet.getCell('D8').font = { bold: true };
            worksheet.getCell('E8').value = order.endTime ? new Date(order.endTime).toLocaleTimeString() : "";

            worksheet.getCell('F8').value = 'Km HĐ';
            worksheet.getCell('F8').font = { bold: true };
            worksheet.getCell('G8').value = order?.shiftReport?.vehicleSummaries.reduce((sum, report) => { return sum + report?.distanceKm }, 0) || '';

            worksheet.getCell('H8').value = 'Giờ HĐ';
            worksheet.getCell('H8').font = { bold: true };
            worksheet.getCell('I8').value = order?.shiftReport?.vehicleSummaries.reduce((sum, report) => { return sum + report?.travelHours }, 0) || '';


            worksheet.mergeCells('A10:L10');
            const product = worksheet.getCell('A10');
            product.value = `I. SẢN PHẨM`;
            product.font = { bold: true, size: 14 };
            product.alignment = { horizontal: 'center', vertical: 'middle' };

            worksheet.getCell('A11').value = 'STT';
            worksheet.getCell('B11').value = 'Điểm đi';
            worksheet.getCell('C11').value = 'Điểm đến';
            worksheet.getCell('D11').value = 'Loại hàng';
            worksheet.getCell('E11').value = 'Cung độ \n(km)';
            worksheet.getCell('F11').value = 'Định mức';
            worksheet.getCell('G11').value = 'Số chuyển \nthực hiện';
            worksheet.getCell('H11').value = 'Thời gian \n thực hiện';
            worksheet.getCell('I11').value = 'Nhiên liệu \n định mức';
            worksheet.getCell('J11').value = 'Điểm lương';
            worksheet.getCell('K11').value = 'Mức bồi dưỡng';
            worksheet.getCell('L11').value = 'Ghi chứ';

            const headerRow = worksheet.getRow(11);
            for (let col = 1; col <= 12; col++) {
                const cell = headerRow.getCell(col);
                cell.font = { bold: true };
                cell.alignment = {
                    ...cell.alignment,
                    wrapText: true,
                    vertical: 'middle',
                    horizontal: 'center',
                };
            }
            headerRow.height = 40;

            for (let index = 0; index < (reports?.length || 0); index++) {
                const report = reports[index];

                const rowIndex = index + 12;
                worksheet.getCell(`A${rowIndex}`).value = index + 1;
                worksheet.getCell(`B${rowIndex}`).value = report.fromLocation?.name || report.excavator?.code || '';
                worksheet.getCell(`C${rowIndex}`).value = report.toLocation?.name || '';
                worksheet.getCell(`D${rowIndex}`).value = report.material?.name || '';
                worksheet.getCell(`E${rowIndex}`).value = '';
                worksheet.getCell(`F${rowIndex}`).value = '';
                worksheet.getCell(`G${rowIndex}`).value = report?.quantity || "";
                worksheet.getCell(`H${rowIndex}`).value = report?.workingMinute || '';
                worksheet.getCell(`I${rowIndex}`).value = "";
                worksheet.getCell(`J${rowIndex}`).value = "";
                worksheet.getCell(`K${rowIndex}`).value = "";
                worksheet.getCell(`L${rowIndex}`).value = "";

            };
            const totalRow = (reports?.length || 0) + 13;
            addTableBorders(worksheet, 10, totalRow + 1, 1, 12);
            worksheet.mergeCells(`A${totalRow}:B${totalRow}`);
            worksheet.getCell(`A${totalRow}`).value = 'Tổng cộng';
            worksheet.getCell(`A${totalRow}`).font = { bold: true };
            worksheet.getCell(`A${totalRow}`).alignment = { horizontal: 'right' }

            worksheet.mergeCells(`C${totalRow}:G${totalRow}`);
            worksheet.getCell(`C${totalRow}`).value = reports.reduce((sum, report) => { return sum + report.quantity }, 0) || '';
            worksheet.getCell(`C${totalRow}`).font = { bold: true };

            worksheet.getCell(`H${totalRow}`).value = '';
            worksheet.getCell(`I${totalRow}`).value = '';
            worksheet.getCell(`J${totalRow}`).value = '';

            worksheet.mergeCells(`K${totalRow}:L${totalRow}`);
            worksheet.getCell(`K${totalRow}`).value = '';

            worksheet.mergeCells(`A${totalRow + 1}:L${totalRow + 1}`);
            worksheet.getCell(`A${totalRow + 1}`).value = 'Mức bồi dưỡng (x1000đ):';

            worksheet.mergeCells(`A${totalRow + 2}:L${totalRow + 2}`);
            const header3 = worksheet.getCell(`A${totalRow + 2}`);
            header3.value = `II.NHIÊN LIỆU`;
            header3.font = { bold: true, size: 14 };
            header3.alignment = { horizontal: 'center', vertical: 'middle' };

            worksheet.getCell(`A${totalRow + 3}`).value = 'Phương tiện';
            worksheet.getCell(`A${totalRow + 3}`).font = { bold: true };
            worksheet.getCell(`B${totalRow + 3}`).value = 'Tồn dầu';
            worksheet.getCell(`B${totalRow + 3}`).font = { bold: true };
            worksheet.getCell(`C${totalRow + 3}`).value = 'Lĩnh trong ca';
            worksheet.getCell(`C${totalRow + 3}`).font = { bold: true };
            worksheet.getCell(`D${totalRow + 3}`).value = 'Tồn cuối ca';
            worksheet.getCell(`D${totalRow + 3}`).font = { bold: true };
            worksheet.getCell(`E${totalRow + 3}`).value = 'Tiêu thụ';
            worksheet.getCell(`E${totalRow + 3}`).font = { bold: true };
            worksheet.getCell(`F${totalRow + 3}`).value = 'Định mức';
            worksheet.getCell(`F${totalRow + 3}`).font = { bold: true };
            worksheet.getCell(`G${totalRow + 3}`).value = 'Tiết kiệm';
            worksheet.getCell(`G${totalRow + 3}`).font = { bold: true };
            worksheet.mergeCells(`H${totalRow + 3}:I${totalRow + 3}`)
            worksheet.getCell(`H${totalRow + 3}`).value = 'Sử dụng vượt';
            worksheet.getCell(`H${totalRow + 3}`).font = { bold: true };
            worksheet.getCell(`H${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.mergeCells(`J${totalRow + 3}:L${totalRow + 3}`)
            worksheet.getCell(`J${totalRow + 3}`).value = 'Ghi chú';
            worksheet.getCell(`J${totalRow + 3}`).font = { bold: true };
            worksheet.getCell(`J${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle' };


            const fuelHeaderRow = totalRow + 2;
            const fuelRows = order.shiftReport?.vehicleSummaries?.length || 0;
            const fuelEndRow = fuelHeaderRow + fuelRows + 2;

            addTableBorders(worksheet, fuelHeaderRow, fuelEndRow, 1, 12);
            for (let index = 0; index < (order.shiftReport?.vehicleSummaries?.length || 0); index++) {
                const rep = order.shiftReport?.vehicleSummaries[index];

                worksheet.getCell(`A${totalRow + 4 + index}`).value = rep?.vehicle?.code || '';
                worksheet.getCell(`B${totalRow + 4 + index}`).value = rep?.fuelRemain || '';
                worksheet.getCell(`C${totalRow + 4 + index}`).value = rep?.fuelReceived || '';
                worksheet.getCell(`D${totalRow + 4 + index}`).value = rep?.fuelRemainEnd || '';
                worksheet.getCell(`E${totalRow + 4 + index}`).value =
                    (rep?.fuelRemain ?? 0) + (rep?.fuelReceived ?? 0) - (rep?.fuelRemainEnd ?? 0);

                worksheet.getCell(`F${totalRow + 4 + index}`).value = '';

                worksheet.mergeCells(`H${totalRow + 4 + index}:I${totalRow + 4 + index}`);
                worksheet.getCell(`H${totalRow + 4 + index}`).value = '';

                worksheet.mergeCells(`J${totalRow + 4 + index}:L${totalRow + 4 + index}`);
                worksheet.getCell(`J${totalRow + 4 + index}`).value = '';
            }

            worksheet.mergeCells(`A${fuelEndRow}:L${fuelEndRow}`);
            const follow = worksheet.getCell(`A${fuelEndRow}`);
            follow.value = `III. THEO DÕI SỬ DỤNG THIẾT BỊ`;
            follow.font = { bold: true, size: 14 };
            follow.alignment = { horizontal: 'center', vertical: 'middle' };

            worksheet.getCell(`A${fuelEndRow + 1}`).value = 'Sản phẩm';
            worksheet.getCell(`B${fuelEndRow + 1}`).value = 'Di chuyển';
            worksheet.getCell(`C${fuelEndRow + 1}`).value = 'Phục vụ';
            worksheet.getCell(`D${fuelEndRow + 1}`).value = 'Tổng';
            worksheet.getCell(`E${fuelEndRow + 1}`).value = 'Giao ca';
            worksheet.getCell(`F${fuelEndRow + 1}`).value = 'Sửa chữa';
            worksheet.getCell(`G${fuelEndRow + 1}`).value = 'Tránh mìn';
            worksheet.getCell(`H${fuelEndRow + 1}`).value = 'Gạt nền';
            worksheet.getCell(`I${fuelEndRow + 1}`).value = 'Mất điện \nchờ nước';
            worksheet.getCell(`J${fuelEndRow + 1}`).value = 'nguyên nhân \n khác';
            worksheet.getCell(`K${fuelEndRow + 1}`).value = 'Tổng';
            worksheet.getCell(`L${fuelEndRow + 1}`).value = 'Giờ lũy kế';
            const headerFollow = worksheet.getRow(fuelEndRow + 1);
            for (let col = 1; col <= 12; col++) {
                const cell = headerFollow.getCell(col);
                cell.font = { bold: true };
                cell.alignment = {
                    ...cell.alignment,
                    wrapText: true,
                    vertical: 'middle',
                    horizontal: 'center',
                };
            }
            addTableBorders(worksheet, fuelEndRow, fuelEndRow + 2, 1, 12);
            worksheet.getCell(`A${fuelEndRow + 2}`).value = '';
            worksheet.getCell(`B${fuelEndRow + 2}`).value = '';
            worksheet.getCell(`C${fuelEndRow + 2}`).value = '';
            worksheet.getCell(`D${fuelEndRow + 2}`).value = '';
            worksheet.getCell(`E${fuelEndRow + 2}`).value = order.shiftReport?.handoverHours || '';
            worksheet.getCell(`F${fuelEndRow + 2}`).value = '';
            worksheet.getCell(`G${fuelEndRow + 2}`).value = "";
            worksheet.getCell(`H${fuelEndRow + 2}`).value = '';
            worksheet.mergeCells(`I${fuelEndRow + 2}:L${fuelEndRow + 2}`);
            worksheet.getCell(`I${fuelEndRow + 2}`).value = '';

            const deviceRow = order.device.length
            worksheet.mergeCells(`B${totalRow + 7 + deviceRow}:D${totalRow + 7 + deviceRow}`)
            worksheet.getCell(`B${totalRow + 7 + deviceRow}`).value = 'NGƯỜI NHẬN LỆNH';
            worksheet.getCell(`B${totalRow + 7 + deviceRow}`).font = { bold: true };
            worksheet.getCell(`B${totalRow + 7 + deviceRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.getCell(`C${totalRow + 9 + deviceRow}`).value = '✔';
            worksheet.getCell(`C${totalRow + 9 + deviceRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.getCell(`C${totalRow + 9 + deviceRow}`).font = { bold: true, size: 12 };
            worksheet.mergeCells(`B${totalRow + 11 + deviceRow}:D${totalRow + 11 + deviceRow}`)
            worksheet.getCell(`B${totalRow + 11 + deviceRow}`).font = { bold: true };
            worksheet.getCell(`B${totalRow + 11 + deviceRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.getCell(`B${totalRow + 11 + deviceRow}`).value = order.assignedTo?.fullName || "";


            worksheet.mergeCells(`I${totalRow + 7 + deviceRow}:M${totalRow + 7 + deviceRow}`)
            worksheet.getCell(`I${totalRow + 7 + deviceRow}`).value = 'NGƯỜI RA LỆNH';
            worksheet.getCell(`I${totalRow + 7 + deviceRow}`).font = { bold: true };
            worksheet.getCell(`I${totalRow + 7 + deviceRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.mergeCells(`I${totalRow + 11 + deviceRow}:M${totalRow + 11 + deviceRow}`)
            worksheet.getCell(`I${totalRow + 11 + deviceRow}`).font = { bold: true };
            worksheet.getCell(`I${totalRow + 11 + deviceRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.getCell(`I${totalRow + 11 + deviceRow}`).value = order.createdBy?.fullName || "";


            worksheet.columns.forEach((column) => {
                column.width = 10;
            });

            worksheet.eachRow((row) => {
                row.eachCell((cell) => {
                    // Nếu chưa có font, tạo font mới
                    if (!cell.font) cell.font = {};
                    cell.font.size = 9; // hoặc 8, tuỳ theo bạn muốn nhỏ đến đâu
                });
            });
        }

        // Xuất file
        const buffer = await workbook.xlsx.writeBuffer();

        // Thiết lập header để tải file về
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader(
            'Content-Disposition',
            "attachment; filename*=UTF-8''*.xlsx"
        );     // Gửi buffer về client
        res.send(buffer);


    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});
//
//báo ca tình trạng ô tô
router.post('/vehicleShiftReport/view', verifyToken, restrictTo('admin', 'dispatcher', 'manager'), async (req, res, next) => {
    try {
        const { shift, startDate, endDate } = req.body
        let query = {
            createdBy: req.userId
        };
        if (Array.isArray(shift) && shift.length > 0) {
            query.shift = { $in: shift };
        }

        if (startDate && endDate) {
            query.workingDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        const orders = await Order.find(query)
            .populate('shift')
            .populate({
                path: "shiftReport",
                populate: [
                    {
                        path: "vehicleSummaries.vehicle",
                        select: "code vehicleNumber"
                    }
                ]
            }).lean();

        const formattedData = orders.flatMap((order, orderIndex) => {
            if (!order.shiftReport || !order.shiftReport.vehicleSummaries) return [];

            return order.shiftReport.vehicleSummaries
                .filter(summary => summary.status === "fail")
                .map(summary => {
                    const {
                        vehicle,
                        ...oilStats
                    } = summary;

                    return {
                        _id: vehicle?._id,
                        shift: `${order?.shiftReport._id}`,
                        vehicleId: vehicle?._id,
                        vehicleNumber: vehicle?.vehicleNumber || '',
                        ...oilStats,
                    };
                });
        });
        res.status(200).send({ status: 'success', data: formattedData })
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
})
router.post('/vehicleShiftReport', verifyToken, restrictTo('admin', 'dispatcher', 'manager'), async (req, res, next) => {
    try {
        const { shift, startDate, endDate, title, signature } = req.body
        const shiftList = await Shift.find({ _id: { $in: shift } });
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Đảm bảo end không nhỏ hơn start
        if (end < start) return res.status(400).json({ message: "Ngày kết thúc phải sau ngày bắt đầu" });

        const workbook = new ExcelJS.Workbook();
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            for (const ca of shiftList) {
                const orders = await Order.find({
                    workingDate: d,
                    shift: ca._id,
                    createdBy: req.userId
                })
                    .populate({
                        path: "shiftReport",
                        populate: [
                            {
                                path: "vehicleSummaries.vehicle",
                                select: "code vehicleNumber"
                            }
                        ]
                    })
                    .populate('shift')


                const sheetName = `${formatDate(d)}_${ca.name}`.replace(/[\\\/:*?\[\]]/g, '-').substring(0, 31);

                const worksheet = workbook.addWorksheet(sheetName);

                worksheet.mergeCells('A1:E1');
                const infoRow = worksheet.getCell('A1');
                infoRow.value = `Ca: ${ca.name}                  , ngày:    ${formatDate(d)}                             Tên cán bộ: ${req.user?.fullName}`;
                infoRow.font = { italic: true, size: 12 };
                infoRow.alignment = { horizontal: 'left', vertical: 'middle' };
                // Tiêu đề bảng
                worksheet.mergeCells('A2:E2');
                const header = worksheet.getCell('A2');
                header.value = title;
                header.font = { bold: true, size: 14 };
                header.alignment = { horizontal: 'center', vertical: 'middle' };

                const headerRow = worksheet.addRow(['STT', 'Số xe', 'Tình trạng hư/ hỏng', 'Kết quả sửa chữa trong ca', 'Ghi chú']);
                headerRow.font = { bold: true };
                headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

                let index = 1;
                for (const order of orders) {
                    const shiftReport = order.shiftReport;
                    if (!shiftReport) continue;

                    for (const summary of shiftReport.vehicleSummaries || []) {
                        if (summary.status === "fail") {
                            worksheet.addRow([
                                index++,
                                summary.vehicle?.vehicleNumber || '',
                                summary?.note || '',
                                '',
                                '',
                            ]);
                        }
                    }
                }

                worksheet.getColumn(1).width = 6;
                worksheet.getColumn(1).alignment = { horizontal: 'center' }
                worksheet.getColumn(2).width = 20;
                worksheet.getColumn(2).alignment = { horizontal: 'center' }
                worksheet.getColumn(3).width = 40;
                worksheet.getColumn(4).width = 30;
                worksheet.getColumn(5).width = 40;

                if (signature) {
                    const response = await axios.get(signature, { responseType: 'arraybuffer' });
                    const contentType = response.headers['content-type'];
                    const extension = contentType.split('/')[1];
                    const imageBuffer = Buffer.from(response.data, 'binary');

                    // Thêm ảnh vào workbook
                    const imageId = workbook.addImage({
                        buffer: imageBuffer,
                        extension
                    });

                    // Gán ảnh vào vị trí (dùng topleft + extents hoặc range)
                    const lastCol = worksheet.columnCount;
                    worksheet.addImage(imageId, {
                        tl: { col: lastCol - 2, row: index + 7 }, // H30
                        ext: { width: 150, height: 150 },
                    });
                }

                worksheet.eachRow((row) => {
                    row.eachCell((cell) => {
                        // Nếu chưa có font, tạo font mới
                        if (!cell.font) cell.font = {};
                        cell.font.size = 12; // hoặc 8, tuỳ theo bạn muốn nhỏ đến đâu
                    });
                });
            }
        }

        // Xuất file
        const buffer = await workbook.xlsx.writeBuffer();

        // Thiết lập header để tải file về
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader(
            'Content-Disposition',
            "attachment; filename*=UTF-8''*.xlsx"
        );   // Gửi buffer về client
        res.send(buffer);


    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

// báo tổng hợp ô tô
router.post('/carReport/view', verifyToken, restrictTo('admin', 'dispatcher', 'manager'), async (req, res, next) => {
    try {
        const { shift, startDate, endDate, } = req.body
        let query = {
            createdBy: req.userId
        };
        if (Array.isArray(shift) && shift.length > 0) {
            query.shift = { $in: shift };
        }

        if (startDate && endDate) {
            query.workingDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        const orders = await Order.find(query)
            .populate({
                path: "shiftReport",
                populate: [
                    {
                        path: "vehicleSummaries.vehicle",
                        select: "code vehicleNumber"
                    },
                ]
            })
            .populate('assignedTo', 'fullName salaryCode')
            .populate('job', 'name type')
            .populate('location', 'name')
            .populate('material', 'name')
            .populate('excavator', 'code')
            .populate('device', 'code')
            .populate('shift')
        const filteredOrders = orders.filter(order =>
            order.job?.type === "Vận hành xe"
        );
        let index = 1
        const results = [];
        for (const order of filteredOrders) {
            const reports = await Report.find({ orderId: order._id })
                .populate('device', 'code')
                .populate('excavator', 'code')
                .populate('toLocation', 'name')
                .populate('material', 'name')

            results.push({
                _id: order._id,
                STT: index++,
                fullName: order.assignedTo?.fullName || '',
                salaryCode: order.assignedTo?.salaryCode || '',
                code: order.device.map(item => item?.code) || [],
                department: order.assignedTo?.department?.name || '',
                excavator: reports.map(item => item?.excavator?.code) || [],
                toLocation: reports.map(item => item?.toLocation?.name) || [],
                material: reports.map(item => item?.material?.name) || [],
                fuelRemain: order?.shiftReport?.vehicleSummaries.map(item => item?.fuelRemain) || [],
                fuelReceived: order?.shiftReport?.vehicleSummaries.map(item => item?.fuelReceived) || [],
                fuelRemainEnd: order?.shiftReport?.vehicleSummaries.map(item => item?.fuelRemainEnd) || [],
                consume: order?.shiftReport?.vehicleSummaries?.map((item) => (item?.fuelRemain || 0) + (item?.fuelReceived || 0) - (item?.fuelRemainEnd || 0)) || []
            });
        }


        res.status(200).send({ status: 'success', data: results })
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
})
router.post('/carReport', verifyToken, restrictTo('admin', 'dispatcher', 'manager'), async (req, res, next) => {
    try {
        const { shift, startDate, endDate, title, signature } = req.body
        const shiftList = await Shift.find({ _id: { $in: shift } });
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Đảm bảo end không nhỏ hơn start
        if (end < start) return res.status(400).json({ message: "Ngày kết thúc phải sau ngày bắt đầu" });

        const workbook = new ExcelJS.Workbook();
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            for (const ca of shiftList) {
                const orders = await Order.find({
                    workingDate: d,
                    shift: ca._id,
                    createdBy: req.userId
                })
                    .populate({
                        path: "shiftReport",
                        populate: [
                            {
                                path: "vehicleSummaries.vehicle",
                                select: "code vehicleNumber"
                            },
                        ]
                    })
                    .populate('assignedTo', 'fullName salaryCode')
                    .populate('job', 'name type')
                    .populate('location', 'name')
                    .populate('material', 'name')
                    .populate('excavator', 'code')
                    .populate('device', 'code')
                    .populate('shift')


                const sheetName = `${formatDate(d)}_${ca.name}`.replace(/[\\\/:*?\[\]]/g, '-').substring(0, 31);

                const worksheet = workbook.addWorksheet(sheetName);

                // === DÒNG 1: Tiêu đề bảng ===
                worksheet.mergeCells('A1:M1');
                const header = worksheet.getCell('A1');
                header.value = title;
                header.font = { bold: true, size: 15 };
                header.alignment = { horizontal: 'center', vertical: 'middle' };

                // === DÒNG 2–4: Thông tin người ra lệnh ===
                worksheet.getCell('B2').value = 'Ca';
                worksheet.getCell('B2').font = { bold: true };
                worksheet.getCell('C2').value = ca?.name;

                worksheet.getCell('E2').value = 'Ngày';
                worksheet.getCell('E2').font = { bold: true };
                worksheet.getCell('F2').value = formatDate(d);

                worksheet.getCell('B3').value = 'Đơn vị';
                worksheet.getCell('B3').font = { bold: true };
                worksheet.getCell('C3').value = req.user?.department?.name || '';

                worksheet.getCell('E3').value = 'Giờ hệ thống';
                worksheet.getCell('E3').font = { bold: true };
                worksheet.getCell('F3').value = new Date().toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                });

                worksheet.getCell('B4').value = 'Người ra lệnh';
                worksheet.getCell('B4').font = { bold: true };
                worksheet.getCell('C4').value = req.user?.fullName || '';

                worksheet.getCell('E4').value = 'Số thẻ';
                worksheet.getCell('E4').font = { bold: true };
                worksheet.getCell('F4').value = req.user?.salaryCode || '';

                worksheet.getCell('G4').value = 'Chức vụ';
                worksheet.getCell('G4').font = { bold: true };
                worksheet.getCell('H4').value = req.user?.position?.name || '';


                worksheet.mergeCells('I6:K6'); // Nhiên liệu
                worksheet.getCell('I6').value = 'Nhiên liệu (lít)';
                worksheet.getCell('I6').alignment = { horizontal: 'center', vertical: 'middle' };
                worksheet.getCell('I6').font = { bold: true };


                // === DÒNG 7: Header chi tiết ===
                const headerRow = worksheet.getRow(7);
                headerRow.values = [
                    'STT',
                    'Họ và tên',
                    'Số thẻ',
                    'Biển số',
                    'Vị trí \nnhận tải',
                    'Vị trí \nđổ tải',
                    'Chủng loại',
                    'Cung độ \ntạm tính',
                    'Tồn dầu',
                    'Lĩnh dầu',
                    'Tiêu thụ',
                    'Phụ cấp/ \nbồi dưỡng',
                    'Lương tạm tính'
                ];
                headerRow.font = { bold: true };
                headerRow.eachCell(cell => {
                    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                });
                const filteredOrders = orders.filter(order =>
                    order.job?.type === "Vận hành xe"
                );
                let index = 1;
                for (const order of filteredOrders) {
                    const shiftReport = order.shiftReport;
                    const reports = await Report.find({ orderId: order._id })
                        .populate("device", "code")
                        .populate("material", "name")
                        .populate("excavator", "code")
                        .populate("toLocation", "name")
                    // if (!shiftReport) continue;

                    const row = worksheet.addRow([
                        index++,
                        order?.assignedTo?.fullName || '',
                        order?.assignedTo?.salaryCode || '',
                        order?.device?.map(item => (item?.code || '')).join('\n') || '',
                        reports.map(item => (item?.excavator?.code || '')).join('\n') || '',
                        reports.map(item => (item?.toLocation?.name || '')).join('\n') || '',
                        reports.map(item => (item?.material?.name || '')).join('\n') || '',
                        '',
                        shiftReport?.vehicleSummaries?.map(item => (item?.fuelRemain || '')).join('\n') || '',
                        shiftReport?.vehicleSummaries?.map(item => (item?.fuelReceived || '')).join('\n') || '',
                        shiftReport?.vehicleSummaries?.map(item => (item?.fuelRemainEnd || '')).join('\n') || '',
                        '',
                        ''
                    ]);
                    row.eachCell((cell) => {
                        cell.alignment = { wrapText: true, vertical: 'top' }; // hoặc 'middle'
                    });
                }


                // === Set độ rộng các cột ===
                const columnWidths = [6, 15, 10, 10, 7, 10, 10, 10, 7, 7, 7, 7, 7];
                worksheet.getColumn(1).alignment = {
                    horizontal: 'center',
                    vertical: 'middle'
                };
                columnWidths.forEach((w, i) => {
                    const colIndex = i + 1;
                    worksheet.getColumn(colIndex).width = w;

                    worksheet.getColumn(colIndex).eachCell((cell, rowNumber) => {
                        if (rowNumber >= 6) {
                            cell.border = {
                                top: { style: 'thin' },
                                left: { style: 'thin' },
                                bottom: { style: 'thin' },
                                right: { style: 'thin' }
                            };
                        }
                    });
                });

                // add chu ki
                if (signature) {
                    const response = await axios.get(signature, { responseType: 'arraybuffer' });
                    const contentType = response.headers['content-type'];
                    const extension = contentType.split('/')[1];
                    const imageBuffer = Buffer.from(response.data, 'binary');

                    // Thêm ảnh vào workbook
                    const imageId = workbook.addImage({
                        buffer: imageBuffer,
                        extension
                    });

                    // Gán ảnh vào vị trí (dùng topleft + extents hoặc range)
                    const lastCol = worksheet.columnCount;
                    worksheet.addImage(imageId, {
                        tl: { col: lastCol - 2, row: index + 7 }, // H30
                        ext: { width: 150, height: 150 },
                    });
                }

                worksheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) return;
                    row.eachCell((cell) => {
                        // Nếu chưa có font, tạo font mới
                        if (!cell.font) cell.font = {};
                        cell.font.size = 8; // hoặc 8, tuỳ theo bạn muốn nhỏ đến đâu
                    });
                });
            }
        }

        // Xuất file
        const buffer = await workbook.xlsx.writeBuffer();

        // Thiết lập header để tải file về
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader(
            'Content-Disposition',
            "attachment; filename*=UTF-8''*.xlsx"
        );    // Gửi buffer về client
        res.send(buffer);


    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

// báo chuyến máy xúc

router.post('/excavatorTripReport/view', verifyToken, restrictTo('admin', 'dispatcher', 'manager'), async (req, res, next) => {
    try {
        const { shift, startDate, endDate, } = req.body
        let query = {
            createdBy: req.userId
        };
        if (Array.isArray(shift) && shift.length > 0) {
            query.shift = { $in: shift };
        }

        if (startDate && endDate) {
            query.workingDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        const orders = await Order.find(query)
            .populate({
                path: "shiftReport",
                populate: [
                    {
                        path: "vehicleSummaries.vehicle",
                        select: "code vehicleNumber"
                    },
                ]
            })
            .populate('assignedTo', 'fullName salaryCode department')
            .populate('job', 'name type')
            .populate({
                path: 'device',
                select: 'code category',
                populate: {
                    path: 'category',
                    select: 'name'
                }
            })
            .populate('shift')
        const filteredOrders = orders.filter(order =>
            order.job?.type === "Vận hành xúc"
        );

        let result = []
        for (const order of filteredOrders) {
            const reports = await Report.find({ orderId: order._id })
                .populate('device', 'code')

            result.push({
                _id: order?._id,
                fullName: order?.assignedTo?.fullName,
                salaryCode: order?.assignedTo?.salaryCode,
                department: order?.assignedTo?.department?.name,
                code: order.device.map(item => item.code) || '',
                quantity: reports.map(item => item.quantity) || '',
            });
        }

        res.status(200).send({ status: 'success', data: result })
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
})

router.post('/excavatorTripReport', verifyToken, restrictTo('admin', 'dispatcher', 'manager'), async (req, res, next) => {
    try {
        const { shift, startDate, endDate, title, signature } = req.body
        const shiftList = await Shift.find({ _id: { $in: shift } });
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Đảm bảo end không nhỏ hơn start
        if (end < start) return res.status(400).json({ message: "Ngày kết thúc phải sau ngày bắt đầu" });

        const workbook = new ExcelJS.Workbook();
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            for (const ca of shiftList) {
                const orders = await Order.find({
                    workingDate: d,
                    shift: ca._id,
                    createdBy: req.userId
                })
                    .populate({
                        path: "shiftReport",
                        populate: [
                            {
                                path: "vehicleSummaries.vehicle",
                                select: "code vehicleNumber"
                            },

                        ]
                    })
                    .populate('assignedTo', 'fullName salaryCode department')
                    .populate('job', 'name type')
                    .populate({
                        path: 'device',
                        select: 'code category',
                        populate: {
                            path: 'category',
                            select: 'name'
                        }
                    })
                    .populate('shift')
                const filteredOrders = orders.filter(order =>
                    order.job?.type === "Vận hành xúc"
                );


                const sheetName = `${formatDate(d)}_${ca.name}`.replace(/[\\\/:*?\[\]]/g, '-').substring(0, 31);

                const worksheet = workbook.addWorksheet(sheetName);

                worksheet.mergeCells('A1:E1');
                const infoRow = worksheet.getCell('A1');
                infoRow.value = `Ca: ${ca.name}, ngày: ${formatDate(d)}         Tên cán bộ:`;
                infoRow.font = { italic: true, size: 12 };
                infoRow.alignment = { horizontal: 'left', vertical: 'middle' };
                // Tiêu đề bảng
                worksheet.mergeCells('A2:E2');
                const header = worksheet.getCell('A2');
                header.value = title;
                header.font = { bold: true, size: 14 };
                header.alignment = { horizontal: 'center', vertical: 'middle' };

                const headerRow = worksheet.addRow(['STT', 'Họ và tên', 'Số thẻ', 'Đơn vị', 'Máy vận hành', 'Số chuyến']);
                headerRow.font = { bold: true };
                headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

                let index = 1;
                for (const order of filteredOrders) {
                    const reports = await Report.find({ orderId: order._id })
                        .populate('device', 'code')
                    worksheet.addRow([
                        index++,
                        order.assignedTo?.fullName || '',
                        order.assignedTo?.salaryCode || '',
                        order.assignedTo?.department?.name || '',
                        reports.map(item => (item?.device?.code || '')).join('\n') || '',
                        reports.map(item => (item?.quantity || '')).join('\n') || '',
                    ]);
                }
                addTableBorders(worksheet, 3, 3 + index, 1, 6)
                worksheet.getColumn(1).width = 6;
                worksheet.getColumn(1).alignment = { horizontal: 'center' }
                worksheet.getColumn(2).width = 20;
                worksheet.getColumn(2).alignment = { horizontal: 'center' }
                worksheet.getColumn(3).width = 10;
                worksheet.getColumn(3).alignment = { horizontal: 'center' }
                worksheet.getColumn(4).width = 40;
                worksheet.getColumn(5).width = 20;
                worksheet.getColumn(6).width = 15;

                if (signature) {
                    const response = await axios.get(signature, { responseType: 'arraybuffer' });
                    const contentType = response.headers['content-type'];
                    const extension = contentType.split('/')[1];
                    const imageBuffer = Buffer.from(response.data, 'binary');

                    // Thêm ảnh vào workbook
                    const imageId = workbook.addImage({
                        buffer: imageBuffer,
                        extension
                    });

                    // Gán ảnh vào vị trí (dùng topleft + extents hoặc range)
                    const lastCol = worksheet.columnCount;
                    worksheet.addImage(imageId, {
                        tl: { col: lastCol - 2, row: index + 7 }, // H30
                        ext: { width: 150, height: 150 },
                    });
                }

                worksheet.eachRow((row) => {
                    row.eachCell((cell) => {
                        // Nếu chưa có font, tạo font mới
                        if (!cell.font) cell.font = {};
                        cell.font.size = 12; // hoặc 8, tuỳ theo bạn muốn nhỏ đến đâu
                    });
                });
            }
        }

        // Xuất file
        const buffer = await workbook.xlsx.writeBuffer();

        // Thiết lập header để tải file về
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader(
            'Content-Disposition',
            "attachment; filename*=UTF-8''*.xlsx"
        );   // Gửi buffer về client
        res.send(buffer);

    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
})

// báo chuyến ô tô

router.post('/carTripReport/view', verifyToken, restrictTo('admin', 'dispatcher', 'manager'), async (req, res, next) => {
    try {
        const { shift, startDate, endDate, } = req.body
        let query = {
            createdBy: req.userId
        };
        if (Array.isArray(shift) && shift.length > 0) {
            query.shift = { $in: shift };
        }

        if (startDate && endDate) {
            query.workingDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        const orders = await Order.find(query)
            .populate({
                path: "shiftReport",
                populate: [
                    {
                        path: "vehicleSummaries.vehicle",
                        select: "_id code vehicleNumber"
                    },
                ]
            })
            .populate({
                path: 'assignedTo',
                select: 'fullName salaryCode department',
                populate: ('department')
            })
            .populate('job', 'name type')
            .populate('location', 'name')
            .populate('material', 'name')
            .populate('excavator', 'code')
            .populate({
                path: 'device',
                select: 'code category',
                populate: {
                    path: 'category',
                    select: 'name'
                }
            })
            .populate('shift')
        const filteredOrders = orders.filter(order =>
            order.job?.type === "Vận hành xe"
        );

        let result = []
        for (const order of filteredOrders) {
            const reports = await Report.find({ orderId: order._id })
                .populate('device', 'code')
                .populate('material', 'name')

            result.push({
                _id: order._id,
                fullName: order?.assignedTo?.fullName,
                salaryCode: order?.assignedTo?.salaryCode,
                department: order?.assignedTo?.department?.name,
                shift: `${order?.shiftReport._id}`,
                code: order.device.map(item => item.code) || '',
                material: reports.map(item => item.material?.name) || '',
                tripCount: reports.map(item => item.quantity) || '',
            });
        }

        res.status(200).send({ status: 'success', data: result })
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
})

router.post('/carTripReport', verifyToken, restrictTo('admin', 'dispatcher', 'manager'), async (req, res, next) => {
    try {
        const { shift, startDate, endDate, title, signature } = req.body
        const shiftList = await Shift.find({ _id: { $in: shift } });
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Đảm bảo end không nhỏ hơn start
        if (end < start) return res.status(400).json({ message: "Ngày kết thúc phải sau ngày bắt đầu" });

        const workbook = new ExcelJS.Workbook();
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            for (const ca of shiftList) {
                const orders = await Order.find({
                    workingDate: d,
                    shift: ca._id,
                    createdBy: req.userId
                })
                    .populate({
                        path: "shiftReport",
                        populate: [
                            {
                                path: "vehicleSummaries.vehicle",
                                select: "_id code vehicleNumber"
                            },
                        ]
                    })
                    .populate({
                        path: 'assignedTo',
                        select: 'fullName salaryCode department',
                        populate: ('department')
                    })
                    .populate('job', 'name type')
                    .populate('location', 'name')
                    .populate('material', 'name')
                    .populate('excavator', 'code')
                    .populate({
                        path: 'device',
                        select: 'code category',
                        populate: {
                            path: 'category',
                            select: 'name'
                        }
                    })
                    .populate('shift')

                const filteredOrders = orders.filter(order =>
                    order.job?.type === "Vận hành xe"
                );

                let result = []
                for (const order of filteredOrders) {
                    const reports = await Report.find({ orderId: order._id })
                        .populate('device', 'code')
                        .populate('material', 'name')

                    result.push({
                        _id: order._id,
                        fullName: order?.assignedTo?.fullName,
                        salaryCode: order?.assignedTo?.salaryCode,
                        department: order?.assignedTo?.department?.name,
                        shift: `${order?.shiftReport._id}`,
                        code: order.device.map(item => item.code) || [],
                        material: reports.map(item => item.material?.name) || [],
                        tripCount: reports.map(item => item.quantity) || [],
                    });
                }

                const sheetName = `${formatDate(d)}_${ca.name}`.replace(/[\\\/:*?\[\]]/g, '-').substring(0, 31);

                const worksheet = workbook.addWorksheet(sheetName);

                worksheet.mergeCells('A1:G1');
                const infoRow = worksheet.getCell('A1');
                infoRow.value = `Ca: ${ca.name}, ngày: ${formatDate(d)}         Tên cán bộ:`;
                infoRow.font = { italic: true, size: 12 };
                infoRow.alignment = { horizontal: 'left', vertical: 'middle' };
                // Tiêu đề bảng
                worksheet.mergeCells('A2:G2');
                const header = worksheet.getCell('A2');
                header.value = title;
                header.font = { bold: true, size: 14 };
                header.alignment = { horizontal: 'center', vertical: 'middle' };

                const headerRow = worksheet.addRow(['STT', 'Họ và tên', 'Số thẻ', 'Đơn vị', 'Máy vận hành', 'Vật liệu', 'Số chuyến']);
                headerRow.font = { bold: true };
                headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

                let index = 1;
                console.log(result)
                for (const item of result) {
                    worksheet.addRow([
                        index++,
                        item.fullName || '',
                        item.salaryCode || '',
                        item.department || '',
                        item.code?.map(item => (item || '')).join('\n') || '',
                        item.material?.map(item => (item || '')).join('\n') || '',
                        item.tripCount?.map(item => (item || '')).join('\n') || '',
                    ]);
                }

                worksheet.getColumn(1).width = 6;
                worksheet.getColumn(1).alignment = { horizontal: 'center' }
                worksheet.getColumn(2).width = 20;
                worksheet.getColumn(2).alignment = { horizontal: 'center' }
                worksheet.getColumn(3).width = 10;
                worksheet.getColumn(3).alignment = { horizontal: 'center' }
                worksheet.getColumn(4).width = 40;
                worksheet.getColumn(5).width = 20;
                worksheet.getColumn(6).width = 20;
                worksheet.getColumn(7).width = 15;

                if (signature) {
                    const response = await axios.get(signature, { responseType: 'arraybuffer' });
                    const contentType = response.headers['content-type'];
                    const extension = contentType.split('/')[1];
                    const imageBuffer = Buffer.from(response.data, 'binary');

                    // Thêm ảnh vào workbook
                    const imageId = workbook.addImage({
                        buffer: imageBuffer,
                        extension
                    });

                    // Gán ảnh vào vị trí (dùng topleft + extents hoặc range)
                    const lastCol = worksheet.columnCount;
                    worksheet.addImage(imageId, {
                        tl: { col: lastCol - 2, row: index + 7 }, // H30
                        ext: { width: 150, height: 150 },
                    });
                }

                worksheet.eachRow((row) => {
                    row.eachCell((cell) => {
                        // Nếu chưa có font, tạo font mới
                        if (!cell.font) cell.font = {};
                        cell.font.size = 12; // hoặc 8, tuỳ theo bạn muốn nhỏ đến đâu
                    });
                });
            }
        }

        // Xuất file
        const buffer = await workbook.xlsx.writeBuffer();

        // Thiết lập header để tải file về
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader(
            'Content-Disposition',
            "attachment; filename*=UTF-8''*.xlsx"
        );   // Gửi buffer về client
        res.send(buffer);

    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
})

// báo sản lượng

router.post('/productReport/view', verifyToken, restrictTo('admin', 'dispatcher', 'manager'), async (req, res, next) => {
    try {
        const { shift, startDate, endDate, } = req.body
        let query = {
            createdBy: req.userId
        };
        if (Array.isArray(shift) && shift.length > 0) {
            query.shift = { $in: shift };
        }

        if (startDate && endDate) {
            query.workingDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        const orders = await Order.find(query)
            .populate({
                path: "shiftReport",
                populate: [
                    {
                        path: "vehicleSummaries.vehicle",
                        select: "code vehicleNumber"
                    },
                ]
            })
            .populate('assignedTo', 'fullName salaryCode department')
            .populate('job', 'name')
            .populate('location', 'name')
            .populate('material', 'name')
            .populate('excavator', 'code')
            .populate({
                path: 'device',
                select: 'code category',
                populate: {
                    path: 'category',
                    select: 'name'
                }
            })
            .populate('shift')
        const filteredOrders = orders.filter(order =>
            order.device?.category?.name === "Vận tải"
        );
        const formattedData = filteredOrders.flatMap((order, orderIndex) => {
            if (!order.shiftReport || !order.shiftReport.vehicleReports) return [];

            return order.shiftReport.vehicleReports
                .map(summary => {

                    return {
                        _id: summary?.vehicle?._id,
                        fullName: order?.assignedTo?.fullName,
                        salaryCode: order?.assignedTo?.salaryCode,
                        department: order?.assignedTo?.department?.name,
                        shift: `${order?.shiftReport._id}`,
                        code: summary?.vehicle?.code || '',
                        material: summary?.materialType?.name || '',
                        tripCount: summary?.tripCount || '',
                    };
                });
        });

        res.status(200).send({ status: 'success', data: formattedData })
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
})

router.post('/productReport', verifyToken, restrictTo('admin', 'dispatcher', 'manager'), async (req, res, next) => {
    try {
        const { shift, startDate, endDate, title, signature } = req.body
        const shiftList = await Shift.find({ _id: { $in: shift } });
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Đảm bảo end không nhỏ hơn start
        if (end < start) return res.status(400).json({ message: "Ngày kết thúc phải sau ngày bắt đầu" });

        const workbook = new ExcelJS.Workbook();
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            for (const ca of shiftList) {
                const orders = await Order.find({
                    workingDate: d,
                    shift: ca._id,
                    createdBy: req.userId
                })
                    .populate({
                        path: "shiftReport",
                        populate: [
                            {
                                path: "vehicleSummaries.vehicle",
                                select: "code vehicleNumber"
                            },
                        ]
                    })
                    .populate('assignedTo', 'fullName salaryCode department')
                    .populate('job', 'name')
                    .populate('location', 'name')
                    .populate('material', 'name')
                    .populate('excavator', 'code')
                    .populate({
                        path: 'device',
                        select: 'code category',
                        populate: {
                            path: 'category',
                            select: 'name'
                        }
                    })
                    .populate('shift')
                const filteredOrders = orders.filter(order =>
                    order.device?.category?.name === "Vận tải"
                );
                const formattedData = filteredOrders.flatMap((order, orderIndex) => {
                    if (!order.shiftReport || !order.shiftReport.vehicleReports) return [];

                    return order.shiftReport.vehicleReports
                        .map(summary => {

                            return {
                                _id: summary?.vehicle?._id,
                                fullName: order?.assignedTo?.fullName,
                                salaryCode: order?.assignedTo?.salaryCode,
                                department: order?.assignedTo?.department?.name,
                                shift: `${order?.shiftReport._id}`,
                                code: summary?.vehicle?.code || '',
                                material: summary?.materialType?.name || '',
                                tripCount: summary?.tripCount || '',
                            };
                        });
                });
                const sheetName = `${formatDate(d)}_${ca.name}`.replace(/[\\\/:*?\[\]]/g, '-').substring(0, 31);

                const worksheet = workbook.addWorksheet(sheetName);

                // --- 2. DÒNG NGÀY, THÁNG ---
                worksheet.mergeCells('A1:T3');
                const infoRow = worksheet.getCell('A1');
                infoRow.value = `Ca: ${ca.name}, ngày: ${formatDate(d)}`;
                infoRow.font = { italic: true, size: 16 };
                infoRow.alignment = { horizontal: 'left', vertical: 'middle' };

                // --- 3. TIÊU ĐỀ CÁC CỘT ---
                setCell(worksheet, 'D4:E5', 'TUYẾN VẬN TẢI')
                setCell(worksheet, 'F4:H5', 'SẢN LƯỢNG THỰC HIỆN - THAN')
                setCell(worksheet, 'I4:K5', 'SẢN LƯỢNG THỰC HIỆN - ĐẤT, ĐÁ')
                setCell(worksheet, 'O4:Q5', 'GA DOAN (LÍT)')

                // Hàng 5
                worksheet.getRow(5).values = [, , , , 'Cung độ', 'Độ cao', 'Số chuyến', 'Số tấn', 'T.Km', 'Số chuyến', 'Số m3', 'T.Km', , , , 'Tổng đầu ca', 'Cấp trong ca', 'Tiêu thụ trong ca'];
                worksheet.getRow(5).eachCell(cell => {
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                });

                // Hàng 6 - số thứ tự
                worksheet.getRow(6).values = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];

                // --- 4. Style: căn giữa, border ---
                for (let rowIndex = 4; rowIndex <= 6; rowIndex++) {
                    const row = worksheet.getRow(rowIndex);
                    row.eachCell(cell => {
                        cell.font = { bold: true, size: 11 };
                        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                        cell.border = {
                            top: { style: 'thin' },
                            left: { style: 'thin' },
                            bottom: { style: 'thin' },
                            right: { style: 'thin' }
                        };
                    });
                }
                setCell(worksheet, 'A4:A5', 'SỐ TT')
                setCell(worksheet, 'B4:B5', 'SỐ ĐĂNG KÝ THIẾT BỊ')
                setCell(worksheet, 'C4:C5', 'HỌ VÀ TÊN CÔNG NHÂN VẬN HÀNH')
                setCell(worksheet, 'L4:L5', 'T.Km phục vụ')
                setCell(worksheet, 'M4:M5', 'Tổng sản lượng T.Km')
                setCell(worksheet, 'N4:N5', 'Giờ hoạt động ra sản phẩm')
                setCell(worksheet, 'R4:R5', 'Dầu nhờn (lít)')
                setCell(worksheet, 'S4:S5', 'Mỡ máy (Kg)')
                setCell(worksheet, 'T4:T5', 'CN VẬN HÀNH KÝ NHẬN')

                const length = formattedData.length;

                if (signature) {
                    const response = await axios.get(signature, { responseType: 'arraybuffer' });
                    const contentType = response.headers['content-type'];
                    const extension = contentType.split('/')[1];
                    const imageBuffer = Buffer.from(response.data, 'binary');

                    // Thêm ảnh vào workbook
                    const imageId = workbook.addImage({
                        buffer: imageBuffer,
                        extension
                    });

                    // Gán ảnh vào vị trí (dùng topleft + extents hoặc range)
                    const lastCol = worksheet.columnCount;
                    worksheet.addImage(imageId, {
                        tl: { col: lastCol - 2, row: length + 7 }, // H30
                        ext: { width: 150, height: 150 },
                    });
                }

                worksheet.eachRow((row) => {
                    row.eachCell((cell) => {
                        // Nếu chưa có font, tạo font mới
                        if (!cell.font) cell.font = {};
                        cell.font.size = 8; // hoặc 8, tuỳ theo bạn muốn nhỏ đến đâu
                    });
                });
            }
        }

        // Xuất file
        const buffer = await workbook.xlsx.writeBuffer();

        // Thiết lập header để tải file về
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader(
            'Content-Disposition',
            "attachment; filename*=UTF-8''*.xlsx"
        );   // Gửi buffer về client
        res.send(buffer);

    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
})

// báo công

router.post('/worklog/view', verifyToken, restrictTo('admin', 'dispatcher', 'manager'), async (req, res, next) => {
    try {
        const { shift, startDate, endDate, } = req.body
        let query = {
            createdBy: req.userId
        };
        if (Array.isArray(shift) && shift.length > 0) {
            query.shift = { $in: shift };
        }

        if (startDate && endDate) {
            query.workingDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        const orders = await Order.find(query)
            .populate('assignedTo', 'fullName salaryCode department')
            .populate('job', 'name')
            .populate('device', 'code')
            .populate('shift')
            .populate('shiftReport')

        const formattedData = orders
            .filter(order => order.shiftReport)
            .map(order => ({
                _id: order._id,
                fullName: order.assignedTo?.fullName,
                salaryCode: order.assignedTo?.salaryCode,
                device: order.device?.map(d => d.code).join(','),
                job: order.job?.name,
            }));

        res.status(200).send({ status: 'success', data: formattedData })
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
})

router.post('/worklog', verifyToken, restrictTo('admin', 'dispatcher', 'manager'), async (req, res, next) => {
    try {
        const { shift, startDate, endDate, signature } = req.body
        const shiftList = await Shift.find({ _id: { $in: shift } });
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Đảm bảo end không nhỏ hơn start
        if (end < start) return res.status(400).json({ message: "Ngày kết thúc phải sau ngày bắt đầu" });

        const workbook = new ExcelJS.Workbook();
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            for (const ca of shiftList) {
                const orders = await Order.find({
                    workingDate: d,
                    shift: ca._id,
                    createdBy: req.userId
                })
                    .populate('assignedTo', 'fullName salaryCode department')
                    .populate('job', 'name')
                    .populate('device', 'code')
                    .populate('shiftReport')

                const formattedData = orders
                    .filter(order => order.shiftReport)
                    .map(order => ({
                        _id: order._id,
                        fullName: order.assignedTo?.fullName,
                        salaryCode: order.assignedTo?.salaryCode,
                        device: order.device?.map(d => d.code).join(','),
                        job: order.job?.name,
                    }));
                const sheetName = `${formatDate(d)}_${ca.name}`.replace(/[\\\/:*?\[\]]/g, '-').substring(0, 31);

                const worksheet = workbook.addWorksheet(sheetName);


                worksheet.mergeCells('A1:I1');
                const infoRow = worksheet.getCell('A1');
                infoRow.value = `Ca: ${ca.name}, ngày: ${formatDate(d)}         Tên cán bộ: ${req.user?.fullName}`;
                infoRow.font = { italic: true, size: 12 };
                infoRow.alignment = { horizontal: 'left', vertical: 'middle' };
                // Tiêu đề bảng
                worksheet.mergeCells('A2:I2');
                const header = worksheet.getCell('A2');
                header.value = "Báo công hàng ngày";
                header.font = { bold: true, size: 14 };
                header.alignment = { horizontal: 'center', vertical: 'middle' };

                setCell(worksheet, 'A3', 'STT')
                setCell(worksheet, 'B3', 'Họ và tên')
                setCell(worksheet, 'C3', 'Số thẻ')
                setCell(worksheet, 'D3', 'Thiết bị vận hành, vị trí làm việc')
                setCell(worksheet, 'E3', 'Vị trí ăn')
                setCell(worksheet, 'F3', 'Lương cấp bậc 1 ngày')
                setCell(worksheet, 'G3', 'Lương sản phẩm')
                setCell(worksheet, 'H3', 'Nội dung công việc')
                setCell(worksheet, 'I3', 'Ghi chú')


                let index = 1;
                for (const item of formattedData) {
                    worksheet.addRow([
                        index++,
                        item.fullName,
                        item.salaryCode,
                        item?.device,
                        '',
                        '',
                        '',
                        item?.job,
                        ''
                    ]);
                }

                worksheet.getColumn(1).width = 6;
                worksheet.getColumn(1).alignment = { horizontal: 'center' }
                worksheet.getColumn(2).width = 20;
                worksheet.getColumn(2).alignment = { horizontal: 'center' }
                worksheet.getColumn(3).width = 10;
                worksheet.getColumn(3).alignment = { horizontal: 'center' }
                worksheet.getColumn(4).width = 15;
                worksheet.getColumn(5).width = 10;
                worksheet.getColumn(6).width = 15
                worksheet.getColumn(7).width = 10;
                worksheet.getColumn(8).width = 25;
                worksheet.getColumn(9).width = 10;

                const length = formattedData.length
                setCell(worksheet, `C${length + 7}:D${length + 7}`, 'TỔ TRƯỞNG')
                setCell(worksheet, `H${length + 7}:I${length + 7}`, 'QUẢN ĐỐC')

                // for (let row = length + 6; row <= length + 10; row++) {
                //     for (let col = 1; col <= 9; col++) { // A = 1, M = 13
                //         const cell = worksheet.getRow(row).getCell(col);
                //         cell.border = {};
                //         cell.fill = {
                //             type: 'pattern',
                //             pattern: 'solid',
                //             fgColor: { argb: 'FFFFFFFF' }
                //         }; // Xóa tất cả border
                //     }
                // }


                if (signature) {
                    const response = await axios.get(signature, { responseType: 'arraybuffer' });
                    const contentType = response.headers['content-type'];
                    const extension = contentType.split('/')[1];
                    const imageBuffer = Buffer.from(response.data, 'binary');

                    // Thêm ảnh vào workbook
                    const imageId = workbook.addImage({
                        buffer: imageBuffer,
                        extension
                    });

                    // Gán ảnh vào vị trí (dùng topleft + extents hoặc range)
                    const lastCol = worksheet.columnCount;
                    worksheet.addImage(imageId, {
                        tl: { col: lastCol - 2, row: length + 8 }, // H30
                        ext: { width: 150, height: 150 },
                    });
                }

                worksheet.eachRow((row) => {
                    row.eachCell((cell) => {
                        // Nếu chưa có font, tạo font mới
                        if (!cell.font) cell.font = {};
                        cell.font.size = 8; // hoặc 8, tuỳ theo bạn muốn nhỏ đến đâu
                    });
                });
            }
        }

        // Xuất file
        const buffer = await workbook.xlsx.writeBuffer();

        // Thiết lập header để tải file về
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader(
            'Content-Disposition',
            "attachment; filename*=UTF-8''*.xlsx"
        );   // Gửi buffer về client
        res.send(buffer);

    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
})

// báo ăn

router.post('/meal_request/view', verifyToken, restrictTo('admin', 'dispatcher', 'manager'), async (req, res, next) => {
    try {
        const { shift, startDate, endDate, } = req.body
        let query = {
            createdBy: req.userId,
            status: { $nin: ["pending", "cancel"] }
        };
        if (Array.isArray(shift) && shift.length > 0) {
            query.shift = { $in: shift };
        }

        if (startDate && endDate) {
            query.workingDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }
        const orders = await Order.find(query)
            .populate('assignedTo', 'fullName salaryCode department')
            .populate('job', 'name')
            .populate('location', 'name')
            .populate('material', 'name')
            .populate('excavator', 'code')
            .populate('device', 'code')
            .populate('shift')
        const formattedData = orders.flatMap((order, orderIndex) => {
            return {
                _id: order?._id,
                fullName: order?.assignedTo?.fullName,
                salaryCode: order?.assignedTo?.salaryCode,
                device: order?.device.map(item => item.code).join(','),
                job: order?.job?.name,
            };
        });

        res.status(200).send({ status: 'success', data: formattedData })
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
})

router.post('/meal_request', verifyToken, restrictTo('admin', 'dispatcher', 'manager'), async (req, res, next) => {
    try {
        const { shift, startDate, endDate, signature } = req.body
        const shiftList = await Shift.find({ _id: { $in: shift } });
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Đảm bảo end không nhỏ hơn start
        if (end < start) return res.status(400).json({ message: "Ngày kết thúc phải sau ngày bắt đầu" });

        const workbook = new ExcelJS.Workbook();
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            for (const ca of shiftList) {
                const orders = await Order.find({
                    workingDate: d,
                    shift: ca._id,
                    createdBy: req.userId,
                    status: { $nin: ["pending", "cancel"] }
                })
                    .populate('assignedTo', 'fullName salaryCode department')
                    .populate('job', 'name')
                    .populate('location', 'name')
                    .populate('material', 'name')
                    .populate('excavator', 'code')
                    .populate('device', 'code')
                    .populate('shift')

                const formattedData = orders.flatMap((order, orderIndex) => {

                    return {
                        _id: order?._id,
                        fullName: order?.assignedTo?.fullName,
                        salaryCode: order?.assignedTo?.salaryCode,
                        device: order?.device.map(item => item.code).join(','),
                        job: order?.job?.name
                    };
                });

                const sheetName = `${formatDate(d)}_${ca.name}`.replace(/[\\\/:*?\[\]]/g, '-').substring(0, 31);

                const worksheet = workbook.addWorksheet(sheetName);


                worksheet.mergeCells('A1:G1');
                const infoRow = worksheet.getCell('A1');
                infoRow.value = `Ca: ${ca.name}, ngày: ${formatDate(d)}         Tên cán bộ:`;
                infoRow.font = { italic: true, size: 12 };
                infoRow.alignment = { horizontal: 'left', vertical: 'middle' };
                // Tiêu đề bảng
                worksheet.mergeCells('A2:G2');
                const header = worksheet.getCell('A2');
                header.value = "PHIẾU BÁO ĂN";
                header.font = { bold: true, size: 14 };
                header.alignment = { horizontal: 'center', vertical: 'middle' };

                setCell(worksheet, 'A3', 'STT')
                setCell(worksheet, 'B3', 'Họ và tên')
                setCell(worksheet, 'C3', 'Số thẻ')
                setCell(worksheet, 'D3', 'Số xe')
                setCell(worksheet, 'E3', 'Công việc')
                setCell(worksheet, 'F3', 'Vị trí báo ăn')
                setCell(worksheet, 'G3', 'Ghi chú')


                let index = 1;
                for (const item of formattedData) {
                    worksheet.addRow([
                        index++,
                        item.fullName,
                        item.salaryCode,
                        item?.device,
                        item?.job,
                        '',
                        ''
                    ]);
                }

                worksheet.getColumn(1).width = 6;
                worksheet.getColumn(1).alignment = { horizontal: 'center' }
                worksheet.getColumn(2).width = 20;
                worksheet.getColumn(2).alignment = { horizontal: 'center' }
                worksheet.getColumn(3).width = 10;
                worksheet.getColumn(3).alignment = { horizontal: 'center' }
                worksheet.getColumn(4).width = 15;
                worksheet.getColumn(5).width = 25;
                worksheet.getColumn(6).width = 15
                worksheet.getColumn(7).width = 15;

                const length = formattedData.length
                setCell(worksheet, `E${length + 7}:G${length + 7}`, 'CÁN BỘ ĐI CA')

                // for (let row = length + 6; row <= length + 10; row++) {
                //     for (let col = 1; col <= 7; col++) { // A = 1, M = 13
                //         const cell = worksheet.getRow(row).getCell(col);
                //         cell.border = {};
                //         cell.fill = {
                //             type: 'pattern',
                //             pattern: 'solid',
                //             fgColor: { argb: 'FFFFFFFF' }
                //         }; // Xóa tất cả border
                //     }
                // }

                if (signature) {
                    const response = await axios.get(signature, { responseType: 'arraybuffer' });
                    const contentType = response.headers['content-type'];
                    const extension = contentType.split('/')[1];
                    const imageBuffer = Buffer.from(response.data, 'binary');

                    // Thêm ảnh vào workbook
                    const imageId = workbook.addImage({
                        buffer: imageBuffer,
                        extension
                    });

                    // Gán ảnh vào vị trí (dùng topleft + extents hoặc range)
                    const lastCol = worksheet.columnCount;
                    worksheet.addImage(imageId, {
                        tl: { col: lastCol - 2, row: length + 8 }, // H30
                        ext: { width: 150, height: 150 },
                    });
                }

                worksheet.eachRow((row) => {
                    row.eachCell((cell) => {
                        // Nếu chưa có font, tạo font mới
                        if (!cell.font) cell.font = {};
                        cell.font.size = 10; // hoặc 8, tuỳ theo bạn muốn nhỏ đến đâu
                    });
                });
            }
        }

        // Xuất file
        const buffer = await workbook.xlsx.writeBuffer();

        // Thiết lập header để tải file về
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader(
            'Content-Disposition',
            "attachment; filename*=UTF-8''*.xlsx"
        );   // Gửi buffer về client
        res.send(buffer);

    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
})

router.post('/assignmentTo', verifyToken, restrictTo('admin', 'dispatcher', 'manager'), async (req, res, next) => {
    try {
        const { shift, startDate, endDate, signature } = req.body
        const shiftList = await Shift.find({ _id: { $in: shift } });
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Đảm bảo end không nhỏ hơn start
        if (end < start) return res.status(400).json({ message: "Ngày kết thúc phải sau ngày bắt đầu" });

        const workbook = new ExcelJS.Workbook();
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            for (const ca of shiftList) {
                const orders = await Order.find({
                    workingDate: d,
                    shift: ca._id,
                    createdBy: req.userId,
                    status: { $nin: ["pending", "cancel"] }
                })
                    .populate('assignedTo', 'fullName salaryCode department')
                    .populate('job', 'name')
                    .populate('location', 'name')
                    .populate('material', 'name')
                    .populate('excavator', 'code')
                    .populate('device', 'code')
                    .populate('shift')
                    .populate('createdBy', 'fullName salaryCode department')



                for (const order of orders) {
                    const sheetName = `${formatDate(d)}_${ca.name}_${order?.assignedTo?.salaryCode}`.replace(/[\\\/:*?\[\]]/g, '-').substring(0, 31);

                    const worksheet = workbook.addWorksheet(sheetName, {
                        views: [{ showGridLines: false }]
                    });

                    worksheet.pageSetup = {
                        paperSize: 9,
                        orientation: 'portrait',
                        fitToPage: true,
                        fitToWidth: 1,
                        fitToHeight: 1,
                        margins: {
                            top: 0.5, bottom: 0.5, left: 0.5, right: 0.5,
                            header: 0.3, footer: 0.3
                        }
                    };

                    worksheet.columns = [
                        { width: 25 }, // A
                        { width: 30 }, // B
                        { width: 40 }, // C
                    ];

                    const generateDotLine = (totalLength, prefix = '') => {
                        const lineLength = totalLength - prefix.length;
                        return prefix + '.'.repeat(lineLength > 0 ? lineLength : 0);
                    };
                    const addRow = (values = [], options = {}) => {
                        const row = worksheet.addRow(values);
                        if (options.merge) worksheet.mergeCells(options.merge);
                        if (options.bold) row.font = { bold: true };
                        if (options.italic) row.font = { italic: true };
                        return row;
                    };

                    // Tiêu đề dòng đầu
                    addRow([`Ca: ${ca?.name}     Ngày: ${d.getDate()}     Tháng: ${d.getMonth() + 1}     Năm: ${d.getFullYear()}`], {
                        merge: 'A1:C1',
                    });

                    addRow([`Người giao: ${order?.createdBy?.fullName}       Người nhận: ${order?.assignedTo?.fullName}`], {
                        merge: 'A2:C2',
                    });

                    worksheet.addRow([]);

                    // I. Hoạt động trong ca
                    addRow(['I. Hoạt động trong ca:'], { bold: true });
                    addRow(['Tuyến hoạt động: .........................  Cự ly (km): .............  Chở than/đất: ..........................'], {
                        merge: 'A5:C5',
                    });
                    addRow(['Số chuyển theo định mức: ..............  Số chuyển thực tế: ..............  Giờ hoạt động: ...............'], {
                        merge: 'A6:C6',
                    });
                    addRow(['Giờ sau cộng tiếp sau KT: .............   Giờ cộng tiếp sau bảo dưỡng cấp 1: ..............'], {
                        merge: 'A7:C7',
                    });
                    addRow(['Những hư hỏng xảy ra trong ca:'], { merge: 'A8:C8' });
                    worksheet.addRow([generateDotLine(200, '')]);
                    worksheet.addRow([generateDotLine(200, '')]);

                    worksheet.addRow([]);

                    // II. Những công việc đã thực hiện
                    addRow(['II. Những công việc đã thực hiện trong ca (KT, bảo dưỡng, sửa chữa):'], { bold: true, merge: 'A12:C12' });
                    worksheet.addRow([generateDotLine(200, '')]);
                    worksheet.addRow([generateDotLine(200, '')]);

                    worksheet.addRow([]);

                    // III. Nhiên liệu
                    addRow(['III. Nhiên liệu:'], { bold: true });
                    addRow(['Tồn đầu ca: ................   Lĩnh trong ca: ...............   Tồn cuối ca: ...............'], {
                        merge: 'A17:C17',
                    });
                    addRow(['Mức tiêu hao: theo định mức: ...............  thực tế: ...............  quá mức: ...............'], {
                        merge: 'A18:C18',
                    });
                    addRow(['Bổ sung dầu nhớt: loại dầu: ...............  vị trí: ...............  số lượng: ...............'], {
                        merge: 'A19:C19',
                    });

                    worksheet.addRow([]);

                    // IV. Tình trạng kỹ thuật
                    addRow(['IV. Tình trạng kỹ thuật xe khi giao lại cho ca sau:'], { bold: true });


                    const listItems = [
                        generateDotLine(193, '- Động cơ: '),
                        generateDotLine(187, '- Hệ thống phanh:'),
                        generateDotLine(191, '- Hệ thống lái:'),
                        generateDotLine(182, '- Gương, đèn, còi, đồng hồ:'),
                        generateDotLine(182, '- Hệ thống truyền động:'),
                        generateDotLine(190, '- Hệ thống trục:'),
                        generateDotLine(185, '- Hệ thống nâng ben:'),
                        generateDotLine(188, '- Hệ thống điện:'),
                        generateDotLine(193, '- Ca bin, sắt xi:'),
                        generateDotLine(189, '- Bánh xe và lốp:'),
                        generateDotLine(185, '- Radio, máy điều hoà:'),
                        generateDotLine(185, '- Dụng cụ đồ nghề:'),
                        generateDotLine(180, '- GPS, niêm phong, kẹp chì:')
                    ];


                    for (const item of listItems) {
                        worksheet.addRow([item]);
                    }

                    worksheet.addRow([]);

                    // Ký tên
                    addRow(['NGƯỜI GIAO CA', '', '', 'NGƯỜI NHẬN CA'], { bold: true });
                    addRow(['(Ký, ghi rõ họ tên)', '', '', '(Ký, ghi rõ họ tên)'], { bold: true });

                    worksheet.addRow([]);
                    worksheet.addRow([]);

                    addRow(['V. người nhận ca kiểm tra KT xe đầu ca, xin lệnh hoạt động'], { bold: true });
                    worksheet.addRow([generateDotLine(200, '')]);
                    worksheet.addRow([generateDotLine(200, '')]);

                    worksheet.addRow([]);

                    addRow([
                        'NGƯỜI NHẬN CA',
                        '',
                        '',
                        'NGƯỜI RA LỆNH HOẠT ĐỘNG'
                    ], { bold: true });

                    addRow(['(Ký, ghi rõ họ tên)', '', '', '', 'CA TIẾP THEO'], { bold: true });
                    addRow(['', '', '', '(Ký, ghi rõ họ tên)'], { bold: true });


                    // Canh chỉnh lề trái cho tất cả
                    worksheet.eachRow(row => {
                        row.alignment = { vertical: 'middle', horizontal: 'left', };
                    });

                    if (signature) {
                        const response = await axios.get(signature, { responseType: 'arraybuffer' });
                        const contentType = response.headers['content-type'];
                        const extension = contentType.split('/')[1];
                        const imageBuffer = Buffer.from(response.data, 'binary');

                        // Thêm ảnh vào workbook
                        const imageId = workbook.addImage({
                            buffer: imageBuffer,
                            extension
                        });

                        // Gán ảnh vào vị trí (dùng topleft + extents hoặc range)
                        const lastCol = worksheet.columnCount;
                        worksheet.addImage(imageId, {
                            tl: { col: lastCol - 2, row: 8 }, // H30
                            ext: { width: 150, height: 150 },
                        });
                    }

                    worksheet.eachRow((row) => {
                        row.eachCell((cell) => {
                            // Nếu chưa có font, tạo font mới
                            if (!cell.font) cell.font = {};
                            cell.font.size = 14; // hoặc 8, tuỳ theo bạn muốn nhỏ đến đâu
                        });
                    });
                }
            }
        }

        // Xuất file
        const buffer = await workbook.xlsx.writeBuffer();

        // Thiết lập header để tải file về
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader(
            'Content-Disposition',
            "attachment; filename*=UTF-8''*.xlsx"
        );   // Gửi buffer về client
        res.send(buffer);
    }
    catch (err) {

    }
})
router.post('/assignmentManager', verifyToken, restrictTo('admin', 'dispatcher', 'manager'), async (req, res, next) => {
    try {
        const { shift, startDate, endDate, signature } = req.body
        const shiftList = await Shift.find({ _id: { $in: shift } });
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Đảm bảo end không nhỏ hơn start
        if (end < start) return res.status(400).json({ message: "Ngày kết thúc phải sau ngày bắt đầu" });

        const workbook = new ExcelJS.Workbook();
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            for (const ca of shiftList) {
                const orders = await Order.find({
                    workingDate: d,
                    shift: ca._id,
                    createdBy: req.userId,
                    status: { $nin: ["pending", "cancel"] }
                })
                    .populate('assignedTo', 'fullName salaryCode department')
                    .populate('job', 'name')
                    .populate('location', 'name')
                    .populate('material', 'name')
                    .populate('excavator', 'code')
                    .populate('device', 'code')
                    .populate('shift')
                    .populate('createdBy', 'fullName salaryCode department')



                for (const order of orders) {
                    const sheetName = `${formatDate(d)}_${ca.name}_${order?.assignedTo?.salaryCode}`.replace(/[\\\/:*?\[\]]/g, '-').substring(0, 31);

                    const worksheet = workbook.addWorksheet(sheetName, {
                        views: [{ showGridLines: false }]
                    });

                    worksheet.pageSetup = {
                        paperSize: 9,
                        orientation: 'portrait',
                        fitToPage: true,
                        fitToWidth: 1,
                        fitToHeight: 1,
                        margins: {
                            top: 0.5, bottom: 0.5, left: 0.5, right: 0.5,
                            header: 0.3, footer: 0.3
                        }
                    };

                    worksheet.columns = [
                        { width: 25 }, // A
                        { width: 30 }, // B
                        { width: 40 }, // C
                    ];

                    const generateDotLine = (totalLength, prefix = '') => {
                        const lineLength = totalLength - prefix.length;
                        return prefix + '.'.repeat(lineLength > 0 ? lineLength : 0);
                    };
                    const addRow = (values = [], options = {}) => {
                        const row = worksheet.addRow(values);
                        if (options.merge) worksheet.mergeCells(options.merge);
                        if (options.bold) row.font = { bold: true };
                        if (options.italic) row.font = { italic: true };
                        return row;
                    };

                    // Tiêu đề dòng đầu
                    addRow([`Ca: ${ca?.name}     Ngày: ${d.getDate()}     Tháng: ${d.getMonth() + 1}     Năm: ${d.getFullYear()}`], {
                        merge: 'A1:C1',
                    });

                    addRow([`Người bàn giao: ${order?.createdBy?.fullName}       Người nhận bàn giao: ${order?.assignedTo?.fullName}`], {
                        merge: 'A2:C2',
                    });

                    worksheet.addRow([]);

                    // I. Hoạt động trong ca
                    addRow(['I. Tình hình hoạt động trong ca:'], { bold: true });
                    addRow(['- Số lượng thiết bị huy động/tổng số ............................  bao gồm:'], {
                        merge: 'A5:C5',
                    });
                    worksheet.addRow([generateDotLine(200, '')]);
                    worksheet.addRow([generateDotLine(200, '')]);

                    addRow(['- Các thiết bị kiểm tu, bảo dưỡng bao gồm:'], { merge: 'A8:C8' });
                    worksheet.addRow([generateDotLine(200, '')]);
                    worksheet.addRow([generateDotLine(200, '')]);

                    // II. Những công việc đã thực hiện
                    addRow(['II. Những công việc đã thực hiện trong ca (KT, bảo dưỡng, sửa chữa):'], { bold: true, merge: 'A12:C12' });
                    worksheet.addRow([generateDotLine(200, '')]);
                    worksheet.addRow([generateDotLine(200, '')]);

                    worksheet.addRow([generateDotLine(194, '+ Kiểm tu: ')]);
                    worksheet.addRow([generateDotLine(187, '+ Bảo dưỡng cấp 1: ')]);
                    worksheet.addRow([generateDotLine(187, '+ Bảo dưỡng cấp 2: ')]);
                    worksheet.addRow([generateDotLine(178, '+ Bảo dưỡng cấp 3(hoặc 1000 giờ): ')]);
                    worksheet.addRow([generateDotLine(183, '+ Bảo dưỡng cấp 2000 giờ: ')]);
                    worksheet.addRow([generateDotLine(185, '- Các thiết bị dừng để TĐT: ')]);
                    worksheet.addRow([generateDotLine(180, '- Các thiết bị sửa chữa đột suất lớn: ')]);
                    worksheet.addRow([generateDotLine(200, '')]);
                    worksheet.addRow([generateDotLine(200, '')]);
                    worksheet.addRow([generateDotLine(180, '- Các thiết bị dừng do các lý do khác: ')]);
                    worksheet.addRow([generateDotLine(200, '')]);
                    worksheet.addRow([generateDotLine(175, '- Nội dung công việc đã thực hiện trong ca: ')]);
                    worksheet.addRow([generateDotLine(200, '')]);
                    worksheet.addRow([generateDotLine(200, '')]);
                    worksheet.addRow([generateDotLine(200, '')]);
                    worksheet.addRow([generateDotLine(200, '')]);
                    addRow(['II- Nội dung công việc giao lại ca sau:'], { bold: true, merge: 'A31:C31' });
                    worksheet.addRow([generateDotLine(200, '')]);
                    worksheet.addRow([generateDotLine(200, '')]);
                    worksheet.addRow([generateDotLine(200, '')]);
                    worksheet.addRow([generateDotLine(200, '')]);
                    addRow(['III- Dự báo nguy cơ mất an toàn:'], { bold: true, merge: 'A36:C36' });
                    worksheet.addRow([generateDotLine(200, '')]);
                    worksheet.addRow([generateDotLine(200, '')]);

                    for (let i = 0; i < 5; i++) {
                        worksheet.addRow([]);
                    }

                    // Ký tên
                    addRow(['NGƯỜI GIAO CA', '', '', 'NGƯỜI NHẬN'], { bold: true });
                    addRow(['(Ký, ghi rõ họ tên)', '', '', '(Ký, ghi rõ họ tên)'], { bold: true });


                    // Canh chỉnh lề trái cho tất cả
                    worksheet.eachRow(row => {
                        row.alignment = { vertical: 'middle', horizontal: 'left', };
                    });

                    if (signature) {
                        const response = await axios.get(signature, { responseType: 'arraybuffer' });
                        const contentType = response.headers['content-type'];
                        const extension = contentType.split('/')[1];
                        const imageBuffer = Buffer.from(response.data, 'binary');

                        // Thêm ảnh vào workbook
                        const imageId = workbook.addImage({
                            buffer: imageBuffer,
                            extension
                        });

                        // Gán ảnh vào vị trí (dùng topleft + extents hoặc range)
                        const lastCol = worksheet.columnCount;
                        worksheet.addImage(imageId, {
                            tl: { col: lastCol - 2, row: 8 }, // H30
                            ext: { width: 150, height: 150 },
                        });
                    }

                    worksheet.eachRow((row) => {
                        row.eachCell((cell) => {
                            // Nếu chưa có font, tạo font mới
                            if (!cell.font) cell.font = {};
                            cell.font.size = 14; // hoặc 8, tuỳ theo bạn muốn nhỏ đến đâu
                        });
                    });
                }
            }
        }

        // Xuất file
        const buffer = await workbook.xlsx.writeBuffer();

        // Thiết lập header để tải file về
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader(
            'Content-Disposition',
            "attachment; filename*=UTF-8''*.xlsx"
        );   // Gửi buffer về client
        res.send(buffer);
    }
    catch (err) {

    }
})
function setCell(ws, range, value) {
    ws.mergeCells(range);
    const cell = ws.getCell(range.split(':')[0]);
    cell.value = value;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.font = { bold: true, size: 11 };
    cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
    };
}
function formatDate(date) {
    return date.toLocaleDateString('vi-VN'); // dạng 10/07/2025
}
const addTableBorders = (
    ws,
    startRow,
    endRow,
    startCol,
    endCol
) => {
    const thin = { style: 'medium' };
    const medium = { style: 'medium' };

    for (let r = startRow; r <= endRow; r++) {
        const row = ws.getRow(r);
        for (let c = startCol; c <= endCol; c++) {
            const cell = row.getCell(c);

            cell.border = {
                top: medium,
                bottom: medium,
                left: medium,
                right: medium,
            };
        }
    }
};
module.exports = router; 