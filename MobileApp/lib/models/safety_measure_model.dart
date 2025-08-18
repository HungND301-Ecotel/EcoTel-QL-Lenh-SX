class SafetyMeasureModel {
  final String id;
  final String content;

  SafetyMeasureModel({
    required this.id,
    required this.content,
  });

  factory SafetyMeasureModel.fromJson(
    Map<String, dynamic>? json,
  ) {
    return SafetyMeasureModel(
      id: json?['_id'] ?? '',
      content: json?['content'] ?? '',
    );
  }
  Map<String, dynamic> toJson() {
    return {'id': id, 'content': content};
  }
}
