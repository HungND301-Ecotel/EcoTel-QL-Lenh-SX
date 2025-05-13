import 'package:flutter/material.dart';
import 'package:job_manager/screens/task_assignment/task_assignment_add.dart';
import 'package:job_manager/screens/task_assignment/task_assignment_detail.dart';
import 'package:job_manager/screens/task_assignment/task_assignment_dump_site_select.dart';
import 'package:job_manager/screens/task_assignment/task_assignment_list.dart';
import 'package:job_manager/screens/task_assignment/task_assignment_material_select.dart';
import 'package:job_manager/screens/task_assignment/task_assignment_type.dart';
import 'package:job_manager/screens/task_assignment/task_assignment_vehicle_select.dart';

class TaskAssignmentRoute extends StatelessWidget {
  const TaskAssignmentRoute({super.key});

  @override
  Widget build(BuildContext context) {
    return Navigator(
      initialRoute: TaskAssignmentRoutes.taskAssignmentList,
      onGenerateRoute: (RouteSettings settings) {
        switch (settings.name) {
          case TaskAssignmentRoutes.taskAssignmentList:
            return MaterialPageRoute(
              builder: (_) => TaskAssignmentList(),
            );
          case TaskAssignmentRoutes.taskAssignmentType:
            return MaterialPageRoute(
              builder: (_) => TaskAssignmentType(),
            );
          case TaskAssignmentRoutes.taskAssignmentAdd:
            final args = settings.arguments as String;
            return MaterialPageRoute(
              builder: (_) => TaskAssignmentAdd(name: args),
            );
          case TaskAssignmentRoutes.taskAssignmentDetail:
            final args =
                settings.arguments as Map<String, dynamic>;
            return MaterialPageRoute(
              builder:
                  (_) => TaskAssignmentDetail(data: args),
            );
          case TaskAssignmentRoutes
              .taskAssignmentVehicleSelect:
            return MaterialPageRoute(
              builder: (_) => TaskAssignmentVehicleSelect(),
            );
          case TaskAssignmentRoutes
              .taskAssignmentDumpSiteSelect:
            return MaterialPageRoute(
              builder:
                  (_) => TaskAssignmentDumpSiteSelect(),
            );
          case TaskAssignmentRoutes
              .taskAssignmentMaterialSelect:
            return MaterialPageRoute(
              builder:
                  (_) => TaskAssignmentMaterialSelect(),
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

class TaskAssignmentRoutes {
  static const String taskAssignmentList =
      '/taskAssignmentList';
  static const String taskAssignmentDetail =
      '/taskAssignmentDetail';
  static const String taskAssignmentType =
      '/taskAssignmentType';
  static const String taskAssignmentAdd =
      '/taskAssignmentAdd';
  static const String taskAssignmentVehicleSelect =
      '/taskAssignmentVehicleSelect';
  static const String taskAssignmentDumpSiteSelect =
      '/taskAssignmentDumpSiteSelect';
  static const String taskAssignmentMaterialSelect =
      '/taskAssignmentMaterialSelect';
}
