import 'package:soft/models/task_model.dart';

class SafetyMeasureModel {
  final String id;
  final String content;
  // ignore: non_constant_identifier_names
  String? master_content;
  final TaskModel? job;

  SafetyMeasureModel({
    required this.id,
    required this.content,
    // ignore: non_constant_identifier_names
    this.master_content,
    this.job,
  });

  factory SafetyMeasureModel.fromJson(
    Map<String, dynamic>? json,
  ) {
    return SafetyMeasureModel(
      id: json?['_id'] ?? '',
      content: json?['content'] ?? '',
      master_content: json?['master_content'] ?? '',
      job:
          json?['job'] != null
              ? TaskModel.fromJson(json?['job'])
              : null,
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'content': content,
      'master_content': master_content,
      'job': job?.toJson(),
    };
  }
}
