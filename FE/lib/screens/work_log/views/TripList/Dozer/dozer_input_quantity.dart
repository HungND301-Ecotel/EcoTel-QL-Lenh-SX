import 'package:flutter/material.dart';
import 'package:job_manager/screens/work_log/routes/routes.dart';

class DozerInputQuantity extends StatefulWidget {
  const DozerInputQuantity({super.key});

  @override
  State<StatefulWidget> createState() =>
      _DozerInputQuantity();
}

class _DozerInputQuantity
    extends State<DozerInputQuantity> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        title: Text(
          'Nhập sản lượng',
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
                    'Giờ sản phẩm (phút)',
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
                                "Bạn muốn lưu dữ liệu vào hệ thống",
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
                                    Navigator.pushNamed(
                                      context,
                                      WorkLogRoutes
                                          .dozerProductList,
                                    );
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
