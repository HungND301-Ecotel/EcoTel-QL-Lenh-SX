import 'package:flutter/material.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  static final FlutterLocalNotificationsPlugin
  _localNotifications = FlutterLocalNotificationsPlugin();


  /// Khởi tạo notification (Android + iOS)
  static Future<void> init() async {
    const AndroidInitializationSettings initAndroid =
        AndroidInitializationSettings(
          '@mipmap/ic_launcher',
        );

    const DarwinInitializationSettings initIOS =
        DarwinInitializationSettings(
          requestAlertPermission: true,
          requestBadgePermission: true,
          requestSoundPermission: true,
        );

    const InitializationSettings initSettings =
        InitializationSettings(
          android: initAndroid,
          iOS: initIOS,
        );

    await _localNotifications.initialize(initSettings);

    NotificationSettings settings = await FirebaseMessaging
        .instance
        .requestPermission(
          alert: true,
          badge: true,
          sound: true,
        );
    debugPrint(
      '🔔 Notification permission: ${settings.authorizationStatus}',
    );
  }

  /// Hiện notification local (foreground)
  static Future<void> showNotification(
    RemoteMessage message,
  ) async {
    final notification = message.notification;
    if (notification == null) return;

    const AndroidNotificationDetails androidDetails =
        AndroidNotificationDetails(
          'default_channel',
          'General Notifications',
          channelDescription: 'Thông báo chung',
          importance: Importance.max,
          priority: Priority.high,
        );

    const NotificationDetails platformDetails =
        NotificationDetails(android: androidDetails);

    await _localNotifications.show(
      notification.hashCode,
      notification.title,
      notification.body,
      platformDetails,
    );
  }

  /// Lắng nghe FCM message
  static void listenFCM() {
    // Foreground
    FirebaseMessaging.onMessage.listen((
      RemoteMessage message,
    ) {
      showNotification(message);
    });

    // Khi user bấm vào noti (background mở app)
    FirebaseMessaging.onMessageOpenedApp.listen((
      RemoteMessage message,
    ) {
      debugPrint(
        "User tapped notification: ${message.data}",
      );
      // TODO: Navigate nếu cần
    });
  }

  /// Lấy token hiện tại
  static Future<String?> getToken() async {
    return await FirebaseMessaging.instance.getToken();
  }

  /// Lắng nghe refresh token
  static void listenTokenRefresh(
    Function(String) onRefresh,
  ) {
    FirebaseMessaging.instance.onTokenRefresh.listen((
      newToken,
    ) {
      debugPrint("🔄 Token refreshed: $newToken");
      onRefresh(
        newToken,
      ); // callback, không dùng Provider ở đây
    });
  }
}
