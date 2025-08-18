import 'package:soft/services/api_service.dart';

class DeviceService {
  final ApiService _apiService =
      ApiService(); // sử dụng chung ApiService

  Future<Map<String, dynamic>> getAlldevice() async {
    return await _apiService.get('/devices');
  }

  Future<Map<String, dynamic>> getAllExcavator() async {
    return await _apiService.get('/devices/excavators/all');
  }

  Future<Map<String, dynamic>> getById(String id) async {
    return await _apiService.get('/devices/$id');
  }

  Future<Map<String, dynamic>> update(
    String id,
    Map<String, dynamic> data,
  ) async {
    return await _apiService.put('/devices/$id', data);
  }
}
