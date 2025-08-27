import 'package:flutter/material.dart';
import 'package:soft/providers/user_provider.dart';
import 'package:soft/routes/app_routes.dart';
import 'package:provider/provider.dart';
import 'package:soft/services/user_service.dart';

class SettingPage extends StatefulWidget {
  const SettingPage({super.key});

  @override
  State<SettingPage> createState() => _SettingPageState();
}

class _SettingPageState extends State<SettingPage> {
  final AuthService _authService = AuthService();

  void deleteUser() async {
    var result = await _authService.deleteUser();
    if (!mounted) return;
    if (result['status'] == 'error') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message']),
          backgroundColor: Colors.red,
        ),
      );
    } else {
      await Provider.of<UserProvider>(
        context,
        listen: false,
      ).clearUser();
      Navigator.of(
        context,
        rootNavigator: true,
      ).pushNamedAndRemoveUntil(
        AppRoute.signin,
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          "Cài đặt",
          style: TextStyle(color: Colors.white),
        ),
        centerTitle: true,
        automaticallyImplyLeading: false,
        backgroundColor: Colors.blue,
      ),
      body: Column(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Text(
                    "Tài khoản ",
                    style: TextStyle(
                      color: Colors.blue,
                      fontSize: 18,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                TextButton(
                  onPressed: () {
                    Navigator.pushNamed(
                      context,
                      AppRoute.changePass,
                    );
                  },
                  style: TextButton.styleFrom(
                    padding: EdgeInsets.symmetric(
                      vertical: 16,
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment:
                        MainAxisAlignment.spaceBetween,
                    children: [
                      SizedBox(
                        width: 60,
                        child: Icon(
                          Icons.key,
                          size: 25,
                          color: Colors.orange,
                        ),
                      ),
                      Expanded(
                        child: Text(
                          "Đổi mật khẩu",
                          style: TextStyle(
                            color: Colors.black,
                          ),
                        ),
                      ),
                      SizedBox(
                        width: 30,
                        child: Icon(
                          Icons.arrow_forward_ios,
                          size: 15,
                          color: Colors.black,
                        ),
                      ),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: () async {
                    await Provider.of<UserProvider>(
                      context,
                      listen: false,
                    ).clearUser();
                    Navigator.of(
                      context,
                      rootNavigator: true,
                    ).pushNamedAndRemoveUntil(
                      AppRoute.signin,
                      (route) => false,
                    );
                  },
                  style: TextButton.styleFrom(
                    padding: EdgeInsets.symmetric(
                      vertical: 16,
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment:
                        MainAxisAlignment.spaceBetween,
                    children: [
                      SizedBox(
                        width: 60,
                        child: Icon(
                          Icons.logout,
                          size: 25,
                          color: Colors.yellow,
                        ),
                      ),
                      Expanded(
                        child: Text(
                          "Đăng xuất",
                          style: TextStyle(
                            color: Colors.black,
                          ),
                        ),
                      ),
                      SizedBox(
                        width: 30,
                        child: Icon(
                          Icons.arrow_forward_ios,
                          size: 15,
                          color: Colors.black,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          SizedBox(
            width: double.infinity,
            child: TextButton(
              onPressed: () {
                showDialog(
                  context: context,
                  builder:
                      (_) => AlertDialog(
                        title: Text('Xóa người dùng.'),
                        content: Text(
                          'Dữ liệu người dùng của bạn sẽ bị xóa vĩnh viễn. Bạn có chắc chắn muốn xóa?',
                        ),
                        actions: [
                          TextButton(
                            onPressed: (){
                              Navigator.pop(context);
                            },
                            child: const Text('Hủy'),
                          ),
                          TextButton(
                            onPressed: deleteUser,
                            child: const Text('Xác nhận'),
                          ),
                        ],
                      ),
                );
              },
              style: TextButton.styleFrom(
                padding: EdgeInsets.symmetric(vertical: 16),
                backgroundColor: Colors.blue,
                foregroundColor: Colors.white,
              ),
              child: Text(
                'Xóa tài khoản',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
