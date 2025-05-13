import 'package:flutter/material.dart';
import 'package:job_manager/screens/work_log/routes/routes.dart';
import 'package:job_manager/screens/work_log/widgets/vehicle_trip_item.dart';

class VehicleTripList extends StatefulWidget {
  const VehicleTripList({super.key});

  @override
  State<StatefulWidget> createState() => _VehicleTripList();
}

class _VehicleTripList extends State<VehicleTripList> {
  final List<Map<String, dynamic>> _allData = [
    {
      'name': 'KT1-P12',
      'address': '+100 BN KC2',
      'type': 'Than loại 1',
      'quantity': '9',
    },
  ];
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        title: Text(
          'Báo chuyến',
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
                WorkLogRoutes.vehicleSelectExcavator,
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
                    (item) => VehicleTripItem(data: item),
                  )
                  .toList(),
        ),
      ),
    );
  }
}
