import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:soft/local/LocalSyncService.dart';
import 'package:soft/local/report_hive.dart';
import 'package:soft/providers/report_provider.dart';
import 'package:soft/screens/work_log/routes/routes.dart';
import 'package:soft/screens/work_log/widgets/Button/button_save.dart';
import 'package:provider/provider.dart';

class DrillingInputQuantity extends StatefulWidget {
  const DrillingInputQuantity({super.key});

  @override
  State<StatefulWidget> createState() =>
      _DrillingInputQuantity();
}

class _DrillingInputQuantity
    extends State<DrillingInputQuantity> {
  final TextEditingController _drillDepthController =
      TextEditingController();
  final TextEditingController _hardnessController =
      TextEditingController();

  final LocalSyncService _localSyncService =
      LocalSyncService();

  void create() async {
    final box = Hive.box<ReportHive>("reports");
    final provider = Provider.of<ReportDraftProvider>(
      context,
      listen: false,
    );
    final drillDepth = num.tryParse(
      _drillDepthController.text.trim(),
    );
    final hardness = num.tryParse(
      _hardnessController.text.trim(),
    );
    if (drillDepth == null || hardness == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Vui lòng nhập đầy đủ thông tin."),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }
    provider.setDrillingInfo(drillDepth, hardness);

    try {
      // 🧱 1. Tạo danh sách ReportHive để lưu local
      final ReportHive report = ReportHive(
        localKey:
            "DRILL_${provider.orderId}_${provider.device?.id}_${provider.material?.id}_${provider.drillDepth}_${provider.hardnessF}",
        orderId: provider.orderId ?? '',
        device: provider.device,
        material: provider.material,
        drillDepth: provider.drillDepth,
        hardnessF: provider.hardnessF,
      );

      // 🗃️ 2. Lưu toàn bộ vào Hive
      await _localSyncService.putIfNotExists<ReportHive>(
          box: box,
          id: report.localKey!,
          data: report,
          condition: (r) =>
              r.orderId == report.orderId &&
              r.device?.id == report.device?.id &&
              r.material?.id == report.material?.id &&
              r.drillDepth == report.drillDepth &&
              r.hardnessF == report.hardnessF);

      // ✅ 3. Reset provider (hoàn tất tạo báo cáo)
      provider.reset();

      // 🟢 4. Chuyển hướng sang màn hình danh sách chuyến
      if (!mounted) return;
      Navigator.pushNamed(
        context,
        WorkLogRoutes.drillingProductList,
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        title: Text(
          'Nhập sản lượng',
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
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(8.0),
              child: Column(
                crossAxisAlignment:
                    CrossAxisAlignment.start,
                children: [
                  Text(
                    'Nhập mét khoan sâu',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  TextField(
                    controller: _drillDepthController,
                    keyboardType: TextInputType.number,
                  ),
                  Text(
                    'Nhập độ cứng',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  TextField(
                    controller: _hardnessController,
                    keyboardType: TextInputType.number,
                  ),
                ],
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
                      canSave: true, create: create),
                )
              ],
            ),
          ),
        ],
      ),
    );
  }
}
