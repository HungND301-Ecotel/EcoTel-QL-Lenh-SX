const express = require("express");
const router = express.Router();
const TravelLog = require("../models/TravelLog");
const Device = require("../models/Device");
const Location = require("../models/Location");
const Material = require("../models/material");
const Shift = require("../models/Shift");
const Job = require("../models/Job");
const { verifyToken, restrictTo } = require("../middleware/auth.middleware");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const ExcelJS = require("exceljs");
const xlsx = require("xlsx");
const dayjs = require("dayjs");
const {
  ROLE,
  ACCEPTED_PRODUCT,
  ACCEPTED_PRODUCTS,
} = require("../config/config");
const { paginateQuery } = require("../utils/pagination");
const Order = require("../models/Order");
const { runProductionUpdateBackground } = require("../utils/cron");
const { rangeTime, getTravellog } = require("../utils/reportGrouping");

router.post("/", verifyToken, async (req, res, next) => {
  try {
    const {
      excavator,
      workingDate,
      shift,
      area,
      excavationLevel,
      location,
      acceptedProduct,
      dumpHeightActual,
      fullDistanceKm,
      fullLiftHeightM,
      localMinHeightM,
      localMaxHeightM,
      localDistanceKm,
      localLiftHeightM,
    } = req.body;
    const newTravelLog = new TravelLog({
      excavator,
      workingDate,
      shift,
      area,
      excavationLevel,
      location,
      acceptedProduct,
      dumpHeightActual,
      fullDistanceKm,
      fullLiftHeightM,
      localMinHeightM,
      localMaxHeightM,
      localDistanceKm,
      localLiftHeightM,
    });
    await newTravelLog.save();
    req.logger.info(`🔥 Tạo thành công cung độ`);

    res.status(200).send({ status: "success", message: "Tạo thành công" });
    const { rangeStart, rangeEnd } = rangeTime(newTravelLog?.workingDate);
    let query = {
      workingDate: {
        $gte: rangeStart,
        $lte: rangeEnd,
      },
    };

    runProductionUpdateBackground(req, query);
  } catch (err) {
    req.logger.error("❌ Lỗi khi tạo", err);
    res
      .status(500)
      .send({ status: "error", message: err.message, stack: err.stack });
  }
});

