import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:soft/models/order_model.dart';
import 'package:soft/models/task_model.dart';
import 'package:soft/providers/user_provider.dart';
import 'package:soft/screens/task_assignment/task_assignment_type_transfer/dispatcher_assignment_transfer.dart';
import 'package:soft/screens/task_assignment/task_assignment_type_transfer/task_assignment_common_transfer.dart';
import 'package:soft/screens/task_assignment/task_assignment_type_transfer/task_assignment_maintence_transfer.dart';
import 'package:soft/screens/task_assignment/task_assignment_type_transfer/task_assignment_other_transfer.dart';
import 'package:soft/screens/task_assignment/task_assignment_type_transfer/task_assignment_vehicle_transfer.dart';

class TaskAssignmentTransfer extends StatefulWidget {
  final TaskModel data;
  final OrderModel? order;
  const TaskAssignmentTransfer({
    super.key,
    required this.data,
    this.order,
  });

  @override
  State<StatefulWidget> createState() =>
      _TaskAssignmentTransfer();
}

class _TaskAssignmentTransfer
    extends State<TaskAssignmentTransfer> {
  Widget _getBody() {
    final type = widget.data.type;

    switch (type) {
      case 'Vận hành xe':
        return TaskAssignmentVehicleTransfer(
          data: widget.data,
          order: widget.order,
        );
      case 'Vận hành xúc':
      case 'Vận hành khoan':
      case 'Vận hành gạt':
      case 'Vận hành xe phục vụ':
        return TaskAssignmentCommonAddTransfer(
          data: widget.data,
          order: widget.order,
        );
      case 'Sửa chữa, bảo dưỡng':
        return TaskAssignmentMaintenceTransfer(
          data: widget.data,
          order: widget.order,
        );
      default:
        return TaskAssignmentOtherTransfer(
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
              ? DispatcherAssignmentTransfer(
                data: widget.data,
                order: widget.order,
              )
              : _getBody(),
    );
  }
}
