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
  final String id;
  final String orderId;
  final String? assignedTo;
  final List<VehicleSummariesModel>? vehicleSummaries;
  final num? handoverHours;
  final num? otherHours;
  final String? handoverNotes;
  final String? risks;

  ShiftReportModel({
    required this.id,
    required this.orderId,
    this.assignedTo,
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
      id: json?['_id'],
      orderId: json?['orderId'],
      assignedTo: json?['assignedTo'] ?? '',
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
      'id': id,
      'orderId': orderId,
      'assignedTo': assignedTo,
      'vehicleSummaries':
          vehicleSummaries?.map((e) => e.toJson()).toList(),
      'handoverHours': handoverHours,
      'otherHours': otherHours,
      'handoverNotes': handoverNotes,
      'risks': risks,
    };
  }
}
