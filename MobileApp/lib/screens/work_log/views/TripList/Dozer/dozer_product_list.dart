import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:soft/local/report_hive.dart';
import 'package:soft/providers/report_provider.dart';
import 'package:soft/screens/work_log/routes/routes.dart';
import 'package:soft/screens/work_log/widgets/SyncLoadingDialog/sync_loading_dialog.dart';
import 'package:soft/screens/work_log/widgets/performance_item.dart';
import 'package:soft/services/report_service.dart';
import 'package:provider/provider.dart';
import 'package:soft/widgets/custom_snackbar.dart';

class DozerProductList extends StatefulWidget {
  final String orderId;
  const DozerProductList({
    super.key,
    required this.orderId,
  });

  @override
  State<StatefulWidget> createState() =>
      _DozerProductList();
}

class _DozerProductList extends State<DozerProductList> {
  @override
  void initState() {
    super.initState();
    getReportByOrder();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = Provider.of<ReportDraftProvider>(
        context,
        listen: false,
      );
      provider.setOrderId(widget.orderId);
    });
  }

  bool _isLoading = true;
  final ReportService _reportService = ReportService();
  List<ReportHive> _allData = [];
  List<ReportHive> _listReport = [];

  bool get hasUnsyncedReports =>
      _allData.any((r) => r.isSynced == false);

  /// 🔄 Lấy dữ liệu từ Hive (nếu chưa có thì gọi server)
  Future<void> getReportByOrder() async {
    final box = Hive.box<ReportHive>("reports");
    final allReports = box.values
        .where((r) => r.orderId == widget.orderId)
        .toList();

    if (allReports.isEmpty) {
      // 🛰️ Nếu chưa có local -> gọi API
      final result =
          await _reportService.getByOrder(widget.orderId);
      if (result['status'] == 'success') {
        final List data = result['data'] ?? [];
        for (var reportJson in data) {
          final report = ReportHive.fromJson(reportJson);
          report.localKey =
              "DOZER_${report.orderId}_${report.device?.id}_${report.material?.id}_${report.workingMinutes}";
          report.isDeleted = false;
          await box.put(report.localKey!, report);
        }
      }
    }

    // 🧱 Cập nhật 2 list riêng biệt
    final updated = box.values
        .where((r) => r.orderId == widget.orderId)
        .toList();

    setState(() {
      _allData = updated;
      _listReport = updated
          .where((r) => r.isDeleted == false)
          .toList();
      _isLoading = false;
    });
  }

  /// ☁️ Đồng bộ Hive ↔ Server (create/update/delete)
  Future<void> _syncReports() async {
    final box = Hive.box<ReportHive>("reports");
    final reports = _allData; // sử dụng full list để sync
    int successCount = 0;
    int failCount = 0;

    BuildContext dialogCtx = context;

    if (!mounted) return;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        dialogCtx = ctx;
        return const SyncLoadingDialog(
            message: "Đang báo sản lượng...");
      },
    );

    for (var report in reports) {
      try {
        // 1️⃣ Nếu bị xóa local
        if (report.isDeleted == true) {
          if (report.id != null && report.id!.isNotEmpty) {
            final res =
                await _reportService.delete(report.id!);
            if (res['status'] == 'success') {
              await box.delete(report.localKey);
              successCount++;
              debugPrint(
                  '🗑 Đã xóa ${report.localKey} trên server');
            } else {
              failCount++;
            }
          } else {
            await box.delete(report.localKey);
            successCount++;
          }
          continue;
        }

        // 2️⃣ Nếu chưa sync (mới tạo local)
        final payload = {
          "device": report.device?.id,
          "orderId": report.orderId,
          "material": report.material?.id,
          "workingMinutes": report.workingMinutes,
        };

        if (report.id == null || report.id!.isEmpty) {
          final res =
              await _reportService.createReport(payload);
          if (res['status'] == 'success') {
            report.id = res['data']['_id'];
            report.isSynced = true;
            await box.put(report.localKey, report);
            successCount++;
          } else {
            failCount++;
          }
        } else {
          // 3️⃣ Update bản đã có id
          final res = await _reportService.updateReport(
              report.id!, payload);
          if (res['status'] == 'success') {
            report.isSynced = true;
            await box.put(report.localKey, report);
            successCount++;
          } else {
            failCount++;
          }
        }
      } catch (e, stack) {
        failCount++;
        debugPrint("⚠️ Lỗi sync ${report.localKey}: $e");
        debugPrint(stack.toString());
      }
    }

    // 🔄 Làm mới lại 2 danh sách
    final updated = box.values
        .where((r) => r.orderId == widget.orderId)
        .toList();

    setState(() {
      _allData = updated;
      _listReport = updated
          .where((r) => r.isDeleted == false)
          .toList();
    });

    if (!mounted) return;
    if (Navigator.canPop(dialogCtx)) {
      Navigator.pop(dialogCtx);
    }

    if (failCount == 0) {
      showCustomSnackBar(
        context,
        message:
            'Đồng bộ $successCount bản ghi thành công!',
        type: SnackType.success,
      );
    } else if (successCount > 0) {
      showCustomSnackBar(
        context,
        message:
            'Đồng bộ một phần: $successCount thành công, $failCount thất bại.',
        type: SnackType.warning,
      );
    } else {
      showCustomSnackBar(
        context,
        message:
            'Không thể đồng bộ! Kiểm tra kết nối mạng hoặc thử lại sau.',
        type: SnackType.error,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        title: Text(
          'Báo sản lượng',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        iconTheme: IconThemeData(color: Colors.white),
        automaticallyImplyLeading: false,
        leading: IconButton(
          onPressed: () {
            Navigator.pushNamed(
              context,
              WorkLogRoutes.taskDetailPage,
              arguments: widget.orderId,
            );
          },
          icon: Icon(Icons.arrow_back, color: Colors.white),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            onPressed: () {
              Navigator.pushNamed(
                context,
                WorkLogRoutes.dozerSelectVehicle,
              );
            },
            icon: Icon(Icons.add, color: Colors.white),
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Expanded(
                  child: ListView.builder(
                    padding:
                        const EdgeInsets.only(bottom: 80),
                    itemCount: _listReport.length,
                    itemBuilder: (context, index) {
                      final item = _listReport[index];
                      return PerformanceItem(
                        data: item,
                        getReportByOrder: getReportByOrder,
                      );
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.sync),
                      label: Text(
                        hasUnsyncedReports
                            ? 'Báo sản lượng'
                            : 'Đã báo sản lượng',
                      ),
                      onPressed: !hasUnsyncedReports
                          ? null
                          : _syncReports,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: hasUnsyncedReports
                            ? Colors.orange
                            : Colors.grey,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                            vertical: 12),
                      ),
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}
