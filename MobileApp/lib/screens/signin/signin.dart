import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'form_login.dart';
import 'form_forget_password.dart';

class SignIn extends StatefulWidget {
  const SignIn({super.key});

  @override
  State<StatefulWidget> createState() => _SignInState();
}

class _SignInState extends State<SignIn> {
  PackageInfo? _info;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final info = await PackageInfo.fromPlatform();
    if (mounted) setState(() => _info = info);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F7FB),
      body: SafeArea(
        child: Stack(
          children: [
            Padding(
              padding: const EdgeInsets.only(
                  top: 50, left: 30, right: 30),
              child: DefaultTabController(
                length: 2,
                child: Column(
                  children: [
                    Image.asset(
                      'assets/logo.png',
                      width: 200,
                      height: 200,
                    ),
                    const SizedBox(height: 16),

                    /// TAB BAR
                    TabBar(
                      isScrollable: false,
                      indicatorColor: Colors.blue,
                      tabs: const [
                        Tab(text: "Đăng nhập"),
                        Tab(text: "Quên mật khẩu"),
                      ],
                    ),

                    const SizedBox(height: 16),

                    /// TAB VIEW (phải có Expanded)
                    Expanded(
                      child: TabBarView(
                        children: [
                          FormLogin(),
                          FormForgetPassword(),
                        ],
                      ),
                    )
                  ],
                ),
              ),
            ),

            /// Hiển thị version app
            if (_info != null)
              Positioned(
                top: 10,
                right: 12,
                child: Text(
                  'v${_info!.version} (${_info!.buildNumber})',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade600,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
