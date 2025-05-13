import 'package:flutter/material.dart';

class TripInputForm extends StatelessWidget {
  final String title;
  final Function(int count) onSubmit;
  const TripInputForm({
    super.key,
    required this.title,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        title: Text(
          'Số chuyến',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        iconTheme: IconThemeData(color: Colors.white),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(8.0),
              child: Column(
                crossAxisAlignment:
                    CrossAxisAlignment.start,
                children: [
                  Text(
                    'Số chuyến',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  TextField(
                    keyboardType: TextInputType.number,
                  ),
                ],
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.all(8.0),
            width: double.infinity,
            color: Colors.white,
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                    ),
                    child: Text('Về trước'),
                  ),
                ),
                SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      showDialog(
                        context: context,
                        builder:
                            (
                              BuildContext dialogContext,
                            ) => AlertDialog(
                              title: Text("Xác nhận"),
                              content: Text(
                                "Bạn muốn lưu chuyến vào hệ thống",
                              ),
                              actions: [
                                TextButton(
                                  onPressed: () {
                                    Navigator.of(
                                      dialogContext,
                                    ).pop();
                                  },
                                  style:
                                      TextButton.styleFrom(
                                        foregroundColor:
                                            Colors.blue,
                                      ),
                                  child: Text("Bỏ qua"),
                                ),
                                TextButton(
                                  onPressed: () {
                                    Navigator.of(
                                      dialogContext,
                                    ).pop();
                                    onSubmit(6);
                                  },
                                  style:
                                      TextButton.styleFrom(
                                        foregroundColor:
                                            Colors.blue,
                                      ),
                                  child: Text("Lưu lại"),
                                ),
                              ],
                            ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                    ),
                    child: Text('Ghi lại'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
