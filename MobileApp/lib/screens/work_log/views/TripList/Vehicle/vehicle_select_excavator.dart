import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:soft/local/LocalSyncService.dart';
import 'package:soft/local/device_hive.dart';
import 'package:soft/local/device_hive_extension.dart';
import 'package:soft/providers/report_provider.dart';
import 'package:soft/screens/work_log/routes/routes.dart';
import 'package:soft/screens/work_log/widgets/device_item.dart';
import 'package:soft/services/device_service.dart';
import 'package:provider/provider.dart';

class VehicleSelectExcavator extends StatefulWidget {
  const VehicleSelectExcavator({super.key});

  @override
  State<StatefulWidget> createState() =>
      _VehicleSelectExcavator();
}

class _VehicleSelectExcavator
    extends State<VehicleSelectExcavator> {
  bool _isLoading = true;
  List<DeviceHive> devices = [];
  final DeviceService _deviceService = DeviceService();
  final LocalSyncService _localSyncService =
      LocalSyncService();

  void getAllDevice() async {
    final box = Hive.box<DeviceHive>("devices");
    final localDevices = box.values.toList();
    setState(() {
      devices = localDevices
          .where((d) => d.type == "EXCAVATOR")
          .toList();
    });
    var result = await _deviceService.getAllExcavator();

    if (!mounted) return;
    if (result['status'] == 'error') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message']),
          backgroundColor: Colors.red,
        ),
      );
    } else {
      final List data = result['data'] ?? [];
      await _localSyncService.syncHive<DeviceHive>(
          box: box,
          data: data,
          prefix: "EXCAVATOR",
          fromJson: (item) =>
              DeviceHive.fromJson(item, "EXCAVATOR"));

      // 🟢 4. Reload lại danh sách
      final updated = box.values.toList();
      setState(() {
        devices = updated
            .where((d) => d.type == "EXCAVATOR")
            .toList();
        _isLoading = false;
      });
      final order = Provider.of<ReportDraftProvider>(
        context,
        listen: false,
      ).order;
      if (order?.excavator != null &&
          order!.excavator!.isNotEmpty) {
        final selectedIds = order.excavator!
            .where((i) => i.status == true)
            .map((m) => m.device?.id)
            .toList();
        _selectedDevice = order.excavator!
            .where((i) => i.status == true)
            .map((m) => m.device)
            .last
            ?.toHive();
        if (selectedIds.isNotEmpty) {
          _onSelectDevice(
              _selectedDevice!); // chỉ gọi 1 lần
          setState(() {
            devices.sort((a, b) {
              if (a.id == _selectedDevice?.id) return -1;
              if (b.id == _selectedDevice?.id) return 1;
              return 0;
            });
          });
        }
      }
    }
    setState(() {
      _isLoading = false;
    });
  }

  @override
  void initState() {
    super.initState();
    getAllDevice();
    // WidgetsBinding.instance.addPostFrameCallback((_) {
    //   final order =
    //       Provider.of<ReportDraftProvider>(
    //         context,
    //         listen: false,
    //       ).order;
    //   if (order?.excavator != null) {
    //     _selectedDevice = order!.excavator!.first.id;
    //     setState(() {
    //       _onSelectDevice(order.excavator!.first.id);
    //     });
    //   }
    // });
  }

  DeviceHive? _selectedDevice;
  void _onSelectDevice(DeviceHive selectedDevice) {
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
    List<DeviceHive> filteredItems = devices
        .where(
          (item) => item.code.toLowerCase().contains(
                _searchText.toLowerCase(),
              ),
        )
        .toList();
    if (_selectedDevice != null) {
      filteredItems.sort((a, b) {
        if (a.id == _selectedDevice) return -1;
        if (b.id == _selectedDevice) return 1;
        return 0;
      });
    }
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
            child: _isLoading
                ? Center(
                    child: CircularProgressIndicator(),
                  )
                : SingleChildScrollView(
                    child: Column(
                      children: filteredItems
                          .map(
                            (item) => ExcavatorItem(
                              data: item,
                              selected:
                                  _selectedDevice?.id ==
                                      item.id,
                              onTap: () {
                                _onSelectDevice(
                                  item,
                                );
                              },
                            ),
                          )
                          .toList(),
                    ),
                  ),
          ),
          Container(
            padding: const EdgeInsets.all(8.0),
            width: double.infinity,
            color: Colors.white,
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                    ),
                    child: Text('Về trước'),
                  ),
                ),
                SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _selectedDevice == null
                        ? null
                        : () {
                            Navigator.pushNamed(
                              context,
                              WorkLogRoutes
                                  .vehicleSelectDestination,
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
          ),
        ],
      ),
    );
  }
}
