import 'package:flutter/material.dart';
import 'package:soft/models/user_model.dart';
import 'package:soft/providers/user_provider.dart';
import 'package:soft/routes/app_routes.dart';
import 'package:soft/services/user_service.dart';
import 'package:provider/provider.dart';

class AddPhonePage extends StatefulWidget {
  const AddPhonePage({super.key});

  @override
  State<StatefulWidget> createState() =>
      _AddPhonePageState();
}

class _AddPhonePageState extends State<AddPhonePage> {
  final TextEditingController _phoneController =
      TextEditingController();
  final GlobalKey<FormState> _formKey =
      GlobalKey<FormState>();
  final AuthService _authService = AuthService();

  void updatePhone() async {
    String phone = _phoneController.text.trim();
    var result = await _authService.update({
      'phone': phone,
    });

    if (!mounted) return;
    if (result['status'] == 'error') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message']),
          backgroundColor: Colors.red,
        ),
      );
    } else {
      final user = result['data'];
      final userModel = UserModel.fromJson(user);
      final userProvider = Provider.of<UserProvider>(
        context,
        listen: false,
      );
      final currentToken = userProvider.token;

      // Cập nhật lại user nhưng giữ token
      userProvider.setUser(userModel, currentToken!);
      Navigator.pop(context);
      Navigator.pushNamedAndRemoveUntil(
        context,
        AppRoute.main,
        (Route<dynamic> route) => false,
      );
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message']),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Nhập số điện thoại"),
        titleTextStyle: const TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w500,
          color: Colors.white,
        ),
        centerTitle: true,
        backgroundColor: Colors.blue,
        iconTheme: const IconThemeData(
          color:
              Colors
                  .white, // Change the color of the back button
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextFormField(
                controller: _phoneController,
                decoration: const InputDecoration(
                  labelText: "Nhập số điện thoại",
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return "Vui lòng nhập số điện thoại";
                  }
                  return null;
                },
              ),
              const SizedBox(height: 20),
              Align(
                alignment: Alignment.center,
                child: ElevatedButton(
                  onPressed: () {
                    if (_formKey.currentState!.validate()) {
                      updatePhone();
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(
                      vertical: 16,
                      horizontal: 32,
                    ),
                  ),
                  child: const Text("Lưu lại"),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
