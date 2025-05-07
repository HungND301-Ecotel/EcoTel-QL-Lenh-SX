import 'package:flutter/material.dart';
import 'package:job_manager/routes/assign_job_route.dart';
import 'package:job_manager/screens/assign_job/list_assign_job.dart';
import 'package:job_manager/screens/home/home_page.dart';
import 'package:job_manager/screens/job/job_page.dart';
import 'package:job_manager/screens/report/report_page.dart';
import 'package:job_manager/screens/setting/setting_page.dart';

class MyPage extends StatefulWidget {
  MyPage({Key? key}) : super(key: key);

  @override
  State<StatefulWidget> createState() {
    return MyHomePageState();
  }
}

class MyHomePageState extends State<MyPage> {
  int selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: getBody(),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: selectedIndex,
        selectedItemColor: Colors.blue,
        items: [
          BottomNavigationBarItem(
            icon: Icon(Icons.zoom_out_map),
            label: "Bản đồ",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.check_circle_outline),
            label: "Công việc",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.badge_outlined),
            label: "Giao việc",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.file_copy_outlined),
            label: "Báo cáo",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings),
            label: "Cài đặt",
          ),
        ],
        onTap: (int index) {
          onTapHandler(index);
        },
      ),
    );
  }

  Widget getBody() {
    if (selectedIndex == 0) {
      return HomePage();
    } else if (selectedIndex == 1) {
      return JobPage();
    } else if (selectedIndex == 2) {
      return AssignJobRoute();
    } else if (selectedIndex == 3) {
      return ReportPage();
    } else {
      return SettingPage();
    }
  }

  void onTapHandler(int index) {
    setState(() {
      selectedIndex = index;
    });
  }
}
