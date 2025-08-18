import 'package:flutter/material.dart';
import 'package:soft/models/report_model.dart';
import 'package:soft/services/report_service.dart';

class PerformanceItem extends StatefulWidget {
  final ReportModel data;
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
  final ReportService _reportService = ReportService();
  void delete(String id) async {
    var result = await _reportService.delete(id);
    if (!mounted) return;
    if (result['status'] == 'error') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message']),
          backgroundColor: Colors.red,
        ),
      );
    } else {
      widget.getReportByOrder();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message']),
          backgroundColor: Colors.green,
        ),
      );
    }
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
                    builder:
                        (
                          BuildContext dialogContext,
                        ) => AlertDialog(
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
                                foregroundColor:
                                    Colors.blue,
                              ),
                              child: Text("Bỏ qua"),
                            ),
                            TextButton(
                              onPressed: () {
                                Navigator.of(
                                  dialogContext,
                                ).pop();
                                delete(widget.data.id);
                              },
                              style: TextButton.styleFrom(
                                foregroundColor:
                                    Colors.blue,
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
