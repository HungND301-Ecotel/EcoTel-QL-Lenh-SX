class DepartmentModel {
  final String id;
  final String name;
  final String? code;

  factory DepartmentModel.fromJson(
    Map<String, dynamic>? json,
  ) {
    return DepartmentModel(
      id: json?['_id'] ?? '',
      name: json?['name'] ?? '',
      code: json?['code'] ?? '',
    );
  }

  DepartmentModel({
    required this.id,
    required this.name,
    this.code,
  });
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'code': code,
    };
  }
}
