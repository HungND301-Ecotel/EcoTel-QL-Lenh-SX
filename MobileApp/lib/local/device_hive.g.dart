// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'device_hive.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class DeviceHiveAdapter extends TypeAdapter<DeviceHive> {
  @override
  final int typeId = 1;

  @override
  DeviceHive read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return DeviceHive(
      id: fields[0] as String,
      code: fields[1] as String,
      name: fields[2] as String?,
      type: fields[3] as String?,
    );
  }

  @override
  void write(BinaryWriter writer, DeviceHive obj) {
    writer
      ..writeByte(4)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.code)
      ..writeByte(2)
      ..write(obj.name)
      ..writeByte(3)
      ..write(obj.type);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is DeviceHiveAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
