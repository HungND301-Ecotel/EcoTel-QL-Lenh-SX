import 'package:job_manager/services/api_service.dart';

class DeviceService {
  final ApiService _apiService =
      ApiService(); // sử dụng chung ApiService

  Future<Map<String, dynamic>> getAlldevice() async {
    return await _apiService.get(
      '/device/getAll',
    );
  }
}
