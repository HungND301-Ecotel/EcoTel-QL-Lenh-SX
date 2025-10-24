import 'package:flutter/material.dart';
import 'package:soft/local/device_hive.dart';
import 'package:soft/local/location_hive.dart';
import 'package:soft/local/material_hive.dart';
import 'package:soft/models/order_model.dart';

class ReportDraftProvider with ChangeNotifier {
  String? orderId;
  OrderModel? order;
  DeviceHive? device;
  DeviceHive? excavator;
  MaterialHive? material;
  LocationHive? fromLocation;
  LocationHive? toLocation;
  num? drillDepth;
  num? hardnessF;
  int? workingMinutes;
  num? distanceKm;
  int? quantity;

  List<DeviceHive> devices = [];

  void setOrderId(String id) {
    orderId = id;
    notifyListeners();
  }

  void setOrder(OrderModel data) {
    order = data;
    notifyListeners();
  }

  void setMaterial(MaterialHive value) {
    material = value;
    notifyListeners();
  }

  void setDevice(DeviceHive value) {
    device = value;
    notifyListeners();
  }

  void setExcavator(DeviceHive value) {
    excavator = value;
    notifyListeners();
  }

  void setFromLocation(LocationHive value) {
    fromLocation = value;
    notifyListeners();
  }

  void setToLocation(LocationHive value) {
    toLocation = value;
    notifyListeners();
  }

  void setVehicleInfo(int value) {
    quantity = value;
    notifyListeners();
  }

  void setDrillingInfo(num depth, num f) {
    drillDepth = depth;
    hardnessF = f;
    notifyListeners();
  }

  void setDozerInfo(int minute) {
    workingMinutes = minute;
    notifyListeners();
  }

  void setQuantity(int value) {
    quantity = value;
    notifyListeners();
  }

  void setVehicleServiceInfo(int qtt, num dt, int minute) {
    quantity = qtt;
    distanceKm = dt;
    workingMinutes = minute;
    notifyListeners();
  }

  void addDevice(DeviceHive id) {
    if (!devices.contains(id)) {
      devices.add(id);
      notifyListeners();
    }
  }

  void reset() {
    material = null;
    drillDepth = null;
    hardnessF = null;
    device = null;
    excavator = null;
    fromLocation = null;
    toLocation = null;
    workingMinutes = null;
    distanceKm = null;
    quantity = null;
    devices.clear();
  }
}
