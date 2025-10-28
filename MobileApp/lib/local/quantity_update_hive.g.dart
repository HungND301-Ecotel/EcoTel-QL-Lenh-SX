// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'quantity_update_hive.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class QuantityUpdateHiveAdapter extends TypeAdapter<QuantityUpdateHive> {
  @override
  final int typeId = 5;

  @override
  QuantityUpdateHive read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return QuantityUpdateHive(
      time: fields[0] as DateTime,
      quantity: fields[1] as num,
    );
  }

  @override
  void write(BinaryWriter writer, QuantityUpdateHive obj) {
    writer
      ..writeByte(2)
      ..writeByte(0)
      ..write(obj.time)
      ..writeByte(1)
      ..write(obj.quantity);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is QuantityUpdateHiveAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
