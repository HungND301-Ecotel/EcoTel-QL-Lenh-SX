import 'package:soft/models/position_model.dart';
import 'package:soft/models/task_model.dart';

class SafetyMeasureModel {
  final String id;
  final String name;
  final String content;
  final List<TaskModel>? job;
  final List<PositionModel>? position;

  SafetyMeasureModel({
    required this.id,
    required this.name,
    required this.content,
    this.job,
    this.position,
  });

  factory SafetyMeasureModel.fromJson(
    Map<String, dynamic>? json,
  ) {
    return SafetyMeasureModel(
      id: json?['_id'] ?? '',
      name: json?['name'] ?? '',
      content: json?['content'] ?? '',
      job:
          (json?['job'] as List?)
              ?.map((e) => TaskModel.fromJson(e))
              .toList() ??
          [],
      position:
          (json?['position'] as List?)
              ?.map((e) => PositionModel.fromJson(e))
              .toList() ??
          [],
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'content': content,
      'job': job?.map((e) => e.toJson()).toList(),
      'position': position?.map((e) => e.toJson()).toList(),
    };
  }
}
