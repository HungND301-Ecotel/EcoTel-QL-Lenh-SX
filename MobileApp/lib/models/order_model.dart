import 'package:soft/models/device_model.dart';
import 'package:soft/models/location_model.dart';
import 'package:soft/models/material_model.dart';
import 'package:soft/models/shift_model.dart';
import 'package:soft/models/shift_report_model.dart';
import 'package:soft/models/task_model.dart';
import 'package:soft/models/user_model.dart';


class OrderModel {
  final String id;
  final UserModel assignedTo;
  final TaskModel? job;
  final DateTime? workingDate;
  final ShiftModel? shift;
  String? shiftHour;
  DateTime? startTime;
  DateTime? endTime;
  DateTime? resumeTime;
  final UserModel? createdBy;
  final List<DeviceModel>? device;
  final List<DeviceModel>? excavator;
  final List<LocationModel>? location;
  final List<MaterialModel>? material;
  final String? workContent;
  final ShiftReportModel? shiftReport;
  String? status;
  String? note;
  String? temporaryError;
  String? safetyMeasure;
  String? safetyMeasureSpecific;
  List<UserModel>? assistants;

  OrderModel({
    required this.id,
    required this.assignedTo,
    this.job,
    this.workingDate,
    this.shift,
    this.shiftHour,
    this.startTime,
    this.endTime,
    this.resumeTime,
    this.createdBy,
    this.device,
    this.excavator,
    this.location,
    this.material,
    this.workContent,
    this.shiftReport,
    this.status,
    this.assistants,
    this.note,
    this.safetyMeasure,
    this.safetyMeasureSpecific,
    this.temporaryError,
  });

  factory OrderModel.fromJson(Map<String, dynamic>? json) {
    return OrderModel(
      id: json?['_id'],
      assignedTo: UserModel.fromJson(json?['assignedTo']),
      job: TaskModel.fromJson(json?['job']),
      workingDate:
          DateTime.parse(json?['workingDate']).toLocal(),
      shift:
          json?['shift'] != null
              ? ShiftModel.fromJson(json?['shift'])
              : null,
      shiftHour: json?['shiftHour'] ?? '',
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
      location:
          (json?['location'] as List?)
              ?.map((e) => LocationModel.fromJson(e))
              .toList() ??
          [],
      material:
          (json?['material'] as List?)
              ?.map((e) => MaterialModel.fromJson(e))
              .toList() ??
          [],
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
      safetyMeasure: json?['safetyMeasure'] ?? '',
      temporaryError: json?['temporaryError'] ?? '',
      safetyMeasureSpecific:
          json?['safetyMeasureSpecific'] ?? '',
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

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'assignedTo': assignedTo.toJson(),
      'job': job?.toJson(),
      'workingDate': workingDate?.toIso8601String(),
      'shift': shift?.toJson(),
      'shiftHour': shiftHour,
      'startTime': startTime?.toIso8601String(),
      'endTime': endTime?.toIso8601String(),
      'resumeTime': resumeTime?.toIso8601String(),
      'createdBy': createdBy?.toJson(),
      'device': device?.map((e) => e.toJson()).toList(),
      'excavator':
          excavator?.map((e) => e.toJson()).toList(),
      'location': location?.map((e) => e.toJson()).toList(),
      'material': material?.map((e) => e.toJson()).toList(),
      'workContent': workContent,
      'shiftReport': shiftReport?.toJson(),
      'status': status,
      'note': note,
      'temporaryError': temporaryError,
      'safetyMeasure': safetyMeasure,
      'safetyMeasureSpecific': safetyMeasureSpecific,
      'assistants':
          assistants?.map((e) => e.toJson()).toList(),
    };
  }
}
