import 'package:soft/models/device_model.dart';
import 'package:soft/models/location_model.dart';
import 'package:soft/models/material_model.dart';
import 'package:soft/models/order_model.dart';

class ReportModel {
  final String id;
  final String orderId;
  final DeviceModel? device;
  final LocationModel? fromLocation;
  final LocationModel? toLocation;
  final MaterialModel? material;
  final int? quantity;
  final num? drillDepth;
  final num? hardnessF;
  final int? workingMinutes;
  final num? distanceKm;

  ReportModel({
    required this.id,
    required this.orderId,
    this.device,
    this.fromLocation,
    this.toLocation,
    this.material,
    this.quantity,
    this.drillDepth,
    this.hardnessF,
    this.workingMinutes,
    this.distanceKm,
  });
  factory ReportModel.fromJson(Map<String, dynamic>? json) {
    return ReportModel(
      id: json?['_id'],
      orderId: json?['orderId'],
      device: DeviceModel.fromJson(json?['device']),
      fromLocation: LocationModel.fromJson(
        json?['fromLocation'],
      ),
      toLocation: LocationModel.fromJson(
        json?['toLocation'],
      ),
      material: MaterialModel.fromJson(json?['material']),
      quantity: json?['quantity'],
      drillDepth: json?['drillDepth'],
      hardnessF: json?['hardnessF'],
      workingMinutes: json?['workingMinutes'],
      distanceKm: json?['distanceKm'],
    );
  }
}
