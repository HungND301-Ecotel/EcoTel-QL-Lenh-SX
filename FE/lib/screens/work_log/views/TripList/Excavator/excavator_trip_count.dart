import 'package:flutter/material.dart';
import 'package:job_manager/screens/work_log/routes/routes.dart';
import 'package:job_manager/screens/work_log/widgets/trip_input_form.dart';

class ExcavatorTripCount extends StatefulWidget {
  const ExcavatorTripCount({super.key});

  @override
  State<StatefulWidget> createState() =>
      _ExcavatorTripCount();
}

class _ExcavatorTripCount
    extends State<ExcavatorTripCount> {
  @override
  Widget build(BuildContext context) {
    return TripInputForm(
      title: 'Số chuyến',
      onSubmit: (count) {
        Navigator.pushNamed(
          context,
          WorkLogRoutes.excavatorTripList,
        );
      },
    );
  }
}
