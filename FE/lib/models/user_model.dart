import 'package:soft/models/payroll_model.dart';

class UserModel {
  final String id;
  final String? username;
  final String? name;
  final String? email;
  final String? phone;
  final String? role;
  final PayrollModel? payroll;

  UserModel({
    required this.id,
    this.username,
    this.name,
    this.email,
    this.phone,
    this.role,
    this.payroll,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['_id'],
      username: json['username'] ?? '',
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'] ?? '',
      role: json['role'] ?? '',
      payroll:
          json['payroll'] != null
              ? PayrollModel.fromJson(json['payroll'])
              : null,
    );
  }
}
