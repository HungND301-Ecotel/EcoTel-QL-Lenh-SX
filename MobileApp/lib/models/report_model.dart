import 'package:soft/models/device_model.dart';
import 'package:soft/models/location_model.dart';
import 'package:soft/models/material_model.dart';

class QuantityUpdateModel {
  DateTime time;
  num quantity;

  QuantityUpdateModel({
    required this.time,
    required this.quantity,
  });

  factory QuantityUpdateModel.fromJson(
      Map<String, dynamic> json) {
    return QuantityUpdateModel(
      time: DateTime.parse(json['time']).toLocal(),
      quantity: json['quantity'] ?? 1,
    );
  }

  Map<String, dynamic> toJson() => {
        'time': time.toIso8601String(),
        'quantity': quantity,
      };
}

class ReportModel {
  final String id;
  final String orderId;
  final DeviceModel? device;
  final DeviceModel? excavator;
  final LocationModel? fromLocation;
  final LocationModel? toLocation;
  final MaterialModel? material;
  final num? quantity;
  final num? drillDepth;
  final num? hardnessF;
  final int? workingMinutes;
  final num? distanceKm;
  final List<QuantityUpdateModel>? quantityUpdateTimes;

  ReportModel({
    required this.id,
    required this.orderId,
    this.device,
    this.excavator,
    this.fromLocation,
    this.toLocation,
    this.material,
    this.quantity,
    this.drillDepth,
    this.hardnessF,
    this.workingMinutes,
    this.distanceKm,
    this.quantityUpdateTimes,
  });
  factory ReportModel.fromJson(Map<String, dynamic>? json) {
    return ReportModel(
      id: json?['_id'] ?? '',
      orderId: json?['orderId'],
      device: DeviceModel.fromJson(json?['device']),
      excavator: DeviceModel.fromJson(json?['excavator']),
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
      quantityUpdateTimes: (json?['quantityUpdateTimes']
                  as List?)
              ?.map((e) => QuantityUpdateModel.fromJson(e))
              .toList() ??
          [],
    );
  }
}
