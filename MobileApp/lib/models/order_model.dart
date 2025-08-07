import 'package:soft/models/device_model.dart';
import 'package:soft/models/device_type_model.dart';
import 'package:soft/models/location_model.dart';
import 'package:soft/models/material_model.dart';
import 'package:soft/models/safety_measure_model.dart';
import 'package:soft/models/shift_model.dart';
import 'package:soft/models/shift_report_model.dart';
import 'package:soft/models/task_model.dart';
import 'package:soft/models/user_model.dart';

class DevicesToProduceModel {
  final DeviceTypeModel deviceType;
  final num quantity;

  DevicesToProduceModel({
    required this.deviceType,
    required this.quantity,
  });

  factory DevicesToProduceModel.fromJson(
    Map<String, dynamic>? json,
  ) {
    return DevicesToProduceModel(
      deviceType: DeviceTypeModel.fromJson(
        json?['deviceType'],
      ),
      quantity: json?['quantity'],
    );
  }
}

class OrderModel {
  final String id;
  final UserModel assignedTo;
  final TaskModel job;
  final DateTime workingDate;
  final ShiftModel shift;
  List<DevicesToProduceModel>? devicesToProduce;
  DateTime? startTime;
  DateTime? endTime;
  DateTime? resumeTime;
  final UserModel createdBy;
  final List<DeviceModel>? device;
  final List<DeviceModel>? excavator;
  final num? distance;
  final num? liftHeight;
  final LocationModel? location;
  final MaterialModel? material;
  final String? workContent;
  final ShiftReportModel? shiftReport;
  String status;
  String? note;
  String? temporaryError;
  SafetyMeasureModel? safetyMeasure;
  List<UserModel>? assistants;

  OrderModel({
    required this.id,
    required this.assignedTo,
    required this.job,
    required this.workingDate,
    required this.shift,
    this.devicesToProduce,
    this.startTime,
    this.endTime,
    this.resumeTime,
    required this.createdBy,
    this.device,
    this.excavator,
    this.distance,
    this.liftHeight,
    this.location,
    this.material,
    this.workContent,
    this.shiftReport,
    required this.status,
    this.assistants,
    this.note,
    this.safetyMeasure,
    this.temporaryError,
  });

  factory OrderModel.fromJson(Map<String, dynamic>? json) {
    return OrderModel(
      id: json?['_id'] ?? '',
      assignedTo: UserModel.fromJson(json?['assignedTo']),
      job: TaskModel.fromJson(json?['job']),
      workingDate:
          DateTime.parse(json?['workingDate']).toLocal(),
      shift: ShiftModel.fromJson(json?['shift']),
      devicesToProduce:
          (json?['devicesToProduce'] as List?)
              ?.map(
                (e) => DevicesToProduceModel.fromJson(e),
              )
              .toList() ??
          [],
      startTime:
          json?['startTime'] != null
              ? DateTime.parse(json?['startTime']).toLocal()
              : null,
      endTime:
          json?['endTime'] != null
              ? DateTime.parse(json?['endTime']).toLocal()
              : null,
      resumeTime:
          json?['resumeTime'] != null
              ? DateTime.parse(
                json?['resumeTime'],
              ).toLocal()
              : null,
      createdBy: UserModel.fromJson(json?['createdBy']),
      device:
          (json?['device'] as List?)
              ?.map((e) => DeviceModel.fromJson(e))
              .toList() ??
          [],
      excavator:
          (json?['excavator'] as List?)
              ?.map((e) => DeviceModel.fromJson(e))
              .toList() ??
          [],
      distance: json?['distance'],
      liftHeight: json?['liftHeight'],
      location:
          json?['location'] != null
              ? LocationModel.fromJson(json?['location'])
              : null,
      material:
          json?['material'] != null
              ? MaterialModel.fromJson(json?['material'])
              : null,
      shiftReport:
          json?['shiftReport'] != null
              ? ShiftReportModel.fromJson(
                json?['shiftReport'],
              )
              : null,
      workContent: json?['workContent'] ?? '',
      status: json?['status'] ?? '',
      assistants:
          (json?['assistants'] as List?)
              ?.map((e) => UserModel.fromJson(e))
              .toList() ??
          [],
      note: json?['note'] ?? '',
      safetyMeasure:
          json?['safetyMeasure'] != null
              ? SafetyMeasureModel.fromJson(
                json?['safetyMeasure'],
              )
              : null,
      temporaryError: json?['temporaryError'] ?? '',
    );
  }
  void updateFromJson(Map<String, dynamic> json) {
    if (json.containsKey('status')) {
      status = json['status'];
    }
    if (json.containsKey('startTime') &&
        json['startTime'] != null) {
      startTime =
          DateTime.parse(json['startTime']).toLocal();
    }

    if (json.containsKey('endTime') &&
        json['endTime'] != null) {
      endTime = DateTime.parse(json['endTime']).toLocal();
    }

    if (json.containsKey('assistants')) {
      assistants =
          (json['assistants'] as List?)
              ?.map((e) => UserModel.fromJson(e))
              .toList() ??
          [];
    }
  }
}
