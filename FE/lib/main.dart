import 'package:flutter/material.dart';
import 'package:job_manager/routes/app_routes.dart';
import 'package:job_manager/screens/signin/signin.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: SignIn(),
      onGenerateRoute: AppRoute.generateRoute,
      debugShowCheckedModeBanner: false,
    );
  }
}
