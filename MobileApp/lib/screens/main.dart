import 'dart:async';

import 'package:flutter/material.dart';
import 'package:soft/providers/user_provider.dart';
import 'package:soft/routes/app_routes.dart';
import 'package:soft/routes/report_routes.dart';
import 'package:soft/routes/task_assignment_route.dart';
import 'package:soft/screens/setting/setting_page.dart';
import 'package:soft/screens/work_log/routes/routes.dart';
import 'package:provider/provider.dart';
import 'package:soft/services/update_version_service.dart';

class MyPage extends StatefulWidget {
  const MyPage({super.key});

  @override
  State<StatefulWidget> createState() {
    return MyHomePageState();
  }
}

class MyHomePageState extends State<MyPage> {
  int selectedIndex = 0;
  // bool _hasShownPhoneDialog = false;
  Timer? _checkTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      UpdateVersionService.checkForUpdate(context);
    });
  }

  @override
  void dispose() {
    _checkTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user =
        Provider.of<UserProvider>(
          context,
          listen: false,
        ).user;
    final role = user?.role;

    final items = <BottomNavigationBarItem>[
      // const BottomNavigationBarItem(
      //   icon: Icon(Icons.zoom_out_map),
      //   label: "Bản đồ",
      // ),
      const BottomNavigationBarItem(
        icon: Icon(Icons.check_circle_outline),
        label: "Công việc",
      ),
      if (['admin', 'dispatcher', 'manager'].contains(role))
        const BottomNavigationBarItem(
          icon: Icon(Icons.badge_outlined),
          label: "Giao việc",
        ),
      if (['admin', 'dispatcher', 'manager'].contains(role))
        const BottomNavigationBarItem(
          icon: Icon(Icons.file_copy_outlined),
          label: "Báo cáo",
        ),
      const BottomNavigationBarItem(
        icon: Icon(Icons.settings),
        label: "Cài đặt",
      ),
    ];
    return Scaffold(
      body: getBody(role),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: selectedIndex,
        selectedItemColor: Colors.blue,
        items: items,
        onTap: onTapHandler,
      ),
    );
  }

  Widget getBody(String? role) {
    final bodyList = <Widget>[
      // HomeWrapper(),
      WorkLogRoute(),
      if (['admin', 'dispatcher', 'manager'].contains(role))
        TaskAssignmentRoute(),
      if (['admin', 'dispatcher', 'manager'].contains(role))
        ReportRoute(),
      SettingPage(),
    ];
    return bodyList[selectedIndex];
  }

  void onTapHandler(int index) {
    setState(() {
      selectedIndex = index;
    });
  }
}
