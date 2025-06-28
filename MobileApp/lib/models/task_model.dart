
class TaskModel {
  final String id;
  final String name;
  final String type;
  final String? content;


  TaskModel({
    required this.id,
    required this.name,
    required this.type,
    required this.content,
  });

  factory TaskModel.fromJson(Map<String, dynamic>? json) {
    return TaskModel(
      id: json?['_id'] ?? '',
      name: json?['name'] ?? '',
      type: json?['type'] ?? '',
      content: json?['content'] ?? '',
    );
  }
}
