import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:soft/models/order_model.dart';
import 'package:soft/models/shift_model.dart';
import 'package:soft/models/task_model.dart';
import 'package:soft/models/user_model.dart';
import 'package:soft/routes/app_routes.dart';
import 'package:soft/routes/task_assignment_route.dart';
import 'package:soft/screens/work_log/widgets/shift_select.dart';
import 'package:soft/services/order_service.dart';
import 'package:soft/widgets/all_device_button.dart';
import 'package:soft/widgets/date_picker_button.dart';
import 'package:soft/widgets/department_button.dart';
import 'package:soft/widgets/pay_roll_input.dart';
import 'package:soft/widgets/time_picker_button.dart';

class TaskAssignmentMaintenceTransfer
    extends StatefulWidget {
  final TaskModel data;
  final OrderModel? order;

  const TaskAssignmentMaintenceTransfer({
    super.key,
    required this.data,
    this.order,
  });

  @override
  State<StatefulWidget> createState() =>
      _TaskAssignmentMaintenceTransfer();
}

class _TaskAssignmentMaintenceTransfer
    extends State<TaskAssignmentMaintenceTransfer> {
  DateTime? _selectedDateTime;
  List<String?> vehicle = [];
  List<Map<String, String?>> deviceAndNote = [];
  UserModel? user;
  ShiftModel? _shift;
  String? _shiftHour;
  String? _repairDepartment;

  @override
  void initState() {
    super.initState();
    _selectedDateTime = DateTime.now();
    if (widget.order != null) {
      final order = widget.order!;
      if (order.repairVehicles != null &&
          order.repairVehicles!.isNotEmpty) {
        deviceAndNote = order.repairVehicles!.map((repair) {
          return {
            "device": repair.device
                ?.id, // hoặc repair.device nếu bạn cần object
            "note": repair.note ?? '',
          };
        }).toList();
        _noteControllers = order.repairVehicles!
            .map(
              (e) => TextEditingController(
                text: e.note ?? "",
              ),
            )
            .toList();
      } else {
        deviceAndNote = [
          {"device": null, "note": ''},
        ];
        _noteControllers.add(TextEditingController());
      }
      // Gán lại vehicle nếu có
      if (order.device != null) {
        vehicle = order.device!.map((d) => d.id).toList();
      }
      _safetyController.text = order.safetyMeasure ?? '';
      _safetySpecificController.text =
          order.safetyMeasureSpecific ?? '';
      _repairDepartment = order.repairDepartment?.id;
      _riskController.text = order.risk ?? '';

      // Gán lại ngày làm việc nếu có
      _selectedDateTime = order.workingDate;
      _shift = order.shift;
      _shiftHour = order.shiftHour ?? '';
      _descriptionController.text = order.workContent ?? '';
      _noteController
          .text = order.shiftReport?.vehicleSummaries
              ?.where(
                (e) => (e.note?.trim().isNotEmpty ?? false),
              ) // lọc trước
              .map((e) => '${e.vehicle?.code} ${e.note}')
              .join('\n') ??
          '';
    } else {
      deviceAndNote.add({"device": null, "note": ''});
      _noteControllers.add(TextEditingController());
    }
  }

  void _updateRepairDevice(
    int index,
    String selectedDevice,
  ) {
    setState(() {
      deviceAndNote[index]["device"] = selectedDevice;
    });
  }

  void _updateRepairNote(int index, String note) {
    setState(() {
      deviceAndNote[index]["note"] = note;
    });
  }

  void _updateShift(ShiftModel? selectedShift) {
    setState(() {
      _shift = selectedShift;
      _shiftHour = (selectedShift?.startTime ?? '').trim();
    });
  }

  Future<void> _pickDateTime() async {
    DateTime? date = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );

    if (date == null) return;

    setState(() {
      _selectedDateTime = date;
    });
  }

  Future<void> _pickTime() async {
    TimeOfDay initialTime;
    if (_shiftHour != null && _shiftHour!.isNotEmpty) {
      final parts = _shiftHour!.split(':');
      final hour = int.tryParse(parts[0]) ?? 0;
      final minute =
          int.tryParse(parts.length > 1 ? parts[1] : '0') ??
              0;
      initialTime = TimeOfDay(hour: hour, minute: minute);
    } else {
      initialTime = TimeOfDay.now();
    }
    TimeOfDay? time = await showTimePicker(
      context: context,
      initialTime: initialTime,
    );

    if (time == null) return;

    // Chuyển về chuỗi 24h
    final now = DateTime.now();
    final dt = DateTime(
      now.year,
      now.month,
      now.day,
      time.hour,
      time.minute,
    );
    setState(() {
      _shiftHour = DateFormat('HH:mm').format(dt);
    });
  }

  void _updateVehicle(int index, String selectedVehicle) {
    setState(() {
      vehicle[index] = selectedVehicle;
    });
  }

  void _updateUser(UserModel? selectedUser) {
    setState(() {
      user = selectedUser;
    });
  }

  final TextEditingController _descriptionController =
      TextEditingController();
  final TextEditingController _noteController =
      TextEditingController();
  final TextEditingController _safetyController =
      TextEditingController();
  final TextEditingController _safetySpecificController =
      TextEditingController();
  List<TextEditingController> _noteControllers = [];
  final TextEditingController _riskController =
      TextEditingController();
  final OrderService _orderService = OrderService();

  void createOrder() async {
    String description = _descriptionController.text.trim();
    String note = _noteController.text.trim();
    String safetyMeasure = _safetyController.text.trim();
    String safetyMeasureSpecific =
        _safetySpecificController.text.trim();
    String risk = _riskController.text.trim();

    List<Map<String, dynamic>> repairVehicles =
        deviceAndNote
            .where((v) => (v["device"] != null))
            .map(
              (v) => {
                "device": v["device"],
                "note": v["note"] ?? '',
              },
            )
            .toList();
    if (risk.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Dự báo nguy cơ không được trống."),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }
    var result = await _orderService.createOrder({
      "job": widget.data.id,
      "workingDate": DateTime.utc(
        _selectedDateTime!.year,
        _selectedDateTime!.month,
        _selectedDateTime!.day,
      ).toIso8601String(),
      "shift": _shift?.id,
      "shiftHour": _shiftHour,
      "assignedTo": user?.id,
      "repairDepartment": _repairDepartment,
      "repairVehicles": repairVehicles,
      "workContent": description,
      "note": note,
      "risk": risk,
      "safetyMeasure": safetyMeasure,
      "safetyMeasureSpecific": safetyMeasureSpecific,
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
        TaskAssignmentRoutes.taskAssignmentList,
      );
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
    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(8.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                PayRollInput(
                  title: 'Số thẻ lương',
                  onSelectUser: _updateUser,
                  initialPayroll:
                      widget.order?.assignedTo.salaryCode,
                ),
                Text(
                  'Đơn vị sửa chữa',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                DepartmentButton(
                  department: _repairDepartment,
                  onSelectDepartment: (selected) {
                    setState(() {
                      _repairDepartment = selected;
                    });
                  },
                ),
                Column(
                  crossAxisAlignment:
                      CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          'Thiết bị sửa chữa',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        IconButton(
                          onPressed: () {
                            setState(() {
                              deviceAndNote.add({
                                "device": null,
                                "note": "",
                              });
                              _noteControllers.add(
                                TextEditingController(),
                              );
                            });
                          },
                          icon: Icon(
                            Icons.add_circle,
                            color: Colors.blue,
                          ),
                        ),
                      ],
                    ),
                    ...List.generate(deviceAndNote.length, (
                      index,
                    ) {
                      return Padding(
                        padding: const EdgeInsets.only(
                          bottom: 8.0,
                        ),
                        child: Column(
                          children: [
                            // chọn thiết bị
                            Row(
                              children: [
                                Expanded(
                                  child: AllDeviceButton(
                                    vehicle:
                                        deviceAndNote[index]
                                            ["device"],
                                    onSelectVehicle: (
                                      selected,
                                    ) {
                                      _updateRepairDevice(
                                        index,
                                        selected,
                                      );
                                    },
                                  ),
                                ),
                                if (index > 0)
                                  IconButton(
                                    onPressed: () {
                                      setState(() {
                                        deviceAndNote
                                            .removeAt(
                                          index,
                                        );
                                        _noteControllers
                                            .removeAt(
                                          index,
                                        );
                                      });
                                    },
                                    icon: Icon(
                                      Icons.remove_circle,
                                      color: Colors.red,
                                    ),
                                  ),
                              ],
                            ),
                            SizedBox(width: 8),
                            // nhập ghi chú
                            TextField(
                              controller:
                                  _noteControllers[index],
                              decoration: InputDecoration(
                                hintText:
                                    "Tình trạng thiết bị...",
                                border:
                                    OutlineInputBorder(),
                              ),
                              onChanged: (val) =>
                                  _updateRepairNote(
                                index,
                                val,
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                  ],
                ),
                Text(
                  'Ngày',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                DatePickerButton(
                  selectedDateTime: _selectedDateTime,
                  onPressed: _pickDateTime,
                ),
                Text(
                  'Ca làm việc',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                ShiftSelect(
                  initialShift: _shift,
                  onSelected: _updateShift,
                ),
                Text(
                  'Giờ làm việc',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TimePickerButton(
                  selectedDateTime: _shiftHour,
                  onPressed: _pickTime,
                ),
                Text(
                  'Nội dung công việc',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextField(
                  controller: _descriptionController,
                  maxLines: null,
                  minLines: 5,
                ),
                Text(
                  'Nội dung bàn giao ca ',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextField(
                  controller: _noteController,
                  maxLines: null,
                  minLines: 5,
                ),
                Text(
                  'Dự báo nguy cơ ',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextField(
                  controller: _riskController,
                  maxLines: null,
                  minLines: 5,
                ),
                Text(
                  'Biện pháp an toàn chung',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextField(
                  controller: _safetyController,
                  maxLines: null,
                  minLines: 5,
                  decoration: InputDecoration(
                    hintText:
                        'Nhập/ghi chú biện pháp an toàn...',
                    suffixIcon: IconButton(
                      icon: Icon(Icons.library_add),
                      tooltip: 'Chọn mẫu',
                      onPressed: () async {
                        final selected = await Navigator.of(
                          context,
                          rootNavigator: true,
                        ).pushNamed(
                          AppRoute.safetyMeastureSelect,
                        );
                        if (!mounted) return;
                        if (selected is String &&
                            selected.trim().isNotEmpty) {
                          setState(() {
                            // Kiểm tra nếu TextField không rỗng, thêm dấu xuống dòng
                            if (_safetyController
                                .text.isNotEmpty) {
                              _safetyController.text +=
                                  '\n';
                            }
                            _safetyController.text +=
                                selected;
                          });
                        }
                      },
                    ),
                  ),
                ),
                Text(
                  'Biện pháp an toàn cụ thể ',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextField(
                  controller: _safetySpecificController,
                  maxLines: null,
                  minLines: 5,
                ),
              ],
            ),
          ),
        ),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: createOrder,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue,
              foregroundColor: Colors.white,
            ),
            child: Text('Lưu lại'),
          ),
        ),
      ],
    );
  }
}
