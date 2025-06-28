import 'package:soft/services/api_service.dart';

class AuthService {
  final ApiService _apiService =
      ApiService(); // sử dụng chung ApiService

  Future<Map<String, dynamic>> signin(
    String username,
    String password,
  ) async {
    return await _apiService.post('/auth/login', {
      'username': username,
      'password': password,
    });
  }

  Future<Map<String, dynamic>> changepass(
    String oldpass,
    String newpass,
    String repass,
  ) async {
    return await _apiService.put('/users/changepass', {
      'old_pass': oldpass,
      'newpass': newpass,
      'repass': repass,
    });
  }

  Future<Map<String, dynamic>> update(
    Map<String, dynamic> data,
  ) async {
    return await _apiService.put('/users/addphone', data);
  }

  Future<Map<String, dynamic>> getUser(String code) async {
    return await _apiService.get('/users/salaryCode/$code');
  }
}
