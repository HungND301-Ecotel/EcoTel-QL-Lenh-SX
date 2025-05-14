import 'package:flutter/material.dart';
import 'package:job_manager/services/payroll_service.dart';

class PayRollInput extends StatefulWidget {
  final String title;
  final Function(Map<String, dynamic>) onSelectUser;

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
  Map<String, dynamic> _user = {};
  final TextEditingController _codeController =
      TextEditingController();

  final PayrollService _payrollService = PayrollService();

  void getUser() async {
    String code = _codeController.text.trim();

    var result = await _payrollService.getUserByCode(code);

    if (!mounted) return;
    if (result['status'] == 'error') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message']),
          backgroundColor: Colors.red,
        ),
      );
    } else {
      var data = result['data'];
      setState(() {
        _user = data ?? {};
        widget.onSelectUser(data ?? {});
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
                text:
                    _user.isNotEmpty &&
                            _user['userId'] != null
                        ? _user['userId']['name']
                        : '',
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
