import 'dart:async';

import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:soft/local/LocalSyncService.dart';
import 'package:soft/local/material_hive.dart';
import 'package:soft/providers/report_provider.dart';
import 'package:soft/screens/work_log/routes/routes.dart';
import 'package:soft/screens/work_log/widgets/material_item.dart';
import 'package:soft/services/material_service.dart';
import 'package:provider/provider.dart';

class DozerSelectProduct extends StatefulWidget {
  const DozerSelectProduct({super.key});

  @override
  State<StatefulWidget> createState() =>
      _DozerSelectProduct();
}

class _DozerSelectProduct
    extends State<DozerSelectProduct> {
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

      if (!mounted) return;
      setState(() {
        materials = updated;
      });
      debugPrint("✅ Synced ${updated.length} materials.");
    } catch (e, stack) {
      debugPrint("❌ Sync material error: $e");
      debugPrint(stack.toString());
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
    List<MaterialHive> filteredItems = materials
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
          'Vật liệu',
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
                : materials.isEmpty
                    ? const Center(
                        child: Text("Không có dữ liệu"))
                    : ListView.builder(
                        itemCount: filteredItems.length,
                        itemBuilder: (context, index) {
                          final item = filteredItems[index];
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
            width: double.infinity,
            color: Colors.white,
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _selectedMaterial == null
                    ? null
                    : () {
                        Navigator.pushNamed(
                          context,
                          WorkLogRoutes.dozerInputQuantity,
                        );
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  foregroundColor: Colors.white,
                ),
                child: Text('Tiếp tục'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
