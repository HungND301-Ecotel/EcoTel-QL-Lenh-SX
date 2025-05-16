import 'package:job_manager/models/task_type_model.dart';

class TaskModel {
  final String id;
  final String name;
  final TaskTypeModel typeId;

  TaskModel({
    required this.id,
    required this.name,
    required this.typeId,
  });

  factory TaskModel.fromJson(Map<String, dynamic>? json) {
    return TaskModel(
      id: json?['_id'] ?? '',
      name: json?['name'] ?? '',
      typeId: TaskTypeModel.fromJson(json?['typeId']),
    );
  }
}
