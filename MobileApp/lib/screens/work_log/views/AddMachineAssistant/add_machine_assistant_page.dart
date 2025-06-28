import 'package:flutter/material.dart';
import 'package:soft/models/order_model.dart';
import 'package:soft/models/user_model.dart';
import 'package:soft/services/order_service.dart';
import 'package:soft/widgets/pay_roll_input.dart';

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
  List<UserModel?> selectedAssistants = [];

  @override
  void initState() {
    super.initState();
    selectedAssistants = List.generate(5, (index) {
      if (widget.data.assistants != null &&
          widget.data.assistants!.length > index) {
        return widget.data.assistants![index];
      }
      return null;
    });
  }

  void _updateUser(UserModel? selectedUser, int index) {
    setState(() {
      selectedAssistants[index] = selectedUser;
    });
  }

  final OrderService _orderService = OrderService();
  void update() async {
    final cleanedAssistants =
        selectedAssistants
            .where((user) => user != null)
            .map((user) => user!.id)
            .toList();
    var result = await _orderService.update(
      widget.data.id,
      {'assistants': cleanedAssistants},
    );
    if (!mounted) return;
    if (result['status'] == 'error') {
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
      Navigator.pop(context);
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
                children: List.generate(5, (index) {
                  print(
                    selectedAssistants[index]?.salaryCode,
                  );
                  return PayRollInput(
                    title: 'Phụ máy ${index + 1}',
                    onSelectUser:
                        (user) => _updateUser(user, index),
                    initialPayroll:
                        selectedAssistants[index]
                            ?.salaryCode,
                  );
                }),
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
