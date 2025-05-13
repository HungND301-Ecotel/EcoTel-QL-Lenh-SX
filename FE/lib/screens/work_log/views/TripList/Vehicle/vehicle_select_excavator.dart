import 'package:flutter/material.dart';
import 'package:job_manager/screens/work_log/routes/routes.dart';
import 'package:job_manager/screens/work_log/widgets/excavator_item.dart';

class VehicleSelectExcavator extends StatefulWidget {
  const VehicleSelectExcavator({super.key});

  @override
  State<StatefulWidget> createState() =>
      _VehicleSelectExcavator();
}

class _VehicleSelectExcavator
    extends State<VehicleSelectExcavator> {
  final List<Map<String, dynamic>> _allData = [
    {'name': 'KT1-P12'},
    {'name': 'KT3-HT3'},
    {'name': 'KT3-HT4'},
    {'name': 'KT3-HT5'},
    {'name': 'KT3-HT6'},
    {'name': 'KT3-HT6'},
    {'name': 'KT3-HT6'},
    {'name': 'KT3-HT6'},
    {'name': 'KT3-HT6'},
    {'name': 'KT3-HT6'},
    {'name': 'KT3-HT6'},
    {'name': 'KT3-HT6'},
    {'name': 'KT3-HT6'},
    {'name': 'KT3-HT6'},
    {'name': 'KT3-HT6'},
    {'name': 'KT3-HT6'},
    {'name': 'KT3-HT6'},
  ];
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        title: Text(
          'Từ máy xúc',
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
                  WorkLogRoutes.vehicleSelectDestination,
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
