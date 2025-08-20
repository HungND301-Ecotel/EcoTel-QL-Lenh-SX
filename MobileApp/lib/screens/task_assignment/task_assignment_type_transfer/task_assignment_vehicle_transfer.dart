import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:soft/models/device_model.dart';
import 'package:soft/models/location_model.dart';
import 'package:soft/models/material_model.dart';
import 'package:soft/models/order_model.dart';
import 'package:soft/models/shift_model.dart';
import 'package:soft/models/task_model.dart';
import 'package:soft/models/user_model.dart';
import 'package:soft/routes/app_routes.dart';
import 'package:soft/routes/task_assignment_route.dart';
import 'package:soft/screens/work_log/widgets/shift_select.dart';
import 'package:soft/services/order_service.dart';
import 'package:soft/widgets/date_picker_button.dart';
import 'package:soft/widgets/pay_roll_input.dart';
import 'package:soft/widgets/time_picker_button.dart';
import 'package:soft/widgets/vehicle_button.dart';

class TaskAssignmentVehicleTransfer extends StatefulWidget {
  final TaskModel data;
  final OrderModel? order;

  const TaskAssignmentVehicleTransfer({
    super.key,
    required this.data,
    this.order,
  });

  @override
  State<StatefulWidget> createState() =>
      _TaskAssignmentVehicleTransfer();
}

