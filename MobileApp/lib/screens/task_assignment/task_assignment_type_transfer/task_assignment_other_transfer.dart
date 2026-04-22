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
import 'package:soft/widgets/date_picker_button.dart';
import 'package:soft/widgets/pay_roll_input.dart';

class TaskAssignmentOtherTransfer extends StatefulWidget {
  final TaskModel data;
  final OrderModel? order;
  const TaskAssignmentOtherTransfer({
    super.key,
    required this.data,
    this.order,
  });

  @override
  State<StatefulWidget> createState() =>
      _TaskAssignmentOtherTransfer();
}

class _TaskAssignmentOtherTransfer
    extends State<TaskAssignmentOtherTransfer> {
  DateTime? _selectedDateTime;
  List<UserModel?> user = [];
  ShiftModel? _shift;
  String? _shiftHour;

  @override
  void initState() {
    super.initState();
    _selectedDateTime = DateTime.now();
    if (widget.order != null) {
      final order = widget.order!;
      // Gán lại ngày làm việc nếu có
      _safetyController.text = order.safetyMeasure ?? '';

      _selectedDateTime = order.workingDate;
      _shift = order.shift;
      _shiftHour = order.shiftHour ?? '';

      _descriptionController.text = order.workContent ?? '';
      _noteController.text =
          order.shiftReport?.handoverNotes ?? '';
      _riskController.text =
          order.risk ?? '';


      user.add(order.assignedTo);
    } else {
      user.add(null);
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

  void _updateShift(ShiftModel? selectedShift) {
    setState(() {
      _shift = selectedShift;
      _shiftHour = (selectedShift?.startTime ?? '').trim();
    });
  }

  final TextEditingController _descriptionController =
      TextEditingController();
  final TextEditingController _noteController =
      TextEditingController();
  final TextEditingController _safetyController =
      TextEditingController();
      final TextEditingController _riskController =
      TextEditingController();

  final OrderService _orderService = OrderService();

  void createOrder() async {
    String description = _descriptionController.text.trim();
    String note = _noteController.text.trim();
    String safetyMeasure = _safetyController.text.trim();
    String risk = _riskController.text.trim();


    for (var item in user) {
      if (item == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Người dùng không được trống."),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }
    }
    if(risk.isEmpty){
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Dự báo nguy cơ không được trống."),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final validItems =
        user.where((item) => item != null).toList();
    bool hasError = false;

    for (var item in validItems) {
      var result = await _orderService.createOrder({
        "job": widget.data.id,
        "workingDate": DateTime.utc(
          _selectedDateTime!.year,
          _selectedDateTime!.month,
          _selectedDateTime!.day,
        ).toIso8601String(),
        "shift": _shift?.id,
        "shiftHour": _shiftHour,
        "assignedTo": item?.id,
        "workContent": description,
        "note": note,
        "risk":risk,
        "safetyMeasure": safetyMeasure,
      });
      if (!mounted) return;
      if (result['status'] == 'error') {
        hasError = true;
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
        //     content: Text(result['message']),
        //     backgroundColor: Colors.green,
        //   ),
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
                      user.add(null);
                    });
                  },
                  icon: Icon(
                    Icons.add_circle,
                    color: Colors.blue,
                  ),
                ),
                for (int i = 0; i < user.length; i++)
                  Row(
                    children: [
                      Expanded(
                        child: PayRollInput(
                          title: 'Số thẻ lương',
                          onSelectUser: (selectedUser) {
                            setState(() {
                              user[i] = selectedUser;
                            });
                          },
                          initialPayroll:
                              user[i]?.salaryCode,
                        ),
                      ),
                      if (i > 0)
                        IconButton(
                          onPressed: () {
                            setState(() {
                              user.removeAt(i);
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
