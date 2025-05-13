import 'package:flutter/material.dart';
import 'package:job_manager/screens/work_log/routes/routes.dart';
import 'package:job_manager/screens/work_log/widgets/material_item.dart';

class ExcavatorSelectMaterial extends StatefulWidget {
  const ExcavatorSelectMaterial({super.key});

  @override
  State<StatefulWidget> createState() =>
      _ExcavatorSelectMaterial();
}

class _ExcavatorSelectMaterial
    extends State<ExcavatorSelectMaterial> {
  final List<Map<String, dynamic>> _allData = [
    {'name': 'Than loại 1'},
    {'name': 'Than loại 1'},
    {'name': 'Than loại 1'},
    {'name': 'Than loại 1'},
    {'name': 'Than loại 1'},
    {'name': 'Than loại 1'},
    {'name': 'Than loại 1'},
    {'name': 'Than loại 1'},
    {'name': 'Than loại 1'},
    {'name': 'Than loại 1'},
    {'name': 'Than loại 1'},
    {'name': 'Than loại 1'},
    {'name': 'Than loại 1'},
    {'name': 'Than loại 1'},
    {'name': 'Than loại 1'},
    {'name': 'Than loại 1'},
    {'name': 'Than loại 1'},
    {'name': 'Than loại 1'},
    {'name': 'Than loại 1'},
    {'name': 'Than loại 1'},
    {'name': 'Than loại 1'},
    {'name': 'Than loại 1'},
    {'name': 'Than loại 1'},
    {'name': 'Than loại 1'},
    {'name': 'Than loại 1'},
    {'name': 'Than loại 1'},
    {'name': 'Than loại 1'},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        title: Text(
          'Chủng loại',
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
                      Navigator.pushNamed(
                        context,
                        WorkLogRoutes.excavatorTripCount,
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
          ),
        ],
      ),
    );
  }
}
