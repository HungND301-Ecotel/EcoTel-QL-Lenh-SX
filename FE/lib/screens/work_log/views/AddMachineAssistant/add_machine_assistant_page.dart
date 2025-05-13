import 'package:flutter/material.dart';

class AddMachineAssistantPage extends StatefulWidget {
  const AddMachineAssistantPage({super.key});

  @override
  State<StatefulWidget> createState() =>
      _AddMachineAssistantPage();
}

class _AddMachineAssistantPage
    extends State<AddMachineAssistantPage> {
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
                  Text(
                    'Phụ máy 1  Nguyễn Tuấn Đạt',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  TextField(),
                  Text(
                    'Phụ máy 2  Nguyễn Tuấn Đạt',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  TextField(),
                  Text(
                    'Phụ máy 3  Nguyễn Tuấn Đạt',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  TextField(),
                  Text(
                    'Phụ máy 4  Nguyễn Tuấn Đạt',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  TextField(),
                  Text(
                    'Phụ máy 5  Nguyễn Tuấn Đạt',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  TextField(),
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
