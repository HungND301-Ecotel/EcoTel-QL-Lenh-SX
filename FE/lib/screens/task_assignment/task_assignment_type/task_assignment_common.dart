import 'package:flutter/material.dart';
import 'package:job_manager/models/device_model.dart';
import 'package:job_manager/models/order_model.dart';
import 'package:job_manager/models/task_model.dart';
import 'package:job_manager/models/user_model.dart';
import 'package:job_manager/routes/task_assignment_route.dart';
import 'package:job_manager/services/order_service.dart';
import 'package:job_manager/widgets/date_time_picker_button.dart';
import 'package:job_manager/widgets/pay_roll_input.dart';
import 'package:job_manager/widgets/vehicle_button.dart';

class TaskAssignmentCommon extends StatefulWidget {
  final TaskModel data;
  final OrderModel? order;

  const TaskAssignmentCommon({
    super.key,
    required this.data,
    this.order,
  });

  @override
  State<StatefulWidget> createState() =>
      _TaskAssignmentCommon();
}

class _TaskAssignmentCommon
    extends State<TaskAssignmentCommon> {
  DateTime? _selectedDateTime;
  DeviceModel? vehicle;
  UserModel? user;

  @override
  void initState() {
    super.initState();
    _selectedDateTime = DateTime.now();
    if (widget.order != null) {
      final order = widget.order!;

      // Gán lại vehicle nếu có
      if (order.deviceId != null) {
        vehicle = order.deviceId;
      }
      // Gán lại ngày làm việc nếu có
      _selectedDateTime = order.workingDate;

      _descriptionController.text = order.description ?? '';
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

    TimeOfDay? time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );

    if (time == null) return;

    final combinedDateTime = DateTime(
      date.year,
      date.month,
      date.day,
      time.hour,
      time.minute,
    );

    setState(() {
      _selectedDateTime = combinedDateTime;
    });
  }

  void _updateVehicle(DeviceModel selectedVehicle) {
    setState(() {
      vehicle = selectedVehicle;
    });
  }

  void _updateUser(UserModel? selectedUser) {
    setState(() {
      user = selectedUser;
    });
  }

  final TextEditingController _descriptionController =
      TextEditingController();
  final OrderService _orderService = OrderService();

  void createOrder() async {
    String description = _descriptionController.text.trim();
    var result = await _orderService.createOrder({
      "taskId": widget.data.id,
      "workingDate": _selectedDateTime?.toIso8601String(),
      "assignedTo": user?.id,
      "deviceId": vehicle?.id,
      "description": description,
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
                ),
                Text(
                  'Ngày giờ',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                DateTimePickerButton(
                  selectedDateTime: _selectedDateTime,
                  onPressed: _pickDateTime,
                ),
                Text(
                  'Phương tiện',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                VehicleButton(
                  vehicle: vehicle,
                  onSelectVehicle: _updateVehicle,
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