router.delete("/", verifyToken, async (req, res, next) => {
  try {
    const user = req.user;
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      req.logger.error("❌ Vui lòng chọn cung độ cần xóa");
      return res
        .status(400)
        .send({ status: "error", message: "Vui lòng chọn bản ghi cần xóa" });
    }

    const result = await TravelLog.deleteMany({ _id: { $in: ids } });
    if (result.deletedCount === 0) {
      req.logger.error("❌ không tìm thấy bản ghi cần xóa");

      return res
        .status(200)
        .send({ status: "error", message: "Không tìm thấy bản ghi để xóa" });
    }
    req.logger.info(
      `🔥 ${user?.username}  Đã xóa ${result.deletedCount} bản ghi cung độ`,
    );

    res.status(200).json({
      status: "success",
      message: `Đã xóa ${result.deletedCount} bản ghi`,
    });
  } catch (err) {
    req.logger.error("❌ Lỗi khi xóa", err);

    res
      .status(500)
      .send({ status: "error", message: err.message, stack: err.stack });
  }
});
router.put("/:id", verifyToken, async (req, res, next) => {
  try {
    const user = req.user;
    const travellog = await TravelLog.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );

    if (!travellog) {
      req.logger.error("❌ Sửa thất bại");

      return res
        .status(404)
        .send({ status: "error", message: "Sửa thất bại " });
    }
    req.logger.info(`🔥 ${user?.username} Sửa cung độ thành công`);

    res.status(200).json({
      status: "success",
      message: "Sửa thành công",
    });
    const { rangeStart, rangeEnd } = rangeTime(travellog?.workingDate);
    let query = {
      workingDate: {
        $gte: rangeStart,
        $lte: rangeEnd,
      },
    };

    runProductionUpdateBackground(req, query);
  } catch (err) {
    req.logger.error("❌ Lỗi", err);
    res
      .status(500)
      .send({ status: "error", message: err.message, stack: err.stack });
  }
});
router.get("/", verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * pageSize;

    const match = {};

    // --- Lọc theo ngày ---
    if (req.query.startTime && req.query.endTime) {
      const endTime = new Date(req.query.endTime);
      endTime.setHours(23, 59, 59, 999);
      match.workingDate = {
        $gte: new Date(req.query.startTime),
        $lte: endTime,
      };
    } else if (req.query.startTime) {
      match.workingDate = { $gte: new Date(req.query.startTime) };
    } else if (req.query.endTime) {
      const endTime = new Date(req.query.endTime);
      endTime.setHours(23, 59, 59, 999);
      match.workingDate = { $lte: endTime };
    }

    // --- Lọc theo acceptedProduct (type) ---
    if (req.query.type) {
      match.acceptedProduct = req.query.type;
    }

    // --- Aggregation ---
    const result = await TravelLog.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "devices",
          localField: "excavator",
          foreignField: "_id",
          as: "excavator",
        },
      },
      { $unwind: { path: "$excavator", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "shifts",
          localField: "shift",
          foreignField: "_id",
          as: "shift",
        },
      },
      { $unwind: { path: "$shift", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "locations",
          localField: "location",
          foreignField: "_id",
          as: "location",
        },
      },
      { $unwind: { path: "$location", preserveNullAndEmptyArrays: true } },
      {
        $sort: {
          workingDate: -1,
          "shift.name": -1,
          "excavator.code": 1,
        },
      },
      {
        $facet: {
          // Luồng 1: Lấy dữ liệu (Data)
          data: [{ $skip: skip }, { $limit: pageSize }],
          // Luồng 2: Đếm tổng số bản ghi (Pagination Metadata)
          pagination: [{ $count: "total" }],
        },
      },
    ]);

    const dataList = result[0].data;
    const totalDocs = result[0].pagination[0]
      ? result[0].pagination[0].total
      : 0;
    const totalPages = Math.ceil(totalDocs / pageSize);
    res.status(200).send({
      status: "success",
      data: {
        items: dataList,
        totalDocs,
        pageSize,
        totalPages,
      },
    });
  } catch (err) {
    req.logger.error("❌ Lỗi", err);
    res.status(500).send({ status: "error", message: err.message });
  }
});

const columnMapping = {
  "Máy xúc": "excavator",
  "Khu vực": "area",
  "Tầng xúc": "excavationLevel",
  "Độ cao thực tế nơi đổ": "dumpHeightActual",
  "C.độ (km) toàn tuyến": "fullDistanceKm",
  "Chiều cao N.tải (m) toàn tuyến": "fullLiftHeightM",
  "H min": "localMinHeightM",
  "H max": "localMaxHeightM",
  "C. độ (km) cục bộ": "localDistanceKm",
  "Chiều cao N.tải (m) cục bộ": "localLiftHeightM", // tránh trùng key
  "Điểm đổ tải": "location",
  Ca: "shift",
  "Ngày (tháng/ngày/năm)": "workingDate",
};

// 👉 Tạo map ngược để lấy tên cột Tiếng Việt khi báo lỗi
const reverseColumnMapping = Object.fromEntries(
  Object.entries(columnMapping).map(([vi, en]) => [en, vi]),
);

