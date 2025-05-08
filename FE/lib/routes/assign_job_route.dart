import 'package:flutter/material.dart';
import 'package:job_manager/screens/assign_job/add_assign.dart';
import 'package:job_manager/screens/assign_job/job_detail.dart';
import 'package:job_manager/screens/assign_job/list_assign_job.dart';
import 'package:job_manager/screens/assign_job/list_job.dart';

class AssignJobRoute extends StatelessWidget {
  const AssignJobRoute({super.key});

  @override
  Widget build(BuildContext context) {
    return Navigator(
      initialRoute: AssignJobRoutes.listAssignJob,
      onGenerateRoute: (RouteSettings settings) {
        switch (settings.name) {
          case AssignJobRoutes.listAssignJob:
            return MaterialPageRoute(
              builder: (_) => ListAssignJob(),
            );
          case AssignJobRoutes.listJob:
            return MaterialPageRoute(
              builder: (_) => ListJob(),
            );
          case AssignJobRoutes.addAssign:
            final args = settings.arguments as String;
            return MaterialPageRoute(
              builder: (_) => AddAssignJob(name: args),
            );
          case AssignJobRoutes.jobDetail:
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
  static const String listJob = '/list_job';
  static const String addAssign = '/add_assign';
  static const String listAssignJob = '/list_assign_job';
  static const String jobDetail = '/job_detail';
}
