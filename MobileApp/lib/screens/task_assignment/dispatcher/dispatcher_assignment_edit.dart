import 'package:flutter/material.dart';
import 'package:soft/models/order_model.dart';
import 'package:soft/models/shift_model.dart';
import 'package:soft/models/task_model.dart';
import 'package:soft/models/user_model.dart';
import 'package:soft/routes/task_assignment_route.dart';
import 'package:soft/screens/work_log/widgets/shift_select.dart';
import 'package:soft/services/order_service.dart';
import 'package:soft/widgets/date_picker_button.dart';
import 'package:soft/widgets/device_type_button.dart';
import 'package:soft/widgets/pay_roll_input.dart';

class DispatcherAssignmentEdit extends StatefulWidget {
  final TaskModel data;
  final OrderModel? order;

  const DispatcherAssignmentEdit({
    super.key,
    required this.data,
    this.order,
  });

  @override
  State<StatefulWidget> createState() =>
      _DispatcherAssignmentEdit();
}

class _DispatcherAssignmentEdit
    extends State<DispatcherAssignmentEdit> {
  DateTime? _selectedDateTime;
  List<Map<String, dynamic>?> deviceToProduce = [];
  UserModel? user;
  ShiftModel? _shift;

  @override
  void initState() {
    super.initState();
    _selectedDateTime = DateTime.now();
    if (widget.order != null) {
      final order = widget.order!;

      // Gán lại vehicle nếu có
      if (order.devicesToProduce != null) {
        for (var item in order.devicesToProduce!) {
          deviceToProduce.add({
            "deviceType": item.deviceType.id,
            "quantity": item.quantity,
          });
          _quantityControllers.add(
            TextEditingController(
              text: item.quantity.toString(),
            ),
          );
        }
      }
      // Gán lại ngày làm việc nếu có
      _selectedDateTime = order.workingDate;
      _shift = order.shift;

      _descriptionController.text = order.workContent ?? '';
      _noteController.text = order.note ?? '';
    } else {
      deviceToProduce.add({
        "deviceType": null,
        "quantity": null,
      });
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

  void _updateUser(UserModel? selectedUser) {
    setState(() {
      user = selectedUser;
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
  List<TextEditingController> _quantityControllers = [];
  final OrderService _orderService = OrderService();

  void createOrders() async {
    String description = _descriptionController.text.trim();
    String note = _noteController.text.trim();
    List<Map<String, dynamic>> validDevices =
        deviceToProduce
            .where(
              (item) =>
                  item?['deviceType'] != null &&
                  item?['quantity'] != null,
            )
            .cast<Map<String, dynamic>>()
            .toList();

    if (validDevices.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            "Vui lòng nhập ít nhất một phương tiện và số lượng.",
          ),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    var result = await _orderService
        .update(widget.order!.id, {
          "job": widget.data.id,
          "workingDate":
              DateTime.utc(
                _selectedDateTime!.year,
                _selectedDateTime!.month,
                _selectedDateTime!.day,
              ).toIso8601String(),
          "shift": _shift?.id,
          "devicesToProduce": validDevices,
          "assignedTo": user?.id,
          "workContent": description,
          "status": "in_progress",
          "temporaryError": null,
          "note": note,
        });

    if (!mounted) return;

    if (result['status'] == 'error') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message']),
          backgroundColor: Colors.red,
          duration: Duration(seconds: 2),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Cập nhật thành công"),
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
                PayRollInput(
                  title: 'Số thẻ lương',
                  onSelectUser: _updateUser,
                  initialPayroll:
                      widget.order?.assignedTo.salaryCode,
                ),
                IconButton(
                  onPressed: () {
                    setState(() {
                      deviceToProduce.add({
                        "deviceType": null,
                        "quantity": null,
                      });
                      _quantityControllers.add(
                        TextEditingController(),
                      );
                    });
                  },
                  icon: Icon(
                    Icons.add_circle,
                    color: Colors.blue,
                  ),
                ),
                for (
                  int i = 0;
                  i < deviceToProduce.length;
                  i++
                )
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          children: [
                            Text(
                              'Loại phương tiện',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            DeviceTypeButton(
                              deviceType:
                                  deviceToProduce[i]?["deviceType"],
                              onSelectDeviceType: (
                                selected,
                              ) {
                                setState(() {
                                  deviceToProduce[i]?["deviceType"] =
                                      selected;
                                });
                              },
                            ),
                          ],
                        ),
                      ),
                      Expanded(
                        child: Column(
                          children: [
                            Text(
                              'Số lượng',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            TextField(
                              controller:
                                  _quantityControllers[i],
                              keyboardType:
                                  TextInputType.number,
                              onChanged:
                                  (value) => {
                                    setState(() {
                                      deviceToProduce[i]?["quantity"] =
                                          int.tryParse(
                                            value,
                                          );
                                    }),
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
