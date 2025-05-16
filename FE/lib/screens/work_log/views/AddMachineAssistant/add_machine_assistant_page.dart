import 'package:flutter/material.dart';
import 'package:job_manager/models/user_model.dart';
import 'package:job_manager/widgets/pay_roll_input.dart';

class AddMachineAssistantPage extends StatefulWidget {
  const AddMachineAssistantPage({super.key});

  @override
  State<StatefulWidget> createState() =>
      _AddMachineAssistantPage();
}

class _AddMachineAssistantPage
    extends State<AddMachineAssistantPage> {
  UserModel? user;

  void _updateUser(UserModel selectedUser) {
    setState(() {
      user = selectedUser;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        title: Text(
          'Cập nhật phụ máy',
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
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(8.0),
              child: Column(
                crossAxisAlignment:
                    CrossAxisAlignment.start,
                children: [
                  PayRollInput(
                    title: 'Phụ máy 1',
                    onSelectUser: _updateUser,
                  ),
                  PayRollInput(
                    title: 'Phụ máy 2',
                    onSelectUser: _updateUser,
                  ),
                  PayRollInput(
                    title: 'Phụ máy 3',
                    onSelectUser: _updateUser,
                  ),
                  PayRollInput(
                    title: 'Phụ máy 4',
                    onSelectUser: _updateUser,
                  ),
                  PayRollInput(
                    title: 'Phụ máy 5',
                    onSelectUser: _updateUser,
                  ),
                ],
              ),
            ),
          ),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
                foregroundColor: Colors.white,
              ),
              child: Text('Lưu lại'),
            ),
          ),
        ],
      ),
    );
  }
}
