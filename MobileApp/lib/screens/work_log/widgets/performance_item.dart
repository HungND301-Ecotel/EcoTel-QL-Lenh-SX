import 'package:flutter/material.dart';
import 'package:hive/hive.dart';
import 'package:soft/local/report_hive.dart';

class PerformanceItem extends StatefulWidget {
  final ReportHive data;
  final Function() getReportByOrder;

  const PerformanceItem({
    super.key,
    required this.data,
    required this.getReportByOrder,
  });

  @override
  State<PerformanceItem> createState() =>
      _PerformanceItemState();
}

class _PerformanceItemState extends State<PerformanceItem> {
  void deleteLocal(ReportHive report) async {
    final box = Hive.box<ReportHive>("reports");

    // 🗑 Nếu report chưa có id (chưa sync lên server) → xóa hẳn khỏi Hive
    if (report.id == null || report.id!.isEmpty) {
      await box.delete(report.localKey);
    } else {
      // 🚫 Nếu đã có trên server → đánh dấu isDeleted để xóa khi sync
      report.isDeleted = true;
      report.isSynced = false; // Để sync lại
      await box.put(report.localKey, report);
    }

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text("Đã xóa khỏi danh sách local."),
        backgroundColor: Colors.orange,
      ),
    );

    widget.getReportByOrder(); // Làm mới danh sách
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(
            color: Colors.grey.shade300,
          ), // Viền trên
          bottom: BorderSide(
            color: Colors.grey.shade300,
          ), // Viền dưới
        ),
      ),
      child: ListTile(
        leading: Icon(
          Icons.hub_outlined,
          color: Colors.blue,
        ),
        title: Text(widget.data.material?.name ?? ''),
        trailing: SizedBox(
          width:
              100, // Ví dụ: Đặt chiều rộng cố định là 120px
          child: Row(
            children: [
              Expanded(
                child: Text(
                  widget.data.drillDepth != null
                      ? "${widget.data.drillDepth} mks"
                      : "${widget.data.workingMinutes} phút",
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              IconButton(
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (
                      BuildContext dialogContext,
                    ) =>
                        AlertDialog(
                      title: Text("Xác nhận"),
                      content: Text(
                        "Bạn muốn xóa khỏi hệ thống? Bạn sẽ không thể hoàn tác",
                      ),
                      actions: [
                        TextButton(
                          onPressed: () {
                            Navigator.of(
                              dialogContext,
                            ).pop();
                          },
                          style: TextButton.styleFrom(
                            foregroundColor: Colors.blue,
                          ),
                          child: Text("Bỏ qua"),
                        ),
                        TextButton(
                          onPressed: () {
                            Navigator.of(
                              dialogContext,
                            ).pop();
                            deleteLocal(widget.data);
                          },
                          style: TextButton.styleFrom(
                            foregroundColor: Colors.blue,
                          ),
                          child: Text("Xác nhận"),
                        ),
                      ],
                    ),
                  );
                },
                icon: Icon(
                  Icons.delete,
                  color: Colors.red,
                  size: 30,
                ),
              ),
            ],
          ),
        ),
        onTap: () {},
      ),
    );
  }
}
