import 'package:flutter/material.dart';
import 'package:soft/models/report_model.dart';
import 'package:soft/services/report_service.dart';

class ExcavatorTripItem extends StatefulWidget {
  final ReportModel data;
  final Function() getReportByOrder;

  const ExcavatorTripItem({
    super.key,
    required this.data,
    required this.getReportByOrder,
  });

  @override
  State<ExcavatorTripItem> createState() =>
      _ExcavatorTripItemState();
}

class _ExcavatorTripItemState
    extends State<ExcavatorTripItem> {
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
          bottom: BorderSide(
            color: Colors.grey.shade200,
            width: 1,
          ),
        ),
      ),
      child: TextButton(
        onPressed: () {},
        style: TextButton.styleFrom(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.zero,
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 60,
              child: Icon(
                Icons.cable_outlined,
                size: 25,
                color: Colors.blue,
              ),
            ),
            Expanded(
              child: Column(
                crossAxisAlignment:
                    CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.data.excavator?.code ?? '',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.black,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 6),
                  Text(
                    widget.data.material?.name ?? '',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.black,
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(
              width: 40,
              child: Text(
                widget.data.quantity.toString(),
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.black,
                ),
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
                              foregroundColor: Colors.blue,
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
    );
  }
}
