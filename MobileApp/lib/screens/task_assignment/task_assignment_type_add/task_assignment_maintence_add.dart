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
import 'package:soft/widgets/all_device_button.dart';
import 'package:soft/widgets/date_picker_button.dart';
import 'package:soft/widgets/department_button.dart';
import 'package:soft/widgets/pay_roll_input.dart';
import 'package:soft/widgets/time_picker_button.dart';

class TaskAssignmentMaintenceAdd extends StatefulWidget {
  final TaskModel data;
  final OrderModel? order;

  const TaskAssignmentMaintenceAdd({
    super.key,
    required this.data,
    this.order,
  });

  @override
  State<StatefulWidget> createState() =>
      _TaskAssignmentMaintenceAdd();
}

class _TaskAssignmentMaintenceAdd
    extends State<TaskAssignmentMaintenceAdd> {
  DateTime? _selectedDateTime;
  List<Map<String, dynamic>?> userAndDevice = [
    {
      "user": null,
      "repairDepartment": null,
      "deviceAndNote": []
    },
  ];
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
      final rvList = (order.repairVehicles
              ?.map((rv) => {
                    "device": rv.device
                        ?.id, // nếu BE trả object thì lấy id
                    "note": rv.note ?? '',
                  })
              .toList()) ??
          [
            {"device": null, "note": ''},
          ];

      setState(() {
        // chỉ 1 thẻ lương duy nhất
        userAndDevice = [
          {
            "user": order.assignedTo, // UserModel?
            "repairDepartment": order.repairDepartment
                ?.id /* hoặc o.repairDepartment?.id nếu bạn lưu id */,
            "deviceAndNote":
                rvList, // mảng thiết bị sửa chữa
          },
        ];
      });

      // controllers ghi chú cho từng thiết bị sửa chữa
      _noteControllers = rvList
          .map((e) =>
              TextEditingController(text: e["note"] ?? ''))
          .toList();
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
      setState(() {
        userAndDevice = [
          {
            "user": null,
            "repairDepartment": null,
            "deviceAndNote": [
              {"device": null, "note": ''},
            ],
          },
        ];
        _noteControllers = [TextEditingController()];
      });
    }
  }

  void _updateRepairDevice(
    int index,
    String selectedDevice,
  ) {
    setState(() {
      userAndDevice[index]?["deviceAndNote"][0]["device"] =
          selectedDevice;
    });
  }

  void _updateRepairNote(int index, String note) {
    setState(() {
      userAndDevice[index]?["deviceAndNote"][0]["note"] =
          note;
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

  void _addPayrollCard() {
    setState(() {
      userAndDevice.add({
        "user": null,
        "repairDepartment": null,
        "deviceAndNote": [
          {"device": null, "note": ''},
        ],
      });
    });
  }

  void _removePayrollCard(int i) {
    setState(() {
      userAndDevice.removeAt(i);
    });
  }

  void _addRepairItem(int i) {
    setState(() {
      (userAndDevice[i]?["deviceAndNote"] as List)
          .add({"device": null, "note": ''});
    });
  }

  void _removeRepairItem(int i, int idx) {
    setState(() {
      final list =
          (userAndDevice[i]?["deviceAndNote"] as List);
      if (idx >= 0 && idx < list.length) list.removeAt(idx);
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
  List<TextEditingController> _noteControllers = [];
  final OrderService _orderService = OrderService();

  void createOrder() async {
    String description = _descriptionController.text.trim();
    String note = _noteController.text.trim();
    String safetyMeasure = _safetyController.text.trim();
    String safetyMeasureSpecific =
        _safetySpecificController.text.trim();
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

    final validItems = userAndDevice
        .where(
          (v) => (v?["user"] != null),
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
        "shift": _shift?.id,
        "shiftHour": _shiftHour,
        "assignedTo": item?["user"].id,
        "repairDepartment": item?["repairDepartment"],
        "repairVehicles": item?["deviceAndNote"]
            ?.map((rv) => {
                  "device": rv["device"],
                  "note": rv["note"],
                })
            .toList(),
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
              "Lỗi tạo lệnh cho User ${item?["user"]}: ${result['message']}",
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
                // Thanh tiêu đề + nút Thêm thẻ lương
                Row(
                  children: [
                    const Text('Thẻ lương',
                        style: TextStyle(
                            fontWeight: FontWeight.bold)),
                    const SizedBox(width: 8),
                    IconButton(
                      onPressed: _addPayrollCard,
                      icon: const Icon(Icons.add_circle,
                          color: Colors.blue),
                      tooltip: 'Thêm thẻ lương',
                    ),
                  ],
                ),

// Danh sách thẻ lương
                for (int i = 0;
                    i < userAndDevice.length;
                    i++)
                  Padding(
                    padding:
                        const EdgeInsets.only(bottom: 12.0),
                    child: Card(
                      elevation: 0.5,
                      shape: RoundedRectangleBorder(
                          borderRadius:
                              BorderRadius.circular(8)),
                      child: Padding(
                        padding: const EdgeInsets.all(12.0),
                        child: Column(
                          crossAxisAlignment:
                              CrossAxisAlignment.start,
                          children: [
                            // Header thẻ + nút xoá thẻ
                            Row(
                              mainAxisAlignment:
                                  MainAxisAlignment
                                      .spaceBetween,
                              children: [
                                if (i > 0)
                                  IconButton(
                                    onPressed: () =>
                                        _removePayrollCard(
                                            i),
                                    icon: const Icon(
                                        Icons.delete,
                                        color: Colors.red),
                                    tooltip: 'Xóa thẻ này',
                                  ),
                              ],
                            ),
                            const SizedBox(height: 8),

                            // Hàng: Số thẻ lương + Đơn vị (thay Phương tiện)
                            Column(
                              children: [
                                PayRollInput(
                                  title: 'Số thẻ lương',
                                  onSelectUser:
                                      (selectedUser) {
                                    setState(() {
                                      userAndDevice[i]
                                              ?["user"] =
                                          selectedUser;
                                    });
                                    if (i == 0) {
                                      _updateSafetyByFirstUser();
                                    }
                                  },
                                  initialPayroll:
                                      userAndDevice[i]
                                              ?["user"]
                                          ?.salaryCode,
                                ),
                                const SizedBox(width: 12),
                                DepartmentButton(
                                  department: userAndDevice[
                                          i]
                                      ?["repairDepartment"],
                                  onSelectDepartment:
                                      (selected) {
                                    setState(() {
                                      userAndDevice[i]?[
                                              "repairDepartment"] =
                                          selected;
                                    });
                                  },
                                ),
                              ],
                            ),

                            const SizedBox(height: 12),

                            // Khu vực Thiết bị sửa chữa (nằm BÊN TRONG thẻ)
                            Row(
                              children: [
                                const Text(
                                    'Thiết bị sửa chữa',
                                    style: TextStyle(
                                        fontWeight:
                                            FontWeight
                                                .bold)),
                                const SizedBox(width: 8),
                                IconButton(
                                  onPressed: () =>
                                      _addRepairItem(i),
                                  icon: const Icon(
                                      Icons.add_circle,
                                      color: Colors.blue),
                                  tooltip:
                                      'Thêm thiết bị sửa chữa',
                                ),
                              ],
                            ),

                            ...List.generate(
                              (userAndDevice[i]
                                          ?["deviceAndNote"]
                                      as List)
                                  .length,
                              (idx) {
                                final item = (userAndDevice[
                                        i]?["deviceAndNote"]
                                    as List<
                                        Map<String,
                                            dynamic>>)[idx];
                                return Padding(
                                  padding:
                                      const EdgeInsets.only(
                                          bottom: 8.0),
                                  child: Column(
                                    children: [
                                      Row(
                                        children: [
                                          // nút chọn thiết bị có sẵn (AllDeviceButton)
                                          Expanded(
                                            child:
                                                AllDeviceButton(
                                              vehicle: item[
                                                  "device"],
                                              onSelectVehicle:
                                                  (selected) {
                                                setState(
                                                    () {
                                                  item["device"] =
                                                      selected;
                                                });
                                              },
                                            ),
                                          ),
                                          const SizedBox(
                                              width: 8),
                                          if (idx > 0)
                                            IconButton(
                                              onPressed: () =>
                                                  _removeRepairItem(
                                                      i,
                                                      idx),
                                              icon: const Icon(
                                                  Icons
                                                      .remove_circle,
                                                  color: Colors
                                                      .red),
                                              tooltip:
                                                  'Xóa thiết bị này',
                                            ),
                                        ],
                                      ),
                                      const SizedBox(
                                          height: 8),
                                      TextField(
                                        decoration:
                                            const InputDecoration(
                                          hintText:
                                              "Tình trạng thiết bị...",
                                          border:
                                              OutlineInputBorder(),
                                        ),
                                        controller:
                                            TextEditingController(
                                                text: item[
                                                        "note"] ??
                                                    ''),
                                        onChanged: (val) =>
                                            item["note"] =
                                                val,
                                      ),
                                    ],
                                  ),
                                );
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
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
