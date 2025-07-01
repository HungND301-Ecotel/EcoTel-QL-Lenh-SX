import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:soft/main.dart';
import 'package:soft/providers/user_provider.dart';
import 'package:soft/routes/app_routes.dart';

class ApiService {
  static final ApiService _instance =
      ApiService._internal();
  factory ApiService() => _instance;

  final Dio _dio;
  String? _token;

  ApiService._internal()
    : _dio = Dio(
        BaseOptions(
          baseUrl:
              "https://ecotel-ql-lenh-sx.onrender.com/api",
          headers: {'Content-Type': 'application/json'},
          connectTimeout: const Duration(
            seconds: 15,
          ), // ⬅️ tăng timeout lên 10s
          receiveTimeout: const Duration(
            seconds: 15,
          ), // ⬅️ nếu nhận dữ liệu chậm
          sendTimeout: const Duration(seconds: 15),
        ),
      ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          // Gắn lại base URL nếu cần
          if (!options.path.startsWith('http')) {
            options.path =
                _dio.options.baseUrl + options.path;
          }

          // Thêm token nếu có
          if (_token != null && _token!.isNotEmpty) {
            options.headers['Authorization'] =
                'Bearer $_token';
          }

          return handler.next(options);
        },
        onResponse: (response, handler) {
          return handler.next(response);
        },
        onError: (DioException error, handler) {
          // Log lỗi ở đây nếu cần
          print("❌ Dio Error: ${error.message}");
          print(error.response?.statusCode);
          if (error.response?.statusCode == 401) {
            Future.microtask(() async {
              final prefs =
                  await SharedPreferences.getInstance();
              await prefs.remove('user');
              await prefs.remove('token');

              // Lấy context để gọi Provider
              final context = navigatorKey.currentContext;
              if (context != null) {
                final userProvider =
                    Provider.of<UserProvider>(
                      context,
                      listen: false,
                    );
                await userProvider.clearUser();

                // Điều hướng về login (chỉ khi đang ở trang khác)
                Navigator.of(
                  context,
                ).pushNamedAndRemoveUntil(
                  AppRoute.signin,
                  (route) => false,
                );
              } else {
                print(
                  "⚠️ context null, không thể điều hướng",
                );
              }
            });
          }

          return handler.next(error);
        },
      ),
    );
  }

  // Cập nhật token
  void updateToken(String newToken) {
    _token = newToken;
  }

  // GET
  Future<dynamic> get(String endpoint) async {
    try {
      final response = await _dio.get(endpoint);
      if (response.data['status'] != 'success') {
        throw Exception(response.data['message']);
      }
      return response.data;
    } on DioException catch (e) {
      // Nếu có response từ server thì trả response.data, còn không thì trả message
      if (e.response != null && e.response?.data != null) {
        return e.response?.data;
      } else {
        return {
          'status': 'error',
          'message': e.message ?? 'Lỗi không xác định',
        };
      }
    } catch (e) {
      // Trường hợp lỗi không phải Dio
      return {'status': 'error', 'message': e.toString()};
    }
  }

  // POST
  Future<dynamic> post(
    String endpoint,
    dynamic data, {
    Options? options,
  }) async {
    try {
      final response = await _dio.post(
        endpoint,
        data: data,
        options: options,
      );
      return response.data;
    } on DioException catch (e) {
      // Nếu có response từ server thì trả response.data, còn không thì trả message
      if (e.response != null && e.response?.data != null) {
        return e.response?.data;
      } else {
        return {
          'status': 'error',
          'message': e.message ?? 'Lỗi không xác định',
        };
      }
    } catch (e) {
      return {'status': 'error', 'message': e.toString()};
    }
  }

  // PUT
  Future<dynamic> put(String endpoint, dynamic data) async {
    try {
      final response = await _dio.put(endpoint, data: data);
      if (response.data['status'] != 'success') {
        throw Exception(response.data['message']);
      }
      return response.data;
    } on DioException catch (e) {
      // Nếu có response từ server thì trả response.data, còn không thì trả message
      if (e.response != null && e.response?.data != null) {
        return e.response?.data;
      } else {
        return {
          'status': 'error',
          'message': e.message ?? 'Lỗi không xác định',
        };
      }
    } catch (e) {
      // Trường hợp lỗi không phải Dio
      return {'status': 'error', 'message': e.toString()};
    }
  }

  // DELETE
  Future<dynamic> delete(String endpoint) async {
    try {
      final response = await _dio.delete(endpoint);
      if (response.data['status'] != 'success') {
        throw Exception(response.data['message']);
      }
      return response.data;
    } on DioException catch (e) {
      // Nếu có response từ server thì trả response.data, còn không thì trả message
      if (e.response != null && e.response?.data != null) {
        return e.response?.data;
      } else {
        return {
          'status': 'error',
          'message': e.message ?? 'Lỗi không xác định',
        };
      }
    } catch (e) {
      // Trường hợp lỗi không phải Dio
      return {'status': 'error', 'message': e.toString()};
    }
  }
}
