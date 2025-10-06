import 'dart:convert';
import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
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
import 'package:soft/services/notification_service.dart';
import 'package:soft/services/socket_service.dart';
import 'package:soft/services/user_service.dart';
import 'package:soft/widgets/network_gate.dart';

final GlobalKey<NavigatorState> navigatorKey =
    GlobalKey<NavigatorState>();

Future<void> _firebaseMessagingBackgroundHandler(
    RemoteMessage message) async {
  // Chỉ đăng ký handler này khi Firebase iOS đã cấu hình; tạm thời BỎ với iOS
  try {
    await Firebase.initializeApp();
  } catch (_) {}
  print(
      "Handling a background message: ${message.messageId}");
}

Future<void> _initFirebaseSafely() async {
  if (Platform.isAndroid) {
    // Android đã có google-services.json → ok
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(
        _firebaseMessagingBackgroundHandler);
  } else if (Platform.isIOS) {
    // CHƯA cấu hình iOS → KHÔNG initialize để tránh crash
    // Khi bạn đã có cấu hình iOS, thay thế bằng:
    // await Firebase.initializeApp(
    //   options: DefaultFirebaseOptions.ios, // nếu dùng flutterfire
    // );
    // FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  }
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  if (kReleaseMode) {
    await dotenv.load(fileName: "assets/.env.prod");
  } else {
    await dotenv.load(fileName: "assets/.env");
  }
  print('api: ${dotenv.env['BASE_API']}');

  await _initFirebaseSafely();

  // Init notification service CHỈ khi Android, hoặc khi iOS đã init Firebase
  if (Platform.isAndroid ||
      (Platform.isIOS && Firebase.apps.isNotEmpty)) {
    await NotificationService.init();
    NotificationService.listenFCM();
  }

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
    await Future.delayed(const Duration(seconds: 2));
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

      // Chỉ đụng FCM khi Firebase đã init (Android hoặc iOS đã cấu hình)
      if (Platform.isAndroid ||
          (Platform.isIOS && Firebase.apps.isNotEmpty)) {
        final fcmToken =
            await NotificationService.getToken();
        if (fcmToken != null) {
          await AuthService().saveToken(fcmToken);
          userProvider.saveTokenLocal(fcmToken);
        }
        NotificationService.listenTokenRefresh(
            (newToken) async {
          if (userProvider.user != null) {
            await AuthService().saveToken(newToken);
            userProvider.saveTokenLocal(newToken);
          }
        });
      }

      final socketService = SocketService();
      socketService.connect(user.id);
      socketService.notificationNotifier.addListener(() {
        final data =
            socketService.notificationNotifier.value;
        if (data != null) {
          print('📩 Notification nhận được: $data');
        }
      });
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
          final Widget screen = snapshot.data ?? SignIn();

          final Widget home = (screen is MyPage)
              ? NetworkGate(child: screen)
              : screen;
          return MaterialApp(
            home: home,
            onGenerateRoute: AppRoute.generateRoute,
            debugShowCheckedModeBanner: false,
            navigatorKey: navigatorKey,
          );
        }
      },
    );
  }
}
