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

class ExcavatorSelectVehicle extends StatefulWidget {
  const ExcavatorSelectVehicle({super.key});

  @override
  State<StatefulWidget> createState() =>
      _ExcavatorSelectVehicle();
}

class _ExcavatorSelectVehicle
    extends State<ExcavatorSelectVehicle> {
  final DeviceService _deviceService = DeviceService();
  final LocalSyncService _localSyncService =
      LocalSyncService();

  bool _isLoading = false;
  List<DeviceHive> devices = [];
  Set<DeviceHive> _selectedDevices = {};
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

    // 🧠 1️⃣ Load cache nhẹ sau khi UI hiển thị
    final cached = await Future.delayed(
        const Duration(milliseconds: 100), () {
      final box = Hive.box<DeviceHive>("devices");
      return box.values
          .where((d) => d.type == "CAR")
          .toList();
    });

    if (!mounted) return;

    setState(() {
      devices = cached;
      _isLoading = false;
    });

    // 🧩 2️⃣ Gọi API nền (không block UI)
    unawaited(Future.delayed(
        const Duration(milliseconds: 300), _syncDevices));
  }

  Future<void> _syncDevices() async {
    final box = Hive.box<DeviceHive>("devices");
    try {
      await _localSyncService.fetchAndSyncHive<DeviceHive>(
        box: box,
        prefix: "CAR",
        fetch: _deviceService.getAllCar,
        fromJson: (item) =>
            DeviceHive.fromJson(item, "CAR"),
      );

      final updated =
          box.values.where((d) => d.type == "CAR").toList();

      if (!mounted) return;

      // 🔄 Lấy order hiện tại
      final order = Provider.of<ReportDraftProvider>(
        context,
        listen: false,
      ).order;

      Set<DeviceHive> selected = {};
      Set<String> selectedIds = {};

      if (order?.assignedVehicles != null &&
          order!.assignedVehicles!.isNotEmpty) {
        selected = order.assignedVehicles!
            .map((m) => m.toHive())
            .toSet();
        selectedIds = order.assignedVehicles!
            .map((m) => m.id)
            .toSet();

        Provider.of<ReportDraftProvider>(context,
                listen: false)
            .devices = selected.toList();
      }

      // ⚡ Gom lại 1 setState duy nhất
      setState(() {
        _selectedDevices = selected;
        devices = updated;
        if (selected.isNotEmpty) {
          devices.sort((a, b) {
            if (selectedIds.contains(a.id) &&
                !selectedIds.contains(b.id)) return -1;
            if (!selectedIds.contains(a.id) &&
                selectedIds.contains(b.id)) return 1;
            return 0;
          });
        }
      });

      debugPrint(
          "✅ Sync completed: ${updated.length} CAR devices");
    } catch (e, stack) {
      debugPrint("❌ Sync vehicle error: $e");
      debugPrint(stack.toString());
    }
  }

  void _onToggleDevice(DeviceHive device) {
    setState(() {
      if (_selectedDevices.contains(device)) {
        _selectedDevices.remove(device);
      } else {
        _selectedDevices.add(device);
      }
    });

    Provider.of<ReportDraftProvider>(context, listen: false)
        .devices = _selectedDevices.toList();
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _searchText.isEmpty
        ? devices
        : devices
            .where((d) => d.code
                .toLowerCase()
                .contains(_searchText.toLowerCase()))
            .toList();

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        title: const Text(
          'Xe nhận tải',
          style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w600),
        ),
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
                        itemCount: filtered.length,
                        itemBuilder: (context, index) {
                          final item = filtered[index];
                          final isSelected =
                              _selectedDevices.any(
                                  (d) => d.id == item.id);
                          return ExcavatorItem(
                            data: item,
                            selected: isSelected,
                            onTap: () =>
                                _onToggleDevice(item),
                          );
                        },
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
              child: const Text('Tiếp tục'),
            ),
          ),
        ],
      ),
    );
  }
}
