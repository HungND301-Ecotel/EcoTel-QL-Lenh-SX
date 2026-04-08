import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:soft/models/order_model.dart';
import 'package:soft/models/safety_measure_model.dart';
import 'package:soft/models/shift_model.dart';
import 'package:soft/models/task_model.dart';
import 'package:soft/models/user_model.dart';
import 'package:soft/routes/app_routes.dart';
import 'package:soft/routes/task_assignment_route.dart';
import 'package:soft/screens/work_log/widgets/shift_select.dart';
import 'package:soft/services/order_service.dart';
import 'package:soft/services/safety_measure_service.dart';
import 'package:soft/widgets/car_button.dart';
import 'package:soft/widgets/date_picker_button.dart';
import 'package:soft/widgets/pay_roll_input.dart';
import 'package:soft/widgets/time_picker_button.dart';
import 'package:soft/widgets/vehicle_button.dart';

class TaskAssignmentExcavatorAdd extends StatefulWidget {
  final TaskModel data;
  final OrderModel? order;

  const TaskAssignmentExcavatorAdd({
    super.key,
    required this.data,
    this.order,
  });

  @override
  State<StatefulWidget> createState() =>
      _TaskAssignmentExcavatorAdd();
}

class _TaskAssignmentExcavatorAdd
    extends State<TaskAssignmentExcavatorAdd> {
  DateTime? _selectedDateTime;
  List<Map<String, dynamic>?> userAndDevice = [];
  List<String?> assignedVehicles = [];
  UserModel? user;
  ShiftModel? _shift;
  String? _shiftHour;

  List<SafetyMeasureModel> _allSafetyMeasures = [];
  String _jobSafetyContent = "";
  String _userSafetyContent = "";

  void _updateCombinedSafetyMeasures() {
    // Tách các dòng thành danh sách và loại bỏ khoảng trắng, dòng trống
    final jobMeasures = _jobSafetyContent
        .split('\n')
        .map((s) => s.trim())
        .where((s) => s.isNotEmpty)
        .toList();
    final userMeasures = _userSafetyContent
        .split('\n')
        .map((s) => s.trim())
        .where((s) => s.isNotEmpty)
        .toList();

    // Sử dụng Set để có các biện pháp an toàn duy nhất
    final allMeasures = <String>{
      ...jobMeasures,
      ...userMeasures,
    };

    // Nối các biện pháp an toàn thành một chuỗi và cập nhật controller
    _safetyController.text = allMeasures.join('\n');
  }

  final SafetyMeasureService _safetyMeasureService =
      SafetyMeasureService();
  void getAllSafetyMeasure() async {
    var result =
        await _safetyMeasureService.getAllSafetyMeasure();

    if (!mounted) return;
    if (result['status'] == 'error') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message']),
          backgroundColor: Colors.red,
        ),
      );
    } else {
      final data = (result['data'] as List)
          .map((e) => SafetyMeasureModel.fromJson(e))
          .toList();
      setState(() {
        _allSafetyMeasures = data;
      });

      // lúc đầu check theo job như cũ
      final matchedJobs = _allSafetyMeasures.where(
        (m) =>
            m.job?.any((j) => j.id == widget.data.id) ??
            false,
      );

      if (matchedJobs.isNotEmpty) {
        _jobSafetyContent =
            matchedJobs.map((m) => m.content).join('\n');
      }
      // _updateCombinedSafetyMeasures();
    }
  }

  void _updateSafetyByFirstUser() {
    if (_allSafetyMeasures.isEmpty) return;

    final firstItem = userAndDevice.first;
    if (firstItem == null) return;

    final UserModel? firstUser = firstItem["user"];
    if (firstUser == null) {
      // Nếu người dùng không có, xóa nội dung cũ và cập nhật
      setState(() {
        _userSafetyContent = "";
        _updateCombinedSafetyMeasures();
      });
      return;
    }

    final userPositionId = firstUser.position?.id;
    if (userPositionId == null) {
      // Nếu không có vị trí, xóa nội dung người dùng cũ
      setState(() {
        _userSafetyContent = "";
        _updateCombinedSafetyMeasures();
      });
      return;
    }

    // Tìm kiếm TẤT CẢ biện pháp an toàn theo vị trí của người dùng
    final matchedUserMeasures = _allSafetyMeasures.where((
      m,
    ) {
      return m.position?.any(
            (p) => p.id == userPositionId,
          ) ??
          false;
    });

    setState(() {
      if (matchedUserMeasures.isNotEmpty) {
        // Gộp nội dung của tất cả các biện pháp an toàn của người dùng
        _userSafetyContent = matchedUserMeasures
            .map((m) => m.content)
            .join('\n');
      } else {
        _userSafetyContent = "";
      }
      // Cuối cùng, cập nhật TextField
      _updateCombinedSafetyMeasures();
    });
  }

  @override
  void initState() {
    super.initState();
    getAllSafetyMeasure();
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
      if (order.assignedVehicles != null) {
        assignedVehicles = order.assignedVehicles!
            .map((d) => d.id)
            .toList();
      }

      _safetyController.text = order.safetyMeasure ?? '';
      _safetySpecificController.text =
          order.safetyMeasureSpecific ?? '';

      // Gán lại ngày làm việc nếu có
      _selectedDateTime = order.workingDate;
      _shift = order.shift;
      _shiftHour = order.shiftHour ?? '';
      _descriptionController.text = order.workContent ?? '';
      _noteController.text = order.note ?? '';
      _riskController.text = order.risk ?? '';
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

  void _updateAssignedVehicles(
      int index, String selectedVehicle) {
    setState(() {
      assignedVehicles[index] = selectedVehicle;
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
  final TextEditingController _safetySpecificController =
      TextEditingController();
  final TextEditingController _riskController =
      TextEditingController();
  final OrderService _orderService = OrderService();

  void createOrders() async {
    String description = _descriptionController.text.trim();
    String note = _noteController.text.trim();
    String safetyMeasure = _safetyController.text.trim();
    String safetyMeasureSpecific =
        _safetySpecificController.text.trim();
    String risk = _riskController.text.trim();

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
    if (risk.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Dự báo nguy cơ không được trống."),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }
    final validItems = userAndDevice
        .where(
          (item) =>
              item?["user"] != null &&
              item?["device"] != null,
        )
        .toList();

    List<String> assignedVehiclesIds = assignedVehicles
        .where((v) => v != null && v.isNotEmpty)
        .cast<String>()
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
        "shift": _shift?.id,
        "shiftHour": _shiftHour,
        "assignedTo": item?["user"].id,
        "device": item?["device"],
        "assignedVehicles": assignedVehiclesIds,
        "workContent": description,
        "note": note,
        "risk": risk,
        "safetyMeasure": safetyMeasure,
        "safetyMeasureSpecific": safetyMeasureSpecific,
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
                for (int i = 0;
                    i < userAndDevice.length;
                    i++)
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
                            if (i == 0) {
                              _updateSafetyByFirstUser();
                            }
                          },
                          initialPayroll: userAndDevice[i]
                                  ?["user"]
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
                              vehicle: userAndDevice[i]
                                  ?["device"],
                              onSelectVehicle: (selected) {
                                setState(() {
                                  userAndDevice[i]
                                          ?["device"] =
                                      selected;
                                });
                              },
                            ),
                          ],
                        ),
                      ),
                      if (i > 0)
                        IconButton(
                          onPressed: () {
                            setState(() {
                              userAndDevice.removeAt(i);
                            });
                          },
                          icon: Icon(
                            Icons.cancel,
                            color: Colors.red,
                          ),
                        ),
                    ],
                  ),
                Row(
                  children: [
                    Text(
                      'Phương tiện nhận tải',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    IconButton(
                      onPressed: () {
                        setState(() {
                          assignedVehicles.add("");
                        });
                      },
                      icon: Icon(
                        Icons.add_circle,
                        color: Colors.blue,
                      ),
                    ),
                  ],
                ),
                ...(assignedVehicles.isEmpty
                    ? <Widget>[
                        Padding(
                          padding: const EdgeInsets.only(
                            bottom: 8.0,
                          ),
                          child: CarButton(
                            vehicle: null,
                            onSelectVehicle: (selected) {
                              setState(() {
                                assignedVehicles = [
                                  selected,
                                ]; // Khởi tạo danh sách mới
                              });
                            },
                          ),
                        ),
                      ]
                    : List.generate(assignedVehicles.length,
                        (
                        index,
                      ) {
                        return Padding(
                          padding: const EdgeInsets.only(
                            bottom: 8.0,
                          ),
                          child: CarButton(
                            vehicle:
                                assignedVehicles[index],
                            onSelectVehicle: (selected) {
                              _updateAssignedVehicles(
                                  index, selected);
                            },
                          ),
                        );
                      })),
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
                  'Dự báo nguy cơ',
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
