import 'package:flutter/material.dart';
import 'package:soft/screens/add_phone/add_phone.dart';
import 'package:soft/screens/contact/contact.dart';
import 'package:soft/screens/home/home_vehicle_select.dart';
import 'package:soft/screens/main.dart';
import 'package:soft/screens/register/register.dart';
import 'package:soft/screens/setting/changepass.dart';
import 'package:soft/screens/setting/version_info.dart';
import 'package:soft/screens/signin/signin.dart';
import 'package:soft/screens/task_assignment/task_assignment_all_device_select.dart';
import 'package:soft/screens/task_assignment/task_assignment_car_select.dart';
import 'package:soft/screens/task_assignment/task_assignment_department_select.dart';
import 'package:soft/screens/task_assignment/task_assignment_device_type_select.dart';
import 'package:soft/screens/task_assignment/task_assignment_dump_site_select.dart';
import 'package:soft/screens/task_assignment/task_assignment_excavator_select.dart';
import 'package:soft/screens/task_assignment/task_assignment_material_select.dart';
import 'package:soft/screens/task_assignment/task_assignment_safety_measure_select.dart';
import 'package:soft/screens/task_assignment/task_assignment_vehicle_select.dart';

class AppRoute {
  static const String signin = '/signin';
  static const String register = '/register';
  static const String main = '/main';
  static const String changePass = '/changepass';
  static const String versionInfo = '/version_info';
  static const String addPhone = '/addphone';
  static const String contact = '/contact';
  static const String vehicleSelect = '/vehicle_select';
  static const String allDeviceSelect =
      '/all_device_select';
  static const String locationSelect = '/location_select';
  static const String carSelect = '/car_select';
  static const String departmentSelect =
      '/department_select';
  static const String homeVehicleSelect =
      '/home_vehicle_select';
  static const String deviceTypeSelect =
      '/deviceTypeSelect';
  static const String excavatorSelect = '/excavatorSelect';
  static const String safetyMeastureSelect =
      '/safetyMeastureSelect';
  static const String materialSelect = '/materialSelect';

  static Route<dynamic> generateRoute(
    RouteSettings settings,
  ) {
    switch (settings.name) {
      case signin:
        return MaterialPageRoute(builder: (_) => SignIn());
      case register:
        return MaterialPageRoute(
          builder: (_) => Register(),
        );
      case main:
        return MaterialPageRoute(builder: (_) => MyPage());
      case changePass:
        return MaterialPageRoute(
          builder: (_) => Changepass(),
        );
      case versionInfo:
        return MaterialPageRoute(
          builder: (_) => VersionInfo(),
        );
      case addPhone:
        return MaterialPageRoute(
          builder: (_) => AddPhonePage(),
        );
      case contact:
        return MaterialPageRoute(
          builder: (_) => ContactScreen(),
        );
      case vehicleSelect:
        return MaterialPageRoute(
          builder: (_) => TaskAssignmentVehicleSelect(),
        );
      case carSelect:
        return MaterialPageRoute(
          builder: (_) => TaskAssignmentCarSelect(),
        );
      case departmentSelect:
        return MaterialPageRoute(
          builder: (_) => TaskAssignmentDepartmentSelect(),
        );
      case locationSelect:
        return MaterialPageRoute(
          builder: (_) => TaskAssignmentDumpSiteSelect(),
        );
      case homeVehicleSelect:
        return MaterialPageRoute(
          builder: (_) => HomeVehicleSelect(),
        );
      case deviceTypeSelect:
        return MaterialPageRoute(
          builder: (_) => TaskAssignmentDeviceTypeSelect(),
        );
      case materialSelect:
        return MaterialPageRoute(
          builder: (_) => TaskAssignmentMaterialSelect(),
        );
      case excavatorSelect:
        return MaterialPageRoute(
          builder: (_) => TaskAssignmentExcavatorSelect(),
        );
      case allDeviceSelect:
        return MaterialPageRoute(
          builder: (_) => TaskAssignmentAllDeviceSelect(),
        );
      case safetyMeastureSelect:
        return MaterialPageRoute(
          builder: (_) =>
              TaskAssignmentSafetyMeasureSelect(),
        );
      default:
        return MaterialPageRoute(
          builder: (_) => Scaffold(
            body: Center(child: Text('NOT FOUND')),
          ),
        );
    }
  }
}
