// device model
import 'package:soft/models/location_model.dart';
import 'package:soft/models/material_model.dart';

class Device {
  final String id;
  final String code;

  Device({required this.code, required this.id});

  factory Device.fromJson(Map<String, dynamic>? json) {
    return Device(
      id: json?['_id'] ?? '',
      code: json?['code'] ?? '',
    );
  }
  Map<String, dynamic> toJson() {
    return {'id': id, 'code': code};
  }
}

// vehicleShiftReportModel
class VehicleShiftReportModel {
  final Device? vehicle;
  final Device? excavator;
  final String? dumpingLocation;
  final MaterialModel? materialType;
  final LocationModel? fromLocation;
  final LocationModel? toLocation;
  final num? drillDepth;
  final num? hardness;
  final num? workingMinutes;
  final num? distanceKm;
  final num? production;
  final num? tripCount;

  VehicleShiftReportModel({
    this.vehicle,
    this.excavator,
    this.dumpingLocation,
    this.materialType,
    this.drillDepth,
    this.hardness,
    this.fromLocation,
    this.toLocation,
    this.workingMinutes,
    this.distanceKm,
    this.production,
    this.tripCount,
  });

  factory VehicleShiftReportModel.fromJson(
    Map<String, dynamic>? json,
  ) {
    return VehicleShiftReportModel(
      vehicle:
          json?['vehicle'] != null
              ? Device.fromJson(json?['vehicle'])
              : null,
      excavator:
          json?['excavator'] != null
              ? Device.fromJson(json?['excavator'])
              : null,
      dumpingLocation: json?['dumpingLocation'],
      materialType:
          json?['materialType'] != null
              ? MaterialModel.fromJson(
                json?['materialType'],
              )
              : null,
      drillDepth: json?['drillDepth'],
      hardness: json?['hardness'],
      fromLocation:
          json?['fromLocation'] != null
              ? LocationModel.fromJson(
                json?['fromLocation'],
              )
              : null,
      toLocation:
          json?['toLocation'] != null
              ? LocationModel.fromJson(json?['toLocation'])
              : null,
      workingMinutes: json?['workingMinutes'],
      distanceKm: json?['distanceKm'],
      production: json?['production'],
      tripCount: json?['tripCount'],
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'vehicle': vehicle?.toJson(),
      'excavator': excavator?.toJson(),
      'dumpingLocation': dumpingLocation,
      'materialType': materialType?.toJson(),
      'drillDepth': drillDepth,
      'hardness': hardness,
      'fromLocation': fromLocation?.toJson(),
      'toLocation': toLocation?.toJson(),
      'workingMinutes': workingMinutes,
      'distanceKm': distanceKm,
      'production': production,
      'tripCount': tripCount,
    };
  }
}

// vehicleSummariesModel
class VehicleSummariesModel {
  final Device? vehicle;
  final num? travelHours;
  final num? repairHours;
  final num? fuelRemain;
  final num? fuelReceived;
  final num? fuelRemainEnd;
  final String? status;
  final String? note;
  final String? gpsStatus;
  final String? sealStatus;

  VehicleSummariesModel({
    this.vehicle,
    this.travelHours,
    this.repairHours,
    this.fuelRemain,
    this.fuelReceived,
    this.fuelRemainEnd,
    this.status,
    this.note,
    this.gpsStatus,
    this.sealStatus,
  });

  factory VehicleSummariesModel.fromJson(
    Map<String, dynamic>? json,
  ) {
    return VehicleSummariesModel(
      vehicle:
          json?['vehicle'] != null
              ? Device.fromJson(json?['vehicle'])
              : null,
      travelHours: json?['travelHours'],
      repairHours: json?['repairHours'],
      fuelRemain: json?['fuelRemain'],
      fuelReceived: json?['fuelReceived'],
      fuelRemainEnd: json?['fuelRemainEnd'],
      status: json?['status'],
      note: json?['note'],
      gpsStatus: json?['gpsStatus'],
      sealStatus: json?['sealStatus'],
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'vehicle': vehicle?.toJson(),
      'travelHours': travelHours,
      'repairHours': repairHours,
      'fuelRemain': fuelRemain,
      'fuelReceived': fuelReceived,
      'fuelRemainEnd': fuelRemainEnd,
      'status': status,
      'note': note,
      'gpsStatus': gpsStatus,
      'sealStatus': sealStatus,
    };
  }
}

// shiftReport Model

class ShiftReportModel {
  final String orderId;
  final String? assignedTo;
  final List<VehicleShiftReportModel>? vehicleReports;
  final List<VehicleSummariesModel>? vehicleSummaries;
  final num? handoverHours;
  final num? otherHours;
  final String? handoverNotes;
  final String? risks;

  ShiftReportModel({
    required this.orderId,
    this.assignedTo,
    this.vehicleReports,
    this.vehicleSummaries,
    this.handoverHours,
    this.otherHours,
    this.handoverNotes,
    this.risks,
  });

  factory ShiftReportModel.fromJson(
    Map<String, dynamic>? json,
  ) {
    return ShiftReportModel(
      orderId: json?['orderId'],
      assignedTo: json?['assignedTo'],
      vehicleReports:
          (json?['vehicleReports'] as List?)
              ?.map(
                (e) => VehicleShiftReportModel.fromJson(e),
              )
              .toList() ??
          [],
      vehicleSummaries:
          (json?['vehicleSummaries'] as List?)
              ?.map(
                (e) => VehicleSummariesModel.fromJson(e),
              )
              .toList() ??
          [],
      handoverHours: json?['handoverHours'],
      otherHours: json?['otherHours'],
      handoverNotes: json?['handoverNotes'],
      risks: json?['risks'],
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'orderId': orderId,
      'assignedTo': assignedTo,
      'vehicleReports':
          vehicleReports?.map((e) => e.toJson()).toList(),
      'vehicleSummaries':
          vehicleSummaries?.map((e) => e.toJson()).toList(),
      'handoverHours': handoverHours,
      'otherHours': otherHours,
      'handoverNotes': handoverNotes,
      'risks': risks,
    };
  }
}
