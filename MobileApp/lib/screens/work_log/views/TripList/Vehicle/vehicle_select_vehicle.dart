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

class VehicleSelectVehicle extends StatefulWidget {
  const VehicleSelectVehicle({super.key});

  @override
  State<StatefulWidget> createState() =>
      _VehicleSelectVehicle();
}

class _VehicleSelectVehicle
    extends State<VehicleSelectVehicle> {
  final DeviceService _deviceService = DeviceService();
  final LocalSyncService _localSyncService =
      LocalSyncService();

  List<DeviceHive> devices = [];
  DeviceHive? _selectedDevice;
  bool _isLoading = false;
  String _searchText = '';

  Timer? _searchDebounce;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance
        .addPostFrameCallback((_) => _initPage());
  }

  Future<void> _initPage() async {
    setState(() => _isLoading = true);

    // 1️⃣ Đọc Hive cache nhẹ trong isolate (delayed để không block UI)
    final cachedDevices = await Future.delayed(
      const Duration(milliseconds: 100),
      () {
        final box = Hive.box<DeviceHive>("devices");
        return box.values
            .where((d) => d.type == "VEHICLE")
            .toList();
      },
    );

    if (!mounted) return;

    setState(() {
      devices = cachedDevices;
      _isLoading = false;
    });

    // 2️⃣ Gọi sync nền sau 300ms (không block UI)
    unawaited(Future.delayed(
        const Duration(milliseconds: 300), _syncDevices));
  }

  Future<void> _syncDevices() async {
    final box = Hive.box<DeviceHive>("devices");
    try {
      await _localSyncService.fetchAndSyncHive<DeviceHive>(
        box: box,
        prefix: "VEHICLE",
        fetch: _deviceService.getAllVehicle,
        fromJson: (item) =>
            DeviceHive.fromJson(item, "VEHICLE"),
      );

      final updated = box.values
          .where((d) => d.type == "VEHICLE")
          .toList();

      if (!mounted) return;

      final order = Provider.of<ReportDraftProvider>(
        context,
        listen: false,
      ).order;

      DeviceHive? selectedDevice;
      List<String> selectedIds = [];

      if (order?.device != null &&
          order!.device!.isNotEmpty) {
        selectedIds =
            order.device!.map((m) => m.id).toList();
        selectedDevice = order.device!.last.toHive();
      }

      // ⚡ Gom setState lại 1 lần duy nhất (giảm lag)
      setState(() {
        devices = updated;
        _selectedDevice = selectedDevice;

        if (selectedDevice != null) {
          _onSelectDevice(selectedDevice);
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

      debugPrint(
          "✅ Synced ${updated.length} VEHICLE devices.");
    } catch (e, stack) {
      debugPrint("❌ Sync vehicle error: $e");
      debugPrint(stack.toString());
    }
  }

  void _onSelectDevice(DeviceHive selectedDevice) {
    _selectedDevice = selectedDevice;
    Provider.of<ReportDraftProvider>(context, listen: false)
        .setDevice(selectedDevice);
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filteredItems = _searchText.isEmpty
        ? devices
        : devices
            .where((item) => item.code
                .toLowerCase()
                .contains(_searchText.toLowerCase()))
            .toList();

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        title: const Text('Phương tiện',
            style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w600)),
        iconTheme: const IconThemeData(color: Colors.white),
        centerTitle: true,
      ),
      body: Column(
        children: [
          // 🔍 Ô tìm kiếm có debounce
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: TextField(
              decoration: InputDecoration(
                labelText: 'Tìm kiếm',
                prefixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: Colors.grey[200],
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(32),
                  borderSide: BorderSide.none,
                ),
                floatingLabelBehavior:
                    FloatingLabelBehavior.never,
              ),
              onChanged: (value) {
                _searchDebounce?.cancel();
                _searchDebounce = Timer(
                  const Duration(milliseconds: 300),
                  () => setState(() => _searchText = value),
                );
              },
            ),
          ),
          const Divider(height: 1),
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
                              _onSelectDevice(item);
                            }),
                          );
                        },
                      ),
          ),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _selectedDevice == null
                  ? null
                  : () => Navigator.pushNamed(
                        context,
                        WorkLogRoutes
                            .vehicleSelectExcavator,
                      ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
                foregroundColor: Colors.white,
              ),
              child: const Text('Tiếp tục'),
            ),
          ),
        ],
      ),
    );
  }
}
