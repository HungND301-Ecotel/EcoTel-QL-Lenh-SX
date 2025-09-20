import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:soft/models/order_model.dart';
import 'package:soft/models/user_model.dart';
import 'package:soft/screens/work_log/routes/routes.dart';
import 'package:soft/screens/work_log/views/ReportTask/MaintenceWork/controller.dart';
import 'package:soft/services/shift_report_service.dart';
import 'package:soft/widgets/pay_roll_input.dart';

class MaintenceWorkReport extends StatefulWidget {
  final OrderModel order;
  const MaintenceWorkReport({
    super.key,
    required this.order,
  });
  @override
  State<StatefulWidget> createState() =>
      _MaintenceWorkReport();
}

class _MaintenceWorkReport
    extends State<MaintenceWorkReport> {
  UserModel? user;

  final Map<String, VehicleRepairControllers>
  _devicleRepairControllers = {};

  void _updateUser(UserModel? selectedUser) {
    setState(() {
      user = selectedUser;
    });
  }

  final TextEditingController _handoverNotesController =
      TextEditingController();
  final TextEditingController _risksController =
      TextEditingController();

  @override
  void initState() {
    super.initState();
    for (var item in widget.order.repairVehicles ?? []) {
      _devicleRepairControllers[item.device.id] =
          VehicleRepairControllers();
    }

    final report = widget.order.shiftReport;
    if (report != null) {
      _handoverNotesController.text =
          report.handoverNotes ?? '';
      _risksController.text = report.risks ?? '';

      for (var item in report.vehicleRepair ?? []) {
        final controller =
            _devicleRepairControllers[item.device.id];
        if (controller != null) {
          controller.status = item.status?.toString() ?? '';
          controller.noteRepair.text =
              item.noteRepair?.toString() ?? '';
        }
      }
    }
  }

  final ShiftReportService _shiftReportService =
      ShiftReportService();
  void create() async {
    final List<Map<String, dynamic>> vehicleRepairs = [];

    for (var entry in _devicleRepairControllers.entries) {
      final id = entry.key;
      final controller = entry.value;

      vehicleRepairs.add({
        "device": id,
        "status": controller.status,
        "noteRepair": controller.noteRepair.text,
      });
    }
    final handoverNotes =
        _handoverNotesController.text.trim();
    final risks = _risksController.text.trim();

    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Vui lòng nhập thẻ lương."),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }
    var result = await _shiftReportService.create({
      "orderId": widget.order.id,
      "assignedTo": user?.id,
      'vehicleRepair': vehicleRepairs,
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

  void update(String shiftReportId) async {
    final List<Map<String, dynamic>> vehicleRepairs = [];

    for (var entry in _devicleRepairControllers.entries) {
      final id = entry.key;
      final controller = entry.value;

      vehicleRepairs.add({
        "device": id,
        "status": controller.status,
        "noteRepair": controller.noteRepair.text,
      });
    }

    final handoverNotes =
        _handoverNotesController.text.trim();
    final risks = _risksController.text.trim();

    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Vui lòng nhập thẻ lương."),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }
    var result = await _shiftReportService
        .update(shiftReportId, {
          "orderId": widget.order.id,
          "assignedTo": user?.id,
          "vehicleRepair": vehicleRepairs,
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
                    PayRollInput(
                      title: 'Số thẻ lương',
                      onSelectUser:
                          (user) => _updateUser(user),
                      initialPayroll:
                          widget
                              .order
                              .assignedTo
                              .salaryCode,
                    ),
                    Column(
                      crossAxisAlignment:
                          CrossAxisAlignment.start,
                      children:
                          ((widget.order.repairVehicles) ?? []).map((
                            item,
                          ) {
                            final repairController =
                                _devicleRepairControllers[item
                                    .device
                                    ?.id]!;
                            return Column(
                              crossAxisAlignment:
                                  CrossAxisAlignment.start,
                              children: [
                                SizedBox(height: 16),
                                Text(
                                  "+ Thiết bị: ${item.device?.code}",
                                  style: TextStyle(
                                    fontWeight:
                                        FontWeight.bold,
                                  ),
                                ),
                                SizedBox(height: 16),
                                Text(
                                  'Trạng thái sửa chữa',
                                  style: TextStyle(
                                    fontWeight:
                                        FontWeight.w600,
                                  ),
                                ),
                                DropdownButtonFormField<
                                  String
                                >(
                                  value:
                                      repairController
                                          .status,
                                  decoration:
                                      const InputDecoration(
                                        border:
                                            OutlineInputBorder(),
                                      ),
                                  items: [
                                    DropdownMenuItem(
                                      value: 'Đã sửa xong',
                                      child: Text(
                                        'Đã sửa xong',
                                      ),
                                    ),
                                    DropdownMenuItem(
                                      value:
                                          'Chưa sửa xong',
                                      child: Text(
                                        'Chưa sửa xong',
                                      ),
                                    ),
                                  ],
                                  onChanged: (value) {
                                    setState(() {
                                      repairController
                                          .status = value ??
                                          'Đã sửa xong';
                                    });
                                  },
                                ),
                                if (repairController
                                        .status ==
                                    "Chưa sửa xong")
                                  Text(
                                    'Tình trạng thiết bị *',
                                    style: TextStyle(
                                      fontWeight:
                                          FontWeight.w600,
                                    ),
                                  ),
                                if (repairController
                                        .status ==
                                    "Chưa sửa xong")
                                  TextField(
                                    controller:
                                        repairController
                                            .noteRepair,
                                    minLines: 3,
                                    maxLines: null,
                                  ),
                              ],
                            );
                          }).toList(),
                    ),
                    SizedBox(height: 16),
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
                    onPressed: () {
                      if (widget.order.shiftReport !=
                          null) {
                        update(
                          widget.order.shiftReport!.id,
                        );
                      } else {
                        create();
                      }
                    },
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
