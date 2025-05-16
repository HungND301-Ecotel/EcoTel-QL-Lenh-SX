class PayrollModel {
  final String id;
  final String code;
  final String? userId;

  PayrollModel({
    required this.id,
    required this.code,
    this.userId,
  });

  factory PayrollModel.fromJson(
    Map<String, dynamic>? json,
  ) {
    return PayrollModel(
      id: json?['_id'] ?? '',
      userId: json?['userId'] ?? '',
      code: json?['code'] ?? '',
    );
  }
}
