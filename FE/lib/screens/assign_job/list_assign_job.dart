import 'package:flutter/material.dart';
import 'package:job_manager/routes/assign_job_route.dart';
import 'package:job_manager/widgets/assign_jon_item.dart';

class ListAssignJob extends StatefulWidget {
  const ListAssignJob({super.key});

  @override
  State<StatefulWidget> createState() => _ListAssignJob();
}

class _ListAssignJob extends State<ListAssignJob> {
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
          IconButton(
            onPressed: () {
              Navigator.pushNamed(
                context,
                AssignJobRoutes.list_job,
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
                  .map((item) => AssignJobItem(data: item))
                  .toList(),
        ),
      ),
    );
  }
}
