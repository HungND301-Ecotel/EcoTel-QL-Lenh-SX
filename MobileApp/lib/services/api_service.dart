import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:soft/main.dart';
import 'package:soft/providers/user_provider.dart';
import 'package:soft/routes/app_routes.dart';

class NetworkFailure {
  final String code; // 'timeout' | 'network'
  final String message;
  final String? url;
  const NetworkFailure(
      {required this.code,
      required this.message,
      this.url});
}

class ApiService {
  static final ApiService _instance =
      ApiService._internal();
  factory ApiService() => _instance;

  static final ValueNotifier<String?> lastRequestUrl =
      ValueNotifier(null);
  static final ValueNotifier<NetworkFailure?>
      networkFailure = ValueNotifier(null);

  final Dio _dio;
  String? _token;

  ApiService._internal()
      : _dio = Dio(
          BaseOptions(
            baseUrl: dotenv.env[
                'BASE_API']!, // đảm bảo đã set prod https
            headers: {'Content-Type': 'application/json'},
            connectTimeout: const Duration(seconds: 12),
            receiveTimeout: const Duration(seconds: 12),
            sendTimeout: const Duration(seconds: 12),
            responseType: ResponseType.json,
            validateStatus: (s) =>
                s != null && s >= 200 && s < 600,
          ),
        ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          // Thêm token nếu có
          if (_token != null && _token!.isNotEmpty) {
            options.headers['Authorization'] =
                'Bearer $_token';
          }

          lastRequestUrl.value = options.uri.toString();
          return handler.next(options);
        },
        onResponse: (response, handler) {
          return handler.next(response);
        },
        onError: (DioException error, handler) {
          // Log lỗi ở đây nếu cần
          print("❌ Dio Error: ${error.message}");

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

  Map<String, dynamic> _err(DioException e) {
    // Phân loại lỗi để UI hiển thị đúng
    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.sendTimeout ||
        e.type == DioExceptionType.receiveTimeout) {
      networkFailure.value = NetworkFailure(
          code: 'timeout',
          message: 'Kết nối quá hạn. Vui lòng thử lại.',
          url: ApiService.lastRequestUrl.value);
      return {
        'status': 'error',
        'code': 'timeout',
        'message': 'Kết nối quá hạn. Vui lòng thử lại.',
      };
    }
    if (e.type == DioExceptionType.connectionError) {
      networkFailure.value = NetworkFailure(
          code: 'timeout',
          message:
              'Không thể kết nối mạng hoặc máy chủ đang không phản hồi. Thử lại sau.',
          url: ApiService.lastRequestUrl.value);
      return {
        'status': 'error',
        'code': 'network',
        'message':
            'Không thể kết nối mạng hoặc máy chủ đang không phản hồi. Thử lại sau.',
      };
    }
    if (e.response != null && e.response?.data is Map) {
      return Map<String, dynamic>.from(e.response!.data);
    }
    return {
      'status': 'error',
      'code': 'server',
      'message': e.message ?? 'Lỗi không xác định',
    };
  }

  // GET
  Future<dynamic> get(String endpoint,
      {Options? options}) async {
    try {
      final response =
          await _dio.get(endpoint, options: options);
      if (response.data['status'] != 'success') {
        throw Exception(response.data['message']);
      }
      return response.data;
    } on DioException catch (e) {
      return _err(e);
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
      return _err(e);
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
      return _err(e);
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
      return _err(e);
    } catch (e) {
      // Trường hợp lỗi không phải Dio
      return {'status': 'error', 'message': e.toString()};
    }
  }
}
