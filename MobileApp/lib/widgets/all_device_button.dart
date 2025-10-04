import 'package:flutter/material.dart';
import 'package:soft/models/device_model.dart';
import 'package:soft/routes/app_routes.dart';
import 'package:soft/services/device_service.dart';

class AllDeviceButton extends StatefulWidget {
  final String? vehicle;
  final Function(String) onSelectVehicle;
  const AllDeviceButton({
    super.key,
    this.vehicle,
    required this.onSelectVehicle,
  });

  @override
  State<StatefulWidget> createState() =>
      _AllDeviceButtonState();
}

class _AllDeviceButtonState extends State<AllDeviceButton> {
  DeviceModel? _vehicle;

  final DeviceService _deviceService = DeviceService();

  @override
  void initState() {
    super.initState();
    if (widget.vehicle != null) {
      getDevice();
    } // Gán giá trị phương tiện ban đầu
  }

  void getDevice() async {
    var result = await _deviceService.getById(
      widget.vehicle!,
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
        _vehicle = DeviceModel.fromJson(data);
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
          final selectedVehicle = await Navigator.of(
            context,
            rootNavigator: true,
          ).pushNamed(AppRoute.vehicleSelect);
          // Nếu có giá trị trả về, cập nhật phương tiện
          if (selectedVehicle != null &&
              selectedVehicle is DeviceModel) {
            widget.onSelectVehicle(selectedVehicle.id);
            setState(() {
              _vehicle =
                  selectedVehicle; // Cập nhật giá trị phương tiện
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
        label: Text(_vehicle?.code ?? 'Chọn phương tiện'),
      ),
    );
  }
}
