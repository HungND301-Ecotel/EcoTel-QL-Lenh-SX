import 'package:job_manager/models/device_model.dart';
import 'package:job_manager/models/location_model.dart';
import 'package:job_manager/models/material_model.dart';
import 'package:job_manager/models/task_model.dart';
import 'package:job_manager/models/user_model.dart';

class OrderModel {
  final String id;
  final TaskModel taskId;
  final DateTime workingDate;
  final DateTime? startTime;
  final DateTime? endTime;
  final UserModel assignedTo;
  final UserModel createdBy;
  final DeviceModel? deviceId;
  final DeviceModel? excavatorId;
  final LocationModel? locationId;
  final MaterialModel? materialId;
  final String? description;
  String status;
  final List<UserModel>? assistants;

  OrderModel({
    required this.id,
    required this.taskId,
    required this.workingDate,
    this.startTime,
    this.endTime,
    required this.assignedTo,
    required this.createdBy,
    this.deviceId,
    this.excavatorId,
    this.locationId,
    this.materialId,
    this.description,
    required this.status,
    required this.assistants,
  });

  factory OrderModel.fromJson(Map<String, dynamic>? json) {
    return OrderModel(
      id: json?['_id'] ?? '',
      taskId: TaskModel.fromJson(json?['taskId']),
      workingDate:
          DateTime.parse(json?['workingDate']).toLocal(),
      startTime:
          json?['start_time'] != null
              ? DateTime.parse(
                json?['start_time'],
              ).toLocal()
              : null,
      endTime:
          json?['end_time'] != null
              ? DateTime.parse(json?['end_time']).toLocal()
              : null,
      assignedTo: UserModel.fromJson(json?['assignedTo']),
      createdBy: UserModel.fromJson(json?['createdBy']),
      deviceId:
          json?['deviceId'] != null
              ? DeviceModel.fromJson(json?['deviceId'])
              : null,
      excavatorId:
          json?['excavatorId'] != null
              ? DeviceModel.fromJson(json?['excavatorId'])
              : null,
      locationId:
          json?['locationId'] != null
              ? LocationModel.fromJson(json?['locationId'])
              : null,
      materialId:
          json?['materialId'] != null
              ? MaterialModel.fromJson(json?['materialId'])
              : null,
      description: json?['description'] ?? '',
      status: json?['status'] ?? '',
      assistants:
          (json?['assistants'] as List?)
              ?.map((e) => UserModel.fromJson(e))
              .toList() ??
          [],
    );
  }
}
