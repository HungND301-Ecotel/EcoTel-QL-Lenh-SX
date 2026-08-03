const mongoose = require("mongoose");
const { STATUS_DEVICES, STATUS_DEVICE } = require("../config/config");

const deviceSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Device code is required"],
      trim: true,
    },
    name: {
      type: String,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    vehicleNumber: {
      type: String,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeviceType",
    },
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeviceModel",
    },
    fuelType: {
      type: String,
    },
    capacity: {
      type: Number,
    },
    power: {
      type: Number,
    },
    status: {
      type: String,
      enum: STATUS_DEVICES,
      default: STATUS_DEVICE.AVAILABLE,
    },
    coordinates: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    note: {
      type: String,
    },
    files: [
      {
        key: String,
        fileName: String,
      },
    ],
    // Thông tin chung
    brand: String, // nhãn hiệu
    model: String, // số loại
    countryOfOrigin: String, // nước sản xuất
    yearOfManufacture: String, // năm sản xuất
    chassisNumber: String, // số khung
    engineNumber: String, // số động cơ

    // Kích thước
    dimensions: {
      length: String, // chiều dài
      width: String, // chiều rộng
      height: String, // chiều cao
      bladeWidth: String, // bề rộng lưỡi gạt
      totalWeight: String, // trọng lượng toàn bộ
      trackWidth: String, // chiều rộng xích
    },

    // Thông số vận hành
    operatingSpecs: {
      travelSpeed: String, // tốc độ di chuyển
      swingSpeed: String, // tốc độ quay toa
      bucketCapacity: String, // dung tích gầu
      groundPressure: String, // áp lực trên nền
      climbingAbility: String, // khả năng leo dốc
      drillHoleDiameter: String, // đường kính lỗ khoan
    },

    // Động cơ
    engine: {
      engineModel: String, // ký hiệu động cơ
      pistonDiameter: String, // đường kính piston
      maxPower: String, // công suất lớn nhất (N)
      cylinderCount: String, // số xi lanh
      layout: String, // bố trí (chữ V)
      pistonStroke: String, // hành trình piston
      maxSpeed: String, // tốc độ lớn nhất
    },

    // Hệ thống thủy lực
    hydraulicSystem: {
      pump1: { name: String, flow: String, pressure: String }, // bơm thủy lực 1
      pump2: { name: String, flow: String, pressure: String }, // bơm thủy lực 2
      pump3: { name: String, flow: String, pressure: String }, // bơm thủy lực 3
      airCompressor: { name: String, flow: String, pressure: String }, // máy nén khí
    },

    finalDriveType: String, // kiểu bộ truyền lực cuối, di chuyển (gạt xích, máy xúc)

    // Thời gian sử dụng
    receivedDate: String, // ngày nhận thiết bị
    operationStartDate: String, // ngày đưa vào sử dụng

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
deviceSchema.index({ type: 1, status: 1 });
deviceSchema.index({ department: 1 });

const Device = mongoose.model("Device", deviceSchema);

module.exports = Device;
