import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:soft/models/device_model.dart';
import 'package:soft/models/order_model.dart';
import 'package:soft/models/shift_model.dart';
import 'package:soft/models/task_model.dart';
import 'package:soft/models/user_model.dart';
import 'package:soft/routes/app_routes.dart';
import 'package:soft/routes/task_assignment_route.dart';
import 'package:soft/screens/work_log/widgets/shift_select.dart';
import 'package:soft/services/order_service.dart';
import 'package:soft/widgets/date_picker_button.dart';
import 'package:soft/widgets/location_button.dart';
import 'package:soft/widgets/pay_roll_input.dart';
import 'package:soft/widgets/time_picker_button.dart';
import 'package:soft/widgets/vehicle_button.dart';
import 'package:soft/widgets/material_select_button.dart';

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
  List<Excavator?> excavators = [];

  List<String?> dump = [];
  List<String?> material = [];
  UserModel? user;
  ShiftModel? _shift;
  String? safetyMeasure;
  String? _shiftHour;

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
      if (order.excavator != null &&
          order.excavator!.isNotEmpty) {
        excavators = order.excavator!.map((ex) {
          return Excavator(
            device: ex.device,
            status: ex.status ?? true,
          );
        }).toList();
      } else {
        excavators = [
          Excavator(device: null, status: true)
        ];
      }
      // Gán lại vehicle nếu có
      if (order.material != null) {
        material =
            order.material!.map((d) => d.id).toList();
      }
      // Gán lại vehicle nếu có
      if (order.location != null) {
        dump = order.location!.map((d) => d.id).toList();
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
      _noteController.text = order.note ?? '';
      _riskController.text = order.risk ?? '';
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

  void _updateVehicle(int index, String selectedVehicle) {
    setState(() {
      vehicle[index] = selectedVehicle;
    });
  }

  // void _updateExcavator(int index, String selectedVehicle) {
  //   setState(() {
  //     excavators[index] = selectedVehicle;
  //   });
  // }

  void _updateMaterial(int index, String selectedMaterial) {
    setState(() {
      material[index] = selectedMaterial;
    });
  }

  void _updateLocation(int index, String selectedLocation) {
    setState(() {
      dump[index] = selectedLocation;
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

    if (risk.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Dự báo nguy cơ không được trống."),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }
    List<String> vehicleIds = vehicle
        .where((v) => v != null && v.isNotEmpty)
        .cast<String>()
        .toList();
    final validExcavator = excavators
        .where((item) => item?.device != null)
        .map((i) => ({
              'device': i?.device!.id,
              'status': i?.status ?? true
            }))
        .toList();

    var result =
        await _orderService.update(widget.order!.id, {
      "job": widget.data.id,
      "workingDate": DateTime.utc(
        _selectedDateTime!.year,
        _selectedDateTime!.month,
        _selectedDateTime!.day,
      ).toIso8601String(),
      "shift": _shift?.id,
      "shiftHour": _shiftHour,
      "assignedTo": user?.id,
      "device": vehicleIds,
      "location": dump,
      "excavator": validExcavator,
      "material": material,
      "status": "pending",
      "workContent": description,
      "temporaryError": null,
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
                          child: Row(
                            children: [
                              Expanded(
                                child: VehicleButton(
                                  vehicle: vehicle[index],
                                  onSelectVehicle: (
                                    selected,
                                  ) {
                                    _updateVehicle(
                                      index,
                                      selected,
                                    );
                                  },
                                ),
                              ),
                              if (index > 0)
                                IconButton(
                                  icon: Icon(
                                    Icons.remove_circle,
                                    color: Colors.red,
                                  ),
                                  onPressed: () {
                                    setState(() {
                                      vehicle
                                          .removeAt(index);
                                    });
                                  },
                                ),
                            ],
                          ),
                        );
                      })),
                Row(
                  children: [
                    Expanded(
                        child: Column(
                      crossAxisAlignment:
                          CrossAxisAlignment.start,
                      children: [
                        TextButton.icon(
                          icon: Icon(Icons.add_circle,
                              color: Colors.blue),
                          label: Text('Thêm máy xúc'),
                          onPressed: () {
                            setState(() {
                              excavators.add(Excavator(
                                  device: null,
                                  status: true));
                            });
                          },
                        ),
                        for (int i = 0;
                            i < excavators.length;
                            i++)
                          Row(
                            children: [
                              Expanded(
                                child: TextButton(
                                  onPressed: () async {
                                    final selected =
                                        await Navigator.of(
                                      context,
                                      rootNavigator: true,
                                    ).pushNamed(AppRoute
                                            .excavatorSelect);

                                    if (selected
                                        is DeviceModel) {
                                      setState(() {
                                        excavators[i]
                                                ?.device =
                                            selected;
                                      });
                                    }
                                  },
                                  style:
                                      TextButton.styleFrom(
                                    foregroundColor:
                                        Colors.black,
                                    backgroundColor: Colors
                                        .grey.shade300,
                                    alignment: Alignment
                                        .centerLeft,
                                  ),
                                  child: Text(
                                    excavators[i]
                                            ?.device
                                            ?.code ??
                                        'Chọn máy xúc',
                                  ),
                                ),
                              ),
                              Checkbox(
                                value: excavators[i]
                                    ?.status, // ✅ vì status là bool (mặc định true)
                                onChanged: (val) {
                                  setState(() {
                                    excavators[i]?.status =
                                        val ?? true;
                                  });
                                },
                              ),
                              IconButton(
                                icon: Icon(Icons.cancel,
                                    color: Colors.red),
                                onPressed: () {
                                  setState(() {
                                    excavators.removeAt(i);
                                  });
                                },
                              ),
                            ],
                          ),
                      ],
                    )),
                  ],
                ),
                Row(
                  children: [
                    Text(
                      'Điểm đổ',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    IconButton(
                      onPressed: () {
                        setState(() {
                          dump.add("");
                        });
                      },
                      icon: Icon(
                        Icons.add_circle,
                        color: Colors.blue,
                      ),
                    ),
                  ],
                ),
                ...(dump.isEmpty
                    ? <Widget>[
                        Padding(
                          padding: const EdgeInsets.only(
                            bottom: 8.0,
                          ),
                          child: LocationButton(
                            location: null,
                            onSelectLocation: (selected) {
                              setState(() {
                                dump = [
                                  selected,
                                ]; // Khởi tạo danh sách mới
                              });
                            },
                          ),
                        ),
                      ]
                    : List.generate(dump.length, (index) {
                        return Padding(
                          padding: const EdgeInsets.only(
                            bottom: 8.0,
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: LocationButton(
                                  location: dump[index],
                                  onSelectLocation: (
                                    selected,
                                  ) {
                                    _updateLocation(
                                      index,
                                      selected,
                                    );
                                  },
                                ),
                              ),
                              if (index > 0)
                                IconButton(
                                  icon: Icon(
                                    Icons.remove_circle,
                                    color: Colors.red,
                                  ),
                                  onPressed: () {
                                    setState(() {
                                      dump.removeAt(index);
                                    });
                                  },
                                ),
                            ],
                          ),
                        );
                      })),
                Row(
                  children: [
                    Text(
                      'Vật liệu',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    IconButton(
                      onPressed: () {
                        setState(() {
                          material.add("");
                        });
                      },
                      icon: Icon(
                        Icons.add_circle,
                        color: Colors.blue,
                      ),
                    ),
                  ],
                ),
                ...(material.isEmpty
                    ? <Widget>[
                        Padding(
                          padding: const EdgeInsets.only(
                            bottom: 8.0,
                          ),
                          child: MaterialSelectButton(
                            material: null,
                            onSelectMaterial: (selected) {
                              setState(() {
                                material = [
                                  selected,
                                ]; // Khởi tạo danh sách mới
                              });
                            },
                          ),
                        ),
                      ]
                    : List.generate(material.length, (
                        index,
                      ) {
                        return Padding(
                          padding: const EdgeInsets.only(
                            bottom: 8.0,
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: MaterialSelectButton(
                                  material: material[index],
                                  onSelectMaterial: (
                                    selected,
                                  ) {
                                    _updateMaterial(
                                      index,
                                      selected,
                                    );
                                  },
                                ),
                              ),
                              if (index > 0)
                                IconButton(
                                  icon: Icon(
                                    Icons.remove_circle,
                                    color: Colors.red,
                                  ),
                                  onPressed: () {
                                    setState(() {
                                      material.removeAt(
                                        index,
                                      );
                                    });
                                  },
                                ),
                            ],
                          ),
                        );
                      })),
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
