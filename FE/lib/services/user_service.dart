import 'package:job_manager/services/api_service.dart';

class AuthService {
  final ApiService _apiService =
      ApiService(); // sử dụng chung ApiService

  Future<Map<String, dynamic>> signin(
    String username,
    String password,
  ) async {
    final response = await _apiService.post('/user/login', {
      'username': username,
      'password': password,
    });
    if (response['status'] == 'success') {
      return {'success': response};
    } else {
      return {
        'error':
            response['message'] ??
            'Lỗi đăng nhập. Vui lòng thử lại',
      };
    }
  }

  Future<Map<String, dynamic>> changepass(
    String oldpass,
    String newpass,
    String repass,
  ) async {
    final response = await _apiService.put(
      '/user/changepass',
      {
        'old_pass': oldpass,
        'newpass': newpass,
        'repass': repass,
      },
    );
    if (response['status'] == 'success') {
      return {
        'success':
            response['message'] ??
            'Đổi mật khẩu thành công',
      };
    } else {
      return {
        'error':
            response['message'] ??
            'Lỗi đổi mật khẩu. VUi lòng thử lại',
      };
    }
  }

  Future<Map<String, dynamic>> update(
    Map<String, dynamic> data,
  ) async {
    final response = await _apiService.put(
      '/user/update',
      data,
    );
    if (response['status'] == 'success') {
      return {'success': response};
    } else {
      return {
        'error':
            response['message'] ??
            'Cập nhật thất bại. VUi lòng thử lại',
      };
    }
  }
}
