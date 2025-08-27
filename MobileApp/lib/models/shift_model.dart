class ShiftModel {
  final String id;
  final num name;
  final String? startTime;
  final String? endTime;

  ShiftModel({
    required this.id,
    required this.name,
    this.startTime,
    this.endTime,
  });

  factory ShiftModel.fromJson(Map<String, dynamic>? json) {
    return ShiftModel(
      id: json?['_id'] ?? '',
      name: json?['name'],
      startTime: json?['startTime'] ?? '',
      endTime: json?['endTime'] ?? '',
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'startTime': startTime,
      'endTime': endTime,
    };
  }
}
