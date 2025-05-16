class DeviceModel {
  final String id;
  final String name;
  final String? status;

  DeviceModel({
    required this.id,
    required this.name,
    this.status,
  });

  factory DeviceModel.fromJson(Map<String, dynamic>? json) {
    return DeviceModel(
      id: json?['_id'] ?? '',
      name: json?['name'] ?? '',
      status: json?['status'] ?? '',
    );
  }
}
