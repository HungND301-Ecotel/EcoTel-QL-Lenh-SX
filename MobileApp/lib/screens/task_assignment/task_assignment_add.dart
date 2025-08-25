import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:soft/models/order_model.dart';
import 'package:soft/models/safety_measure_model.dart';
import 'package:soft/models/task_model.dart';
import 'package:soft/providers/user_provider.dart';
import 'package:soft/screens/task_assignment/dispatcher/dispatcher_assignment_add.dart';
import 'package:soft/screens/task_assignment/task_assignment_type_add/task_assignment_common_add.dart';
import 'package:soft/screens/task_assignment/task_assignment_type_add/task_assignment_other_add.dart';
import 'package:soft/screens/task_assignment/task_assignment_type_add/task_assignment_vehicle_add.dart';
import 'package:soft/services/safety_measure_service.dart';

class TaskAssignmentAdd extends StatefulWidget {
  final TaskModel data;
  final OrderModel? order;
  const TaskAssignmentAdd({
    super.key,
    required this.data,
    this.order,
  });

  @override
  State<StatefulWidget> createState() =>
      _TaskAssignmentAdd();
}

class _TaskAssignmentAdd extends State<TaskAssignmentAdd> {
  String content = "";
  bool _isLoading = true;

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
      final data =
          (result['data'] as List)
              .map((e) => SafetyMeasureModel.fromJson(e))
              .toList();

      // tìm measure nào có job == widget.data.id
      final matched = data.firstWhere(
        (m) =>
            m.job?.id ==
            widget.data.id, // chú ý nếu job là object
        orElse:
            () => SafetyMeasureModel(
              id: '',
              content: '',
              master_content: '',
              job: null,
            ),
      );

      if (matched.master_content != null &&
          matched.master_content!.trim().isNotEmpty) {
        setState(() {
          content = matched.master_content!;
        });
      }
    }
    setState(() {
      _isLoading = false;
    });
  }

  @override
  void initState() {
    super.initState();
    getAllSafetyMeasure();
  }

  Widget _getBody() {
    final type = widget.data.type;

    print('content: $content');

    switch (type) {
      case 'Vận hành xe':
        return TaskAssignmentVehicleAdd(
          data: widget.data,
          order: widget.order,
          content: content,
        );
      case 'Vận hành xúc':
      case 'Vận hành khoan':
      case 'Vận hành gạt':
      case 'Vận hành xe phục vụ':
        return TaskAssignmentCommonAdd(
          data: widget.data,
          order: widget.order,
          content: content,
        );
      default:
        return TaskAssignmentOtherAdd(
          data: widget.data,
          order: widget.order,
          content: content,
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final user =
        Provider.of<UserProvider>(
          context,
          listen: false,
        ).user;
    final role = user?.role;
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        title: Text(
          widget.data.name,
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        iconTheme: IconThemeData(
          color: Colors.white, // Màu icon trên AppBar
        ),
      ),
      body:
          role == "dispatcher"
              ? DispatcherAssignmentAdd(
                data: widget.data,
                order: widget.order,
              )
              : _isLoading
              ? Center(child: CircularProgressIndicator())
              : _getBody(),
    );
  }
}
