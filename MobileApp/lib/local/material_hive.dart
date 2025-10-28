import 'package:hive/hive.dart';

part 'material_hive.g.dart';

@HiveType(typeId: 2)
class MaterialHive extends HiveObject {
  @HiveField(0)
  final String id;
  @HiveField(1)
  final String name;

  MaterialHive({
    required this.id,
    required this.name,
  });

  factory MaterialHive.fromJson(
          Map<String, dynamic>? json) =>
      MaterialHive(
        id: json?['_id'] ?? '',
        name: json?['name'] ?? '',
      );

  Map<String, dynamic> toJson() => {
        '_id': id,
        'name': name,
      };
}
