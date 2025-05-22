import 'package:soft/models/order_model.dart';
import 'package:soft/models/user_model.dart';

class ShiftReportModel {
  final String id;
  final OrderModel order;
  final UserModel user;
  final int? travelHours;
  final int? repairHours;
  final int? otherHours;
  final int? handoverHours;
  final String handoverNotes;
  final String risks;

  ShiftReportModel({
    required this.id,
    required this.order,
    required this.user,
    this.travelHours,
    this.repairHours,
    this.otherHours,
    this.handoverHours,
    required this.handoverNotes,
    required this.risks,
  });

  factory ShiftReportModel.fromJson(
    Map<String, dynamic>? json,
  ) {
    return ShiftReportModel(
      id: json?['_id'],
      order: OrderModel.fromJson(json?['orderId']),
      user: UserModel.fromJson(json?['assignedTo']),
      travelHours: json?['travelHours'] ?? '',
      repairHours: json?['repairHours'] ?? '',
      handoverHours: json?['handoverHours'] ?? '',
      otherHours: json?['otherHours'] ?? '',
      handoverNotes: json?['handoverNotes'] ?? '',
      risks: json?['risks'] ?? '',
    );
  }
}
