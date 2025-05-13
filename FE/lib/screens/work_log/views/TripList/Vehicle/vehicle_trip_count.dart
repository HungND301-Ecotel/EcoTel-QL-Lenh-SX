import 'package:flutter/material.dart';
import 'package:job_manager/screens/work_log/routes/routes.dart';
import 'package:job_manager/screens/work_log/widgets/trip_input_form.dart';

class VehicleTripCount extends StatefulWidget {
  const VehicleTripCount({super.key});

  @override
  State<StatefulWidget> createState() =>
      _VehicleTripCount();
}

class _VehicleTripCount extends State<VehicleTripCount> {
  @override
  Widget build(BuildContext context) {
    return TripInputForm(
      title: 'Số chuyến',
      onSubmit: (count) {
        Navigator.pushNamed(
          context,
          WorkLogRoutes.vehicleTripList,
        );
      },
    );
  }
}
