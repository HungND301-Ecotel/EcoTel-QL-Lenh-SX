import 'package:flutter/material.dart';

class ReportDraftProvider with ChangeNotifier {
  String? orderId;
  String? device;
  String? material;
  String? fromLocation;
  String? toLocation;
  num? drillDepth;
  num? hardnessF;
  int? workingMinutes;
  num? distanceKm;
  int? quantity;

  void setOrderId(String id) {
    orderId = id;
    notifyListeners();
  }

  void setMaterial(String value) {
    material = value;
    notifyListeners();
  }

  void setDevice(String value) {
    device = value;
    notifyListeners();
  }

  void setFromLocation(String value) {
    fromLocation = value;
    notifyListeners();
  }

  void setToLocation(String value) {
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

  void reset() {
    material = null;
    drillDepth = null;
    hardnessF = null;
    device = null;
    fromLocation = null;
    toLocation = null;
    workingMinutes = null;
    distanceKm = null;
    quantity = null;
  }
}
