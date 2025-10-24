import 'package:soft/local/material_hive.dart';
import 'package:soft/models/material_model.dart';

extension MaterialConvert on MaterialModel {
  MaterialHive toHive() => MaterialHive(
        id: id,
        name: name,
      );
}

extension MaterialHiveConvert on MaterialHive {
  MaterialModel toModel() => MaterialModel(
        id: id,
        name: name,
      );
}
