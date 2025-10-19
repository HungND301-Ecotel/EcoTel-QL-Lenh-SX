import 'package:flutter/material.dart';
import 'package:soft/models/user_model.dart';
import 'package:soft/providers/user_provider.dart';
import 'package:soft/routes/app_routes.dart';
import 'package:soft/services/notification_service.dart';
import 'package:soft/services/user_service.dart';
import 'package:provider/provider.dart';
import 'package:package_info_plus/package_info_plus.dart';

class SignIn extends StatefulWidget {
  const SignIn({super.key});

  @override
  State<StatefulWidget> createState() => _SignInState();
}

class _SignInState extends State<SignIn> {
  final _formKey = GlobalKey<FormState>();
  bool _obscurePassword = true;
  bool _submitting = false;
  PackageInfo? _info;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final info = await PackageInfo.fromPlatform();
    if (!mounted) return;
    setState(() => _info = info);
  }

  final TextEditingController _usernameController =
      TextEditingController();
  final TextEditingController _passwordController =
      TextEditingController();

  final AuthService _authService = AuthService();

  InputDecoration _inputDecoration({
    required String label,
    IconData? icon,
    Widget? suffix,
  }) {
    return InputDecoration(
      labelText: label,
      prefixIcon: icon != null ? Icon(icon) : null,
      suffixIcon: suffix,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: BorderSide(color: Colors.grey.shade300),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(
          color: Colors.blue,
          width: 2,
        ),
      ),
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(
        horizontal: 14,
        vertical: 14,
      ),
    );
  }

  Future<void> signin() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;

    setState(() => _submitting = true);
    try {
      final username = _usernameController.text.trim();
      final password = _passwordController.text.trim();

      final result = await _authService.signin(
        username,
        password,
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
        final user = result['data']['user'];
        final token = result['data']['token'];
        final userModel = UserModel.fromJson(user);
        String? fcmToken =
            await NotificationService.getToken();

        Provider.of<UserProvider>(
          context,
          listen: false,
        ).setUser(userModel, token);
        if (fcmToken != null) {
          await AuthService().saveToken(fcmToken);
        }

        Navigator.pushNamedAndRemoveUntil(
          context,
          AppRoute.main,
          (route) => false,
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final i = _info;
    return Scaffold(
      backgroundColor: const Color(0xFFF6F7FB),
      body: SafeArea(
        child: Stack(
          children: [
            Padding(
              padding: const EdgeInsets.only(
                top: 50,
                left: 30,
                right: 30,
              ),
              child: SingleChildScrollView(
                child: Column(
                  children: <Widget>[
                    Image.asset(
                      'assets/logo.png',
                      width: 200,
                      height: 200,
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Đăng nhập',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 20),

                    // CARD FORM
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius:
                            BorderRadius.circular(14),
                        border: Border.all(
                          color: Colors.grey.shade300,
                          width: 1,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(
                              0.05,
                            ),
                            blurRadius: 10,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: Form(
                        key: _formKey,
                        autovalidateMode: AutovalidateMode
                            .onUserInteraction,
                        child: Column(
                          children: [
                            TextFormField(
                              controller:
                                  _usernameController,
                              textInputAction:
                                  TextInputAction.next,
                              decoration: _inputDecoration(
                                label: 'Tên truy cập',
                                icon: Icons
                                    .account_circle_outlined,
                              ),
                              validator: (v) {
                                if (v == null ||
                                    v.trim().isEmpty) {
                                  return 'Vui lòng nhập tên truy cập';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),
                            TextFormField(
                              controller:
                                  _passwordController,
                              obscureText: _obscurePassword,
                              obscuringCharacter: '•',
                              textInputAction:
                                  TextInputAction.done,
                              onFieldSubmitted: (_) =>
                                  signin(),
                              decoration: _inputDecoration(
                                label: 'Mật khẩu',
                                icon: Icons.lock_outline,
                                suffix: IconButton(
                                  icon: Icon(
                                    _obscurePassword
                                        ? Icons
                                            .visibility_off
                                        : Icons.visibility,
                                  ),
                                  onPressed: () =>
                                      setState(() {
                                    _obscurePassword =
                                        !_obscurePassword;
                                  }),
                                ),
                              ),
                              validator: (v) {
                                if (v == null ||
                                    v.isEmpty) {
                                  return 'Vui lòng nhập mật khẩu';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 10),
                            Row(
                              mainAxisAlignment:
                                  MainAxisAlignment.end,
                              children: [
                                TextButton(
                                  onPressed: () =>
                                      Navigator.pushNamed(
                                    context,
                                    AppRoute.register,
                                  ),
                                  child: const Text(
                                    'Đăng ký',
                                    style: TextStyle(
                                      color: Colors.blue,
                                      fontWeight:
                                          FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 24),

                    // BUTTON
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed:
                            _submitting ? null : signin,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue,
                          foregroundColor: Colors.white,
                          padding:
                              const EdgeInsets.symmetric(
                            vertical: 12,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius:
                                BorderRadius.circular(
                              12,
                            ),
                          ),
                          elevation: 2,
                        ),
                        icon: _submitting
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child:
                                    CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Icon(Icons.login),
                        label: Text(
                          _submitting
                              ? 'Đang đăng nhập...'
                              : 'Đăng nhập',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                  ],
                ),
              ),
            ),
            if (i != null)
              Positioned(
                top: 10,
                right: 12,
                child: Text(
                  'v${i.version} (${i.buildNumber})',
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
