import 'package:soft/services/api_service.dart';

class AuthService {
  final ApiService _apiService =
      ApiService(); // sử dụng chung ApiService

  Future<Map<String, dynamic>> signin(
    String username,
    String password,
  ) async {
    return await _apiService.post('/user/login', {
      'username': username,
      'password': password,
    });
  }

  Future<Map<String, dynamic>> changepass(
    String oldpass,
    String newpass,
    String repass,
  ) async {
    return await _apiService.put('/user/changepass', {
      'old_pass': oldpass,
      'newpass': newpass,
      'repass': repass,
    });
  }

  Future<Map<String, dynamic>> update(
    Map<String, dynamic> data,
  ) async {
    return await _apiService.put('/user/update', data);
  }
}
