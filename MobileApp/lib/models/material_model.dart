class MaterialModel {
  final String id;
  final String name;

  MaterialModel({
    required this.id,
    required this.name,
  });

  factory MaterialModel.fromJson(
    Map<String, dynamic>? json,
  ) {
    return MaterialModel(
      id: json?['_id'] ?? '',
      name: json?['name'] ?? '',
    );
  }
}
