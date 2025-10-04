import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:firebase_core/firebase_core.dart';

class NotificationService {
  static final _localNotifications =
      FlutterLocalNotificationsPlugin();

  static Future<void> init() async {
    const initAndroid = AndroidInitializationSettings(
        '@mipmap/ic_launcher');
    const initIOS = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    const initSettings = InitializationSettings(
        android: initAndroid, iOS: initIOS);
    await _localNotifications.initialize(initSettings);

    // Chỉ gọi requestPermission của FCM nếu Firebase sẵn sàng
    if (Platform.isAndroid ||
        (Platform.isIOS && Firebase.apps.isNotEmpty)) {
      final settings = await FirebaseMessaging.instance
          .requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );
      debugPrint(
          '🔔 Notification permission: ${settings.authorizationStatus}');
    }
  }

  static Future<void> showNotification(
      RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null) return;
    const androidDetails = AndroidNotificationDetails(
      'default_channel',
      'General Notifications',
      channelDescription: 'Thông báo chung',
      importance: Importance.max,
      priority: Priority.high,
    );
    const details =
        NotificationDetails(android: androidDetails);
    await _localNotifications.show(
      notification.hashCode,
      notification.title,
      notification.body,
      details,
    );
  }

  static void listenFCM() {
    if (!(Platform.isAndroid ||
        (Platform.isIOS && Firebase.apps.isNotEmpty))) {
      return; // iOS chưa init Firebase → thoát
    }
    FirebaseMessaging.onMessage
        .listen((m) => showNotification(m));
    FirebaseMessaging.onMessageOpenedApp.listen((m) {
      debugPrint("User tapped notification: ${m.data}");
    });
  }

  static Future<String?> getToken() async {
    if (Platform.isAndroid ||
        (Platform.isIOS && Firebase.apps.isNotEmpty)) {
      return FirebaseMessaging.instance.getToken();
    }
    return null;
  }

  static void listenTokenRefresh(
      Function(String) onRefresh) {
    if (Platform.isAndroid ||
        (Platform.isIOS && Firebase.apps.isNotEmpty)) {
      FirebaseMessaging.instance.onTokenRefresh.listen((t) {
        debugPrint("🔄 Token refreshed: $t");
        onRefresh(t);
      });
    }
  }
}
