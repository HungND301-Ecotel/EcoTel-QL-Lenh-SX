import 'package:flutter/material.dart';

class VehicleSummariesControllers {
  final TextEditingController fuelRemain =
      TextEditingController();
  final TextEditingController fuelReceived =
      TextEditingController();
  final TextEditingController fuelRemainEnd =
      TextEditingController();
  final TextEditingController fuelUsedController =
      TextEditingController();
  String status = 'good';
  final TextEditingController note =
      TextEditingController();
  String gpsStatus = 'Hoạt động bình thường';
  String sealStatus = 'Tốt';
}

class VehicleRepairControllers {
  String status = 'Đã sửa xong';
  late final TextEditingController noteRepair =
      TextEditingController();
}
