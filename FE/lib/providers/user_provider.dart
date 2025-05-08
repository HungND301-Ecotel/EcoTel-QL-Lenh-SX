import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:job_manager/services/api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

class UserProvider extends ChangeNotifier {
  Map<String, dynamic>? _user;
  String? _token;

  Map<String, dynamic>? get user => _user;
  String? get token => _token;

  final apiService = ApiService();

  // Set thông tin user và token
  Future<void> setUser(
    Map<String, dynamic> user,
    String token,
  ) async {
    _user = user;
    _token = token;

    // Gọi cập nhật token cho ApiService
    ApiService().updateToken(token);
    // Lưu token vào SharedPreferences để sử dụng sau này
    SharedPreferences prefs =
        await SharedPreferences.getInstance();
    await prefs.setString('token', token);
    await prefs.setString('user', json.encode(user));
    notifyListeners();
  }

  // Lấy token từ SharedPreferences khi ứng dụng khởi động
  Future<void> loadToken() async {
    SharedPreferences prefs =
        await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final userString = prefs.getString('user');

    if (token != null && userString != null) {
      if (isTokenExpired(token)) {
        await clearUser(); // Token hết hạn → xóa user
      } else {
        _token = token;
        _user = json.decode(userString);

        ApiService().updateToken(token);
        notifyListeners();
      }
    }
  }

  // Xóa thông tin user và token khi token hết hạn
  Future<void> clearUser() async {
    _user = null;
    _token = null;
    SharedPreferences prefs =
        await SharedPreferences.getInstance();
    await prefs.remove(
      'user',
    ); // Xóa token khỏi SharedPreferences
    await prefs.remove('token');
    notifyListeners();
  }

  // Kiểm tra xem token có hết hạn không
  bool isTokenExpired(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return true;

      final payload = utf8.decode(
        base64Url.decode(base64Url.normalize(parts[1])),
      );
      final Map<String, dynamic> payloadMap = json.decode(
        payload,
      );

      final exp = payloadMap['exp'];
      if (exp == null) return true;

      final expiryDate =
          DateTime.fromMillisecondsSinceEpoch(exp * 1000);
      return DateTime.now().isAfter(
        expiryDate,
      ); // true nếu đã hết hạn
    } catch (e) {
      return true; // Token lỗi hoặc không hợp lệ thì coi như hết hạn
    }
  }
}
