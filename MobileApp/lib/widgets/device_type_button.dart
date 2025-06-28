import 'package:flutter/material.dart';
import 'package:soft/models/device_model.dart';
import 'package:soft/models/device_type_model.dart';
import 'package:soft/routes/app_routes.dart';
import 'package:soft/services/device_service.dart';
import 'package:soft/services/device_type_service.dart';

class DeviceTypeButton extends StatefulWidget {
  final String? deviceType;
  final Function(String) onSelectDeviceType;
  const DeviceTypeButton({
    super.key,
    this.deviceType,
    required this.onSelectDeviceType,
  });

  @override
  State<StatefulWidget> createState() =>
      _DeviceTypeButton();
}

class _DeviceTypeButton extends State<DeviceTypeButton> {
  DeviceTypeModel? _deviceType;

  final DeviceTypeService _deviceTypeService =
      DeviceTypeService();

  @override
  void initState() {
    super.initState();
    if (widget.deviceType != null) {
      getDeviceType();
    } // Gán giá trị phương tiện ban đầu
  }

  void getDeviceType() async {
    var result = await _deviceTypeService.getOne(
      widget.deviceType!,
    );
    if (!mounted) return;
    if (result['status'] == 'error') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message']),
          backgroundColor: Colors.red,
        ),
      );
    } else {
      var data = result['data'];
      setState(() {
        _deviceType = DeviceTypeModel.fromJson(data);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: TextButton.icon(
        icon: Icon(Icons.pin),
        onPressed: () async {
          final selectedDeviceType = await Navigator.of(
            context,
            rootNavigator: true,
          ).pushNamed(AppRoute.deviceTypeSelect);
          // Nếu có giá trị trả về, cập nhật phương tiện
          if (selectedDeviceType != null &&
              selectedDeviceType is DeviceTypeModel) {
            widget.onSelectDeviceType(
              selectedDeviceType.id,
            );
            setState(() {
              _deviceType =
                  selectedDeviceType; // Cập nhật giá trị phương tiện
            });
          }
        },
        style: TextButton.styleFrom(
          foregroundColor: Colors.black,
          backgroundColor: Colors.grey.shade300,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(0),
          ),
          alignment: Alignment.centerLeft,
        ),
        label: Text(
          _deviceType?.name ?? 'Chọn loại phương tiện',
        ),
      ),
    );
  }
}
