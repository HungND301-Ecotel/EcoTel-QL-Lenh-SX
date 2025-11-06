// Danh sách chuyến của máy xúc
import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:intl/intl.dart';
import 'package:soft/local/quantity_update_hive.dart';
import 'package:soft/local/report_hive.dart';
import 'package:soft/providers/report_provider.dart';
import 'package:soft/screens/work_log/routes/routes.dart';
import 'package:soft/screens/work_log/widgets/SyncLoadingDialog/sync_loading_dialog.dart';
import 'package:soft/services/report_service.dart';
import 'package:provider/provider.dart';
import 'package:soft/widgets/custom_snackbar.dart';

class VehicleTripList extends StatefulWidget {
  final String orderId;
  const VehicleTripList({super.key, required this.orderId});

  @override
  State<StatefulWidget> createState() => _VehicleTripList();
}

class _VehicleTripList extends State<VehicleTripList> {
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

  final ReportService _reportService = ReportService();
  List<ReportHive> _allData = [];

  bool get hasUnsyncedReports =>
      _allData.any((r) => r.isSynced == false);

  void getReportByOrder() async {
    final box = Hive.box<ReportHive>("reports");
    final reports = box.values.toList();
    final tripList = reports
        .where((r) => r.orderId == widget.orderId)
        .toList();
    if (tripList.isEmpty) {
      final result =
          await _reportService.getByOrder(widget.orderId);
      if (result['status'] == 'success') {
        final List data = result['data'] ?? [];
        for (var reportJson in data) {
          final report = ReportHive.fromJson(reportJson);

          // 🧠 Gán localKey theo logic "Xe vận tải"
          report.localKey =
              "${report.orderId}_${report.device?.id}_${report.material?.id}_${report.excavator?.id}_${report.toLocation?.id}";

          await box.put(report.localKey!, report);
          debugPrint("Đồng bộ báo chuyến về local");
        }
        final updatedReports = box.values
            .where((r) => r.orderId == widget.orderId)
            .toList();

        setState(() {
          _allData = updatedReports;
        });
      }
    } else {
      setState(() {
        _allData = tripList;
      });
    }
  }

  num _selectedQuantity = 1.0;

  void addTripTime(int index, num selectedQuantity) async {
    final box = Hive.box<ReportHive>("reports");
    final report = _allData[index];

    final List<QuantityUpdateHive> updates =
        List.from(report.quantityUpdateTimes ?? []);
    updates.add(QuantityUpdateHive(
      time: DateTime.now(),
      quantity: selectedQuantity.toDouble(),
    ));

    final totalQty =
        updates.fold<num>(0, (sum, e) => sum + e.quantity);

    final updated = report.copyWith(
        quantityUpdateTimes: updates,
        quantity: ((totalQty * 10).roundToDouble() / 10),
        isSynced: false);

    await box.put(report.localKey, updated);
    setState(() => _allData[index] = updated);
  }

  void removeTripTime(int index, int timeIndex) async {
    final box = Hive.box<ReportHive>("reports");
    final report = _allData[index];

    final List<QuantityUpdateHive> updates =
        List.from(report.quantityUpdateTimes ?? []);
    if (timeIndex < 0 || timeIndex >= updates.length) {
      return;
    }

    updates.removeAt(timeIndex);

    final totalQty = updates.fold<num>(
        0, (sum, e) => sum + e.quantity.toDouble());

    final updated = report.copyWith(
        quantityUpdateTimes: updates,
        quantity: ((totalQty * 10).roundToDouble() / 10),
        isSynced: false);

    await box.put(report.localKey, updated);
    setState(() => _allData[index] = updated);
  }

