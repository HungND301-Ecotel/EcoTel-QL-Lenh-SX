// Chọn phương tiện
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

class ExcavatorSelectVehicle extends StatefulWidget {
  const ExcavatorSelectVehicle({super.key});

  @override
  State<StatefulWidget> createState() =>
      _ExcavatorSelectVehicle();
}

class _ExcavatorSelectVehicle
    extends State<ExcavatorSelectVehicle> {
  bool _isLoading = true;
  List<DeviceHive> devices = [];
  final DeviceService _deviceService = DeviceService();
  Set<DeviceHive> _selectedDevices = {};
  final LocalSyncService _localSyncService =
      LocalSyncService();

  void getAllDevice() async {
    final box = Hive.box<DeviceHive>("devices");
    final localDevices = box.values.toList();
    setState(() {
      devices = localDevices
          .where((d) => d.type == "CAR")
          .toList();
    });
    var result = await _deviceService.getAllCar();

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
          prefix: "CAR",
          fromJson: (item) =>
              DeviceHive.fromJson(item, "CAR"));

      // 🟢 4. Reload lại danh sách
      final updated = box.values.toList();
      setState(() {
        devices =
            updated.where((d) => d.type == "CAR").toList();
        _isLoading = false;
      });

      final order = Provider.of<ReportDraftProvider>(
        context,
        listen: false,
      ).order;
      if (order?.assignedVehicles != null &&
          order!.assignedVehicles!.isNotEmpty) {
        // Lấy danh sách id từ assignedVehicles
        final selected = order.assignedVehicles!
            .map((m) => m.toHive())
            .toSet();
        final selectedIds = order.assignedVehicles!
            .map((m) => m.id)
            .toSet();

        Provider.of<ReportDraftProvider>(context,
                listen: false)
            .devices = selected.cast<DeviceHive>().toList();

        setState(() {
          _selectedDevices = selected.cast<DeviceHive>();

          // Sắp xếp: xe đã chọn nằm lên trên
          devices.sort((a, b) {
            if (selectedIds.contains(a.id) &&
                !selectedIds.contains(b.id)) {
              return -1;
            } else if (!selectedIds.contains(a.id) &&
                selectedIds.contains(b.id)) {
              return 1;
            }
            return 0;
          });
        });
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
    //   setState(() {
    //     devices.clear(); // Nếu cần làm sạch danh sách trước
    //     if (order?.device != null) {
    //       devices.addAll(
    //         order?.device as List<DeviceModel>,
    //       );
    //     }
    //     _isLoading = false;
    //   });
    // });
  }

  void _onToggleDevice(DeviceHive id) {
    setState(() {
      if (_selectedDevices.contains(id)) {
        _selectedDevices.remove(id); // bỏ chọn
      } else {
        _selectedDevices.add(id); // chọn thêm
      }
    });

    // cập nhật provider (nhiều phương tiện)
    Provider.of<ReportDraftProvider>(context, listen: false)
        .devices = _selectedDevices.toList();
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
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        title: Text(
          'Xe nhận tải',
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
                              selected: _selectedDevices
                                  .map((s) => s.id)
                                  .contains(
                                    item.id,
                                  ),
                              onTap: () => _onToggleDevice(
                                item,
                              ),
                            ),
                          )
                          .toList(),
                    ),
                  ),
          ),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _selectedDevices.isEmpty
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
