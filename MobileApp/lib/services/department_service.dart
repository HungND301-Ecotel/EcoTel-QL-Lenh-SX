import 'package:soft/services/api_service.dart';

class DepartmentService {
  final ApiService _apiService =
      ApiService(); // sử dụng chung ApiService

  Future<Map<String, dynamic>> getAllDepartment() async {
    return await _apiService.get('/departments');
  }

  Future<Map<String, dynamic>> getById(String id) async {
    return await _apiService.get('/departments/$id');
  }
}
