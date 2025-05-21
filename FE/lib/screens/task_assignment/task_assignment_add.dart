import 'package:flutter/material.dart';
import 'package:soft/models/order_model.dart';
import 'package:soft/models/task_model.dart';
import 'package:soft/screens/task_assignment/task_assignment_type/task_assignment_common.dart';
import 'package:soft/screens/task_assignment/task_assignment_type/task_assignment_vehicle.dart';
import 'package:soft/screens/task_assignment/task_assignment_type/task_assignment_other.dart';

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
  Widget _getBody() {
    final type = widget.data.typeId.name;

    switch (type) {
      case 'Vận hành xe':
        return TaskAssignmentVehicle(
          data: widget.data,
          order: widget.order,
        );
      case 'Vận hành xúc':
      case 'Vận hành khoan':
      case 'Vận hành gạt':
      case 'Vận hành xe phục vụ':
        return TaskAssignmentCommon(
          data: widget.data,
          order: widget.order,
        );
      default:
        return TaskAssignmentOther(
          data: widget.data,
          order: widget.order,
        );
    }
  }

  @override
  Widget build(BuildContext context) {
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
      body: _getBody(),
    );
  }
}
