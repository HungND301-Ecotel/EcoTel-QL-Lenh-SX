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
  final Map<String, VehicleSummariesControllers>
      _deviceSummaryControllers = {};

  void _updateUser(UserModel? selectedUser) {
    setState(() {
      user = selectedUser;
    });
  }

  final TextEditingController _handoverNotesController =
      TextEditingController();
  final TextEditingController _risksController =
      TextEditingController();

  void _calculateFuelUsedFor(String id) {
    final controller = _deviceSummaryControllers[id];
    if (controller == null) return;

    final int remain =
        int.tryParse(controller.fuelRemain.text) ?? 0;
    final int received =
        int.tryParse(controller.fuelReceived.text) ?? 0;
    final int remainEnd =
        int.tryParse(controller.fuelRemainEnd.text) ?? 0;

    final int used = remain + received - remainEnd;

    controller.fuelUsedController.text = used.toString();
  }

  @override
  void initState() {
    super.initState();
    for (var device in widget.order.device ?? []) {
      _deviceSummaryControllers[device.id] =
          VehicleSummariesControllers();
    }

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
      for (var item in report.vehicleSummaries ?? []) {
        final controller =
            _deviceSummaryControllers[item.vehicle.id];
        if (controller != null) {
          controller.fuelRemain.text =
              item.fuelRemain?.toString() ?? '';
          controller.fuelReceived.text =
              item.fuelReceived?.toString() ?? '';
          controller.fuelRemainEnd.text =
              item.fuelRemainEnd?.toString() ?? '';
          controller.status = item.status?.toString() ?? '';
          controller.note.text =
              item.note?.toString() ?? '';
          controller.gpsStatus =
              item.gpsStatus?.toString() ?? '';
          controller.sealStatus =
              item.sealStatus?.toString() ?? '';
          _calculateFuelUsedFor(item.vehicle.id);
        }
      }
    }
  }

  final ShiftReportService _shiftReportService =
      ShiftReportService();
  void create() async {
    final List<Map<String, dynamic>> vehicleRepairs = [];
    final List<Map<String, dynamic>> vehicleSummaries = [];

    for (var entry in _devicleRepairControllers.entries) {
      final id = entry.key;
      final controller = entry.value;

      vehicleRepairs.add({
        "device": id,
        "status": controller.status,
        "noteRepair": controller.noteRepair.text,
      });
    }

    for (var entry in _deviceSummaryControllers.entries) {
      final id = entry.key;
      final controller = entry.value;

      vehicleSummaries.add({
        "vehicle": id,
        "fuelRemain": int.tryParse(
          controller.fuelRemain.text,
        ),
        "fuelReceived": int.tryParse(
          controller.fuelReceived.text,
        ),
        "fuelRemainEnd": int.tryParse(
          controller.fuelRemainEnd.text,
        ),
        "status": controller.status,
        "note": controller.note.text,
        "gpsStatus": controller.gpsStatus,
        "sealStatus": controller.sealStatus,
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
      "vehicleSummaries": vehicleSummaries,
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
    final List<Map<String, dynamic>> vehicleSummaries = [];

    for (var entry in _devicleRepairControllers.entries) {
      final id = entry.key;
      final controller = entry.value;

      vehicleRepairs.add({
        "device": id,
        "status": controller.status,
        "noteRepair": controller.noteRepair.text,
      });
    }
    for (var entry in _deviceSummaryControllers.entries) {
      final id = entry.key;
      final controller = entry.value;

      vehicleSummaries.add({
        "vehicle": id,
        "fuelRemain": int.tryParse(
          controller.fuelRemain.text,
        ),
        "fuelReceived": int.tryParse(
          controller.fuelReceived.text,
        ),
        "fuelRemainEnd": int.tryParse(
          controller.fuelRemainEnd.text,
        ),
        "status": controller.status,
        "note": controller.note.text,
        "gpsStatus": controller.gpsStatus,
        "sealStatus": controller.sealStatus,
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
    var result =
        await _shiftReportService.update(shiftReportId, {
      "orderId": widget.order.id,
      "assignedTo": user?.id,
      "vehicleSummaries": vehicleSummaries,
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
                      onSelectUser: (user) =>
                          _updateUser(user),
                      initialPayroll: widget
                          .order.assignedTo.salaryCode,
                    ),
                    Column(
                      crossAxisAlignment:
                          CrossAxisAlignment.start,
                      children:
                          ((widget.order.device) ?? [])
                              .map((
                        item,
                      ) {
                        final summaryController =
                            _deviceSummaryControllers[
                                item.id]!;
                        return Column(
                          crossAxisAlignment:
                              CrossAxisAlignment.start,
                          children: [
                            SizedBox(height: 16),
                            Text(
                              "+ Thiết bị vận hành: ${item.code}",
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            SizedBox(height: 8),
                            Text(
                              'Nhiên liệu',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            SizedBox(height: 8),
                            Text(
                              'Tồn dầu',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            TextField(
                              controller: summaryController
                                  .fuelRemain,
                              onChanged: (_) =>
                                  _calculateFuelUsedFor(
                                item.id,
                              ),
                              keyboardType:
                                  TextInputType.number,
                              inputFormatters: [
                                FilteringTextInputFormatter
                                    .digitsOnly,
                              ],
                            ),
                            Text(
                              'Lĩnh trong ca',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            TextField(
                              controller: summaryController
                                  .fuelReceived,
                              onChanged: (_) =>
                                  _calculateFuelUsedFor(
                                item.id,
                              ),
                              keyboardType:
                                  TextInputType.number,
                              inputFormatters: [
                                FilteringTextInputFormatter
                                    .digitsOnly,
                              ],
                            ),
                            Text(
                              'Tồn cuối ca',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            TextField(
                              controller: summaryController
                                  .fuelRemainEnd,
                              onChanged: (_) =>
                                  _calculateFuelUsedFor(
                                item.id,
                              ),
                              keyboardType:
                                  TextInputType.number,
                              inputFormatters: [
                                FilteringTextInputFormatter
                                    .digitsOnly,
                              ],
                            ),
                            Text(
                              'Tiêu thụ',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            TextField(
                              controller: summaryController
                                  .fuelUsedController,
                              readOnly: true,
                            ),
                            Text(
                              'Tình trạng phương tiện',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            DropdownButtonFormField<String>(
                              value:
                                  summaryController.status,
                              decoration:
                                  const InputDecoration(
                                border:
                                    OutlineInputBorder(),
                              ),
                              items: [
                                DropdownMenuItem(
                                  value: 'good',
                                  child: Text('Tốt'),
                                ),
                                DropdownMenuItem(
                                  value: 'fail',
                                  child: Text('Hỏng'),
                                ),
                              ],
                              onChanged: (value) {
                                setState(() {
                                  summaryController.status =
                                      value ?? 'good';
                                });
                              },
                            ),
                            if (summaryController.status ==
                                "fail")
                              Text(
                                'Lí do hỏng *',
                                style: TextStyle(
                                  fontWeight:
                                      FontWeight.w600,
                                ),
                              ),
                            if (summaryController.status ==
                                "fail")
                              TextField(
                                controller:
                                    summaryController.note,
                                minLines: 3,
                                maxLines: null,
                              ),
                            Text(
                              'GPS',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            DropdownButtonFormField<String>(
                              value: summaryController
                                  .gpsStatus,
                              decoration:
                                  const InputDecoration(
                                border:
                                    OutlineInputBorder(),
                              ),
                              items: [
                                DropdownMenuItem(
                                  value:
                                      'Hoạt động bình thường',
                                  child: Text(
                                    'Hoạt động bình thường',
                                  ),
                                ),
                                DropdownMenuItem(
                                  value: 'Mất tín hiệu',
                                  child: Text(
                                    'Mất tín hiệu',
                                  ),
                                ),
                              ],
                              onChanged: (value) {
                                setState(() {
                                  summaryController
                                          .gpsStatus =
                                      value ??
                                          'Hoạt động bình thường';
                                });
                              },
                            ),
                            Text(
                              'Kẹp chì/ Niêm phong',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            DropdownButtonFormField<String>(
                              value: summaryController
                                  .sealStatus,
                              decoration:
                                  const InputDecoration(
                                border:
                                    OutlineInputBorder(),
                              ),
                              items: [
                                DropdownMenuItem(
                                  value: 'Tốt',
                                  child: Text('Tốt'),
                                ),
                                DropdownMenuItem(
                                  value: 'Hỏng',
                                  child: Text('Hỏng'),
                                ),
                              ],
                              onChanged: (value) {
                                setState(() {
                                  summaryController
                                          .sealStatus =
                                      value ?? 'Tốt';
                                });
                              },
                            ),
                          ],
                        );
                      }).toList(),
                    ),
                    Column(
                      crossAxisAlignment:
                          CrossAxisAlignment.start,
                      children:
                          ((widget.order.repairVehicles) ??
                                  [])
                              .map((
                        item,
                      ) {
                        final repairController =
                            _devicleRepairControllers[
                                item.device?.id]!;
                        return Column(
                          crossAxisAlignment:
                              CrossAxisAlignment.start,
                          children: [
                            SizedBox(height: 16),
                            Text(
                              "+ Thiết bị sửa chữa: ${item.device?.code}",
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            SizedBox(height: 16),
                            Text(
                              'Trạng thái sửa chữa',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            DropdownButtonFormField<String>(
                              value:
                                  repairController.status,
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
                                  value: 'Chưa sửa xong',
                                  child: Text(
                                    'Chưa sửa xong',
                                  ),
                                ),
                              ],
                              onChanged: (value) {
                                setState(() {
                                  repairController.status =
                                      value ??
                                          'Đã sửa xong';
                                  repairController
                                      .noteRepair.text = "";
                                });
                              },
                            ),
                            if (repairController.status ==
                                "Chưa sửa xong")
                              Text(
                                'Tình trạng sửa chữa thiết bị *',
                                style: TextStyle(
                                  fontWeight:
                                      FontWeight.w600,
                                ),
                              ),
                            if (repairController.status ==
                                "Chưa sửa xong")
                              TextField(
                                controller: repairController
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
