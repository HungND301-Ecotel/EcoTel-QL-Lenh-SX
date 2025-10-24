import 'package:hive/hive.dart';

part 'location_hive.g.dart';

@HiveType(typeId: 3)
class LocationHive extends HiveObject {
  @HiveField(0)
  final String id;
  @HiveField(1)
  final String name;

  LocationHive({
    required this.id,
    required this.name,
  });

  factory LocationHive.fromJson(
          Map<String, dynamic>? json) =>
      LocationHive(
        id: json?['_id'] ?? '',
        name: json?['name'] ?? '',
      );

  Map<String, dynamic> toJson() => {
        '_id': id,
        'name': name,
      };
}
