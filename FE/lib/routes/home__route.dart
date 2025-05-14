import 'package:flutter/material.dart';
import 'package:job_manager/screens/home/home_page.dart';
import 'package:job_manager/screens/home/notification_page.dart';


class HomeWrapper extends StatelessWidget {
  const HomeWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    return Navigator(
      initialRoute: HomeRoutes.home,
      onGenerateRoute: (RouteSettings settings) {
        switch (settings.name) {
          case HomeRoutes.home:
            return MaterialPageRoute(
              builder: (_) => HomePage(),
            );
          case HomeRoutes.notification:
            return MaterialPageRoute(
              builder: (_) => NotificationPage(),
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

class HomeRoutes {
  static const String home = '/home_page';
  static const String notification = '/notification';

}
