import 'package:soft/models/position_model.dart';

class UserModel {
  final String id;
  final String? username;
  final String? fullName;
  final String? email;
  final String? phone;
  final String? salaryCode;
  final String? role;
  final PositionModel? position;

  UserModel({
    required this.id,
    this.username,
    this.fullName,
    this.email,
    this.phone,
    this.salaryCode,
    this.role,
    this.position,
  });

  factory UserModel.fromJson(Map<String, dynamic>? json) {
    return UserModel(
      id: json?['_id'] ?? '',
      username: json?['username'] ?? '',
      fullName: json?['fullName'] ?? '',
      email: json?['email'] ?? '',
      phone: json?['phone'] ?? '',
      salaryCode: json?['salaryCode'] ?? '',
      role: json?['role'] ?? '',
      position:
          json?['position'] != null
              ? PositionModel.fromJson(json?['position'])
              : null,
    );
  }

  Map<String, dynamic> toJson() => {
    '_id': id,
    'username': username,
    'fullName': fullName,
    'email': email,
    'phone': phone,
    'salaryCode': salaryCode,
    'role': role,
    'position': position?.toJson(),
  };
}
