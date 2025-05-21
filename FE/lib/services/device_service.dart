import 'package:soft/services/api_service.dart';

class DeviceService {
  final ApiService _apiService =
      ApiService(); // sử dụng chung ApiService

  Future<Map<String, dynamic>> getAlldevice() async {
    return await _apiService.get('/device/getAll');
  }

  Future<Map<String, dynamic>> update(String id,Map<String, dynamic> data) async {
    return await _apiService.put('/device/update/$id',data);
  }
}
