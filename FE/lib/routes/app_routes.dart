import 'package:flutter/material.dart';
import 'package:soft/screens/add_phone/add_phone.dart';
import 'package:soft/screens/contact/contact.dart';
import 'package:soft/screens/main.dart';
import 'package:soft/screens/setting/changepass.dart';
import 'package:soft/screens/signin/signin.dart';

class AppRoute {
  static const String signin = '/signin';
  static const String main = '/main';
  static const String changePass = '/changepass';
  static const String addPhone = '/addphone';
  static const String contact = '/contact';

  static Route<dynamic> generateRoute(
    RouteSettings settings,
  ) {
    switch (settings.name) {
      case signin:
        return MaterialPageRoute(builder: (_) => SignIn());
      case main:
        return MaterialPageRoute(builder: (_) => MyPage());
      case changePass:
        return MaterialPageRoute(
          builder: (_) => Changepass(),
        );
      case addPhone:
        return MaterialPageRoute(
          builder: (_) => AddPhonePage(),
        );
      case contact:
        return MaterialPageRoute(
          builder: (_) => ContactScreen(),
        );
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
