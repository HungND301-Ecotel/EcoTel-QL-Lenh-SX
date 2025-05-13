// Chọn phương tiện
import 'package:flutter/material.dart';
import 'package:job_manager/screens/work_log/routes/routes.dart';
import 'package:job_manager/screens/work_log/widgets/excavator_item.dart';

class ExcavatorSelectVehicle extends StatefulWidget {
  const ExcavatorSelectVehicle({super.key});

  @override
  State<StatefulWidget> createState() =>
      _ExcavatorSelectVehicle();
}

class _ExcavatorSelectVehicle
    extends State<ExcavatorSelectVehicle> {
  final List<Map<String, dynamic>> _allData = [
    {'name': 'VT13-C96'},
    {'name': 'VT13-C96'},
    {'name': 'VT13-C96'},
    {'name': 'VT13-C96'},
    {'name': 'VT13-C96'},
    {'name': 'VT13-C96'},
    {'name': 'VT13-C96'},
    {'name': 'VT13-C96'},
    {'name': 'VT13-C96'},
    {'name': 'VT13-C96'},
    {'name': 'VT13-C96'},
    {'name': 'VT13-C96'},
    {'name': 'VT13-C96'},
  ];
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        title: Text(
          'Phương tiện',
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
                              ExcavatorItem(data: item),
                        )
                        .toList(),
              ),
            ),
          ),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.pushNamed(
                  context,
                  WorkLogRoutes.excavatorSelectMaterial,
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
                foregroundColor: Colors.white,
              ),
              child: Text('Tiếp tục'),
            ),
          ),
        ],
      ),
    );
  }
}
