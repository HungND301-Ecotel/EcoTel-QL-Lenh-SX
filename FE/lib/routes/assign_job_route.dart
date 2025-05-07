import 'package:flutter/material.dart';
import 'package:job_manager/screens/assign_job/add_assign_job.dart';
import 'package:job_manager/screens/assign_job/job_detail.dart';
import 'package:job_manager/screens/assign_job/list_assign_job.dart';
import 'package:job_manager/screens/assign_job/list_job.dart';

class AssignJobRoute extends StatelessWidget {
  const AssignJobRoute({super.key});

  @override
  Widget build(BuildContext context) {
    return Navigator(
      initialRoute: AssignJobRoutes.list_assign_job,
      onGenerateRoute: (RouteSettings settings) {
        switch (settings.name) {
          case AssignJobRoutes.list_assign_job:
            return MaterialPageRoute(
              builder: (_) => ListAssignJob(),
            );
          case AssignJobRoutes.list_job:
            return MaterialPageRoute(
              builder: (_) => ListJob(),
            );
          case AssignJobRoutes.add_assign:
            final args = settings.arguments as String;
            return MaterialPageRoute(
              builder: (_) => AddAssignJob(name: args),
            );
          case AssignJobRoutes.job_detail:
            final args =
                settings.arguments as Map<String, dynamic>;
            return MaterialPageRoute(
              builder: (_) => JobDetail(data: args),
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

class AssignJobRoutes {
  static const String list_job = '/list_job';
  static const String add_assign = '/add_assign';
  static const String list_assign_job = '/list_assign_job';
  static const String job_detail = '/job_detail';
}
