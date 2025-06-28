class DepartmentModel {
  final String id;
  final String name;
  final String? code;
  final String? description;
  final bool? isActive;

  factory DepartmentModel.fromJson(
    Map<String, dynamic>? json,
  ) {
    return DepartmentModel(
      id: json?['_id'] ?? '',
      name: json?['name'] ?? '',
      code: json?['code'] ?? '',
      description: json?['description'] ?? '',
      isActive: json?['isActive'] ?? true,
    );
  }

  DepartmentModel({
    required this.id,
    required this.name,
    this.code,
    this.description,
    this.isActive,
  });
}
