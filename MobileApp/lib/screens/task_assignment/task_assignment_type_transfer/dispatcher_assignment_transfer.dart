import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:soft/models/order_model.dart';
import 'package:soft/models/task_model.dart';
import 'package:soft/models/user_model.dart';
import 'package:soft/providers/user_provider.dart';
import 'package:soft/routes/task_assignment_route.dart';
import 'package:soft/services/order_service.dart';
import 'package:soft/utils/batchId_utils.dart';
import 'package:soft/widgets/date_picker_button.dart';
import 'package:soft/widgets/pay_roll_input.dart';

class DispatcherAssignmentTransfer extends StatefulWidget {
  final TaskModel data;
  final OrderModel? order;

  const DispatcherAssignmentTransfer({
    super.key,
    required this.data,
    this.order,
  });

  @override
  State<StatefulWidget> createState() =>
      _DispatcherAssignmentTransfer();
}

class _DispatcherAssignmentTransfer
    extends State<DispatcherAssignmentTransfer> {
  DateTime? _selectedDateTime;
  UserModel? user;
  List<Map<String, dynamic>?> userAndDepartment = [];
  List<TextEditingController> _departmentControllers = [];

  @override
  void initState() {
    super.initState();
    _selectedDateTime = DateTime.now();
    if (widget.order != null) {
      final order = widget.order!;
      userAndDepartment.add({
        "user": order.assignedTo,
        "department": order.assignedTo.department?.code,
      });
      _departmentControllers.add(
        TextEditingController(
          text: order.assignedTo.department?.code ?? '',
        ),
      );
      // Gán lại ngày làm việc nếu có
      _selectedDateTime = order.workingDate;

      _descriptionController.text = order.workContent ?? '';
      _noteController.text =
          order.shiftReport?.handoverNotes ?? '';
      _riskController.text = order.risk ?? '';
    } else {
      userAndDepartment.add({
        "user": null,
        "department": null,
      });
      _departmentControllers.add(TextEditingController());
    }
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    _noteController.dispose();
    for (var controller in _departmentControllers) {
      controller.dispose();
    }
    super.dispose();
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

  final TextEditingController _descriptionController =
      TextEditingController();
  final TextEditingController _noteController =
      TextEditingController();
  final TextEditingController _riskController =
      TextEditingController();
  final OrderService _orderService = OrderService();

  void createOrders() async {
    String description = _descriptionController.text.trim();
    String note = _noteController.text.trim();
    String risk = _riskController.text.trim();

    if (risk.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Dự báo nguy cơ không được trống."),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final userProvider = Provider.of<UserProvider>(
      context,
      listen: false,
    );

    final batchId = generateBatchId(
      userProvider.user?.fullName,
    );

    final validItems = userAndDepartment
        .where(
          (item) =>
              item?["user"] != null &&
              item?["department"] != null,
        )
        .toList();

    bool hasError = false;
    for (var item in validItems) {
      var result = await _orderService.createOrder({
        "job": widget.data.id,
        "workingDate": DateTime.utc(
          _selectedDateTime!.year,
          _selectedDateTime!.month,
          _selectedDateTime!.day,
        ).toIso8601String(),
        "assignedTo": item?["user"].id,
        "workContent": description,
        "batchId": batchId,
        "note": note,
        "risk": risk,
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
        // ScaffoldMessenger.of(context).showSnackBar(
        //   SnackBar(
        //     content: Text("Tạo thành công"),
        //     backgroundColor: Colors.green,
        //   ),
        // );
        // Navigator.pushNamed(
        //   context,
        //   TaskAssignmentRoutes.taskAssignmentList,
        // );
      }
    }
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
                      userAndDepartment.add({
                        "user": null,
                        "department": null,
                      });
                      _departmentControllers.add(
                        TextEditingController(),
                      );
                    });
                  },
                  icon: Icon(
                    Icons.add_circle,
                    color: Colors.blue,
                  ),
                ),
                for (int i = 0;
                    i < userAndDepartment.length;
                    i++)
                  Row(
                    children: [
                      Expanded(
                        child: PayRollInput(
                          title: 'Số thẻ lương',
                          onSelectUser: (selectedUser) {
                            setState(() {
                              userAndDepartment[i]
                                  ?["user"] = selectedUser;
                              userAndDepartment[i]
                                      ?["department"] =
                                  selectedUser
                                      ?.department?.code;
                              _departmentControllers[i]
                                  .text = selectedUser
                                      ?.department?.code ??
                                  '';
                            });
                          },
                          initialPayroll:
                              userAndDepartment[i]?["user"]
                                  ?.salaryCode,
                        ),
                      ),
                      Expanded(
                        child: Column(
                          children: [
                            Text(
                              'Đơn vị',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            TextField(
                              controller:
                                  _departmentControllers[i],
                              readOnly: true,
                            ),
                          ],
                        ),
                      ),
                      if (i > 0)
                        IconButton(
                          onPressed: () {
                            setState(() {
                              _departmentControllers
                                  .removeAt(i)
                                  .dispose();
                              userAndDepartment.removeAt(i);
                            });
                          },
                          icon: Icon(
                            Icons.cancel,
                            color: Colors.red,
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
                  'Nội dung bàn giao ca trước',
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
