import 'package:flutter/material.dart';
import 'package:job_manager/screens/work_log/routes/routes.dart';
import 'package:job_manager/screens/work_log/widgets/service_vehicle_trip_item.dart';

class ServiceVehicleTripList extends StatefulWidget {
  const ServiceVehicleTripList({super.key});

  @override
  State<StatefulWidget> createState() =>
      _ServiceVehicleTripList();
}

class _ServiceVehicleTripList
    extends State<ServiceVehicleTripList> {
  final List<Map<String, dynamic>> _allData = [
    {
      'start': 'Trạm 1 BV-CS',
      'end': 'Moong Trung tâm CS',
      'type': 'Phục vụ',
      'quantity': '1',
      'distance': '15.5km',
    },
  ];
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.blue,
        title: Text(
          'Báo chuyến xe phục vụ',
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
                WorkLogRoutes
                    .serviceVehicleSelectStartPoint,
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
                    (item) =>
                        ServiceVehicleTripItem(data: item),
                  )
                  .toList(),
        ),
      ),
    );
  }
}
