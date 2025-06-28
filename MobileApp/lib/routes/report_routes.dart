import 'package:flutter/material.dart';
import 'package:soft/screens/report/report_event.dart';
import 'package:soft/screens/report/report_page.dart';
import 'package:soft/screens/report/report_vehicle.dart';

class ReportRoute extends StatelessWidget {
  const ReportRoute({super.key});

  @override
  Widget build(BuildContext context) {
    return Navigator(
      initialRoute: ReportRoutes.reportPage,
      onGenerateRoute: (RouteSettings settings) {
        switch (settings.name) {
          case ReportRoutes.reportPage:
            return MaterialPageRoute(
              builder: (_) => ReportPage(),
            );
          case ReportRoutes.reportVehicle:
            return MaterialPageRoute(
              builder: (_) => ReportVehicle(),
            );
          case ReportRoutes.reportEvent:
            return MaterialPageRoute(
              builder: (_) => ReportEvent(),
            );
          default:
            return MaterialPageRoute(
              builder:
                  (_) => Scaffold(
                    body: Center(
                      child: Text('Page not found'),
                    ),
                  ),
            );
        }
      },
    );
  }
}

class ReportRoutes {
  static const String reportPage = '/report_page';
  static const String reportVehicle = '/report_vehicle';
  static const String reportEvent = '/report_event';
}
