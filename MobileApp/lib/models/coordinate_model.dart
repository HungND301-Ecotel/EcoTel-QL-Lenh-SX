class Coordinates {
  final String type;
  final List<double> coordinates;

  Coordinates({
    required this.type,
    required this.coordinates,
  });

  factory Coordinates.fromJson(Map<String, dynamic>? json) {
    return Coordinates(
      type: json?['type'] ?? 'Point',
      coordinates:
          (json?['coordinates'] as List)
              .map((e) => (e as num).toDouble())
              .toList(),
    );
  }
   Map<String, dynamic> toJson() {
    return {
      'type': type,
      'coordinates': coordinates,
    };
  }
}
