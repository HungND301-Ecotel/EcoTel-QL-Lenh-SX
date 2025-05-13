import 'package:flutter/material.dart';
import 'package:job_manager/screens/work_log/routes/routes.dart';
import 'package:job_manager/screens/work_log/widgets/material_item.dart';

class DrillingSelectProduct extends StatefulWidget {
  const DrillingSelectProduct({super.key});

  @override
  State<StatefulWidget> createState() =>
      _DrillingSelectProduct();
}

class _DrillingSelectProduct
    extends State<DrillingSelectProduct> {
  final List<Map<String, dynamic>> _allData = [
    {'name': 'Khoan bãi'},
    {'name': 'Khoan bãi'},
    {'name': 'Khoan bãi'},
    {'name': 'Khoan bãi'},
    {'name': 'Khoan bãi'},
    {'name': 'Khoan bãi'},
    {'name': 'Khoan bãi'},
    {'name': 'Khoan bãi'},
    {'name': 'Khoan bãi'},
    {'name': 'Khoan bãi'},
    {'name': 'Khoan bãi'},
    {'name': 'Khoan bãi'},
    {'name': 'Khoan bãi'},
    {'name': 'Khoan bãi'},
    {'name': 'Khoan bãi'},
    {'name': 'Khoan bãi'},
    {'name': 'Khoan bãi'},
    {'name': 'Khoan bãi'},
    {'name': 'Khoan bãi'},
    {'name': 'Khoan bãi'},
    {'name': 'Khoan bãi'},
    {'name': 'Khoan bãi'},
    {'name': 'Khoan bãi'},
    {'name': 'Khoan bãi'},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        title: Text(
          'Nhập loại hàng',
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
            child: SingleChildScrollView(
              child: Column(
                children:
                    _allData
                        .map(
                          (item) =>
                              MaterialItem(data: item),
                        )
                        .toList(),
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.all(8.0),
            width: double.infinity,
            color: Colors.white,
            child: SizedBox(
              width: double.infinity,
              child: Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pushNamed(
                      context,
                      WorkLogRoutes.drillingInputQuantity,
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
                    foregroundColor: Colors.white,
                  ),
                  child: Text('Tiếp tục'),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
