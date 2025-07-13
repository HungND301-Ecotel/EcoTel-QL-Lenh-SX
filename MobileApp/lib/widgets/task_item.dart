import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:soft/models/order_model.dart';
import 'package:soft/screens/work_log/routes/routes.dart';

class TaskItem extends StatelessWidget {
  final OrderModel data;

  const TaskItem({super.key, required this.data});

  Color getStatusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.grey;
      case 'in_progress':
        return Colors.green;
      case 'warning':
        return Colors.yellow.shade800;
      case 'cancel':
        return Colors.purple.shade800;
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
            WorkLogRoutes.taskDetailPage,
            arguments: data.id,
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
                data.status == "warning"
                    ? Icons.warning
                    : Icons.mark_as_unread_outlined,
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
                    data.job.name,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.black,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    DateFormat(
                      'dd/MM/yyyy',
                    ).format(data.workingDate),
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey,
                    ),
                  ),
                  Text(
                    "${data.assignedTo.salaryCode} ${data.assignedTo.fullName ?? ''}",
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey,
                    ),
                  ),
                  Text(
                    data.workContent ?? '',
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
