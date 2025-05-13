import 'package:flutter/material.dart';
import 'package:job_manager/widgets/task_item.dart';

class TaskListPage extends StatefulWidget {
  const TaskListPage({super.key});

  @override
  State<StatefulWidget> createState() => _TaskListPage();
}

class _TaskListPage extends State<TaskListPage> {
  final List<Map<String, dynamic>> taskList = [
    {
      'title': 'Vận hành xe',
      'time': '19/07/2022 15:00:00',
      'description':
          'Bảo dưỡng, sửa chữa xe cẩu, xe nâng kéo, xe nâng hạ lốp, xe nâng hàng',
      'status': 'Chưa nhận lệnh',
      'type': 'Vận hành xe',
      'sign': 'HDBN-2025',
      'category': 'trực tiếp',
    },
    {
      'title': 'Vận hành xúc',
      'time': '19/07/2022 15:00:00',
      'description':
          'Bảo dưỡng, sửa chữa xe cẩu, xe nâng kéo, xe nâng hạ lốp, xe nâng hàng',
      'status': 'Đã kết thúc lệnh',
      'type': 'Vận hành xúc',
      'sign': 'HDBN-2026',
      'category': 'trực tiếp',
    },
    {
      'title': 'Vận hành khoan',
      'time': '19/07/2022 15:00:00',
      'description':
          'Bảo dưỡng, sửa chữa xe cẩu, xe nâng kéo, xe nâng hạ lốp, xe nâng hàng',
      'status': 'Đã nhận lệnh',
      'type': 'Vận hành khoan',
      'sign': 'HDBN-2027',
      'category': 'trực tiếp',
    },
    {
      'title': 'Vận hành gạt',
      'time': '19/07/2022 15:00:00',
      'description':
          'Bảo dưỡng, sửa chữa xe cẩu, xe nâng kéo, xe nâng hạ lốp, xe nâng hàng',
      'status': 'Chưa nhận lệnh',
      'type': 'Vận hành gạt',
      'sign': 'HDBN-2028',
      'category': 'trực tiếp',
    },
    {
      'title': 'Vận hành xe phục vụ',
      'time': '19/07/2022 15:00:00',
      'description':
          'Bảo dưỡng, sửa chữa xe cẩu, xe nâng kéo, xe nâng hạ lốp, xe nâng hàng',
      'status': 'Đã nhận lệnh',
      'type': 'Vận hành xe phục vụ',
      'sign': 'HDBN-2029',
      'category': 'trực tiếp',
    },
    {
      'title': 'Lao động',
      'time': '19/07/2022 15:00:00',
      'description':
          'Bảo dưỡng, sửa chữa xe cẩu, xe nâng kéo, xe nâng hạ lốp, xe nâng hàng',
      'status': 'Đã kết thúc lệnh',
      'type': 'Lao động',
      'sign': 'HDBN-2030',
      'category': 'gián tiếp',
    },
  ];
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        automaticallyImplyLeading: false,
        title: Text(
          'Công việc được giao',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            onPressed: () {},
            icon: Icon(
              Icons.replay_outlined,
              color: Colors.white,
            ),
          ),
        ],
      ),
      body: Column(
        children:
            taskList
                .map((item) => TaskItem(data: item))
                .toList(),
      ),
    );
  }
}
