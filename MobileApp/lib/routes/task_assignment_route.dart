import 'package:flutter/material.dart';
import 'package:soft/models/order_model.dart';
import 'package:soft/models/task_model.dart';
import 'package:soft/screens/task_assignment/dispatcher/dispatcher_assignment_add.dart';
import 'package:soft/screens/task_assignment/task_assignment_add.dart';
import 'package:soft/screens/task_assignment/task_assignment_detail.dart';
import 'package:soft/screens/task_assignment/task_assignment_edit.dart';
import 'package:soft/screens/task_assignment/task_assignment_list.dart';
import 'package:soft/screens/task_assignment/task_assignment_material_select.dart';
import 'package:soft/screens/task_assignment/task_assignment_transfer.dart';
import 'package:soft/screens/task_assignment/task_assignment_type.dart';

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
            final args =
                settings.arguments as Map<String, dynamic>;
            final task = args['task'] as TaskModel;
            final order = args['order'] as OrderModel?;
            return MaterialPageRoute(
              builder:
                  (_) => TaskAssignmentAdd(
                    data: task,
                    order: order,
                  ),
            );
          case TaskAssignmentRoutes.dispatcherAssignmentAdd:
            final args =
                settings.arguments as Map<String, dynamic>;
            final task = args['task'] as TaskModel;
            final order = args['order'] as OrderModel?;
            return MaterialPageRoute(
              builder:
                  (_) => DispatcherAssignmentAdd(
                    data: task,
                    order: order,
                  ),
            );
          case TaskAssignmentRoutes.taskAssignmentTransfer:
            final args =
                settings.arguments as Map<String, dynamic>;
            final task = args['task'] as TaskModel;
            final order = args['order'] as OrderModel?;
            return MaterialPageRoute(
              builder:
                  (_) => TaskAssignmentTransfer(
                    data: task,
                    order: order,
                  ),
            );
          case TaskAssignmentRoutes.taskAssignmentEdit:
            final args =
                settings.arguments as Map<String, dynamic>;
            final task = args['task'] as TaskModel;
            final order = args['order'] as OrderModel?;
            return MaterialPageRoute(
              builder:
                  (_) => TaskAssignmentEdit(
                    data: task,
                    order: order,
                  ),
            );
          case TaskAssignmentRoutes.taskAssignmentDetail:
            final args = settings.arguments as OrderModel;
            return MaterialPageRoute(
              builder:
                  (_) => TaskAssignmentDetail(data: args),
            );
          // case TaskAssignmentRoutes
          //     .taskAssignmentVehicleSelect:
          //   return MaterialPageRoute(
          //     builder: (_) => TaskAssignmentVehicleSelect(),
          //   );
          // case TaskAssignmentRoutes
          //     .taskAssignmentDumpSiteSelect:
          //   return MaterialPageRoute(
          //     builder:
          //         (_) => TaskAssignmentDumpSiteSelect(),
          //   );
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
  static const String dispatcherAssignmentAdd =
      '/dispatcherAssignmentAdd';
  static const String taskAssignmentTransfer =
      '/taskAssignmentTransfer';
  static const String taskAssignmentEdit =
      '/taskAssignmentEdit';
  static const String taskAssignmentVehicleSelect =
      '/taskAssignmentVehicleSelect';
  static const String taskAssignmentAllDeviceSelect =
      '/taskAssignmentAllDeviceSelect';
  static const String taskAssignmentDumpSiteSelect =
      '/taskAssignmentDumpSiteSelect';
  static const String taskAssignmentMaterialSelect =
      '/taskAssignmentMaterialSelect';
}