class _TaskAssignmentVehicleTransfer
    extends State<TaskAssignmentVehicleTransfer> {
  DateTime? _selectedDateTime;
  List<Map<String, dynamic>?> userAndDevice = [];
  DeviceModel? excavator;
  LocationModel? dump;
  MaterialModel? material;
  UserModel? user;
  ShiftModel? _shift;
  String? _shiftHour;

  @override
  void initState() {
    super.initState();
    _selectedDateTime = DateTime.now();
    if (widget.order != null) {
      final order = widget.order!;

      // Gán lại vehicle nếu có
      if (order.device != null) {
        userAndDevice.add({
          "user": order.assignedTo,
          "device": order.device!.last.id,
        });
      }
      // Gán lại vehicle nếu có
      if (order.excavator != null) {
        excavator = order.excavator!.last;
      }
      // Gán lại vehicle nếu có
      if (order.material != null) {
        material = order.material!.last;
      }
      if (order.location != null) {
        dump = order.location!.last;
      }
      _safetyController.text = order.safetyMeasure ?? '';

      // Gán lại ngày làm việc nếu có
      _selectedDateTime = order.workingDate;
      _shift = order.shift;
      _shiftHour = order.shiftHour ?? '';

      _descriptionController.text = order.workContent ?? '';
      _noteController.text = order.note ?? '';
      _distanceController.text = order.distance.toString();
      _liftHeightController.text =
          order.liftHeight.toString();
      _noteController.text =
          order.shiftReport?.vehicleSummaries
              ?.where(
                (e) => (e.note?.trim().isNotEmpty ?? false),
              ) // lọc trước
              .map((e) => '${e.vehicle?.code} ${e.note}')
              .join('\n') ??
          '';
    } else {
      userAndDevice.add({"user": null, "device": null});
    }
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
  // void _updateVehicle(int index, String selectedVehicle) {
  //   setState(() {
  //     vehicle[index] = selectedVehicle;
  //   });
  // }

  // void _updateUser(UserModel? selectedUser) {
  //   setState(() {
  //     user = selectedUser;
  //   });
  // }

  final TextEditingController _descriptionController =
      TextEditingController();
  final TextEditingController _distanceController =
      TextEditingController();
  final TextEditingController _liftHeightController =
      TextEditingController();
  final TextEditingController _noteController =
      TextEditingController();
  final TextEditingController _safetyController =
      TextEditingController();
  final OrderService _orderService = OrderService();

  void createOrder() async {
    String description = _descriptionController.text.trim();
    String note = _noteController.text.trim();
    String safetyMeasure = _safetyController.text.trim();

    final distace = num.tryParse(_distanceController.text);
    final liftheight = num.tryParse(
      _liftHeightController.text,
    );
    for (var item in userAndDevice) {
      if (item?['user'] == null ||
          item?['device'] == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              "Người dùng hoặc thiết bị không được trống.",
            ),
            backgroundColor: Colors.red,
            duration: Duration(seconds: 2),
          ),
        );
        return;
      }
    }
    final validItems =
        userAndDevice
            .where(
              (item) =>
                  item?["user"] != null &&
                  item?["device"] != null,
            )
            .toList();

    bool hasError = false;
    for (var item in validItems) {
      var result = await _orderService.createOrder({
        "job": widget.data.id,
        "workingDate":
            DateTime.utc(
              _selectedDateTime!.year,
              _selectedDateTime!.month,
              _selectedDateTime!.day,
            ).toIso8601String(),
        "shift": _shift?.id,
        "shiftHour": _shiftHour,
        "assignedTo": item?["user"].id,
        "device": item?["device"],
        "location": dump?.id,
        "excavator": excavator?.id,
        "distance": distace,
        "liftHeight": liftheight,
        "material": material?.id,
        "workContent": description,
        "note": note,
        "safetyMeasure": safetyMeasure,
      });
      if (!mounted) return;
      if (result['status'] == 'error') {
        hasError = true;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message']),
            backgroundColor: Colors.red,
          ),
        );
      } else {
        //   Navigator.pushNamed(
        //     context,
        //     TaskAssignmentRoutes.taskAssignmentList,
        //   );
        //   ScaffoldMessenger.of(context).showSnackBar(
        //     SnackBar(
        //       content: Text(result['message']),
        //       backgroundColor: Colors.green,
        //     ),
        //   );
      }
    }
    // Chỉ chuyển trang nếu tất cả đều thành công
    if (!hasError) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Tạo thành công"),
          backgroundColor: Colors.green,
        ),
      );
      Navigator.pushNamed(
        context,
        TaskAssignmentRoutes.taskAssignmentList,
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
                IconButton(
                  onPressed: () {
                    setState(() {
                      userAndDevice.add({
                        "user": null,
                        "device": null,
                      });
                    });
                  },
                  icon: Icon(
                    Icons.add_circle,
                    color: Colors.blue,
                  ),
                ),
                for (
                  int i = 0;
                  i < userAndDevice.length;
                  i++
                )
                  Row(
                    children: [
                      Expanded(
                        child: PayRollInput(
                          title: 'Số thẻ lương',
                          onSelectUser: (selectedUser) {
                            setState(() {
                              userAndDevice[i]?["user"] =
                                  selectedUser;
                            });
                          },
                          initialPayroll:
                              userAndDevice[i]?["user"]
                                  ?.salaryCode,
                        ),
                      ),
                      Expanded(
                        child: Column(
                          children: [
                            Text(
                              'Phương tiện',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            VehicleButton(
                              vehicle:
                                  userAndDevice[i]?["device"],
                              onSelectVehicle: (selected) {
                                setState(() {
                                  userAndDevice[i]?["device"] =
                                      selected;
                                });
                              },
                            ),
                            if (i > 0)
                              IconButton(
                                onPressed: () {
                                  setState(() {
                                    userAndDevice.removeAt(
                                      i,
                                    );
                                  });
                                },
                                icon: Icon(
                                  Icons.cancel,
                                  color: Colors.red,
                                ),
                              ),
                          ],
                        ),
                      ),
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
                  'Máy xúc',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(
                  width: double.infinity,
                  child: TextButton.icon(
                    icon: Icon(Icons.pin),
                    onPressed: () async {
                      final selectedExcavator =
                          await Navigator.of(
                            context,
                            rootNavigator: true,
                          ).pushNamed(
                            AppRoute.excavatorSelect,
                          );
                      if (selectedExcavator != null &&
                          selectedExcavator
                              is DeviceModel) {
                        setState(() {
                          excavator = selectedExcavator;
                        });
                      }
                    },
                    style: TextButton.styleFrom(
                      foregroundColor: Colors.black,
                      backgroundColor: Colors.grey.shade300,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(
                          0,
                        ),
                      ),
                      alignment: Alignment.centerLeft,
                    ),
                    label: Text(
                      excavator?.code ?? 'Máy xúc',
                    ),
                  ),
                ),
                // Text(
                //   'Cung độ',
                //   style: TextStyle(
                //     fontWeight: FontWeight.bold,
                //   ),
                // ),
                // TextField(
                //   controller: _distanceController,
                //   keyboardType: TextInputType.number,
                // ),
                // Text(
                //   'Độ cao nâng tải',
                //   style: TextStyle(
                //     fontWeight: FontWeight.bold,
                //   ),
                // ),
                // TextField(
                //   controller: _liftHeightController,
                //   keyboardType: TextInputType.number,
                // ),
                Text(
                  'Điểm đổ',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(
                  width: double.infinity,
                  child: TextButton.icon(
                    icon: Icon(Icons.casino_sharp),
                    onPressed: () async {
                      final selectedDump =
                          await Navigator.of(
                            context,
                            rootNavigator: true,
                          ).pushNamed(
                            AppRoute.locationSelect,
                          );
                      if (selectedDump != null &&
                          selectedDump is LocationModel) {
                        setState(() {
                          dump = selectedDump;
                        });
                      }
                    },
                    style: TextButton.styleFrom(
                      foregroundColor: Colors.black,
                      backgroundColor: Colors.grey.shade300,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(
                          0,
                        ),
                      ),
                      alignment: Alignment.centerLeft,
                    ),
                    label: Text(dump?.name ?? 'Điểm đổ'),
                  ),
                ),
                Text(
                  'Vật liệu',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(
                  width: double.infinity,
                  child: TextButton.icon(
                    icon: Icon(Icons.group_work_outlined),
                    onPressed: () async {
                      final selectedMaterial =
                          await Navigator.pushNamed(
                            context,
                            TaskAssignmentRoutes
                                .taskAssignmentMaterialSelect,
                          );
                      if (selectedMaterial != null &&
                          selectedMaterial
                              is MaterialModel) {
                        setState(() {
                          material = selectedMaterial;
                        });
                      }
                    },
                    style: TextButton.styleFrom(
                      foregroundColor: Colors.black,
                      backgroundColor: Colors.grey.shade300,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(
                          0,
                        ),
                      ),
                      alignment: Alignment.centerLeft,
                    ),
                    label: Text(
                      material?.name ?? 'Vật liệu',
                    ),
                  ),
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
                  'Biện pháp an toàn',
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
                            _safetyController.text =
                                selected;
                          });
                        }
                      },
                    ),
                  ),
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
