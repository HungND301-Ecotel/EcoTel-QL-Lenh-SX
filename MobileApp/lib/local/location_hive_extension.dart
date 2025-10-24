import 'package:soft/local/location_hive.dart';
import 'package:soft/models/location_model.dart';

extension LocationConvert on LocationModel {
  LocationHive toHive() => LocationHive(
        id: id,
        name: name,
      );
}

extension LocationHiveConvert on LocationHive {
  LocationModel toModel() => LocationModel(
        id: id,
        name: name,
      );
}