router.post(
  "/importFile",
  upload.single("file"),
  verifyToken,
  async (req, res) => {
    try {
      const user = req.user;
      if (!req.file) {
        req.logger.warn("⚠️ Import file thất bại - Không có file được chọn.");
        return res
          .status(400)
          .json({ status: "error", message: "Vui lòng chọn file" });
      }

      const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const range = xlsx.utils.decode_range(worksheet["!ref"]);
      range.e.c = 13;
      worksheet["!ref"] = xlsx.utils.encode_range(range);

      const rawHeaderRows = xlsx.utils.sheet_to_json(worksheet, {
        header: 1,
        range: 0,
      });
      const headerRow1 = rawHeaderRows[0];
      const headerRow2 = rawHeaderRows[1];

      const indexToanTuyen = headerRow1.indexOf("Toàn tuyến");
      const indexCucBo = headerRow1.indexOf("Trong đó cục bộ");

      const headerPart1 = headerRow1.slice(0, indexToanTuyen);
      const headerPart3 = headerRow1.slice(indexCucBo + 4);
      const headerPart2 = headerRow2.filter(Boolean);

      const combinedHeaders = [...headerPart1, ...headerPart2, ...headerPart3];
      const mappedHeaders = combinedHeaders.map(
        (h) => columnMapping[h?.trim()] || h,
      );

      const rawData = xlsx.utils.sheet_to_json(worksheet, {
        header: mappedHeaders,
        range: 2, // Bỏ qua 2 dòng header
        raw: true,
        cellDates: true,
        defval: null,
      });

      // 👉 Đánh dấu dòng Excel gốc trước khi filter (dữ liệu bắt đầu từ dòng 3 trong Excel)
      const dataWithRows = rawData.map((row, index) => ({
        ...row,
        __excelRow: index + 3,
      }));

      const dataImport = dataWithRows.filter(
        (row) => row.excavator && row.workingDate && row.shift,
      );

      if (dataImport.length === 0) {
        req.logger.warn(
          "⚠️ Import file thất bại - Không tìm thấy dữ liệu hợp lệ.",
        );
        return res.status(400).json({
          status: "error",
          message: "Không tìm thấy dữ liệu hợp lệ trong file.",
        });
      }

      dataImport.forEach((row) => {
        const millisecondsPerDay = 86400000;
        const excelEpochOffset = 25569;

        if (typeof row.workingDate === "number") {
          const dateInMilliseconds =
            (row.workingDate - excelEpochOffset) * millisecondsPerDay;
          const fixedDateUTC = new Date(dateInMilliseconds);
          row.workingDate = fixedDateUTC;
        } else if (row.workingDate instanceof Date) {
          row.workingDate.setHours(0, 0, 0, 0);
          const offset = row.workingDate.getTimezoneOffset();
          row.workingDate = new Date(
            row.workingDate.getTime() - offset * 60000,
          );
        }
      });

      const uniqueDevices = [
        ...new Set(dataImport.map((d) => d.excavator).filter(Boolean)),
      ];
      const uniqueLocations = [
        ...new Set(dataImport.map((d) => d.location).filter(Boolean)),
      ];
      const uniqueShifts = [
        ...new Set(dataImport.map((d) => d.shift).filter(Boolean)),
      ];

      const [existingDevices, existingLocations, existingShifts] =
        await Promise.all([
          Device.find({ code: { $in: uniqueDevices } }).lean(),
          Location.find({ name: { $in: uniqueLocations } }).lean(),
          Shift.find({ name: { $in: uniqueShifts } }).lean(),
        ]);

      const deviceMap = new Map(existingDevices.map((d) => [d.code, d._id]));
      const locationMap = new Map(
        existingLocations.map((c) => [c.name, c._id]),
      );
      const shiftMap = new Map(existingShifts.map((c) => [c.name, c._id]));

      const operations = [];
      const invalidRows = [];

      const type = req.query.type;
      if (!type) {
        return res
          .status(400)
          .json({ status: "error", message: "Lỗi hệ thống không thể import." });
      }

      const updateQueries = new Map();

      for (const row of dataImport) {
        // Lấy thêm __excelRow ra để dùng báo lỗi
        const {
          excavator,
          location,
          workingDate,
          shift,
          __excelRow,
          ...updateData
        } = row;

        // Xử lý float numbers (giữ nguyên logic của bạn)
        const floatFields = [
          "fullDistanceKm",
          "fullLiftHeightM",
          "localMinHeightM",
          "localMaxHeightM",
          "localDistanceKm",
          "localLiftHeightM",
        ];
        floatFields.forEach((field) => {
          if (updateData[field] !== undefined && updateData[field] !== null) {
            let val = Number(updateData[field]);
            if (!isNaN(val)) updateData[field] = parseFloat(val.toFixed(3));
          }
        });

        updateData.acceptedProduct = type;

        // 👉 CẬP NHẬT LOGIC BÁO LỖI Ở ĐÂY
        const deviceId = deviceMap.get(excavator);
        if (!deviceId) {
          invalidRows.push({
            error: `Dòng ${__excelRow}, Cột "${reverseColumnMapping["excavator"]}": Mã máy "${excavator}" không tồn tại.`,
          });
          continue;
        }
        updateData.excavator = deviceId;

        const shiftId = shiftMap.get(shift);
        if (!shiftId) {
          invalidRows.push({
            error: `Dòng ${__excelRow}, Cột "${reverseColumnMapping["shift"]}": Ca làm việc "${shift}" không hợp lệ.`,
          });
          continue;
        }
        updateData.shift = shiftId;

        const locationId = locationMap.get(location);
        if (!locationId) {
          invalidRows.push({
            error: `Dòng ${__excelRow}, Cột "${reverseColumnMapping["location"]}": Điểm đổ "${location}" không tồn tại.`,
          });
          continue;
        }
        updateData.location = locationId;

        if (!workingDate) {
          invalidRows.push({
            error: `Dòng ${__excelRow}, Cột "${reverseColumnMapping["workingDate"]}": Bị trống hoặc sai định dạng.`,
          });
          continue;
        }
        updateData.workingDate = workingDate;

        const key = `${workingDate}_${shiftId}`;
        if (!updateQueries.has(key)) {
          updateQueries.set(key, { workingDate, shift: shiftId });
        }

        operations.push({
          updateOne: {
            filter: {
              excavator: updateData.excavator,
              workingDate: updateData.workingDate,
              shift: updateData.shift,
              location: updateData.location,
              acceptedProduct: updateData.acceptedProduct,
            },
            update: updateData,
            upsert: true,
          },
        });
      }

      let bulkResult = null;
      if (operations.length > 0) {
        bulkResult = await TravelLog.bulkWrite(operations);
      }

      for (const q of updateQueries.values()) {
        let query = { workingDate: q?.workingDate, shift: q?.shift };
        runProductionUpdateBackground(req, query);
      }

      req.logger.info(
        `✅ ${user?.username} Import file thành công. ${dataImport.length} bản ghi xử lý.`,
      );
      res.status(200).json({
        status: "success",
        message: "Import dữ liệu hoàn tất.",
        summary: {
          totalProcessed: dataImport.length,
          insertedCount: bulkResult ? bulkResult.upsertedCount : 0,
          updatedCount: bulkResult ? bulkResult.modifiedCount : 0,
          invalidCount: invalidRows.length,
        },
        invalidRows, // Bây giờ nó chỉ chứa mảng { error: "Dòng X..." }
      });
    } catch (error) {
      req.logger.error("❌ Lỗi khi import file cung độ", error);
      res.status(500).json({
        status: "error",
        message: "Tải thất bại",
        error: error.message,
      });
    }
  },
);

