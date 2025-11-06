class DeviceTypeModel {
  final String id;
  final String name;

  DeviceTypeModel({required this.id, required this.name});

  factory DeviceTypeModel.fromJson(
    Map<String, dynamic>? json,
  ) {
    return DeviceTypeModel(
      id: json?['_id'] ?? '',
      name: json?['name'] ?? '',
    );
  }
  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
    };
  }
}
