import 'dart:async';
import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:provider/provider.dart';
import 'package:soft/local/LocalSyncService.dart';
import 'package:soft/local/material_hive.dart';
import 'package:soft/local/material_hive_extension.dart';
import 'package:soft/local/report_hive.dart';
import 'package:soft/providers/report_provider.dart';
import 'package:soft/screens/work_log/routes/routes.dart';
import 'package:soft/screens/work_log/widgets/Button/button_save.dart';
import 'package:soft/screens/work_log/widgets/material_item.dart';
import 'package:soft/services/material_service.dart';

class ExcavatorSelectMaterial extends StatefulWidget {
  const ExcavatorSelectMaterial({super.key});

  @override
  State<StatefulWidget> createState() =>
      _ExcavatorSelectMaterial();
}

class _ExcavatorSelectMaterial
    extends State<ExcavatorSelectMaterial> {
  final MaterialService _materialService =
      MaterialService();
  final LocalSyncService _localSyncService =
      LocalSyncService();

  bool _isLoading = false;
  List<MaterialHive> materials = [];
  MaterialHive? _selectedMaterial;
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
    final box = Hive.box<MaterialHive>("materials");

    // 1️⃣ Đọc cache sau khi UI render (không block)
    final cached = await Future.delayed(
      const Duration(milliseconds: 100),
      () => box.values.toList(),
    );

    if (!mounted) return;
    setState(() {
      materials = cached;
      _isLoading = false;
    });

    // 2️⃣ Sync nền (non-blocking)
    unawaited(Future.delayed(
        const Duration(milliseconds: 300), () async {
      await _syncMaterials(box);
    }));
  }

  /// 🔄 Sync dữ liệu từ server về Hive
  Future<void> _syncMaterials(Box<MaterialHive> box) async {
    try {
      await _localSyncService
          .fetchAndSyncHive<MaterialHive>(
        box: box,
        prefix: "MATERIAL",
        fetch: _materialService.getAllMaterial,
        fromJson: (item) => MaterialHive.fromJson(item),
      );

      final updated = box.values.toList();

      final order = Provider.of<ReportDraftProvider>(
              context,
              listen: false)
          .order;

      List<String> selectedIds = [];
      MaterialHive? selected;

      if (order?.material != null &&
          order!.material!.isNotEmpty) {
        selectedIds =
            order.material!.map((m) => m.id).toList();
        selected = order.material!.last.toHive();
      }

      if (!mounted) return;
      setState(() {
        materials = updated;
        _selectedMaterial = selected;

        if (selected != null) {
          _onSelectedMaterial(selected);
          materials.sort((a, b) {
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

  void create() async {
    final box = Hive.box<ReportHive>("reports");
    final provider = Provider.of<ReportDraftProvider>(
        context,
        listen: false);

    provider.setMaterial(_selectedMaterial!);

    try {
      // 🧱 1. Tạo danh sách ReportHive để lưu local
      final List<ReportHive> reportList =
          provider.devices.map((device) {
        return ReportHive(
          localKey:
              "${provider.orderId}_${device.id}_${provider.material?.id}", // tạo id tạm local
          orderId: provider.orderId ?? "",
          device: device,
          material: provider.material,
          quantity: 0,
        );
      }).toList();

      // 🗃️ 2. Lưu toàn bộ vào Hive
      for (final report in reportList) {
        await _localSyncService.putIfNotExists<ReportHive>(
            box: box,
            id: report.localKey!,
            data: report,
            condition: (r) =>
                r.orderId == report.orderId &&
                r.device?.id == report.device?.id &&
                r.material?.id == report.material?.id);
      }

      // ✅ 3. Reset provider (hoàn tất tạo báo cáo)
      provider.reset();

      // 🟢 4. Chuyển hướng sang màn hình danh sách chuyến
      if (!mounted) return;
      Navigator.pushNamed(
        context,
        WorkLogRoutes.excavatorTripList,
        arguments: provider.orderId,
      );

      // 🛰️ (Tuỳ chọn) Gọi sync nếu có mạng
      // await ReportSyncService.syncReportsToServer();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Có lỗi khi lưu dữ liệu local: $e"),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _onSelectedMaterial(MaterialHive selectedMaterial) {
    _selectedMaterial = selectedMaterial;
    Provider.of<ReportDraftProvider>(context, listen: false)
        .setMaterial(selectedMaterial);
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _searchText.isEmpty
        ? materials
        : materials
            .where((m) => m.name
                .toLowerCase()
                .contains(_searchText.toLowerCase()))
            .toList();

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        title: const Text(
          'Vật liệu',
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
                : materials.isEmpty
                    ? const Center(
                        child: Text("Không có dữ liệu"))
                    : ListView.builder(
                        itemCount: filtered.length,
                        itemBuilder: (context, index) {
                          final item = filtered[index];
                          return MaterialItem(
                            data: item,
                            selected:
                                _selectedMaterial?.id ==
                                    item.id,
                            onTap: () => setState(() {
                              _onSelectedMaterial(item);
                            }),
                          );
                        },
                      ),
          ),
          Container(
            padding: const EdgeInsets.all(8.0),
            color: Colors.white,
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Về trước'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ButtonSave(
                    canSave: _selectedMaterial != null,
                    create: create,
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
