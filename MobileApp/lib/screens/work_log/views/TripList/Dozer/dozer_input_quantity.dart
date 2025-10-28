import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hive/hive.dart';
import 'package:soft/local/LocalSyncService.dart';
import 'package:soft/local/report_hive.dart';
import 'package:soft/providers/report_provider.dart';
import 'package:soft/screens/work_log/routes/routes.dart';
import 'package:soft/screens/work_log/widgets/Button/button_save.dart';
import 'package:provider/provider.dart';

class DozerInputQuantity extends StatefulWidget {
  const DozerInputQuantity({super.key});

  @override
  State<StatefulWidget> createState() =>
      _DozerInputQuantity();
}

class _DozerInputQuantity
    extends State<DozerInputQuantity> {
  final TextEditingController _minuteController =
      TextEditingController();

  final LocalSyncService _localSyncService =
      LocalSyncService();

  void create() async {
    final box = Hive.box<ReportHive>("reports");
    final provider = Provider.of<ReportDraftProvider>(
      context,
      listen: false,
    );
    final minute = int.tryParse(
      _minuteController.text.trim(),
    );

    if (minute == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Vui lòng nhập thời gian."),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }
    provider.setDozerInfo(minute);

    try {
      // 🧱 1. Tạo danh sách ReportHive để lưu local
      final ReportHive report = ReportHive(
        localKey:
            "DOZER_${provider.orderId}_${provider.device?.id}_${provider.material?.id}_${provider.workingMinutes}",
        orderId: provider.orderId ?? '',
        device: provider.device,
        material: provider.material,
        workingMinutes: provider.workingMinutes,
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
              r.workingMinutes == report.workingMinutes);

      // ✅ 3. Reset provider (hoàn tất tạo báo cáo)
      provider.reset();

      // 🟢 4. Chuyển hướng sang màn hình danh sách chuyến
      if (!mounted) return;
      Navigator.pushNamed(
        context,
        WorkLogRoutes.dozerProductList,
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
                    'Giờ sản phẩm (phút)',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  TextField(
                    controller: _minuteController,
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter
                          .digitsOnly,
                    ],
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
