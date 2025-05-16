import 'package:flutter/material.dart';
import 'package:job_manager/models/user_model.dart';
import 'package:job_manager/services/payroll_service.dart';

class PayRollInput extends StatefulWidget {
  final String title;
  final Function(UserModel) onSelectUser;

  const PayRollInput({
    super.key,
    required this.title,
    required this.onSelectUser,
  });

  @override
  State<StatefulWidget> createState() =>
      _PayRollInputState();
}

class _PayRollInputState extends State<PayRollInput> {
  UserModel? _user;
  final TextEditingController _codeController =
      TextEditingController();

  final PayrollService _payrollService = PayrollService();

  void getUser() async {
    String code = _codeController.text.trim();

    var result = await _payrollService.getUserByCode(code);

    if (!mounted) return;
    if (result['status'] == 'error') {
      setState(() {
        _user = null;
      });
    } else {
      var data = result['data']['userId'];
      setState(() {
        _user = UserModel.fromJson(data);
        widget.onSelectUser(UserModel.fromJson(data));
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text.rich(
          TextSpan(
            text: widget.title,
            style: TextStyle(fontWeight: FontWeight.bold),
            children: [
              TextSpan(text: '  '),
              TextSpan(
                text: _user?.name ?? '',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                ),
              ),
            ],
          ),
        ),
        TextField(
          controller: _codeController,
          onChanged: (value) {
            if (value.isNotEmpty) {
              getUser();
            }
          },
        ),
      ],
    );
  }
}
