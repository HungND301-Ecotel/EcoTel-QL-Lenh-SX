import 'package:soft/services/api_service.dart';

class DeviceTypeService {
  final ApiService _apiService =
      ApiService(); // sử dụng chung ApiService

  Future<Map<String, dynamic>> getAll() async {
    return await _apiService.get('/deviceTypes');
  }

  Future<Map<String, dynamic>> getOne(String id) async {
    return await _apiService.get('/deviceTypes/$id');
  }
}
