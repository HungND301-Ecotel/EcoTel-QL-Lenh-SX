import 'package:flutter/material.dart';
import 'package:soft/models/device_model.dart';
import 'package:soft/models/location_model.dart';
import 'package:soft/models/material_model.dart';
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
import 'package:soft/widgets/date_time_picker_button.dart';
import 'package:soft/widgets/excavator_button.dart';
import 'package:soft/widgets/pay_roll_input.dart';
import 'package:soft/widgets/vehicle_button.dart';

class TaskAssignmentVehicleEdit extends StatefulWidget {
  final TaskModel data;
  final OrderModel? order;

  const TaskAssignmentVehicleEdit({
    super.key,
    required this.data,
    this.order,
  });

  @override
  State<StatefulWidget> createState() =>
      _TaskAssignmentVehicleEdit();
}

class _TaskAssignmentVehicleEdit
    extends State<TaskAssignmentVehicleEdit> {
  DateTime? _selectedDateTime;
  List<String?> vehicle = [];
  List<String?> excavator = [];
  LocationModel? dump;
  MaterialModel? material;
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
        vehicle = order.device!.map((d) => d.id).toList();
      }
      // Gán lại vehicle nếu có
      if (order.excavator != null) {
        excavator =
            order.excavator!.map((d) => d.id).toList();
      }
      // Gán lại vehicle nếu có
      if (order.material != null) {
        material = order.material;
      }

      if (order.safetyMeasure != null) {
        safetyMeasure = order.safetyMeasure;
      }
      // Gán lại ngày làm việc nếu có
      _selectedDateTime = order.workingDate;
      _shift = order.shift;

      _descriptionController.text = order.workContent ?? '';
      _noteController.text = order.note ?? '';
      _distanceController.text = order.distance.toString();
      _liftHeightController.text =
          order.liftHeight.toString();
      _noteController.text = order.note ?? '';
    }
  }

  void _updateShift(ShiftModel? selectedShift) {
    setState(() {
      _shift = selectedShift;
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

  void _updateVehicle(int index, String selectedVehicle) {
    setState(() {
      vehicle[index] = selectedVehicle;
    });
  }

  void _updateExcavator(int index, String selectedVehicle) {
    setState(() {
      excavator[index] = selectedVehicle;
    });
  }

  void _updateUser(UserModel? selectedUser) {
    setState(() {
      user = selectedUser;
    });
  }

  final TextEditingController _descriptionController =
      TextEditingController();
  final TextEditingController _distanceController =
      TextEditingController();
  final TextEditingController _liftHeightController =
      TextEditingController();
  final TextEditingController _noteController =
      TextEditingController();
  final OrderService _orderService = OrderService();

  void createOrder() async {
    String description = _descriptionController.text.trim();
    String note = _noteController.text.trim();

    final distace = num.tryParse(_distanceController.text);
    final liftheight = num.tryParse(
      _liftHeightController.text,
    );

    List<String> vehicleIds =
        vehicle
            .where((v) => v != null && v.isNotEmpty)
            .cast<String>()
            .toList();
    List<String> excavatorIds =
        excavator
            .where((v) => v != null && v.isNotEmpty)
            .cast<String>()
            .toList();

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
          "assignedTo": user?.id,
          "device": vehicleIds,
          "location": dump?.id,
          "excavator": excavatorIds,
          "distance": distace,
          "liftHeight": liftheight,
          "material": material?.id,
          "status": "pending",
          "workContent": description,
          "temporaryError": null,
          "note": note,
          "safetyMeasure": safetyMeasure?.id,
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
                Row(
                  children: [
                    Text(
                      'Phương tiện',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    IconButton(
                      onPressed: () {
                        setState(() {
                          if (excavator.length > 1) {
                            ScaffoldMessenger.of(
                              context,
                            ).showSnackBar(
                              SnackBar(
                                content: Text(
                                  'Chỉ nên thêm phương tiện khi có một máy xúc.',
                                ),
                                backgroundColor:
                                    Colors.orange,
                              ),
                            );
                            return;
                          }
                          vehicle.add("");
                        });
                      },
                      icon: Icon(
                        Icons.add_circle,
                        color: Colors.blue,
                      ),
                    ),
                  ],
                ),
                ...(vehicle.isEmpty
                    ? <Widget>[
                      Padding(
                        padding: const EdgeInsets.only(
                          bottom: 8.0,
                        ),
                        child: VehicleButton(
                          vehicle: null,
                          onSelectVehicle: (selected) {
                            setState(() {
                              vehicle = [
                                selected,
                              ]; // Khởi tạo danh sách mới
                            });
                          },
                        ),
                      ),
                    ]
                    : List.generate(vehicle.length, (
                      index,
                    ) {
                      return Padding(
                        padding: const EdgeInsets.only(
                          bottom: 8.0,
                        ),
                        child: VehicleButton(
                          vehicle: vehicle[index],
                          onSelectVehicle: (selected) {
                            _updateVehicle(index, selected);
                          },
                        ),
                      );
                    })),
                Row(
                  children: [
                    Text(
                      'Máy xúc',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    IconButton(
                      onPressed: () {
                        setState(() {
                          if (vehicle.length > 1) {
                            ScaffoldMessenger.of(
                              context,
                            ).showSnackBar(
                              SnackBar(
                                content: Text(
                                  'Chỉ nên thêm máy xúc khi có một phương tiện.',
                                ),
                                backgroundColor:
                                    Colors.orange,
                              ),
                            );
                            return;
                          }
                          excavator.add("");
                        });
                      },
                      icon: Icon(
                        Icons.add_circle,
                        color: Colors.blue,
                      ),
                    ),
                  ],
                ),
                ...(excavator.isEmpty
                    ? <Widget>[
                      Padding(
                        padding: const EdgeInsets.only(
                          bottom: 8.0,
                        ),
                        child: ExcavatorButton(
                          vehicle: null,
                          onSelectVehicle: (selected) {
                            setState(() {
                              excavator = [
                                selected,
                              ]; // Khởi tạo danh sách mới
                            });
                          },
                        ),
                      ),
                    ]
                    : List.generate(excavator.length, (
                      index,
                    ) {
                      return Padding(
                        padding: const EdgeInsets.only(
                          bottom: 8.0,
                        ),
                        child: VehicleButton(
                          vehicle: excavator[index],
                          onSelectVehicle: (selected) {
                            _updateExcavator(
                              index,
                              selected,
                            );
                          },
                        ),
                      );
                    })),
                Text(
                  'Cung độ',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextField(
                  controller: _distanceController,
                  keyboardType: TextInputType.number,
                ),
                Text(
                  'Độ cao nâng tải',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextField(
                  controller: _liftHeightController,
                  keyboardType: TextInputType.number,
                ),
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
                          await Navigator.pushNamed(
                            context,
                            TaskAssignmentRoutes
                                .taskAssignmentDumpSiteSelect,
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