  Future<void> _syncReports() async {
    final box = Hive.box<ReportHive>("reports");
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
            message: "Đang báo chuyến...");
      },
    );

    for (var report in _allData) {
      try {
        Map<String, dynamic> payload = {
          "device": report.device?.id,
          "orderId": report.orderId,
          "material": report.material?.id,
          "excavator": report.excavator?.id,
          "toLocation": report.toLocation?.id,
          "quantity": report.quantity,
          "quantityUpdateTimes": report.quantityUpdateTimes,
        };

        if (report.id == null || report.id!.isEmpty) {
          // 🟢 POST mới
          final res =
              await _reportService.createReport(payload);

          if (res['status'] == 'success') {
            report.id = res['data']['_id'];
            report.isSynced = true;
            await box.put(report.localKey, report);
            successCount++;
          } else {
            failCount++;
            debugPrint(
                '❌ Tạo report thất bại: ${res['message'] ?? 'Không rõ lỗi'}');
          }
        } else {
          // 🟠 PUT update
          final res = await _reportService.updateReport(
              report.id!, payload);
          if (res['status'] == 'success') {
            report.isSynced = true;
            await box.put(report.localKey, report);
            successCount++;
          } else {
            failCount++;
            debugPrint(
                '❌ Cập nhật report thất bại: ${res['message'] ?? 'Không rõ lỗi'}');
          }
        }
      } catch (e, stack) {
        failCount++;
        debugPrint(
            '⚠️ Lỗi khi đồng bộ report ${report.localKey}: $e');
        debugPrint(stack.toString());
      }
    }

    // 🔄 Làm mới dữ liệu hiển thị
    final updatedReports = box.values
        .where((r) => r.orderId == widget.orderId)
        .toList();

    setState(() {
      _allData = updatedReports;
    });

    // 🧾 Thông báo kết quả
    String message;
    if (failCount == 0) {
      message =
          '✅ Đồng bộ $successCount bản ghi thành công!';
    } else {
      message =
          '⚠️ Đồng bộ hoàn tất: $successCount thành công, $failCount thất bại.';
    }
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
          'Báo chuyến cho ô tô',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        iconTheme: IconThemeData(color: Colors.white),
        centerTitle: true,
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
        actions: [
          IconButton(
            onPressed: () {
              Navigator.pushNamed(
                context,
                WorkLogRoutes.vehicleSelectVehicle,
              );
            },
            icon: Icon(Icons.add, color: Colors.white),
          ),
        ],
      ),
      body: Column(
        children: [
          // HEADER
          Container(
            color: Colors.grey[300],
            padding: const EdgeInsets.symmetric(
              vertical: 8,
              horizontal: 16,
            ),
            child: Row(
              children: [
                Expanded(
                  flex: 2,
                  child: Text(
                    "Phương tiện",
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
                SizedBox(width: 6),
                Expanded(
                  flex: 2,
                  child: Text(
                    "Máy xúc",
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
                SizedBox(width: 6),
                Expanded(
                  flex: 2,
                  child: Text(
                    "Điểm đổ",
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
                SizedBox(width: 6),
                Expanded(
                  flex: 2,
                  child: Text(
                    "Vật liệu",
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
                SizedBox(width: 6),
                Expanded(
                  flex: 2,
                  child: Text(
                    "Số chuyến",
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                "Hệ số chuyến: ",
                style:
                    TextStyle(fontWeight: FontWeight.bold),
              ),
              Row(
                children: [
                  Radio<num>(
                    value: 1.0,
                    groupValue: _selectedQuantity,
                    onChanged: (v) => setState(
                        () => _selectedQuantity = v ?? 1.0),
                  ),
                  const Text("1"),
                  Radio<num>(
                    value: 0.66,
                    groupValue: _selectedQuantity,
                    onChanged: (v) => setState(
                        () => _selectedQuantity = v ?? 1.0),
                  ),
                  const Text("2/3"),
                  Radio<num>(
                    value: 0.33,
                    groupValue: _selectedQuantity,
                    onChanged: (v) => setState(
                        () => _selectedQuantity = v ?? 1.0),
                  ),
                  const Text("1/3"),
                ],
              ),
            ],
          ),
          // DANH SÁCH
          Expanded(
            child: ListView.builder(
              itemCount: _allData.length,
              itemBuilder: (context, index) {
                final item = _allData[index];
                final times =
                    item.quantityUpdateTimes ?? [];

                return Card(
                  child: ExpansionTile(
                    trailing: SizedBox.shrink(),
                    showTrailingIcon: false,
                    tilePadding: EdgeInsets
                        .zero, // Xoá padding trái/phải
                    childrenPadding: EdgeInsets.zero,
                    title: Row(
                      children: [
                        Expanded(
                          flex: 2,
                          child: Text(
                            item.device?.code ?? "",
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        SizedBox(width: 4),
                        Expanded(
                          flex: 2,
                          child: Text(
                            item.excavator?.code ?? "",
                            style: const TextStyle(
                              fontSize: 12,
                            ),
                          ),
                        ),
                        SizedBox(width: 4),
                        Expanded(
                          flex: 2,
                          child: Text(
                            item.toLocation?.name ?? "",
                            style: const TextStyle(
                              fontSize: 12,
                            ),
                          ),
                        ),
                        SizedBox(width: 4),
                        Expanded(
                          flex: 2,
                          child: Text(
                            item.material?.name ?? "",
                            style: const TextStyle(
                              fontSize: 12,
                            ),
                          ),
                        ),
                        SizedBox(width: 6),
                        Expanded(
                          flex: 2,
                          child: Row(
                            children: [
                              Text(
                                "${item.quantity}",
                                style: const TextStyle(
                                  fontWeight:
                                      FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                              IconButton(
                                icon: const Icon(
                                  Icons.add,
                                  color: Colors.green,
                                ),
                                onPressed: () =>
                                    addTripTime(index,
                                        _selectedQuantity),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    children: [
                      ...times.asMap().entries.map((entry) {
                        final timeIndex = entry.key;
                        final q = entry.value;
                        return ListTile(
                          dense: true,
                          title: Text(
                            "${DateFormat('dd/MM/yyyy HH:mm:ss').format(q.time)}  -  ${q.quantity}",
                          ),
                          trailing: IconButton(
                            icon: const Icon(
                              Icons.close,
                              color: Colors.red,
                            ),
                            onPressed: () => removeTripTime(
                              index,
                              timeIndex,
                            ),
                          ),
                        );
                      }),
                    ],
                  ),
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
                      ? 'Báo chuyến'
                      : 'Đã báo chuyến',
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
