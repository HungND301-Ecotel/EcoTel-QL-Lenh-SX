// Chọn phương tiện
import 'package:flutter/material.dart';
import 'package:soft/models/device_model.dart';
import 'package:soft/providers/report_provider.dart';
import 'package:soft/screens/work_log/routes/routes.dart';
import 'package:soft/screens/work_log/widgets/device_item.dart';
import 'package:soft/services/device_service.dart';
import 'package:provider/provider.dart';

class ExcavatorSelectVehicle extends StatefulWidget {
  const ExcavatorSelectVehicle({super.key});

  @override
  State<StatefulWidget> createState() =>
      _ExcavatorSelectVehicle();
}

class _ExcavatorSelectVehicle
    extends State<ExcavatorSelectVehicle> {
  bool _isLoading = true;
  final List<DeviceModel> devices = [];
  final DeviceService _deviceService = DeviceService();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final order =
          Provider.of<ReportDraftProvider>(
            context,
            listen: false,
          ).order;
      setState(() {
        devices.clear(); // Nếu cần làm sạch danh sách trước
        if (order?.device != null) {
          devices.addAll(
            order?.device as List<DeviceModel>,
          );
        }
        _isLoading = false;
      });
    });
  }

  String? _selectedDevice;
  void _onSelectDevice(String selectedDevice) {
    setState(() {
      _selectedDevice = selectedDevice;
    });

    Provider.of<ReportDraftProvider>(
      context,
      listen: false,
    ).setExcavator(selectedDevice);
  }

  String _searchText = '';
  @override
  Widget build(BuildContext context) {
    List<DeviceModel> filteredItems =
        devices
            .where(
              (item) => item.code.toLowerCase().contains(
                _searchText.toLowerCase(),
              ),
            )
            .toList();
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        title: Text(
          'Phương tiện',
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
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: TextField(
              decoration: InputDecoration(
                labelText: 'Tìm kiếm',
                prefixIcon: Icon(Icons.search),
                filled: true,
                fillColor: Colors.grey[200],
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(32),
                  borderSide: BorderSide.none,
                ),
                contentPadding: EdgeInsets.symmetric(
                  vertical: 0,
                ),
                floatingLabelBehavior:
                    FloatingLabelBehavior.never,
              ),
              onChanged: (value) {
                setState(() {
                  _searchText = value;
                });
              },
            ),
          ),
          Divider(height: 1),
          Expanded(
            child:
                _isLoading
                    ? Center(
                      child: CircularProgressIndicator(),
                    )
                    : SingleChildScrollView(
                      child: Column(
                        children:
                            filteredItems
                                .map(
                                  (item) => ExcavatorItem(
                                    data: item,
                                    selected:
                                        _selectedDevice ==
                                        item.id,
                                    onTap: () {
                                      _onSelectDevice(
                                        item.id,
                                      );
                                    },
                                  ),
                                )
                                .toList(),
                      ),
                    ),
          ),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed:
                  _selectedDevice == null
                      ? null
                      : () {
                        Navigator.pushNamed(
                          context,
                          WorkLogRoutes
                              .excavatorSelectMaterial,
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
