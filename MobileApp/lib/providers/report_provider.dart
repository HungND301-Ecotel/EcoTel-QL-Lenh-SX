import 'package:flutter/material.dart';
import 'package:soft/models/order_model.dart';

class ReportDraftProvider with ChangeNotifier {
  String? orderId;
  OrderModel? order;
  String? device;
  String? excavator;
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
void setOrder(OrderModel data) {
    order = data;
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
   void setExcavator(String value) {
    excavator = value;
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
    excavator = null;
    fromLocation = null;
    toLocation = null;
    workingMinutes = null;
    distanceKm = null;
    quantity = null;
  }
}
