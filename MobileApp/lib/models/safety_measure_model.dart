import 'package:soft/models/position_model.dart';
import 'package:soft/models/task_model.dart';

class SafetyMeasureModel {
  final String id;
  final String content;
  final TaskModel? job;
  final List<PositionModel>? position;

  SafetyMeasureModel({
    required this.id,
    required this.content,
    this.job,
    this.position,
  });

  factory SafetyMeasureModel.fromJson(
    Map<String, dynamic>? json,
  ) {
    return SafetyMeasureModel(
      id: json?['_id'] ?? '',
      content: json?['content'] ?? '',
      job:
          json?['job'] != null
              ? TaskModel.fromJson(json?['job'])
              : null,
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
      'content': content,
      'job': job?.toJson(),
      'position':
          position?.map((e) => e.toJson()).toList(),
    };
  }
}
