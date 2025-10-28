import 'dart:async';

import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:soft/local/LocalSyncService.dart';
import 'package:soft/local/location_hive.dart';
import 'package:soft/local/location_hive_extension.dart';
import 'package:soft/providers/report_provider.dart';
import 'package:soft/screens/work_log/routes/routes.dart';
import 'package:soft/screens/work_log/widgets/location_item.dart';
import 'package:soft/services/location_service.dart';
import 'package:provider/provider.dart';

class VehicleSelectDestination extends StatefulWidget {
  const VehicleSelectDestination({super.key});

  @override
  State<StatefulWidget> createState() =>
      _VehicleSelectDestination();
}

class _VehicleSelectDestination
    extends State<VehicleSelectDestination> {
  final LocationService _locationService =
      LocationService();
  final LocalSyncService _localSyncService =
      LocalSyncService();

  bool _isLoading = false;
  List<LocationHive> locations = [];
  LocationHive? _selectedLocation;
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
    final box = Hive.box<LocationHive>("locations");

    // 1️⃣ Đọc cache sau khi UI render (không block)
    final cached = await Future.delayed(
      const Duration(milliseconds: 100),
      () => box.values.toList(),
    );

    if (!mounted) return;
    setState(() {
      locations = cached;
      _isLoading = false;
    });

    // 2️⃣ Sync nền (non-blocking)
    unawaited(Future.delayed(
        const Duration(milliseconds: 300), () async {
      await _syncLocations(box);
    }));
  }

  /// 🔄 Sync dữ liệu từ server về Hive
  Future<void> _syncLocations(Box<LocationHive> box) async {
    try {
      await _localSyncService
          .fetchAndSyncHive<LocationHive>(
        box: box,
        prefix: "LOCATION",
        fetch: _locationService.getAllLocation,
        fromJson: (item) => LocationHive.fromJson(item),
      );

      final updated = box.values.toList();

      final order = Provider.of<ReportDraftProvider>(
              context,
              listen: false)
          .order;

      List<String> selectedIds = [];
      LocationHive? selected;

      if (order?.location != null &&
          order!.location!.isNotEmpty) {
        selectedIds =
            order.location!.map((m) => m.id).toList();
        selected = order.location!.last.toHive();
      }

      if (!mounted) return;
      setState(() {
        locations = updated;
        _selectedLocation = selected;

        if (selected != null) {
          _onSelectedLocation(selected);
          locations.sort((a, b) {
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
      debugPrint("✅ Synced ${updated.length} materials.");
    } catch (e, stack) {
      debugPrint("❌ Sync material error: $e");
      debugPrint(stack.toString());
    }
  }

  void _onSelectedLocation(LocationHive selectedLocation) {
    _selectedLocation = selectedLocation;
    Provider.of<ReportDraftProvider>(context, listen: false)
        .setToLocation(selectedLocation);
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    List<LocationHive> filteredItems = locations
        .where(
          (item) => item.name.toLowerCase().contains(
                _searchText.toLowerCase(),
              ),
        )
        .toList();
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        title: Text(
          'Đến điểm',
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
          Divider(height: 1),
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator())
                : locations.isEmpty
                    ? const Center(
                        child: Text("Không có dữ liệu"))
                    : ListView.builder(
                        physics:
                            const AlwaysScrollableScrollPhysics(),
                        itemCount: filteredItems.length,
                        itemBuilder: (context, index) {
                          final item = filteredItems[index];
                          return LocationItem(
                            data: item,
                            selected: _selectedLocation?.id ==
                                item.id,
                            onTap: () => setState(() {
                              _onSelectedLocation(item);
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
                    onPressed: _selectedLocation == null
                        ? null
                        : () {
                            Navigator.pushNamed(
                              context,
                              WorkLogRoutes
                                  .vehicleSelectMaterial,
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
