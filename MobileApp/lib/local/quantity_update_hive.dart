import 'package:hive/hive.dart';

part 'quantity_update_hive.g.dart';

@HiveType(typeId: 5)
class QuantityUpdateHive extends HiveObject {
  @HiveField(0)
  DateTime time;

  @HiveField(1)
  num quantity;

  QuantityUpdateHive({
    required this.time,
    required this.quantity,
  });

  factory QuantityUpdateHive.fromJson(
      Map<String, dynamic> json) {
    return QuantityUpdateHive(
      time: DateTime.parse(json['time']).toLocal(),
      quantity: json['quantity'] ?? 1,
    );
  }

  Map<String, dynamic> toJson() => {
        'time': time.toIso8601String(),
        'quantity': quantity,
      };
}
