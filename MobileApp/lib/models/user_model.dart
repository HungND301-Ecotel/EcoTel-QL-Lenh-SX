class UserModel {
  final String id;
  final String? username;
  final String? fullName;
  final String? email;
  final String? phone;
  final String? salaryCode;
  final String? role;

  UserModel({
    required this.id,
    this.username,
    this.fullName,
    this.email,
    this.phone,
    this.salaryCode,
    this.role,
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
  };
}
