import 'package:hive/hive.dart';

part 'device_hive.g.dart';

@HiveType(typeId: 1)
class DeviceHive extends HiveObject {
  @HiveField(0)
  final String id;
  @HiveField(1)
  final String code;
  @HiveField(2)
  final String? name;
  @HiveField(3)
  final String? type;

  DeviceHive(
      {required this.id,
      required this.code,
      this.name,
      this.type});

  factory DeviceHive.fromJson(
          Map<String, dynamic>? json, String? type) =>
      DeviceHive(
          id: json?['_id'] ?? '',
          code: json?['code'] ?? '',
          name: json?['name'] ?? '',
          type: type ?? '');

  Map<String, dynamic> toJson() =>
      {'_id': id, 'code': code, 'name': name, 'type': type};
}
