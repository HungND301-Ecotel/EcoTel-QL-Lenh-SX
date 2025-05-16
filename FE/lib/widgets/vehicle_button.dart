import 'package:flutter/material.dart';
import 'package:job_manager/models/device_model.dart';
import 'package:job_manager/routes/task_assignment_route.dart';

class VehicleButton extends StatefulWidget {
  final DeviceModel? vehicle;
  final Function(DeviceModel) onSelectVehicle;
  const VehicleButton({
    super.key,
    required this.vehicle,
    required this.onSelectVehicle,
  });

  @override
  State<StatefulWidget> createState() =>
      _VehicleButtonState();
}

class _VehicleButtonState extends State<VehicleButton> {
  late DeviceModel? _vehicle;

  @override
  void initState() {
    super.initState();
    _vehicle =
        widget.vehicle; // Gán giá trị phương tiện ban đầu
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: TextButton.icon(
        icon: Icon(Icons.pin),
        onPressed: () async {
          final selectedVehicle = await Navigator.pushNamed(
            context,
            TaskAssignmentRoutes
                .taskAssignmentVehicleSelect,
          );
          // Nếu có giá trị trả về, cập nhật phương tiện
          if (selectedVehicle != null &&
              selectedVehicle is DeviceModel) {
            widget.onSelectVehicle(selectedVehicle);
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
        label: Text(_vehicle?.name ?? 'Chọn phương tiện'),
      ),
    );
  }
}
