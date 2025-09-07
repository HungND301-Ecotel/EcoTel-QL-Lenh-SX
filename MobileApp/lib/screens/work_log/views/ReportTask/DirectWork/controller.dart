import 'package:flutter/material.dart';

class VehicleSummariesControllers {
  final TextEditingController fuelRemain =
      TextEditingController();
  final TextEditingController fuelReceived =
      TextEditingController();
  final TextEditingController fuelRemainEnd =
      TextEditingController();
  final TextEditingController repairHours =
      TextEditingController();
  final TextEditingController travelHours =
      TextEditingController();
  final TextEditingController distanceKm =
      TextEditingController();
  final TextEditingController fuelUsedController =
      TextEditingController();
  String status = 'good';
  final TextEditingController note =
      TextEditingController();
  String gpsStatus = 'Hoạt động bình thường';
  String sealStatus = 'Tốt';
}
