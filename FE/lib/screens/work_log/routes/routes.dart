import 'package:flutter/material.dart';
import 'package:soft/models/order_model.dart';
import 'package:soft/screens/work_log/views/AddMachineAssistant/add_machine_assistant_page.dart';
import 'package:soft/screens/work_log/views/QrCode/qr_code.dart';
import 'package:soft/screens/work_log/views/ReportTask/direct_work_report.dart';
import 'package:soft/screens/work_log/views/ReportTask/indirect_work_report.dart';
import 'package:soft/screens/work_log/views/TripList/Dozer/dozer_input_quantity.dart';
import 'package:soft/screens/work_log/views/TripList/Dozer/dozer_product_list.dart';
import 'package:soft/screens/work_log/views/TripList/Dozer/dozer_select_product.dart';
import 'package:soft/screens/work_log/views/TripList/Drilling/drilling_input_quantity.dart';
import 'package:soft/screens/work_log/views/TripList/Drilling/drilling_product_list.dart';
import 'package:soft/screens/work_log/views/TripList/Drilling/drilling_select_product.dart';
import 'package:soft/screens/work_log/views/TripList/Excavator/excavator_select_material.dart';
import 'package:soft/screens/work_log/views/TripList/Excavator/excavator_trip_count.dart';
import 'package:soft/screens/work_log/views/TripList/Excavator/excavator_trip_list.dart';
import 'package:soft/screens/work_log/views/TripList/Excavator/excavator_select_vehicle.dart';
import 'package:soft/screens/work_log/views/TripList/ServiceVehicle/service_vehicle_select_end_point.dart';
import 'package:soft/screens/work_log/views/TripList/ServiceVehicle/service_vehicle_select_material.dart';
import 'package:soft/screens/work_log/views/TripList/ServiceVehicle/service_vehicle_select_start_point.dart';
import 'package:soft/screens/work_log/views/TripList/ServiceVehicle/service_vehicle_trip_input.dart';
import 'package:soft/screens/work_log/views/TripList/ServiceVehicle/service_vehicle_trip_list.dart';
import 'package:soft/screens/work_log/views/TripList/Vehicle/vehicle_select_destination.dart';
import 'package:soft/screens/work_log/views/TripList/Vehicle/vehicle_select_excavator.dart';
import 'package:soft/screens/work_log/views/TripList/Vehicle/vehicle_trip_count.dart';
import 'package:soft/screens/work_log/views/TripList/Vehicle/vehicle_select_material.dart';
import 'package:soft/screens/work_log/views/task_detail_page.dart';
import 'package:soft/screens/work_log/views/task_list_page.dart';
import 'package:soft/screens/work_log/views/TripList/Vehicle/vehicle_trip_list.dart';

class WorkLogRoute extends StatelessWidget {
  const WorkLogRoute({super.key});

