import 'package:flutter/material.dart';
import 'package:soft/models/order_model.dart';
import 'package:soft/screens/work_log/routes/routes.dart';
import 'package:soft/services/shift_report_service.dart';

class IndirectWorkReport extends StatefulWidget {
  final OrderModel order;
  const IndirectWorkReport({
    super.key,
    required this.order,
  });
  @override
  State<StatefulWidget> createState() =>
      _IndirectWorkReport();
}

class _IndirectWorkReport
    extends State<IndirectWorkReport> {
  List<String> assistant = [];

  final TextEditingController _handoverNotesController =
      TextEditingController();
  final TextEditingController _risksController =
      TextEditingController();

  @override
  void initState() {
    super.initState();
    if (widget.order.shiftReport != null) {
      _handoverNotesController.text =
          widget.order.shiftReport?.handoverNotes ?? '';
      _risksController.text =
          widget.order.shiftReport?.risks ?? '';
    }
  }

  final ShiftReportService _shiftReportService =
      ShiftReportService();
  void create() async {
    final handoverNotes =
        _handoverNotesController.text.trim();
    final risks = _risksController.text.trim();

    var result = await _shiftReportService.create({
      "orderId": widget.order.id,
      "handoverNotes": handoverNotes,
      "risks": risks,
    });
    if (!mounted) return;
    if (result['status'] == 'error') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message']),
          backgroundColor: Colors.red,
        ),
      );
    } else {
      Navigator.pushNamed(
        context,
        WorkLogRoutes.taskDetailPage,
        arguments: widget.order.id,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Báo cáo công việc',
          style: TextStyle(color: Colors.white),
        ),
        iconTheme: IconThemeData(color: Colors.white),
        centerTitle: true,
        backgroundColor: Colors.blue,
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(8.0),
                child: Column(
                  crossAxisAlignment:
                      CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Tình trạng công việc',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    TextField(
                      controller: _handoverNotesController,
                      minLines: 5,
                      maxLines: null,
                      keyboardType: TextInputType.multiline,
                    ),
                    Text(
                      'Kiến nghị/Nhận diện rủi ro',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    TextField(
                      controller: _risksController,
                      minLines: 5,
                      maxLines: null,
                      keyboardType: TextInputType.multiline,
                    ),
                  ],
                ),
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
                    onPressed: create,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        vertical: 14,
                      ),
                    ),
                    child: const Text(
                      'Lưu lại',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
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
