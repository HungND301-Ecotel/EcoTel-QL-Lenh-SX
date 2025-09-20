const express = require('express');
const router = express.Router();
const axios = require('axios')
const ExcelJS = require('exceljs');
const Order = require('../models/Order');
const Shift = require('../models/Shift');
const Report = require('../models/Report');
const Department = require('../models/Department');



const { verifyToken, restrictTo } = require('../middleware/auth.middleware');
const mongoose = require('mongoose');
const { groupReportsByExcavator, groupReportsForProduct, groupTripsVehicle } = require('../utils/reportGrouping');
const { ROLE, STATUS_ORDER, JOB_TYPE } = require('../config/config');
// lệnh sx
router.post('/order/bulk', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER), async (req, res, next) => {
    try {
        const { ids } = req.body; // mảng entity id

        if (!Array.isArray(ids) || ids.length === 0) {
            req.logger.error("❌ Chọn bản ghi tải xuống");
            return res.status(400).send({ status: 'error', message: 'Chọn bản ghi cần tải xuống' });
        }

        const orders = await Order.find({ _id: { $in: ids } })
            .populate({
                path: "assignedTo",
                select: "username fullName department phone salaryCode position",
                populate: [
                    { path: "department", select: 'code' },
                    { path: "position", select: 'name' }
                ]
            })
            .populate('job', 'name type')
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
            .populate('repairVehicles.device')
            .populate('safetyMeasure')
            .populate({
                path: "assistants",
                select: "salaryCode fullName position",
                populate: {
                    path: "position",
                    select: "name",
                }
            })
            .populate({
                path: "createdBy",
                select: "fullName phone salaryCode position signature department",
                populate: [
                    {
                        path: "position",
                        select: "name",
                    },
                    {
                        path: "department",
                        select: "code",
                    }
                ]
            })
        const workbook = new ExcelJS.Workbook();
        for (const order of orders) {
            const jobType = order.job?.type
            if (jobType === JOB_TYPE.VAN_HANH_XE) {
                await buildVehicle(order, workbook);
            } else if (jobType === JOB_TYPE.VAN_HANH_XUC) {
                await buildExcavator(order, workbook);
            }
            else if (jobType === JOB_TYPE.SUA_CHUA_BAO_DUONG) {
                await buildMaintence(order, workbook);
            }
            else if (jobType === JOB_TYPE.VAN_HANH_KHOAN) {
                await buildDrill(order, workbook);
            } else if (jobType === JOB_TYPE.VAN_HANH_GAT) {
                await buildDozer(order, workbook);
            }
            else if (jobType === JOB_TYPE.DIEU_HANH_SAN_XUAT) {
                await buildDispatcher(order, workbook);
            } else {
                await buildOther(order, workbook);
            }
        }
        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', "attachment; filename*=UTF-8''bulk.xlsx");
        res.send(buffer);
        req.logger.info(`✅ Export excel thành công`);
    } catch (err) {
        req.logger.error("❌ Lỗi khi export", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
})

async function buildVehicle(order, workbook) {
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
    header.font = { bold: true, size: 16 };
    header.alignment = { horizontal: 'center', vertical: 'middle' };




    worksheet.getCell('B4').value = 'Đơn vị';
    worksheet.getCell('B4').font = { bold: true };
    worksheet.getCell('C4').value = order.assignedTo?.department?.code || '';

    worksheet.getCell('F4').value = 'Ngày';
    worksheet.getCell('F4').font = { bold: true };
    // Lấy ngày từ order.workingDate và định dạng
    const workingDate = order.workingDate ? new Date(order.workingDate) : null;
    const ngay = workingDate ? workingDate.toLocaleDateString('vi-VN') : '';
    worksheet.getCell('G4').value = ngay;

    worksheet.getCell('H4').value = order.shiftHour || '';


    worksheet.getCell('I4').value = 'Ca';
    worksheet.getCell('I4').font = { bold: true };

    worksheet.getCell('J4').value = order.shift?.name || '';
    worksheet.getCell('J4').alignment = { horizontal: 'left' }

    // 3. Người ra lệnh
    // Dòng 5
    worksheet.getCell('B5').value = 'Người ra lệnh';
    worksheet.getCell('B5').font = { bold: true };
    worksheet.getCell('C5').value = order.createdBy?.fullName || '';

    worksheet.getCell('F5').value = 'Số thẻ';
    worksheet.getCell('F5').font = { bold: true };
    worksheet.getCell('G5').value = order.createdBy?.salaryCode || '';


    worksheet.getCell('I5').value = 'Chức vụ';
    worksheet.getCell('I5').font = { bold: true };
    worksheet.getCell('J5').value = order.createdBy?.position?.name || '';

    // 4. Người nhận lệnh
    // Dòng 6
    worksheet.getCell('B6').value = 'Người nhận lệnh';
    worksheet.getCell('B6').font = { bold: true };
    worksheet.getCell('C6').value = order.assignedTo?.fullName || '';

    worksheet.getCell('F6').value = 'Số thẻ';
    worksheet.getCell('F6').font = { bold: true };
    worksheet.getCell('G6').value = order.assignedTo?.salaryCode || '';

    worksheet.getCell('I6').value = 'Chức vụ';
    worksheet.getCell('I6').font = { bold: true };
    worksheet.getCell('J6').value = order.assignedTo?.position?.name || '';

    // Dòng 6 lx bo tuc
    worksheet.getCell('B7').value = 'Lái xe bổ túc';
    worksheet.getCell('B7').font = { bold: true };

    let rowIndex = 7;
    (order.assistants || []).forEach((driver, idx) => {
        let row = rowIndex + idx;

        worksheet.getCell(`C${row}`).value = driver.fullName || '';
        worksheet.getCell(`F${row}`).value = 'Số thẻ';
        worksheet.getCell(`F${row}`).font = { bold: true };
        worksheet.getCell(`G${row}`).value = driver.salaryCode || '';

        worksheet.getCell(`I${row}`).value = 'Chức vụ';
        worksheet.getCell(`I${row}`).font = { bold: true };
        worksheet.getCell(`J${row}`).value = driver.position?.name || '';
    });

    let nextRow = rowIndex + (order.assistants?.length || 1);
    // Dòng 7
    worksheet.getCell(`B${nextRow}`).value = 'Nội dung lệnh';
    worksheet.getCell(`B${nextRow}`).font = { bold: true };
    // Gộp ô cho nội dung để hiển thị đầy đủ
    worksheet.mergeCells(`C${nextRow}:L${nextRow + 1}`)
    worksheet.getCell(`C${nextRow}`).value = order.workContent || '';
    worksheet.getCell(`C${nextRow}`).alignment = { horizontal: 'left', vertical: 'middle' };


    worksheet.getCell(`B${nextRow + 2}`).value = 'Biện pháp an toàn';
    worksheet.getCell(`B${nextRow + 2}`).font = { bold: true };
    // Gộp ô cho nội dung bàn giao ca
    worksheet.mergeCells(`C${nextRow + 2}:L${nextRow + 2}`)
    worksheet.getCell(`C${nextRow + 2}`).value = (order?.safetyMeasure || '') + " " + (order?.safetyMeasureSpecific || '');


    worksheet.getCell(`B${nextRow + 3}`).value = 'Nội dung bàn giao ca';
    worksheet.getCell(`B${nextRow + 3}`).font = { bold: true };
    // Gộp ô cho nội dung bàn giao ca
    worksheet.mergeCells(`C${nextRow + 3}:L${nextRow + 3}`)
    worksheet.getCell(`C${nextRow + 3}`).value = order.shiftReport?.handoverNotes || '';


    worksheet.getCell(`B${nextRow + 4}`).value = 'Giờ nhận lệnh';
    worksheet.getCell(`B${nextRow + 4}`).font = { bold: true };
    worksheet.getCell(`C${nextRow + 4}`).value = order.startTime
        ? new Date(order.startTime).toLocaleTimeString('vi-VN', { hour12: false })
        : "";

    worksheet.getCell(`D${nextRow + 4}`).value = 'Giờ kết thúc';
    worksheet.getCell(`D${nextRow + 4}`).font = { bold: true };
    worksheet.getCell(`E${nextRow + 4}`).value = order.endTime
        ? new Date(order.endTime).toLocaleTimeString('vi-VN', { hour12: false })
        : "";

    worksheet.mergeCells(`F${nextRow + 4}:G${nextRow + 4}`);
    worksheet.getCell(`F${nextRow + 4}`).value = 'Giờ hoạt động trên đồng hồ';
    worksheet.getCell(`F${nextRow + 4}`).font = { bold: true };
    worksheet.getCell(`H${nextRow + 4}`).value = (order?.shiftReport?.vehicleSummaries || []).reduce((sum, report) => { return sum + report?.travelHours }, 0) || '';
    worksheet.getCell(`H${nextRow + 4}`).alignment = { horizontal: 'left' }

    worksheet.mergeCells(`I${nextRow + 4}:J${nextRow + 4}`);
    worksheet.getCell(`I${nextRow + 4}`).value = 'Km hoạt động trên đồng hồ';
    worksheet.getCell(`I${nextRow + 4}`).font = { bold: true };
    worksheet.getCell(`K${nextRow + 4}`).value = (order?.shiftReport?.vehicleSummaries || []).reduce((sum, report) => { return sum + report?.distanceKm }, 0) || '';
    worksheet.getCell(`K${nextRow + 4}`).alignment = { horizontal: 'left' }

    let rowHeader1 = nextRow + 6
    worksheet.mergeCells(`A${rowHeader1}:L${rowHeader1}`);
    const product = worksheet.getCell(`A${rowHeader1}`);
    product.value = `I. SẢN PHẨM`;
    product.font = { bold: true, size: 14 };
    product.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(rowHeader1).height = 30;

    worksheet.getCell(`A${rowHeader1 + 1}`).value = 'STT';
    worksheet.getCell(`B${rowHeader1 + 1}`).value = 'Máy xúc';
    worksheet.getCell(`C${rowHeader1 + 1}`).value = 'Điểm đổ tải';
    worksheet.getCell(`D${rowHeader1 + 1}`).value = 'Vật liệu';
    worksheet.getCell(`E${rowHeader1 + 1}`).value = 'Số chuyến thực hiện';
    worksheet.getCell(`F${rowHeader1 + 1}`).value = 'Thời gian';
    worksheet.getCell(`G${rowHeader1 + 1}`).value = 'Khối lượng \n tạm tính \n(m3)';
    worksheet.getCell(`H${rowHeader1 + 1}`).value = 'Trọng lượng \n tạm tính \n (tấn)';
    worksheet.getCell(`I${rowHeader1 + 1}`).value = 'Sản lượng \n tạm tính \n(tkm)';
    worksheet.getCell(`J${rowHeader1 + 1}`).value = 'Nhiên liệu \n định mức';
    worksheet.getCell(`K${rowHeader1 + 1}`).value = 'Điểm lương \n tạm tính';
    worksheet.getCell(`L${rowHeader1 + 1}`).value = 'Ghi chú';

    const headerRow = worksheet.getRow(rowHeader1 + 1);
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

    const grouped = groupTripsVehicle(reports)

    let rowIndexTrip = rowHeader1 + 2;
    grouped.forEach((g, i) => {
        const startRowTrip = rowIndexTrip;
        g.materials.forEach(m => {
            worksheet.getCell(`A${rowIndexTrip}`).value = i + 1;
            worksheet.getCell(`A${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            worksheet.getCell(`B${rowIndexTrip}`).value = g.excavator?.code || '';
            worksheet.getCell(`B${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            worksheet.getCell(`C${rowIndexTrip}`).value = g.location?.name || '';
            worksheet.getCell(`C${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            worksheet.getCell(`D${rowIndexTrip}`).value = m.material?.name || '';
            worksheet.getCell(`D${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            worksheet.getCell(`E${rowIndexTrip}`).value = m?.quantity || '';
            worksheet.getCell(`E${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            worksheet.getCell(`F${rowIndexTrip}`).value = (m.times || []).map(item => item.toLocaleTimeString('vi-VN')).join('\n');
            worksheet.getCell(`F${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            worksheet.getCell(`G${rowIndexTrip}`).value = "";
            worksheet.getCell(`G${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            worksheet.getCell(`H${rowIndexTrip}`).value = '';
            worksheet.getCell(`I${rowIndexTrip}`).value = "";
            worksheet.getCell(`J${rowIndexTrip}`).value = "";
            worksheet.getCell(`K${rowIndexTrip}`).value = "";
            worksheet.getCell(`L${rowIndexTrip}`).value = "";
            rowIndexTrip++;
        })
        if (rowIndexTrip - 1 > startRowTrip) {
            ['A', 'B', 'C'].forEach(col => {
                worksheet.mergeCells(`${col}${startRowTrip}:${col}${rowIndexTrip - 1}`);
                worksheet.getCell(`${col}${startRowTrip}`).alignment = { vertical: 'middle', horizontal: 'center' };
            });
        }
    })
    const totalRow = rowIndexTrip + 1;

    worksheet.mergeCells(`A${totalRow}:B${totalRow}`);
    worksheet.getCell(`A${totalRow}`).value = 'Tổng cộng';
    worksheet.getCell(`A${totalRow}`).font = { bold: true };
    worksheet.getCell(`A${totalRow}`).alignment = { horizontal: 'right' }

    worksheet.mergeCells(`C${totalRow}:E${totalRow}`);
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
    worksheet.getRow(totalRow + 2).height = 30;

    worksheet.mergeCells(`A${totalRow + 3}:B${totalRow + 3}`);
    worksheet.getCell(`A${totalRow + 3}`).value = 'Thiết bị vận hành';
    worksheet.getCell(`A${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`A${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`C${totalRow + 3}`).value = 'Tồn dầu';
    worksheet.getCell(`C${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`C${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`D${totalRow + 3}`).value = 'Lĩnh trong ca';
    worksheet.getCell(`D${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`D${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`E${totalRow + 3}`).value = 'Tồn cuối ca';
    worksheet.getCell(`E${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`E${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`F${totalRow + 3}`).value = 'Tiêu thụ';
    worksheet.getCell(`F${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`F${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`G${totalRow + 3}`).value = 'Định mức';
    worksheet.getCell(`G${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`G${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`H${totalRow + 3}`).value = 'Tiết kiệm';
    worksheet.getCell(`H${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`H${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`I${totalRow + 3}`).value = 'Sử dụng vượt';
    worksheet.getCell(`I${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`I${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells(`J${totalRow + 3}:L${totalRow + 3}`)
    worksheet.getCell(`J${totalRow + 3}`).value = 'Ghi chú';
    worksheet.getCell(`J${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`J${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle' };


    const fuelHeaderRow = totalRow + 2;
    const fuelRows = order.shiftReport?.vehicleSummaries?.length || 0;
    const fuelEndRow = fuelHeaderRow + fuelRows + 2;

    addTableBorders(worksheet, rowHeader1, fuelEndRow, 1, 12);

    for (let index = 0; index < (order.shiftReport?.vehicleSummaries?.length + 1 || 1); index++) {
        const rep = order.shiftReport?.vehicleSummaries[index];
        worksheet.mergeCells(`A${totalRow + 4 + index}:B${totalRow + 4 + index}`);
        worksheet.getCell(`A${totalRow + 4 + index}`).value = rep?.vehicle?.code || '';
        worksheet.getCell(`C${totalRow + 4 + index}`).value = rep?.fuelRemain || '';
        worksheet.getCell(`D${totalRow + 4 + index}`).value = rep?.fuelReceived || '';
        worksheet.getCell(`E${totalRow + 4 + index}`).value = rep?.fuelRemainEnd || '';
        worksheet.getCell(`F${totalRow + 4 + index}`).value =
            (rep?.fuelRemain ?? 0) + (rep?.fuelReceived ?? 0) - (rep?.fuelRemainEnd ?? 0);

        worksheet.getCell(`G${totalRow + 4 + index}`).value = '';

        worksheet.getCell(`H${totalRow + 4 + index}`).value = '';
        worksheet.getCell(`I${totalRow + 4 + index}`).value = '';

        worksheet.mergeCells(`J${totalRow + 4 + index}:L${totalRow + 4 + index}`);
        worksheet.getCell(`J${totalRow + 4 + index}`).value = '';
    }

    const deviceRow = order.device?.length || []
    worksheet.mergeCells(`B${totalRow + 6 + deviceRow}:D${totalRow + 6 + deviceRow}`)
    worksheet.getCell(`B${totalRow + 6 + deviceRow}`).value = 'NGƯỜI NHẬN LỆNH';
    worksheet.getCell(`B${totalRow + 6 + deviceRow}`).font = { bold: true };
    worksheet.getCell(`B${totalRow + 6 + deviceRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`C${totalRow + 8 + deviceRow}`).value = '✔';
    worksheet.getCell(`C${totalRow + 8 + deviceRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`C${totalRow + 8 + deviceRow}`).font = { bold: true, size: 12 };
    worksheet.mergeCells(`B${totalRow + 10 + deviceRow}:D${totalRow + 10 + deviceRow}`)
    worksheet.getCell(`B${totalRow + 10 + deviceRow}`).font = { bold: true };
    worksheet.getCell(`B${totalRow + 10 + deviceRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`B${totalRow + 10 + deviceRow}`).value = order.assignedTo?.fullName || "";

    worksheet.mergeCells(`I${totalRow + 6 + deviceRow}:L${totalRow + 6 + deviceRow}`)
    worksheet.getCell(`I${totalRow + 6 + deviceRow}`).value = 'NGƯỜI RA LỆNH';
    worksheet.getCell(`I${totalRow + 6 + deviceRow}`).font = { bold: true };
    worksheet.getCell(`I${totalRow + 6 + deviceRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
    if (order.createdBy?.signature) {
        const response = await axios.get(order.createdBy.signature, { responseType: 'arraybuffer' });
        const extension = response.headers['content-type'].split('/')[1];
        const imageBuffer = Buffer.from(response.data, 'binary');

        const imageId = workbook.addImage({
            buffer: imageBuffer,
            extension
        });

        worksheet.mergeCells(`J${totalRow + 7 + deviceRow}:K${totalRow + 9 + deviceRow}`);

        // gán ảnh trực tiếp vào range
        worksheet.addImage(imageId, `J${totalRow + 7 + deviceRow}:K${totalRow + 9 + deviceRow}`);
    }

    worksheet.mergeCells(`I${totalRow + 10 + deviceRow}:L${totalRow + 10 + deviceRow}`)
    worksheet.getCell(`I${totalRow + 10 + deviceRow}`).font = { bold: true };
    worksheet.getCell(`I${totalRow + 10 + deviceRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`I${totalRow + 10 + deviceRow}`).value = order.createdBy?.fullName || "";


    worksheet.pageSetup = {
        paperSize: 9,                // A4
        orientation: 'landscape',    // ngang
        fitToPage: true,
        fitToWidth: 1,               // vừa 1 trang theo chiều ngang
        fitToHeight: 0,              // không ép theo chiều dọc
        margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } // inch
    };

    // 2) Set width cơ sở (Excel sẽ scale để vừa 1 trang)
    worksheet.columns = [
        { key: 'A', width: 6 },   // STT
        { key: 'B', width: 18 },  // Nhận tải
        { key: 'C', width: 18 },  // Đổ tải
        { key: 'D', width: 14 },  // Loại hàng
        { key: 'E', width: 14 },  // Cung độ tạm tính
        { key: 'F', width: 14 },  // Chiều cao nâng tải
        { key: 'G', width: 14 },  // Số chuyến
        { key: 'H', width: 14 },  // Khối lượng
        { key: 'I', width: 14 },  // Trọng lượng
        { key: 'J', width: 13 },  // Sản lượng
        { key: 'K', width: 12 },  // Nhiên liệu
        { key: 'L', width: 12 },  // Điểm lương
    ];

    worksheet.eachRow((row) => {
        row.eachCell((cell) => {
            if (!cell.font) cell.font = {};
            cell.font = {
                ...cell.font,            // giữ lại các thuộc tính khác (bold, italic,…)
                name: 'Times New Roman', // đổi font chữ
                size: 12                 // kích thước chữ
            };
        });
    });

};
async function buildExcavator(order, workbook) {
    const reports = await Report.find({ orderId: order._id })
        .populate("device", "code")
        .populate("material", "name")
        .populate("excavator", "code")
        .populate("fromLocation", "name")
        .populate("toLocation", "name")
    const sheetName = `${order.assignedTo?.username}_${formatDate(order.workingDate)}_${order.shift?.name}_${order._id}`.replace(/[\\\/:*?\[\]]/g, '-').substring(0, 31);

    const worksheet = workbook.addWorksheet(sheetName);

    // Tiêu đề bảng
    worksheet.mergeCells('A1:K2');
    const header = worksheet.getCell('A1');
    header.value = `LỆNH SẢN XUẤT`;
    header.font = { bold: true, size: 16 };
    header.alignment = { horizontal: 'center', vertical: 'middle' };




    worksheet.getCell('B4').value = 'Đơn vị';
    worksheet.getCell('B4').font = { bold: true };
    worksheet.getCell('C4').value = order.assignedTo?.department?.code || '';

    worksheet.getCell('F4').value = 'Ngày';
    worksheet.getCell('F4').font = { bold: true };
    // Lấy ngày từ order.workingDate và định dạng
    const workingDate = order.workingDate ? new Date(order.workingDate) : null;
    const ngay = workingDate ? workingDate.toLocaleDateString('vi-VN') : '';
    worksheet.getCell('G4').value = ngay;

    worksheet.getCell('H4').value = order.shiftHour || '';


    worksheet.getCell('I4').value = 'Ca';
    worksheet.getCell('I4').font = { bold: true };

    worksheet.getCell('J4').value = order.shift?.name || '';
    worksheet.getCell('J4').alignment = { horizontal: 'left' }

    // 3. Người ra lệnh
    // Dòng 5
    worksheet.getCell('B5').value = 'Người ra lệnh';
    worksheet.getCell('B5').font = { bold: true };
    worksheet.getCell('C5').value = order.createdBy?.fullName || '';

    worksheet.getCell('F5').value = 'Số thẻ';
    worksheet.getCell('F5').font = { bold: true };
    worksheet.getCell('G5').value = order.createdBy?.salaryCode || '';


    worksheet.getCell('I5').value = 'Chức vụ';
    worksheet.getCell('I5').font = { bold: true };
    worksheet.getCell('J5').value = order.createdBy?.position?.name || '';

    // 4. Người nhận lệnh
    // Dòng 6
    worksheet.getCell('B6').value = 'Người nhận lệnh';
    worksheet.getCell('B6').font = { bold: true };
    worksheet.getCell('C6').value = order.assignedTo?.fullName || '';

    worksheet.getCell('F6').value = 'Số thẻ';
    worksheet.getCell('F6').font = { bold: true };
    worksheet.getCell('G6').value = order.assignedTo?.salaryCode || '';

    worksheet.getCell('I6').value = 'Chức vụ';
    worksheet.getCell('I6').font = { bold: true };
    worksheet.getCell('J6').value = order.assignedTo?.position?.name || '';

    // Dòng 6 lx bo tuc
    worksheet.getCell('B7').value = 'Phụ máy';
    worksheet.getCell('B7').font = { bold: true };

    let rowIndex = 7;
    (order.assistants || []).forEach((driver, idx) => {
        let row = rowIndex + idx;

        worksheet.getCell(`C${row}`).value = driver.fullName || '';
        worksheet.getCell(`F${row}`).value = 'Số thẻ';
        worksheet.getCell(`F${row}`).font = { bold: true };
        worksheet.getCell(`G${row}`).value = driver.salaryCode || '';

        worksheet.getCell(`I${row}`).value = 'Chức vụ';
        worksheet.getCell(`I${row}`).font = { bold: true };
        worksheet.getCell(`J${row}`).value = driver.position?.name || '';
    });

    let nextRow = rowIndex + (order.assistants?.length || 1);
    // Dòng 7
    worksheet.getCell(`B${nextRow}`).value = 'Nội dung lệnh';
    worksheet.getCell(`B${nextRow}`).font = { bold: true };
    // Gộp ô cho nội dung để hiển thị đầy đủ
    worksheet.mergeCells(`C${nextRow}:K${nextRow + 1}`)
    worksheet.getCell(`C${nextRow}`).value = order.workContent || '';
    worksheet.getCell(`C${nextRow}`).alignment = { horizontal: 'left', vertical: 'middle' };


    worksheet.getCell(`B${nextRow + 2}`).value = 'Biện pháp an toàn';
    worksheet.getCell(`B${nextRow + 2}`).font = { bold: true };
    // Gộp ô cho nội dung bàn giao ca
    worksheet.mergeCells(`C${nextRow + 2}:K${nextRow + 2}`)
    worksheet.getCell(`C${nextRow + 2}`).value = (order?.safetyMeasure || '') + " " + (order?.safetyMeasureSpecific || '');


    worksheet.getCell(`B${nextRow + 3}`).value = 'Nội dung bàn giao ca';
    worksheet.getCell(`B${nextRow + 3}`).font = { bold: true };
    // Gộp ô cho nội dung bàn giao ca
    worksheet.mergeCells(`C${nextRow + 3}:K${nextRow + 3}`)
    worksheet.getCell(`C${nextRow + 3}`).value = order.shiftReport?.handoverNotes || '';


    worksheet.getCell(`B${nextRow + 4}`).value = 'Giờ nhận lệnh';
    worksheet.getCell(`B${nextRow + 4}`).font = { bold: true };
    worksheet.getCell(`C${nextRow + 4}`).value = order.startTime
        ? new Date(order.startTime).toLocaleTimeString('vi-VN', { hour12: false })
        : "";

    worksheet.getCell(`D${nextRow + 4}`).value = 'Giờ kết thúc';
    worksheet.getCell(`D${nextRow + 4}`).font = { bold: true };
    worksheet.getCell(`E${nextRow + 4}`).value = order.endTime
        ? new Date(order.endTime).toLocaleTimeString('vi-VN', { hour12: false })
        : "";

    worksheet.mergeCells(`F${nextRow + 4}:G${nextRow + 4}`);
    worksheet.getCell(`F${nextRow + 4}`).value = 'Giờ hoạt động trên đồng hồ';
    worksheet.getCell(`F${nextRow + 4}`).font = { bold: true };
    worksheet.getCell(`H${nextRow + 4}`).value = (order?.shiftReport?.vehicleSummaries || []).reduce((sum, report) => { return sum + report?.travelHours }, 0) || '';
    worksheet.getCell(`H${nextRow + 4}`).alignment = { horizontal: 'left' }

    worksheet.mergeCells(`I${nextRow + 4}:J${nextRow + 4}`);
    worksheet.getCell(`I${nextRow + 4}`).value = 'Km hoạt động trên đồng hồ';
    worksheet.getCell(`I${nextRow + 4}`).font = { bold: true };
    worksheet.getCell(`K${nextRow + 4}`).value = (order?.shiftReport?.vehicleSummaries || []).reduce((sum, report) => { return sum + report?.distanceKm }, 0) || '';
    worksheet.getCell(`K${nextRow + 4}`).alignment = { horizontal: 'left' }

    let rowHeader1 = nextRow + 6
    worksheet.mergeCells(`A${rowHeader1}:K${rowHeader1}`);
    const product = worksheet.getCell(`A${rowHeader1}`);
    product.value = `I. SẢN PHẨM`;
    product.font = { bold: true, size: 14 };
    product.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(rowHeader1).height = 30;

    worksheet.getCell(`A${rowHeader1 + 1}`).value = 'STT';
    worksheet.getCell(`B${rowHeader1 + 1}`).value = 'Xe nhận tải';
    worksheet.getCell(`C${rowHeader1 + 1}`).value = 'Vật liệu';
    worksheet.getCell(`D${rowHeader1 + 1}`).value = 'Số chuyến thực hiện';
    worksheet.mergeCells(`E${rowHeader1 + 1}:F${rowHeader1 + 1}`)
    worksheet.getCell(`E${rowHeader1 + 1}`).value = 'Thời điểm xúc tải';
    worksheet.getCell(`G${rowHeader1 + 1}`).value = 'Khối lượng \n tạm tính \n(m3)';
    worksheet.getCell(`H${rowHeader1 + 1}`).value = 'Trọng lượng \n tạm tính \n (tấn)';
    worksheet.getCell(`I${rowHeader1 + 1}`).value = 'Nhiên liệu \n định mức';
    worksheet.getCell(`J${rowHeader1 + 1}`).value = 'Điểm lương \n tạm tính';
    worksheet.getCell(`K${rowHeader1 + 1}`).value = 'Ghi chú';

    const headerRow = worksheet.getRow(rowHeader1 + 1);
    for (let col = 1; col <= 11; col++) {
        const cell = headerRow.getCell(col);
        cell.font = { bold: true };
        cell.alignment = {
            ...cell.alignment,
            wrapText: true,
            vertical: 'middle',
            horizontal: 'center',
        };
    }

    let rowIndexTrip = rowHeader1 + 2;
    const data = reports.length > 0 ? reports : [{}];
    data.forEach((report, i) => {
        worksheet.getCell(`A${rowIndexTrip}`).value = i + 1;
        worksheet.getCell(`A${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.getCell(`B${rowIndexTrip}`).value = report.device?.code || '';
        worksheet.getCell(`B${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.getCell(`C${rowIndexTrip}`).value = report.material?.name || '';
        worksheet.getCell(`C${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.getCell(`D${rowIndexTrip}`).value = report.quantity || '';
        worksheet.getCell(`D${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.mergeCells(`E${rowIndexTrip}:F${rowIndexTrip}`)
        worksheet.getCell(`E${rowIndexTrip}`).value = (report.quantityUpdateTimes || []).map(item => item.toLocaleTimeString('vi-VN')).join('\n') || '';
        worksheet.getCell(`E${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.getCell(`G${rowIndexTrip}`).value = "";
        worksheet.getCell(`G${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.getCell(`H${rowIndexTrip}`).value = '';
        worksheet.getCell(`I${rowIndexTrip}`).value = "";
        worksheet.getCell(`J${rowIndexTrip}`).value = "";
        worksheet.getCell(`K${rowIndexTrip}`).value = "";
        rowIndexTrip++
    })
    const totalRow = rowIndexTrip;

    worksheet.mergeCells(`A${totalRow}:B${totalRow}`);
    worksheet.getCell(`A${totalRow}`).value = 'Tổng cộng';
    worksheet.getCell(`A${totalRow}`).font = { bold: true };
    worksheet.getCell(`A${totalRow}`).alignment = { horizontal: 'right' }

    worksheet.mergeCells(`C${totalRow}:D${totalRow}`);
    worksheet.getCell(`C${totalRow}`).value = reports.reduce((sum, report) => { return sum + report.quantity }, 0) || '';
    worksheet.getCell(`C${totalRow}`).font = { bold: true };
    worksheet.mergeCells(`E${totalRow}:F${totalRow}`);
    worksheet.getCell(`G${totalRow}`).value = '';
    worksheet.getCell(`H${totalRow}`).value = '';
    worksheet.getCell(`I${totalRow}`).value = '';
    worksheet.getCell(`J${totalRow}`).value = '';
    worksheet.getCell(`K${totalRow}`).value = '';

    worksheet.mergeCells(`A${totalRow + 1}:K${totalRow + 1}`);
    worksheet.getCell(`A${totalRow + 1}`).value = 'Mức bồi dưỡng (x1000đ):';

    worksheet.mergeCells(`A${totalRow + 2}:K${totalRow + 2}`);
    const header3 = worksheet.getCell(`A${totalRow + 2}`);
    header3.value = `II.NHIÊN LIỆU`;
    header3.font = { bold: true, size: 14 };
    header3.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(totalRow + 2).height = 30;

    worksheet.mergeCells(`A${totalRow + 3}:B${totalRow + 3}`);
    worksheet.getCell(`A${totalRow + 3}`).value = 'Máy xúc';
    worksheet.getCell(`A${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`A${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`C${totalRow + 3}`).value = 'Tồn dầu';
    worksheet.getCell(`C${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`C${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`D${totalRow + 3}`).value = 'Lĩnh trong ca';
    worksheet.getCell(`D${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`D${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`E${totalRow + 3}`).value = 'Tồn cuối ca';
    worksheet.getCell(`E${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`E${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`F${totalRow + 3}`).value = 'Tiêu thụ';
    worksheet.getCell(`F${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`F${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`G${totalRow + 3}`).value = 'Định mức';
    worksheet.getCell(`G${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`G${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`H${totalRow + 3}`).value = 'Tiết kiệm';
    worksheet.getCell(`H${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`H${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`I${totalRow + 3}`).value = 'Sử dụng vượt';
    worksheet.getCell(`I${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`I${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells(`J${totalRow + 3}:K${totalRow + 3}`)
    worksheet.getCell(`J${totalRow + 3}`).value = 'Ghi chú';
    worksheet.getCell(`J${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`J${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle' };


    const fuelHeaderRow = totalRow + 2;
    const fuelRows = order.shiftReport?.vehicleSummaries?.length || 0;
    const fuelEndRow = fuelHeaderRow + fuelRows + 2;

    addTableBorders(worksheet, rowHeader1, fuelEndRow, 1, 11);

    for (let index = 0; index < (order.shiftReport?.vehicleSummaries?.length + 1 || 1); index++) {
        const rep = order.shiftReport?.vehicleSummaries[index];
        worksheet.mergeCells(`A${totalRow + 4 + index}:B${totalRow + 4 + index}`);
        worksheet.getCell(`A${totalRow + 4 + index}`).value = rep?.vehicle?.code || '';
        worksheet.getCell(`C${totalRow + 4 + index}`).value = rep?.fuelRemain || '';
        worksheet.getCell(`D${totalRow + 4 + index}`).value = rep?.fuelReceived || '';
        worksheet.getCell(`E${totalRow + 4 + index}`).value = rep?.fuelRemainEnd || '';
        worksheet.getCell(`F${totalRow + 4 + index}`).value =
            (rep?.fuelRemain ?? 0) + (rep?.fuelReceived ?? 0) - (rep?.fuelRemainEnd ?? 0);

        worksheet.getCell(`G${totalRow + 4 + index}`).value = '';

        worksheet.getCell(`H${totalRow + 4 + index}`).value = '';
        worksheet.getCell(`I${totalRow + 4 + index}`).value = '';

        worksheet.mergeCells(`J${totalRow + 4 + index}:K${totalRow + 4 + index}`);
        worksheet.getCell(`J${totalRow + 4 + index}`).value = '';
    }

    const deviceRow = order.device?.length || []
    worksheet.mergeCells(`B${totalRow + 6 + deviceRow}:D${totalRow + 6 + deviceRow}`)
    worksheet.getCell(`B${totalRow + 6 + deviceRow}`).value = 'NGƯỜI NHẬN LỆNH';
    worksheet.getCell(`B${totalRow + 6 + deviceRow}`).font = { bold: true };
    worksheet.getCell(`B${totalRow + 6 + deviceRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`C${totalRow + 8 + deviceRow}`).value = '✔';
    worksheet.getCell(`C${totalRow + 8 + deviceRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`C${totalRow + 8 + deviceRow}`).font = { bold: true, size: 12 };
    worksheet.mergeCells(`B${totalRow + 10 + deviceRow}:D${totalRow + 10 + deviceRow}`)
    worksheet.getCell(`B${totalRow + 10 + deviceRow}`).font = { bold: true };
    worksheet.getCell(`B${totalRow + 10 + deviceRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`B${totalRow + 10 + deviceRow}`).value = order.assignedTo?.fullName || "";

    worksheet.mergeCells(`I${totalRow + 6 + deviceRow}:J${totalRow + 6 + deviceRow}`)
    worksheet.getCell(`I${totalRow + 6 + deviceRow}`).value = 'NGƯỜI RA LỆNH';
    worksheet.getCell(`I${totalRow + 6 + deviceRow}`).font = { bold: true };
    worksheet.getCell(`I${totalRow + 6 + deviceRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
    if (order.createdBy?.signature) {
        const response = await axios.get(order.createdBy.signature, { responseType: 'arraybuffer' });
        const extension = response.headers['content-type'].split('/')[1];
        const imageBuffer = Buffer.from(response.data, 'binary');

        const imageId = workbook.addImage({
            buffer: imageBuffer,
            extension
        });

        worksheet.mergeCells(`I${totalRow + 7 + deviceRow}:J${totalRow + 9 + deviceRow}`);

        // gán ảnh trực tiếp vào range
        worksheet.addImage(imageId, `I${totalRow + 7 + deviceRow}:J${totalRow + 9 + deviceRow}`);
    }

    worksheet.mergeCells(`I${totalRow + 10 + deviceRow}:J${totalRow + 10 + deviceRow}`)
    worksheet.getCell(`I${totalRow + 10 + deviceRow}`).font = { bold: true };
    worksheet.getCell(`I${totalRow + 10 + deviceRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`I${totalRow + 10 + deviceRow}`).value = order.createdBy?.fullName || "";


    worksheet.pageSetup = {
        paperSize: 9,                // A4
        orientation: 'landscape',    // ngang
        fitToPage: true,
        fitToWidth: 1,               // vừa 1 trang theo chiều ngang
        fitToHeight: 0,              // không ép theo chiều dọc
        margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } // inch
    };

    // 2) Set width cơ sở (Excel sẽ scale để vừa 1 trang)
    worksheet.columns = [
        { key: 'A', width: 6 },   // STT
        { key: 'B', width: 18 },  // Nhận tải
        { key: 'C', width: 18 },  // Đổ tải
        { key: 'D', width: 14 },  // Loại hàng
        { key: 'E', width: 14 },  // Cung độ tạm tính
        { key: 'F', width: 14 },  // Chiều cao nâng tải
        { key: 'G', width: 14 },  // Số chuyến
        { key: 'H', width: 14 },  // Khối lượng
        { key: 'I', width: 14 },  // Trọng lượng
        { key: 'J', width: 13 },  // Sản lượng
        { key: 'K', width: 15 },  // Nhiên liệu
    ];

    worksheet.eachRow((row) => {
        row.eachCell((cell) => {
            if (!cell.font) cell.font = {};
            cell.font = {
                ...cell.font,            // giữ lại các thuộc tính khác (bold, italic,…)
                name: 'Times New Roman', // đổi font chữ
                size: 12                 // kích thước chữ
            };
        });
    });

};
async function buildOther(order, workbook) {
    const sheetName = `${order.assignedTo?.username}_${formatDate(order.workingDate)}_${order.shift?.name}_${order._id}`.replace(/[\\\/:*?\[\]]/g, '-').substring(0, 31);

    const worksheet = workbook.addWorksheet(sheetName);

    // Tiêu đề bảng
    worksheet.mergeCells('A1:L2');
    const header = worksheet.getCell('A1');
    header.value = `LỆNH SẢN XUẤT`;
    header.font = { bold: true, size: 16 };
    header.alignment = { horizontal: 'center', vertical: 'middle' };




    worksheet.getCell('B4').value = 'Đơn vị';
    worksheet.getCell('B4').font = { bold: true };
    worksheet.getCell('C4').value = order.assignedTo?.department?.code || '';

    worksheet.getCell('F4').value = 'Ngày';
    worksheet.getCell('F4').font = { bold: true };
    // Lấy ngày từ order.workingDate và định dạng
    const workingDate = order.workingDate ? new Date(order.workingDate) : null;
    const ngay = workingDate ? workingDate.toLocaleDateString('vi-VN') : '';
    worksheet.getCell('G4').value = ngay;


    worksheet.getCell('I4').value = 'Ca';
    worksheet.getCell('I4').font = { bold: true };

    worksheet.getCell('J4').value = order.shift?.name || '';
    worksheet.getCell('J4').alignment = { horizontal: 'left' }

    // 3. Người ra lệnh
    // Dòng 5
    worksheet.getCell('B5').value = 'Người ra lệnh';
    worksheet.getCell('B5').font = { bold: true };
    worksheet.getCell('C5').value = order.createdBy?.fullName || '';

    worksheet.getCell('F5').value = 'Số thẻ';
    worksheet.getCell('F5').font = { bold: true };
    worksheet.getCell('G5').value = order.createdBy?.salaryCode || '';


    worksheet.getCell('I5').value = 'Chức vụ';
    worksheet.getCell('I5').font = { bold: true };
    worksheet.getCell('J5').value = order.createdBy?.position?.name || '';

    // 4. Người nhận lệnh
    // Dòng 6
    worksheet.getCell('B6').value = 'Người nhận lệnh';
    worksheet.getCell('B6').font = { bold: true };
    worksheet.getCell('C6').value = order.assignedTo?.fullName || '';

    worksheet.getCell('F6').value = 'Số thẻ';
    worksheet.getCell('F6').font = { bold: true };
    worksheet.getCell('G6').value = order.assignedTo?.salaryCode || '';

    worksheet.getCell('I6').value = 'Chức vụ';
    worksheet.getCell('I6').font = { bold: true };
    worksheet.getCell('J6').value = order.assignedTo?.position?.name || '';

    // Dòng 7
    worksheet.getCell(`B7`).value = 'Nội dung lệnh';
    worksheet.getCell(`B7`).font = { bold: true };
    // Gộp ô cho nội dung để hiển thị đầy đủ
    worksheet.mergeCells(`C7:L8`)
    worksheet.getCell(`C7`).value = order.workContent || '';
    worksheet.getCell(`C7`).alignment = { horizontal: 'left', vertical: 'middle' };


    worksheet.getCell(`B9`).value = 'Biện pháp an toàn';
    worksheet.getCell(`B9`).font = { bold: true };
    // Gộp ô cho nội dung bàn giao ca
    worksheet.mergeCells(`C9:L9`)
    worksheet.getCell(`C9`).value = (order?.safetyMeasure || '') + " " + (order?.safetyMeasureSpecific || '');


    worksheet.getCell(`B10`).value = 'Giờ nhận lệnh';
    worksheet.getCell(`B10`).font = { bold: true };
    worksheet.getCell(`C10`).value = order.startTime
        ? new Date(order.startTime).toLocaleTimeString('vi-VN', { hour12: false })
        : "";

    worksheet.getCell(`D10`).value = 'Giờ kết thúc';
    worksheet.getCell(`D10`).font = { bold: true };
    worksheet.getCell(`E10`).value = order.endTime
        ? new Date(order.endTime).toLocaleTimeString('vi-VN', { hour12: false })
        : "";

    worksheet.mergeCells(`A12:L12`);
    worksheet.getCell(`A12`).value = `I. NỘI DUNG BÀN GIAO CA`;
    worksheet.getCell(`A12`).font = { bold: true, size: 14 };
    worksheet.getCell(`A12`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(12).height = 30;

    worksheet.mergeCells(`A13:L17`);
    worksheet.getCell(`A13`).value = order.shiftReport?.handoverNotes || ''
    worksheet.getCell(`A13`).alignment = { wrapText: true, vertical: 'top' };

    worksheet.mergeCells(`A18:L18`);
    worksheet.getCell(`A18`).value = `II. KIẾN NGHỊ RỦI RO`;
    worksheet.getCell(`A18`).font = { bold: true, size: 14 };
    worksheet.getCell(`A18`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(18).height = 30;

    worksheet.mergeCells(`A19:L20`);
    worksheet.getCell(`A19`).value = order.shiftReport?.risks || ''
    worksheet.getCell(`A19`).alignment = { wrapText: true, vertical: 'top' };


    worksheet.mergeCells(`A21:L21`);
    worksheet.getCell(`A21`).value = 'Mức bồi dưỡng (x1000đ):';

    addTableBorders(worksheet, 12, 21, 1, 12)


    worksheet.mergeCells(`B23:D23`)
    worksheet.getCell(`B23`).value = 'NGƯỜI NHẬN LỆNH';
    worksheet.getCell(`B23`).font = { bold: true };
    worksheet.getCell(`B23`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`C25`).value = '✔';
    worksheet.getCell(`C25`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`C25`).font = { bold: true, size: 12 };
    worksheet.mergeCells(`B27:D27`)
    worksheet.getCell(`B27`).font = { bold: true };
    worksheet.getCell(`B27`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`B27`).value = order.assignedTo?.fullName || "";

    worksheet.mergeCells(`I23:L23`)
    worksheet.getCell(`I23`).value = 'NGƯỜI RA LỆNH';
    worksheet.getCell(`I23`).font = { bold: true };
    worksheet.getCell(`I23`).alignment = { horizontal: 'center', vertical: 'middle' };
    if (order.createdBy?.signature) {
        const response = await axios.get(order.createdBy.signature, { responseType: 'arraybuffer' });
        const extension = response.headers['content-type'].split('/')[1];
        const imageBuffer = Buffer.from(response.data, 'binary');

        const imageId = workbook.addImage({
            buffer: imageBuffer,
            extension
        });

        worksheet.mergeCells(`J24:K26`);

        // gán ảnh trực tiếp vào range
        worksheet.addImage(imageId, `J24:K26`);
    }

    worksheet.mergeCells(`I27:L27`)
    worksheet.getCell(`I27`).font = { bold: true };
    worksheet.getCell(`I27`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`I27`).value = order.createdBy?.fullName || "";


    worksheet.pageSetup = {
        paperSize: 9,                // A4
        orientation: 'landscape',    // ngang
        fitToPage: true,
        fitToWidth: 1,               // vừa 1 trang theo chiều ngang
        fitToHeight: 0,              // không ép theo chiều dọc
        margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } // inch
    };

    // 2) Set width cơ sở (Excel sẽ scale để vừa 1 trang)
    worksheet.columns = [
        { key: 'A', width: 6 },   // STT
        { key: 'B', width: 18 },  // Nhận tải
        { key: 'C', width: 18 },  // Đổ tải
        { key: 'D', width: 14 },  // Loại hàng
        { key: 'E', width: 14 },  // Cung độ tạm tính
        { key: 'F', width: 14 },  // Chiều cao nâng tải
        { key: 'G', width: 14 },  // Số chuyến
        { key: 'H', width: 14 },  // Khối lượng
        { key: 'I', width: 14 },  // Trọng lượng
        { key: 'J', width: 13 },  // Sản lượng
        { key: 'K', width: 12 },  // Nhiên liệu
        { key: 'L', width: 12 },  // Điểm lương
    ];

    worksheet.eachRow((row) => {
        row.eachCell((cell) => {
            if (!cell.font) cell.font = {};
            cell.font = {
                ...cell.font,            // giữ lại các thuộc tính khác (bold, italic,…)
                name: 'Times New Roman', // đổi font chữ
                size: 12                 // kích thước chữ
            };
        });
    });

};
async function buildMaintence(order, workbook) {
    const sheetName = `${order.assignedTo?.username}_${formatDate(order.workingDate)}_${order.shift?.name}_${order._id}`.replace(/[\\\/:*?\[\]]/g, '-').substring(0, 31);

    const worksheet = workbook.addWorksheet(sheetName);

    // Tiêu đề bảng
    worksheet.mergeCells('A1:I2');
    const header = worksheet.getCell('A1');
    header.value = `LỆNH SẢN XUẤT`;
    header.font = { bold: true, size: 16 };
    header.alignment = { horizontal: 'center', vertical: 'middle' };


    worksheet.getCell('B4').value = 'Đơn vị';
    worksheet.getCell('B4').font = { bold: true };
    worksheet.getCell('C4').value = order.assignedTo?.department?.code || '';

    worksheet.getCell('E4').value = 'Ngày';
    worksheet.getCell('E4').font = { bold: true };
    // Lấy ngày từ order.workingDate và định dạng
    const workingDate = order.workingDate ? new Date(order.workingDate) : null;
    const ngay = workingDate ? workingDate.toLocaleDateString('vi-VN') : '';
    worksheet.getCell('F4').value = ngay;

    worksheet.getCell('G4').value = order.shiftHour || '';


    worksheet.getCell('H4').value = 'Ca';
    worksheet.getCell('H4').font = { bold: true };

    worksheet.getCell('I4').value = order.shift?.name || '';
    worksheet.getCell('I4').alignment = { horizontal: 'left' }

    // 3. Người ra lệnh
    // Dòng 5
    worksheet.getCell('B5').value = 'Người ra lệnh';
    worksheet.getCell('B5').font = { bold: true };
    worksheet.getCell('C5').value = order.createdBy?.fullName || '';

    worksheet.getCell('E5').value = 'Số thẻ';
    worksheet.getCell('E5').font = { bold: true };
    worksheet.getCell('F5').value = order.createdBy?.salaryCode || '';


    worksheet.getCell('H5').value = 'Chức vụ';
    worksheet.getCell('H5').font = { bold: true };
    worksheet.getCell('I5').value = order.createdBy?.position?.name || '';

    // 4. Người nhận lệnh
    // Dòng 6
    worksheet.getCell('B6').value = 'Người nhận lệnh';
    worksheet.getCell('B6').font = { bold: true };
    worksheet.getCell('C6').value = order.assignedTo?.fullName || '';

    worksheet.getCell('E6').value = 'Số thẻ';
    worksheet.getCell('E6').font = { bold: true };
    worksheet.getCell('F6').value = order.assignedTo?.salaryCode || '';

    worksheet.getCell('H6').value = 'Chức vụ';
    worksheet.getCell('H6').font = { bold: true };
    worksheet.getCell('I6').value = order.assignedTo?.position?.name || '';

    // Dòng 6 lx bo tuc
    worksheet.getCell('B7').value = 'Phụ sửa chữa';
    worksheet.getCell('B7').font = { bold: true };

    let rowIndex = 7;
    (order.assistants || []).forEach((driver, idx) => {
        let row = rowIndex + idx;

        worksheet.getCell(`C${row}`).value = driver.fullName || '';
        worksheet.getCell(`E${row}`).value = 'Số thẻ';
        worksheet.getCell(`E${row}`).font = { bold: true };
        worksheet.getCell(`F${row}`).value = driver.salaryCode || '';

        worksheet.getCell(`H${row}`).value = 'Chức vụ';
        worksheet.getCell(`H${row}`).font = { bold: true };
        worksheet.getCell(`I${row}`).value = driver.position?.name || '';
    });

    let nextRow = rowIndex + (order.assistants?.length || 1);
    // Dòng 7
    worksheet.getCell(`B${nextRow}`).value = 'Nội dung lệnh';
    worksheet.getCell(`B${nextRow}`).font = { bold: true };
    // Gộp ô cho nội dung để hiển thị đầy đủ
    worksheet.mergeCells(`C${nextRow}:I${nextRow + 1}`)
    worksheet.getCell(`C${nextRow}`).value = order.workContent || '';
    worksheet.getCell(`C${nextRow}`).alignment = { horizontal: 'left', vertical: 'middle' };


    worksheet.getCell(`B${nextRow + 2}`).value = 'Biện pháp an toàn';
    worksheet.getCell(`B${nextRow + 2}`).font = { bold: true };
    // Gộp ô cho nội dung bàn giao ca
    worksheet.mergeCells(`C${nextRow + 2}:I${nextRow + 2}`)
    worksheet.getCell(`C${nextRow + 2}`).value = (order?.safetyMeasure || '') + " " + (order?.safetyMeasureSpecific || '');


    worksheet.getCell(`B${nextRow + 3}`).value = 'Nội dung bàn giao ca';
    worksheet.getCell(`B${nextRow + 3}`).font = { bold: true };
    // Gộp ô cho nội dung bàn giao ca
    worksheet.mergeCells(`C${nextRow + 3}:I${nextRow + 3}`)
    worksheet.getCell(`C${nextRow + 3}`).value = order.shiftReport?.handoverNotes || '';


    worksheet.getCell(`B${nextRow + 4}`).value = 'Giờ nhận lệnh';
    worksheet.getCell(`B${nextRow + 4}`).font = { bold: true };
    worksheet.getCell(`C${nextRow + 4}`).value = order.startTime
        ? new Date(order.startTime).toLocaleTimeString('vi-VN', { hour12: false })
        : "";

    worksheet.getCell(`E${nextRow + 4}`).value = 'Giờ kết thúc';
    worksheet.getCell(`E${nextRow + 4}`).font = { bold: true };
    worksheet.getCell(`F${nextRow + 4}`).value = order.endTime
        ? new Date(order.endTime).toLocaleTimeString('vi-VN', { hour12: false })
        : "";


    let rowHeader1 = nextRow + 6
    worksheet.mergeCells(`A${rowHeader1}:I${rowHeader1}`);
    const product = worksheet.getCell(`A${rowHeader1}`);
    product.value = `I. TÌNH TRẠNG SỬA CHỮA`;
    product.font = { bold: true, size: 14 };
    product.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(rowHeader1).height = 30;

    worksheet.getCell(`A${rowHeader1 + 1}`).value = 'STT';
    worksheet.getCell(`B${rowHeader1 + 1}`).value = 'Thiết bị';
    worksheet.mergeCells(`C${rowHeader1 + 1}:E${rowHeader1 + 1}`)
    worksheet.getCell(`C${rowHeader1 + 1}`).value = 'Tình trạng hư hỏng';
    worksheet.mergeCells(`F${rowHeader1 + 1}:H${rowHeader1 + 1}`)
    worksheet.getCell(`F${rowHeader1 + 1}`).value = 'Kết quả sửa chữa cuối ca';
    worksheet.getCell(`I${rowHeader1 + 1}`).value = 'Ghi chú';

    const headerRow = worksheet.getRow(rowHeader1 + 1);
    for (let col = 1; col <= 9; col++) {
        const cell = headerRow.getCell(col);
        cell.font = { bold: true };
        cell.alignment = {
            ...cell.alignment,
            wrapText: true,
            vertical: 'middle',
            horizontal: 'center',
        };
    }

    let rowIndexTrip = rowHeader1 + 2;
    const data = order.repairVehicles.length > 0 ? order.repairVehicles : [{}];
    data.forEach((repair, index) => {
        let report = {};
        console.log(order.shiftReport)

        if (order.shiftReport && order.shiftReport?.vehicleRepair.length > 0) {
            report = order.shiftReport.vehicleRepair.find(
                vr => vr.device.toString() === repair.device?._id.toString()
            ) || {};
        }
        worksheet.getCell(`A${rowIndexTrip}`).value = index + 1;
        worksheet.getCell(`A${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.getCell(`B${rowIndexTrip}`).value = repair.device?.code || '';
        worksheet.getCell(`B${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.mergeCells(`C${rowIndexTrip}:E${rowIndexTrip}`)
        worksheet.getCell(`C${rowIndexTrip}`).value = repair.note || '';
        worksheet.getCell(`C${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.mergeCells(`F${rowIndexTrip}:H${rowIndexTrip}`)
        worksheet.getCell(`F${rowIndexTrip}`).value = report.status || '';
        worksheet.getCell(`F${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.getCell(`I${rowIndexTrip}`).value = ""
        worksheet.getCell(`I${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        rowIndexTrip++

    })

    worksheet.mergeCells(`A${rowIndexTrip}:I${rowIndexTrip}`);
    worksheet.getCell(`A${rowIndexTrip}`).value = 'Mức bồi dưỡng (x1000đ):';

    addTableBorders(worksheet, rowHeader1, rowIndexTrip, 1, 9)

    worksheet.mergeCells(`B${rowIndexTrip + 2}:D${rowIndexTrip + 2}`)
    worksheet.getCell(`B${rowIndexTrip + 2}`).value = 'NGƯỜI NHẬN LỆNH';
    worksheet.getCell(`B${rowIndexTrip + 2}`).font = { bold: true };
    worksheet.getCell(`B${rowIndexTrip + 2}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`C${rowIndexTrip + 4}`).value = '✔';
    worksheet.getCell(`C${rowIndexTrip + 4}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`C${rowIndexTrip + 4}`).font = { bold: true, size: 12 };
    worksheet.mergeCells(`B${rowIndexTrip + 6}:D${rowIndexTrip + 6}`)
    worksheet.getCell(`B${rowIndexTrip + 6}`).font = { bold: true };
    worksheet.getCell(`B${rowIndexTrip + 6}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`B${rowIndexTrip + 6}`).value = order.assignedTo?.fullName || "";

    worksheet.mergeCells(`G${rowIndexTrip + 2}:H${rowIndexTrip + 2}`)
    worksheet.getCell(`G${rowIndexTrip + 2}`).value = 'NGƯỜI RA LỆNH';
    worksheet.getCell(`G${rowIndexTrip + 2}`).font = { bold: true };
    worksheet.getCell(`G${rowIndexTrip + 2}`).alignment = { horizontal: 'center', vertical: 'middle' };
    if (order.createdBy?.signature) {
        const response = await axios.get(order.createdBy.signature, { responseType: 'arraybuffer' });
        const extension = response.headers['content-type'].split('/')[1];
        const imageBuffer = Buffer.from(response.data, 'binary');

        const imageId = workbook.addImage({
            buffer: imageBuffer,
            extension
        });

        worksheet.mergeCells(`G${rowIndexTrip + 3}:H${rowIndexTrip + 5}`);

        // gán ảnh trực tiếp vào range
        worksheet.addImage(imageId, `G${rowIndexTrip + 3}:H${rowIndexTrip + 5}`);
    }

    worksheet.mergeCells(`G${rowIndexTrip + 6}:H${rowIndexTrip + 6}`)
    worksheet.getCell(`G${rowIndexTrip + 6}`).font = { bold: true };
    worksheet.getCell(`G${rowIndexTrip + 6}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`G${rowIndexTrip + 6}`).value = order.createdBy?.fullName || "";


    worksheet.pageSetup = {
        paperSize: 9,                // A4
        orientation: 'landscape',    // ngang
        fitToPage: true,
        fitToWidth: 1,               // vừa 1 trang theo chiều ngang
        fitToHeight: 0,              // không ép theo chiều dọc
        margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } // inch
    };

    // 2) Set width cơ sở (Excel sẽ scale để vừa 1 trang)
    worksheet.columns = [
        { key: 'A', width: 6 },   // STT
        { key: 'B', width: 18 },  // Nhận tải
        { key: 'C', width: 18 },  // Đổ tải
        { key: 'D', width: 10 },  // Loại hàng
        { key: 'E', width: 14 },  // Cung độ tạm tính
        { key: 'F', width: 14 },  // Chiều cao nâng tải
        { key: 'G', width: 10 },  // Số chuyến
        { key: 'H', width: 14 },  // Khối lượng
        { key: 'I', width: 25 },  // Trọng lượng
    ];

    worksheet.eachRow((row) => {
        row.eachCell((cell) => {
            if (!cell.font) cell.font = {};
            cell.font = {
                ...cell.font,            // giữ lại các thuộc tính khác (bold, italic,…)
                name: 'Times New Roman', // đổi font chữ
                size: 12                 // kích thước chữ
            };
        });
    });

};
async function buildDrill(order, workbook) {
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
    header.font = { bold: true, size: 16 };
    header.alignment = { horizontal: 'center', vertical: 'middle' };




    worksheet.getCell('B4').value = 'Đơn vị';
    worksheet.getCell('B4').font = { bold: true };
    worksheet.getCell('C4').value = order.assignedTo?.department?.code || '';

    worksheet.getCell('F4').value = 'Ngày';
    worksheet.getCell('F4').font = { bold: true };
    // Lấy ngày từ order.workingDate và định dạng
    const workingDate = order.workingDate ? new Date(order.workingDate) : null;
    const ngay = workingDate ? workingDate.toLocaleDateString('vi-VN') : '';
    worksheet.getCell('G4').value = ngay;

    worksheet.getCell('H4').value = order.shiftHour || '';


    worksheet.getCell('I4').value = 'Ca';
    worksheet.getCell('I4').font = { bold: true };

    worksheet.getCell('J4').value = order.shift?.name || '';
    worksheet.getCell('J4').alignment = { horizontal: 'left' }

    // 3. Người ra lệnh
    // Dòng 5
    worksheet.getCell('B5').value = 'Người ra lệnh';
    worksheet.getCell('B5').font = { bold: true };
    worksheet.getCell('C5').value = order.createdBy?.fullName || '';

    worksheet.getCell('F5').value = 'Số thẻ';
    worksheet.getCell('F5').font = { bold: true };
    worksheet.getCell('G5').value = order.createdBy?.salaryCode || '';


    worksheet.getCell('I5').value = 'Chức vụ';
    worksheet.getCell('I5').font = { bold: true };
    worksheet.getCell('J5').value = order.createdBy?.position?.name || '';

    // 4. Người nhận lệnh
    // Dòng 6
    worksheet.getCell('B6').value = 'Người nhận lệnh';
    worksheet.getCell('B6').font = { bold: true };
    worksheet.getCell('C6').value = order.assignedTo?.fullName || '';

    worksheet.getCell('F6').value = 'Số thẻ';
    worksheet.getCell('F6').font = { bold: true };
    worksheet.getCell('G6').value = order.assignedTo?.salaryCode || '';

    worksheet.getCell('I6').value = 'Chức vụ';
    worksheet.getCell('I6').font = { bold: true };
    worksheet.getCell('J6').value = order.assignedTo?.position?.name || '';

    // Dòng 6 lx bo tuc
    worksheet.getCell('B7').value = 'Phụ máy';
    worksheet.getCell('B7').font = { bold: true };

    let rowIndex = 7;
    (order.assistants || []).forEach((driver, idx) => {
        let row = rowIndex + idx;

        worksheet.getCell(`C${row}`).value = driver.fullName || '';
        worksheet.getCell(`F${row}`).value = 'Số thẻ';
        worksheet.getCell(`F${row}`).font = { bold: true };
        worksheet.getCell(`G${row}`).value = driver.salaryCode || '';

        worksheet.getCell(`I${row}`).value = 'Chức vụ';
        worksheet.getCell(`I${row}`).font = { bold: true };
        worksheet.getCell(`J${row}`).value = driver.position?.name || '';
    });

    let nextRow = rowIndex + (order.assistants?.length || 1);
    // Dòng 7
    worksheet.getCell(`B${nextRow}`).value = 'Nội dung lệnh';
    worksheet.getCell(`B${nextRow}`).font = { bold: true };
    // Gộp ô cho nội dung để hiển thị đầy đủ
    worksheet.mergeCells(`C${nextRow}:L${nextRow + 1}`)
    worksheet.getCell(`C${nextRow}`).value = order.workContent || '';
    worksheet.getCell(`C${nextRow}`).alignment = { horizontal: 'left', vertical: 'middle' };


    worksheet.getCell(`B${nextRow + 2}`).value = 'Biện pháp an toàn';
    worksheet.getCell(`B${nextRow + 2}`).font = { bold: true };
    // Gộp ô cho nội dung bàn giao ca
    worksheet.mergeCells(`C${nextRow + 2}:L${nextRow + 2}`)
    worksheet.getCell(`C${nextRow + 2}`).value = (order?.safetyMeasure || '') + " " + (order?.safetyMeasureSpecific || '');


    worksheet.getCell(`B${nextRow + 3}`).value = 'Nội dung bàn giao ca';
    worksheet.getCell(`B${nextRow + 3}`).font = { bold: true };
    // Gộp ô cho nội dung bàn giao ca
    worksheet.mergeCells(`C${nextRow + 3}:L${nextRow + 3}`)
    worksheet.getCell(`C${nextRow + 3}`).value = order.shiftReport?.handoverNotes || '';


    worksheet.getCell(`B${nextRow + 4}`).value = 'Giờ nhận lệnh';
    worksheet.getCell(`B${nextRow + 4}`).font = { bold: true };
    worksheet.getCell(`C${nextRow + 4}`).value = order.startTime
        ? new Date(order.startTime).toLocaleTimeString('vi-VN', { hour12: false })
        : "";

    worksheet.getCell(`D${nextRow + 4}`).value = 'Giờ kết thúc';
    worksheet.getCell(`D${nextRow + 4}`).font = { bold: true };
    worksheet.getCell(`E${nextRow + 4}`).value = order.endTime
        ? new Date(order.endTime).toLocaleTimeString('vi-VN', { hour12: false })
        : "";

    worksheet.mergeCells(`F${nextRow + 4}:G${nextRow + 4}`);
    worksheet.getCell(`F${nextRow + 4}`).value = 'Giờ hoạt động trên đồng hồ';
    worksheet.getCell(`F${nextRow + 4}`).font = { bold: true };
    worksheet.getCell(`H${nextRow + 4}`).value = (order?.shiftReport?.vehicleSummaries || []).reduce((sum, report) => { return sum + report?.travelHours }, 0) || '';
    worksheet.getCell(`H${nextRow + 4}`).alignment = { horizontal: 'left' }

    worksheet.mergeCells(`I${nextRow + 4}:J${nextRow + 4}`);
    worksheet.getCell(`I${nextRow + 4}`).value = 'Km hoạt động trên đồng hồ';
    worksheet.getCell(`I${nextRow + 4}`).font = { bold: true };
    worksheet.getCell(`K${nextRow + 4}`).value = (order?.shiftReport?.vehicleSummaries || []).reduce((sum, report) => { return sum + report?.distanceKm }, 0) || '';
    worksheet.getCell(`K${nextRow + 4}`).alignment = { horizontal: 'left' }

    let rowHeader1 = nextRow + 6
    worksheet.mergeCells(`A${rowHeader1}:L${rowHeader1}`);
    const product = worksheet.getCell(`A${rowHeader1}`);
    product.value = `I. SẢN PHẨM`;
    product.font = { bold: true, size: 14 };
    product.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(rowHeader1).height = 30;

    worksheet.getCell(`A${rowHeader1 + 1}`).value = 'STT';
    worksheet.mergeCells(`B${rowHeader1 + 1}:C${rowHeader1 + 1}`)
    worksheet.getCell(`B${rowHeader1 + 1}`).value = 'Máy khoan';
    worksheet.mergeCells(`D${rowHeader1 + 1}:E${rowHeader1 + 1}`)
    worksheet.getCell(`D${rowHeader1 + 1}`).value = 'Vật liệu';
    worksheet.getCell(`F${rowHeader1 + 1}`).value = 'Độ cứng';
    worksheet.getCell(`G${rowHeader1 + 1}`).value = 'Sản lượng tạm tính (mks)';
    worksheet.getCell(`H${rowHeader1 + 1}`).value = 'Nhiên liệu định mức';
    worksheet.getCell(`I${rowHeader1 + 1}`).value = 'Điểm lương \n tạm tính';
    worksheet.mergeCells(`J${rowHeader1 + 1}:L${rowHeader1 + 1}`)
    worksheet.getCell(`J${rowHeader1 + 1}`).value = 'Ghi chú';

    const headerRow = worksheet.getRow(rowHeader1 + 1);
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

    let rowIndexTrip = rowHeader1 + 2;
    reports.forEach((report, i) => {
        worksheet.getCell(`A${rowIndexTrip}`).value = i + 1;
        worksheet.getCell(`A${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.mergeCells(`B${rowIndexTrip}:C${rowIndexTrip}`)
        worksheet.getCell(`B${rowIndexTrip}`).value = report.device?.code || '';
        worksheet.getCell(`B${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.mergeCells(`D${rowIndexTrip}:E${rowIndexTrip}`)
        worksheet.getCell(`D${rowIndexTrip}`).value = report.material?.name || '';
        worksheet.getCell(`D${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.getCell(`F${rowIndexTrip}`).value = report.hardnessF || '';
        worksheet.getCell(`F${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.getCell(`G${rowIndexTrip}`).value = report.drillDepth || '';
        worksheet.getCell(`G${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.getCell(`H${rowIndexTrip}`).value = '';
        worksheet.getCell(`H${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.getCell(`I${rowIndexTrip}`).value = '';
        worksheet.getCell(`I${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.mergeCells(`J${rowIndexTrip}:L${rowIndexTrip}`)
        worksheet.getCell(`J${rowIndexTrip}`).value = '';
        rowIndexTrip++;
    })

    const totalRow = rowIndexTrip;

    worksheet.mergeCells(`A${totalRow}:C${totalRow}`);
    worksheet.getCell(`A${totalRow}`).value = 'Tổng cộng';
    worksheet.getCell(`A${totalRow}`).font = { bold: true };
    worksheet.getCell(`A${totalRow}`).alignment = { horizontal: 'center' }
    worksheet.mergeCells(`D${totalRow}:E${totalRow}`);
    worksheet.mergeCells(`J${totalRow}:L${totalRow}`);


    worksheet.mergeCells(`A${totalRow + 1}:L${totalRow + 1}`);
    worksheet.getCell(`A${totalRow + 1}`).value = 'Mức bồi dưỡng (x1000đ):';

    worksheet.mergeCells(`A${totalRow + 2}:L${totalRow + 2}`);
    const header3 = worksheet.getCell(`A${totalRow + 2}`);
    header3.value = `II.NHIÊN LIỆU`;
    header3.font = { bold: true, size: 14 };
    header3.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(totalRow + 2).height = 30;

    worksheet.mergeCells(`A${totalRow + 3}:B${totalRow + 3}`);
    worksheet.getCell(`A${totalRow + 3}`).value = 'Máy khoan';
    worksheet.getCell(`A${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`A${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`C${totalRow + 3}`).value = 'Tồn dầu';
    worksheet.getCell(`C${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`C${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`D${totalRow + 3}`).value = 'Lĩnh trong ca';
    worksheet.getCell(`D${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`D${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`E${totalRow + 3}`).value = 'Tồn cuối ca';
    worksheet.getCell(`E${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`E${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`F${totalRow + 3}`).value = 'Tiêu thụ';
    worksheet.getCell(`F${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`F${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`G${totalRow + 3}`).value = 'Định mức';
    worksheet.getCell(`G${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`G${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`H${totalRow + 3}`).value = 'Tiết kiệm';
    worksheet.getCell(`H${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`H${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`I${totalRow + 3}`).value = 'Sử dụng vượt';
    worksheet.getCell(`I${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`I${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells(`J${totalRow + 3}:L${totalRow + 3}`)
    worksheet.getCell(`J${totalRow + 3}`).value = 'Ghi chú';
    worksheet.getCell(`J${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`J${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle' };


    const fuelHeaderRow = totalRow + 2;
    const fuelRows = order.shiftReport?.vehicleSummaries?.length || 0;
    const fuelEndRow = fuelHeaderRow + fuelRows + 2;

    addTableBorders(worksheet, rowHeader1, fuelEndRow, 1, 12);

    for (let index = 0; index < (order.shiftReport?.vehicleSummaries?.length + 1 || 1); index++) {
        const rep = order.shiftReport?.vehicleSummaries[index];
        worksheet.mergeCells(`A${totalRow + 4 + index}:B${totalRow + 4 + index}`);
        worksheet.getCell(`A${totalRow + 4 + index}`).value = rep?.vehicle?.code || '';
        worksheet.getCell(`C${totalRow + 4 + index}`).value = rep?.fuelRemain || '';
        worksheet.getCell(`D${totalRow + 4 + index}`).value = rep?.fuelReceived || '';
        worksheet.getCell(`E${totalRow + 4 + index}`).value = rep?.fuelRemainEnd || '';
        worksheet.getCell(`F${totalRow + 4 + index}`).value =
            (rep?.fuelRemain ?? 0) + (rep?.fuelReceived ?? 0) - (rep?.fuelRemainEnd ?? 0);

        worksheet.getCell(`G${totalRow + 4 + index}`).value = '';

        worksheet.getCell(`H${totalRow + 4 + index}`).value = '';
        worksheet.getCell(`I${totalRow + 4 + index}`).value = '';

        worksheet.mergeCells(`J${totalRow + 4 + index}:L${totalRow + 4 + index}`);
        worksheet.getCell(`J${totalRow + 4 + index}`).value = '';
    }

    const deviceRow = order.device?.length || []
    worksheet.mergeCells(`B${totalRow + 6 + deviceRow}:D${totalRow + 6 + deviceRow}`)
    worksheet.getCell(`B${totalRow + 6 + deviceRow}`).value = 'NGƯỜI NHẬN LỆNH';
    worksheet.getCell(`B${totalRow + 6 + deviceRow}`).font = { bold: true };
    worksheet.getCell(`B${totalRow + 6 + deviceRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`C${totalRow + 8 + deviceRow}`).value = '✔';
    worksheet.getCell(`C${totalRow + 8 + deviceRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`C${totalRow + 8 + deviceRow}`).font = { bold: true, size: 12 };
    worksheet.mergeCells(`B${totalRow + 10 + deviceRow}:D${totalRow + 10 + deviceRow}`)
    worksheet.getCell(`B${totalRow + 10 + deviceRow}`).font = { bold: true };
    worksheet.getCell(`B${totalRow + 10 + deviceRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`B${totalRow + 10 + deviceRow}`).value = order.assignedTo?.fullName || "";

    worksheet.mergeCells(`I${totalRow + 6 + deviceRow}:L${totalRow + 6 + deviceRow}`)
    worksheet.getCell(`I${totalRow + 6 + deviceRow}`).value = 'NGƯỜI RA LỆNH';
    worksheet.getCell(`I${totalRow + 6 + deviceRow}`).font = { bold: true };
    worksheet.getCell(`I${totalRow + 6 + deviceRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
    if (order.createdBy?.signature) {
        const response = await axios.get(order.createdBy.signature, { responseType: 'arraybuffer' });
        const extension = response.headers['content-type'].split('/')[1];
        const imageBuffer = Buffer.from(response.data, 'binary');

        const imageId = workbook.addImage({
            buffer: imageBuffer,
            extension
        });

        worksheet.mergeCells(`J${totalRow + 7 + deviceRow}:K${totalRow + 9 + deviceRow}`);

        // gán ảnh trực tiếp vào range
        worksheet.addImage(imageId, `J${totalRow + 7 + deviceRow}:K${totalRow + 9 + deviceRow}`);
    }

    worksheet.mergeCells(`I${totalRow + 10 + deviceRow}:L${totalRow + 10 + deviceRow}`)
    worksheet.getCell(`I${totalRow + 10 + deviceRow}`).font = { bold: true };
    worksheet.getCell(`I${totalRow + 10 + deviceRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`I${totalRow + 10 + deviceRow}`).value = order.createdBy?.fullName || "";


    worksheet.pageSetup = {
        paperSize: 9,                // A4
        orientation: 'landscape',    // ngang
        fitToPage: true,
        fitToWidth: 1,               // vừa 1 trang theo chiều ngang
        fitToHeight: 0,              // không ép theo chiều dọc
        margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } // inch
    };

    // 2) Set width cơ sở (Excel sẽ scale để vừa 1 trang)
    worksheet.columns = [
        { key: 'A', width: 6 },   // STT
        { key: 'B', width: 18 },  // Nhận tải
        { key: 'C', width: 18 },  // Đổ tải
        { key: 'D', width: 14 },  // Loại hàng
        { key: 'E', width: 14 },  // Cung độ tạm tính
        { key: 'F', width: 14 },  // Chiều cao nâng tải
        { key: 'G', width: 14 },  // Số chuyến
        { key: 'H', width: 14 },  // Khối lượng
        { key: 'I', width: 14 },  // Trọng lượng
        { key: 'J', width: 13 },  // Sản lượng
        { key: 'K', width: 12 },  // Nhiên liệu
        { key: 'L', width: 12 },  // Điểm lương
    ];

    worksheet.eachRow((row) => {
        row.eachCell((cell) => {
            if (!cell.font) cell.font = {};
            cell.font = {
                ...cell.font,            // giữ lại các thuộc tính khác (bold, italic,…)
                name: 'Times New Roman', // đổi font chữ
                size: 12                 // kích thước chữ
            };
        });
    });

};
async function buildDozer(order, workbook) {
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
    header.font = { bold: true, size: 16 };
    header.alignment = { horizontal: 'center', vertical: 'middle' };




    worksheet.getCell('B4').value = 'Đơn vị';
    worksheet.getCell('B4').font = { bold: true };
    worksheet.getCell('C4').value = order.assignedTo?.department?.code || '';

    worksheet.getCell('F4').value = 'Ngày';
    worksheet.getCell('F4').font = { bold: true };
    // Lấy ngày từ order.workingDate và định dạng
    const workingDate = order.workingDate ? new Date(order.workingDate) : null;
    const ngay = workingDate ? workingDate.toLocaleDateString('vi-VN') : '';
    worksheet.getCell('G4').value = ngay;

    worksheet.getCell('H4').value = order.shiftHour || '';


    worksheet.getCell('I4').value = 'Ca';
    worksheet.getCell('I4').font = { bold: true };

    worksheet.getCell('J4').value = order.shift?.name || '';
    worksheet.getCell('J4').alignment = { horizontal: 'left' }

    // 3. Người ra lệnh
    // Dòng 5
    worksheet.getCell('B5').value = 'Người ra lệnh';
    worksheet.getCell('B5').font = { bold: true };
    worksheet.getCell('C5').value = order.createdBy?.fullName || '';

    worksheet.getCell('F5').value = 'Số thẻ';
    worksheet.getCell('F5').font = { bold: true };
    worksheet.getCell('G5').value = order.createdBy?.salaryCode || '';


    worksheet.getCell('I5').value = 'Chức vụ';
    worksheet.getCell('I5').font = { bold: true };
    worksheet.getCell('J5').value = order.createdBy?.position?.name || '';

    // 4. Người nhận lệnh
    // Dòng 6
    worksheet.getCell('B6').value = 'Người nhận lệnh';
    worksheet.getCell('B6').font = { bold: true };
    worksheet.getCell('C6').value = order.assignedTo?.fullName || '';

    worksheet.getCell('F6').value = 'Số thẻ';
    worksheet.getCell('F6').font = { bold: true };
    worksheet.getCell('G6').value = order.assignedTo?.salaryCode || '';

    worksheet.getCell('I6').value = 'Chức vụ';
    worksheet.getCell('I6').font = { bold: true };
    worksheet.getCell('J6').value = order.assignedTo?.position?.name || '';

    // Dòng 6 lx bo tuc
    worksheet.getCell('B7').value = 'Phụ máy';
    worksheet.getCell('B7').font = { bold: true };

    let rowIndex = 7;
    (order.assistants || []).forEach((driver, idx) => {
        let row = rowIndex + idx;

        worksheet.getCell(`C${row}`).value = driver.fullName || '';
        worksheet.getCell(`F${row}`).value = 'Số thẻ';
        worksheet.getCell(`F${row}`).font = { bold: true };
        worksheet.getCell(`G${row}`).value = driver.salaryCode || '';

        worksheet.getCell(`I${row}`).value = 'Chức vụ';
        worksheet.getCell(`I${row}`).font = { bold: true };
        worksheet.getCell(`J${row}`).value = driver.position?.name || '';
    });

    let nextRow = rowIndex + (order.assistants?.length || 1);
    // Dòng 7
    worksheet.getCell(`B${nextRow}`).value = 'Nội dung lệnh';
    worksheet.getCell(`B${nextRow}`).font = { bold: true };
    // Gộp ô cho nội dung để hiển thị đầy đủ
    worksheet.mergeCells(`C${nextRow}:L${nextRow + 1}`)
    worksheet.getCell(`C${nextRow}`).value = order.workContent || '';
    worksheet.getCell(`C${nextRow}`).alignment = { horizontal: 'left', vertical: 'middle' };


    worksheet.getCell(`B${nextRow + 2}`).value = 'Biện pháp an toàn';
    worksheet.getCell(`B${nextRow + 2}`).font = { bold: true };
    // Gộp ô cho nội dung bàn giao ca
    worksheet.mergeCells(`C${nextRow + 2}:L${nextRow + 2}`)
    worksheet.getCell(`C${nextRow + 2}`).value = (order?.safetyMeasure || '') + " " + (order?.safetyMeasureSpecific || '');


    worksheet.getCell(`B${nextRow + 3}`).value = 'Nội dung bàn giao ca';
    worksheet.getCell(`B${nextRow + 3}`).font = { bold: true };
    // Gộp ô cho nội dung bàn giao ca
    worksheet.mergeCells(`C${nextRow + 3}:L${nextRow + 3}`)
    worksheet.getCell(`C${nextRow + 3}`).value = order.shiftReport?.handoverNotes || '';


    worksheet.getCell(`B${nextRow + 4}`).value = 'Giờ nhận lệnh';
    worksheet.getCell(`B${nextRow + 4}`).font = { bold: true };
    worksheet.getCell(`C${nextRow + 4}`).value = order.startTime
        ? new Date(order.startTime).toLocaleTimeString('vi-VN', { hour12: false })
        : "";

    worksheet.getCell(`D${nextRow + 4}`).value = 'Giờ kết thúc';
    worksheet.getCell(`D${nextRow + 4}`).font = { bold: true };
    worksheet.getCell(`E${nextRow + 4}`).value = order.endTime
        ? new Date(order.endTime).toLocaleTimeString('vi-VN', { hour12: false })
        : "";

    worksheet.mergeCells(`F${nextRow + 4}:G${nextRow + 4}`);
    worksheet.getCell(`F${nextRow + 4}`).value = 'Giờ hoạt động trên đồng hồ';
    worksheet.getCell(`F${nextRow + 4}`).font = { bold: true };
    worksheet.getCell(`H${nextRow + 4}`).value = (order?.shiftReport?.vehicleSummaries || []).reduce((sum, report) => { return sum + report?.travelHours }, 0) || '';
    worksheet.getCell(`H${nextRow + 4}`).alignment = { horizontal: 'left' }

    worksheet.mergeCells(`I${nextRow + 4}:J${nextRow + 4}`);
    worksheet.getCell(`I${nextRow + 4}`).value = 'Km hoạt động trên đồng hồ';
    worksheet.getCell(`I${nextRow + 4}`).font = { bold: true };
    worksheet.getCell(`K${nextRow + 4}`).value = (order?.shiftReport?.vehicleSummaries || []).reduce((sum, report) => { return sum + report?.distanceKm }, 0) || '';
    worksheet.getCell(`K${nextRow + 4}`).alignment = { horizontal: 'left' }

    let rowHeader1 = nextRow + 6
    worksheet.mergeCells(`A${rowHeader1}:L${rowHeader1}`);
    const product = worksheet.getCell(`A${rowHeader1}`);
    product.value = `I. SẢN PHẨM`;
    product.font = { bold: true, size: 14 };
    product.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(rowHeader1).height = 30;

    worksheet.getCell(`A${rowHeader1 + 1}`).value = 'STT';
    worksheet.mergeCells(`B${rowHeader1 + 1}:C${rowHeader1 + 1}`)
    worksheet.getCell(`B${rowHeader1 + 1}`).value = 'Máy gạt';
    worksheet.mergeCells(`D${rowHeader1 + 1}:E${rowHeader1 + 1}`)
    worksheet.getCell(`D${rowHeader1 + 1}`).value = 'Vật liệu/Phục vụ';
    worksheet.getCell(`F${rowHeader1 + 1}`).value = 'Giờ sản phẩm (phút)';
    worksheet.mergeCells(`F${rowHeader1 + 1}:G${rowHeader1 + 1}`)
    worksheet.getCell(`H${rowHeader1 + 1}`).value = 'Nhiên liệu định mức';
    worksheet.getCell(`I${rowHeader1 + 1}`).value = 'Điểm lương \n tạm tính';
    worksheet.mergeCells(`J${rowHeader1 + 1}:L${rowHeader1 + 1}`)
    worksheet.getCell(`J${rowHeader1 + 1}`).value = 'Ghi chú';

    const headerRow = worksheet.getRow(rowHeader1 + 1);
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

    let rowIndexTrip = rowHeader1 + 2;
    reports.forEach((report, i) => {
        worksheet.getCell(`A${rowIndexTrip}`).value = i + 1;
        worksheet.getCell(`A${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.mergeCells(`B${rowIndexTrip}:C${rowIndexTrip}`)
        worksheet.getCell(`B${rowIndexTrip}`).value = report.device?.code || '';
        worksheet.getCell(`B${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.mergeCells(`D${rowIndexTrip}:E${rowIndexTrip}`)
        worksheet.getCell(`D${rowIndexTrip}`).value = report.material?.name || '';
        worksheet.getCell(`D${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.mergeCells(`F${rowIndexTrip}:G${rowIndexTrip}`)
        worksheet.getCell(`F${rowIndexTrip}`).value = report?.workingMinutes || '';
        worksheet.getCell(`F${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.getCell(`H${rowIndexTrip}`).value = '';
        worksheet.getCell(`H${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.getCell(`I${rowIndexTrip}`).value = '';
        worksheet.getCell(`I${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.mergeCells(`J${rowIndexTrip}:L${rowIndexTrip}`)
        worksheet.getCell(`J${rowIndexTrip}`).value = '';
        rowIndexTrip++;
    })

    const totalRow = rowIndexTrip;

    worksheet.mergeCells(`A${totalRow}:C${totalRow}`);
    worksheet.getCell(`A${totalRow}`).value = 'Tổng cộng';
    worksheet.getCell(`A${totalRow}`).font = { bold: true };
    worksheet.getCell(`A${totalRow}`).alignment = { horizontal: 'center' }
    worksheet.mergeCells(`D${totalRow}:E${totalRow}`);
    worksheet.mergeCells(`F${totalRow}:G${totalRow}`);
    worksheet.mergeCells(`J${totalRow}:L${totalRow}`);


    worksheet.mergeCells(`A${totalRow + 1}:L${totalRow + 1}`);
    worksheet.getCell(`A${totalRow + 1}`).value = 'Mức bồi dưỡng (x1000đ):';

    worksheet.mergeCells(`A${totalRow + 2}:L${totalRow + 2}`);
    const header3 = worksheet.getCell(`A${totalRow + 2}`);
    header3.value = `II.NHIÊN LIỆU`;
    header3.font = { bold: true, size: 14 };
    header3.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(totalRow + 2).height = 30;

    worksheet.mergeCells(`A${totalRow + 3}:B${totalRow + 3}`);
    worksheet.getCell(`A${totalRow + 3}`).value = 'Máy gạt';
    worksheet.getCell(`A${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`A${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`C${totalRow + 3}`).value = 'Tồn dầu';
    worksheet.getCell(`C${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`C${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`D${totalRow + 3}`).value = 'Lĩnh trong ca';
    worksheet.getCell(`D${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`D${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`E${totalRow + 3}`).value = 'Tồn cuối ca';
    worksheet.getCell(`E${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`E${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`F${totalRow + 3}`).value = 'Tiêu thụ';
    worksheet.getCell(`F${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`F${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`G${totalRow + 3}`).value = 'Định mức';
    worksheet.getCell(`G${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`G${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`H${totalRow + 3}`).value = 'Tiết kiệm';
    worksheet.getCell(`H${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`H${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`I${totalRow + 3}`).value = 'Sử dụng vượt';
    worksheet.getCell(`I${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`I${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells(`J${totalRow + 3}:L${totalRow + 3}`)
    worksheet.getCell(`J${totalRow + 3}`).value = 'Ghi chú';
    worksheet.getCell(`J${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`J${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle' };


    const fuelHeaderRow = totalRow + 2;
    const fuelRows = order.shiftReport?.vehicleSummaries?.length || 0;
    const fuelEndRow = fuelHeaderRow + fuelRows + 2;

    addTableBorders(worksheet, rowHeader1, fuelEndRow, 1, 12);

    for (let index = 0; index < (order.shiftReport?.vehicleSummaries?.length + 1 || 1); index++) {
        const rep = order.shiftReport?.vehicleSummaries[index];
        worksheet.mergeCells(`A${totalRow + 4 + index}:B${totalRow + 4 + index}`);
        worksheet.getCell(`A${totalRow + 4 + index}`).value = rep?.vehicle?.code || '';
        worksheet.getCell(`C${totalRow + 4 + index}`).value = rep?.fuelRemain || '';
        worksheet.getCell(`D${totalRow + 4 + index}`).value = rep?.fuelReceived || '';
        worksheet.getCell(`E${totalRow + 4 + index}`).value = rep?.fuelRemainEnd || '';
        worksheet.getCell(`F${totalRow + 4 + index}`).value =
            (rep?.fuelRemain ?? 0) + (rep?.fuelReceived ?? 0) - (rep?.fuelRemainEnd ?? 0);

        worksheet.getCell(`G${totalRow + 4 + index}`).value = '';

        worksheet.getCell(`H${totalRow + 4 + index}`).value = '';
        worksheet.getCell(`I${totalRow + 4 + index}`).value = '';

        worksheet.mergeCells(`J${totalRow + 4 + index}:L${totalRow + 4 + index}`);
        worksheet.getCell(`J${totalRow + 4 + index}`).value = '';
    }

    const deviceRow = order.device?.length || []
    worksheet.mergeCells(`B${totalRow + 6 + deviceRow}:D${totalRow + 6 + deviceRow}`)
    worksheet.getCell(`B${totalRow + 6 + deviceRow}`).value = 'NGƯỜI NHẬN LỆNH';
    worksheet.getCell(`B${totalRow + 6 + deviceRow}`).font = { bold: true };
    worksheet.getCell(`B${totalRow + 6 + deviceRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`C${totalRow + 8 + deviceRow}`).value = '✔';
    worksheet.getCell(`C${totalRow + 8 + deviceRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`C${totalRow + 8 + deviceRow}`).font = { bold: true, size: 12 };
    worksheet.mergeCells(`B${totalRow + 10 + deviceRow}:D${totalRow + 10 + deviceRow}`)
    worksheet.getCell(`B${totalRow + 10 + deviceRow}`).font = { bold: true };
    worksheet.getCell(`B${totalRow + 10 + deviceRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`B${totalRow + 10 + deviceRow}`).value = order.assignedTo?.fullName || "";

    worksheet.mergeCells(`I${totalRow + 6 + deviceRow}:L${totalRow + 6 + deviceRow}`)
    worksheet.getCell(`I${totalRow + 6 + deviceRow}`).value = 'NGƯỜI RA LỆNH';
    worksheet.getCell(`I${totalRow + 6 + deviceRow}`).font = { bold: true };
    worksheet.getCell(`I${totalRow + 6 + deviceRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
    if (order.createdBy?.signature) {
        const response = await axios.get(order.createdBy.signature, { responseType: 'arraybuffer' });
        const extension = response.headers['content-type'].split('/')[1];
        const imageBuffer = Buffer.from(response.data, 'binary');

        const imageId = workbook.addImage({
            buffer: imageBuffer,
            extension
        });

        worksheet.mergeCells(`J${totalRow + 7 + deviceRow}:K${totalRow + 9 + deviceRow}`);

        // gán ảnh trực tiếp vào range
        worksheet.addImage(imageId, `J${totalRow + 7 + deviceRow}:K${totalRow + 9 + deviceRow}`);
    }

    worksheet.mergeCells(`I${totalRow + 10 + deviceRow}:L${totalRow + 10 + deviceRow}`)
    worksheet.getCell(`I${totalRow + 10 + deviceRow}`).font = { bold: true };
    worksheet.getCell(`I${totalRow + 10 + deviceRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`I${totalRow + 10 + deviceRow}`).value = order.createdBy?.fullName || "";


    worksheet.pageSetup = {
        paperSize: 9,                // A4
        orientation: 'landscape',    // ngang
        fitToPage: true,
        fitToWidth: 1,               // vừa 1 trang theo chiều ngang
        fitToHeight: 0,              // không ép theo chiều dọc
        margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } // inch
    };

    // 2) Set width cơ sở (Excel sẽ scale để vừa 1 trang)
    worksheet.columns = [
        { key: 'A', width: 6 },   // STT
        { key: 'B', width: 18 },  // Nhận tải
        { key: 'C', width: 18 },  // Đổ tải
        { key: 'D', width: 14 },  // Loại hàng
        { key: 'E', width: 14 },  // Cung độ tạm tính
        { key: 'F', width: 14 },  // Chiều cao nâng tải
        { key: 'G', width: 14 },  // Số chuyến
        { key: 'H', width: 14 },  // Khối lượng
        { key: 'I', width: 14 },  // Trọng lượng
        { key: 'J', width: 13 },  // Sản lượng
        { key: 'K', width: 12 },  // Nhiên liệu
        { key: 'L', width: 12 },  // Điểm lương
    ];

    worksheet.eachRow((row) => {
        row.eachCell((cell) => {
            if (!cell.font) cell.font = {};
            cell.font = {
                ...cell.font,            // giữ lại các thuộc tính khác (bold, italic,…)
                name: 'Times New Roman', // đổi font chữ
                size: 12                 // kích thước chữ
            };
        });
    });

};
async function buildDispatcher(order, workbook) {
    const sheetName = `${order.assignedTo?.username}_${formatDate(order.workingDate)}_${order.shift?.name}_${order._id}`.replace(/[\\\/:*?\[\]]/g, '-').substring(0, 31);

    const worksheet = workbook.addWorksheet(sheetName);

    // Tiêu đề bảng
    worksheet.mergeCells('A1:L2');
    const header = worksheet.getCell('A1');
    header.value = `LỆNH SẢN XUẤT`;
    header.font = { bold: true, size: 16 };
    header.alignment = { horizontal: 'center', vertical: 'middle' };




    worksheet.getCell('B4').value = 'Đơn vị';
    worksheet.getCell('B4').font = { bold: true };
    worksheet.getCell('C4').value = order.createdBy?.department?.code || '';

    worksheet.getCell('E4').value = 'Ngày';
    worksheet.getCell('E4').font = { bold: true };
    // Lấy ngày từ order.workingDate và định dạng
    const workingDate = order.workingDate ? new Date(order.workingDate) : null;
    const ngay = workingDate ? workingDate.toLocaleDateString('vi-VN') : '';
    worksheet.getCell('F4').value = ngay;

    // 3. Người ra lệnh
    // Dòng 5
    worksheet.getCell('B5').value = 'Người ra lệnh';
    worksheet.getCell('B5').font = { bold: true };
    worksheet.getCell('C5').value = order.createdBy?.fullName || '';

    worksheet.getCell('E5').value = 'Số thẻ';
    worksheet.getCell('E5').font = { bold: true };
    worksheet.getCell('F5').value = order.createdBy?.salaryCode || '';


    worksheet.getCell('G5').value = 'Chức vụ';
    worksheet.getCell('G5').font = { bold: true };
    worksheet.getCell('H5').value = order.createdBy?.position?.name || '';

    // 4. Người nhận lệnh
    // Dòng 6
    worksheet.getCell('B6').value = 'Người nhận lệnh';
    worksheet.getCell('B6').font = { bold: true };
    worksheet.getCell('C6').value = order.assignedTo?.fullName || '';

    worksheet.getCell('E6').value = 'Số thẻ';
    worksheet.getCell('E6').font = { bold: true };
    worksheet.getCell('F6').value = order.assignedTo?.salaryCode || '';

    worksheet.getCell('G6').value = 'Chức vụ';
    worksheet.getCell('G6').font = { bold: true };
    worksheet.getCell('H6').value = order.assignedTo?.position?.name || '';

    worksheet.getCell('J6').value = 'Đơn vị';
    worksheet.getCell('J6').font = { bold: true };
    worksheet.getCell('K6').value = order.assignedTo?.department?.code || '';


    worksheet.getCell(`B7`).value = 'Biện pháp an toàn';
    worksheet.getCell(`B7`).font = { bold: true };
    // Gộp ô cho nội dung bàn giao ca
    worksheet.mergeCells(`C7:L7`)
    worksheet.getCell(`C7`).value = (order?.safetyMeasure || '') + " " + (order?.safetyMeasureSpecific || '');


    worksheet.getCell(`B8`).value = 'Giờ nhận lệnh';
    worksheet.getCell(`B8`).font = { bold: true };
    worksheet.getCell(`C8`).value = order.startTime
        ? new Date(order.startTime).toLocaleTimeString('vi-VN', { hour12: false })
        : "";

    worksheet.getCell(`D8`).value = 'Giờ kết thúc';
    worksheet.getCell(`D8`).font = { bold: true };
    worksheet.getCell(`E8`).value = order.endTime
        ? new Date(order.endTime).toLocaleTimeString('vi-VN', { hour12: false })
        : "";

    worksheet.mergeCells(`A10:L10`);
    worksheet.getCell(`A10`).value = `I. NỘI DUNG LỆNH`;
    worksheet.getCell(`A10`).font = { bold: true, size: 14 };
    worksheet.getCell(`A10`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(12).height = 30;

    worksheet.mergeCells(`A11:L17`);
    worksheet.getCell(`A13`).value = order.workContent || ''
    worksheet.getCell(`A13`).alignment = { vertical: 'top', wrapText: true, };

    addTableBorders(worksheet, 10, 17, 1, 12)


    worksheet.mergeCells(`B19:D19`)
    worksheet.getCell(`B19`).value = 'NGƯỜI NHẬN LỆNH';
    worksheet.getCell(`B19`).font = { bold: true };
    worksheet.getCell(`B19`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`C21`).value = '✔';
    worksheet.getCell(`C21`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`C21`).font = { bold: true, size: 12 };
    worksheet.mergeCells(`B23:D23`)
    worksheet.getCell(`B23`).font = { bold: true };
    worksheet.getCell(`B23`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`B23`).value = order.assignedTo?.fullName || "";

    worksheet.mergeCells(`I19:L19`)
    worksheet.getCell(`I19`).value = 'NGƯỜI RA LỆNH';
    worksheet.getCell(`I19`).font = { bold: true };
    worksheet.getCell(`I19`).alignment = { horizontal: 'center', vertical: 'middle' };
    if (order.createdBy?.signature) {
        const response = await axios.get(order.createdBy.signature, { responseType: 'arraybuffer' });
        const extension = response.headers['content-type'].split('/')[1];
        const imageBuffer = Buffer.from(response.data, 'binary');

        const imageId = workbook.addImage({
            buffer: imageBuffer,
            extension
        });

        worksheet.mergeCells(`J20:K22`);

        // gán ảnh trực tiếp vào range
        worksheet.addImage(imageId, `J20:K22`);
    }

    worksheet.mergeCells(`I23:L23`)
    worksheet.getCell(`I23`).font = { bold: true };
    worksheet.getCell(`I23`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`I23`).value = order.createdBy?.fullName || "";


    worksheet.pageSetup = {
        paperSize: 9,                // A4
        orientation: 'landscape',    // ngang
        fitToPage: true,
        fitToWidth: 1,               // vừa 1 trang theo chiều ngang
        fitToHeight: 0,              // không ép theo chiều dọc
        margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } // inch
    };

    // 2) Set width cơ sở (Excel sẽ scale để vừa 1 trang)
    worksheet.columns = [
        { key: 'A', width: 6 },   // STT
        { key: 'B', width: 18 },  // Nhận tải
        { key: 'C', width: 18 },  // Đổ tải
        { key: 'D', width: 14 },  // Loại hàng
        { key: 'E', width: 14 },  // Cung độ tạm tính
        { key: 'F', width: 14 },  // Chiều cao nâng tải
        { key: 'G', width: 14 },  // Số chuyến
        { key: 'H', width: 14 },  // Khối lượng
        { key: 'I', width: 14 },  // Trọng lượng
        { key: 'J', width: 13 },  // Sản lượng
        { key: 'K', width: 12 },  // Nhiên liệu
        { key: 'L', width: 12 },  // Điểm lương
    ];

    worksheet.eachRow((row) => {
        row.eachCell((cell) => {
            if (!cell.font) cell.font = {};
            cell.font = {
                ...cell.font,            // giữ lại các thuộc tính khác (bold, italic,…)
                name: 'Times New Roman', // đổi font chữ
                size: 12                 // kích thước chữ
            };
        });
    });

};
//
//báo ca tình trạng xe
router.post('/vehicleShiftReport/view', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER), async (req, res, next) => {
    try {
        const { shift, startDate, endDate, department } = req.body
        const user = req.user
        let query = {}
        if (user?.role === ROLE.ADMIN) {
            query.department = new mongoose.Types.ObjectId(department)
        } else {
            query.department = new mongoose.Types.ObjectId(user.department?._id)
        }
        if (Array.isArray(shift) && shift.length > 0) {
            query.shift = { $in: shift };
        }

        if (startDate && endDate) {
            query.workingDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        const orders = await Order.find(query).populate('device', 'vehicleNumber status note').lean();

        const formattedData = orders.flatMap((order, orderIndex) => {
            if (!order.device || order.device.length === 0) return [];

            return order.device
                .filter(d => d.status === "maintenance") // lọc device có status maintenance
                .map(d => {

                    return {
                        _id: d?._id,
                        vehicleNumber: d?.vehicleNumber || '',
                        warning: d?.note || '',
                        result: '',
                        note: ''
                    };
                });
        });
        res.status(200).send({ status: 'success', data: formattedData })
    } catch (err) {
        req.logger.error("❌ Lỗi khi load", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
})
router.post('/vehicleShiftReport', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER), async (req, res, next) => {
    try {
        const { shift, startDate, endDate, department, signature } = req.body
        const user = req.user
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
                    department: user?.role === ROLE.ADMIN ? new mongoose.Types.ObjectId(department) : new mongoose.Types.ObjectId(user.department?._id)
                })
                    .populate('device', 'vehicleNumber status note')

                const sheetName = `${formatDate(d)}_${ca.name}`.replace(/[\\\/:*?\[\]]/g, '-').substring(0, 31);

                const worksheet = workbook.addWorksheet(sheetName);

                worksheet.mergeCells('A1:E1');
                const infoRow = worksheet.getCell('A1');
                infoRow.value = `Ca: ${ca.name}                  , ngày:    ${formatDate(d)}                             Tên cán bộ: ${req.user?.fullName}`;
                infoRow.font = { italic: true, size: 14 };
                infoRow.alignment = { horizontal: 'left', vertical: 'middle' };
                // Tiêu đề bảng
                worksheet.mergeCells('A3:E3');
                const header = worksheet.getCell('A3');
                header.value = "Xe không hoạt động";
                header.font = { bold: true, size: 16 };
                header.alignment = { horizontal: 'center', vertical: 'middle' };

                const headerRowNumber = 5;
                const headers = ['STT', 'Số xe', 'Tình trạng hư/ hỏng', 'Kết quả sửa chữa trong ca', 'Ghi chú'];

                headers.forEach((text, index) => {
                    const cell = worksheet.getRow(headerRowNumber).getCell(index + 1);
                    cell.value = text;
                    cell.font = { bold: true };
                    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                });

                let index = 1;
                let totalDataRows = 5;
                for (const order of orders) {
                    const reps = order.device.filter(d => d.status === "maintenance")
                    totalDataRows += reps.length;
                    reps.map(d =>
                        worksheet.addRow([
                            index++,
                            d?.vehicleNumber || '',
                            d?.note || '',
                            '',
                            ''
                        ])
                    )

                }
                addTableBorders(worksheet, 5, totalDataRows, 1, 5);

                worksheet.pageSetup = {
                    paperSize: 9,                // A4
                    orientation: 'landscape',    // ngang
                    fitToPage: true,
                    fitToWidth: 1,               // vừa 1 trang theo chiều ngang
                    fitToHeight: 0,              // không ép theo chiều dọc
                    margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } // inch
                };

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
        req.logger.info(`✅ Export excel thành công`);

    } catch (err) {
        req.logger.error("❌ Lỗi khi export", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

// báo tổng hợp ô tô
router.post('/carReport/view', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER), async (req, res, next) => {
    try {
        const { shift, startDate, endDate, department } = req.body
        const user = req.user
        let query = {}
        if (user?.role === ROLE.ADMIN) {
            query.department = new mongoose.Types.ObjectId(department)
        } else {
            query.department = new mongoose.Types.ObjectId(user.department?._id)
        }
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
                        select: "code"
                    },
                ]
            })
            .populate({
                path: "assignedTo",
                select: "fullName salaryCode department",
                populate: {
                    path: 'department',
                    select: 'name'
                }
            })
            .populate('createdBy', 'fullName salaryCode')
            .populate('device', 'code')
            .populate({
                path: 'job',
                select: 'type',
            })
        const filterOrders = orders.filter(r =>
            r.job?.type?.toLowerCase().includes("vận hành xe".toLowerCase())
        );

        let index = 1
        const results = [];
        for (const order of filterOrders) {
            let reports = await Report.find({ orderId: order._id })
                .populate({
                    path: 'device',
                    select: 'code category',
                    populate: {
                        path: 'category',
                        select: 'name'
                    }
                })
                .populate('excavator', 'code')
                .populate('toLocation', 'name')
            reports = reports.filter(r =>
                r.device?.category?.name?.toLowerCase().includes("vận tải".toLowerCase())
            );
            if (!reports.length) continue;
            const grouped = groupReportsByExcavator(reports)

            results.push({
                _id: order._id,
                STT: index++,
                createdBy: order.createdBy?.fullName || '',
                assignedTo: (order.assignedTo?.fullName || '') + "-" + (order.assignedTo?.salaryCode || ''),
                department: order.assignedTo?.department?.name || '',
                code: order.device?.map(item => item?.code).join(', ') || [],
                reports: grouped.map(g => ({
                    excavator: g.from?.code || '',
                    toLocation: g.to?.name || '',
                    distance: 0
                })),
                fuelRemain: order?.shiftReport?.vehicleSummaries.map(item => item?.fuelRemain) || [],
                fuelReceived: order?.shiftReport?.vehicleSummaries.map(item => item?.fuelReceived) || [],
                fuelRemainEnd: order?.shiftReport?.vehicleSummaries.map(item => item?.fuelRemainEnd) || [],
                consume: order?.shiftReport?.vehicleSummaries?.map((item) => (item?.fuelRemain || 0) + (item?.fuelReceived || 0) - (item?.fuelRemainEnd || 0)) || []
            });
        }


        res.status(200).send({ status: 'success', data: results })
    } catch (err) {
        req.logger.error("❌ Lỗi khi load", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
})
router.post('/carReport', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER), async (req, res, next) => {
    try {
        const { shift, startDate, endDate, title, signature, department } = req.body
        const user = req.user
        const shiftList = await Shift.find({ _id: { $in: shift } });
        const start = new Date(startDate);
        const end = new Date(endDate);
        let dep;
        if (department) {
            dep = await Department.findById(department).select('name')
        } else {
            dep = user?.department
        }

        // Đảm bảo end không nhỏ hơn start
        if (end < start) return res.status(400).json({ message: "Ngày kết thúc phải sau ngày bắt đầu" });

        const workbook = new ExcelJS.Workbook();
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            for (const ca of shiftList) {
                const orders = await Order.find({
                    workingDate: d,
                    shift: ca._id,
                    department: user?.role === ROLE.ADMIN ? new mongoose.Types.ObjectId(department) : new mongoose.Types.ObjectId(user.department?._id)
                })
                    .populate({
                        path: "shiftReport",
                        populate: [
                            {
                                path: "vehicleSummaries.vehicle",
                                select: "code"
                            },
                        ]
                    })
                    .populate({
                        path: "assignedTo",
                        select: "fullName salaryCode department",
                        populate: {
                            path: 'department',
                            select: 'name'
                        }
                    })
                    .populate('createdBy', 'fullName salaryCode')
                    .populate('device', 'code')
                    .populate({
                        path: 'job',
                        select: 'type',
                    })
                const filterOrders = orders.filter(r =>
                    r.job?.type?.toLowerCase().includes("vận hành xe".toLowerCase())
                );


                const sheetName = `${formatDate(d)}_${ca.name}`.replace(/[\\\/:*?\[\]]/g, '-').substring(0, 31);

                const worksheet = workbook.addWorksheet(sheetName);

                // === DÒNG 1: Tiêu đề bảng ===
                worksheet.mergeCells('A1:M2');
                const header = worksheet.getCell('A1');
                header.value = 'Tổng hợp số liệu trong ca (Ô tô)';
                header.font = { bold: true, size: 16 };
                header.alignment = { horizontal: 'center', vertical: 'middle' };

                // === DÒNG 2–4: Thông tin người ra lệnh ===
                worksheet.getCell('B3').value = 'Ca';
                worksheet.getCell('B3').font = { bold: true };
                worksheet.getCell('C3').value = ca?.name;

                worksheet.getCell('E3').value = 'Ngày';
                worksheet.getCell('E3').font = { bold: true };
                worksheet.getCell('F3').value = formatDate(d);

                worksheet.getCell('B4').value = 'Đơn vị';
                worksheet.getCell('B4').font = { bold: true };
                worksheet.getCell('C4').value = dep?.name || '';

                worksheet.getCell('E4').value = 'Giờ hệ thống';
                worksheet.getCell('E4').font = { bold: true };
                worksheet.getCell('F4').value = new Date().toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                });

                worksheet.getCell('B5').value = 'Người ra lệnh';
                worksheet.getCell('B5').font = { bold: true };
                worksheet.getCell('C5').value = req.user?.fullName || '';

                worksheet.getCell('E5').value = 'Số thẻ';
                worksheet.getCell('E5').font = { bold: true };
                worksheet.getCell('F5').value = req.user?.salaryCode || '';

                worksheet.getCell('G5').value = 'Chức vụ';
                worksheet.getCell('G5').font = { bold: true };
                worksheet.getCell('H5').value = req.user?.position?.name || '';

                worksheet.mergeCells('A6:H6');
                worksheet.mergeCells('I6:K6'); // Nhiên liệu
                worksheet.getCell('I6').value = 'Nhiên liệu (lít)';
                worksheet.getCell('I6').alignment = { horizontal: 'center', vertical: 'middle' };
                worksheet.getCell('I6').font = { bold: true };
                worksheet.mergeCells('L6:M6');


                // === DÒNG 7: Header chi tiết ===
                const headerRow = worksheet.getRow(7);
                headerRow.values = [
                    'STT',
                    'Người tạo lệnh',
                    'Công nhân',
                    'Đơn vị',
                    'Biển số ô tô',
                    'Vị trí \nnhận tải',
                    'Vị trí \nđổ tải',
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

                let results = []
                for (const order of filterOrders) {
                    let reports = await Report.find({ orderId: order._id })
                        .populate({
                            path: 'device',
                            select: 'code category',
                            populate: {
                                path: 'category',
                                select: 'name'
                            }
                        })
                        .populate('excavator', 'code')
                        .populate('toLocation', 'name')
                    reports = reports.filter(r =>
                        r.device?.category?.name?.toLowerCase().includes("vận tải".toLowerCase())
                    );
                    if (!reports.length) continue;
                    const grouped = groupReportsByExcavator(reports)

                    results.push({
                        _id: order._id,
                        createdBy: order.createdBy?.fullName || '',
                        assignedTo: (order.assignedTo?.fullName || '') + "-" + (order.assignedTo?.salaryCode || ''),
                        department: order.assignedTo?.department?.name || '',
                        code: order.device?.map(item => item?.code).join(', ') || [],
                        reports: grouped.map(g => ({
                            excavator: g.from?.code || '',
                            toLocation: g.to?.name || '',
                            distance: 0
                        })),
                        fuelRemain: order?.shiftReport?.vehicleSummaries.map(item => item?.fuelRemain) || [],
                        fuelReceived: order?.shiftReport?.vehicleSummaries.map(item => item?.fuelReceived) || [],
                        fuelRemainEnd: order?.shiftReport?.vehicleSummaries.map(item => item?.fuelRemainEnd) || [],
                        consume: order?.shiftReport?.vehicleSummaries?.map((item) => (item?.fuelRemain || 0) + (item?.fuelReceived || 0) - (item?.fuelRemainEnd || 0)) || []
                    });
                }


                let index = 1;
                let totalDataRows = 6;
                for (const item of results) {
                    const reps = item.reports && item.reports.length ? item.reports : [{ excavator: '', toLocation: '', distance: '' }];
                    const startRow = worksheet.lastRow ? worksheet.lastRow.number + 1 : 7; // 3 dòng đầu là info/title/header
                    const span = reps.length;
                    totalDataRows += reps.length;

                    reps.forEach((r, i) => {
                        worksheet.addRow([
                            i === 0 ? index : '',            // STT chỉ ở dòng đầu
                            i === 0 ? (item.createdBy || '') : '',
                            i === 0 ? (item.assignedTo || '') : '',
                            i === 0 ? (item.department || '') : '',
                            i === 0 ? (item.code || '') : '',
                            r.excavator || '',
                            r.toLocation ?? '',
                            r.distance ?? '',
                            i === 0 ? (item.fuelRemain || []).join('\n') : '',
                            i === 0 ? (item.fuelReceived || []).join('\n') : '',
                            i === 0 ? (item.consume || []).join('\n') : '',
                            '',
                            '',

                        ]);
                    });
                    if (span > 1) {
                        const endRow = startRow + span - 1;
                        ['A', 'B', 'C', 'D', 'E', 'I', 'J', 'K', 'L', 'M'].forEach((col) => worksheet.mergeCells(`${col}${startRow}:${col}${endRow}`));
                    }

                    // Căn giữa 4 cột đầu, trái 3 cột sau, bật wrapText cho 3 cột sau
                    for (let r = startRow; r < startRow + span; r++) {
                        ['A', 'B', 'C', 'D', 'E', 'I', 'J', 'K', 'L', 'M'].forEach((col) => {
                            const cell = worksheet.getCell(`${col}${r}`);
                            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                        });
                    }

                    index++;
                }

                addTableBorders(worksheet, 6, totalDataRows + 1, 1, 13);

                worksheet.pageSetup = {
                    paperSize: 9,                // A4
                    orientation: 'landscape',    // ngang
                    fitToPage: true,
                    fitToWidth: 1,               // vừa 1 trang theo chiều ngang
                    fitToHeight: 0,              // không ép theo chiều dọc
                    margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } // inch
                };


                worksheet.getColumn(1).width = 6;
                // worksheet.getColumn(1).alignment = { horizontal: 'center', vertical: 'middle', }
                worksheet.getColumn(2).width = 25;
                // worksheet.getColumn(2).alignment = { horizontal: 'center', vertical: 'middle', }
                worksheet.getColumn(3).width = 30;
                // worksheet.getColumn(3).alignment = { horizontal: 'center', vertical: 'middle', }
                worksheet.getColumn(4).width = 25;
                // worksheet.getColumn(4).alignment = { horizontal: 'center', vertical: 'middle', }
                worksheet.getColumn(5).width = 15;
                worksheet.getColumn(6).width = 15;
                worksheet.getColumn(7).width = 15;
                worksheet.getColumn(8).width = 15;
                worksheet.getColumn(9).width = 15;
                worksheet.getColumn(10).width = 15;
                worksheet.getColumn(11).width = 15;
                worksheet.getColumn(12).width = 15;
                worksheet.getColumn(13).width = 15;




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
                    if (rowNumber > 2) {
                        row.eachCell((cell) => {
                            if (!cell.font) cell.font = {};
                            cell.font.size = 12;
                        });
                    }
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
        req.logger.info(`✅ Export excel thành công`);

    } catch (err) {
        req.logger.error("❌ Lỗi khi export", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

// báo tổng hợp máy xúc
router.post('/excavatorReport/view', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER), async (req, res, next) => {
    try {
        const { shift, startDate, endDate, department } = req.body
        const user = req.user
        let query = {}
        if (user?.role === ROLE.ADMIN) {
            query.department = new mongoose.Types.ObjectId(department)
        } else {
            query.department = new mongoose.Types.ObjectId(user.department?._id)
        }
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
                        select: "code"
                    },
                ]
            })
            .populate({
                path: "assignedTo",
                select: "fullName salaryCode department",
                populate: {
                    path: 'department',
                    select: 'name'
                }
            })
            .populate('createdBy', 'fullName salaryCode')
            .populate({
                path: 'device',
                select: 'code category',
                populate: [{ path: 'category', select: 'name' }]
            })
            .populate({
                path: 'job',
                select: 'type',
            })
        const filteredOrders = orders.filter(order =>
            order.device?.some(d =>
                d.category?.name?.toLowerCase().includes("máy xúc")
            ) &&
            order.job?.type?.toLowerCase().includes("vận hành xúc".toLowerCase())
        );

        let index = 1
        const results = [];
        for (const order of filteredOrders) {
            const codes = await Report.find({ orderId: order._id })
                .populate('device', 'code')
                .then(reports => [...new Set(reports.map(r => r.device?.code).filter(Boolean))]);

            if (!codes.length) continue;

            results.push({
                _id: order._id,
                STT: index++,
                createdBy: order.createdBy?.fullName || '',
                assignedTo: (order.assignedTo?.fullName || '') + "-" + (order.assignedTo?.salaryCode || ''),
                department: order.assignedTo?.department?.name || '',
                excavator: order.device?.map(item => item.code).join(', ') || [],
                fuelRemain: order?.shiftReport?.vehicleSummaries.map(item => item?.fuelRemain) || [],
                fuelReceived: order?.shiftReport?.vehicleSummaries.map(item => item?.fuelReceived) || [],
                fuelRemainEnd: order?.shiftReport?.vehicleSummaries.map(item => item?.fuelRemainEnd) || [],
                consume: order?.shiftReport?.vehicleSummaries?.map((item) => (item?.fuelRemain || 0) + (item?.fuelReceived || 0) - (item?.fuelRemainEnd || 0)) || [],
                vehicle: codes,
                travelHours: order?.shiftReport?.vehicleSummaries.map(item => item?.travelHours) || [],
            });
        }

        res.status(200).send({ status: 'success', data: results })
    } catch (err) {
        req.logger.error("❌ Lỗi khi load", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
})
router.post('/excavatorReport', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER), async (req, res, next) => {
    try {
        const { shift, startDate, endDate, title, signature, department } = req.body
        const user = req.user
        const shiftList = await Shift.find({ _id: { $in: shift } });
        const start = new Date(startDate);
        const end = new Date(endDate);
        let dep;
        if (department) {
            dep = await Department.findById(department).select('name')
        } else {
            dep = user?.department
        }

        // Đảm bảo end không nhỏ hơn start
        if (end < start) return res.status(400).json({ message: "Ngày kết thúc phải sau ngày bắt đầu" });

        const workbook = new ExcelJS.Workbook();
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            for (const ca of shiftList) {
                const orders = await Order.find({
                    workingDate: d,
                    shift: ca._id,
                    department: new mongoose.Types.ObjectId(dep?._id)
                })
                    .populate({
                        path: "shiftReport",
                        populate: [
                            {
                                path: "vehicleSummaries.vehicle",
                                select: "code"
                            },
                        ]
                    })
                    .populate({
                        path: "assignedTo",
                        select: "fullName salaryCode department",
                        populate: {
                            path: 'department',
                            select: 'name'
                        }
                    })
                    .populate('createdBy', 'fullName salaryCode')
                    .populate({
                        path: 'device',
                        select: 'code category',
                        populate: [{ path: 'category', select: 'name' }]
                    })
                    .populate({
                        path: 'job',
                        select: 'type',
                    })
                const filteredOrders = orders.filter(order =>
                    order.device?.some(d =>
                        d.category?.name?.toLowerCase().includes("máy xúc")
                    ) &&
                    order.job?.type?.toLowerCase().includes("vận hành xúc".toLowerCase())
                );



                const sheetName = `${formatDate(d)}_${ca.name}`.replace(/[\\\/:*?\[\]]/g, '-').substring(0, 31);

                const worksheet = workbook.addWorksheet(sheetName);

                // === DÒNG 1: Tiêu đề bảng ===
                worksheet.mergeCells('A1:L2');
                const header = worksheet.getCell('A1');
                header.value = 'Tổng hợp số liệu trong ca (Máy xúc)';
                header.font = { bold: true, size: 16 };
                header.alignment = { horizontal: 'center', vertical: 'middle' };

                // === DÒNG 2–4: Thông tin người ra lệnh ===
                worksheet.getCell('B3').value = 'Ca';
                worksheet.getCell('B3').font = { bold: true };
                worksheet.getCell('C3').value = ca?.name;

                worksheet.getCell('E3').value = 'Ngày';
                worksheet.getCell('E3').font = { bold: true };
                worksheet.getCell('F3').value = formatDate(d);

                worksheet.getCell('B4').value = 'Đơn vị';
                worksheet.getCell('B4').font = { bold: true };
                worksheet.getCell('C4').value = dep?.name || '';

                worksheet.getCell('E4').value = 'Giờ hệ thống';
                worksheet.getCell('E4').font = { bold: true };
                worksheet.getCell('F4').value = new Date().toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                });

                worksheet.getCell('B5').value = 'Người ra lệnh';
                worksheet.getCell('B5').font = { bold: true };
                worksheet.getCell('C5').value = req.user?.fullName || '';

                worksheet.getCell('E5').value = 'Số thẻ';
                worksheet.getCell('E5').font = { bold: true };
                worksheet.getCell('F5').value = req.user?.salaryCode || '';

                worksheet.getCell('G5').value = 'Chức vụ';
                worksheet.getCell('G5').font = { bold: true };
                worksheet.getCell('H5').value = req.user?.position?.name || '';

                worksheet.mergeCells('A7:F7');
                worksheet.mergeCells('G7:I7'); // Nhiên liệu
                worksheet.getCell('G7').value = 'Nhiên liệu (lít)';
                worksheet.getCell('G7').alignment = { horizontal: 'center', vertical: 'middle' };
                worksheet.getCell('G7').font = { bold: true };
                worksheet.mergeCells('J7:L7');


                // === DÒNG 7: Header chi tiết ===
                const headerRow = worksheet.getRow(8);
                headerRow.values = [
                    'STT',
                    'Người tạo lệnh',
                    'Công nhân',
                    'Đơn vị',
                    'Biển số máy xúc',
                    'Thiết bị \nnhận tải',
                    'Tồn dầu',
                    'Lĩnh dầu',
                    'Tiêu thụ',
                    'Số giờ vận hành thực tế',
                    'Phụ cấp/ \nbồi dưỡng',
                    'Lương tạm tính'
                ];
                headerRow.font = { bold: true };
                headerRow.eachCell(cell => {
                    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                });

                let results = []
                for (const order of filteredOrders) {
                    const codes = await Report.find({ orderId: order._id })
                        .populate('device', 'code')
                        .then(reports => [...new Set(reports.map(r => r.device?.code).filter(Boolean))]);

                    if (!codes.length) continue;

                    results.push({
                        _id: order._id,
                        createdBy: order.createdBy?.fullName || '',
                        assignedTo: (order.assignedTo?.fullName || '') + "-" + (order.assignedTo?.salaryCode || ''),
                        department: order.assignedTo?.department?.name || '',
                        excavator: order.device?.map(item => item.code).join(', ') || [],
                        fuelRemain: order?.shiftReport?.vehicleSummaries.map(item => item?.fuelRemain) || [],
                        fuelReceived: order?.shiftReport?.vehicleSummaries.map(item => item?.fuelReceived) || [],
                        fuelRemainEnd: order?.shiftReport?.vehicleSummaries.map(item => item?.fuelRemainEnd) || [],
                        consume: order?.shiftReport?.vehicleSummaries?.map((item) => (item?.fuelRemain || 0) + (item?.fuelReceived || 0) - (item?.fuelRemainEnd || 0)) || [],
                        vehicle: codes,
                        travelHours: order?.shiftReport?.vehicleSummaries.map(item => item?.travelHours) || [],
                    });
                }


                let index = 1;
                let totalDataRows = 7;
                for (const item of results) {
                    const reps = item.vehicle && item.vehicle.length ? item.vehicle : [];
                    const startRow = worksheet.lastRow ? worksheet.lastRow.number + 1 : 7; // 3 dòng đầu là info/title/header
                    const span = reps.length;
                    totalDataRows += reps.length;
                    reps.forEach((r, i) => {
                        worksheet.addRow([
                            i === 0 ? index : '',            // STT chỉ ở dòng đầu
                            i === 0 ? (item.createdBy || '') : '',
                            i === 0 ? (item.assignedTo || '') : '',
                            i === 0 ? (item.department || '') : '',
                            i === 0 ? (item.excavator || '') : '',
                            (r || '') || '',
                            i === 0 ? (item.fuelRemain || []).join('\n') : '',
                            i === 0 ? (item.fuelReceived || []).join('\n') : '',
                            i === 0 ? (item.consume || []).join('\n') : '',
                            i === 0 ? (item.travelHours || []).join('\n') : '',
                            i === 0 ? '' : '',
                            i === 0 ? '' : '',

                        ]);
                    })
                    if (span > 1) {
                        const endRow = startRow + span - 1;
                        ['A', 'B', 'C', 'D', 'E', 'G', 'H', 'I', 'J', 'K', 'L'].forEach((col) => worksheet.mergeCells(`${col}${startRow}:${col}${endRow}`));
                    }

                    // Căn giữa 4 cột đầu, trái 3 cột sau, bật wrapText cho 3 cột sau
                    for (let r = startRow; r < startRow + span; r++) {
                        ['A', 'B', 'C', 'D', 'E', 'G', 'H', 'I', 'J', 'K', 'L'].forEach((col) => {
                            const cell = worksheet.getCell(`${col}${r}`);
                            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                        });
                    }
                    index++;
                }

                addTableBorders(worksheet, 7, totalDataRows + 2, 1, 12);

                worksheet.pageSetup = {
                    paperSize: 9,                // A4
                    orientation: 'landscape',    // ngang
                    fitToPage: true,
                    fitToWidth: 1,               // vừa 1 trang theo chiều ngang
                    fitToHeight: 0,              // không ép theo chiều dọc
                    margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } // inch
                };


                worksheet.getColumn(1).width = 6;
                // worksheet.getColumn(1).alignment = { horizontal: 'center', vertical: 'middle', }
                worksheet.getColumn(2).width = 25;
                // worksheet.getColumn(2).alignment = { horizontal: 'center', vertical: 'middle', }
                worksheet.getColumn(3).width = 30;
                // worksheet.getColumn(3).alignment = { horizontal: 'center', vertical: 'middle', }
                worksheet.getColumn(4).width = 25;
                // worksheet.getColumn(4).alignment = { horizontal: 'center', vertical: 'middle', }
                worksheet.getColumn(5).width = 15;
                worksheet.getColumn(6).width = 20;
                worksheet.getColumn(7).width = 12;
                worksheet.getColumn(8).width = 12;
                worksheet.getColumn(9).width = 12;
                worksheet.getColumn(10).width = 15;
                worksheet.getColumn(11).width = 15;
                worksheet.getColumn(12).width = 15;


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
                    if (rowNumber > 2) {
                        row.eachCell((cell) => {
                            if (!cell.font) cell.font = {};
                            cell.font.size = 12;
                        });
                    }
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
        req.logger.info(`✅ Export excel thành công`);

    } catch (err) {
        req.logger.error("❌ Lỗi khi export", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
});

// báo chuyến máy xúc

router.post('/excavatorTripReport/view', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER), async (req, res, next) => {
    try {
        const { shift, startDate, endDate, department } = req.body
        const user = req.user
        let query = {}
        if (user?.role === ROLE.ADMIN) {
            query.department = new mongoose.Types.ObjectId(department)
        } else {
            query.department = new mongoose.Types.ObjectId(user.department?._id)
        }
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
                path: 'assignedTo',
                select: 'fullName salaryCode department',
                populate: ('department')
            })
            .populate({
                path: 'createdBy',
                select: 'fullName',
            })
            .populate({
                path: "device",
                select: "code category",
                populate: {
                    path: 'category',
                    select: "name"
                }
            })
            .populate({
                path: 'job',
                select: 'type',
            })
        const filteredOrders = orders.filter(order =>
            order.device?.some(d =>
                d.category?.name?.toLowerCase().includes("máy xúc")
            ) &&
            order.job?.type?.toLowerCase().includes("vận hành xúc".toLowerCase())
        );

        let result = []
        for (const order of filteredOrders) {
            let reports = await Report.find({ orderId: order._id })
                .populate({
                    path: 'device',
                    select: 'code category',
                    populate: {
                        path: 'category',
                        select: 'name'
                    }
                })
                .populate('material', 'name')
            if (!reports.length) continue;
            const grouped = groupReportsForProduct(reports)

            result.push({
                _id: order._id,
                fullName: order?.createdBy?.fullName,
                salaryCode: (order?.assignedTo?.fullName || "") + "-" + (order?.assignedTo?.salaryCode || ""),
                department: order?.assignedTo?.department?.name,
                excavator: order?.device.map(i => i?.code).join(','),
                reports: grouped.map(g => ({
                    code: g.device?.code || '',
                    material: g.material?.name || '',
                    tripCount: g?.quantity || '',
                }))
            });
        }


        res.status(200).send({ status: 'success', data: result })
    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
})

router.post('/excavatorTripReport', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER), async (req, res, next) => {
    try {
        const { shift, startDate, endDate, title, signature, department } = req.body
        const shiftList = await Shift.find({ _id: { $in: shift } });
        const start = new Date(startDate);
        const end = new Date(endDate);
        const user = req.user
        let dep;
        if (department) {
            dep = await Department.findById(department).select('name')
        } else {
            dep = user?.department
        }

        // Đảm bảo end không nhỏ hơn start
        if (end < start) return res.status(400).json({ message: "Ngày kết thúc phải sau ngày bắt đầu" });

        const workbook = new ExcelJS.Workbook();
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            for (const ca of shiftList) {
                const orders = await Order.find({
                    workingDate: d,
                    shift: ca._id,
                    department: new mongoose.Types.ObjectId(dep?._id)
                })
                    .populate({
                        path: 'assignedTo',
                        select: 'fullName salaryCode department',
                        populate: ('department')
                    })
                    .populate({
                        path: 'createdBy',
                        select: 'fullName',
                    })
                    .populate({
                        path: "device",
                        select: "code category",
                        populate: {
                            path: 'category',
                            select: "name"
                        }
                    })
                    .populate({
                        path: 'job',
                        select: 'type',
                    })
                const filteredOrders = orders.filter(order =>
                    order.device?.some(d =>
                        d.category?.name?.toLowerCase().includes("máy xúc")
                    ) &&
                    order.job?.type?.toLowerCase().includes("vận hành xúc".toLowerCase())
                );

                let result = []
                for (const order of filteredOrders) {
                    let reports = await Report.find({ orderId: order._id })
                        .populate({
                            path: 'device',
                            select: 'code category',
                            populate: {
                                path: 'category',
                                select: 'name'
                            }
                        })
                        .populate('material', 'name')
                    if (!reports.length) continue;
                    const grouped = groupReportsForProduct(reports)

                    result.push({
                        _id: order._id,
                        fullName: order?.createdBy?.fullName,
                        salaryCode: (order?.assignedTo?.fullName || "") + "-" + (order?.assignedTo?.salaryCode || ""),
                        department: order?.assignedTo?.department?.name,
                        excavator: order?.device.map(i => i?.code).join(','),
                        reports: grouped.map(g => ({
                            code: g.device?.code || '',
                            material: g.material?.name || '',
                            tripCount: g?.quantity || '',
                        }))
                    });
                }

                const sheetName = `${formatDate(d)}_${ca.name}`.replace(/[\\\/:*?\[\]]/g, '-').substring(0, 31);

                const worksheet = workbook.addWorksheet(sheetName);

                worksheet.mergeCells('A1:G1');
                const infoRow = worksheet.getCell('A1');
                infoRow.value = `Ca: ${ca.name}, ngày: ${formatDate(d)}         Tên cán bộ:`;
                infoRow.font = { italic: true, size: 14 };
                infoRow.alignment = { horizontal: 'left', vertical: 'middle' };
                // Tiêu đề bảng
                worksheet.mergeCells('A3:G3');
                const header = worksheet.getCell('A3');
                header.value = 'DANH SÁCH CHUYẾN MÁY XÚC';
                header.font = { bold: true, size: 16 };
                header.alignment = { horizontal: 'center', vertical: 'middle' };

                const headerRowNumber = 5;
                const headers = [
                    'STT',
                    'Người tạo lệnh',
                    'Công nhân',
                    'Đơn vị',
                    'Biển số máy vận hành',
                    'Vật liệu',
                    'Số chuyến'
                ];

                headers.forEach((text, index) => {
                    const cell = worksheet.getRow(headerRowNumber).getCell(index + 1);
                    cell.value = text;
                    cell.font = { bold: true };
                    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                });

                let index = 1;
                let totalDataRows = 5;
                for (const item of result) {
                    const reps = item.reports && item.reports.length ? item.reports : [{ code: '', material: '', tripCount: '' }];
                    const startRow = worksheet.lastRow ? worksheet.lastRow.number + 1 : 4; // 3 dòng đầu là info/title/header
                    const span = reps.length;
                    totalDataRows += reps.length;

                    reps.forEach((r, i) => {
                        worksheet.addRow([
                            i === 0 ? index : '',            // STT chỉ ở dòng đầu
                            i === 0 ? (item.fullName || '') : '',
                            i === 0 ? (item.salaryCode || '') : '',
                            i === 0 ? (item.department || '') : '',
                            i === 0 ? (item.excavator || '') : '',
                            r.material || '',
                            r.tripCount ?? '',
                        ]);
                    });
                    if (span > 1) {
                        const endRow = startRow + span - 1;
                        ['A', 'B', 'C', 'D', 'E'].forEach((col) => worksheet.mergeCells(`${col}${startRow}:${col}${endRow}`));
                    }

                    // Căn giữa 4 cột đầu, trái 3 cột sau, bật wrapText cho 3 cột sau
                    for (let r = startRow; r < startRow + span; r++) {
                        ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach((col) => {
                            const cell = worksheet.getCell(`${col}${r}`);
                            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                        });
                    }

                    index++;
                }

                addTableBorders(worksheet, 5, totalDataRows, 1, 7);

                worksheet.pageSetup = {
                    paperSize: 9,                // A4
                    orientation: 'landscape',    // ngang
                    fitToPage: true,
                    fitToWidth: 1,               // vừa 1 trang theo chiều ngang
                    fitToHeight: 0,              // không ép theo chiều dọc
                    margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } // inch
                };


                worksheet.getColumn(1).width = 6;
                worksheet.getColumn(1).alignment = { horizontal: 'center', vertical: 'middle', }
                worksheet.getColumn(2).width = 25;
                worksheet.getColumn(2).alignment = { horizontal: 'center', vertical: 'middle', }
                worksheet.getColumn(3).width = 50;
                worksheet.getColumn(3).alignment = { horizontal: 'center', vertical: 'middle', }
                worksheet.getColumn(4).width = 25;
                worksheet.getColumn(4).alignment = { horizontal: 'center', vertical: 'middle', }
                worksheet.getColumn(5).width = 20;
                worksheet.getColumn(6).width = 25;
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
        req.logger.info(`✅ Export excel thành công`);

    } catch (err) {
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
})

// báo chuyến ô tô

router.post('/carTripReport/view', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER), async (req, res, next) => {
    try {
        const { shift, startDate, endDate, department } = req.body
        const user = req.user
        let query = {}
        if (user?.role === ROLE.ADMIN) {
            query.department = new mongoose.Types.ObjectId(department)
        } else {
            query.department = new mongoose.Types.ObjectId(user.department?._id)
        }
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
                path: 'assignedTo',
                select: 'fullName salaryCode department',
                populate: ('department')
            })
            .populate({
                path: 'createdBy',
                select: 'fullName',
            })
            .populate({
                path: 'job',
                select: 'type',
            })
        const filterOrders = orders.filter(r =>
            r.job?.type?.toLowerCase().includes("vận hành xe".toLowerCase())
        );

        let result = []
        for (const order of filterOrders) {
            let reports = await Report.find({ orderId: order._id })
                .populate({
                    path: 'device',
                    select: 'code category',
                    populate: {
                        path: 'category',
                        select: 'name'
                    }
                })
                .populate('material', 'name')
            reports = reports.filter(r =>
                r.device?.category?.name?.toLowerCase().includes("vận tải".toLowerCase())
            );
            if (!reports.length) continue;
            const grouped = groupReportsForProduct(reports)

            result.push({
                _id: order._id,
                fullName: order?.createdBy?.fullName,
                salaryCode: (order?.assignedTo?.fullName || "") + "-" + (order?.assignedTo?.salaryCode || ""),
                department: order?.assignedTo?.department?.name,
                reports: grouped.map(g => ({
                    code: g.device?.code || '',
                    material: g.material?.name || '',
                    tripCount: g?.quantity || '',
                }))
            });
        }

        res.status(200).send({ status: 'success', data: result })
    } catch (err) {
        req.logger.error("❌ Lỗi khi load", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
})

router.post('/carTripReport', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER), async (req, res, next) => {
    try {
        const { shift, startDate, endDate, title, signature, department } = req.body
        const shiftList = await Shift.find({ _id: { $in: shift } });
        const start = new Date(startDate);
        const end = new Date(endDate);
        const user = req.user
        let dep;
        if (department) {
            dep = await Department.findById(department).select('name')
        } else {
            dep = user?.department
        }

        // Đảm bảo end không nhỏ hơn start
        if (end < start) return res.status(400).json({ message: "Ngày kết thúc phải sau ngày bắt đầu" });

        const workbook = new ExcelJS.Workbook();
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            for (const ca of shiftList) {
                const orders = await Order.find({
                    workingDate: d,
                    shift: ca._id,
                    department: new mongoose.Types.ObjectId(dep?._id)
                })
                    .populate({
                        path: 'assignedTo',
                        select: 'fullName salaryCode department',
                        populate: ('department')
                    })
                    .populate({
                        path: 'createdBy',
                        select: 'fullName',
                    })
                    .populate({
                        path: 'job',
                        select: 'type',
                    })
                const filterOrders = orders.filter(r =>
                    r.job?.type?.toLowerCase().includes("vận hành xe".toLowerCase())
                );

                let result = []
                for (const order of filterOrders) {
                    let reports = await Report.find({ orderId: order._id })
                        .populate({
                            path: 'device',
                            select: 'code category',
                            populate: {
                                path: 'category',
                                select: 'name'
                            }
                        })
                        .populate('material', 'name')
                    reports = reports.filter(r =>
                        r.device?.category?.name?.toLowerCase().includes("vận tải".toLowerCase())
                    );
                    if (!reports.length) continue;

                    const grouped = groupReportsForProduct(reports)

                    result.push({
                        _id: order._id,
                        fullName: order?.createdBy?.fullName,
                        salaryCode: (order?.assignedTo?.fullName || "") + "-" + (order?.assignedTo?.salaryCode || ""),
                        department: order?.assignedTo?.department?.name,
                        reports: grouped.map(g => ({
                            code: g.device?.code || '',
                            material: g.material?.name || '',
                            tripCount: g?.quantity || '',
                        }))
                    });
                }

                const sheetName = `${formatDate(d)}_${ca.name}`.replace(/[\\\/:*?\[\]]/g, '-').substring(0, 31);

                const worksheet = workbook.addWorksheet(sheetName);

                worksheet.mergeCells('A1:G1');
                const infoRow = worksheet.getCell('A1');
                infoRow.value = `Ca: ${ca.name}, ngày: ${formatDate(d)}         Tên cán bộ:`;
                infoRow.font = { italic: true, size: 14 };
                infoRow.alignment = { horizontal: 'left', vertical: 'middle' };
                // Tiêu đề bảng
                worksheet.mergeCells('A3:G3');
                const header = worksheet.getCell('A3');
                header.value = 'DANH SÁCH CHUYẾN Ô TÔ';
                header.font = { bold: true, size: 16 };
                header.alignment = { horizontal: 'center', vertical: 'middle' };

                const headerRowNumber = 5;
                const headers = [
                    'STT',
                    'Người tạo lệnh',
                    'Công nhân',
                    'Đơn vị',
                    'Biển số ô tô',
                    'Vật liệu',
                    'Số chuyến'
                ];

                headers.forEach((text, index) => {
                    const cell = worksheet.getRow(headerRowNumber).getCell(index + 1);
                    cell.value = text;
                    cell.font = { bold: true };
                    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                });

                let index = 1;
                let totalDataRows = 5;
                for (const item of result) {
                    const reps = item.reports && item.reports.length ? item.reports : [{ code: '', material: '', tripCount: '' }];
                    const startRow = worksheet.lastRow ? worksheet.lastRow.number + 1 : 4; // 3 dòng đầu là info/title/header
                    const span = reps.length;
                    totalDataRows += reps.length;

                    reps.forEach((r, i) => {
                        worksheet.addRow([
                            i === 0 ? index : '',            // STT chỉ ở dòng đầu
                            i === 0 ? (item.fullName || '') : '',
                            i === 0 ? (item.salaryCode || '') : '',
                            i === 0 ? (item.department || '') : '',
                            r.code || '',
                            r.material || '',
                            r.tripCount ?? '',
                        ]);
                    });
                    if (span > 1) {
                        const endRow = startRow + span - 1;
                        ['A', 'B', 'C', 'D'].forEach((col) => worksheet.mergeCells(`${col}${startRow}:${col}${endRow}`));
                    }

                    // Căn giữa 4 cột đầu, trái 3 cột sau, bật wrapText cho 3 cột sau
                    for (let r = startRow; r < startRow + span; r++) {
                        ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach((col) => {
                            const cell = worksheet.getCell(`${col}${r}`);
                            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                        });
                    }

                    index++;
                }

                addTableBorders(worksheet, 5, totalDataRows, 1, 7);

                worksheet.pageSetup = {
                    paperSize: 9,                // A4
                    orientation: 'landscape',    // ngang
                    fitToPage: true,
                    fitToWidth: 1,               // vừa 1 trang theo chiều ngang
                    fitToHeight: 0,              // không ép theo chiều dọc
                    margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } // inch
                };


                worksheet.getColumn(1).width = 6;
                worksheet.getColumn(1).alignment = { horizontal: 'center', vertical: 'middle', }
                worksheet.getColumn(2).width = 25;
                worksheet.getColumn(2).alignment = { horizontal: 'center', vertical: 'middle', }
                worksheet.getColumn(3).width = 50;
                worksheet.getColumn(3).alignment = { horizontal: 'center', vertical: 'middle', }
                worksheet.getColumn(4).width = 25;
                worksheet.getColumn(5).width = 20;
                worksheet.getColumn(6).width = 25;
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
        req.logger.info(`✅ Export excel thành công`);

    } catch (err) {
        req.logger.error("❌ Lỗi khi export", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
})

// báo sản lượng

router.post('/productReport/view', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER), async (req, res, next) => {
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
        req.logger.error("❌ Lỗi khi load", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
})

router.post('/productReport', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER), async (req, res, next) => {
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
        req.logger.error("❌ Lỗi khi export", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
})

// báo công

router.post('/worklog/view', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER), async (req, res, next) => {
    try {
        const { shift, startDate, endDate, department } = req.body
        const user = req.user
        let query = {
            status: { $in: [STATUS_ORDER.INPROGRESS, STATUS_ORDER.COMPLETED, STATUS_ORDER.WARNING] }
        };
        if (user?.role === ROLE.ADMIN) {
            query.department = new mongoose.Types.ObjectId(department)
        } else {
            query.department = new mongoose.Types.ObjectId(user.department?._id)
        }
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
            .map(order => ({
                _id: order._id,
                fullName: order.assignedTo?.fullName,
                salaryCode: order.assignedTo?.salaryCode,
                device: order.device?.map(d => d.code).join(','),
                job: order.job?.name,
            }));

        res.status(200).send({ status: 'success', data: formattedData })
    } catch (err) {
        req.logger.error("❌ Lỗi khi load", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
})

router.post('/worklog', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER), async (req, res, next) => {
    try {
        const { shift, startDate, endDate, department, signature } = req.body
        const user = req.user
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
                    status: { $in: [STATUS_ORDER.INPROGRESS, STATUS_ORDER.COMPLETED, STATUS_ORDER.WARNING] },
                    department: user?.role === ROLE.ADMIN ? new mongoose.Types.ObjectId(department) : new mongoose.Types.ObjectId(user.department?._id)
                })
                    .populate('assignedTo', 'fullName salaryCode department')
                    .populate('job', 'name')
                    .populate('device', 'code')
                    .populate('shiftReport')
                console.log(orders)
                const formattedData = orders
                    .map(order => ({
                        _id: order._id,
                        fullName: order.assignedTo?.fullName,
                        salaryCode: order.assignedTo?.salaryCode,
                        device: order.device?.map(d => d.code).join(','),
                        job: order.job?.name,
                    }));
                const sheetName = `${formatDate(d)}_${ca.name}`.replace(/[\\\/:*?\[\]]/g, '-').substring(0, 31);

                const worksheet = workbook.addWorksheet(sheetName);

                // --- HEADER ---
                worksheet.mergeCells('A1:I1');
                worksheet.getCell('A1').value = `Ca: ${ca.name}, ngày: ${formatDate(d)}         Tên cán bộ: ${req.user?.fullName}`;
                worksheet.getCell('A1').font = { italic: true, size: 12 };
                worksheet.getCell('A1').alignment = { horizontal: 'left', vertical: 'middle' };

                worksheet.mergeCells('A2:I2');
                worksheet.getCell('A2').value = "Báo công hàng ngày";
                worksheet.getCell('A2').font = { bold: true, size: 14 };
                worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
                const headerRow = worksheet.getRow(3);
                headerRow.values = [
                    "STT",
                    "Họ và tên",
                    "Số thẻ",
                    "Thiết bị vận hành,\n vị trí làm việc",
                    "Vị trí ăn",
                    "Lương cấp bậc\n 1 ngày",
                    "Lương sản phẩm",
                    "Nội dung công việc",
                    "Ghi chú",
                ];
                headerRow.eachCell((cell) => {
                    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                    cell.font = { bold: true, size: 10 }; // hoặc 14 cho rõ
                });


                // --- DATA ---

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
                addTableBorders(worksheet, 3, formattedData.length + 3, 1, 9);


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
                worksheet.mergeCells(`C${length + 7}:D${length + 7}`);
                worksheet.getCell(`C${length + 7}`).value = "TỔ TRƯỞNG";
                worksheet.getCell(`C${length + 7}`).alignment = { horizontal: 'center', vertical: 'middle' };
                worksheet.getCell(`C${length + 7}`).font = { bold: true };

                // Merge ô H..I và ghi "QUẢN ĐỐC"
                worksheet.mergeCells(`H${length + 7}:I${length + 7}`);
                worksheet.getCell(`H${length + 7}`).value = "QUẢN ĐỐC";
                worksheet.getCell(`H${length + 7}`).alignment = { horizontal: 'center', vertical: 'middle' };
                worksheet.getCell(`H${length + 7}`).font = { bold: true };


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
        req.logger.info(`✅ Export excel thành công`);

    } catch (err) {
        req.logger.error("❌ Lỗi khi export", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
})

// báo ăn

router.post('/meal_request/view', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER), async (req, res, next) => {
    try {
        const { shift, startDate, endDate, department } = req.body
        const user = req.user
        let query = {
            status: { $in: [STATUS_ORDER.INPROGRESS, STATUS_ORDER.COMPLETED, STATUS_ORDER.WARNING] }
        };
        if (user?.role === ROLE.ADMIN) {
            query.department = new mongoose.Types.ObjectId(department)
        } else {
            query.department = new mongoose.Types.ObjectId(user.department?._id)
        }

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
        req.logger.error("❌ Lỗi khi load", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
})

router.post('/meal_request', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER), async (req, res, next) => {
    try {
        const { shift, startDate, endDate, department, signature } = req.body
        const user = req.user
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
                    department: user?.role === ROLE.ADMIN ? new mongoose.Types.ObjectId(department) : new mongoose.Types.ObjectId(user.department?._id),
                    status: { $in: [STATUS_ORDER.INPROGRESS, STATUS_ORDER.COMPLETED, STATUS_ORDER.WARNING] }
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
                addTableBorders(worksheet, 3, formattedData.length + 3, 1, 7);

                worksheet.columns = [
                    { key: 'A', width: 10 },
                    { key: 'B', width: 25 },
                    { key: 'C', width: 10 },
                    { key: 'D', width: 15 },
                    { key: 'E', width: 25 },
                    { key: 'F', width: 15 },
                    { key: 'G', width: 15 },
                ];



                const length = formattedData.length
                worksheet.mergeCells(`E${length + 7}:G${length + 7}`);
                worksheet.getCell(`E${length + 7}`).value = "CÁN BỘ ĐI CA";
                worksheet.getCell(`E${length + 7}`).alignment = { horizontal: 'center', vertical: 'middle' };
                worksheet.getCell(`E${length + 7}`).font = { bold: true };


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
        req.logger.info(`✅ Export excel thành công`);

    } catch (err) {
        req.logger.error("❌ Lỗi khi export", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
})

router.post('/assignmentTo', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER), async (req, res, next) => {
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
                    status: { $nin: [STATUS_ORDER.PENDING, STATUS_ORDER.CANCEL] }
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
        req.logger.info(`✅ Export excel thành công`);
    }
    catch (err) {
        req.logger.error("❌ Lỗi khi export", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })
    }
})
router.post('/assignmentManager', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER), async (req, res, next) => {
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
                    status: { $nin: [STATUS_ORDER.PENDING, STATUS_ORDER.CANCEL] }
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
        req.logger.info(`✅ Export excel thành công`);

    }
    catch (err) {
        req.logger.error("❌ Lỗi khi export", err);
        res.status(500).send({ status: 'error', message: err.message, stack: err.stack })

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
    const lightBorder = { style: 'thin', color: "black" };

    for (let r = startRow; r <= endRow; r++) {
        const row = ws.getRow(r);
        for (let c = startCol; c <= endCol; c++) {
            const cell = row.getCell(c);

            cell.border = {
                top: lightBorder,
                bottom: lightBorder,
                left: lightBorder,
                right: lightBorder,
            };
        }
    }
};
module.exports = router; 