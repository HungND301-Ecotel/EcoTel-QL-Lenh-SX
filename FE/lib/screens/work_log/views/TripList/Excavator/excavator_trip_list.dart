// Danh sách chuyến của máy xúc
import 'package:flutter/material.dart';
import 'package:job_manager/screens/work_log/routes/routes.dart';
import 'package:job_manager/screens/work_log/widgets/excavator_trip_item.dart';

class ExcavatorTripList extends StatefulWidget {
  const ExcavatorTripList({super.key});

  @override
  State<StatefulWidget> createState() =>
      _ExcavatorTripList();
}

class _ExcavatorTripList extends State<ExcavatorTripList> {
  final List<Map<String, dynamic>> _allData = [
    {'name': 'VT3-960', "type": "Đất đá", 'quantity': '16'},
    {'name': 'VT3-960', "type": "Đất đá", 'quantity': '16'},
  ];
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        title: Text(
          'Báo chuyến cho máy xúc',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        iconTheme: IconThemeData(color: Colors.white),
        centerTitle: true,
        actions: [
          IconButton(
            onPressed: () {
              Navigator.pushNamed(
                context,
                WorkLogRoutes.excavatorSelectVehicle,
              );
            },
            icon: Icon(Icons.add, color: Colors.white),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children:
              _allData
                  .map(
                    (item) => ExcavatorTripItem(data: item),
                  )
                  .toList(),
        ),
      ),
    );
  }
}
