// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'report_hive.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class ReportHiveAdapter extends TypeAdapter<ReportHive> {
  @override
  final int typeId = 4;

  @override
  ReportHive read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return ReportHive(
      id: fields[0] as String,
      orderId: fields[1] as String,
      device: fields[2] as DeviceHive?,
      excavator: fields[3] as DeviceHive?,
      fromLocation: fields[4] as LocationHive?,
      toLocation: fields[5] as LocationHive?,
      material: fields[6] as MaterialHive?,
      quantity: fields[7] as int?,
      drillDepth: fields[8] as num?,
      hardnessF: fields[9] as num?,
      workingMinutes: fields[10] as int?,
      distanceKm: fields[11] as num?,
      quantityUpdateTimes: (fields[12] as List?)?.cast<DateTime>(),
    );
  }

  @override
  void write(BinaryWriter writer, ReportHive obj) {
    writer
      ..writeByte(13)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.orderId)
      ..writeByte(2)
      ..write(obj.device)
      ..writeByte(3)
      ..write(obj.excavator)
      ..writeByte(4)
      ..write(obj.fromLocation)
      ..writeByte(5)
      ..write(obj.toLocation)
      ..writeByte(6)
      ..write(obj.material)
      ..writeByte(7)
      ..write(obj.quantity)
      ..writeByte(8)
      ..write(obj.drillDepth)
      ..writeByte(9)
      ..write(obj.hardnessF)
      ..writeByte(10)
      ..write(obj.workingMinutes)
      ..writeByte(11)
      ..write(obj.distanceKm)
      ..writeByte(12)
      ..write(obj.quantityUpdateTimes);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ReportHiveAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
