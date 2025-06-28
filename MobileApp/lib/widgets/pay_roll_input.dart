import 'package:flutter/material.dart';
import 'package:soft/models/user_model.dart';
import 'package:soft/services/user_service.dart';


class PayRollInput extends StatefulWidget {
  final String title;
  final Function(UserModel?) onSelectUser;
  final String? initialPayroll;

  const PayRollInput({
    super.key,
    required this.title,
    required this.onSelectUser,
    this.initialPayroll,
  });

  @override
  State<StatefulWidget> createState() =>
      _PayRollInputState();
}

class _PayRollInputState extends State<PayRollInput> {
  UserModel? _user;
  final TextEditingController _codeController =
      TextEditingController();
  @override
  void initState() {
    super.initState();
    _codeController.text = widget.initialPayroll ?? '';
    if (_codeController.text.isNotEmpty) {
      getUser();
    }
  }

  final AuthService _userService = AuthService();

  void getUser() async {
    String code = _codeController.text.trim();

    var result = await _userService.getUser(code);
    print(result);

    if (!mounted) return;
    if (result['status'] == 'error') {
      setState(() {
        _user = null;
      });
      widget.onSelectUser(null);
    } else {
      var data = result['data'];

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
                text: _user?.fullName ?? '',
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
