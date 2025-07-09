import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:soft/models/user_model.dart';
import 'package:soft/providers/report_provider.dart';
import 'package:soft/providers/user_provider.dart';
import 'package:soft/routes/app_routes.dart';
import 'package:soft/screens/main.dart';
import 'package:soft/screens/signin/signin.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:soft/services/socket_service.dart';

final GlobalKey<NavigatorState> navigatorKey =
    GlobalKey<NavigatorState>();

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  if (kReleaseMode) {
    await dotenv.load(fileName: "assets/.env.prod");
  } else {
    await dotenv.load(fileName: "assets/.env");
  }
  print('api: ${dotenv.env['BASE_API']}');
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
      final userJson = json.decode(userString);
      final user = UserModel.fromJson(userJson);
      if (!mounted) return SignIn();
      final userProvider = Provider.of<UserProvider>(
        context,
        listen: false,
      );
      await userProvider.setUser(
        user,
        token,
      ); // phục hồi lại trạng thái
      final socketService = SocketService();
      socketService.connect(user.id);
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
          return MaterialApp(
            navigatorKey: navigatorKey,
            home: Scaffold(
              body: SafeArea(
                child: Center(
                  child: Column(
                    mainAxisAlignment:
                        MainAxisAlignment.center,
                    crossAxisAlignment:
                        CrossAxisAlignment.center,
                    children: [
                      Image.asset(
                        'assets/logo.png',
                        width: 300,
                        height: 300,
                      ),
                      SizedBox(height: 16),
                      CircularProgressIndicator(),
                      SizedBox(height: 16),
                      Text('Kiểm tra đăng nhập...'),
                    ],
                  ),
                ),
              ),
            ),
          );
        } else {
          return MaterialApp(
            home: snapshot.data,
            onGenerateRoute: AppRoute.generateRoute,
            debugShowCheckedModeBanner: false,
            navigatorKey: navigatorKey,
          );
        }
      },
    );
  }
}