  @override
  Widget build(BuildContext context) {
    return Navigator(
      initialRoute: WorkLogRoutes.taskListPage,
      onGenerateRoute: (RouteSettings settings) {
        switch (settings.name) {
          case WorkLogRoutes.taskListPage:
            return MaterialPageRoute(
              builder: (_) => TaskListPage(),
            );
          case WorkLogRoutes.taskDetailPage:
            final orderId = settings.arguments as String;
            return MaterialPageRoute(
              builder: (_) => TaskDetailPage(orderId: orderId),
            );
          case WorkLogRoutes.qrCode:
            final args = settings.arguments as OrderModel;
            return MaterialPageRoute(
              builder: (_) => QrCode(data: args),
            );
          case WorkLogRoutes.addMachineAssistantPage:
            final args = settings.arguments as OrderModel;
            return MaterialPageRoute(
              builder:
                  (_) =>
                      AddMachineAssistantPage(data: args),
            );
          //Vehicle
          case WorkLogRoutes.vehicleTripList:
            final orderId = settings.arguments as String;
            return MaterialPageRoute(
              builder:
                  (_) => VehicleTripList(orderId: orderId),
            );
          case WorkLogRoutes.vehicleSelectExcavator:
            return MaterialPageRoute(
              builder: (_) => VehicleSelectExcavator(),
            );
          case WorkLogRoutes.vehicleSelectDestination:
            return MaterialPageRoute(
              builder: (_) => VehicleSelectDestination(),
            );
          case WorkLogRoutes.vehicleSelectMaterial:
            return MaterialPageRoute(
              builder: (_) => VehicleSelectMaterial(),
            );
          case WorkLogRoutes.vehicleTripCount:
            return MaterialPageRoute(
              builder: (_) => VehicleTripCount(),
            );
          //Excavator
          case WorkLogRoutes.excavatorTripList:
            final orderId = settings.arguments as String;
            return MaterialPageRoute(
              builder:
                  (_) =>
                      ExcavatorTripList(orderId: orderId),
            );
          case WorkLogRoutes.excavatorSelectVehicle:
            return MaterialPageRoute(
              builder: (_) => ExcavatorSelectVehicle(),
            );
          case WorkLogRoutes.excavatorSelectMaterial:
            return MaterialPageRoute(
              builder: (_) => ExcavatorSelectMaterial(),
            );
          case WorkLogRoutes.excavatorTripCount:
            return MaterialPageRoute(
              builder: (_) => ExcavatorTripCount(),
            );
          //Drilling
          case WorkLogRoutes.drillingProductList:
            final orderId = settings.arguments as String;
            return MaterialPageRoute(
              builder:
                  (_) =>
                      DrillingProductList(orderId: orderId),
            );
          case WorkLogRoutes.drillingSelectProduct:
            return MaterialPageRoute(
              builder: (_) => DrillingSelectProduct(),
            );
          case WorkLogRoutes.drillingInputQuantity:
            return MaterialPageRoute(
              builder: (_) => DrillingInputQuantity(),
            );
          //Dozer
          case WorkLogRoutes.dozerProductList:
            final orderId = settings.arguments as String;
            return MaterialPageRoute(
              builder:
                  (_) => DozerProductList(orderId: orderId),
            );
          case WorkLogRoutes.dozerSelectProduct:
            return MaterialPageRoute(
              builder: (_) => DozerSelectProduct(),
            );
          case WorkLogRoutes.dozerInputQuantity:
            return MaterialPageRoute(
              builder: (_) => DozerInputQuantity(),
            );
          //ServiceVehicle
          case WorkLogRoutes.serviceVehicleTripList:
            final orderId = settings.arguments as String;
            return MaterialPageRoute(
              builder:
                  (_) => ServiceVehicleTripList(
                    orderId: orderId,
                  ),
            );
          case WorkLogRoutes.serviceVehicleSelectStartPoint:
            return MaterialPageRoute(
              builder:
                  (_) => ServiceVehicleSelectStartPoint(),
            );
          case WorkLogRoutes.serviceVehicleSelectEndPoint:
            return MaterialPageRoute(
              builder:
                  (_) => ServiceVehicleSelectEndPoint(),
            );
          case WorkLogRoutes.serviceVehicleSelectMaterial:
            return MaterialPageRoute(
              builder:
                  (_) => ServiceVehicleSelectMaterial(),
            );
          case WorkLogRoutes.serviceVehicleTripInput:
            return MaterialPageRoute(
              builder: (_) => ServiceVehicleTripInput(),
            );
          //ReportTask
          case WorkLogRoutes.directWorkReport:
            return MaterialPageRoute(
              builder: (_) => DirectWorkReport(),
            );
          case WorkLogRoutes.indirectWorkReport:
            return MaterialPageRoute(
              builder: (_) => IndirectWorkReport(),
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

class WorkLogRoutes {
  static const String taskListPage = '/taskListPage';
  static const String taskDetailPage = '/taskDetailPage';
  static const String qrCode = '/qrCode';
  static const String addMachineAssistantPage =
      '/addMachineAssistantPage';
  //vehicle
  static const String vehicleTripList = '/vehicleTripList';
  static const String vehicleSelectExcavator =
      '/vehicleSelectExcavator';
  static const String vehicleSelectDestination =
      '/vehicleSelectDestination';
  static const String vehicleSelectMaterial =
      '/vehicleSelectMaterial';
  static const String vehicleTripCount =
      '/vehicleTripCount';
  //Excavator
  static const String excavatorTripList =
      '/excavatorTripList';
  static const String excavatorSelectVehicle =
      '/excavatorSelectVehicle';
  static const String excavatorSelectMaterial =
      '/excavatorSelectMaterial';
  static const String excavatorTripCount =
      '/excavatorTripCount';
  //Drilling
  static const String drillingProductList =
      '/drillingProductList';
  static const String drillingSelectProduct =
      '/drillingSelectProduct';
  static const String drillingInputQuantity =
      '/drillingInputQuantity';
  //Drilling
  static const String dozerProductList =
      '/dozerProductList';
  static const String dozerSelectProduct =
      '/dozerSelectProduct';
  static const String dozerInputQuantity =
      '/dozerInputQuantity';
  //ServiceVehicle
  static const String serviceVehicleTripList =
      '/serviceVehicleTripList';
  static const String serviceVehicleSelectStartPoint =
      '/serviceVehicleSelectStartPoint';
  static const String serviceVehicleSelectEndPoint =
      '/serviceVehicleSelectEndPoint';
  static const String serviceVehicleSelectMaterial =
      '/serviceVehicleSelectMaterial';
  static const String serviceVehicleTripInput =
      '/serviceVehicleTripInput';
  //ReportTask
  static const String directWorkReport =
      '/directWorkReport';
  static const String indirectWorkReport =
      '/indirectWorkReport';
}
