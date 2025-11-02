import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:soft/providers/user_provider.dart';
import 'package:soft/routes/app_routes.dart';
import 'package:soft/services/user_service.dart';

class Changepass extends StatefulWidget {
  const Changepass({super.key});

  @override
  State<StatefulWidget> createState() => _Changepass();
}

class _Changepass extends State<Changepass> {
  bool _obscurePassword = false;
  final TextEditingController _oldpassController =
      TextEditingController();
  final TextEditingController _newpassController =
      TextEditingController();
  final TextEditingController _repassController =
      TextEditingController();

  final AuthService _authService = AuthService();

  void changePass() async {
    String oldpass = _oldpassController.text.trim();
    String newpass = _newpassController.text.trim();
    String repass = _repassController.text.trim();
    var result = await _authService.changepass(
      oldpass,
      newpass,
      repass,
    );
    if (!mounted) return;
    if (result['status'] == 'error') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message']),
          backgroundColor: Colors.red,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
              "Đổi mật khẩu thành công. Quay lại đăng nhập."),
          backgroundColor: Colors.green,
        ),
      );
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('user');
      await prefs.remove('token');

      // Lấy context để gọi Provider
      final userProvider = Provider.of<UserProvider>(
        context,
        listen: false,
      );
      await userProvider.clearUser();

      // Điều hướng về login (chỉ khi đang ở trang khác)
      Navigator.of(
        context,
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
        backgroundColor: Colors.blue,
        title: Text(
          'Đổi mật khẩu',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        iconTheme: IconThemeData(
          color: Colors.white, // Màu icon trên AppBar
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: 10,
          vertical: 20,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Để tăng tính bảo mật, mật khẩu nên bao gồm cả chữ, số và ký tự đặc biệt, không nên chứa năm sinh, hay số điện thoại của bạn.',
            ),
            SizedBox(height: 20),
            Text(
              'Nhập mật khẩu cũ',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            TextField(
              controller: _oldpassController,
              obscureText: _obscurePassword,
              decoration: InputDecoration(
                hintText: 'Nhập mật khẩu hiện tại',
                suffixIcon: IconButton(
                  icon: Icon(
                    _obscurePassword
                        ? Icons.visibility_off
                        : Icons.visibility,
                  ),
                  onPressed: () {
                    setState(() {
                      _obscurePassword = !_obscurePassword;
                    });
                  },
                ),
              ),
            ),
            SizedBox(height: 20),
            Text(
              'Nhập mật khẩu mới',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            TextField(
              controller: _newpassController,
              obscureText: _obscurePassword,
              decoration: InputDecoration(
                hintText: 'Nhập mật khẩu mới',
                suffixIcon: IconButton(
                  icon: Icon(
                    _obscurePassword
                        ? Icons.visibility_off
                        : Icons.visibility,
                  ),
                  onPressed: () {
                    setState(() {
                      _obscurePassword = !_obscurePassword;
                    });
                  },
                ),
              ),
            ),
            SizedBox(height: 20),
            TextField(
              controller: _repassController,
              obscureText: _obscurePassword,
              decoration: InputDecoration(
                hintText: 'Nhập lại mật khẩu mới',
                suffixIcon: IconButton(
                  icon: Icon(
                    _obscurePassword
                        ? Icons.visibility_off
                        : Icons.visibility,
                  ),
                  onPressed: () {
                    setState(() {
                      _obscurePassword = !_obscurePassword;
                    });
                  },
                ),
              ),
            ),
            SizedBox(height: 20),
            Center(
              child: ElevatedButton(
                onPressed: changePass,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  foregroundColor: Colors.white,
                  padding: EdgeInsets.symmetric(
                    vertical: 15,
                    horizontal: 30,
                  ),
                ),
                child: Text(
                  'Cập nhật',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
