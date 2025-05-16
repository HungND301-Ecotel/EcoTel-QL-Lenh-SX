import 'package:flutter/material.dart';
import 'package:job_manager/models/task_model.dart';
import 'package:job_manager/screens/task_assignment/task_assignment_type/task_assignment_common.dart';
import 'package:job_manager/screens/task_assignment/task_assignment_type/task_assignment_excavator.dart';
import 'package:job_manager/screens/task_assignment/task_assignment_type/task_assignment_other.dart';

class TaskAssignmentAdd extends StatefulWidget {
  final TaskModel data;
  const TaskAssignmentAdd({super.key, required this.data});

  @override
  State<StatefulWidget> createState() =>
      _TaskAssignmentAdd();
}

class _TaskAssignmentAdd extends State<TaskAssignmentAdd> {
  Widget _getBody() {
    final type = widget.data.typeId.name;

    switch (type) {
      case 'Vận hành xúc':
        return TaskAssignmentExcavator(data: widget.data);
      case 'Vận hành xe':
      case 'Vận hành khoan':
      case 'Vận hành gạt':
      case 'Vận hành xe phục vụ':
        return TaskAssignmentCommon(data: widget.data);
      default:
        return TaskAssignmentOther(data: widget.data);
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
