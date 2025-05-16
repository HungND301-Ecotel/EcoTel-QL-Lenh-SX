import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:job_manager/models/order_model.dart';
import 'package:job_manager/routes/task_assignment_route.dart';

class TaskAssignItem extends StatelessWidget {
  final OrderModel data;

  const TaskAssignItem({super.key, required this.data});

  Color getStatusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.grey;
      case 'accepted':
        return Colors.green;
      default:
        return Colors.red;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: Colors.grey.shade200,
            width: 1,
          ),
        ),
      ),
      child: TextButton(
        onPressed: () {
          Navigator.pushNamed(
            context,
            TaskAssignmentRoutes.taskAssignmentDetail,
            arguments: data,
          );
        },
        style: TextButton.styleFrom(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.zero,
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 60,
              child: Icon(
                Icons.mark_as_unread_outlined,
                color: getStatusColor(data.status),
                size: 25,
              ),
            ),
            Expanded(
              child: Column(
                crossAxisAlignment:
                    CrossAxisAlignment.start,
                children: [
                  Text(
                    data.taskId.name,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.black,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    DateFormat(
                      'dd/MM/yyyy HH:mm:ss',
                    ).format(data.workingDate),
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey,
                    ),
                  ),
                  Text(
                    "${data.assignedTo.payroll?.code} ${data.assignedTo.name}",
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey,
                    ),
                  ),
                  Text(
                    data.description ?? '',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey,
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(
              width: 40,
              child: Icon(
                Icons.arrow_forward_ios_outlined,
                size: 15,
                color: Colors.grey,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