const mongoose = require("mongoose");

router.post(
  "/exportFile",
  verifyToken,
  restrictTo(ROLE.MANAGER, ROLE.ADMIN, ROLE.DISPATCHER),
  async (req, res, next) => {
    try {
      const {
        startTime,
        endTime,
        shift, // shiftId
        type, // acceptedProduct
        includeHasLog = true,
        includeNoLog = true,
      } = req.body;
      console.log(req.body);

      const start = startTime
        ? new Date(startTime)
        : (() => {
            const d = new Date();
            d.setDate(d.getDate() - 10);
            d.setHours(0, 0, 0, 0);
            return d;
          })();
      const end = endTime ? new Date(endTime) : new Date();

      const rows = []; // format thống nhất theo form cung độ

      // ---------- 1. Đã có cung độ ----------
      if (includeHasLog) {
        const match = { workingDate: { $gte: start, $lte: end } };
        if (type) match.acceptedProduct = type;
        if (shift) match.shift = new mongoose.Types.ObjectId(shift);

        const data = await TravelLog.aggregate([
          { $match: match },
          {
            $lookup: {
              from: "devices",
              localField: "excavator",
              foreignField: "_id",
              as: "excavator",
            },
          },
          { $unwind: { path: "$excavator", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "shifts",
              localField: "shift",
              foreignField: "_id",
              as: "shift",
            },
          },
          { $unwind: { path: "$shift", preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: "locations",
              localField: "location",
              foreignField: "_id",
              as: "location",
            },
          },
          { $unwind: { path: "$location", preserveNullAndEmptyArrays: true } },
          { $sort: { workingDate: -1, "shift.name": -1, "excavator.code": 1 } },
        ]);

        data.forEach((item) => {
          rows.push({
            excavator: item.excavator?.code || "",
            area: item.area || "",
            excavationLevel: item.excavationLevel || "",
            dumpHeightActual: item.dumpHeightActual || "",
            fullDistanceKm: item.fullDistanceKm ?? "",
            fullLiftHeightM: item.fullLiftHeightM ?? "",
            localMinHeightM: item.localMinHeightM ?? "",
            localMaxHeightM: item.localMaxHeightM ?? "",
            localDistanceKm: item.localDistanceKm ?? "",
            localLiftHeightM: item.localLiftHeightM ?? "",
            location: item.location?.name || "",
            shift: item.shift?.name || "",
            workingDate: item.workingDate ? new Date(item.workingDate) : "",
          });
        });
      }

      // ---------- 2. Chưa có cung độ ----------
      if (includeNoLog) {
        const query = { workingDate: { $gte: start, $lte: end } };
        const job = await Job.findOne({ name: "Vận hành xe" });
        if (job) query.job = job._id;
        if (shift) query.shift = shift;

        const orders = await Order.find(query)
          .populate("shift", "name")
          .populate("excavator.device", "code")
          .populate("location", "name")
          .populate("material", "name acceptedProduct")
          .sort("-workingDate")
          .lean();

        // Lấy toàn bộ TravelLog trong cùng khoảng ngày 1 lần duy nhất
        const existingLogs = await TravelLog.find({
          workingDate: { $gte: start, $lte: end },
          ...(type ? { acceptedProduct: type } : {}),
          ...(shift ? { shift } : {}),
        }).lean();

        const existingKeySet = new Set(
          existingLogs.map((log) => {
            const d = new Date(log.workingDate).toISOString().split("T")[0];
            return `${d}_${log.excavator}_${log.location}_${log.acceptedProduct}_${log.shift}`;
          }),
        );

        const seen = new Set();
        for (const order of orders) {
          const excavatorId = order.excavator?.[0]?.device?._id;
          const locationId = order.location?.[0]?._id;
          const acceptedProduct = order.material?.[0]?.acceptedProduct;
          const shiftId = order.shift?._id;
          if (type && acceptedProduct !== type) continue;
          if (!excavatorId || !locationId || !shiftId) continue;

          const workingDate = new Date(order.workingDate);
          const dayStr = workingDate.toISOString().split("T")[0];
          const uniqueKey = `${dayStr}_${excavatorId}_${locationId}_${acceptedProduct}_${shiftId}`;

          if (seen.has(uniqueKey)) continue;
          if (existingKeySet.has(uniqueKey)) continue; // đã có cung độ -> bỏ qua

          seen.add(uniqueKey);
          rows.push({
            excavator: order.excavator?.[0]?.device?.code || "",
            area: "",
            excavationLevel: "",
            dumpHeightActual: "",
            fullDistanceKm: "",
            fullLiftHeightM: "",
            localMinHeightM: "",
            localMaxHeightM: "",
            localDistanceKm: "",
            localLiftHeightM: "",
            location: order.location?.[0]?.name || "",
            shift: order.shift?.name || "",
            workingDate,
          });
        }
      }
      // sắp xếp lại toàn bộ theo ngày/ca cho dễ nhìn
      rows.sort((a, b) => new Date(b.workingDate) - new Date(a.workingDate));

      // ---------- Ghi file Excel (giữ nguyên style cũ) ----------
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("DS_CUNG_DO");

      worksheet.addRow([
        "Máy xúc",
        "Khu vực",
        "Tầng xúc",
        "Độ cao thực tế nơi đổ",
        "Toàn tuyến",
        "",
        "Trong đó cục bộ",
        "",
        "",
        "",
        "Điểm đổ tải",
        "Ca",
        "Ngày (tháng/ngày/năm)",
      ]);
      worksheet.addRow([
        "",
        "",
        "",
        "",
        "C.độ (km) toàn tuyến",
        "Chiều cao N.tải (m) toàn tuyến",
        "H min",
        "H max",
        "C. độ (km) cục bộ",
        "Chiều cao N.tải (m) cục bộ",
        "",
        "",
        "",
      ]);
      worksheet.mergeCells("A1:A2");
      worksheet.mergeCells("B1:B2");
      worksheet.mergeCells("C1:C2");
      worksheet.mergeCells("D1:D2");
      worksheet.mergeCells("E1:F1");
      worksheet.mergeCells("G1:J1");
      worksheet.mergeCells("K1:K2");
      worksheet.mergeCells("L1:L2");
      worksheet.mergeCells("M1:M2");
      worksheet.getRow(1).font = { bold: true, size: 10 };
      worksheet.getRow(2).font = { bold: true, size: 10 };
      worksheet.getRow(1).alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      worksheet.getRow(2).alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      worksheet.getRow(1).height = 40;
      worksheet.getRow(2).height = 40;

      rows.forEach((item) => {
        worksheet.addRow([
          item.excavator,
          item.area,
          item.excavationLevel,
          item.dumpHeightActual,
          item.fullDistanceKm,
          item.fullLiftHeightM,
          item.localMinHeightM,
          item.localMaxHeightM,
          item.localDistanceKm,
          item.localLiftHeightM,
          item.location,
          item.shift,
          item.workingDate,
        ]);
      });

      worksheet.columns = [
        { key: "excavator", width: 12 },
        { key: "area", width: 10 },
        { key: "excavationLevel", width: 10 },
        { key: "dumpHeightActual", width: 15 },
        { key: "fullDistanceKm", width: 10 },
        { key: "fullLiftHeightM", width: 15 },
        { key: "localMinHeightM", width: 10 },
        { key: "localMaxHeightM", width: 10 },
        { key: "localDistanceKm", width: 12 },
        { key: "localLiftHeightM", width: 15 },
        { key: "location", width: 15 },
        { key: "shift", width: 5 },
        { key: "workingDate", width: 12 },
      ];
      worksheet.getColumn("M").numFmt = "dd/mm/yyyy";

      // dropdown validation (giữ như cũ)
      const devices = await Device.find().populate("category", "name");
      const excavators = devices.filter((i) =>
        i.category?.name.toLowerCase().includes("máy xúc"),
      );
      const locations = await Location.find();
      const shifts = await Shift.find();
      const deviceList = [
        ...new Set(excavators.map((p) => p.code).filter(Boolean)),
      ];
      const locationList = [
        ...new Set(locations.map((d) => d.name).filter(Boolean)),
      ];
      const shiftList = [...new Set(shifts.map((d) => d.name).filter(Boolean))];

      worksheet.getColumn("X").values = ["excavators", ...deviceList];
      worksheet.getColumn("Y").values = ["locations", ...locationList];
      worksheet.getColumn("W").values = ["shifts", ...shiftList];
      worksheet.getColumn("X").hidden = true;
      worksheet.getColumn("Y").hidden = true;
      worksheet.getColumn("W").hidden = true;

      const MAX = Math.max(worksheet.rowCount + 100, 1000);
      worksheet.dataValidations.add(`A3:A${MAX}`, {
        type: "list",
        allowBlank: true,
        formulae: [`=$X$2:$X$${deviceList.length + 1}`],
        showErrorMessage: true,
        errorTitle: "Giá trị không hợp lệ",
      });
      worksheet.dataValidations.add(`K3:K${MAX}`, {
        type: "list",
        allowBlank: true,
        formulae: [`=$Y$2:$Y$${locationList.length + 1}`],
        showErrorMessage: true,
        errorTitle: "Giá trị không hợp lệ",
      });
      worksheet.dataValidations.add(`L3:L${MAX}`, {
        type: "list",
        allowBlank: true,
        formulae: [`=$W$2:$W$${shiftList.length + 1}`],
        showErrorMessage: true,
        errorTitle: "Giá trị không hợp lệ",
      });

      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=danh_sach_cung_do.xlsx",
      );
      res.send(buffer);
      req.logger.info("✅ Xuất file thành công.");
    } catch (err) {
      req.logger.error("❌ Lỗi khi xuất file", err);
      res
        .status(500)
        .send({ status: "error", message: err.message, stack: err.stack });
    }
  },
);
module.exports = router;
