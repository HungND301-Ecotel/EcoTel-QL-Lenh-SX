import 'package:soft/models/coordinate_model.dart';

class LocationModel {
  final String id;
  final String name;
  final num? distance;
  final Coordinates? coordinates;

  LocationModel({
    required this.id,
    required this.name,
    this.distance,
    this.coordinates,
  });

  factory LocationModel.fromJson(
    Map<String, dynamic>? json,
  ) {
    return LocationModel(
      id: json?['_id'] ?? '',
      name: json?['name'] ?? '',
      distance: json?['distance'],
      coordinates: json?['coordinates'] != null
          ? Coordinates.fromJson(json?['coordinates'])
          : null,
    );
  }
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'distance': distance,
      'coordinates': coordinates?.toJson(),
    };
  }
}
