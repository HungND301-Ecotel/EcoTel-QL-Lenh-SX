import 'dart:async';

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
  final DeviceService _deviceService = DeviceService();
  final LocalSyncService _localSyncService =
      LocalSyncService();

  bool _isLoading = false;
  List<DeviceHive> devices = [];
  DeviceHive? _selectedDevice;
  String _searchText = '';
  Timer? _searchDebounce;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance
        .addPostFrameCallback((_) => _initPage());
  }

  /// 🚀 Load dữ liệu nhẹ & đồng bộ nền
  Future<void> _initPage() async {
    setState(() => _isLoading = true);
    final box = Hive.box<DeviceHive>("devices");

    // 1️⃣ Đọc cache sau khi UI render (không block)
    final cachedDevices = await Future.delayed(
      const Duration(milliseconds: 100),
      () {
        final box = Hive.box<DeviceHive>("devices");
        return box.values
            .where((d) => d.type == "EXCAVATOR")
            .toList();
      },
    );

    if (!mounted) return;
    setState(() {
      devices = cachedDevices;
      _isLoading = false;
    });

    // 2️⃣ Sync nền (non-blocking)
    unawaited(Future.delayed(
        const Duration(milliseconds: 300), () async {
      await _syncDevices(box);
    }));
  }

  Future<void> _syncDevices(Box<DeviceHive> box) async {
    try {
      await _localSyncService.fetchAndSyncHive<DeviceHive>(
        box: box,
        prefix: "EXCAVATOR",
        fetch: _deviceService.getAllExcavator,
        fromJson: (item) =>
            DeviceHive.fromJson(item, "EXCAVATOR"),
      );

      final updated = box.values
          .where((d) => d.type == "EXCAVATOR")
          .toList();

      final order = Provider.of<ReportDraftProvider>(
        context,
        listen: false,
      ).order;

      // 🧩 Xác định danh sách máy xúc được chọn (status == true)
      List<String> selectedIds = [];
      DeviceHive? selected;

      if (order?.excavator != null &&
          order!.excavator!.isNotEmpty) {
        final activeExcavators = order.excavator!
            .where((i) =>
                i.status == true && i.device?.id != null)
            .toList();

        if (activeExcavators.isNotEmpty) {
          selectedIds = activeExcavators
              .map((m) => m.device!.id)
              .toList();

          selected = activeExcavators.last.device!.toHive();
        }
      }

      if (!mounted) return;

      setState(() {
        devices = updated;
        _selectedDevice = selected;

        if (selected != null) {
          // 🟢 Đặt mặc định máy xúc đã chọn
          _onSelectedExcavator(selected);

          // 🔄 Sắp xếp lại list: máy xúc được chọn nằm trên đầu
          devices.sort((a, b) {
            if (selectedIds.contains(a.id) &&
                !selectedIds.contains(b.id)) {
              return -1;
            }
            if (!selectedIds.contains(a.id) &&
                selectedIds.contains(b.id)) {
              return 1;
            }
            return 0;
          });
        }
      });

      debugPrint("✅ Synced ${updated.length} excavators.");
    } catch (e, stack) {
      debugPrint("❌ Sync excavator error: $e");
      debugPrint(stack.toString());
    }
  }

  void _onSelectedExcavator(DeviceHive selectedExcavator) {
    _selectedDevice = selectedExcavator;
    Provider.of<ReportDraftProvider>(context, listen: false)
        .setExcavator(selectedExcavator);
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    super.dispose();
  }

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
                ? const Center(
                    child: CircularProgressIndicator())
                : devices.isEmpty
                    ? const Center(
                        child: Text("Không có dữ liệu"))
                    : ListView.builder(
                        physics:
                            const AlwaysScrollableScrollPhysics(),
                        itemCount: filteredItems.length,
                        itemBuilder: (context, index) {
                          final item = filteredItems[index];
                          return ExcavatorItem(
                            data: item,
                            selected: _selectedDevice?.id ==
                                item.id,
                            onTap: () => setState(() {
                              _onSelectedExcavator(item);
                            }),
                          );
                        },
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
