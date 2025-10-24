import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:soft/local/LocalSyncService.dart';
import 'package:soft/local/material_hive.dart';
import 'package:soft/local/report_hive.dart';
import 'package:soft/providers/report_provider.dart';
import 'package:soft/screens/work_log/routes/routes.dart';
import 'package:soft/screens/work_log/widgets/Button/button_save.dart';
import 'package:soft/screens/work_log/widgets/material_item.dart';
import 'package:soft/services/material_service.dart';
import 'package:provider/provider.dart';
import 'package:soft/services/report_service.dart';

class ExcavatorSelectMaterial extends StatefulWidget {
  const ExcavatorSelectMaterial({super.key});

  @override
  State<StatefulWidget> createState() =>
      _ExcavatorSelectMaterial();
}

class _ExcavatorSelectMaterial
    extends State<ExcavatorSelectMaterial> {
  bool _isLoading = true;
  List<MaterialHive> materials = [];
  final MaterialService _materialService =
      MaterialService();
  final LocalSyncService _localSyncService =
      LocalSyncService();
  void getAllMaterial() async {
    final box = Hive.box<MaterialHive>("materials");
    final localMaterials = box.values.toList();
    setState(() {
      materials = localMaterials;
    });
    var result = await _materialService.getAllMaterial();

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
      await _localSyncService.syncHive<MaterialHive>(
          box: box,
          data: data,
          prefix: "MATERIAL",
          fromJson: (item) => MaterialHive.fromJson(item));

      // 🟢 4. Reload lại danh sách
      final updated = box.values.toList();
      setState(() {
        materials = updated;
        _isLoading = false;
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

  MaterialHive? _selectedMaterial;
  void _onSelectedMaterial(MaterialHive selectedMaterial) {
    setState(() {
      _selectedMaterial = selectedMaterial;
    });
    Provider.of<ReportDraftProvider>(
      context,
      listen: false,
    ).setMaterial(selectedMaterial);
  }

  final ReportService _reportService = ReportService();

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
          id: "${provider.orderId}_${device.id}_${provider.material?.id}", // tạo id tạm local
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
            id: report.id,
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

  String _searchText = '';
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
                            (item) => MaterialItem(
                              data: item,
                              selected:
                                  _selectedMaterial?.id ==
                                      item.id,
                              onTap: () {
                                _onSelectedMaterial(
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
                  child: ButtonSave(
                      canSave: _selectedMaterial != null,
                      create: create),
                )
              ],
            ),
          ),
        ],
      ),
    );
  }
}
