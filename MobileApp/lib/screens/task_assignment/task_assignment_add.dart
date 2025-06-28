import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:soft/models/order_model.dart';
import 'package:soft/models/task_model.dart';
import 'package:soft/providers/user_provider.dart';
import 'package:soft/screens/task_assignment/dispatcher/dispatcher_assignment_add.dart';
import 'package:soft/screens/task_assignment/task_assignment_type_add/task_assignment_common_add.dart';
import 'package:soft/screens/task_assignment/task_assignment_type_add/task_assignment_other_add.dart';
import 'package:soft/screens/task_assignment/task_assignment_type_add/task_assignment_vehicle_add.dart';

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
    final type = widget.data.type;

    switch (type) {
      case 'Vận hành xe':
        return TaskAssignmentVehicleAdd(
          data: widget.data,
          order: widget.order,
        );
      case 'Vận hành xúc':
      case 'Vận hành khoan':
      case 'Vận hành gạt':
      case 'Vận hành xe phục vụ':
        return TaskAssignmentCommonAdd(
          data: widget.data,
          order: widget.order,
        );
      default:
        return TaskAssignmentOtherAdd(
          data: widget.data,
          order: widget.order,
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
              : _getBody(),
    );
  }
}
