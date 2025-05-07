import 'package:flutter/material.dart';
import 'package:job_manager/screens/main.dart';
import 'package:job_manager/screens/signin/signin.dart';

class AppRoute {
  static const String signin = '/signin';
  static const String main = '/main';

  static Route<dynamic> generateRoute(
    RouteSettings settings,
  ) {
    switch (settings.name) {
      case signin:
        return MaterialPageRoute(builder: (_) => SignIn());
      case main:
        return MaterialPageRoute(builder: (_) => MyPage());
      default:
        return MaterialPageRoute(
          builder:
              (_) => Scaffold(
                body: Center(child: Text('NOT FOUND')),
              ),
        );
    }
  }
}
