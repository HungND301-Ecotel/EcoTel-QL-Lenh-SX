import 'package:flutter/material.dart';
import 'package:job_manager/routes/assign_job_route.dart';

class AssignJobItem extends StatelessWidget {
  final Map<String, dynamic> data;

  const AssignJobItem({super.key, required this.data});

  Color getStatusColor(String status) {
    switch (status) {
      case 'Chưa nhận lệnh':
        return Colors.grey;
      case 'Đã nhận lệnh':
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
            AssignJobRoutes.job_detail,
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
                color: getStatusColor(data['status']),
                size: 25,
              ),
            ),
            Expanded(
              child: Column(
                crossAxisAlignment:
                    CrossAxisAlignment.start,
                children: [
                  Text(
                    data['title'] ?? '',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.black,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 6),
                  Text(
                    data['time'] ?? '',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey,
                    ),
                  ),
                  SizedBox(height: 6),
                  Text(
                    data['description'] ?? '',
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
