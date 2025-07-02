import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:soft/models/order_model.dart';
import 'package:soft/models/user_model.dart';
import 'package:soft/screens/work_log/routes/routes.dart';
import 'package:soft/services/shift_report_service.dart';
import 'package:soft/widgets/pay_roll_input.dart';
import 'package:soft/screens/work_log/views/ReportTask/DirectWork/controller.dart';

class DirectWorkMultiExcavatorReport
    extends StatefulWidget {
  final OrderModel order;
  const DirectWorkMultiExcavatorReport({
    super.key,
    required this.order,
  });
  @override
  State<StatefulWidget> createState() =>
      _DirectWorkMultiExcavatorReport();
}

class _DirectWorkMultiExcavatorReport
    extends State<DirectWorkMultiExcavatorReport> {
  UserModel? user;
  final Map<String, VehicleReportControllers>
  _vehicleControllers = {};
  final Map<String, VehicleSummariesControllers>
  _deviceSummaryControllers = {};

  void _updateUser(UserModel? selectedUser) {
    setState(() {
      user = selectedUser;
    });
  }

  final TextEditingController _handoverHoursController =
      TextEditingController();
  final TextEditingController _otherHoursController =
      TextEditingController();
  final TextEditingController _handoverNotesController =
      TextEditingController();
  final TextEditingController _risksController =
      TextEditingController();

  void _calculateFuelUsed() {
    final summaryController =
        _deviceSummaryControllers[widget
                .order
                .device
                ?.last
                .id ??
            ''];
    if (summaryController == null) return;

    final int remain =
        int.tryParse(summaryController.fuelRemain.text) ??
        0;
    final int received =
        int.tryParse(summaryController.fuelReceived.text) ??
        0;
    final int remainEnd =
        int.tryParse(
          summaryController.fuelRemainEnd.text,
        ) ??
        0;

    final int used = remain + received - remainEnd;

    summaryController.fuelUsedController.text =
        used.toString();
  }

  @override
  void initState() {
    super.initState();
    for (var excavator in widget.order.excavator ?? []) {
      _vehicleControllers[excavator.id] =
          VehicleReportControllers();
    }

    final lastDeviceId = widget.order.device?.last.id;
    if (lastDeviceId != null) {
      _deviceSummaryControllers[lastDeviceId] =
          VehicleSummariesControllers();
    }

    final report = widget.order.shiftReport;
    if (report != null) {
      _handoverHoursController.text =
          report.handoverHours?.toString() ?? '';
      _otherHoursController.text =
          report.otherHours?.toString() ?? '';
      _handoverNotesController.text =
          report.handoverNotes ?? '';
      _risksController.text = report.risks ?? '';

      for (var item in report.vehicleReports ?? []) {
        final controller =
            _vehicleControllers[item.excavator.id];
        if (controller != null) {
          controller.dumpingLocation.text =
              item.dumpingLocation?.toString() ?? '';
          controller.materialType.text =
              item.materialType?.toString() ?? '';
          controller.tripCount.text =
              item.tripCount?.toString() ?? '';
        }
      }
      for (var item in report.vehicleSummaries ?? []) {
        final controller =
            _deviceSummaryControllers[item.vehicle.id];
        if (controller != null) {
          controller.travelHours.text =
              item.travelHours?.toString() ?? '';
          controller.repairHours.text =
              item.repairHours?.toString() ?? '';
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
          _calculateFuelUsed();
        }
      }
    }
  }

  final ShiftReportService _shiftReportService =
      ShiftReportService();
  void create() async {
    final List<Map<String, dynamic>> vehiclesReport = [];
    final List<Map<String, dynamic>> vehicleSummaries = [];

    for (var entry in _vehicleControllers.entries) {
      final id = entry.key;
      final controller = entry.value;

      vehiclesReport.add({
        "vehicle": widget.order.device!.last.id,
        "excavator": id,
        "dumpingLocation": widget.order.location?.id,
        "materialType": widget.order.material?.id,
        "tripCount": int.tryParse(
          controller.tripCount.text,
        ),
      });
    }

    for (var entry in _deviceSummaryControllers.entries) {
      final id = entry.key;
      final controller = entry.value;

      vehicleSummaries.add({
        "vehicle": id,
        "travelHours": int.tryParse(
          controller.travelHours.text,
        ),
        "repairHours": int.tryParse(
          controller.repairHours.text,
        ),
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
    final handoverHours = int.tryParse(
      _handoverHoursController.text.trim(),
    );
    final otherHours = int.tryParse(
      _otherHoursController.text.trim(),
    );
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
      "vehicleReports": vehiclesReport,
      "vehicleSummaries": vehicleSummaries,
      "handoverHours": handoverHours,
      "otherHours": otherHours,
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
    final excavator = widget.order.device?.last;
    final summaryController =
        _deviceSummaryControllers[widget
                .order
                .device
                ?.last
                .id ??
            ''];

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
                          (widget.order.excavator ?? []).map((
                            item,
                          ) {
                            final deviceController =
                                _vehicleControllers[item
                                    .id]!;
                            return Column(
                              crossAxisAlignment:
                                  CrossAxisAlignment.start,
                              children: [
                                SizedBox(height: 16),
                                Text(
                                  "+ Phương tiện: ${excavator?.code}",
                                  style: TextStyle(
                                    fontWeight:
                                        FontWeight.bold,
                                  ),
                                ),
                                SizedBox(height: 16),
                                Text(
                                  " Máy xúc: ${item.code}",
                                  style: TextStyle(
                                    fontWeight:
                                        FontWeight.bold,
                                  ),
                                ),
                                SizedBox(height: 16),
                                Text(
                                  " Điểm đổ: ${widget.order.location?.name}",
                                  style: TextStyle(
                                    fontWeight:
                                        FontWeight.bold,
                                  ),
                                ),
                                SizedBox(height: 16),
                                Text(
                                  " Loại hàng: ${widget.order.material?.name}",
                                  style: TextStyle(
                                    fontWeight:
                                        FontWeight.bold,
                                  ),
                                ),
                                SizedBox(height: 16),
                                Text(
                                  " Số chuyến:",
                                  style: TextStyle(
                                    fontWeight:
                                        FontWeight.bold,
                                  ),
                                ),
                                TextField(
                                  controller:
                                      deviceController
                                          .tripCount,
                                  keyboardType:
                                      TextInputType.number,
                                  inputFormatters: [
                                    FilteringTextInputFormatter
                                        .digitsOnly,
                                  ],
                                ),
                              ],
                            );
                          }).toList(),
                    ),
                    SizedBox(height: 16),
                    Text(
                      'Giờ di chuyển(phút)',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    TextField(
                      controller:
                          summaryController?.travelHours,
                      keyboardType: TextInputType.number,
                      inputFormatters: [
                        FilteringTextInputFormatter
                            .digitsOnly,
                      ],
                    ),
                    SizedBox(height: 16),
                    Text(
                      'Giờ sửa chữa(phút)',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    TextField(
                      controller:
                          summaryController?.repairHours,
                      keyboardType: TextInputType.number,
                      inputFormatters: [
                        FilteringTextInputFormatter
                            .digitsOnly,
                      ],
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
                      controller:
                          summaryController?.fuelRemain,
                      keyboardType: TextInputType.number,
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
                      controller:
                          summaryController?.fuelReceived,
                      keyboardType: TextInputType.number,
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
                      controller:
                          summaryController?.fuelRemainEnd,
                      keyboardType: TextInputType.number,
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
                      controller:
                          summaryController
                              ?.fuelUsedController,
                      readOnly: true,
                    ),
                    Text(
                      'Tình trạng phương tiện',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    DropdownButtonFormField<String>(
                      value: summaryController?.status,
                      decoration: const InputDecoration(
                        border: OutlineInputBorder(),
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
                          summaryController?.status =
                              value ?? 'good';
                        });
                      },
                    ),
                    if (summaryController?.status == "fail")
                      Text(
                        'Lí do hỏng *',
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    if (summaryController?.status == "fail")
                      TextField(
                        controller: summaryController?.note,
                        minLines: 3,
                        maxLines: null,
                      ),
                    SizedBox(height: 16),
                    Text(
                      'GPS',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    DropdownButtonFormField<String>(
                      value: summaryController?.gpsStatus,
                      decoration: const InputDecoration(
                        border: OutlineInputBorder(),
                      ),
                      items: [
                        DropdownMenuItem(
                          value: 'Hoạt động bình thường',
                          child: Text(
                            'Hoạt động bình thường',
                          ),
                        ),
                        DropdownMenuItem(
                          value: 'Mất tín hiệu',
                          child: Text('Mất tín hiệu'),
                        ),
                      ],
                      onChanged: (value) {
                        setState(() {
                          summaryController?.gpsStatus =
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
                      value: summaryController?.sealStatus,
                      decoration: const InputDecoration(
                        border: OutlineInputBorder(),
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
                          summaryController?.sealStatus =
                              value ?? 'Tốt';
                        });
                      },
                    ),
                    SizedBox(height: 16),
                    Text(
                      'Giờ quy trình-Giao ca(phút)',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    TextField(
                      controller: _handoverHoursController,
                      keyboardType: TextInputType.number,
                      inputFormatters: [
                        FilteringTextInputFormatter
                            .digitsOnly,
                      ],
                    ),
                    Text(
                      'Giờ khác(phút)',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    TextField(
                      controller: _otherHoursController,
                      keyboardType: TextInputType.number,
                      inputFormatters: [
                        FilteringTextInputFormatter
                            .digitsOnly,
                      ],
                    ),
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
          if (widget.order.shiftReport == null)
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
