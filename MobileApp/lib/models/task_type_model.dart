class TaskTypeModel {
  final String id;
  final String name;
  final String? mode;
  final String? description;

  TaskTypeModel({
    required this.id,
    required this.name,
    this.mode,
    this.description,
  });

  factory TaskTypeModel.fromJson(
    Map<String, dynamic>? json,
  ) {
    return TaskTypeModel(
      id: json?['_id'] ?? '',
      name: json?['name'] ?? '',
      mode: json?['mode'] ?? '',
      description: json?['description'] ?? '',
    );
  }
}
