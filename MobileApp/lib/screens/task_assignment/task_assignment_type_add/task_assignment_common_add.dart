import 'package:flutter/material.dart';
import 'package:soft/models/order_model.dart';
import 'package:soft/models/safety_measure_model.dart';
import 'package:soft/models/shift_model.dart';
import 'package:soft/models/task_model.dart';
import 'package:soft/models/user_model.dart';
import 'package:soft/routes/app_routes.dart';
import 'package:soft/routes/task_assignment_route.dart';
import 'package:soft/screens/work_log/widgets/shift_select.dart';
import 'package:soft/services/order_service.dart';
import 'package:soft/widgets/date_picker_button.dart';
import 'package:soft/widgets/pay_roll_input.dart';
import 'package:soft/widgets/vehicle_button.dart';

class TaskAssignmentCommonAdd extends StatefulWidget {
  final TaskModel data;
  final OrderModel? order;

  const TaskAssignmentCommonAdd({
    super.key,
    required this.data,
    this.order,
  });

  @override
  State<StatefulWidget> createState() =>
      _TaskAssignmentCommonAdd();
}

class _TaskAssignmentCommonAdd
    extends State<TaskAssignmentCommonAdd> {
  DateTime? _selectedDateTime;
  List<Map<String, dynamic>?> userAndDevice = [];
  UserModel? user;
  ShiftModel? _shift;
  SafetyMeasureModel? safetyMeasure;

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

      if (order.safetyMeasure != null) {
        safetyMeasure = order.safetyMeasure;
      }
      // Gán lại ngày làm việc nếu có
      _selectedDateTime = order.workingDate;
      _shift = order.shift;

      _descriptionController.text = order.workContent ?? '';
      _noteController.text = order.note ?? '';
    } else {
      userAndDevice.add({"user": null, "device": null});
    }
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

  void _updateShift(ShiftModel? selectedShift) {
    setState(() {
      _shift = selectedShift;
    });
  }

  final TextEditingController _descriptionController =
      TextEditingController();
  final TextEditingController _noteController =
      TextEditingController();
  final OrderService _orderService = OrderService();

  void createOrders() async {
    String description = _descriptionController.text.trim();
    String note = _noteController.text.trim();

    for (var item in userAndDevice) {
      if (item?['user'] == null ||
          item?['device'] == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              "Người dùng hoặc thiết bị không được trống.",
            ),
            backgroundColor: Colors.red,
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
        "assignedTo": item?["user"].id,
        "device": item?["device"],
        "workContent": description,
        "note": note,
        "safetyMeasure": safetyMeasure?.id,
      });

      if (!mounted) return;

      if (result['status'] == 'error') {
        hasError = true;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              "User ${item?["user"].id}, Device ${item?["device"]}: ${result['message']}",
            ),
            backgroundColor: Colors.red,
            duration: Duration(seconds: 2),
          ),
        );
      } else {
        // ScaffoldMessenger.of(context).showSnackBar(
        //   SnackBar(
        //     content: Text(
        //       "Tạo đơn thành công cho User ${item?["user"]}, Device ${item?["device"]}",
        //     ),
        //     backgroundColor: Colors.green,
        //   ),
        // );
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
                SizedBox(
                  width: double.infinity,
                  child: TextButton.icon(
                    icon: Icon(Icons.safety_check),
                    onPressed: () async {
                      final selectedSafetyMeasure =
                          await Navigator.of(
                            context,
                            rootNavigator: true,
                          ).pushNamed(
                            AppRoute.safetyMeastureSelect,
                          );
                      if (selectedSafetyMeasure != null &&
                          selectedSafetyMeasure
                              is SafetyMeasureModel) {
                        setState(() {
                          safetyMeasure =
                              selectedSafetyMeasure;
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
                      safetyMeasure?.content ??
                          'Biện pháp an toàn',
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
            onPressed: createOrders,
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
