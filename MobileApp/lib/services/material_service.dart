import 'package:soft/services/api_service.dart';

class MaterialService {
  final ApiService _apiService =
      ApiService(); // sử dụng chung ApiService

  Future<Map<String, dynamic>> getAllMaterial() async {
    return await _apiService.get('/materials');
  }

  Future<Map<String, dynamic>> getById(String id) async {
    return await _apiService.get('/materials/$id');
  }
}
