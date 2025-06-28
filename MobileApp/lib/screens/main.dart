import 'dart:async';

import 'package:flutter/material.dart';
import 'package:soft/providers/user_provider.dart';
import 'package:soft/routes/app_routes.dart';
import 'package:soft/routes/home__route.dart';
import 'package:soft/routes/report_routes.dart';
import 'package:soft/routes/task_assignment_route.dart';
import 'package:soft/screens/setting/setting_page.dart';
import 'package:soft/screens/work_log/routes/routes.dart';
import 'package:provider/provider.dart';

class MyPage extends StatefulWidget {
  const MyPage({super.key});

  @override
  State<StatefulWidget> createState() {
    return MyHomePageState();
  }
}

class MyHomePageState extends State<MyPage> {
  int selectedIndex = 0;
  bool _hasShownPhoneDialog = false;
  Timer? _checkTimer;

  @override
  void initState() {
    super.initState();
    Future.microtask(() async {
      if (!mounted) return;

      final userProvider = Provider.of<UserProvider>(
        context,
        listen: false,
      );
      await userProvider.loadToken();
      _checkPhone(userProvider);

      // Khởi động timer kiểm tra mỗi 30s
      _checkTimer = Timer.periodic(Duration(hours: 3), (_) {
        if (!mounted) return;
        _checkPhone(userProvider);
      });
    });
  }

  void _checkPhone(UserProvider userProvider) {
    final user = userProvider.user;
    if (!_hasShownPhoneDialog &&
        user != null &&
        (user.phone == null || user.phone!.isEmpty)) {
      _hasShownPhoneDialog = true;

      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        _showPhoneDialog();
      });
    }
  }

  @override
  void dispose() {
    _checkTimer?.cancel();
    super.dispose();
  }

  void _showPhoneDialog() {
    if (!mounted) return;
    showDialog(
      context: context,
      builder:
          (_) => AlertDialog(
            title: Row(
              children: [
                Icon(
                  Icons.contact_support_outlined,
                  color: Colors.blue,
                  size: 30,
                ),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    "Cập nhật điện thoại",
                    style: TextStyle(fontSize: 20),
                  ),
                ),
              ],
            ),
            content: Text(
              "Để thuận tiện cho việc liên lạc, bạn cần cập nhật số điện thoại của bạn.",
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(context).pop();
                  _hasShownPhoneDialog = false;
                },
                style: TextButton.styleFrom(
                  foregroundColor: Colors.blue,
                ),
                child: Text("Bỏ qua"),
              ),
              TextButton(
                onPressed: () {
                  Navigator.pushNamed(
                    context,
                    AppRoute.addPhone,
                  );
                },
                style: TextButton.styleFrom(
                  foregroundColor: Colors.blue,
                ),
                child: Text("Cập nhật"),
              ),
            ],
          ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user =
        Provider.of<UserProvider>(
          context,
          listen: false,
        ).user;
    final role = user?.role;
    print('role $role');

    final items = <BottomNavigationBarItem>[
      const BottomNavigationBarItem(
        icon: Icon(Icons.zoom_out_map),
        label: "Bản đồ",
      ),
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
      HomeWrapper(),
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
