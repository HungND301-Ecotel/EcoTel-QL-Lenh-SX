import 'package:soft/models/device_model.dart';
import 'package:soft/local/device_hive.dart';

extension DeviceConvert on DeviceModel {
  DeviceHive toHive() => DeviceHive(
        id: id,
        code: code,
        name: name,
      );
}

extension DeviceHiveConvert on DeviceHive {
  DeviceModel toModel() => DeviceModel(
        id: id,
        code: code,
        name: name,
      );
}
