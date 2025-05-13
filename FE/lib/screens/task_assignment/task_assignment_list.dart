import 'package:flutter/material.dart';
import 'package:job_manager/providers/user_provider.dart';
import 'package:job_manager/routes/task_assignment_route.dart';
import 'package:job_manager/widgets/task_assignment_item.dart';
import 'package:provider/provider.dart';

class TaskAssignmentList extends StatefulWidget {
  const TaskAssignmentList({super.key});

  @override
  State<StatefulWidget> createState() =>
      _TaskAssignmentList();
}

class _TaskAssignmentList
    extends State<TaskAssignmentList> {
  final List<Map<String, dynamic>> _allData = [
    {
      'title': 'Bảo dưỡng, sửa chữa xe',
      'time': '19/07/2022 15:00:00',
      'description':
          'Bảo dưỡng, sửa chữa xe cẩu, xe nâng kéo, xe nâng hạ lốp, xe nâng hàng',
      'status': 'Chưa nhận lệnh',
    },
    {
      'title': 'Điều hành sản xuất',
      'time': '19/07/2022 15:00:00',
      'description': 'Điều hành sản xuất',
      'status': 'Đã nhận lệnh',
    },
    {
      'title': 'Vận hành xúc (Khoan, giặt...)',
      'time': '19/07/2022 15:00:00',
      'description': 'Vận hành xúc (Khoan, giặt...)',
      'status': 'Đã kết thúc lệnh',
    },
    {
      'title': 'Bảo dưỡng, sửa chữa xe',
      'time': '19/07/2022 15:00:00',
      'description':
          'Bảo dưỡng, sửa chữa xe cẩu, xe nâng kéo, xe nâng hạ lốp, xe nâng hàng',
      'status': 'Chưa nhận lệnh',
    },
    {
      'title': 'Điều hành sản xuất',
      'time': '19/07/2022 15:00:00',
      'description': 'Điều hành sản xuất',
      'status': 'Đã nhận lệnh',
    },
    {
      'title': 'Vận hành xúc (Khoan, giặt...)',
      'time': '19/07/2022 15:00:00',
      'description': 'Vận hành xúc (Khoan, giặt...)',
      'status': 'Đã kết thúc lệnh',
    },
    {
      'title': 'Bảo dưỡng, sửa chữa xe',
      'time': '19/07/2022 15:00:00',
      'description':
          'Bảo dưỡng, sửa chữa xe cẩu, xe nâng kéo, xe nâng hạ lốp, xe nâng hàng',
      'status': 'Chưa nhận lệnh',
    },
    {
      'title': 'Điều hành sản xuất',
      'time': '19/07/2022 15:00:00',
      'description': 'Điều hành sản xuất',
      'status': 'Đã nhận lệnh',
    },
    {
      'title': 'Vận hành xúc (Khoan, giặt...)',
      'time': '19/07/2022 15:00:00',
      'description': 'Vận hành xúc (Khoan, giặt...)',
      'status': 'Đã kết thúc lệnh',
    },
  ];
  @override
  Widget build(BuildContext context) {
    final user =
        Provider.of<UserProvider>(
          context,
          listen: false,
        ).user;
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        automaticallyImplyLeading: false,
        leading: IconButton(
          icon: Icon(
            Icons.replay_outlined,
            color: Colors.white,
          ),
          onPressed: () {},
        ),
        title: Text(
          'Giao việc',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        actions: [
          if (user != null && user['role'] == 'admin')
            IconButton(
              onPressed: () {
                Navigator.pushNamed(
                  context,
                  TaskAssignmentRoutes.taskAssignmentType,
                );
              },
              icon: Icon(Icons.add, color: Colors.white),
            ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children:
              _allData
                  .map((item) => TaskAssignItem(data: item))
                  .toList(),
        ),
      ),
    );
  }
}
