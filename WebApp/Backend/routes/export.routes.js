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
const { groupTripsVehicle, getCombinedUsers, groupTripsExcavator, groupTripsCar, groupExcavator, groupDozer, groupDrill, groupCar } = require('../utils/reportGrouping');
const { ROLE, STATUS_ORDER, JOB_TYPE } = require('../config/config');
// lệnh sx
router.post('/order/bulk', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER), async (req, res, next) => {
    try {
        const { ids } = req.body; // mảng entity id

        if (!Array.isArray(ids) || ids.length === 0) {
            req.logger.error("❌ Chọn bản ghi tải xuống");
            return res.status(400).json({ status: 'error', message: 'Chọn bản ghi cần tải xuống' });
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
            .populate('repairDepartment', 'code')
            .populate('excavator.device', 'code')
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
            } else if (jobType === JOB_TYPE.VAN_HANH_XE_PHUC_VU) {
                await buildVehicleService(order, workbook);
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
        res.status(500).json({ status: 'error', message: err.message, stack: err.stack })
    }
})

async function buildVehicle(order, workbook) {
    const reports = await Report.find({ orderId: order._id })
        .populate({
            path: "device",
            select: 'code material',
            populate: { path: 'material', selcct: 'name value' }
        })
        .populate("material", "name")
        .populate("excavator", "code")
        .populate("fromLocation", "name")
        .populate("toLocation", "name")
    const sheetName = `${order.assignedTo?.username}_${formatDate(order.workingDate)}_${order.shift?.name}_${order._id}`.replace(/[\\\/:*?\[\]]/g, '-').substring(0, 31);

    const worksheet = workbook.addWorksheet(sheetName);

    // Tiêu đề bảng
    worksheet.mergeCells('A1:N2');
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
    worksheet.mergeCells('J5:N5')
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
    worksheet.mergeCells('J6:N6')
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
        worksheet.mergeCells(`J${row}:N${row}`)
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
    worksheet.mergeCells(`A${rowHeader1}:N${rowHeader1}`);
    const product = worksheet.getCell(`A${rowHeader1}`);
    product.value = `I. SẢN PHẨM`;
    product.font = { bold: true, size: 14 };
    product.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(rowHeader1).height = 30;

    worksheet.getCell(`A${rowHeader1 + 1}`).value = 'STT';
    worksheet.getCell(`B${rowHeader1 + 1}`).value = 'Thiết bị vận hành';
    worksheet.getCell(`C${rowHeader1 + 1}`).value = 'Máy xúc';
    worksheet.getCell(`D${rowHeader1 + 1}`).value = 'Điểm đổ tải';
    worksheet.getCell(`E${rowHeader1 + 1}`).value = 'Vật liệu';
    worksheet.getCell(`F${rowHeader1 + 1}`).value = 'Số chuyến thực hiện';
    worksheet.getCell(`G${rowHeader1 + 1}`).value = 'Cung độ \n tạm tính';
    worksheet.getCell(`H${rowHeader1 + 1}`).value = 'Thời gian';
    worksheet.getCell(`I${rowHeader1 + 1}`).value = 'Khối lượng \n tạm tính \n(m3)';
    worksheet.getCell(`J${rowHeader1 + 1}`).value = 'Trọng lượng \n tạm tính \n (tấn)';
    worksheet.getCell(`K${rowHeader1 + 1}`).value = 'Sản lượng \n tạm tính \n(tkm)';
    worksheet.getCell(`L${rowHeader1 + 1}`).value = 'Nhiên liệu \n định mức';
    worksheet.getCell(`M${rowHeader1 + 1}`).value = 'Điểm lương \n tạm tính';
    worksheet.getCell(`N${rowHeader1 + 1}`).value = 'Ghi chú';

    const headerRow = worksheet.getRow(rowHeader1 + 1);
    for (let col = 1; col <= 14; col++) {
        const cell = headerRow.getCell(col);
        cell.font = { bold: true };
        cell.alignment = {
            ...cell.alignment,
            wrapText: true,
            vertical: 'middle',
            horizontal: 'center',
        };
    }

    const grouped = await groupTripsVehicle(reports, order.workingDate, order.shift)

    let rowIndexTrip = rowHeader1 + 2;
    grouped.forEach((g, i) => {
        worksheet.getCell(`A${rowIndexTrip}`).value = i + 1;
        worksheet.getCell(`A${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.getCell(`B${rowIndexTrip}`).value = g?.device?.code || '';
        worksheet.getCell(`B${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.getCell(`C${rowIndexTrip}`).value = g.excavator?.code || '';
        worksheet.getCell(`C${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.getCell(`D${rowIndexTrip}`).value = g.location?.name || '';
        worksheet.getCell(`D${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.getCell(`E${rowIndexTrip}`).value = g.material?.name || '';
        worksheet.getCell(`E${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.getCell(`F${rowIndexTrip}`).value = g?.quantity || '';
        worksheet.getCell(`F${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        const distances = (g.timeLogs || [])
            .map(item => item.distance)
            .join('\n');

        worksheet.getCell(`G${rowIndexTrip}`).value = distances
        worksheet.getCell(`G${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        const timesText = (g.timeLogs || [])
            .map(item => item.time.toLocaleTimeString('vi-VN'))
            .join('\n');

        worksheet.getCell(`H${rowIndexTrip}`).value = timesText
        worksheet.getCell(`H${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        setAutoRowHeight(worksheet.getRow(rowIndexTrip), timesText);
        worksheet.getCell(`I${rowIndexTrip}`).value = g.totalCubicMeter || 0;
        worksheet.getCell(`I${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.getCell(`J${rowIndexTrip}`).value = g.totalTon || 0;
        worksheet.getCell(`J${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.getCell(`K${rowIndexTrip}`).value = String(g.production || 0);
        worksheet.getCell(`K${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        worksheet.getCell(`L${rowIndexTrip}`).value = "";
        worksheet.getCell(`M${rowIndexTrip}`).value = "";
        worksheet.getCell(`N${rowIndexTrip}`).value = "";
        rowIndexTrip++;
    })
    const totalRow = rowIndexTrip + 1;

    worksheet.mergeCells(`A${totalRow}:B${totalRow}`);
    worksheet.getCell(`A${totalRow}`).value = 'Tổng cộng';
    worksheet.getCell(`A${totalRow}`).font = { bold: true };
    worksheet.getCell(`A${totalRow}`).alignment = { horizontal: 'right' }

    worksheet.mergeCells(`C${totalRow}:F${totalRow}`);
    worksheet.getCell(`C${totalRow}`).value = reports.reduce((sum, report) => { return sum + report.quantity }, 0) || '';
    worksheet.getCell(`C${totalRow}`).font = { bold: true };

    worksheet.getCell(`I${totalRow}`).value = grouped.reduce((sum, report) => { return sum + report.totalCubicMeter }, 0) || '';
    worksheet.getCell(`I${totalRow}`).font = { bold: true };
    worksheet.getCell(`J${totalRow}`).value = grouped.reduce((sum, report) => { return sum + report.totalTon }, 0) || '';
    worksheet.getCell(`J${totalRow}`).font = { bold: true };
    worksheet.getCell(`K${totalRow}`).value = grouped.reduce((sum, report) => { return sum + report.production }, 0) || '';
    worksheet.getCell(`K${totalRow}`).font = { bold: true };

    worksheet.mergeCells(`L${totalRow}:N${totalRow}`);
    worksheet.getCell(`L${totalRow}`).value = '';

    worksheet.mergeCells(`A${totalRow + 1}:L${totalRow + 1}`);
    worksheet.getCell(`A${totalRow + 1}`).value = 'Mức bồi dưỡng (x1000đ):';

    worksheet.mergeCells(`A${totalRow + 2}:N${totalRow + 2}`);
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
    worksheet.mergeCells(`J${totalRow + 3}:N${totalRow + 3}`)
    worksheet.getCell(`J${totalRow + 3}`).value = 'Ghi chú';
    worksheet.getCell(`J${totalRow + 3}`).font = { bold: true };
    worksheet.getCell(`J${totalRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle' };


    const fuelHeaderRow = totalRow + 4;

    let index = 0;
    for (let d of (order.device || [{}])) {
        const rep = (order.shiftReport?.vehicleSummaries || []).find(i => i?.vehicle?._id.toString() === d._id.toString());
        const currentRow = fuelHeaderRow + index;
        worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
        worksheet.getCell(`A${currentRow}`).value = d?.code || '';
        worksheet.getCell(`C${currentRow}`).value = rep?.fuelRemain || '';
        worksheet.getCell(`D${currentRow}`).value = rep?.fuelReceived || '';
        worksheet.getCell(`E${currentRow}`).value = rep?.fuelRemainEnd || '';
        worksheet.getCell(`F${currentRow}`).value =
            (rep?.fuelRemain ?? 0) + (rep?.fuelReceived ?? 0) - (rep?.fuelRemainEnd ?? 0);

        worksheet.getCell(`G${currentRow}`).value = '';

        worksheet.getCell(`H${currentRow}`).value = '';
        worksheet.getCell(`I${currentRow}`).value = '';

        worksheet.mergeCells(`J${currentRow}:N${currentRow}`);
        worksheet.getCell(`J${currentRow}`).value = '';
        index++
    }

    const fuelEndRow = fuelHeaderRow + index

    addTableBorders(worksheet, rowHeader1, fuelEndRow, 1, 14);

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
        { key: 'B', width: 20 },  // Nhận tải
        { key: 'C', width: 12 },  // Đổ tải
        { key: 'D', width: 14 },  // Loại hàng
        { key: 'E', width: 14 },  // Cung độ tạm tính
        { key: 'F', width: 14 },  // Chiều cao nâng tải
        { key: 'G', width: 14 },  // Số chuyến
        { key: 'H', width: 10 },  // Khối lượng
        { key: 'I', width: 14 },  // Trọng lượng
        { key: 'J', width: 13 },  // Sản lượng
        { key: 'K', width: 12 },  // Nhiên liệu
        { key: 'L', width: 12 },  // Điểm lương
        { key: 'M', width: 12 },  // Điểm lương
        { key: 'N', width: 12 },  // Điểm lương
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
async function buildVehicleService(order, workbook) {

    const sheetName = `${order.assignedTo?.username}_${formatDate(order.workingDate)}_${order.shift?.name}_${order._id}`.replace(/[\\\/:*?\[\]]/g, '-').substring(0, 31);

    const worksheet = workbook.addWorksheet(sheetName);

    // Tiêu đề bảng
    worksheet.mergeCells('A1:N2');
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
    worksheet.mergeCells('J5:N5')
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
    worksheet.mergeCells('J6:N6')
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


    worksheet.getCell(`B10`).value = 'Nội dung bàn giao ca';
    worksheet.getCell(`B10`).font = { bold: true };
    // Gộp ô cho nội dung bàn giao ca
    worksheet.mergeCells(`C10:L10`)
    worksheet.getCell(`C10`).value = order.shiftReport?.handoverNotes || '';


    worksheet.getCell(`B11`).value = 'Giờ nhận lệnh';
    worksheet.getCell(`B11`).font = { bold: true };
    worksheet.getCell(`C11`).value = order.startTime
        ? new Date(order.startTime).toLocaleTimeString('vi-VN', { hour12: false })
        : "";

    worksheet.getCell(`D11`).value = 'Giờ kết thúc';
    worksheet.getCell(`D11`).font = { bold: true };
    worksheet.getCell(`E11`).value = order.endTime
        ? new Date(order.endTime).toLocaleTimeString('vi-VN', { hour12: false })
        : "";

    worksheet.mergeCells(`F11:G11`);
    worksheet.getCell(`F11`).value = 'Giờ hoạt động trên đồng hồ';
    worksheet.getCell(`F11`).font = { bold: true };
    worksheet.getCell(`H11`).value = (order?.shiftReport?.vehicleSummaries || []).reduce((sum, report) => { return sum + report?.travelHours }, 0) || '';
    worksheet.getCell(`H11`).alignment = { horizontal: 'left' }

    worksheet.mergeCells(`I11:J11`);
    worksheet.getCell(`I11`).value = 'Km hoạt động trên đồng hồ';
    worksheet.getCell(`I11`).font = { bold: true };
    worksheet.getCell(`K11`).value = (order?.shiftReport?.vehicleSummaries || []).reduce((sum, report) => { return sum + report?.distanceKm }, 0) || '';
    worksheet.getCell(`K11`).alignment = { horizontal: 'left' }

    worksheet.mergeCells(`A13:N13`);
    const header3 = worksheet.getCell(`A13`);
    header3.value = `I.NHIÊN LIỆU`;
    header3.font = { bold: true, size: 14 };
    header3.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(13).height = 30;

    worksheet.mergeCells(`A14:B14`);
    worksheet.getCell(`A14`).value = 'Thiết bị vận hành';
    worksheet.getCell(`A14`).font = { bold: true };
    worksheet.getCell(`A14`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`C14`).value = 'Tồn dầu';
    worksheet.getCell(`C14`).font = { bold: true };
    worksheet.getCell(`C14`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`D14`).value = 'Lĩnh trong ca';
    worksheet.getCell(`D14`).font = { bold: true };
    worksheet.getCell(`D14`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`E14`).value = 'Tồn cuối ca';
    worksheet.getCell(`E14`).font = { bold: true };
    worksheet.getCell(`E14`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`F14`).value = 'Tiêu thụ';
    worksheet.getCell(`F14`).font = { bold: true };
    worksheet.getCell(`F14`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`G14`).value = 'Định mức';
    worksheet.getCell(`G14`).font = { bold: true };
    worksheet.getCell(`G14`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`H14`).value = 'Tiết kiệm';
    worksheet.getCell(`H14`).font = { bold: true };
    worksheet.getCell(`H14`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`I14`).value = 'Sử dụng vượt';
    worksheet.getCell(`I14`).font = { bold: true };
    worksheet.getCell(`I14`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells(`J14:N14`)
    worksheet.getCell(`J14`).value = 'Ghi chú';
    worksheet.getCell(`J14`).font = { bold: true };
    worksheet.getCell(`J14`).alignment = { horizontal: 'center', vertical: 'middle' };


    const fuelHeaderRow = 15;

    let index = 0;
    for (let d of (order.device || [{}])) {
        const rep = (order.shiftReport?.vehicleSummaries || []).find(i => i?.vehicle?._id.toString() === d._id.toString());
        const currentRow = fuelHeaderRow + index;
        worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
        worksheet.getCell(`A${currentRow}`).value = d?.code || '';
        worksheet.getCell(`C${currentRow}`).value = rep?.fuelRemain || '';
        worksheet.getCell(`D${currentRow}`).value = rep?.fuelReceived || '';
        worksheet.getCell(`E${currentRow}`).value = rep?.fuelRemainEnd || '';
        worksheet.getCell(`F${currentRow}`).value =
            (rep?.fuelRemain ?? 0) + (rep?.fuelReceived ?? 0) - (rep?.fuelRemainEnd ?? 0);

        worksheet.getCell(`G${currentRow}`).value = '';

        worksheet.getCell(`H${currentRow}`).value = '';
        worksheet.getCell(`I${currentRow}`).value = '';

        worksheet.mergeCells(`J${currentRow}:N${currentRow}`);
        worksheet.getCell(`J${currentRow}`).value = '';
        index++
    }

    const fuelEndRow = fuelHeaderRow + index

    addTableBorders(worksheet, 13, fuelEndRow - 1, 1, 14);

    worksheet.mergeCells(`B${fuelEndRow + 1}:D${fuelEndRow + 1}`)
    worksheet.getCell(`B${fuelEndRow + 1}`).value = 'NGƯỜI NHẬN LỆNH';
    worksheet.getCell(`B${fuelEndRow + 1}`).font = { bold: true };
    worksheet.getCell(`B${fuelEndRow + 1}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`C${fuelEndRow + 3}`).value = '✔';
    worksheet.getCell(`C${fuelEndRow + 3}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`C${fuelEndRow + 3}`).font = { bold: true, size: 12 };
    worksheet.mergeCells(`B${fuelEndRow + 5}:D${fuelEndRow + 5}`)
    worksheet.getCell(`B${fuelEndRow + 5}`).font = { bold: true };
    worksheet.getCell(`B${fuelEndRow + 5}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`B${fuelEndRow + 5}`).value = order.assignedTo?.fullName || "";

    worksheet.mergeCells(`I${fuelEndRow + 1}:L${fuelEndRow + 1}`)
    worksheet.getCell(`I${fuelEndRow + 1}`).value = 'NGƯỜI RA LỆNH';
    worksheet.getCell(`I${fuelEndRow + 1}`).font = { bold: true };
    worksheet.getCell(`I${fuelEndRow + 1}`).alignment = { horizontal: 'center', vertical: 'middle' };
    if (order.createdBy?.signature) {
        const response = await axios.get(order.createdBy.signature, { responseType: 'arraybuffer' });
        const extension = response.headers['content-type'].split('/')[1];
        const imageBuffer = Buffer.from(response.data, 'binary');

        const imageId = workbook.addImage({
            buffer: imageBuffer,
            extension
        });

        worksheet.mergeCells(`J${fuelEndRow + 2}:K${fuelEndRow + 4}`);

        // gán ảnh trực tiếp vào range
        worksheet.addImage(imageId, `J${fuelEndRow + 2}:K${fuelEndRow + 4}`);
    }

    worksheet.mergeCells(`I${fuelEndRow + 5}:L${fuelEndRow + 5}`)
    worksheet.getCell(`I${fuelEndRow + 5}`).font = { bold: true };
    worksheet.getCell(`I${fuelEndRow + 5}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`I${fuelEndRow + 5}`).value = order.createdBy?.fullName || "";


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
        { key: 'B', width: 20 },  // Nhận tải
        { key: 'C', width: 12 },  // Đổ tải
        { key: 'D', width: 14 },  // Loại hàng
        { key: 'E', width: 14 },  // Cung độ tạm tính
        { key: 'F', width: 14 },  // Chiều cao nâng tải
        { key: 'G', width: 14 },  // Số chuyến
        { key: 'H', width: 10 },  // Khối lượng
        { key: 'I', width: 14 },  // Trọng lượng
        { key: 'J', width: 13 },  // Sản lượng
        { key: 'K', width: 12 },  // Nhiên liệu
        { key: 'L', width: 12 },  // Điểm lương
        { key: 'M', width: 12 },  // Điểm lương
        { key: 'N', width: 12 },  // Điểm lương
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
        .populate("device", "code material")
        .populate("material", "name density")
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
    worksheet.mergeCells('J5:K5')
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
    worksheet.mergeCells('J6:K6')
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
        worksheet.mergeCells(`J${row}:K${row}`)
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

    const grouped = await groupExcavator(reports, order.workingDate)

    let rowIndexTrip = rowHeader1 + 2;
    grouped.forEach((g, i) => {
        const startRowTrip = rowIndexTrip;
        g.materials.forEach(m => {
            worksheet.getCell(`A${rowIndexTrip}`).value = i + 1;
            worksheet.getCell(`A${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            worksheet.getCell(`B${rowIndexTrip}`).value = g.device?.code || '';
            worksheet.getCell(`B${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            worksheet.getCell(`C${rowIndexTrip}`).value = m.material?.name || '';
            worksheet.getCell(`C${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            worksheet.getCell(`D${rowIndexTrip}`).value = m.quantity || '';
            worksheet.getCell(`D${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            worksheet.mergeCells(`E${rowIndexTrip}:F${rowIndexTrip}`)
            const timesText = (m.times || [])
                .map(item => item.toLocaleTimeString('vi-VN'))
                .join('\n');

            worksheet.getCell(`E${rowIndexTrip}`).value = timesText;
            worksheet.getCell(`E${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            setAutoRowHeight(worksheet.getRow(rowIndexTrip), timesText);
            worksheet.getCell(`G${rowIndexTrip}`).value = m.cubicMeter || 0;
            worksheet.getCell(`G${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            worksheet.getCell(`H${rowIndexTrip}`).value = m.ton || 0;
            worksheet.getCell(`H${rowIndexTrip}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            worksheet.getCell(`I${rowIndexTrip}`).value = "";
            worksheet.getCell(`J${rowIndexTrip}`).value = "";
            worksheet.getCell(`K${rowIndexTrip}`).value = "";
            rowIndexTrip++

            if (rowIndexTrip - 1 > startRowTrip) {
                ['A', 'B'].forEach(col => {
                    worksheet.mergeCells(`${col}${startRowTrip}:${col}${rowIndexTrip - 1}`);
                    worksheet.getCell(`${col}${startRowTrip}`).alignment = { vertical: 'middle', horizontal: 'center' };
                });
            }
        })
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
    worksheet.getCell(`G${totalRow}`).value = grouped.reduce((sum, report) => { return sum + report.totalCubicMeter }, 0) || '';
    worksheet.getCell(`G${totalRow}`).font = { bold: true };
    worksheet.getCell(`H${totalRow}`).value = grouped.reduce((sum, report) => { return sum + report.totalTon }, 0) || '';
    worksheet.getCell(`H${totalRow}`).font = { bold: true };
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


    const fuelHeaderRow = totalRow + 4;
    let index = 0;
    for (let d of (order.device || [{}])) {
        const rep = (order.shiftReport?.vehicleSummaries || []).find(i => i?.vehicle?._id.toString() === d._id.toString());
        const currentRow = fuelHeaderRow + index;
        worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
        worksheet.getCell(`A${currentRow}`).value = d?.code || '';
        worksheet.getCell(`C${currentRow}`).value = rep?.fuelRemain || '';
        worksheet.getCell(`D${currentRow}`).value = rep?.fuelReceived || '';
        worksheet.getCell(`E${currentRow}`).value = rep?.fuelRemainEnd || '';
        worksheet.getCell(`F${currentRow}`).value =
            (rep?.fuelRemain ?? 0) + (rep?.fuelReceived ?? 0) - (rep?.fuelRemainEnd ?? 0);

        worksheet.getCell(`G${currentRow}`).value = '';

        worksheet.getCell(`H${currentRow}`).value = '';
        worksheet.getCell(`I${currentRow}`).value = '';

        worksheet.mergeCells(`J${currentRow}:K${currentRow}`);
        worksheet.getCell(`J${currentRow}`).value = '';
        index++
    }
    const fuelEndRow = fuelHeaderRow + index

    addTableBorders(worksheet, rowHeader1, fuelEndRow, 1, 11);
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
        { key: 'B', width: 22 },  // Nhận tải
        { key: 'C', width: 18 },  // Đổ tải
        { key: 'D', width: 14 },  // Loại hàng
        { key: 'E', width: 10 },  // Cung độ tạm tính
        { key: 'F', width: 10 },  // Chiều cao nâng tải
        { key: 'G', width: 14 },  // Số chuyến
        { key: 'H', width: 14 },  // Khối lượng
        { key: 'I', width: 14 },  // Trọng lượng
        { key: 'J', width: 15 },  // Sản lượng
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
    worksheet.mergeCells('J5:L5')
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
    worksheet.mergeCells('J6:L6')
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
    worksheet.mergeCells('A1:K2');
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
    worksheet.mergeCells('I5:K5')
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
    worksheet.mergeCells('I6:K6')
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
        worksheet.mergeCells(`I${row}:K${row}`)
        worksheet.getCell(`I${row}`).value = driver.position?.name || '';
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

    worksheet.getCell(`E${nextRow + 4}`).value = 'Giờ kết thúc';
    worksheet.getCell(`E${nextRow + 4}`).font = { bold: true };
    worksheet.getCell(`F${nextRow + 4}`).value = order.endTime
        ? new Date(order.endTime).toLocaleTimeString('vi-VN', { hour12: false })
        : "";


    let rowHeader1 = nextRow + 6
    worksheet.mergeCells(`A${rowHeader1}:K${rowHeader1}`);
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
    worksheet.getCell(`I${rowHeader1 + 1}`).value = 'Đơn vị sửa chữa';
    worksheet.mergeCells(`J${rowHeader1 + 1}:K${rowHeader1 + 1}`)
    worksheet.getCell(`J${rowHeader1 + 1}`).value = 'Ghi chú';

    const headerRow = worksheet.getRow(rowHeader1 + 1);
    for (let col = 1; col <= 10; col++) {
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
        worksheet.getCell(`I${rowIndexTrip}`).value = order.repairDepartment?.code || '';
        worksheet.getCell(`I${rowIndexTrip}`).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        worksheet.mergeCells(`J${rowIndexTrip}:K${rowIndexTrip}`)
        worksheet.getCell(`J${rowIndexTrip}`).value = report.noteRepair || '';
        worksheet.getCell(`J${rowIndexTrip}`).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        rowIndexTrip++
    })

    worksheet.mergeCells(`A${rowIndexTrip}:K${rowIndexTrip}`);
    worksheet.getCell(`A${rowIndexTrip}`).value = 'Mức bồi dưỡng (x1000đ):';

    worksheet.mergeCells(`A${rowIndexTrip + 1}:K${rowIndexTrip + 1}`);
    const header3 = worksheet.getCell(`A${rowIndexTrip + 1}`);
    header3.value = `II.NHIÊN LIỆU`;
    header3.font = { bold: true, size: 14 };
    header3.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(rowIndexTrip + 2).height = 30;

    worksheet.mergeCells(`A${rowIndexTrip + 2}:B${rowIndexTrip + 2}`);
    worksheet.getCell(`A${rowIndexTrip + 2}`).value = 'Thiết bị vận hành';
    worksheet.getCell(`A${rowIndexTrip + 2}`).font = { bold: true };
    worksheet.getCell(`A${rowIndexTrip + 2}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`C${rowIndexTrip + 2}`).value = 'Tồn dầu';
    worksheet.getCell(`C${rowIndexTrip + 2}`).font = { bold: true };
    worksheet.getCell(`C${rowIndexTrip + 2}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`D${rowIndexTrip + 2}`).value = 'Lĩnh trong ca';
    worksheet.getCell(`D${rowIndexTrip + 2}`).font = { bold: true };
    worksheet.getCell(`D${rowIndexTrip + 2}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`E${rowIndexTrip + 2}`).value = 'Tồn cuối ca';
    worksheet.getCell(`E${rowIndexTrip + 2}`).font = { bold: true };
    worksheet.getCell(`E${rowIndexTrip + 2}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`F${rowIndexTrip + 2}`).value = 'Tiêu thụ';
    worksheet.getCell(`F${rowIndexTrip + 2}`).font = { bold: true };
    worksheet.getCell(`F${rowIndexTrip + 2}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`G${rowIndexTrip + 2}`).value = 'Định mức';
    worksheet.getCell(`G${rowIndexTrip + 2}`).font = { bold: true };
    worksheet.getCell(`G${rowIndexTrip + 2}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`H${rowIndexTrip + 2}`).value = 'Tiết kiệm';
    worksheet.getCell(`H${rowIndexTrip + 2}`).font = { bold: true };
    worksheet.getCell(`H${rowIndexTrip + 2}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    worksheet.getCell(`I${rowIndexTrip + 2}`).value = 'Sử dụng vượt';
    worksheet.getCell(`I${rowIndexTrip + 2}`).font = { bold: true };
    worksheet.getCell(`I${rowIndexTrip + 2}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.mergeCells(`J${rowIndexTrip + 2}:K${rowIndexTrip + 2}`)
    worksheet.getCell(`J${rowIndexTrip + 2}`).value = 'Ghi chú';
    worksheet.getCell(`J${rowIndexTrip + 2}`).font = { bold: true };
    worksheet.getCell(`J${rowIndexTrip + 2}`).alignment = { horizontal: 'center', vertical: 'middle' };

    const fuelHeaderRow = rowIndexTrip + 3;

    let index = 0;
    for (let d of (order.repairVehicles || [{}])) {
        const rep = (order.shiftReport?.vehicleSummaries || []).find(i => i?.vehicle?._id.toString() === d.device?._id.toString());
        const currentRow = fuelHeaderRow + index;
        worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
        worksheet.getCell(`A${currentRow}`).value = d.device?.code || '';
        worksheet.getCell(`C${currentRow}`).value = rep?.fuelRemain || '';
        worksheet.getCell(`D${currentRow}`).value = rep?.fuelReceived || '';
        worksheet.getCell(`E${currentRow}`).value = rep?.fuelRemainEnd || '';
        worksheet.getCell(`F${currentRow}`).value = (rep?.fuelRemain ?? 0) + (rep?.fuelReceived ?? 0) - (rep?.fuelRemainEnd ?? 0);

        worksheet.getCell(`G${currentRow}`).value = '';

        worksheet.getCell(`H${currentRow}`).value = '';
        worksheet.getCell(`I${currentRow}`).value = '';
        worksheet.mergeCells(`J${currentRow}:K${currentRow}`)
        worksheet.getCell(`J${currentRow}`).value = '';
        index++;
    }
    const fuelEndRow = fuelHeaderRow + index

    addTableBorders(worksheet, rowHeader1, fuelEndRow - 1, 1, 10)

    worksheet.mergeCells(`B${fuelEndRow + 2}:D${fuelEndRow + 2}`)
    worksheet.getCell(`B${fuelEndRow + 2}`).value = 'NGƯỜI NHẬN LỆNH';
    worksheet.getCell(`B${fuelEndRow + 2}`).font = { bold: true };
    worksheet.getCell(`B${fuelEndRow + 2}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`C${fuelEndRow + 4}`).value = '✔';
    worksheet.getCell(`C${fuelEndRow + 4}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`C${fuelEndRow + 4}`).font = { bold: true, size: 12 };
    worksheet.mergeCells(`B${fuelEndRow + 6}:D${fuelEndRow + 6}`)
    worksheet.getCell(`B${fuelEndRow + 6}`).font = { bold: true };
    worksheet.getCell(`B${fuelEndRow + 6}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`B${fuelEndRow + 6}`).value = order.assignedTo?.fullName || "";

    worksheet.mergeCells(`I${fuelEndRow + 2}:J${fuelEndRow + 2}`)
    worksheet.getCell(`I${fuelEndRow + 2}`).value = 'NGƯỜI RA LỆNH';
    worksheet.getCell(`I${fuelEndRow + 2}`).font = { bold: true };
    worksheet.getCell(`I${fuelEndRow + 2}`).alignment = { horizontal: 'center', vertical: 'middle' };
    if (order.createdBy?.signature) {
        const response = await axios.get(order.createdBy.signature, { responseType: 'arraybuffer' });
        const extension = response.headers['content-type'].split('/')[1];
        const imageBuffer = Buffer.from(response.data, 'binary');

        const imageId = workbook.addImage({
            buffer: imageBuffer,
            extension
        });

        worksheet.mergeCells(`I${fuelEndRow + 3}:J${fuelEndRow + 5}`);

        // gán ảnh trực tiếp vào range
        worksheet.addImage(imageId, `I${fuelEndRow + 3}:J${fuelEndRow + 5}`);
    }

    worksheet.mergeCells(`I${fuelEndRow + 6}:I${fuelEndRow + 6}`)
    worksheet.getCell(`I${fuelEndRow + 6}`).font = { bold: true };
    worksheet.getCell(`I${fuelEndRow + 6}`).alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getCell(`I${fuelEndRow + 6}`).value = order.createdBy?.fullName || "";


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
        { key: 'B', width: 25 },  // Nhận tải
        { key: 'C', width: 15 },  // Đổ tải
        { key: 'D', width: 15 },  // Loại hàng
        { key: 'E', width: 15 },  // Cung độ tạm tính
        { key: 'F', width: 14 },  // Chiều cao nâng tải
        { key: 'G', width: 10 },  // Số chuyến
        { key: 'H', width: 14 },  // Khối lượng
        { key: 'I', width: 25 },  // Trọng lượng
        { key: 'J', width: 15 },  // Trọng lượng
        { key: 'K', width: 15 },  // Trọng lượng
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
    worksheet.mergeCells('J5:L5')
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
    worksheet.mergeCells('J6:L6')
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
        worksheet.mergeCells(`J${row}:L${row}`)
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


    const fuelHeaderRow = totalRow + 4;
    let index = 0;
    for (let d of (order.device || [{}])) {
        const rep = (order.shiftReport?.vehicleSummaries || []).find(i => i?.vehicle?._id.toString() === d._id.toString());
        const currentRow = fuelHeaderRow + index;
        worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
        worksheet.getCell(`A${currentRow}`).value = d?.code || '';
        worksheet.getCell(`C${currentRow}`).value = rep?.fuelRemain || '';
        worksheet.getCell(`D${currentRow}`).value = rep?.fuelReceived || '';
        worksheet.getCell(`E${currentRow}`).value = rep?.fuelRemainEnd || '';
        worksheet.getCell(`F${currentRow}`).value =
            (rep?.fuelRemain ?? 0) + (rep?.fuelReceived ?? 0) - (rep?.fuelRemainEnd ?? 0);

        worksheet.getCell(`G${currentRow}`).value = '';

        worksheet.getCell(`H${currentRow}`).value = '';
        worksheet.getCell(`I${currentRow}`).value = '';

        worksheet.mergeCells(`J${currentRow}:L${currentRow}`);
        worksheet.getCell(`J${currentRow}`).value = '';
        index++
    }
    const fuelEndRow = fuelHeaderRow + index

    addTableBorders(worksheet, rowHeader1, fuelEndRow, 1, 12);
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
        { key: 'B', width: 22 },  // Nhận tải
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
    worksheet.mergeCells('J5:L5')
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
    worksheet.mergeCells('J6:L6')
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
        worksheet.mergeCells(`J${row}:L${row}`)
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


    const fuelHeaderRow = totalRow + 4;
    let index = 0;
    for (let d of (order.device || [{}])) {
        const rep = (order.shiftReport?.vehicleSummaries || []).find(i => i?.vehicle?._id.toString() === d._id.toString());
        const currentRow = fuelHeaderRow + index;
        worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
        worksheet.getCell(`A${currentRow}`).value = d?.code || '';
        worksheet.getCell(`C${currentRow}`).value = rep?.fuelRemain || '';
        worksheet.getCell(`D${currentRow}`).value = rep?.fuelReceived || '';
        worksheet.getCell(`E${currentRow}`).value = rep?.fuelRemainEnd || '';
        worksheet.getCell(`F${currentRow}`).value =
            (rep?.fuelRemain ?? 0) + (rep?.fuelReceived ?? 0) - (rep?.fuelRemainEnd ?? 0);

        worksheet.getCell(`G${currentRow}`).value = '';

        worksheet.getCell(`H${currentRow}`).value = '';
        worksheet.getCell(`I${currentRow}`).value = '';

        worksheet.mergeCells(`J${currentRow}:L${currentRow}`);
        worksheet.getCell(`J${currentRow}`).value = '';
        index++
    }
    const fuelEndRow = fuelHeaderRow + index

    addTableBorders(worksheet, rowHeader1, fuelEndRow, 1, 12);
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
    worksheet.mergeCells('H5:L5')
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
    worksheet.mergeCells('H6:L6')
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
        query['repairVehicles.0'] = { $exists: true };
        const orders = await Order.find(query)
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
            .populate('repairDepartment', 'code')
            .populate("job")
        const filterOrders = orders.filter(r =>
            r.job?.type === JOB_TYPE.SUA_CHUA_BAO_DUONG
        );

        const formattedData = filterOrders.flatMap((order, orderIndex) => {

            return order.repairVehicles
                ?.map((d, index) => {
                    let report = {};
                    if (order.shiftReport && order.shiftReport?.vehicleRepair.length > 0) {
                        report = order.shiftReport.vehicleRepair.find(
                            vr => vr.device.toString() === d.device?._id.toString()
                        ) || {};
                    }

                    return {
                        _id: order._id + '' + index,
                        code: d?.device?.code || '',
                        warning: d.note || '',
                        result: report.status || '',
                        repairDepartment: order.repairDepartment?.code || '',
                        note: report.noteRepair || ''
                    };
                });
        });
        res.status(200).json({ status: 'success', data: formattedData })
    } catch (err) {
        req.logger.error("❌ Lỗi khi load", err);
        res.status(500).json({ status: 'error', message: err.message, stack: err.stack })
    }
})
router.post('/vehicleShiftReport', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER), async (req, res, next) => {
    try {
        const { shift, startDate, endDate, department, signature } = req.body
        const user = req.user
        const shiftList = await Shift.find({ _id: { $in: shift } });
        const start = new Date(startDate);
        const end = new Date(endDate);
        let dep;
        if (department) {
            dep = await Department.findById(department).select('code')
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
                            }
                        ]
                    })
                    .populate('repairVehicles.device')
                    .populate('repairDepartment', 'code')
                    .populate("job")
                const filterOrders = orders.filter(r =>
                    r.job?.type === JOB_TYPE.SUA_CHUA_BAO_DUONG
                );

                const sheetName = `${formatDate(d)}_${ca.name}`.replace(/[\\\/:*?\[\]]/g, '-').substring(0, 31);

                const worksheet = workbook.addWorksheet(sheetName);

                worksheet.mergeCells('A1:F1');
                const infoRow = worksheet.getCell('A1');
                infoRow.value = `Đơn vị: ${dep?.code}                  Ca: ${ca.name}                  , ngày:    ${formatDate(d)}                             Tên cán bộ: ${req.user?.fullName}`;
                infoRow.font = { italic: true, size: 14 };
                infoRow.alignment = { horizontal: 'left', vertical: 'middle' };
                // Tiêu đề bảng
                worksheet.mergeCells('A3:F3');
                const header = worksheet.getCell('A3');
                header.value = "Xe không hoạt động";
                header.font = { bold: true, size: 16 };
                header.alignment = { horizontal: 'center', vertical: 'middle' };

                const headerRowNumber = 5;
                const headers = ['STT', 'Số xe', 'Tình trạng hư/ hỏng', 'Kết quả sửa chữa\n trong ca', 'Đơn vị sửa chữa', 'Ghi chú'];

                headers.forEach((text, index) => {
                    const cell = worksheet.getRow(headerRowNumber).getCell(index + 1);
                    cell.value = text;
                    cell.font = { bold: true };
                    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                });

                let index = 1;
                let totalDataRows = 5;
                const formattedData = filterOrders.flatMap((order, orderIndex) => {

                    return order.repairVehicles
                        ?.map((d, index) => {
                            let report = {};
                            if (order.shiftReport && order.shiftReport?.vehicleRepair.length > 0) {
                                report = order.shiftReport.vehicleRepair.find(
                                    vr => vr.device.toString() === d.device?._id.toString()
                                ) || {};
                            }

                            return {
                                _id: order._id + '' + index,
                                code: d?.device?.code || '',
                                warning: d.note || '',
                                result: report.status || '',
                                repairDepartment: order.repairDepartment?.code || '',
                                note: report.noteRepair || ''
                            };
                        });
                });
                for (const d of formattedData) {
                    worksheet.addRow([
                        index,
                        d?.code || '',
                        d.warning || '',
                        d.result || '',
                        d.repairDepartment || '',
                        d.note || ''
                    ])
                    index++

                }
                addTableBorders(worksheet, 5, totalDataRows + index, 1, 6);

                worksheet.pageSetup = {
                    paperSize: 9,                // A4
                    orientation: 'landscape',    // ngang
                    fitToPage: true,
                    fitToWidth: 1,               // vừa 1 trang theo chiều ngang
                    fitToHeight: 0,              // không ép theo chiều dọc
                    margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } // inch
                };

                worksheet.getColumn(1).width = 6;
                worksheet.getColumn(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
                worksheet.getColumn(2).width = 20;
                worksheet.getColumn(2).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
                worksheet.getColumn(3).width = 40;
                worksheet.getColumn(3).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
                worksheet.getColumn(4).width = 20;
                worksheet.getColumn(4).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
                worksheet.getColumn(5).width = 20;
                worksheet.getColumn(5).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
                worksheet.getColumn(6).width = 40;
                worksheet.getColumn(6).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }

                worksheet.eachRow((row, rowNumber) => {
                    row.eachCell((cell) => {
                        if (!cell.font) cell.font = {};
                        cell.font = {
                            ...cell.font,            // giữ lại các thuộc tính khác (bold, italic,…)
                            name: 'Times New Roman', // đổi font chữ
                            ...(rowNumber > 3 ? { size: 12 } : {})            // kích thước chữ
                        };
                    });
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
                        tl: { col: lastCol - 2, row: index + 7 }, // H30
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
        res.status(500).json({ status: 'error', message: err.message, stack: err.stack })
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
                path: 'assignedTo',
                select: 'fullName salaryCode department',
                populate: ('department')
            })
            .populate({
                path: 'createdBy',
                select: 'fullName',
            })
            .populate({
                path: 'device',
                select: 'code',
            })
            .populate({
                path: 'assistants',
                select: 'fullName salaryCode',
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
            r.job?.type === JOB_TYPE.VAN_HANH_XE
        );

        let result = []
        for (const order of filterOrders) {
            const combined = getCombinedUsers(order);

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
                .populate('excavator', 'code')
                .populate('toLocation', 'name')

            reports = reports.filter(r =>
                r.device?.category?.name?.toLowerCase().includes("vận tải".toLowerCase())
            );
            if (!reports.length) continue;
            const grouped = await groupCar(reports)

            result.push({
                _id: order._id,
                device: (order.device || []).map(d => d?.code) || [],
                assignedTo: combined,
                reports: grouped.map(g => ({
                    excavator: g.excavator?.code || '',
                    toLocation: g.toLocation?.name || '',
                    materials: g.materials || {},
                })),
                fuelRemain: (order?.shiftReport?.vehicleSummaries || []).map(i => i?.fuelRemain),
                fuelReceived: (order?.shiftReport?.vehicleSummaries || []).map(i => i?.fuelReceived),
                fuelRemainEnd: (order?.shiftReport?.vehicleSummaries || []).map(i => i?.fuelRemainEnd),
                fuelRemainUsed: (order?.shiftReport?.vehicleSummaries || []).map(i => (i?.fuelRemain || 0) + (i?.fuelReceived || 0) - (i?.fuelRemainEnd || 0)),
                travelHours: (order?.shiftReport?.vehicleSummaries || []).map(i => i?.travelHours),
            });
        }

        res.status(200).json({ status: 'success', data: result })
    } catch (err) {
        req.logger.error("❌ Lỗi khi load", err);
        res.status(500).json({ status: 'error', message: err.message, stack: err.stack })
    }
})

router.post('/carReport', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER), async (req, res, next) => {
    try {
        const { shift, startDate, endDate, title, signature, department } = req.body
        const shiftList = await Shift.find({ _id: { $in: shift } });
        const start = new Date(startDate);
        const end = new Date(endDate);
        const user = req.user
        let dep;
        if (department) {
            dep = await Department.findById(department).select('code')
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
                        path: 'assignedTo',
                        select: 'fullName salaryCode department',
                        populate: ('department')
                    })
                    .populate({
                        path: 'createdBy',
                        select: 'fullName',
                    })
                    .populate({
                        path: 'device',
                        select: 'code',
                    })
                    .populate({
                        path: 'assistants',
                        select: 'fullName salaryCode',
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
                    r.job?.type === JOB_TYPE.VAN_HANH_XE
                );

                const sheetName = `${formatDate(d)}_${ca.name}`.replace(/[\\\/:*?\[\]]/g, '-').substring(0, 31);

                const worksheet = workbook.addWorksheet(sheetName);

                worksheet.mergeCells(`B1:X1`);
                const infoRow = worksheet.getCell('B1');
                infoRow.value = "CÔNG TY CỔ PHẦN THAN CAO SƠN-TKV";
                infoRow.font = { italic: true, size: 18 };
                // Tiêu đề bảng
                worksheet.mergeCells(`A3:X3`);
                const header = worksheet.getCell('A3');
                header.value = 'BÁO CÁO TỔNG HỢP SỐ LIỆU TRONG CA (Ô TÔ)';
                header.font = { bold: true, size: 16 };
                header.alignment = { horizontal: 'center', vertical: 'middle' };

                worksheet.getCell('B4').value = "Ngày";
                worksheet.getCell('C4').value = formatDate(d);
                worksheet.getCell('E4').value = "Ca";
                worksheet.getCell('F4').value = ca?.name || '';

                worksheet.getCell('B5').value = "Đơn vị";
                worksheet.getCell('C5').value = dep?.code || '';
                worksheet.getCell('E5').value = "Giờ hệ thống";
                worksheet.getCell('F5').value = new Date().toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                });

                worksheet.getCell('B6').value = "Người ra lệnh";
                worksheet.mergeCells(`C6:D6`);
                worksheet.getCell('C6').value = user?.fullName || '';
                worksheet.getCell('E6').value = "Số thẻ";
                worksheet.getCell('F6').value = user?.salaryCode || '';
                worksheet.getCell('G6').value = "Chức vụ";
                worksheet.mergeCells('H6:X6')
                worksheet.getCell('H6').value = user?.position?.name || '';


                // ==== HÀNG 1 ==== (STT, Người nhận lệnh, ... cố định 5-6 cột đầu)
                setMergeCellHeader(worksheet, 'A8:A9', 'STT')
                setMergeCellHeader(worksheet, 'B8:B9', "Người nhận lệnh")
                setMergeCellHeader(worksheet, 'C8:C9', "Số thẻ")
                setMergeCellHeader(worksheet, 'D8:D9', "Thiết bị vận hành")
                setMergeCellHeader(worksheet, 'E8:E9', "Máy xúc")
                setMergeCellHeader(worksheet, 'F8:F9', "Điểm đổ tải")
                setMergeCellHeader(worksheet, 'G8:G9', "Loại vật liệu")
                setMergeCellHeader(worksheet, 'H8:H9', "Cung độ thực hiện (km)")
                setMergeCellHeader(worksheet, 'I8:I9', "Chiều cao nâng tải (m)")
                setMergeCellHeader(worksheet, 'J8:L8', "Sản lượng")

                // ==== HÀNG 2 ==== ( gio san pham)
                setCellHeader(worksheet, 'J9', "Chuyến định mức")
                setCellHeader(worksheet, 'K9', "Chuyến thực hiện")
                setCellHeader(worksheet, 'L9', "Km")

                // ==== HÀNG 1 ==== (Nhien lieu)
                setMergeCellHeader(worksheet, 'M8:S8', "Nhiên liệu/Điện năng")

                // ==== HÀNG 2 ==== ( Nhien lieu)
                setCellHeader(worksheet, 'M9', "Tồn dầu")
                setCellHeader(worksheet, 'N9', "Lĩnh")
                setCellHeader(worksheet, 'O9', "Tồn cuối")
                setCellHeader(worksheet, 'P9', "Tiêu thụ")
                setCellHeader(worksheet, 'Q9', "Định mức")
                setCellHeader(worksheet, 'R9', "Tiết kiệm")
                setCellHeader(worksheet, 'S9', "Vượt")

                // ==== HÀNG 1 ==== (Su dung thiet bi)
                setMergeCellHeader(worksheet, 'T8:V8', "Sử dụng thiết bị (giờ)")

                // ==== HÀNG 2 ==== ( Nhien lieu)
                setCellHeader(worksheet, 'T9', "Giờ hoạt động")
                setCellHeader(worksheet, 'U9', "Giờ ngừng")
                setCellHeader(worksheet, 'V9', "Giờ hoạt động lũy kế")

                // ==== HÀNG 1 ==== 
                setMergeCellHeader(worksheet, 'W8:W9', "Bồi dưỡng (đồng)")
                setMergeCellHeader(worksheet, 'X8:X9', "Lương tạm tính")


                let currentRow = 10
                let result = []
                for (const order of filterOrders) {
                    const combined = getCombinedUsers(order);

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
                        .populate('excavator', 'code')
                        .populate('toLocation', 'name')

                    reports = reports.filter(r =>
                        r.device?.category?.name?.toLowerCase().includes("vận tải".toLowerCase())
                    );
                    if (!reports.length) continue;
                    const grouped = await groupCar(reports)

                    result.push({
                        _id: order._id,
                        device: (order.device || []).map(d => d?.code) || [],
                        assignedTo: combined,
                        reports: grouped.map(g => ({
                            excavator: g.excavator?.code || '',
                            toLocation: g.toLocation?.name || '',
                            materials: g.materials || [],
                        })),
                        fuelRemain: (order?.shiftReport?.vehicleSummaries || []).map(i => i?.fuelRemain),
                        fuelReceived: (order?.shiftReport?.vehicleSummaries || []).map(i => i?.fuelReceived),
                        fuelRemainEnd: (order?.shiftReport?.vehicleSummaries || []).map(i => i?.fuelRemainEnd),
                        fuelRemainUsed: (order?.shiftReport?.vehicleSummaries || []).map(i => (i?.fuelRemain || 0) + (i?.fuelReceived || 0) - (i?.fuelRemainEnd || 0)),
                        travelHours: (order?.shiftReport?.vehicleSummaries || []).map(i => i?.travelHours),
                    });
                }

                result.forEach((item, idx) => {
                    const reps = (item.reports && item.reports.length)
                        ? item.reports
                        : [{ excavator: '', toLocation: '', materials: [] }];

                    const totalMaterials = reps.reduce((sum, r) => sum + (r.materials?.length || 1), 0);
                    const startRow = currentRow;

                    reps.forEach((r, i) => {
                        const mats = r.materials?.length ? r.materials : [{ material: {}, distances: [], times: [], count: 0, totalDistance: 0 }];

                        mats.forEach((m, mIdx) => {
                            const rowStart = currentRow;

                            // --- Hàng 1: tổng ---
                            let row1 = worksheet.getRow(currentRow);

                            if (i === 0 && mIdx === 0) {
                                row1.getCell(1).value = idx + 1; // STT
                                row1.getCell(2).value = (item.assignedTo || []).map(u => u?.fullName).join('\n');
                                row1.getCell(3).value = (item.assignedTo || []).map(u => u?.salaryCode).join('\n');
                                row1.getCell(4).value = (item.device || []).map(u => u).join('\n');
                            }

                            if (mIdx === 0) {
                                row1.getCell(5).value = r.excavator || '';
                                row1.getCell(6).value = r.toLocation || '';
                            }

                            // Loại vật liệu
                            row1.getCell(7).value = m.material?.name || '';

                            // Cung độ tổng
                            row1.getCell(8).value = m.totalDistance || 0;

                            // Số chuyến tổng
                            row1.getCell(11).value = m.count || 0;

                            currentRow++;

                            // --- Hàng 2: chi tiết cung độ ---
                            let row2 = worksheet.getRow(currentRow);
                            row2.getCell(8).value = (m.distances || []).join('\n'); // Cung độ theo từng chuyến
                            row2.getCell(11).value = (m.times || []).map(t => new Date(t).toLocaleTimeString('vi-VN')).join('\n');

                            // (Các cột nhiên liệu / giờ hoạt động merge xuống 2 dòng)
                            if (i === 0 && mIdx === 0) {
                                row1.getCell(13).value = (item.fuelRemain || []).join('\n');
                                row1.getCell(14).value = (item.fuelReceived || []).join('\n');
                                row1.getCell(15).value = (item.fuelRemainEnd || []).join('\n');
                                row1.getCell(16).value = (item.fuelRemainUsed || []).join('\n');
                                row1.getCell(20).value = (item.travelHours || []).join('\n');
                            }

                            currentRow++;

                            // Merge vật liệu cho 2 dòng
                            worksheet.mergeCells(`G${rowStart}:G${currentRow - 1}`);
                            worksheet.mergeCells(`L${rowStart}:L${currentRow - 1}`);
                            worksheet.mergeCells(`I${rowStart}:I${currentRow - 1}`);
                            worksheet.mergeCells(`J${rowStart}:J${currentRow - 1}`);

                            // Merge Máy xúc, Điểm đổ tải cho 2 dòng vật liệu
                            if (mIdx === 0) {
                                worksheet.mergeCells(`E${rowStart}:E${rowStart + mats.length * 2 - 1}`);
                                worksheet.mergeCells(`F${rowStart}:F${rowStart + mats.length * 2 - 1}`);
                            }

                            // Merge nhiên liệu, giờ hoạt động theo block
                            if (i === 0 && mIdx === 0) {
                                ['M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X'].forEach(col => {
                                    worksheet.mergeCells(`${col}${rowStart}:${col}${rowStart + totalMaterials * 2 - 1}`);
                                });
                            }

                            [row1, row2].forEach(row => {
                                row.eachCell(cell => {
                                    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                                });
                            });
                            row1.getCell(2).alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
                            row1.getCell(3).alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
                        });
                    });

                    // Merge các cột A–D
                    if (reps.length > 1) {
                        ['A', 'B', 'C', 'D'].forEach(col => {
                            worksheet.mergeCells(`${col}${startRow}:${col}${currentRow - 1}`);
                        });
                    }

                    const numUsers = (item.assignedTo?.length || 1);
                    worksheet.getRow(startRow).height = numUsers * 15;
                });

                addTableBorders(worksheet, 8, currentRow, 1, 24);


                worksheet.mergeCells(`O${currentRow + 1}:R${currentRow + 1}`)
                worksheet.getCell(`O${currentRow + 1}`).value = 'Cán bộ CT kiểm tra trong ca';
                worksheet.getCell(`O${currentRow + 1}`).font = { bold: true };
                worksheet.getCell(`O${currentRow + 1}`).alignment = { horizontal: 'center', vertical: 'middle' };
                worksheet.mergeCells(`O${currentRow + 2}:R${currentRow + 2}`)
                worksheet.getCell(`O${currentRow + 2}`).value = '( Ký, ghi rõ họ tên)';
                worksheet.getCell(`O${currentRow + 2}`).alignment = { horizontal: 'center', vertical: 'middle' };
                if (signature) {
                    const response = await axios.get(signature, { responseType: 'arraybuffer' });
                    const extension = response.headers['content-type'].split('/')[1];
                    const imageBuffer = Buffer.from(response.data, 'binary');

                    const imageId = workbook.addImage({
                        buffer: imageBuffer,
                        extension
                    });

                    worksheet.mergeCells(`P${currentRow + 4}:Q${currentRow + 7}`);

                    // gán ảnh trực tiếp vào range
                    worksheet.addImage(imageId, `P${currentRow + 4}:Q${currentRow + 7}`);
                }

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
                worksheet.getColumn(3).width = 10;
                // worksheet.getColumn(3).alignment = { horizontal: 'center', vertical: 'middle', }
                worksheet.getColumn(4).width = 15;
                // worksheet.getColumn(4).alignment = { horizontal: 'center', vertical: 'middle', }
                worksheet.getColumn(5).width = 20;
                worksheet.getColumn(6).width = 15;
                worksheet.getColumn(7).width = 15;
                worksheet.getColumn(8).width = 15;
                worksheet.getColumn(9).width = 15;
                worksheet.getColumn(10).width = 15;
                worksheet.getColumn(11).width = 15;
                worksheet.getColumn(12).width = 15;
                worksheet.getColumn(13).width = 15;
                worksheet.getColumn(14).width = 15;
                worksheet.getColumn(15).width = 15;
                worksheet.getColumn(16).width = 15;
                worksheet.getColumn(17).width = 15;
                worksheet.getColumn(18).width = 15;
                worksheet.getColumn(19).width = 15;
                worksheet.getColumn(20).width = 15;
                worksheet.getColumn(21).width = 15;
                worksheet.getColumn(22).width = 15;
                worksheet.getColumn(23).width = 15;

                worksheet.eachRow((row, rowNumber) => {
                    row.eachCell((cell) => {
                        if (!cell.font) cell.font = {};
                        cell.font = {
                            ...cell.font,            // giữ lại các thuộc tính khác (bold, italic,…)
                            name: 'Times New Roman', // đổi font chữ
                            ...(rowNumber > 3 ? { size: 12 } : {})            // kích thước chữ
                        };
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
        res.status(500).json({ status: 'error', message: err.message, stack: err.stack })
    }
})

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
            .populate({
                path: "assistants",
                select: "fullName salaryCode",
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
            order.job?.type === JOB_TYPE.VAN_HANH_XUC
        );

        let result = []
        for (const order of filteredOrders) {
            const combined = getCombinedUsers(order);

            let reports = await Report.find({ orderId: order._id })
                .populate({
                    path: 'device',
                    select: 'code material category',
                    populate: {
                        path: 'category',
                        select: 'name'
                    }
                })
                .populate('material', 'name density')
            if (!reports.length) continue;

            const grouped = await groupExcavator(reports, order.workingDate)

            result.push({
                _id: order._id,
                assignedTo: combined,
                excavator: (order?.device || []).map(i => i?.code),
                reports: grouped.map(g => ({
                    code: g.device?.code || '',
                    materials: g.materials || [],
                    totalCubicMeter: g.totalCubicMeter || 0,
                    totalTon: g.totalTon || 0

                })),
                fuelRemain: (order?.shiftReport?.vehicleSummaries || []).map(i => i?.fuelRemain),
                fuelReceived: (order?.shiftReport?.vehicleSummaries || []).map(i => i?.fuelReceived),
                fuelRemainEnd: (order?.shiftReport?.vehicleSummaries || []).map(i => i?.fuelRemainEnd),
                fuelRemainUsed: (order?.shiftReport?.vehicleSummaries || []).map(i => (i?.fuelRemain || 0) + (i?.fuelReceived || 0) - (i?.fuelRemainEnd || 0)),
                travelHours: (order?.shiftReport?.vehicleSummaries || []).map(i => i?.travelHours),
            });
        }

        res.status(200).json({ status: 'success', data: result })
    } catch (err) {
        req.logger.error("❌ Lỗi khi load", err);
        res.status(500).json({ status: 'error', message: err.message, stack: err.stack })
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
            dep = await Department.findById(department).select('code')
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
                    .populate({
                        path: "assistants",
                        select: "fullName salaryCode",
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
                    order.job?.type === JOB_TYPE.VAN_HANH_XUC
                );


                const sheetName = `${formatDate(d)}_${ca.name}`.replace(/[\\\/:*?\[\]]/g, '-').substring(0, 31);

                const worksheet = workbook.addWorksheet(sheetName);

                worksheet.mergeCells(`B1:V1`);
                const infoRow = worksheet.getCell('B1');
                infoRow.value = "CÔNG TY CỔ PHẦN THAN CAO SƠN-TKV";
                infoRow.font = { italic: true, size: 18 };
                // Tiêu đề bảng
                worksheet.mergeCells(`A3:V3`);
                const header = worksheet.getCell('A3');
                header.value = 'BÁO CÁO TỔNG HỢP SỐ LIỆU TRONG CA (MÁY xúc)';
                header.font = { bold: true, size: 16 };
                header.alignment = { horizontal: 'center', vertical: 'middle' };

                worksheet.getCell('B4').value = "Ngày";
                worksheet.getCell('C4').value = formatDate(d);
                worksheet.getCell('E4').value = "Ca";
                worksheet.getCell('F4').value = ca?.name || '';

                worksheet.getCell('B5').value = "Đơn vị";
                worksheet.getCell('C5').value = dep?.code || '';
                worksheet.getCell('E5').value = "Giờ hệ thống";
                worksheet.getCell('F5').value = new Date().toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                });

                worksheet.getCell('B6').value = "Người ra lệnh";
                worksheet.mergeCells(`C6:D6`);
                worksheet.getCell('C6').value = user?.fullName || '';
                worksheet.getCell('E6').value = "Số thẻ";
                worksheet.getCell('F6').value = user?.salaryCode || '';
                worksheet.getCell('G6').value = "Chức vụ";
                worksheet.mergeCells('H6:V6')
                worksheet.getCell('H6').value = user?.position?.name || '';

                // ==== HÀNG 1 ==== (STT, Người nhận lệnh, ... cố định 5-6 cột đầu)
                setMergeCellHeader(worksheet, 'A8:A9', 'STT')
                setMergeCellHeader(worksheet, 'B8:B9', "Người nhận lệnh")
                setMergeCellHeader(worksheet, 'C8:C9', "Số thẻ")
                setMergeCellHeader(worksheet, 'D8:D9', "Máy xúc")
                setMergeCellHeader(worksheet, 'E8:E9', "Phương tiện")
                setMergeCellHeader(worksheet, 'F8:F9', "Loại vật liệu")
                setMergeCellHeader(worksheet, 'G8:J8', "Sản lượng")

                // ==== HÀNG 2 ==== ( gio san pham)
                setCellHeader(worksheet, 'G9', "Chuyến định mức")
                setCellHeader(worksheet, 'H9', "Chuyến thực hiện")
                setCellHeader(worksheet, 'I9', "Tấn")
                setCellHeader(worksheet, 'J9', "m3")

                // ==== HÀNG 1 ==== (Nhien lieu)
                setMergeCellHeader(worksheet, 'K8:Q8', "Nhiên liệu/Điện năng")

                // ==== HÀNG 2 ==== ( Nhien lieu)
                setCellHeader(worksheet, 'K9', "Tồn dầu")
                setCellHeader(worksheet, 'L9', "Lĩnh")
                setCellHeader(worksheet, 'M9', "Tồn cuối")
                setCellHeader(worksheet, 'N9', "Tiêu thụ")
                setCellHeader(worksheet, 'O9', "Định mức")
                setCellHeader(worksheet, 'P9', "Tiết kiệm")
                setCellHeader(worksheet, 'Q9', "Vượt")

                // ==== HÀNG 1 ==== (Su dung thiet bi)
                setMergeCellHeader(worksheet, 'R8:T8', "Sử dụng thiết bị (giờ)")

                // ==== HÀNG 2 ==== ( Nhien lieu)
                setCellHeader(worksheet, 'R9', "Giờ hoạt động")
                setCellHeader(worksheet, 'S9', "Giờ ngừng")
                setCellHeader(worksheet, 'T9', "Giờ hoạt động lũy kế")

                // ==== HÀNG 1 ==== 
                setMergeCellHeader(worksheet, 'U8:U9', "Bồi dưỡng (đồng)")
                setMergeCellHeader(worksheet, 'V8:V9', "Lương tạm tính")

                let result = []
                for (const order of filteredOrders) {
                    const combined = getCombinedUsers(order);

                    let reports = await Report.find({ orderId: order._id })
                        .populate({
                            path: 'device',
                            select: 'code material category',
                            populate: {
                                path: 'category',
                                select: 'name'
                            }
                        })
                        .populate('material', 'name')
                    if (!reports.length) continue;

                    const grouped = await groupExcavator(reports, order.workingDate)

                    result.push({
                        _id: order._id,
                        assignedTo: combined,
                        excavator: (order?.device || []).map(i => i?.code),
                        reports: grouped.map(g => ({
                            code: g.device?.code || '',
                            materials: g.materials || [],
                            totalCubicMeter: g.totalCubicMeter || 0,
                            totalTon: g.totalTon || 0
                        })),
                        fuelRemain: (order?.shiftReport?.vehicleSummaries || []).map(i => i?.fuelRemain),
                        fuelReceived: (order?.shiftReport?.vehicleSummaries || []).map(i => i?.fuelReceived),
                        fuelRemainEnd: (order?.shiftReport?.vehicleSummaries || []).map(i => i?.fuelRemainEnd),
                        fuelRemainUsed: (order?.shiftReport?.vehicleSummaries || []).map(i => (i?.fuelRemain || 0) + (i?.fuelReceived || 0) - (i?.fuelRemainEnd || 0)),
                        travelHours: (order?.shiftReport?.vehicleSummaries || []).map(i => i?.travelHours),
                    });
                }

                let currentRow = 10;

                result.forEach((item, idx) => {
                    const reports = (item.reports && item.reports.length)
                        ? item.reports
                        : [{ code: '', materials: [{}] }];

                    // tổng số dòng của người nhận lệnh = tổng số vật liệu trong tất cả reports
                    const spanItem = reports.reduce((sum, r) => sum + (r.materials?.length || 1), 0);
                    const startRowItem = currentRow;

                    reports.forEach((r) => {
                        const mats = r.materials?.length ? r.materials : [{}];
                        const spanReport = mats.length;
                        const startRowReport = currentRow;

                        mats.forEach((m) => {
                            const row = worksheet.getRow(currentRow);

                            // chỉ gán STT / Người nhận lệnh / Số thẻ 1 lần (ở hàng đầu tiên của item)
                            if (currentRow === startRowItem) {
                                row.getCell(1).value = idx + 1;
                                row.getCell(2).value = (item.assignedTo || []).map(u => u?.fullName).join('\n');
                                row.getCell(3).value = (item.assignedTo || []).map(u => u?.salaryCode).join('\n');
                                row.getCell(4).value = (item.excavator || []).map(u => u).join('\n');
                            }

                            // máy gạt (report code) – chỉ gán ở hàng đầu của report
                            if (currentRow === startRowReport) {
                                row.getCell(5).value = r.code || '';
                            }

                            // vật liệu
                            row.getCell(6).value = m?.material?.name || '';
                            row.getCell(8).value = m?.quantity || '';
                            row.getCell(9).value = m?.ton || '';
                            row.getCell(10).value = m?.cubicMeter || '';

                            if (currentRow === startRowReport) {
                                row.getCell(11).value = (item.fuelRemain || []).map(u => u).join('\n');
                                row.getCell(12).value = (item.fuelReceived || []).map(u => u).join('\n');
                                row.getCell(13).value = (item.fuelRemainEnd || []).map(u => u).join('\n');
                                row.getCell(14).value = (item.fuelRemainUsed || []).map(u => u).join('\n');
                                row.getCell(15).value = '';
                                row.getCell(16).value = '';
                                row.getCell(17).value = '';
                                row.getCell(18).value = (item?.travelHours || []).map(u => u).join('\n');
                                row.getCell(19).value = '';
                                row.getCell(20).value = '';
                                row.getCell(21).value = '';
                                row.getCell(22).value = '';
                            }

                            // căn chỉnh
                            row.eachCell((cell) => {
                                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                            });
                            row.getCell(2).alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
                            row.getCell(3).alignment = { horizontal: 'center', vertical: 'top', wrapText: true };

                            currentRow++;
                        });

                        const reportCols = ['K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V'];
                        // merge cột D (máy gạt) cho số dòng vật liệu của report
                        if (spanReport > 1) {
                            worksheet.mergeCells(`E${startRowReport}:E${currentRow - 1}`);
                            reportCols.forEach(col => {
                                worksheet.mergeCells(`${col}${startRowReport}:${col}${currentRow - 1}`)
                            })
                        }
                    });

                    // merge A–C (STT, Người nhận lệnh, Số thẻ) cho toàn bộ item
                    if (spanItem > 1) {
                        ['A', 'B', 'C', 'D'].forEach(col => {
                            worksheet.mergeCells(`${col}${startRowItem}:${col}${currentRow - 1}`);
                        });
                    }
                    const numUsers = (item.assignedTo?.length || 1);
                    const numReports = reports.length;
                    const maxLines = Math.max(numUsers, numReports);
                    worksheet.getRow(startRowItem).height = maxLines * 15;
                });

                worksheet.getCell(`B${currentRow}`).value = 'Tổng';
                worksheet.getCell(`B${currentRow}`).font = { bold: true };
                worksheet.getCell(`B${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
                worksheet.getCell(`I${currentRow}`).value = result.flatMap(d => d.reports).reduce((sum, r) => sum + (r.totalTon || 0), 0);
                worksheet.getCell(`I${currentRow}`).font = { bold: true };
                worksheet.getCell(`I${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };
                worksheet.getCell(`J${currentRow}`).value = result.flatMap(d => d.reports).reduce((sum, r) => sum + (r.totalCubicMeter || 0), 0);
                worksheet.getCell(`J${currentRow}`).font = { bold: true };
                worksheet.getCell(`J${currentRow}`).alignment = { horizontal: 'center', vertical: 'middle' };

                addTableBorders(worksheet, 8, currentRow, 1, 22);

                worksheet.mergeCells(`O${currentRow + 1}:R${currentRow + 1}`)
                worksheet.getCell(`O${currentRow + 1}`).value = 'Cán bộ CT kiểm tra trong ca';
                worksheet.getCell(`O${currentRow + 1}`).font = { bold: true };
                worksheet.getCell(`O${currentRow + 1}`).alignment = { horizontal: 'center', vertical: 'middle' };
                worksheet.mergeCells(`O${currentRow + 2}:R${currentRow + 2}`)
                worksheet.getCell(`O${currentRow + 2}`).value = '( Ký, ghi rõ họ tên)';
                worksheet.getCell(`O${currentRow + 2}`).alignment = { horizontal: 'center', vertical: 'middle' };
                if (signature) {
                    const response = await axios.get(signature, { responseType: 'arraybuffer' });
                    const extension = response.headers['content-type'].split('/')[1];
                    const imageBuffer = Buffer.from(response.data, 'binary');

                    const imageId = workbook.addImage({
                        buffer: imageBuffer,
                        extension
                    });

                    worksheet.mergeCells(`P${currentRow + 4}:Q${currentRow + 7}`);

                    // gán ảnh trực tiếp vào range
                    worksheet.addImage(imageId, `P${currentRow + 4}:Q${currentRow + 7}`);
                }


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
                worksheet.getColumn(3).width = 10;
                // worksheet.getColumn(3).alignment = { horizontal: 'center', vertical: 'middle', }
                worksheet.getColumn(4).width = 15;
                // worksheet.getColumn(4).alignment = { horizontal: 'center', vertical: 'middle', }
                worksheet.getColumn(5).width = 20;
                worksheet.getColumn(6).width = 15;
                worksheet.getColumn(7).width = 15;
                worksheet.getColumn(8).width = 15;
                worksheet.getColumn(9).width = 15;
                worksheet.getColumn(10).width = 15;
                worksheet.getColumn(11).width = 15;
                worksheet.getColumn(12).width = 15;
                worksheet.getColumn(13).width = 15;
                worksheet.getColumn(14).width = 15;
                worksheet.getColumn(15).width = 15;
                worksheet.getColumn(16).width = 15;
                worksheet.getColumn(17).width = 15;
                worksheet.getColumn(18).width = 15;
                worksheet.getColumn(19).width = 15;
                worksheet.getColumn(20).width = 15;
                worksheet.getColumn(21).width = 15;


                worksheet.eachRow((row, rowNumber) => {
                    row.eachCell((cell) => {
                        if (!cell.font) cell.font = {};
                        cell.font = {
                            ...cell.font,            // giữ lại các thuộc tính khác (bold, italic,…)
                            name: 'Times New Roman', // đổi font chữ
                            ...(rowNumber > 3 ? { size: 12 } : {})            // kích thước chữ
                        };
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
        req.logger.info(`✅ Export excel thành công`);

    } catch (err) {
        req.logger.error("❌ Lỗi khi export", err);
        res.status(500).json({ status: 'error', message: err.message, stack: err.stack })
    }
});
// báo tổng hợp máy gạt
router.post('/dozerReport/view', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER), async (req, res, next) => {
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
            .populate({
                path: "assistants",
                select: "fullName salaryCode",
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
                d.category?.name?.toLowerCase().includes("máy gạt")
            ) &&
            order.job?.type === JOB_TYPE.VAN_HANH_GAT
        );

        let result = []
        for (const order of filteredOrders) {
            const combined = getCombinedUsers(order);

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

            const grouped = groupDozer(reports)

            result.push({
                _id: order._id,
                assignedTo: combined,
                reports: grouped.map(g => ({
                    code: g.device?.code || '',
                    materials: g.materials || [],
                    fuelRemain: order?.shiftReport?.vehicleSummaries.find(i => i.vehicle?._id.toString() === g.device?._id.toString())?.fuelRemain || '',
                    fuelReceived: order?.shiftReport?.vehicleSummaries.find(i => i.vehicle?._id.toString() === g.device?._id.toString())?.fuelReceived || '',
                    fuelRemainEnd: order?.shiftReport?.vehicleSummaries.find(i => i.vehicle?._id.toString() === g.device?._id.toString())?.fuelRemainEnd || '',
                    travelHours: order?.shiftReport?.vehicleSummaries.find(i => i.vehicle?._id.toString() === g.device?._id.toString())?.travelHours || '',
                }))
            });
        }

        res.status(200).json({ status: 'success', data: result })
    } catch (err) {
        req.logger.error("❌ Lỗi khi load", err);
        res.status(500).json({ status: 'error', message: err.message, stack: err.stack })
    }
})
router.post('/dozerReport', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER), async (req, res, next) => {
    try {
        const { shift, startDate, endDate, title, signature, department } = req.body
        const user = req.user
        const shiftList = await Shift.find({ _id: { $in: shift } });
        const start = new Date(startDate);
        const end = new Date(endDate);
        let dep;
        if (department) {
            dep = await Department.findById(department).select('code')
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
                    .populate({
                        path: "assistants",
                        select: "fullName salaryCode",
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
                        d.category?.name?.toLowerCase().includes("máy gạt")
                    ) &&
                    order.job?.type === JOB_TYPE.VAN_HANH_GAT
                );


                const sheetName = `${formatDate(d)}_${ca.name}`.replace(/[\\\/:*?\[\]]/g, '-').substring(0, 31);

                const worksheet = workbook.addWorksheet(sheetName);

                worksheet.mergeCells(`B1:S1`);
                const infoRow = worksheet.getCell('B1');
                infoRow.value = "CÔNG TY CỔ PHẦN THAN CAO SƠN-TKV";
                infoRow.font = { italic: true, size: 18 };
                // Tiêu đề bảng
                worksheet.mergeCells(`A3:S3`);
                const header = worksheet.getCell('A3');
                header.value = 'BÁO CÁO TỔNG HỢP SỐ LIỆU TRONG CA (MÁY GẠT)';
                header.font = { bold: true, size: 16 };
                header.alignment = { horizontal: 'center', vertical: 'middle' };

                worksheet.getCell('B4').value = "Ngày";
                worksheet.getCell('C4').value = formatDate(d);
                worksheet.getCell('E4').value = "Ca";
                worksheet.getCell('F4').value = ca?.name || '';

                worksheet.getCell('B5').value = "Đơn vị";
                worksheet.getCell('C5').value = dep?.code || '';
                worksheet.getCell('E5').value = "Giờ hệ thống";
                worksheet.getCell('F5').value = new Date().toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                });

                worksheet.getCell('B6').value = "Người ra lệnh";
                worksheet.mergeCells(`C6:D6`);
                worksheet.getCell('C6').value = user?.fullName || '';
                worksheet.getCell('E6').value = "Số thẻ";
                worksheet.getCell('F6').value = user?.salaryCode || '';
                worksheet.getCell('G6').value = "Chức vụ";
                worksheet.mergeCells('H6:S6')
                worksheet.getCell('H6').value = user?.position?.name || '';


                // ==== HÀNG 1 ==== (STT, Người nhận lệnh, ... cố định 5-6 cột đầu)
                setMergeCellHeader(worksheet, 'A8:A9', 'STT')
                setMergeCellHeader(worksheet, 'B8:B9', "Người nhận lệnh")
                setMergeCellHeader(worksheet, 'C8:C9', "Số thẻ")
                setMergeCellHeader(worksheet, 'D8:D9', "Máy gạt")
                setMergeCellHeader(worksheet, 'E8:E9', "Loại vật liệu")
                setMergeCellHeader(worksheet, 'F8:G8', "Giờ sản phẩm (phút)")

                // ==== HÀNG 2 ==== ( gio san pham)
                setCellHeader(worksheet, 'F9', "Định mức")
                setCellHeader(worksheet, 'G9', "Thực hiện")

                // ==== HÀNG 1 ==== (Nhien lieu)
                setMergeCellHeader(worksheet, 'H8:N8', "Nhiên liệu/Điện năng")

                // ==== HÀNG 2 ==== ( Nhien lieu)
                setCellHeader(worksheet, 'H9', "Tồn dầu")
                setCellHeader(worksheet, 'I9', "Lĩnh")
                setCellHeader(worksheet, 'J9', "Tồn cuối")
                setCellHeader(worksheet, 'K9', "Tiêu thụ")
                setCellHeader(worksheet, 'L9', "Định mức")
                setCellHeader(worksheet, 'M9', "Tiết kiệm")
                setCellHeader(worksheet, 'N9', "Vượt")

                // ==== HÀNG 1 ==== (Su dung thiet bi)
                setMergeCellHeader(worksheet, 'O8:Q8', "Sử dụng thiết bị (giờ)")

                // ==== HÀNG 2 ==== ( Nhien lieu)
                setCellHeader(worksheet, 'O9', "Giờ hoạt động")
                setCellHeader(worksheet, 'P9', "Giờ ngừng")
                setCellHeader(worksheet, 'Q9', "Giờ hoạt động lũy kế")

                // ==== HÀNG 1 ==== 
                setMergeCellHeader(worksheet, 'R8:R9', "Bồi dưỡng (đồng)")
                setMergeCellHeader(worksheet, 'S8:S9', "Lương tạm tính")

                let result = []
                for (const order of filteredOrders) {
                    const combined = getCombinedUsers(order);

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

                    const grouped = groupDozer(reports)

                    result.push({
                        _id: order._id,
                        assignedTo: combined,
                        reports: grouped.map(g => ({
                            code: g.device?.code || '',
                            materials: g.materials || [],
                            fuelRemain: order?.shiftReport?.vehicleSummaries.find(i => i.vehicle?._id.toString() === g.device?._id.toString())?.fuelRemain || '',
                            fuelReceived: order?.shiftReport?.vehicleSummaries.find(i => i.vehicle?._id.toString() === g.device?._id.toString())?.fuelReceived || '',
                            fuelRemainEnd: order?.shiftReport?.vehicleSummaries.find(i => i.vehicle?._id.toString() === g.device?._id.toString())?.fuelRemainEnd || '',
                            travelHours: order?.shiftReport?.vehicleSummaries.find(i => i.vehicle?._id.toString() === g.device?._id.toString())?.travelHours || '',
                        }))
                    });
                }

                let currentRow = 10;

                result.forEach((item, idx) => {
                    const reports = (item.reports && item.reports.length)
                        ? item.reports
                        : [{ code: '', materials: [{}] }];

                    // tổng số dòng của người nhận lệnh = tổng số vật liệu trong tất cả reports
                    const spanItem = reports.reduce((sum, r) => sum + (r.materials?.length || 1), 0);
                    const startRowItem = currentRow;

                    reports.forEach((r) => {
                        const mats = r.materials?.length ? r.materials : [{}];
                        const spanReport = mats.length;
                        const startRowReport = currentRow;

                        mats.forEach((m) => {
                            const row = worksheet.getRow(currentRow);

                            // chỉ gán STT / Người nhận lệnh / Số thẻ 1 lần (ở hàng đầu tiên của item)
                            if (currentRow === startRowItem) {
                                row.getCell(1).value = idx + 1;
                                row.getCell(2).value = (item.assignedTo || []).map(u => u?.fullName).join('\n');
                                row.getCell(3).value = (item.assignedTo || []).map(u => u?.salaryCode).join('\n');
                            }

                            // máy gạt (report code) – chỉ gán ở hàng đầu của report
                            if (currentRow === startRowReport) {
                                row.getCell(4).value = r.code || '';
                            }

                            // vật liệu
                            row.getCell(5).value = m?.material?.name || '';
                            row.getCell(7).value = m?.workingMinutes || '';

                            if (currentRow === startRowReport) {
                                row.getCell(8).value = r.fuelRemain || '';
                                row.getCell(9).value = r.fuelReceived || '';
                                row.getCell(10).value = r.fuelRemainEnd || '';
                                row.getCell(11).value = (r.fuelRemain || 0) + (r.fuelReceived || 0) - (r.fuelRemainEnd || 0) || '';
                                row.getCell(12).value = '';
                                row.getCell(13).value = '';
                                row.getCell(14).value = '';
                                row.getCell(15).value = r?.travelHours || '';
                                row.getCell(16).value = '';
                                row.getCell(17).value = '';
                                row.getCell(18).value = '';
                                row.getCell(19).value = '';
                            }

                            // căn chỉnh
                            row.eachCell((cell) => {
                                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                            });
                            row.getCell(2).alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
                            row.getCell(3).alignment = { horizontal: 'center', vertical: 'top', wrapText: true };

                            currentRow++;
                        });

                        const reportCols = ['H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S'];
                        // merge cột D (máy gạt) cho số dòng vật liệu của report
                        if (spanReport > 1) {
                            worksheet.mergeCells(`D${startRowReport}:D${currentRow - 1}`);
                            reportCols.forEach(col => {
                                worksheet.mergeCells(`${col}${startRowReport}:${col}${currentRow - 1}`)
                            })
                        }
                    });

                    // merge A–C (STT, Người nhận lệnh, Số thẻ) cho toàn bộ item
                    if (spanItem > 1) {
                        ['A', 'B', 'C'].forEach(col => {
                            worksheet.mergeCells(`${col}${startRowItem}:${col}${currentRow - 1}`);
                        });
                    }
                    const numUsers = (item.assignedTo?.length || 1);
                    const numReports = reports.length;
                    const maxLines = Math.max(numUsers, numReports);
                    worksheet.getRow(startRowItem).height = maxLines * 15;
                });



                addTableBorders(worksheet, 8, currentRow, 1, 19);

                worksheet.mergeCells(`O${currentRow + 1}:R${currentRow + 1}`)
                worksheet.getCell(`O${currentRow + 1}`).value = 'Cán bộ CT kiểm tra trong ca';
                worksheet.getCell(`O${currentRow + 1}`).font = { bold: true };
                worksheet.getCell(`O${currentRow + 1}`).alignment = { horizontal: 'center', vertical: 'middle' };
                worksheet.mergeCells(`O${currentRow + 2}:R${currentRow + 2}`)
                worksheet.getCell(`O${currentRow + 2}`).value = '( Ký, ghi rõ họ tên)';
                worksheet.getCell(`O${currentRow + 2}`).alignment = { horizontal: 'center', vertical: 'middle' };
                if (signature) {
                    const response = await axios.get(signature, { responseType: 'arraybuffer' });
                    const extension = response.headers['content-type'].split('/')[1];
                    const imageBuffer = Buffer.from(response.data, 'binary');

                    const imageId = workbook.addImage({
                        buffer: imageBuffer,
                        extension
                    });

                    worksheet.mergeCells(`P${currentRow + 4}:Q${currentRow + 7}`);

                    // gán ảnh trực tiếp vào range
                    worksheet.addImage(imageId, `P${currentRow + 4}:Q${currentRow + 7}`);
                }


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
                worksheet.getColumn(3).width = 10;
                // worksheet.getColumn(3).alignment = { horizontal: 'center', vertical: 'middle', }
                worksheet.getColumn(4).width = 15;
                // worksheet.getColumn(4).alignment = { horizontal: 'center', vertical: 'middle', }
                worksheet.getColumn(5).width = 20;
                worksheet.getColumn(6).width = 15;
                worksheet.getColumn(7).width = 15;
                worksheet.getColumn(8).width = 15;
                worksheet.getColumn(9).width = 15;
                worksheet.getColumn(10).width = 15;
                worksheet.getColumn(11).width = 15;
                worksheet.getColumn(12).width = 15;
                worksheet.getColumn(13).width = 15;
                worksheet.getColumn(14).width = 15;
                worksheet.getColumn(15).width = 15;
                worksheet.getColumn(16).width = 15;
                worksheet.getColumn(17).width = 15;
                worksheet.getColumn(18).width = 15;
                worksheet.getColumn(19).width = 15;


                worksheet.eachRow((row, rowNumber) => {
                    row.eachCell((cell) => {
                        if (!cell.font) cell.font = {};
                        cell.font = {
                            ...cell.font,            // giữ lại các thuộc tính khác (bold, italic,…)
                            name: 'Times New Roman', // đổi font chữ
                            ...(rowNumber > 3 ? { size: 12 } : {})            // kích thước chữ
                        };
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
        req.logger.info(`✅ Export excel thành công`);

    } catch (err) {
        req.logger.error("❌ Lỗi khi export", err);
        res.status(500).json({ status: 'error', message: err.message, stack: err.stack })
    }
});

// báo tổng hợp máy khoan
router.post('/drillReport/view', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER), async (req, res, next) => {
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
            .populate({
                path: "assistants",
                select: "fullName salaryCode",
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
                d.category?.name?.toLowerCase().includes("máy khoan")
            ) &&
            order.job?.type === JOB_TYPE.VAN_HANH_KHOAN
        );

        let result = []
        for (const order of filteredOrders) {
            const combined = getCombinedUsers(order);

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

            const grouped = groupDrill(reports)

            result.push({
                _id: order._id,
                assignedTo: combined,
                reports: grouped.map(g => ({
                    code: g.device?.code || '',
                    materials: g.materials || [],
                    fuelRemain: order?.shiftReport?.vehicleSummaries.find(i => i.vehicle?._id.toString() === g.device?._id.toString())?.fuelRemain || '',
                    fuelReceived: order?.shiftReport?.vehicleSummaries.find(i => i.vehicle?._id.toString() === g.device?._id.toString())?.fuelReceived || '',
                    fuelRemainEnd: order?.shiftReport?.vehicleSummaries.find(i => i.vehicle?._id.toString() === g.device?._id.toString())?.fuelRemainEnd || '',
                    travelHours: order?.shiftReport?.vehicleSummaries.find(i => i.vehicle?._id.toString() === g.device?._id.toString())?.travelHours || '',
                }))
            });
        }

        res.status(200).send({ status: 'success', data: result })
    } catch (err) {
        req.logger.error("❌ Lỗi khi load", err);
        res.status(500).json({ status: 'error', message: err.message, stack: err.stack })
    }
})
router.post('/drillReport', verifyToken, restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER), async (req, res, next) => {
    try {
        const { shift, startDate, endDate, title, signature, department } = req.body
        const user = req.user
        const shiftList = await Shift.find({ _id: { $in: shift } });
        const start = new Date(startDate);
        const end = new Date(endDate);
        let dep;
        if (department) {
            dep = await Department.findById(department).select('code')
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
                    .populate({
                        path: "assistants",
                        select: "fullName salaryCode",
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
                        d.category?.name?.toLowerCase().includes("máy khoan")
                    ) &&
                    order.job?.type === JOB_TYPE.VAN_HANH_KHOAN
                );


                const sheetName = `${formatDate(d)}_${ca.name}`.replace(/[\\\/:*?\[\]]/g, '-').substring(0, 31);

                const worksheet = workbook.addWorksheet(sheetName);

                worksheet.mergeCells(`B1:S1`);
                const infoRow = worksheet.getCell('B1');
                infoRow.value = "CÔNG TY CỔ PHẦN THAN CAO SƠN-TKV";
                infoRow.font = { italic: true, size: 18 };
                // Tiêu đề bảng
                worksheet.mergeCells(`A3:S3`);
                const header = worksheet.getCell('A3');
                header.value = 'BÁO CÁO TỔNG HỢP SỐ LIỆU TRONG CA (MÁY KHOAN)';
                header.font = { bold: true, size: 16 };
                header.alignment = { horizontal: 'center', vertical: 'middle' };

                worksheet.getCell('B4').value = "Ngày";
                worksheet.getCell('C4').value = formatDate(d);
                worksheet.getCell('E4').value = "Ca";
                worksheet.getCell('F4').value = ca?.name || '';

                worksheet.getCell('B5').value = "Đơn vị";
                worksheet.getCell('C5').value = dep?.code || '';
                worksheet.getCell('E5').value = "Giờ hệ thống";
                worksheet.getCell('F5').value = new Date().toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                });

                worksheet.getCell('B6').value = "Người ra lệnh";
                worksheet.mergeCells(`C6:D6`);
                worksheet.getCell('C6').value = user?.fullName || '';
                worksheet.getCell('E6').value = "Số thẻ";
                worksheet.getCell('F6').value = user?.salaryCode || '';
                worksheet.getCell('G6').value = "Chức vụ";
                worksheet.mergeCells('H6:S6')
                worksheet.getCell('H6').value = user?.position?.name || '';


                // ==== HÀNG 1 ==== (STT, Người nhận lệnh, ... cố định 5-6 cột đầu)
                setMergeCellHeader(worksheet, 'A8:A9', 'STT')
                setMergeCellHeader(worksheet, 'B8:B9', "Người nhận lệnh")
                setMergeCellHeader(worksheet, 'C8:C9', "Số thẻ")
                setMergeCellHeader(worksheet, 'D8:D9', "Máy KHOAN")
                setMergeCellHeader(worksheet, 'E8:E9', "Loại vật liệu")
                setMergeCellHeader(worksheet, 'F8:G8', "Mét khoan sâu (mét)")

                // ==== HÀNG 2 ==== ( gio san pham)
                setCellHeader(worksheet, 'F9', "Định mức")
                setCellHeader(worksheet, 'G9', "Thực hiện")

                setMergeCellHeader(worksheet, 'H8:H9', "Độ cứng")

                // ==== HÀNG 1 ==== (Nhien lieu)
                setMergeCellHeader(worksheet, 'I8:O8', "Nhiên liệu/Điện năng")

                // ==== HÀNG 2 ==== ( Nhien lieu)
                setCellHeader(worksheet, 'I9', "Tồn dầu")
                setCellHeader(worksheet, 'J9', "Lĩnh")
                setCellHeader(worksheet, 'K9', "Tồn cuối")
                setCellHeader(worksheet, 'L9', "Tiêu thụ")
                setCellHeader(worksheet, 'M9', "Định mức")
                setCellHeader(worksheet, 'N9', "Tiết kiệm")
                setCellHeader(worksheet, 'O9', "Vượt")

                // ==== HÀNG 1 ==== (Su dung thiet bi)
                setMergeCellHeader(worksheet, 'P8:R8', "Sử dụng thiết bị (giờ)")

                // ==== HÀNG 2 ==== ( Nhien lieu)
                setCellHeader(worksheet, 'P9', "Giờ hoạt động")
                setCellHeader(worksheet, 'Q9', "Giờ ngừng")
                setCellHeader(worksheet, 'R9', "Giờ hoạt động lũy kế")

                // ==== HÀNG 1 ==== 
                setMergeCellHeader(worksheet, 'S8:S9', "Bồi dưỡng (đồng)")
                setMergeCellHeader(worksheet, 'T8:T9', "Lương tạm tính")

                let result = []
                for (const order of filteredOrders) {
                    const combined = getCombinedUsers(order);

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

                    const grouped = groupDrill(reports)

                    result.push({
                        _id: order._id,
                        assignedTo: combined,
                        reports: grouped.map(g => ({
                            code: g.device?.code || '',
                            materials: g.materials || [],
                            fuelRemain: order?.shiftReport?.vehicleSummaries.find(i => i.vehicle?._id.toString() === g.device?._id.toString())?.fuelRemain || '',
                            fuelReceived: order?.shiftReport?.vehicleSummaries.find(i => i.vehicle?._id.toString() === g.device?._id.toString())?.fuelReceived || '',
                            fuelRemainEnd: order?.shiftReport?.vehicleSummaries.find(i => i.vehicle?._id.toString() === g.device?._id.toString())?.fuelRemainEnd || '',
                            travelHours: order?.shiftReport?.vehicleSummaries.find(i => i.vehicle?._id.toString() === g.device?._id.toString())?.travelHours || '',
                        }))
                    });
                }

                let currentRow = 10;

                result.forEach((item, idx) => {
                    const reports = (item.reports && item.reports.length)
                        ? item.reports
                        : [{ code: '', materials: [{}] }];

                    // tổng số dòng của người nhận lệnh = tổng số vật liệu trong tất cả reports
                    const spanItem = reports.reduce((sum, r) => sum + (r.materials?.length || 1), 0);
                    const startRowItem = currentRow;

                    reports.forEach((r) => {
                        const mats = r.materials?.length ? r.materials : [{}];
                        const spanReport = mats.length;
                        const startRowReport = currentRow;

                        mats.forEach((m) => {
                            const row = worksheet.getRow(currentRow);


                            // chỉ gán STT / Người nhận lệnh / Số thẻ 1 lần (ở hàng đầu tiên của item)
                            if (currentRow === startRowItem) {
                                row.getCell(1).value = idx + 1;
                                row.getCell(2).value = (item.assignedTo || []).map(u => u?.fullName).join('\n');
                                row.getCell(3).value = (item.assignedTo || []).map(u => u?.salaryCode).join('\n');
                            }

                            // máy gạt (report code) – chỉ gán ở hàng đầu của report
                            if (currentRow === startRowReport) {
                                row.getCell(4).value = r.code || '';
                            }

                            // vật liệu
                            row.getCell(5).value = m?.material?.name || '';
                            row.getCell(7).value = m?.drillDepth || '';
                            row.getCell(8).value = m?.hardnessF || '';

                            if (currentRow === startRowReport) {
                                row.getCell(9).value = r.fuelRemain || '';
                                row.getCell(10).value = r.fuelReceived || '';
                                row.getCell(11).value = r.fuelRemainEnd || '';
                                row.getCell(12).value = (r.fuelRemain || 0) + (r.fuelReceived || 0) - (r.fuelRemainEnd || 0) || '';
                                row.getCell(13).value = '';
                                row.getCell(14).value = '';
                                row.getCell(15).value = '';
                                row.getCell(16).value = r?.travelHours || '';
                                row.getCell(17).value = '';
                                row.getCell(18).value = '';
                                row.getCell(19).value = '';
                                row.getCell(20).value = '';
                            }

                            // căn chỉnh
                            row.eachCell((cell) => {
                                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                            });
                            row.getCell(2).alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
                            row.getCell(3).alignment = { horizontal: 'center', vertical: 'top', wrapText: true };

                            currentRow++;
                        });

                        const reportCols = ['I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
                        // merge cột D (máy gạt) cho số dòng vật liệu của report
                        if (spanReport > 1) {
                            worksheet.mergeCells(`D${startRowReport}:D${currentRow - 1}`);
                            reportCols.forEach(col => {
                                worksheet.mergeCells(`${col}${startRowReport}:${col}${currentRow - 1}`)
                            })
                        }
                    });

                    // merge A–C (STT, Người nhận lệnh, Số thẻ) cho toàn bộ item
                    if (spanItem > 1) {
                        ['A', 'B', 'C'].forEach(col => {
                            worksheet.mergeCells(`${col}${startRowItem}:${col}${currentRow - 1}`);
                        });
                    }
                    const numUsers = (item.assignedTo?.length || 1);
                    const numReports = reports.length;
                    const maxLines = Math.max(numUsers, numReports);
                    worksheet.getRow(startRowItem).height = maxLines * 15;
                });



                addTableBorders(worksheet, 8, currentRow, 1, 20);

                worksheet.mergeCells(`O${currentRow + 1}:R${currentRow + 1}`)
                worksheet.getCell(`O${currentRow + 1}`).value = 'Cán bộ CT kiểm tra trong ca';
                worksheet.getCell(`O${currentRow + 1}`).font = { bold: true };
                worksheet.getCell(`O${currentRow + 1}`).alignment = { horizontal: 'center', vertical: 'middle' };
                worksheet.mergeCells(`O${currentRow + 2}:R${currentRow + 2}`)
                worksheet.getCell(`O${currentRow + 2}`).value = '( Ký, ghi rõ họ tên)';
                worksheet.getCell(`O${currentRow + 2}`).alignment = { horizontal: 'center', vertical: 'middle' };
                if (signature) {
                    const response = await axios.get(signature, { responseType: 'arraybuffer' });
                    const extension = response.headers['content-type'].split('/')[1];
                    const imageBuffer = Buffer.from(response.data, 'binary');

                    const imageId = workbook.addImage({
                        buffer: imageBuffer,
                        extension
                    });

                    worksheet.mergeCells(`P${currentRow + 4}:Q${currentRow + 7}`);

                    // gán ảnh trực tiếp vào range
                    worksheet.addImage(imageId, `P${currentRow + 4}:Q${currentRow + 7}`);
                }


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
                worksheet.getColumn(3).width = 10;
                // worksheet.getColumn(3).alignment = { horizontal: 'center', vertical: 'middle', }
                worksheet.getColumn(4).width = 15;
                // worksheet.getColumn(4).alignment = { horizontal: 'center', vertical: 'middle', }
                worksheet.getColumn(5).width = 20;
                worksheet.getColumn(6).width = 15;
                worksheet.getColumn(7).width = 15;
                worksheet.getColumn(8).width = 15;
                worksheet.getColumn(9).width = 15;
                worksheet.getColumn(10).width = 15;
                worksheet.getColumn(11).width = 15;
                worksheet.getColumn(12).width = 15;
                worksheet.getColumn(13).width = 15;
                worksheet.getColumn(14).width = 15;
                worksheet.getColumn(15).width = 15;
                worksheet.getColumn(16).width = 15;
                worksheet.getColumn(17).width = 15;
                worksheet.getColumn(18).width = 15;
                worksheet.getColumn(19).width = 15;
                worksheet.getColumn(20).width = 15;


                worksheet.eachRow((row, rowNumber) => {
                    row.eachCell((cell) => {
                        if (!cell.font) cell.font = {};
                        cell.font = {
                            ...cell.font,            // giữ lại các thuộc tính khác (bold, italic,…)
                            name: 'Times New Roman', // đổi font chữ
                            ...(rowNumber > 3 ? { size: 12 } : {})            // kích thước chữ
                        };
                    });
                })
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
        res.status(500).json({ status: 'error', message: err.message, stack: err.stack })
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
                path: 'assistants',
                select: 'fullName salaryCode',
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
            order.job?.type === JOB_TYPE.VAN_HANH_XUC
        );

        let result = []
        for (const order of filteredOrders) {
            const combined = getCombinedUsers(order);

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

            const grouped = groupTripsExcavator(reports)

            result.push({
                _id: order._id,
                assignedTo: combined,
                excavator: (order.device || []).map(d => d?.code) || "",
                reports: grouped.map(g => ({
                    code: g.device?.code || '',
                    trips: g.trips || '',
                    summary: g?.summary || '',
                    totalTrips: g?.totalTrips || ''
                }))
            });
        }
        let maxTrips = 0;
        const materialSet = new Set();

        result.forEach(order => {
            order.reports.forEach(rep => {
                // cập nhật maxTrips
                maxTrips = Math.max(maxTrips, rep.trips.length);

                // gom tất cả material
                rep.trips.forEach(trip => {
                    if (trip.material) {
                        materialSet.add(trip.material);
                    }
                });
            });
        });

        const materials = Array.from(materialSet);

        res.status(200).send({ status: 'success', data: result, materials, maxTrips })
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message, stack: err.stack })
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
            dep = await Department.findById(department).select('code')
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
                        path: 'assistants',
                        select: 'fullName salaryCode',
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
                    const combined = getCombinedUsers(order);

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

                    const grouped = groupTripsExcavator(reports)

                    result.push({
                        _id: order._id,
                        assignedTo: combined,
                        excavator: (order.device || []).map(d => d?.code) || "",
                        reports: grouped.map(g => ({
                            code: g.device?.code || '',
                            trips: g.trips || '',
                            summary: g?.summary || '',
                            totalTrips: g?.totalTrips || ''
                        }))
                    });
                }
                let maxTrips = 0;
                const materialSet = new Set();

                result.forEach(order => {
                    order.reports.forEach(rep => {
                        // cập nhật maxTrips
                        maxTrips = Math.max(maxTrips, rep.trips.length);

                        // gom tất cả material
                        rep.trips.forEach(trip => {
                            if (trip.material) {
                                materialSet.add(trip.material);
                            }
                        });
                    });
                });

                const materials = Array.from(materialSet);

                const sheetName = `${formatDate(d)}_${ca.name}`.replace(/[\\\/:*?\[\]]/g, '-').substring(0, 31);

                const worksheet = workbook.addWorksheet(sheetName);

                const totalColumn = materials.length + (maxTrips || 1) + 6
                const colLetter = getColumnLetter(totalColumn);
                worksheet.mergeCells(`B1:${colLetter}1`);
                const infoRow = worksheet.getCell('B1');
                infoRow.value = "CÔNG TY CỔ PHẦN THAN CAO SƠN-TKV";
                infoRow.font = { italic: true, size: 18 };
                // Tiêu đề bảng
                worksheet.mergeCells(`A3:${colLetter}3`);
                const header = worksheet.getCell('A3');
                header.value = 'BÁO CÁO SỐ CHUYẾN MÁY XÚC';
                header.font = { bold: true, size: 16 };
                header.alignment = { horizontal: 'center', vertical: 'middle' };

                worksheet.getCell('B4').value = "Ngày";
                worksheet.getCell('C4').value = formatDate(d);
                worksheet.getCell('E4').value = "Ca";
                worksheet.getCell('F4').value = ca?.name || '';

                worksheet.getCell('B5').value = "Đơn vị";
                worksheet.getCell('C5').value = dep?.code || '';
                worksheet.getCell('E5').value = "Giờ hệ thống";
                worksheet.getCell('F5').value = new Date().toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                });

                worksheet.getCell('B6').value = "Người ra lệnh";
                worksheet.mergeCells(`C6:D6`);
                worksheet.getCell('C6').value = user?.fullName || '';
                worksheet.getCell('E6').value = "Số thẻ";
                worksheet.getCell('F6').value = user?.salaryCode || '';
                worksheet.getCell('G6').value = "Chức vụ";
                worksheet.mergeCells(`H6:${colLetter}5`)
                worksheet.getCell('H6').value = user?.position?.name || '';

                const headerRow = 8;

                // ==== HÀNG 1 ==== (STT, Người nhận lệnh, ... cố định 5-6 cột đầu)
                worksheet.mergeCells(headerRow, 1, headerRow + 1, 1); // STT
                worksheet.getCell(headerRow, 1).value = "STT";
                worksheet.getCell(headerRow, 1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
                worksheet.getCell(headerRow, 1).font = { bold: true, }

                worksheet.mergeCells(headerRow, 2, headerRow + 1, 2); // Người nhận lệnh
                worksheet.getCell(headerRow, 2).value = "Người nhận lệnh";
                worksheet.getCell(headerRow, 2).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
                worksheet.getCell(headerRow, 2).font = { bold: true, }

                worksheet.mergeCells(headerRow, 3, headerRow + 1, 3); // Số thẻ
                worksheet.getCell(headerRow, 3).value = "Số thẻ";
                worksheet.getCell(headerRow, 3).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
                worksheet.getCell(headerRow, 3).font = { bold: true, }

                worksheet.mergeCells(headerRow, 4, headerRow + 1, 4); // Máy xúc
                worksheet.getCell(headerRow, 4).value = "Máy xúc";
                worksheet.getCell(headerRow, 4).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
                worksheet.getCell(headerRow, 4).font = { bold: true, }

                worksheet.mergeCells(headerRow, 5, headerRow + 1, 5); // Xe nhận tải
                worksheet.getCell(headerRow, 5).value = "Xe nhận tải";
                worksheet.getCell(headerRow, 5).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
                worksheet.getCell(headerRow, 5).font = { bold: true, }


                // ==== HÀNG 1 ==== (Thời điểm xúc tải - Loại vật liệu, colSpan = maxTrips)
                const startTripsCol = 6;
                const endTripsCol = startTripsCol + (maxTrips || 1) - 1;
                worksheet.mergeCells(headerRow, startTripsCol, headerRow, endTripsCol);
                worksheet.getCell(headerRow, startTripsCol).value = "Thời điểm xúc tải - Loại vật liệu";
                worksheet.getCell(headerRow, startTripsCol).alignment = { horizontal: 'center', vertical: 'middle', }
                worksheet.getCell(headerRow, startTripsCol).font = { bold: true, }

                // ==== HÀNG 2 ==== (1..maxTrips)
                for (let i = 0; i < (maxTrips || 1); i++) {
                    worksheet.getCell(headerRow + 1, startTripsCol + i).value = i + 1;
                    worksheet.getCell(headerRow + 1, startTripsCol + i).alignment = { horizontal: 'center', vertical: 'middle', }
                    worksheet.getCell(headerRow + 1, startTripsCol + i).font = { bold: true, }
                }

                // ==== HÀNG 1 ==== (Tổng hợp, colSpan = materials.length + 1 cho Tổng chuyến)
                const startSummaryCol = endTripsCol + 1;
                const endSummaryCol = startSummaryCol + materials.length;
                worksheet.mergeCells(headerRow, startSummaryCol, headerRow, endSummaryCol);
                worksheet.getCell(headerRow, startSummaryCol).value = "Tổng hợp";
                worksheet.getCell(headerRow, startSummaryCol).alignment = { horizontal: 'center', vertical: 'middle', }
                worksheet.getCell(headerRow, startSummaryCol).font = { bold: true, }

                // ==== HÀNG 2 ==== (tên vật liệu + Tổng chuyến)
                materials.forEach((m, idx) => {
                    worksheet.getCell(headerRow + 1, startSummaryCol + idx).value = m?.name || '';
                    worksheet.getCell(headerRow + 1, startSummaryCol + idx).alignment = { horizontal: 'center', vertical: 'middle', }
                    worksheet.getCell(headerRow + 1, startSummaryCol + idx).font = { bold: true, }
                });
                worksheet.getCell(headerRow + 1, endSummaryCol).value = "Tổng chuyến";
                worksheet.getCell(headerRow + 1, endSummaryCol).alignment = { horizontal: 'center', vertical: 'middle', }
                worksheet.getCell(headerRow + 1, endSummaryCol).font = { bold: true, }

                let currentRow = headerRow + 2
                result.forEach((item, idx) => {
                    const reps = (item.reports && item.reports.length)
                        ? item.reports
                        : [{ code: '', trips: [], summary: {}, totalTrips: 0 }];

                    const spanReps = reps.length;
                    const startRow = currentRow;
                    reps.forEach((r, i) => {
                        const row = worksheet.getRow(currentRow);

                        if (i === 0) {
                            // STT
                            row.getCell(1).value = idx + 1;

                            // Người nhận lệnh
                            row.getCell(2).value = (item.assignedTo || [])
                                .map((u) => u?.fullName)
                                .join('\n');

                            // Số thẻ
                            row.getCell(3).value = (item.assignedTo || [])
                                .map((u) => u?.salaryCode)
                                .join('\n');

                            // Máy xúc
                            row.getCell(4).value = item.excavator.join(', ');

                        }

                        // Xe nhận tải
                        row.getCell(5).value = r.code || '';

                        // Các chuyến (1..maxTrips)
                        for (let t = 0; t < maxTrips; t++) {
                            const trip = r.trips[t];
                            if (trip) {
                                row.getCell(6 + t).value =
                                    `${new Date(trip.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}\n${trip.material?.name || ''}`;
                            } else {
                                row.getCell(6 + t).value = "";
                            }
                        }

                        // Tổng hợp vật liệu
                        materials.forEach((m, mIdx) => {
                            row.getCell(6 + maxTrips + mIdx).value = r.summary[m?.name] || 0;
                        });

                        // Tổng chuyến
                        row.getCell(6 + maxTrips + materials.length).value = r.totalTrips || 0;

                        // Căn giữa + wrapText
                        row.eachCell((cell, cellNumber) => {
                            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                        });
                        row.getCell(2).alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
                        row.getCell(3).alignment = { horizontal: 'center', vertical: 'top', wrapText: true };

                        currentRow++;
                    });

                    // merge cho các cột STT, Người nhận lệnh, Số thẻ, Máy xúc
                    if (spanReps > 1) {
                        ['A', 'B', 'C', 'D'].forEach(col => {
                            worksheet.mergeCells(`${col}${currentRow - spanReps}:${col}${currentRow - 1}`);
                        });
                    }
                    const numUsers = (item.assignedTo?.length || 1);
                    const numReports = reps.length;
                    const maxLines = Math.max(numUsers, numReports);
                    worksheet.getRow(startRow).height = maxLines * 15;
                });

                addTableBorders(worksheet, 8, currentRow - 1, 1, totalColumn);

                const startSignature = getColumnLetter(totalColumn - 3);
                const endSignature = getColumnLetter(totalColumn - 1);

                worksheet.mergeCells(`${startSignature}${currentRow + 1}:${endSignature}${currentRow + 1}`)
                worksheet.getCell(`${startSignature}${currentRow + 1}`).value = 'Cán bộ CT kiểm tra trong ca';
                worksheet.getCell(`${startSignature}${currentRow + 1}`).font = { bold: true };
                worksheet.getCell(`${startSignature}${currentRow + 1}`).alignment = { horizontal: 'center', vertical: 'middle' };
                worksheet.mergeCells(`${startSignature}${currentRow + 2}:${endSignature}${currentRow + 2}`)
                worksheet.getCell(`${startSignature}${currentRow + 2}`).value = '( Ký, ghi rõ họ tên)';
                worksheet.getCell(`${startSignature}${currentRow + 2}`).alignment = { horizontal: 'center', vertical: 'middle' };
                if (signature) {
                    const response = await axios.get(signature, { responseType: 'arraybuffer' });
                    const extension = response.headers['content-type'].split('/')[1];
                    const imageBuffer = Buffer.from(response.data, 'binary');

                    const imageId = workbook.addImage({
                        buffer: imageBuffer,
                        extension
                    });

                    worksheet.mergeCells(`${startSignature}${currentRow + 4}:${endSignature}${currentRow + 7}`);

                    // gán ảnh trực tiếp vào range
                    worksheet.addImage(imageId, `${startSignature}${currentRow + 4}:${endSignature}${currentRow + 7}`);
                }

                worksheet.pageSetup = {
                    paperSize: 9,                // A4
                    orientation: 'landscape',    // ngang
                    fitToPage: true,
                    fitToWidth: 1,               // vừa 1 trang theo chiều ngang
                    fitToHeight: 0,              // không ép theo chiều dọc
                    margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } // inch
                };


                const fixedWidths = [6, 20, 10, 12, 12]; // 5 cột đầu

                // gán width
                fixedWidths.forEach((w, i) => worksheet.getColumn(i + 1).width = w);
                for (let col = fixedWidths.length + 1; col <= totalColumn; col++) {
                    worksheet.getColumn(col).width = 120 / (Math.max(totalColumn - fixedWidths.length, 2));
                }

                worksheet.eachRow((row, rowNumber) => {
                    row.eachCell((cell) => {
                        if (!cell.font) cell.font = {};
                        cell.font = {
                            ...cell.font,            // giữ lại các thuộc tính khác (bold, italic,…)
                            name: 'Times New Roman', // đổi font chữ
                            ...(rowNumber > 3 ? { size: 12 } : {})            // kích thước chữ
                        };
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
        console.log(err)
        res.status(500).json({ status: 'error', message: err.message, stack: err.stack })
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
                path: 'device',
                select: 'code',
            })
            .populate({
                path: 'assistants',
                select: 'fullName salaryCode',
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
            r.job?.type === JOB_TYPE.VAN_HANH_XE
        );

        let result = []
        for (const order of filterOrders) {
            const combined = getCombinedUsers(order);

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
                .populate('excavator', 'code')
                .populate('toLocation', 'name')

            reports = reports.filter(r =>
                r.device?.category?.name?.toLowerCase().includes("vận tải".toLowerCase())
            );
            if (!reports.length) continue;
            const grouped = await groupTripsCar(reports)

            result.push({
                _id: order._id,
                device: (order.device || []).map(d => d?.code).join(', ') || "",
                assignedTo: combined,
                reports: grouped.map(g => ({
                    excavator: g.excavator?.code || '',
                    toLocation: g.toLocation?.name || '',
                    trips: g.trips || '',
                    summary: g?.summary || '',
                    totalTrips: g?.totalTrips || '',
                    totalDistance: g?.totalDistance || '',
                }))
            });
        }
        let maxTrips = 0;
        const materialMap = new Map();

        result.forEach(order => {
            order.reports.forEach(rep => {
                // cập nhật maxTrips
                maxTrips = Math.max(maxTrips, rep.trips.length);

                // gom tất cả material
                rep.trips.forEach(trip => {
                    if (trip.material) {
                        // tạo key duy nhất theo _id hoặc name
                        const key = trip.material._id?.toString() || trip.material.name;

                        // chỉ lưu 1 lần duy nhất
                        if (!materialMap.has(key)) {
                            materialMap.set(key, {
                                _id: trip.material._id,
                                name: trip.material.name,
                                ...(trip.material.unit ? { unit: trip.material.unit } : {})
                            });
                        }
                    }
                });
            });
        });

        const materials = Array.from(materialMap.values());

        res.status(200).send({ status: 'success', data: result, maxTrips, materials })
    } catch (err) {
        req.logger.error("❌ Lỗi khi load", err);
        res.status(500).json({ status: 'error', message: err.message, stack: err.stack })
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
            dep = await Department.findById(department).select('code')
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
                        path: 'device',
                        select: 'code',
                    })
                    .populate({
                        path: 'assistants',
                        select: 'fullName salaryCode',
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
                    r.job?.type === JOB_TYPE.VAN_HANH_XE
                );

                let result = []
                for (const order of filterOrders) {
                    const combined = getCombinedUsers(order);

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
                        .populate('excavator', 'code')
                        .populate('toLocation', 'name')

                    reports = reports.filter(r =>
                        r.device?.category?.name?.toLowerCase().includes("vận tải".toLowerCase())
                    );
                    if (!reports.length) continue;
                    const grouped = await groupTripsCar(reports)

                    result.push({
                        _id: order._id,
                        device: (order.device || []).map(d => d?.code).join(', ') || "",
                        assignedTo: combined,
                        reports: grouped.map(g => ({
                            excavator: g.excavator?.code || '',
                            toLocation: g.toLocation?.name || '',
                            trips: g.trips || '',
                            summary: g?.summary || '',
                            totalTrips: g?.totalTrips || '',
                            totalDistance: g?.totalDistance || '',
                        }))
                    });
                }
                let maxTrips = 0;
                const materialMap = new Map();

                result.forEach(order => {
                    order.reports.forEach(rep => {
                        // cập nhật maxTrips
                        maxTrips = Math.max(maxTrips, rep.trips.length);

                        // gom tất cả material
                        rep.trips.forEach(trip => {
                            if (trip.material) {
                                // tạo key duy nhất theo _id hoặc name
                                const key = trip.material._id?.toString() || trip.material.name;

                                // chỉ lưu 1 lần duy nhất
                                if (!materialMap.has(key)) {
                                    materialMap.set(key, {
                                        _id: trip.material._id,
                                        name: trip.material.name,
                                        ...(trip.material.unit ? { unit: trip.material.unit } : {})
                                    });
                                }
                            }
                        });
                    });
                });

                const materials = Array.from(materialMap.values());

                const sheetName = `${formatDate(d)}_${ca.name}`.replace(/[\\\/:*?\[\]]/g, '-').substring(0, 31);

                const worksheet = workbook.addWorksheet(sheetName);

                const totalColumn = materials.length + (maxTrips || 1) + 8
                const colLetter = getColumnLetter(totalColumn);
                worksheet.mergeCells(`B1:${colLetter}1`);
                const infoRow = worksheet.getCell('B1');
                infoRow.value = "CÔNG TY CỔ PHẦN THAN CAO SƠN-TKV";
                infoRow.font = { italic: true, size: 18 };
                // Tiêu đề bảng
                worksheet.mergeCells(`A3:${colLetter}3`);
                const header = worksheet.getCell('A3');
                header.value = 'BÁO CÁO SỐ CHUYẾN Ô TÔ';
                header.font = { bold: true, size: 16 };
                header.alignment = { horizontal: 'center', vertical: 'middle' };

                worksheet.getCell('B4').value = "Ngày";
                worksheet.getCell('C4').value = formatDate(d);
                worksheet.getCell('E4').value = "Ca";
                worksheet.getCell('F4').value = ca?.name || '';

                worksheet.getCell('B5').value = "Đơn vị";
                worksheet.getCell('C5').value = dep?.code || '';
                worksheet.getCell('E5').value = "Giờ hệ thống";
                worksheet.getCell('F5').value = new Date().toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                });

                worksheet.getCell('B6').value = "Người ra lệnh";
                worksheet.mergeCells(`C6:D6`);
                worksheet.getCell('C6').value = user?.fullName || '';
                worksheet.getCell('E6').value = "Số thẻ";
                worksheet.getCell('F6').value = user?.salaryCode || '';
                worksheet.getCell('G6').value = "Chức vụ";
                worksheet.mergeCells(`H6:${colLetter}6`)
                worksheet.getCell('H6').value = user?.position?.name || '';

                const headerRow = 8;

                // ==== HÀNG 1 ==== (STT, Người nhận lệnh, ... cố định 5-6 cột đầu)
                worksheet.mergeCells(headerRow, 1, headerRow + 1, 1); // STT
                worksheet.getCell(headerRow, 1).value = "STT";
                worksheet.getCell(headerRow, 1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
                worksheet.getCell(headerRow, 1).font = { bold: true, }

                worksheet.mergeCells(headerRow, 2, headerRow + 1, 2); // Người nhận lệnh
                worksheet.getCell(headerRow, 2).value = "Người nhận lệnh";
                worksheet.getCell(headerRow, 2).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
                worksheet.getCell(headerRow, 2).font = { bold: true, }

                worksheet.mergeCells(headerRow, 3, headerRow + 1, 3); // Số thẻ
                worksheet.getCell(headerRow, 3).value = "Số thẻ";
                worksheet.getCell(headerRow, 3).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
                worksheet.getCell(headerRow, 3).font = { bold: true, }

                worksheet.mergeCells(headerRow, 4, headerRow + 1, 4); // Máy xúc
                worksheet.getCell(headerRow, 4).value = "Thiết bị vận hành";
                worksheet.getCell(headerRow, 4).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
                worksheet.getCell(headerRow, 4).font = { bold: true, }

                worksheet.mergeCells(headerRow, 5, headerRow + 1, 5); // Xe nhận tải
                worksheet.getCell(headerRow, 5).value = "Máy xúc";
                worksheet.getCell(headerRow, 5).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
                worksheet.getCell(headerRow, 5).font = { bold: true, }

                worksheet.mergeCells(headerRow, 6, headerRow + 1, 6); // Xe nhận tải
                worksheet.getCell(headerRow, 6).value = "Điểm đổ tải";
                worksheet.getCell(headerRow, 6).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
                worksheet.getCell(headerRow, 6).font = { bold: true, }


                // ==== HÀNG 1 ==== (Thời điểm xúc tải - Loại vật liệu, colSpan = maxTrips)
                const startTripsCol = 7;
                const endTripsCol = startTripsCol + (maxTrips || 1);
                worksheet.mergeCells(headerRow, startTripsCol, headerRow, endTripsCol);
                worksheet.getCell(headerRow, startTripsCol).value = "Cung độ - Thời điểm xúc tải - Loại vật liệu";
                worksheet.getCell(headerRow, startTripsCol).alignment = { horizontal: 'center', vertical: 'middle', }
                worksheet.getCell(headerRow, startTripsCol).font = { bold: true, }

                // ==== HÀNG 2 ==== (1..maxTrips)
                worksheet.getCell(headerRow + 1, startTripsCol).value = 'Chuyến';
                worksheet.getCell(headerRow + 1, startTripsCol).alignment = { horizontal: 'center', vertical: 'middle', }
                worksheet.getCell(headerRow + 1, startTripsCol).font = { bold: true, }
                for (let i = 1; i < (maxTrips || 1) + 1; i++) {
                    worksheet.getCell(headerRow + 1, startTripsCol + i).value = i;
                    worksheet.getCell(headerRow + 1, startTripsCol + i).alignment = { horizontal: 'center', vertical: 'middle', }
                    worksheet.getCell(headerRow + 1, startTripsCol + i).font = { bold: true, }
                }

                // ==== HÀNG 1 ==== (Tổng hợp, colSpan = materials.length + 1 cho Tổng chuyến)
                const startSummaryCol = endTripsCol + 1;
                const endSummaryCol = startSummaryCol + materials.length;
                worksheet.mergeCells(headerRow, startSummaryCol, headerRow, endSummaryCol);
                worksheet.getCell(headerRow, startSummaryCol).value = "Tổng hợp";
                worksheet.getCell(headerRow, startSummaryCol).alignment = { horizontal: 'center', vertical: 'middle', }
                worksheet.getCell(headerRow, startSummaryCol).font = { bold: true, }

                // ==== HÀNG 2 ==== (tên vật liệu + Tổng chuyến)
                materials.forEach((m, idx) => {
                    worksheet.getCell(headerRow + 1, startSummaryCol + idx).value = m?.name || '';
                    worksheet.getCell(headerRow + 1, startSummaryCol + idx).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
                    worksheet.getCell(headerRow + 1, startSummaryCol + idx).font = { bold: true, }
                });
                worksheet.getCell(headerRow + 1, endSummaryCol).value = "Tổng cộng";
                worksheet.getCell(headerRow + 1, endSummaryCol).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
                worksheet.getCell(headerRow + 1, endSummaryCol).font = { bold: true, }

                let currentRow = headerRow + 2
                result.forEach((item, idx) => {
                    const reps = (item.reports && item.reports.length)
                        ? item.reports
                        : [{ code: '', trips: [], summary: {}, totalTrips: 0, totalDistance: 0 }];

                    const startRow = currentRow;
                    reps.forEach((r, i) => {
                        const rowStart = currentRow;
                        const row1 = worksheet.getRow(currentRow);

                        if (i === 0) {
                            // STT
                            row1.getCell(1).value = idx + 1;

                            // Người nhận lệnh
                            row1.getCell(2).value = (item.assignedTo || [])
                                .map((u) => u?.fullName)
                                .join('\n');

                            // Số thẻ
                            row1.getCell(3).value = (item.assignedTo || [])
                                .map((u) => u?.salaryCode)
                                .join('\n');

                            // Máy xúc
                            row1.getCell(4).value = item.device || ''

                        }

                        // Xe nhận tải
                        row1.getCell(5).value = r.excavator || '';
                        row1.getCell(6).value = r.toLocation || '';
                        row1.getCell(7).value = 'Cung độ tạm tính(km)';

                        r.trips.forEach((trip, tIdx) => {
                            row1.getCell(8 + tIdx).value = trip?.distance || '';
                        });
                        materials.forEach((m, mIdx) => {
                            row1.getCell(8 + maxTrips + mIdx).value = r.summary?.[m?.name]?.distance || 0;
                        });

                        // ✅ Tổng chuyến: cũng gộp 2 hàng
                        row1.getCell(8 + maxTrips + materials.length).value = r.totalDistance || 0;
                        currentRow++;

                        let row2 = worksheet.getRow(currentRow);
                        row2.getCell(7).value = 'Thời gian';
                        r.trips.forEach((trip, tIdx) => {
                            row2.getCell(8 + tIdx).value = trip?.time
                                ? new Date(trip.time).toLocaleTimeString('vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                })
                                : '';
                        });
                        currentRow++;

                        // --- Hàng 3: Loại vật liệu ---
                        let row3 = worksheet.getRow(currentRow);
                        row3.getCell(7).value = 'Loại vật liệu';
                        r.trips.forEach((trip, tIdx) => {
                            row3.getCell(8 + tIdx).value = trip?.material?.name || '';
                        });

                        // ✅ Tổng hợp vật liệu: ghi vào row2 và merge xuống row3
                        materials.forEach((m, mIdx) => {
                            const col = 8 + maxTrips + mIdx;
                            row2.getCell(col).value = r.summary?.[m?.name]?.count || 0;
                            worksheet.mergeCells(`${row2.getCell(col).address}:${row3.getCell(col).address}`);
                        });

                        // ✅ Tổng chuyến: cũng gộp 2 hàng
                        const totalCol = 8 + maxTrips + materials.length;
                        row2.getCell(totalCol).value = r.totalTrips || 0;
                        worksheet.mergeCells(`${row2.getCell(totalCol).address}:${row3.getCell(totalCol).address}`);

                        currentRow++;

                        // --- Merge Máy xúc + Điểm đổ tải xuống 3 hàng ---
                        worksheet.mergeCells(`E${rowStart}:E${rowStart + 2}`); // cột 5 (E)
                        worksheet.mergeCells(`F${rowStart}:F${rowStart + 2}`);

                        [row1, row2, row3].forEach(row => {
                            row.eachCell(cell => {
                                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                            });
                        });
                        row1.getCell(2).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
                    });


                    // merge cho các cột STT, Người nhận lệnh, Số thẻ, Máy xúc
                    if (reps.length > 1) {
                        ['A', 'B', 'C', 'D'].forEach(col => {
                            worksheet.mergeCells(`${col}${startRow}:${col}${currentRow - 1}`);
                        });
                    }
                    const numUsers = (item.assignedTo?.length || 1);
                    const numReports = reps.length;
                    const maxLines = Math.max(numUsers, numReports);
                    worksheet.getRow(startRow).height = maxLines * 15;
                });

                addTableBorders(worksheet, 8, currentRow, 1, totalColumn);

                const startSignature = getColumnLetter(totalColumn - 3);
                const endSignature = getColumnLetter(totalColumn - 1);

                worksheet.mergeCells(`${startSignature}${currentRow + 1}:${endSignature}${currentRow + 1}`)
                worksheet.getCell(`${startSignature}${currentRow + 1}`).value = 'Cán bộ CT kiểm tra trong ca';
                worksheet.getCell(`${startSignature}${currentRow + 1}`).font = { bold: true };
                worksheet.getCell(`${startSignature}${currentRow + 1}`).alignment = { horizontal: 'center', vertical: 'middle' };
                worksheet.mergeCells(`${startSignature}${currentRow + 2}:${endSignature}${currentRow + 2}`)
                worksheet.getCell(`${startSignature}${currentRow + 2}`).value = '( Ký, ghi rõ họ tên)';
                worksheet.getCell(`${startSignature}${currentRow + 2}`).alignment = { horizontal: 'center', vertical: 'middle' };
                if (signature) {
                    const response = await axios.get(signature, { responseType: 'arraybuffer' });
                    const extension = response.headers['content-type'].split('/')[1];
                    const imageBuffer = Buffer.from(response.data, 'binary');

                    const imageId = workbook.addImage({
                        buffer: imageBuffer,
                        extension
                    });

                    worksheet.mergeCells(`${startSignature}${currentRow + 4}:${endSignature}${currentRow + 7}`);

                    // gán ảnh trực tiếp vào range
                    worksheet.addImage(imageId, `${startSignature}${currentRow + 4}:${endSignature}${currentRow + 7}`);
                }

                worksheet.pageSetup = {
                    paperSize: 9,                // A4
                    orientation: 'landscape',    // ngang
                    fitToPage: true,
                    fitToWidth: 1,               // vừa 1 trang theo chiều ngang
                    fitToHeight: 0,              // không ép theo chiều dọc
                    margins: { left: 0.3, right: 0.3, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 } // inch
                };


                const fixedWidths = [6, 15, 7, 12, 10, 10, 10]; // 5 cột đầu

                // gán width
                fixedWidths.forEach((w, i) => worksheet.getColumn(i + 1).width = w);
                for (let col = fixedWidths.length + 1; col <= totalColumn; col++) {
                    worksheet.getColumn(col).width = 110 / (Math.max(totalColumn - fixedWidths.length, 2));
                }

                worksheet.eachRow((row, rowNumber) => {
                    row.eachCell((cell) => {
                        if (!cell.font) cell.font = {};
                        cell.font = {
                            ...cell.font,            // giữ lại các thuộc tính khác (bold, italic,…)
                            name: 'Times New Roman', // đổi font chữ
                            ...(rowNumber > 3 ? { size: 12 } : {})            // kích thước chữ
                        };
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
        res.status(500).json({ status: 'error', message: err.message, stack: err.stack })
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
            .populate('excavator.device', 'code')
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
        res.status(500).json({ status: 'error', message: err.message, stack: err.stack })
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
                    .populate('excavator.device', 'code')
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
        res.status(500).json({ status: 'error', message: err.message, stack: err.stack })
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
        res.status(500).json({ status: 'error', message: err.message, stack: err.stack })
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
        res.status(500).json({ status: 'error', message: err.message, stack: err.stack })
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
            .populate('excavator.device', 'code')
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
        res.status(500).json({ status: 'error', message: err.message, stack: err.stack })
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
                    .populate('excavator.device', 'code')
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
        res.status(500).json({ status: 'error', message: err.message, stack: err.stack })
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
                    .populate('excavator.device', 'code')
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
        res.status(500).json({ status: 'error', message: err.message, stack: err.stack })
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
                    .populate('excavator.device', 'code')
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
        res.status(500).json({ status: 'error', message: err.message, stack: err.stack })

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
function setMergeCellHeader(ws, range, value) {
    ws.mergeCells(range);
    const cell = ws.getCell(range.split(':')[0]);
    cell.value = value;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.font = { bold: true }
}
function setCellHeader(ws, range, value) {
    const cell = ws.getCell(range);
    cell.value = value;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.font = { bold: true }
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
function getColumnLetter(col) {
    let letter = '';
    while (col > 0) {
        let remainder = (col - 1) % 26;
        letter = String.fromCharCode(65 + remainder) + letter;
        col = Math.floor((col - 1) / 26);
    }
    return letter;
}
function setAutoRowHeight(row, text, lineHeight = 25) {
    if (!text) return;
    const lines = text.split('\n').length;
    row.height = lines * lineHeight;
}

module.exports = router; 