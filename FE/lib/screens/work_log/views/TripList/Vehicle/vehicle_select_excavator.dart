import 'package:flutter/material.dart';
import 'package:job_manager/models/device_model.dart';
import 'package:job_manager/screens/work_log/routes/routes.dart';
import 'package:job_manager/screens/work_log/widgets/device_item.dart';
import 'package:job_manager/services/device_service.dart';

class VehicleSelectExcavator extends StatefulWidget {
  const VehicleSelectExcavator({super.key});

  @override
  State<StatefulWidget> createState() =>
      _VehicleSelectExcavator();
}

class _VehicleSelectExcavator
    extends State<VehicleSelectExcavator> {
  bool _isLoading = true;
  final List<DeviceModel> devices = [];
  final DeviceService _deviceService = DeviceService();
  void getAllMaterial() async {
    var result = await _deviceService.getAlldevice();

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
        devices.clear(); // Nếu cần làm sạch danh sách trước
        devices.addAll(
          (data as List)
              .map((e) => DeviceModel.fromJson(e))
              .toList(),
        );
      });
    }
    setState(() {
      _isLoading = false;
    });
  }

  @override
  void initState() {
    super.initState();
    getAllMaterial();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        title: Text(
          'Từ máy xúc',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        iconTheme: IconThemeData(color: Colors.white),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Expanded(
            child:
                _isLoading
                    ? Center(
                      child: CircularProgressIndicator(),
                    )
                    : SingleChildScrollView(
                      child: Column(
                        children:
                            devices
                                .map(
                                  (item) => ExcavatorItem(
                                    data: item,
                                  ),
                                )
                                .toList(),
                      ),
                    ),
          ),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.pushNamed(
                  context,
                  WorkLogRoutes.vehicleSelectDestination,
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
                foregroundColor: Colors.white,
              ),
              child: Text('Tiếp tục'),
            ),
          ),
        ],
      ),
    );
  }
}
