import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:soft/providers/report_provider.dart';
import 'package:soft/providers/user_provider.dart';
import 'package:soft/routes/app_routes.dart';
import 'package:soft/screens/main.dart';
import 'package:soft/screens/signin/signin.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) => UserProvider(),
        ),
        ChangeNotifierProvider(
          create: (_) => ReportDraftProvider(),
        ),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  Future<Widget> _loadInitialScreen() async {
    await Future.delayed(const Duration(seconds: 5));
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final userString = prefs.getString('user');

    if (token != null && userString != null) {
      final user = json.decode(userString);
      if (!mounted) return SignIn();
      final userProvider = Provider.of<UserProvider>(
        context,
        listen: false,
      );
      await userProvider.setUser(
        user,
        token,
      ); // phục hồi lại trạng thái
      return MyPage();
    } else {
      return SignIn();
    }
  }

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      Provider.of<UserProvider>(
        context,
        listen: false,
      ).loadToken();
    });
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Widget>(
      future: _loadInitialScreen(),
      builder: (context, snapshot) {
        if (snapshot.connectionState ==
            ConnectionState.waiting) {
          return const MaterialApp(
            home: Scaffold(
              body: Center(
                child: CircularProgressIndicator(),
              ),
            ),
          );
        } else {
          return MaterialApp(
            home: snapshot.data,
            onGenerateRoute: AppRoute.generateRoute,
            debugShowCheckedModeBanner: false,
          );
        }
      },
    );
  }
}
