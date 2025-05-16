class LocationModel {
  final String id;
  final String name;

  LocationModel({required this.id, required this.name});

  factory LocationModel.fromJson(Map<String, dynamic>? json) {
    return LocationModel(
      id: json?['_id'] ?? '',
      name: json?['name'] ?? '',
    );
  }
}
