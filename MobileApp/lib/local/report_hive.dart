import 'package:hive/hive.dart';
import 'package:soft/local/device_hive.dart';
import 'package:soft/local/location_hive.dart';
import 'package:soft/local/material_hive.dart';

part 'report_hive.g.dart';

@HiveType(typeId: 4)
class ReportHive extends HiveObject {
  @HiveField(0)
  String id;

  @HiveField(1)
  String orderId;

  @HiveField(2)
  DeviceHive? device;

  @HiveField(3)
  DeviceHive? excavator;

  @HiveField(4)
  LocationHive? fromLocation;

  @HiveField(5)
  LocationHive? toLocation;

  @HiveField(6)
  MaterialHive? material;

  @HiveField(7)
  int? quantity;

  @HiveField(8)
  num? drillDepth;

  @HiveField(9)
  num? hardnessF;

  @HiveField(10)
  int? workingMinutes;

  @HiveField(11)
  num? distanceKm;

  @HiveField(12)
  List<DateTime>? quantityUpdateTimes;

  ReportHive({
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

  factory ReportHive.fromJson(Map<String, dynamic>? json) {
    return ReportHive(
      id: json?['_id'] ?? '',
      orderId: json?['orderId'],
      device:
          DeviceHive.fromJson(json?['device'], "REPORT"),
      excavator:
          DeviceHive.fromJson(json?['excavator'], "REPORT"),
      fromLocation: LocationHive.fromJson(
        json?['fromLocation'],
      ),
      toLocation: LocationHive.fromJson(
        json?['toLocation'],
      ),
      material: MaterialHive.fromJson(json?['material']),
      quantity: json?['quantity'],
      drillDepth: json?['drillDepth'],
      hardnessF: json?['hardnessF'],
      workingMinutes: json?['workingMinutes'],
      distanceKm: json?['distanceKm'],
      quantityUpdateTimes:
          (json?['quantityUpdateTimes'] as List?)
                  ?.map((e) => DateTime.parse(e).toLocal())
                  .toList() ??
              [],
    );
  }
}
