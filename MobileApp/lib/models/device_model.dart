import 'package:soft/models/department_model.dart';
import 'package:soft/models/device_type_model.dart';
import 'package:soft/models/coordinate_model.dart';

class DeviceModel {
  final String id;
  final String code;
  final String? name;
  final String? vehicleNumber;
  final DeviceTypeModel? category;
  final DepartmentModel? department;
  final Coordinates? coordinates;
  final String? status;

  DeviceModel({
    required this.code,
    this.vehicleNumber,
    this.category,
    this.department,
    required this.id,
    required this.name,
    this.status,
    this.coordinates,
  });

  factory DeviceModel.fromJson(Map<String, dynamic>? json) {
    return DeviceModel(
      id: json?['_id'] ?? '',
      code: json?['code'] ?? '',
      name: json?['name'] ?? '',
      category:
          json?['category'] != null
              ? DeviceTypeModel.fromJson(json?['category'])
              : null,
      department:
          json?['department'] != null
              ? DepartmentModel.fromJson(
                json?['department'],
              )
              : null,
      status: json?['status'],
      coordinates:
          json?['coordinates'] != null
              ? Coordinates.fromJson(json?['coordinates'])
              : null,
    );
  }
   Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'code': code,
      'name': name,
      'vehicleNumber': vehicleNumber,
      'category': category?.toJson(),
      'department': department?.toJson(),
      'status': status,
      'coordinates': coordinates?.toJson(),
    };
  }
}
