// device model

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
  final num? distanceKm;
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
    this.distanceKm,
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
      distanceKm: json?['distanceKm'],
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
      'distanceKm': distanceKm,
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
  final String? handoverNotes;
  final String? risks;

  ShiftReportModel({
    required this.id,
    required this.orderId,
    this.assignedTo,
    this.vehicleSummaries,
    this.handoverHours,
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
      'handoverNotes': handoverNotes,
      'risks': risks,
    };
  }
}
