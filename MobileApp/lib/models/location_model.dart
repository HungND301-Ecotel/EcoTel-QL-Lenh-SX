import 'package:soft/models/coordinate_model.dart';

class LocationModel {
  final String id;
  final String name;
  final num? distance;
  final Coordinates? coordinates;

  LocationModel({
    required this.id,
    required this.name,
    required this.distance,
    required this.coordinates,
  });

  factory LocationModel.fromJson(
    Map<String, dynamic>? json,
  ) {
    return LocationModel(
      id: json?['_id'] ?? '',
      name: json?['name'] ?? '',
      distance: json?['distance'],
      coordinates:
          json?['coordinates'] != null
              ? Coordinates.fromJson(json?['coordinates'])
              : null,
    );
  }
}
