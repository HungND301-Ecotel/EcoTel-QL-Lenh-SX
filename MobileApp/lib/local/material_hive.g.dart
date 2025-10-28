// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'material_hive.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class MaterialHiveAdapter extends TypeAdapter<MaterialHive> {
  @override
  final int typeId = 2;

  @override
  MaterialHive read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return MaterialHive(
      id: fields[0] as String,
      name: fields[1] as String,
    );
  }

  @override
  void write(BinaryWriter writer, MaterialHive obj) {
    writer
      ..writeByte(2)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.name);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is MaterialHiveAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
