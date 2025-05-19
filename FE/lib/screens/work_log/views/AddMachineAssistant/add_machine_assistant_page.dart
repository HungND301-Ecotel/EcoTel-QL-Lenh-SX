import 'package:flutter/material.dart';
import 'package:job_manager/models/order_model.dart';
import 'package:job_manager/models/user_model.dart';
import 'package:job_manager/services/order_service.dart';
import 'package:job_manager/widgets/pay_roll_input.dart';

class AddMachineAssistantPage extends StatefulWidget {
  final OrderModel data;
  const AddMachineAssistantPage({
    super.key,
    required this.data,
  });

  @override
  State<StatefulWidget> createState() =>
      _AddMachineAssistantPage();
}

class _AddMachineAssistantPage
    extends State<AddMachineAssistantPage> {
  UserModel? user;
  List<String> assistant = [];

  void _updateUser(UserModel? selectedUser, int index) {
    setState(() {
      while (assistant.length <= index) {
        assistant.add('');
      }
      assistant[index] = selectedUser?.id ?? '';
    });
  }

  final OrderService _orderService = OrderService();
  void update() async {
    final cleanedAssistants =
        assistant.where((id) => id.isNotEmpty).toList();
    var result = await _orderService.update(
      widget.data.id,
      {'assistants': cleanedAssistants},
    );
    if (!mounted) return;
    if (result['status'] == 'error') {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Thêm phụ máy thất bại'),
          backgroundColor: Colors.red,
        ),
      );
    } else {
      setState(() {
        widget.data.updateFromJson(result['data']);
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Thêm phụ máy thành công'),
          backgroundColor: Colors.green,
        ),
      );
    }
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
                    onSelectUser:
                        (user) => _updateUser(user, 0),
                  ),
                  PayRollInput(
                    title: 'Phụ máy 2',
                    onSelectUser:
                        (user) => _updateUser(user, 1),
                  ),
                  PayRollInput(
                    title: 'Phụ máy 3',
                    onSelectUser:
                        (user) => _updateUser(user, 2),
                  ),
                  PayRollInput(
                    title: 'Phụ máy 4',
                    onSelectUser:
                        (user) => _updateUser(user, 3),
                  ),
                  PayRollInput(
                    title: 'Phụ máy 5',
                    onSelectUser:
                        (user) => _updateUser(user, 4),
                  ),
                ],
              ),
            ),
          ),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: update,
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
